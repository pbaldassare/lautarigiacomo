/*
 * Sezione "Il nostro impatto", usata in home, Chi siamo, Cosa facciamo e Sostienici.
 * I numeri stanno tutti qui: per aggiornarli (es. con il bilancio sociale di un
 * nuovo anno) basta modificare l'oggetto IMPATTO.
 *
 * Uso nella pagina:  <section class="impatto" data-impatto></section>
 *   data-variante="breve"  → solo numeri e invito a donare (home, Sostienici)
 *   data-variante="percorso"  → numeri e risultati del percorso, senza dati sul territorio
 *   data-variante="completa" (predefinita) → anche risultati del percorso e territorio
 */
(() => {
  "use strict";

  const IMPATTO = {
    fonte: {
      testo: "Bilancio sociale 2022 della Cooperativa",
      url: "https://www.lautari.it/wp-content/uploads/2024/02/BILANCIO-SOCIALE-COOP-LAUTARI-2022.pdf"
    },
    numeri: [
      { valore: "Migliaia", testo: "di persone aiutate a uscire dalla dipendenza da droghe, farmaci o alcool dal Gruppo Lautari" },
      { valore: "Centinaia", testo: "di persone in difficoltà accompagnate nel mondo del lavoro" },
      { valore: "35", testo: "ospiti accolti in media ogni giorno nel 2022, uomini e donne dai 19 ai 60 anni" },
      { valore: "89%", testo: "delle risorse del 2022 arriva da donazioni di privati ed enti: 3,4 milioni di euro" }
    ],
    risultati: [
      { titolo: "Astinenza", testo: "Il primo risultato del percorso: liberarsi dall'uso di sostanze e alcool." },
      { titolo: "Integrazione nel gruppo", testo: "Imparare di nuovo a vivere con gli altri, con regole, rispetto e fiducia." },
      { titolo: "Rielaborazione del proprio vissuto", testo: "Dare un senso alla propria storia, con psicologi, educatori e gruppi di auto-mutuo aiuto." },
      { titolo: "Lavoro e autonomia", testo: "Un mestiere imparato in comunità e la possibilità di lavorare nelle cooperative collegate." }
    ],
    territorio: {
      titolo: "Sul territorio, nel 2025",
      testo: "Con il programma PN Inclusione e il Banco Alimentare della Lombardia:",
      numeri: [
        { valore: "110", testo: "persone in grave deprivazione sostenute" },
        { valore: "96.030", testo: "pacchi e pasti distribuiti" },
        { valore: "3.224 kg", testo: "di prodotti alimentari" }
      ]
    },
    dono: "Le donazioni sono il “polmone finanziario principale” delle attività sociali della comunità."
  };

  const esc = (s = "") =>
    String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  function render(el) {
    const completa = el.dataset.variante !== "breve";
    const territorio = completa && el.dataset.variante !== "percorso";
    const I = IMPATTO;
    el.setAttribute("aria-labelledby", "impatto-title");
    el.innerHTML = `
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Il nostro impatto</p>
          <h2 id="impatto-title">Cosa cambia, grazie alla comunità</h2>
          <p>Ogni giorno in comunità è un passo verso una vita libera dalla dipendenza. Ecco cosa rende possibile il lavoro dei ragazzi, degli operatori e di chi ci sostiene.</p>
        </div>

        <ul class="impatto__numeri">
          ${I.numeri.map((n) => `<li><strong>${esc(n.valore)}</strong><span>${esc(n.testo)}</span></li>`).join("")}
        </ul>

        ${completa ? `
        <h3 class="impatto__sub">Cosa ottiene chi fa il percorso</h3>
        <ol class="impatto__risultati">
          ${I.risultati.map((r, i) => `<li><span class="impatto__n">${i + 1}</span><div><strong>${esc(r.titolo)}</strong><p>${esc(r.testo)}</p></div></li>`).join("")}
        </ol>

        ${territorio ? `<div class="impatto__territorio">
          <div>
            <h3>${esc(I.territorio.titolo)}</h3>
            <p>${esc(I.territorio.testo)}</p>
          </div>
          <ul>
            ${I.territorio.numeri.map((n) => `<li><strong>${esc(n.valore)}</strong><span>${esc(n.testo)}</span></li>`).join("")}
          </ul>
        </div>` : ""}` : ""}

        <div class="impatto__dono">
          <p>${esc(I.dono)} <strong>Con 40 € sostieni la giornata di un ragazzo in comunità.</strong></p>
          <button class="btn btn--dona" data-dona><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
        </div>

        <p class="impatto__fonte">Fonte: <a href="${esc(I.fonte.url)}" target="_blank" rel="noopener">${esc(I.fonte.testo)}</a>${territorio ? " · dati 2025: programma PN Inclusione" : ""}</p>
      </div>`;
  }

  document.querySelectorAll("[data-impatto]").forEach(render);
})();
