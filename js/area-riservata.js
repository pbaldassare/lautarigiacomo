/*
 * Area riservata: accesso dei collaboratori e gestione di progetti,
 * iniziative, eventi e collaborazioni (tabella public.iniziative su Supabase).
 * I permessi veri sono nel database (supabase/schema.sql): questa pagina
 * mostra o nasconde le funzioni, ma non è lei a proteggere i dati.
 */
(() => {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const DB = window.LAUTARI_DB || {};
  const TIPI = { evento: "Evento", progetto: "Progetto", iniziativa: "Iniziativa", collaborazione: "Collaborazione" };
  const VISTE = ["config", "login", "password", "negato", "pannello", "editor"];

  function mostra(vista) {
    VISTE.forEach((v) => ($(`#vista-${v}`).hidden = v !== vista));
    window.scrollTo(0, 0);
    const h = $(`#vista-${vista} h1`);
    if (h) {
      h.setAttribute("tabindex", "-1");
      h.focus({ preventScroll: true });
    }
  }

  function messaggio(el, testo, tipo = "errore") {
    el.textContent = testo || "";
    el.className = `formmsg${testo ? ` formmsg--${tipo}` : ""}`;
  }

  if (!DB.url || !DB.anonKey || !window.supabase) {
    mostra("config");
    return;
  }

  const sb = window.supabase.createClient(DB.url, DB.anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  });

  let utente = null;
  let profilo = null;
  let contenuti = [];
  let filtro = "tutti";
  let inModifica = null; // id del contenuto aperto nell'editor, null se nuovo

  /* ================= Accesso ================= */

  $$("[data-mostra]").forEach((b) =>
    b.addEventListener("click", () => {
      const input = document.getElementById(b.dataset.mostra);
      const visibile = input.type === "text";
      input.type = visibile ? "password" : "text";
      b.textContent = visibile ? "Mostra" : "Nascondi";
      b.setAttribute("aria-label", visibile ? "Mostra la password" : "Nascondi la password");
    })
  );

  $("#form-login").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#login-msg");
    const email = $("#login-email").value.trim().toLowerCase();
    const password = $("#login-password").value;
    if (!email || !password) return messaggio(msg, "Inserisci email e password.");
    const btn = $("#login-btn");
    btn.disabled = true;
    btn.textContent = "Accesso in corso…";
    const { error } = await sb.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.textContent = "Accedi";
    if (error) {
      messaggio(msg, error.status === 400 ? "Email o password non corretti." : "Accesso non riuscito. Riprova tra poco.");
      return;
    }
    messaggio(msg, "");
    $("#login-password").value = "";
  });

  $("#btn-dimenticata").addEventListener("click", async () => {
    const msg = $("#login-msg");
    const email = $("#login-email").value.trim().toLowerCase();
    if (!email) {
      messaggio(msg, "Scrivi la tua email qui sopra, poi premi di nuovo «Password dimenticata?».");
      $("#login-email").focus();
      return;
    }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    // Stesso messaggio in ogni caso: non riveliamo quali email esistono
    messaggio(msg, error && error.status === 429
      ? "Troppe richieste: riprova tra qualche minuto."
      : "Se l'email è registrata, riceverai a breve un link per impostare una nuova password.", error && error.status === 429 ? "errore" : "ok");
  });

  $("#form-password").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#password-msg");
    const p1 = $("#nuova-password").value;
    const p2 = $("#nuova-password-2").value;
    if (p1.length < 10) return messaggio(msg, "La password deve avere almeno 10 caratteri.");
    if (p1 !== p2) return messaggio(msg, "Le due password non coincidono.");
    const { error } = await sb.auth.updateUser({ password: p1 });
    if (error) return messaggio(msg, "Non è stato possibile salvare la password. Riprova.");
    $("#nuova-password").value = $("#nuova-password-2").value = "";
    messaggio(msg, "");
    await entra();
  });

  $("#annulla-password").addEventListener("click", () => mostra("pannello"));
  $("#btn-cambia-password").addEventListener("click", () => {
    $("#annulla-password").hidden = false;
    messaggio($("#password-msg"), "");
    mostra("password");
  });

  $$("[data-esci]").forEach((b) => b.addEventListener("click", () => sb.auth.signOut()));

  async function entra() {
    const { data } = await sb.auth.getUser();
    utente = data.user;
    if (!utente) return mostra("login");
    const email = (utente.email || "").toLowerCase();
    const { data: righe, error } = await sb.from("collaboratori").select("email, nome, ruolo").eq("email", email).limit(1);
    profilo = !error && righe && righe[0];
    if (!profilo) {
      $("#negato-email").textContent = email;
      return mostra("negato");
    }
    $("#utente-nome").textContent = profilo.nome || email;
    await caricaElenco();
    mostra("pannello");
  }

  sb.auth.onAuthStateChange((evento, sessione) => {
    if (evento === "PASSWORD_RECOVERY") {
      $("#annulla-password").hidden = true;
      return mostra("password");
    }
    if (evento === "SIGNED_OUT") {
      utente = profilo = null;
      return mostra("login");
    }
    if (evento === "SIGNED_IN" && sessione && !utente) entra();
  });

  // Avvio: chi arriva da un invito o da un link di recupero imposta subito la password
  (async () => {
    const tipoLink = new URLSearchParams(location.hash.slice(1)).get("type");
    const { data } = await sb.auth.getSession();
    if (data.session && (tipoLink === "invite" || tipoLink === "recovery")) {
      $("#annulla-password").hidden = true;
      return mostra("password");
    }
    if (data.session) return entra();
    mostra("login");
  })();

  /* ================= Elenco ================= */

  async function caricaElenco() {
    const { data, error } = await sb
      .from("iniziative")
      .select("id, tipo, titolo, data, data_testo, pubblicato, in_evidenza, aggiornato_il, aggiornato_da, creato_da")
      .order("aggiornato_il", { ascending: false });
    contenuti = error ? [] : data;
    if (error) $("#elenco-area").innerHTML = `<li class="empty">Non riusciamo a caricare i contenuti. Ricarica la pagina.</li>`;
    else disegnaElenco();
  }

  function disegnaFiltri() {
    const conta = (t) => (t === "tutti" ? contenuti.length : contenuti.filter((c) => c.tipo === t).length);
    $("#filtri-area").innerHTML = ["tutti", ...Object.keys(TIPI)]
      .map((t) => `<button type="button" class="filter" data-tipo="${t}" aria-pressed="${t === filtro}">${t === "tutti" ? "Tutti" : TIPI[t]} <span>${conta(t)}</span></button>`)
      .join("");
  }

  function quando(c) {
    if (c.data_testo) return c.data_testo;
    if (!c.data) return "Senza data";
    return new Date(c.data + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  }

  function disegnaElenco() {
    disegnaFiltri();
    const q = $("#cerca").value.trim().toLowerCase();
    const lista = contenuti.filter((c) => (filtro === "tutti" || c.tipo === filtro) && (!q || c.titolo.toLowerCase().includes(q)));
    $("#elenco-area").innerHTML = lista.length
      ? lista
          .map(
            (c) => `<li class="dash__item">
              <span class="tag tag--${esc(c.tipo)}">${esc(TIPI[c.tipo] || c.tipo)}</span>
              <div class="dash__info">
                <strong>${esc(c.titolo)}</strong>
                <span>${esc(quando(c))}${c.in_evidenza ? " · In evidenza" : ""} · modificato ${esc(new Date(c.aggiornato_il).toLocaleDateString("it-IT"))}${c.aggiornato_da || c.creato_da ? " da " + esc(c.aggiornato_da || c.creato_da) : ""}</span>
              </div>
              <span class="stato ${c.pubblicato ? "stato--on" : "stato--off"}">${c.pubblicato ? "Pubblicato" : "Bozza"}</span>
              <button type="button" class="btn btn--ghost dash__edit" data-apri="${esc(c.id)}">Modifica</button>
            </li>`
          )
          .join("")
      : `<li class="empty">${contenuti.length ? "Nessun contenuto corrisponde alla ricerca." : "Non ci sono ancora contenuti. Premi «Nuovo contenuto» per iniziare."}</li>`;
  }

  $("#filtri-area").addEventListener("click", (e) => {
    const b = e.target.closest(".filter");
    if (!b) return;
    filtro = b.dataset.tipo;
    disegnaElenco();
  });
  $("#cerca").addEventListener("input", disegnaElenco);
  $("#elenco-area").addEventListener("click", (e) => {
    const b = e.target.closest("[data-apri]");
    if (b) apriEditor(b.dataset.apri);
  });
  $("#btn-nuovo").addEventListener("click", () => apriEditor(null));
  $("#torna-elenco").addEventListener("click", async () => {
    await caricaElenco();
    mostra("pannello");
  });

  /* ================= Editor ================= */

  const slug = (s) =>
    s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 80).replace(/-$/, "");

  // Testo semplice ⇄ blocchi della pagina
  function daBlocchi(blocchi = []) {
    return blocchi
      .map((b) => {
        if (typeof b === "string") return b;
        if (b.titolo) return `## ${b.titolo}`;
        if (b.elenco) return b.elenco.map((x) => `- ${x}`).join("\n");
        if (b.citazione) return `> ${b.citazione}`;
        return "";
      })
      .filter(Boolean)
      .join("\n\n");
  }

  function aBlocchi(testo) {
    const blocchi = [];
    testo
      .replace(/\r/g, "")
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean)
      .forEach((pezzo) => {
        const righe = pezzo.split("\n").map((r) => r.trim()).filter(Boolean);
        if (righe[0].startsWith("## ")) {
          blocchi.push({ titolo: righe.shift().slice(3).trim() });
          if (!righe.length) return;
        }
        if (righe.every((r) => /^[-•*]\s+/.test(r))) {
          blocchi.push({ elenco: righe.map((r) => r.replace(/^[-•*]\s+/, "")) });
        } else if (righe[0].startsWith("> ")) {
          blocchi.push({ citazione: righe.join(" ").replace(/^>\s*/, "") });
        } else {
          blocchi.push(righe.join(" "));
        }
      });
    return blocchi;
  }

  const sel = $("#f-donazione");
  sel.innerHTML = `<option value="">Dove serve di più</option>` +
    ((window.DONAZIONI && window.DONAZIONI.progetti) || [])
      .filter((p) => p.id !== "generale")
      .map((p) => `<option value="${esc(p.id)}">${esc(p.nome)}</option>`)
      .join("");

  function anteprima(url) {
    $("#img-prev").innerHTML = url && /^https:\/\//.test(url) ? `<img src="${esc(url)}" alt="Anteprima della foto">` : "<span>Nessuna foto</span>";
  }

  function aggiornaTipo() {
    const tipo = $('input[name="tipo"]:checked').value;
    $("#campo-ora").hidden = tipo !== "evento";
  }
  $$('input[name="tipo"]').forEach((r) => r.addEventListener("change", aggiornaTipo));

  let idToccato = false;
  $("#f-titolo").addEventListener("input", () => {
    if (!inModifica && !idToccato) $("#f-id").value = slug($("#f-titolo").value);
  });
  $("#f-id").addEventListener("input", () => {
    idToccato = true;
  });
  $("#f-sommario").addEventListener("input", () => ($("#conta-sommario").textContent = `${$("#f-sommario").value.length}/400`));
  $("#f-immagine").addEventListener("change", () => anteprima($("#f-immagine").value.trim()));

  async function apriEditor(id) {
    inModifica = id;
    idToccato = false;
    messaggio($("#editor-msg"), "");
    $("#form-editor").reset();
    let c = { tipo: "evento", pubblicato: true, testo: [] };
    if (id) {
      const { data, error } = await sb.from("iniziative").select("*").eq("id", id).single();
      if (error || !data) return alert("Impossibile aprire questo contenuto.");
      c = data;
    }
    $("#editor-titolo").textContent = id ? "Modifica contenuto" : "Nuovo contenuto";
    $$('input[name="tipo"]').forEach((r) => (r.checked = r.value === c.tipo));
    $("#f-titolo").value = c.titolo || "";
    $("#f-id").value = c.id || "";
    $("#f-id").readOnly = !!id;
    $("#f-sommario").value = c.sommario || "";
    $("#conta-sommario").textContent = `${(c.sommario || "").length}/400`;
    $("#f-testo").value = daBlocchi(c.testo);
    $("#f-data").value = c.data || "";
    $("#f-ora").value = c.ora || "";
    $("#f-luogo").value = c.luogo || "";
    $("#f-stato").value = c.stato || "";
    $("#f-data-testo").value = c.data_testo || "";
    $("#f-link-testo").value = (c.link && c.link.testo) || "";
    $("#f-link-url").value = (c.link && c.link.url) || "";
    $("#f-donazione").value = c.donazione || "";
    $("#f-immagine").value = c.immagine || "";
    $("#f-pubblicato").checked = c.pubblicato !== false;
    $("#f-evidenza").checked = !!c.in_evidenza;
    anteprima(c.immagine);
    aggiornaTipo();
    $("#btn-elimina").hidden = !id;
    $("#btn-vedi").hidden = !id || !c.pubblicato;
    $("#btn-vedi").href = id ? `iniziativa.html?id=${encodeURIComponent(id)}` : "#";
    $("#editor-meta").textContent = id
      ? `Creato da ${c.creato_da || "—"} il ${new Date(c.creato_il).toLocaleDateString("it-IT")}${c.aggiornato_da ? ` · ultima modifica di ${c.aggiornato_da}` : ""}`
      : "";
    mostra("editor");
  }

  /* Caricamento foto */
  $("#f-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const msg = $("#editor-msg");
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return messaggio(msg, "Formato non supportato: usa JPG, PNG o WebP.");
    if (file.size > 5 * 1024 * 1024) return messaggio(msg, "La foto supera i 5 MB: riducila e riprova.");
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" }[file.type];
    const nome = `iniziative/${Date.now()}-${slug($("#f-titolo").value) || "foto"}.${ext}`;
    messaggio(msg, "Caricamento della foto…", "info");
    const { error } = await sb.storage.from("immagini").upload(nome, file, { contentType: file.type, upsert: false });
    e.target.value = "";
    if (error) return messaggio(msg, "Caricamento non riuscito. Riprova.");
    const { data } = sb.storage.from("immagini").getPublicUrl(nome);
    $("#f-immagine").value = data.publicUrl;
    anteprima(data.publicUrl);
    messaggio(msg, "Foto caricata. Ricordati di salvare.", "ok");
  });

  /* Salvataggio */
  $("#form-editor").addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = $("#editor-msg");
    const titolo = $("#f-titolo").value.trim();
    const id = $("#f-id").value.trim();
    const sommario = $("#f-sommario").value.trim();
    const immagine = $("#f-immagine").value.trim();
    const linkUrl = $("#f-link-url").value.trim();
    const linkTesto = $("#f-link-testo").value.trim();

    if (titolo.length < 3) return messaggio(msg, "Scrivi un titolo di almeno 3 caratteri."), $("#f-titolo").focus();
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) return messaggio(msg, "L'indirizzo della pagina può contenere solo lettere minuscole, numeri e trattini."), $("#f-id").focus();
    if (sommario.length < 10) return messaggio(msg, "Scrivi un riassunto di almeno 10 caratteri."), $("#f-sommario").focus();
    if (immagine && !/^https:\/\//.test(immagine)) return messaggio(msg, "L'indirizzo della foto deve iniziare con https://"), $("#f-immagine").focus();
    if (linkUrl && !/^https?:\/\//.test(linkUrl)) return messaggio(msg, "L'indirizzo del link deve iniziare con https://"), $("#f-link-url").focus();

    const riga = {
      id,
      tipo: $('input[name="tipo"]:checked').value,
      titolo,
      sommario,
      immagine: immagine || null,
      data: $("#f-data").value || null,
      ora: $("#f-ora").value.trim() || null,
      luogo: $("#f-luogo").value.trim() || null,
      stato: $("#f-stato").value.trim() || null,
      data_testo: $("#f-data-testo").value.trim() || null,
      testo: aBlocchi($("#f-testo").value),
      link: linkUrl ? { testo: linkTesto || "Scopri di più", url: linkUrl } : null,
      donazione: $("#f-donazione").value || null,
      pubblicato: $("#f-pubblicato").checked,
      in_evidenza: $("#f-evidenza").checked
    };
    if (riga.tipo !== "evento") riga.ora = null;

    const btn = $("#btn-salva");
    btn.disabled = true;
    btn.textContent = "Salvataggio…";
    const { error } = inModifica
      ? await sb.from("iniziative").update(riga).eq("id", inModifica)
      : await sb.from("iniziative").insert(riga);
    btn.disabled = false;
    btn.textContent = "Salva";

    if (error) {
      if (error.code === "23505") return messaggio(msg, "Esiste già un contenuto con questo indirizzo: cambialo.");
      if (error.code === "42501") return messaggio(msg, "Il tuo account non ha il permesso di salvare.");
      return messaggio(msg, "Salvataggio non riuscito. Controlla i campi e riprova.");
    }
    inModifica = id;
    $("#f-id").readOnly = true;
    $("#btn-elimina").hidden = false;
    $("#btn-vedi").hidden = !riga.pubblicato;
    $("#btn-vedi").href = `iniziativa.html?id=${encodeURIComponent(id)}`;
    $("#editor-titolo").textContent = "Modifica contenuto";
    messaggio(msg, riga.pubblicato ? "Salvato e pubblicato sul sito." : "Salvato come bozza.", "ok");
  });

  /* Eliminazione */
  $("#btn-elimina").addEventListener("click", async () => {
    if (!inModifica) return;
    const titolo = $("#f-titolo").value.trim();
    if (!confirm(`Eliminare definitivamente «${titolo}»? Sparirà dal sito e non si potrà recuperare.\n\nSe vuoi solo nasconderlo, togli la spunta «Pubblicato sul sito» e salva.`)) return;
    const { error } = await sb.from("iniziative").delete().eq("id", inModifica);
    if (error) return messaggio($("#editor-msg"), "Eliminazione non riuscita.");
    await caricaElenco();
    mostra("pannello");
  });
})();
