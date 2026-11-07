/*
 * Blog: elenco articoli, pagina articolo e ultimi articoli in home.
 * I contenuti stanno in contenuti/blog.json.
 */
(() => {
  "use strict";

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const slug = (s) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const data = (s) =>
    new Date(s + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  function minuti(a) {
    const testo = (a.testo || [])
      .map((b) => (typeof b === "string" ? b : b.titolo || b.citazione || (b.elenco || []).join(" ")))
      .join(" ");
    return Math.max(1, Math.round(testo.split(/\s+/).length / 200));
  }

  async function carica() {
    const r = await fetch("contenuti/blog.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("Blog non disponibile");
    const d = await r.json();
    return (d.articoli || [])
      .filter((a) => !a.bozza)
      .sort((a, b) => (b.data || "").localeCompare(a.data || "") || (b.inEvidenza ? 1 : 0) - (a.inEvidenza ? 1 : 0));
  }

  const meta = (a) =>
    `<span>${esc(data(a.data))}</span><span aria-hidden="true">·</span><span>${minuti(a)} min di lettura</span>`;

  function card(a) {
    return `<article class="icard pcard">
      <a class="icard__link" href="articolo.html?id=${encodeURIComponent(a.id)}">
        <div class="icard__img">
          ${a.immagine ? `<img src="${esc(a.immagine)}" alt="" loading="lazy">` : ""}
          <span class="tag tag--cat">${esc(a.categoria)}</span>
        </div>
        <div class="icard__body">
          <p class="pmeta">${meta(a)}</p>
          <h3>${esc(a.titolo)}</h3>
          <p>${esc(a.sommario)}</p>
          <span class="icard__more">Leggi l'articolo <svg class="ico"><use href="#i-arrow"/></svg></span>
        </div>
      </a>
    </article>`;
  }

  function featured(a) {
    return `<article class="pfeat">
      <a class="pfeat__link" href="articolo.html?id=${encodeURIComponent(a.id)}">
        <div class="pfeat__img">${a.immagine ? `<img src="${esc(a.immagine)}" alt="">` : ""}</div>
        <div class="pfeat__body">
          <span class="tag tag--cat">${esc(a.categoria)}</span>
          <h2>${esc(a.titolo)}</h2>
          <p>${esc(a.sommario)}</p>
          <p class="pmeta">${meta(a)}</p>
          <span class="btn btn--light">Leggi l'articolo <svg class="ico"><use href="#i-arrow"/></svg></span>
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
        if (b.citazione)
          return `<blockquote class="pquote"><p>${esc(b.citazione)}</p>${b.autore ? `<cite>${esc(b.autore)}</cite>` : ""}</blockquote>`;
        return "";
      })
      .join("");
  }

  const errore = (el) =>
    (el.innerHTML = `<p class="empty">Non riusciamo a caricare gli articoli in questo momento. Riprova tra poco.</p>`);

  /* ---------- Home: ultimi 3 articoli ---------- */
  const home = document.getElementById("ultimi-articoli");
  if (home) {
    carica()
      .then((art) => (home.innerHTML = art.slice(0, 3).map(card).join("")))
      .catch(() => errore(home));
  }

  /* ---------- Pagina Blog ---------- */
  const elenco = document.getElementById("elenco-articoli");
  if (elenco) {
    const filtri = document.getElementById("filtri-blog");
    const inEvidenza = document.getElementById("articolo-evidenza");
    carica()
      .then((art) => {
        if (!art.length) {
          elenco.innerHTML = `<div class="empty"><p><strong>Presto i primi articoli.</strong></p></div>`;
          return;
        }
        const primo = art.find((a) => a.inEvidenza) || art[0];
        inEvidenza.innerHTML = featured(primo);

        const categorie = [...new Set(art.map((a) => a.categoria))];
        const param = new URLSearchParams(location.search).get("categoria");
        let attiva = categorie.find((c) => slug(c) === param) || "tutti";

        filtri.innerHTML = ["tutti", ...categorie]
          .map(
            (c) => `<button type="button" class="filter" data-cat="${esc(c)}" aria-pressed="${c === attiva}">
              ${c === "tutti" ? "Tutti gli articoli" : esc(c)}</button>`
          )
          .join("");

        const render = () => {
          const lista = attiva === "tutti" ? art.filter((a) => a !== primo) : art.filter((a) => a.categoria === attiva);
          inEvidenza.hidden = attiva !== "tutti";
          elenco.innerHTML = lista.length
            ? lista.map(card).join("")
            : `<div class="empty"><p>Nessun altro articolo in questa categoria, per ora.</p></div>`;
          $$(".filter", filtri).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.cat === attiva)));
        };

        filtri.addEventListener("click", (e) => {
          const b = e.target.closest(".filter");
          if (!b) return;
          attiva = b.dataset.cat;
          history.replaceState(null, "", attiva === "tutti" ? location.pathname : `${location.pathname}?categoria=${slug(attiva)}`);
          render();
        });
        render();
      })
      .catch(() => errore(elenco));
  }

  /* ---------- Pagina articolo ---------- */
  const pagina = document.getElementById("articolo");
  if (pagina) {
    const id = new URLSearchParams(location.search).get("id");
    carica()
      .then((art) => {
        const a = art.find((x) => x.id === id);
        if (!a) {
          pagina.innerHTML = `<div class="wrap article__notfound"><h1>Articolo non trovato</h1><p>Forse è stato spostato.</p><a class="btn btn--ghost" href="blog.html">Torna al blog</a></div>`;
          return;
        }
        document.title = `${a.titolo} · Blog · Comunità Lautari`;
        const url = location.href;
        const share = encodeURIComponent(`${a.titolo} ${url}`);
        const altri = art.filter((x) => x.id !== a.id);
        const correlati = [...altri.filter((x) => x.categoria === a.categoria), ...altri.filter((x) => x.categoria !== a.categoria)].slice(0, 3);

        pagina.innerHTML = `
          <header class="article__head">
            <div class="wrap">
              <a class="crumb" href="blog.html"><svg class="ico"><use href="#i-back"/></svg> Blog</a>
              <p class="article__meta"><a class="tag tag--cat" href="blog.html?categoria=${slug(a.categoria)}">${esc(a.categoria)}</a> ${meta(a)}</p>
              <h1>${esc(a.titolo)}</h1>
              <p class="article__lead">${esc(a.sommario)}</p>
            </div>
          </header>
          <div class="wrap article__in">
            <div class="article__body">
              ${a.immagine ? `<img class="article__img" src="${esc(a.immagine)}" alt="">` : ""}
              ${corpo(a.testo)}
              <div class="share">
                <span>Condividi</span>
                <a class="share__btn" href="https://wa.me/?text=${share}" target="_blank" rel="noopener">WhatsApp</a>
                <a class="share__btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}" target="_blank" rel="noopener">Facebook</a>
                <button type="button" class="share__btn" id="copia-link"><svg class="ico"><use href="#i-copy"/></svg> Copia link</button>
              </div>
              <p class="byline">Scritto da <strong>${esc(a.autore || "Comunità Lautari")}</strong></p>
            </div>
            <aside class="article__aside">
              <div class="support">
                <p class="support__kicker"><svg class="ico"><use href="#i-heart"/></svg> Sostieni la Comunità</p>
                <p class="support__title">Con 40 € sostieni la giornata di un ragazzo in comunità</p>
                <button class="btn btn--dona btn--block" data-dona><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
              </div>
              <div class="asidehelp">
                <p><strong>Hai bisogno di aiuto?</strong></p>
                <p>Per te o per un tuo caro: chiamaci, il percorso è gratuito.</p>
                <a class="btn btn--ghost btn--block" href="tel:+390309918700"><svg class="ico"><use href="#i-phone"/></svg> 030 991 8700</a>
              </div>
            </aside>
          </div>
          ${correlati.length ? `<section class="related">
            <div class="wrap">
              <h2>Continua a leggere</h2>
              <div class="igrid">${correlati.map(card).join("")}</div>
            </div>
          </section>` : ""}`;

        document.getElementById("copia-link").addEventListener("click", async (e) => {
          const btn = e.currentTarget;
          let ok = true;
          try {
            await navigator.clipboard.writeText(url);
          } catch {
            ok = false;
          }
          btn.lastChild.textContent = ok ? " Link copiato" : " Copia dalla barra degli indirizzi";
          setTimeout(() => (btn.lastChild.textContent = " Copia link"), 1800);
        });
      })
      .catch(() => errore(pagina));
  }
})();
