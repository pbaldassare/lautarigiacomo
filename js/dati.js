/*
 * Caricamento di progetti, iniziative, eventi e collaborazioni.
 * Se il database è collegato (js/config.js → LAUTARI_DB) i contenuti arrivano da lì,
 * così quello che i collaboratori pubblicano nell'area riservata compare subito sul sito.
 * Se il database non è collegato o non risponde, si usa contenuti/iniziative.json.
 */
(() => {
  "use strict";

  const DB = window.LAUTARI_DB || {};
  const collegato = Boolean(DB.url && DB.anonKey);

  // Riga del database → stesso formato del file JSON
  function daRiga(r) {
    const v = {
      id: r.id,
      tipo: r.tipo,
      titolo: r.titolo,
      sommario: r.sommario,
      immagine: r.immagine || "",
      data: r.data || null,
      inEvidenza: !!r.in_evidenza,
      testo: Array.isArray(r.testo) ? r.testo : []
    };
    if (r.data_testo) v.dataTesto = r.data_testo;
    if (r.ora) v.ora = r.ora;
    if (r.luogo) v.luogo = r.luogo;
    if (r.stato) v.stato = r.stato;
    if (r.link && r.link.url) v.link = r.link;
    if (r.donazione) v.donazione = r.donazione;
    return v;
  }

  async function dalDatabase() {
    const url = `${DB.url.replace(/\/$/, "")}/rest/v1/${DB.tabellaContenuti || "lautari_iniziative"}?select=*&pubblicato=eq.true&order=data.desc.nullslast`;
    const r = await fetch(url, { headers: { apikey: DB.anonKey, Authorization: `Bearer ${DB.anonKey}` } });
    if (!r.ok) throw new Error("Database non disponibile");
    return (await r.json()).map(daRiga);
  }

  async function dalFile() {
    const r = await fetch("contenuti/iniziative.json", { cache: "no-cache" });
    if (!r.ok) throw new Error("Contenuti non disponibili");
    return (await r.json()).voci || [];
  }

  let cache;
  window.LautariDati = {
    collegato,
    daRiga,
    iniziative() {
      if (!cache) {
        cache = collegato ? dalDatabase().catch(() => dalFile()) : dalFile();
      }
      return cache;
    }
  };
})();
