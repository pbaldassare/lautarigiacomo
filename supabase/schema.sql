-- =====================================================================
-- Comunità Lautari · area riservata
-- Progetti, iniziative, eventi e collaborazioni modificabili dai collaboratori.
--
-- Chi può fare cosa:
--   * chiunque (anche senza login) legge solo i contenuti pubblicati;
--   * possono scrivere SOLO gli utenti la cui email è nella tabella
--     public.collaboratori: un account creato da altri non può modificare nulla.
-- =====================================================================

-- ---------- Collaboratori abilitati ----------
create table if not exists public.collaboratori (
  email      text primary key check (email = lower(email)),
  nome       text,
  ruolo      text not null default 'editor' check (ruolo in ('editor', 'admin')),
  creato_il  timestamptz not null default now()
);

alter table public.collaboratori enable row level security;

drop policy if exists "Un collaboratore vede il proprio profilo" on public.collaboratori;
create policy "Un collaboratore vede il proprio profilo"
  on public.collaboratori for select to authenticated
  using (email = lower(auth.jwt() ->> 'email'));

-- true se l'utente collegato è un collaboratore abilitato
create or replace function public.is_collaboratore()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.collaboratori c
    where c.email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_collaboratore() from public;
grant execute on function public.is_collaboratore() to anon, authenticated;

-- ---------- Contenuti ----------
create table if not exists public.iniziative (
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

create index if not exists iniziative_pubblicato_data on public.iniziative (pubblicato, data desc);

alter table public.iniziative enable row level security;

drop policy if exists "Tutti leggono i contenuti pubblicati" on public.iniziative;
create policy "Tutti leggono i contenuti pubblicati"
  on public.iniziative for select to anon, authenticated
  using (pubblicato or (select public.is_collaboratore()));

drop policy if exists "I collaboratori aggiungono contenuti" on public.iniziative;
create policy "I collaboratori aggiungono contenuti"
  on public.iniziative for insert to authenticated
  with check ((select public.is_collaboratore()));

drop policy if exists "I collaboratori modificano contenuti" on public.iniziative;
create policy "I collaboratori modificano contenuti"
  on public.iniziative for update to authenticated
  using ((select public.is_collaboratore()))
  with check ((select public.is_collaboratore()));

drop policy if exists "I collaboratori eliminano contenuti" on public.iniziative;
create policy "I collaboratori eliminano contenuti"
  on public.iniziative for delete to authenticated
  using ((select public.is_collaboratore()));

-- aggiorna automaticamente chi e quando ha modificato
create or replace function public.iniziative_aggiornata()
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

drop trigger if exists iniziative_aggiornata on public.iniziative;
create trigger iniziative_aggiornata
  before update on public.iniziative
  for each row execute function public.iniziative_aggiornata();

-- ---------- Immagini ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('immagini', 'immagini', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "I collaboratori caricano immagini" on storage.objects;
create policy "I collaboratori caricano immagini"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'immagini' and (select public.is_collaboratore()));

drop policy if exists "I collaboratori sostituiscono immagini" on storage.objects;
create policy "I collaboratori sostituiscono immagini"
  on storage.objects for update to authenticated
  using (bucket_id = 'immagini' and (select public.is_collaboratore()));

drop policy if exists "I collaboratori eliminano immagini" on storage.objects;
create policy "I collaboratori eliminano immagini"
  on storage.objects for delete to authenticated
  using (bucket_id = 'immagini' and (select public.is_collaboratore()));
