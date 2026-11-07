/*
 * Parti comuni a tutte le pagine: icone, barra aiuto, header, footer,
 * barra mobile e percorso di donazione.
 * Questo script va incluso subito dopo <body>: scrive l'header prima che
 * la pagina venga mostrata, così non c'è nessun "salto".
 */
(() => {
  "use strict";

  // Le 7 voci della barra laterale.
  // Livelli di colore: --support (Sostienici) = verde chiaro pieno; --key (Chiedi aiuto, Progetti) = in evidenza; le altre più discrete.
  const NAV = [
    { href: "aiuto.html", label: "Chiedi aiuto", page: "aiuto", icon: "i-life", extra: " sidebar__link--key" },
    { href: "percorso.html", label: "Il percorso", page: "percorso", icon: "i-route" },
    { href: "chi-siamo.html", label: "Chi siamo", page: "chi-siamo", icon: "i-users" },
    { href: "progetti.html", label: "Progetti", page: "progetti", icon: "i-grid", extra: " sidebar__link--key" },
    { href: "sedi.html", label: "Sedi", page: "sedi", icon: "i-pin" },
    { href: "faq.html", label: "FAQ", page: "faq", icon: "i-question" },
    { href: "sostienici.html", label: "Sostienici", page: "sostienici", icon: "i-heart", extra: " sidebar__link--support" }
  ];

  // Pagine raggiungibili dal footer ma non dalla barra
  const EXTRA = [{ href: "cosa-facciamo.html", label: "Cosa facciamo" }];

  const page = document.body.dataset.page || "";

  const sprite = `
  <svg width="0" height="0" style="position:absolute" aria-hidden="true">
    <symbol id="i-heart" viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3 4.5 6.7 4.5c2.1 0 3.6 1.1 4.3 2.4h2c.7-1.3 2.2-2.4 4.3-2.4 3.7 0 5.8 3.8 4.3 7.2C19.5 16.4 12 21 12 21z"/></symbol>
    <symbol id="i-phone" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></symbol>
    <symbol id="i-copy" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></g></symbol>
    <symbol id="i-check" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" d="M20 6 9 17l-5-5"/></symbol>
    <symbol id="i-arrow" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M5 12h14M13 6l6 6-6 6"/></symbol>
    <symbol id="i-back" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M19 12H5M11 18l-6-6 6-6"/></symbol>
    <symbol id="i-close" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M6 6l12 12M18 6 6 18"/></symbol>
    <symbol id="i-menu" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16"/></symbol>
    <symbol id="i-bank" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M3 10h18L12 4 3 10zM5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18"/></symbol>
    <symbol id="i-mail" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></g></symbol>
    <symbol id="i-card" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></g></symbol>
    <symbol id="i-pin" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></g></symbol>
    <symbol id="i-calendar" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></g></symbol>
    <symbol id="i-doc" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></g></symbol>
    <symbol id="i-users" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></g></symbol>
    <symbol id="i-tool" viewBox="0 0 24 24"><path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/></symbol>
    <symbol id="i-sun" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g></symbol>
    <symbol id="i-life" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><path d="M4.9 4.9l4.3 4.3M14.8 14.8l4.3 4.3M14.8 9.2l4.3-4.3M4.9 19.1l4.3-4.3"/></g></symbol>
    <symbol id="i-route" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="19" r="3"/><circle cx="18" cy="5" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/></g></symbol>
    <symbol id="i-grid" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></g></symbol>
    <symbol id="i-question" viewBox="0 0 24 24"><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/></g></symbol>
  </svg>`;

  const top = `
  <a class="skip" href="#contenuto">Vai al contenuto</a>
  ${sprite}
  <header class="topbar">
    <div class="topbar__in">
      <a class="brand" href="index.html" aria-label="Comunità Lautari, home">
        <span class="brand__mark"><svg class="ico"><use href="#i-heart"/></svg></span>
        <span class="brand__text">Comunità <strong>Lautari</strong></span>
      </a>
      <button class="btn btn--dona topbar__dona" data-dona><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
      <button class="menu-toggle" aria-controls="sidebar" aria-expanded="false" aria-label="Apri il menu">
        <svg class="ico"><use href="#i-menu"/></svg>
      </button>
    </div>
  </header>

  <aside class="sidebar" id="sidebar" aria-label="Menu principale">
    <div class="sidebar__top">
      <a class="brand brand--side" href="index.html" aria-label="Comunità Lautari, home">
        <span class="brand__mark"><svg class="ico"><use href="#i-heart"/></svg></span>
        <span class="brand__text">Comunità <strong>Lautari</strong></span>
      </a>
      <button class="sidebar__close" aria-label="Chiudi il menu"><svg class="ico"><use href="#i-close"/></svg></button>
    </div>
    <nav class="sidebar__nav" aria-label="Principale">
      ${NAV.map(
        (n) => `<a class="sidebar__link${n.extra || ""}" href="${n.href}"${n.page === page ? ' aria-current="page"' : ""}>
          <svg class="ico"><use href="#${n.icon}"/></svg><span>${n.label}</span></a>`
      ).join("")}
    </nav>
    <div class="sidebar__bottom">
      <button class="btn btn--dona btn--block" data-dona><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
      <a class="sidebar__tel" href="tel:+390309918700"><svg class="ico"><use href="#i-phone"/></svg> 030 991 8700</a>
    </div>
  </aside>
  <div class="sidebar-overlay" hidden></div>`;

  const bottom = `
  <footer class="footer">
    <div class="wrap footer__in">
      <div class="footer__about">
        <p class="brand brand--footer"><span class="brand__mark"><svg class="ico"><use href="#i-heart"/></svg></span><span class="brand__text">Comunità <strong>Lautari</strong></span></p>
        <p>Cooperativa di Solidarietà Lautari Onlus<br>Via Monte Ingrana 2, 25010 Pozzolengo (BS)<br>C.F. e P.IVA 01702160985 · R.E.A. Brescia n. 342243<br>Albo Nazionale Società Cooperative n. A107298</p>
      </div>
      <nav class="footer__nav" aria-label="Pagine">
        <a href="index.html">Home</a>
        ${[...NAV, ...EXTRA].map((n) => `<a href="${n.href}">${n.label}</a>`).join("")}
      </nav>
      <div class="footer__links">
        <a href="chi-siamo.html#trasparenza">Amministrazione trasparente</a>
        <a href="https://www.facebook.com/comunita.lautari/" rel="noopener" target="_blank">Facebook</a>
        <a href="https://www.lautari.it/wp-content/uploads/2018/10/privacy-policy-lautari-it.pdf" rel="noopener" target="_blank">Privacy</a>
        <button class="btn btn--dona" data-dona><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
      </div>
    </div>
  </footer>

  <div class="mobilebar">
    <a class="mobilebar__call" href="tel:+390309918700" aria-label="Chiama la comunità"><svg class="ico"><use href="#i-phone"/></svg></a>
    <button class="btn btn--dona mobilebar__dona" data-dona><svg class="ico"><use href="#i-heart"/></svg> Dona ora</button>
  </div>

  <dialog class="donate" id="donate" aria-labelledby="donate-title">
    <div class="donate__head">
      <button class="iconbtn" id="donate-back" aria-label="Indietro" hidden><svg class="ico"><use href="#i-back"/></svg></button>
      <ol class="progress" aria-label="Passaggi della donazione">
        <li class="is-active">Importo</li><li>Metodo</li><li>Conferma</li>
      </ol>
      <button class="iconbtn" id="donate-close" aria-label="Chiudi"><svg class="ico"><use href="#i-close"/></svg></button>
    </div>

    <section class="dstep" data-step="1">
      <h2 id="donate-title">Quanto vuoi donare?</h2>
      <div class="freq" role="radiogroup" aria-label="Frequenza">
        <label><input type="radio" name="freq" value="una-tantum" checked><span>Una volta</span></label>
        <label><input type="radio" name="freq" value="mensile"><span>Ogni mese</span></label>
      </div>
      <fieldset class="chips chips--lg" id="donate-chips">
        <legend class="sr-only">Importo</legend>
      </fieldset>
      <label class="custom">
        <span>Altro importo</span>
        <span class="custom__field"><input type="number" id="custom-amount" min="1" step="1" inputmode="numeric" placeholder="Es. 60"><span>€</span></span>
      </label>
      <p class="impact-line" id="impact-line" aria-live="polite"></p>
      <label class="select">
        <span>Destina la donazione a</span>
        <select id="project"></select>
      </label>
      <button class="btn btn--dona btn--xl btn--block" id="to-step-2">Continua <svg class="ico"><use href="#i-arrow"/></svg></button>
    </section>

    <section class="dstep" data-step="2" hidden>
      <h2>Come preferisci donare?</h2>
      <p class="dstep__summary" id="summary-2"></p>
      <div class="methods" id="methods"></div>
    </section>

    <section class="dstep" data-step="3" hidden>
      <h2 id="step3-title">Ultimo passo</h2>
      <p class="dstep__summary" id="summary-3"></p>
      <div id="instructions"></div>
      <div class="after">
        <p><strong>Vuoi la ricevuta per le agevolazioni fiscali?</strong> Dopo la donazione avvisaci con un clic: l'email è già pronta.</p>
        <a class="btn btn--ghost btn--block" id="notify" href="#"><svg class="ico"><use href="#i-mail"/></svg> Ho donato, inviatemi la ricevuta</a>
      </div>
      <p class="thanks"><svg class="ico"><use href="#i-heart"/></svg> Grazie. Con il tuo gesto un ragazzo ha un giorno in più per ricominciare.</p>
    </section>
  </dialog>

  <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.currentScript.insertAdjacentHTML("beforebegin", top);
  window.LAYOUT_BOTTOM = bottom;
})();
