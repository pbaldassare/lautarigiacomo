(() => {
  "use strict";

  const D = window.DONAZIONI;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const euro = (n) => n.toLocaleString("it-IT") + " €";
  const ibanFmt = D.iban.replace(/(.{4})/g, "$1 ").trim();

  const state = {
    importo: D.importoPredefinito,
    frequenza: "una-tantum",
    progetto: "generale",
    metodo: null
  };

  /* ---------- Impatto ---------- */
  function impatto(importo, frequenza) {
    if (!importo || importo < 1) return "Scegli o scrivi un importo.";
    const g = Math.floor(importo / D.costoGiornata);
    const mese = frequenza === "mensile" ? " ogni mese" : "";
    if (g >= 1) {
      const giornate = g === 1 ? "una giornata" : `${g.toLocaleString("it-IT")} giornate`;
      return `Sostieni ${giornate} in comunità per un ragazzo${mese}.`;
    }
    const ore = Math.max(1, Math.round((importo / D.costoGiornata) * 24));
    return `Copri circa ${ore} ore di una giornata in comunità${mese}.`;
  }

  /* ---------- Chips importo ---------- */
  function renderChips(container, name, onChange) {
    container.insertAdjacentHTML(
      "beforeend",
      D.importi
        .map(
          (v) => `<label class="chip"><input type="radio" name="${name}" value="${v}"${
            v === state.importo ? " checked" : ""
          }><span>${v} €</span></label>`
        )
        .join("")
    );
    container.addEventListener("change", (e) => {
      if (e.target.name === name) onChange(Number(e.target.value));
    });
  }

  function syncChips(name) {
    $$(`input[name="${name}"]`).forEach((r) => (r.checked = Number(r.value) === state.importo));
  }

  /* ---------- Donazione rapida (hero) ---------- */
  const quick = $("#quick");
  const quickImpact = $("#quick-impact");
  const quickAmount = $("#quick-amount");
  $$("[data-costo]").forEach((el) => (el.textContent = D.costoGiornata));

  function updateQuick() {
    quickAmount.textContent = state.importo.toLocaleString("it-IT");
    quickImpact.textContent = impatto(state.importo, "una-tantum");
  }
  renderChips($("#quick-chips"), "quick-amount", (v) => {
    state.importo = v;
    updateQuick();
  });
  updateQuick();
  quick.addEventListener("submit", (e) => {
    e.preventDefault();
    openDonate({ importo: state.importo, step: 2 });
  });

  /* ---------- Dialog di donazione ---------- */
  const dlg = $("#donate");
  const steps = $$(".dstep", dlg);
  const progress = $$(".progress li", dlg);
  const back = $("#donate-back");
  const custom = $("#custom-amount");
  const impactLine = $("#impact-line");
  const projectSel = $("#project");
  let current = 1;

  projectSel.innerHTML = D.progetti.map((p) => `<option value="${p.id}">${p.nome}</option>`).join("");
  projectSel.addEventListener("change", () => (state.progetto = projectSel.value));

  renderChips($("#donate-chips"), "d-amount", (v) => {
    state.importo = v;
    custom.value = "";
    updateStep1();
  });

  custom.addEventListener("input", () => {
    const v = Math.round(Number(custom.value));
    state.importo = v > 0 ? v : 0;
    syncChips("d-amount");
    updateStep1();
  });

  $$('input[name="freq"]', dlg).forEach((r) =>
    r.addEventListener("change", () => {
      state.frequenza = r.value;
      updateStep1();
    })
  );

  function updateStep1() {
    impactLine.textContent = impatto(state.importo, state.frequenza);
    $("#to-step-2").disabled = !(state.importo > 0);
  }

  function nomeProgetto() {
    return D.progetti.find((p) => p.id === state.progetto)?.nome || "";
  }

  function causale() {
    let c = "Donazione liberale";
    if (state.progetto !== "generale") c += " - " + nomeProgetto();
    if (state.frequenza === "mensile") c += " - mensile";
    return c;
  }

  function riepilogo() {
    const freq = state.frequenza === "mensile" ? " al mese" : "";
    const prog = state.progetto !== "generale" ? ` per ${nomeProgetto()}` : "";
    return `Stai donando <strong>${euro(state.importo)}${freq}</strong>${prog}. <button type="button" class="linkbtn" data-goto="1">Modifica</button>`;
  }

  /* Metodi disponibili */
  function metodi() {
    const list = [
      { id: "bonifico", icon: "i-bank", title: "Bonifico bancario", desc: state.frequenza === "mensile" ? "Imposta un bonifico periodico dal tuo home banking" : "Dal tuo home banking, in 2 minuti" },
      { id: "bollettino", icon: "i-mail", title: "Bollettino postale", desc: "In posta o dall'app di Poste Italiane" }
    ];
    const online = [
      { id: "carta", icon: "i-card", title: "Carta di credito", desc: "Pagamento online sicuro" },
      { id: "paypal", icon: "i-card", title: "PayPal", desc: "Con il tuo account PayPal" },
      { id: "satispay", icon: "i-card", title: "Satispay", desc: "Dall'app Satispay" }
    ].filter((m) => D.online[m.id]);
    return [...online, ...list];
  }

  function renderStep2() {
    $("#summary-2").innerHTML = riepilogo();
    $("#methods").innerHTML = metodi()
      .map(
        (m) => `<button type="button" class="method" data-metodo="${m.id}">
          <span class="method__ico"><svg class="ico"><use href="#${m.icon}"/></svg></span>
          <span class="method__txt"><strong>${m.title}</strong><span>${m.desc}</span></span>
          <svg class="ico method__go"><use href="#i-arrow"/></svg>
        </button>`
      )
      .join("");
  }

  function row(label, value, key, mono) {
    return `<div class="drow">
      <span class="drow__label">${label}</span>
      <span class="drow__value${mono ? " mono" : ""}">${value}</span>
      <button type="button" class="copybtn" data-copyval="${key}" aria-label="Copia ${label}"><svg class="ico"><use href="#i-copy"/></svg><span>Copia</span></button>
    </div>`;
  }

  const copyValues = () => ({
    intestatario: D.intestatario,
    iban: D.iban,
    ccp: D.ccp,
    importo: String(state.importo).replace(".", ","),
    causale: causale(),
    tutto:
      state.metodo === "bollettino"
        ? `C/C postale: ${D.ccp}\nIntestato a: ${D.intestatario}\nImporto: ${euro(state.importo)}\nCausale: ${causale()}`
        : `Beneficiario: ${D.intestatario}\nIBAN: ${D.iban}\nImporto: ${euro(state.importo)}\nCausale: ${causale()}`
  });

  function renderStep3() {
    $("#summary-3").innerHTML = riepilogo();
    const box = $("#instructions");
    const m = state.metodo;

    if (D.online[m]) {
      $("#step3-title").textContent = "Completa il pagamento";
      box.innerHTML = `<p>Si aprirà la pagina di pagamento sicura in una nuova scheda. Inserisci <strong>${euro(state.importo)}</strong> come importo.</p>
        <a class="btn btn--dona btn--xl btn--block" href="${D.online[m]}" target="_blank" rel="noopener">Vai al pagamento <svg class="ico"><use href="#i-arrow"/></svg></a>`;
    } else if (m === "bollettino") {
      $("#step3-title").textContent = "Compila il bollettino";
      box.innerHTML = `<div class="dbox">
          ${row("Conto corrente postale", D.ccp, "ccp", true)}
          ${row("Intestato a", D.intestatario, "intestatario")}
          ${row("Importo", euro(state.importo), "importo")}
          ${row("Causale", causale(), "causale")}
        </div>
        <button type="button" class="btn btn--dona btn--xl btn--block" data-copyval="tutto"><svg class="ico"><use href="#i-copy"/></svg> Copia tutti i dati</button>`;
    } else {
      $("#step3-title").textContent = state.frequenza === "mensile" ? "Imposta il bonifico periodico" : "Fai il bonifico";
      const tip =
        state.frequenza === "mensile"
          ? `<p class="tip">Nel tuo home banking scegli <strong>“Bonifico periodico”</strong> (o “ordine permanente”), cadenza <strong>mensile</strong>. Puoi interromperlo quando vuoi.</p>`
          : `<p class="tip">Apri l'app della tua banca, scegli <strong>“Bonifico”</strong> e incolla i dati qui sotto.</p>`;
      box.innerHTML = `${tip}<div class="dbox">
          ${row("IBAN", ibanFmt, "iban", true)}
          ${row("Beneficiario", D.intestatario, "intestatario")}
          ${row("Importo", euro(state.importo), "importo")}
          ${row("Causale", causale(), "causale")}
        </div>
        <button type="button" class="btn btn--dona btn--xl btn--block" data-copyval="tutto"><svg class="ico"><use href="#i-copy"/></svg> Copia tutti i dati</button>`;
    }

    const metodoLabel = { bonifico: "bonifico", bollettino: "bollettino postale", carta: "carta", paypal: "PayPal", satispay: "Satispay" }[m];
    const subject = `Donazione di ${euro(state.importo)} - richiesta ricevuta`;
    const body = [
      "Buongiorno,",
      "",
      `ho appena fatto una donazione di ${euro(state.importo)}${state.frequenza === "mensile" ? " al mese" : ""} tramite ${metodoLabel}.`,
      `Causale: ${causale()}`,
      "",
      "Vi chiedo la ricevuta per le agevolazioni fiscali. I miei dati:",
      "Nome e cognome: ",
      "Codice fiscale: ",
      "Indirizzo: ",
      "Data della donazione: ",
      "",
      "Grazie"
    ].join("\n");
    $("#notify").href = `mailto:${D.emailRicevute}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  function goTo(n) {
    if (n < 3 && !state.presetMetodo) state.metodo = null;
    if (n === 2) renderStep2();
    if (n === 3) renderStep3();
    current = n;
    steps.forEach((s) => (s.hidden = Number(s.dataset.step) !== n));
    progress.forEach((li, i) => {
      li.classList.toggle("is-active", i === n - 1);
      li.classList.toggle("is-done", i < n - 1);
    });
    back.hidden = n === 1;
    dlg.scrollTop = 0;
    const h = $(`.dstep[data-step="${n}"] h2`, dlg);
    h.setAttribute("tabindex", "-1");
    h.focus({ preventScroll: true });
  }

  function openDonate(opts = {}) {
    if (opts.importo) state.importo = Number(opts.importo);
    if (opts.frequenza) state.frequenza = opts.frequenza;
    if (opts.progetto) state.progetto = opts.progetto;
    state.metodo = opts.metodo || null;
    state.presetMetodo = Boolean(opts.metodo);

    $$('input[name="freq"]', dlg).forEach((r) => (r.checked = r.value === state.frequenza));
    projectSel.value = state.progetto;
    const preset = D.importi.includes(state.importo);
    custom.value = preset ? "" : state.importo;
    syncChips("d-amount");
    updateStep1();

    if (!dlg.open) dlg.showModal();
    document.documentElement.classList.add("is-locked");
    goTo(opts.step || 1);
  }

  function closeDonate() {
    dlg.close();
  }
  dlg.addEventListener("close", () => {
    document.documentElement.classList.remove("is-locked");
    if (location.hash === "#dona") history.replaceState(null, "", location.pathname + location.search);
  });
  dlg.addEventListener("click", (e) => {
    if (e.target === dlg) closeDonate(); // clic sullo sfondo
  });

  $("#donate-close").addEventListener("click", closeDonate);
  back.addEventListener("click", () => {
    if (current === 3 && state.presetMetodo) goTo(1);
    else goTo(current - 1);
  });

  $("#to-step-2").addEventListener("click", () => {
    if (!(state.importo > 0)) {
      custom.focus();
      return;
    }
    // Se il metodo è già stato scelto (es. "Dona con bonifico") salta al passo 3
    if (state.metodo) {
      state.presetMetodo = true;
      goTo(3);
    } else {
      state.presetMetodo = false;
      goTo(2);
    }
  });

  dlg.addEventListener("click", (e) => {
    const m = e.target.closest("[data-metodo]");
    if (m && dlg.contains(m)) {
      state.metodo = m.dataset.metodo;
      state.presetMetodo = false;
      goTo(3);
      return;
    }
    const g = e.target.closest("[data-goto]");
    if (g) goTo(Number(g.dataset.goto));
    const c = e.target.closest("[data-copyval]");
    if (c) copy(copyValues()[c.dataset.copyval], c);
  });

  /* Tutti i pulsanti "Dona" del sito */
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-dona]");
    if (!b) return;
    e.preventDefault();
    closeMenu();
    openDonate({
      importo: b.dataset.importo,
      frequenza: b.dataset.frequenza || "una-tantum",
      progetto: b.dataset.progetto || "generale",
      metodo: b.dataset.metodo
    });
  });

  /* Link condivisibile: …/#dona apre subito il percorso */
  function checkHash() {
    if (location.hash === "#dona") openDonate();
  }
  window.addEventListener("hashchange", checkHash);
  checkHash();

  /* ---------- Copia ---------- */
  const toast = $("#toast");
  let toastT;
  function showToast(msg) {
    // il dialog sta nel top layer: il toast deve stare dentro di lui per essere visibile
    (dlg.open ? dlg : document.body).appendChild(toast);
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-on"), 2200);
  }

  async function copy(text, btn) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      t.style.position = "fixed";
      t.style.opacity = "0";
      (dlg.open ? dlg : document.body).appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    showToast("Copiato negli appunti");
    if (btn) {
      btn.classList.add("is-copied");
      const use = btn.querySelector("use");
      const prev = use?.getAttribute("href");
      use?.setAttribute("href", "#i-check");
      setTimeout(() => {
        btn.classList.remove("is-copied");
        if (use) use.setAttribute("href", prev);
      }, 1600);
    }
  }

  $$("[data-iban-fmt]").forEach((el) => (el.textContent = ibanFmt));
  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", () => {
      const map = { iban: D.iban, ccp: D.ccp, cf: D.codiceFiscale };
      copy(map[b.dataset.copy], b);
    })
  );

  /* ---------- Menu mobile ---------- */
  const toggle = $(".menu-toggle");
  const nav = $("#nav");
  function closeMenu() {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeMenu();
  });

  /* Ombra header allo scroll */
  const header = $(".header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
