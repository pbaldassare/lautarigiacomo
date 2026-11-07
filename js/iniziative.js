/*
 * Progetti, iniziative, eventi e collaborazioni.
 * I contenuti stanno in contenuti/iniziative.json: per aggiornare il sito
 * basta modificare quel file.
 */
(() => {
  "use strict";

  const TIPI = {
    progetto: { label: "Progetto", plurale: "Progetti" },
    iniziativa: { label: "Iniziativa", plurale: "Iniziative" },
    evento: { label: "Evento", plurale: "Eventi" },
    collaborazione: { label: "Collaborazione", plurale: "Collaborazioni" }
  };

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);
  const toDate = (s) => (s ? new Date(s + "T00:00:00") : null);
  const isFuturo = (v) => v.tipo === "evento" && toDate(v.data) >= oggi;

  function quando(v) {
    if (v.dataTesto) return v.dataTesto;
    const d = toDate(v.data);
    if (!d) return v.stato || "";
    const opts = v.tipo === "evento" ? { day: "numeric", month: "long", year: "numeric" } : { month: "long", year: "numeric" };
    let s = d.toLocaleDateString("it-IT", opts);
    if (v.tipo === "evento" && v.ora) s += ", ore " + v.ora;
    return s;
  }

  function ordina(voci) {
    const futuri = voci.filter(isFuturo).sort((a, b) => toDate(a.data) - toDate(b.data));
    const altri = voci
      .filter((v) => !isFuturo(v))
      .sort((a, b) => {
        if (!!b.inEvidenza !== !!a.inEvidenza) return b.inEvidenza ? 1 : -1;
        const da = toDate(a.data) || oggi;
        const db = toDate(b.data) || oggi;
        return db - da;
      });
    return [...futuri, ...altri];
  }

  function card(v) {
    const tipo = TIPI[v.tipo]?.label || "";
    const futuro = isFuturo(v);
    return `<article class="icard${futuro ? " icard--next" : ""}">
      <a class="icard__link" href="iniziativa.html?id=${encodeURIComponent(v.id)}">
        <div class="icard__img">
          ${v.immagine ? `<img src="${esc(v.immagine)}" alt="" loading="lazy">` : ""}
          <span class="tag tag--${esc(v.tipo)}">${esc(tipo)}</span>
        </div>
        <div class="icard__body">
          <p class="icard__when">${futuro ? '<svg class="ico"><use href="#i-calendar"/></svg> ' : ""}${esc(quando(v))}${v.luogo ? " · " + esc(v.luogo) : ""}</p>
          <h3>${esc(v.titolo)}</h3>
          <p>${esc(v.sommario)}</p>
          <span class="icard__more">Scopri di più <svg class="ico"><use href="#i-arrow"/></svg></span>
        </div>
      </a>
    </article>`;
  }

  function corpo(blocchi = []) {
    return blocchi
      .map((b) => {
        if (typeof b === "string") return `<p>${esc(b)}</p>`;
        if (b.titolo) return `<h2>${esc(b.titolo)}</h2>`;
        if (b.elenco) return `<ul>${b.elenco.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
        return "";
      })
      .join("");
  }

  async function carica() {
    // dal database se collegato, altrimenti da contenuti/iniziative.json (vedi js/dati.js)
    return ordina(await window.LautariDati.iniziative());
  }

  const errore = (el) =>
    (el.innerHTML = `<p class="empty">Non riusciamo a caricare i contenuti in questo momento. Riprova tra poco.</p>`);

  /* ---------- Home: ultime 3 ---------- */
  const ultime = document.getElementById("ultime");
  if (ultime) {
    carica()
      .then((voci) => (ultime.innerHTML = voci.slice(0, 3).map(card).join("")))
      .catch(() => errore(ultime));
  }

  /* ---------- Pagina Progetti e iniziative ---------- */
  const elenco = document.getElementById("elenco-iniziative");
  const filtri = document.getElementById("filtri");
  if (elenco && filtri) {
    carica()
      .then((voci) => {
        const params = new URLSearchParams(location.search);
        let attivo = TIPI[params.get("tipo")] ? params.get("tipo") : "tutti";

        const conta = (t) => (t === "tutti" ? voci.length : voci.filter((v) => v.tipo === t).length);
        filtri.innerHTML = ["tutti", ...Object.keys(TIPI)]
          .map(
            (t) => `<button type="button" class="filter" data-tipo="${t}" aria-pressed="${t === attivo}">
              ${t === "tutti" ? "Tutti" : TIPI[t].plurale} <span>${conta(t)}</span></button>`
          )
          .join("");

        const render = () => {
          const lista = attivo === "tutti" ? voci : voci.filter((v) => v.tipo === attivo);
          elenco.innerHTML = lista.length
            ? lista.map(card).join("")
            : `<div class="empty">
                <p><strong>Nessun ${TIPI[attivo].label.toLowerCase()} in programma al momento.</strong></p>
                <p>Segui la Comunità su <a href="https://www.facebook.com/comunita.lautari/" target="_blank" rel="noopener">Facebook</a> per restare aggiornato.</p>
              </div>`;
          $$(".filter", filtri).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tipo === attivo)));
        };

        filtri.addEventListener("click", (e) => {
          const b = e.target.closest(".filter");
          if (!b) return;
          attivo = b.dataset.tipo;
          const url = attivo === "tutti" ? location.pathname : `${location.pathname}?tipo=${attivo}`;
          history.replaceState(null, "", url);
          render();
        });
        render();
      })
      .catch(() => errore(elenco));
  }

  /* ---------- Pagina di dettaglio ---------- */
  const dettaglio = document.getElementById("dettaglio");
  if (dettaglio) {
    const id = new URLSearchParams(location.search).get("id");
    carica()
      .then((voci) => {
        const v = voci.find((x) => x.id === id);
        if (!v) {
          dettaglio.innerHTML = `<div class="wrap article__notfound"><h1>Contenuto non trovato</h1><p>Forse è stato spostato.</p><a class="btn btn--ghost" href="progetti.html">Tutti i progetti e le iniziative</a></div>`;
          return;
        }
        document.title = `${v.titolo} · Comunità Lautari`;
        const tipo = TIPI[v.tipo]?.label || "";
        const correlati = voci.filter((x) => x.id !== v.id && x.tipo === v.tipo).slice(0, 3);
        const altri = correlati.length ? correlati : voci.filter((x) => x.id !== v.id).slice(0, 3);
        dettaglio.innerHTML = `
          <header class="article__head">
            <div class="wrap">
              <a class="crumb" href="progetti.html?tipo=${esc(v.tipo)}"><svg class="ico"><use href="#i-back"/></svg> ${esc(TIPI[v.tipo]?.plurale || "Progetti e iniziative")}</a>
              <p class="article__meta"><span class="tag tag--${esc(v.tipo)}">${esc(tipo)}</span> ${esc(quando(v))}${v.luogo ? " · " + esc(v.luogo) : ""}</p>
              <h1>${esc(v.titolo)}</h1>
              <p class="article__lead">${esc(v.sommario)}</p>
            </div>
          </header>
          <div class="wrap article__in">
            <div class="article__body">
              ${v.immagine ? `<img class="article__img" src="${esc(v.immagine)}" alt="">` : ""}
              ${corpo(v.testo)}
              ${v.link && /^https?:\/\//.test(v.link.url) ? `<p><a class="btn btn--ghost" href="${esc(v.link.url)}" target="_blank" rel="noopener">${esc(v.link.testo)} <svg class="ico"><use href="#i-arrow"/></svg></a></p>` : ""}
            </div>
            <aside class="article__aside">
              <div class="support">
                <p class="support__kicker"><svg class="ico"><use href="#i-heart"/></svg> Sostieni la Comunità</p>
                <p class="support__title">${v.donazione ? `Aiutaci a far crescere ${esc(v.titolo)}` : "Con 40 € sostieni la giornata di un ragazzo in comunità"}</p>
                <button class="btn btn--dona btn--block" data-dona${v.donazione ? ` data-progetto="${esc(v.donazione)}"` : ""}><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
              </div>
            </aside>
          </div>
          <section class="related">
            <div class="wrap">
              <h2>Potrebbe interessarti anche</h2>
              <div class="igrid">${altri.map(card).join("")}</div>
            </div>
          </section>`;
      })
      .catch(() => errore(dettaglio));
  }

  function $$(s, el = document) {
    return [...el.querySelectorAll(s)];
  }
})();
