-- =====================================================================
-- Comunità Lautari · area riservata
-- Progetti, iniziative, eventi e collaborazioni modificabili dai collaboratori.
--
-- Tutti i nomi hanno il prefisso lautari_ (e lo spazio foto si chiama
-- lautari-immagini) perché il progetto Supabase è condiviso con altre app.
--
-- Chi può fare cosa:
--   * chiunque (anche senza login) legge solo i contenuti pubblicati;
--   * possono scrivere SOLO gli utenti la cui email è nella tabella
--     public.lautari_collaboratori: un account creato da altri, anche di
--     altre app dello stesso progetto, non può modificare nulla.
-- =====================================================================

-- ---------- Collaboratori abilitati ----------
create table if not exists public.lautari_collaboratori (
  email      text primary key check (email = lower(email)),
  nome       text,
  ruolo      text not null default 'editor' check (ruolo in ('editor', 'admin')),
  creato_il  timestamptz not null default now()
);

alter table public.lautari_collaboratori enable row level security;

drop policy if exists "Un collaboratore vede il proprio profilo" on public.lautari_collaboratori;
create policy "Un collaboratore vede il proprio profilo"
  on public.lautari_collaboratori for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

-- true se l'utente collegato è un collaboratore abilitato.
-- Sta in uno schema privato, non raggiungibile dalle API pubbliche.
create schema if not exists lautari_private;
revoke all on schema lautari_private from public;
grant usage on schema lautari_private to anon, authenticated;

create or replace function lautari_private.is_collaboratore()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.lautari_collaboratori c
    where c.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function lautari_private.is_collaboratore() from public;
grant execute on function lautari_private.is_collaboratore() to anon, authenticated;

-- ---------- Contenuti ----------
create table if not exists public.lautari_iniziative (
  id             text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(id) <= 80),
  tipo           text not null check (tipo in ('progetto', 'iniziativa', 'evento', 'collaborazione')),
  titolo         text not null check (char_length(titolo) between 3 and 160),
  sommario       text not null check (char_length(sommario) between 10 and 400),
  immagine       text check (immagine is null or immagine ~ '^https://'),
  data           date,
  data_testo     text check (char_length(data_testo) <= 40),
  ora            text check (char_length(ora) <= 20),
  luogo          text check (char_length(luogo) <= 120),
  stato          text check (char_length(stato) <= 40),
  in_evidenza    boolean not null default false,
  testo          jsonb not null default '[]'::jsonb check (jsonb_typeof(testo) = 'array'),
  link           jsonb check (link is null or (jsonb_typeof(link) = 'object' and link ->> 'url' ~ '^https?://')),
  donazione      text,
  pubblicato     boolean not null default true,
  creato_da      text default lower(auth.jwt() ->> 'email'),
  creato_il      timestamptz not null default now(),
  aggiornato_da  text,
  aggiornato_il  timestamptz not null default now()
);

create index if not exists lautari_iniziative_pubblicato_data on public.lautari_iniziative (pubblicato, data desc);

alter table public.lautari_iniziative enable row level security;

drop policy if exists "Tutti leggono i contenuti pubblicati" on public.lautari_iniziative;
create policy "Tutti leggono i contenuti pubblicati"
  on public.lautari_iniziative for select to anon, authenticated
  using (pubblicato or (select lautari_private.is_collaboratore()));

drop policy if exists "I collaboratori aggiungono contenuti" on public.lautari_iniziative;
create policy "I collaboratori aggiungono contenuti"
  on public.lautari_iniziative for insert to authenticated
  with check ((select lautari_private.is_collaboratore()));

drop policy if exists "I collaboratori modificano contenuti" on public.lautari_iniziative;
create policy "I collaboratori modificano contenuti"
  on public.lautari_iniziative for update to authenticated
  using ((select lautari_private.is_collaboratore()))
  with check ((select lautari_private.is_collaboratore()));

drop policy if exists "I collaboratori eliminano contenuti" on public.lautari_iniziative;
create policy "I collaboratori eliminano contenuti"
  on public.lautari_iniziative for delete to authenticated
  using ((select lautari_private.is_collaboratore()));

-- aggiorna automaticamente chi e quando ha modificato
create or replace function public.lautari_iniziative_aggiornata()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.aggiornato_il := now();
  new.aggiornato_da := lower(auth.jwt() ->> 'email');
  return new;
end;
$$;

drop trigger if exists lautari_iniziative_aggiornata on public.lautari_iniziative;
create trigger lautari_iniziative_aggiornata
  before update on public.lautari_iniziative
  for each row execute function public.lautari_iniziative_aggiornata();

-- ---------- Immagini ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('lautari-immagini', 'lautari-immagini', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Lautari: i collaboratori caricano immagini" on storage.objects;
create policy "Lautari: i collaboratori caricano immagini"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'lautari-immagini' and (select lautari_private.is_collaboratore()));

drop policy if exists "Lautari: i collaboratori sostituiscono immagini" on storage.objects;
create policy "Lautari: i collaboratori sostituiscono immagini"
  on storage.objects for update to authenticated
  using (bucket_id = 'lautari-immagini' and (select lautari_private.is_collaboratore()));

drop policy if exists "Lautari: i collaboratori eliminano immagini" on storage.objects;
create policy "Lautari: i collaboratori eliminano immagini"
  on storage.objects for delete to authenticated
  using (bucket_id = 'lautari-immagini' and (select lautari_private.is_collaboratore()));
