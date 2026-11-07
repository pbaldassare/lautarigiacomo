/*
 * Pagina Media e comunicazione: campagne ed eventi (da contenuti/iniziative.json),
 * rassegna stampa, canali social e materiali (da contenuti/comunicazione.json).
 */
(() => {
  "use strict";

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const okUrl = (u) => /^https?:\/\//.test(u || "");
  const dataLunga = (s) => new Date(s + "T00:00:00").toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const $ = (s) => document.querySelector(s);

  const ICONE = { facebook: "i-facebook", instagram: "i-instagram", youtube: "i-youtube", tiktok: "i-tiktok" };
  const TIPI = { evento: "Evento", iniziativa: "Campagna" };

  async function json(url) {
    const r = await fetch(url, { cache: "no-cache" });
    if (!r.ok) throw new Error(url);
    return r.json();
  }

  function campagna(v) {
    const quando = v.dataTesto || (v.data ? dataLunga(v.data) : v.stato || "");
    return `<article class="camp">
      <a class="camp__link" href="iniziativa.html?id=${encodeURIComponent(v.id)}">
        <div class="camp__img">${v.immagine ? `<img src="${esc(v.immagine)}" alt="" loading="lazy">` : ""}</div>
        <div class="camp__body">
          <p class="camp__meta"><span class="tag tag--${esc(v.tipo)}">${esc(TIPI[v.tipo] || v.tipo)}</span> ${esc(quando)}</p>
          <h3>${esc(v.titolo)}</h3>
          <p>${esc(v.sommario)}</p>
          <span class="icard__more">Scopri di più <svg class="ico"><use href="#i-arrow"/></svg></span>
        </div>
      </a>
    </article>`;
  }

  function articolo(a) {
    return `<li class="press">
      <div class="press__meta">
        <strong class="press__testata">${esc(a.testata)}</strong>
        <span>${a.data ? esc(dataLunga(a.data)) : "Data non indicata"}</span>
        ${a.tipo ? `<span class="press__tipo">${esc(a.tipo)}</span>` : ""}
      </div>
      <div class="press__body">
        <h3>${okUrl(a.url) ? `<a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.titolo)}</a>` : esc(a.titolo)}</h3>
        ${a.sintesi ? `<p>${esc(a.sintesi)}</p>` : ""}
      </div>
      ${okUrl(a.url) ? `<a class="press__go" href="${esc(a.url)}" target="_blank" rel="noopener" aria-label="Leggi su ${esc(a.testata)}"><svg class="ico"><use href="#i-external"/></svg></a>` : ""}
    </li>`;
  }

  /* Campagne ed eventi */
  const campEl = $("#campagne");
  if (campEl) {
    json("contenuti/iniziative.json")
      .then((d) => {
        const voci = (d.voci || [])
          .filter((v) => v.tipo === "evento" || v.tipo === "iniziativa")
          .sort((a, b) => (b.data || "").localeCompare(a.data || ""))
          .slice(0, 4);
        campEl.innerHTML = voci.map(campagna).join("");
      })
      .catch(() => (campEl.innerHTML = `<p class="empty">Non riusciamo a caricare le campagne in questo momento.</p>`));
  }

  /* Stampa, social, materiali */
  const stampaEl = $("#rassegna");
  if (stampaEl) {
    json("contenuti/comunicazione.json")
      .then((d) => {
        const stampa = (d.stampa || []).slice().sort((a, b) => (b.data || "0").localeCompare(a.data || "0"));

        // Testate che hanno parlato di noi
        const testate = [...new Set(stampa.map((a) => a.testata))];
        const strip = $("#testate");
        if (strip) strip.innerHTML = testate.map((t) => `<li>${esc(t)}</li>`).join("");

        // Rassegna raggruppata per anno
        const perAnno = {};
        stampa.forEach((a) => {
          const anno = a.data ? a.data.slice(0, 4) : "Senza data";
          (perAnno[anno] = perAnno[anno] || []).push(a);
        });
        stampaEl.innerHTML = Object.keys(perAnno)
          .sort((a, b) => (b === "Senza data" ? -1 : a === "Senza data" ? 1 : b.localeCompare(a)))
          .map((anno) => `<div class="pressyear"><h3 class="pressyear__title">${esc(anno)}</h3><ul class="presslist">${perAnno[anno].map(articolo).join("")}</ul></div>`)
          .join("");

        // Social
        const socialEl = $("#social");
        if (socialEl) {
          const canali = (d.social || []).filter((s) => okUrl(s.url));
          socialEl.innerHTML = canali
            .map(
              (s) => `<a class="socialcard socialcard--${esc(s.id)}" href="${esc(s.url)}" target="_blank" rel="noopener">
                <svg class="ico"><use href="#${ICONE[s.id] || "i-external"}"/></svg>
                <span><strong>${esc(s.nome)}</strong>${esc(s.account || "Seguici")}</span>
                <em>Seguici <svg class="ico"><use href="#i-arrow"/></svg></em>
              </a>`
            )
            .join("");
        }

        // Materiali
        const matEl = $("#materiali");
        if (matEl) {
          matEl.innerHTML = (d.materiali || [])
            .filter((m) => okUrl(m.url))
            .map(
              (m) => `<a class="doc" href="${esc(m.url)}" target="_blank" rel="noopener">
                <svg class="ico"><use href="#i-download"/></svg><span><strong>${esc(m.titolo)}</strong>${esc(m.descrizione || "")}</span>
              </a>`
            )
            .join("");
        }
      })
      .catch(() => (stampaEl.innerHTML = `<p class="empty">Non riusciamo a caricare la rassegna stampa in questo momento.</p>`));
  }

  /* Diffondi: messaggio già pronto da condividere */
  const share = $("#diffondi");
  if (share) {
    const base = location.href.replace(/[^/]*$/, "");
    const msg = `Conosci la Comunità Lautari? Dal 1992 accoglie gratuitamente chi vuole uscire dalla dipendenza da droghe e alcool. Con 40 € sostieni la giornata di un ragazzo in comunità: ${base}sostienici.html`;
    $("#msg-diffondi").textContent = msg;
    $("#share-wa").href = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    $("#share-fb").href = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(base + "sostienici.html")}`;
    $("#share-copy").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      let ok = true;
      try {
        await navigator.clipboard.writeText(msg);
      } catch {
        ok = false;
      }
      btn.querySelector("span").textContent = ok ? "Messaggio copiato" : "Selezionalo e copialo";
      setTimeout(() => (btn.querySelector("span").textContent = "Copia il messaggio"), 1800);
    });
  }
})();
