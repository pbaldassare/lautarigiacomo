/*
 * Dati per le donazioni: modifica solo questo file.
 * I metodi online (carta, PayPal, Satispay) compaiono nel percorso di
 * donazione solo se il link corrispondente è compilato.
 */
window.DONAZIONI = {
  intestatario: "Cooperativa di Solidarietà Lautari Onlus",
  iban: "IT67U0511654461000000026280",
  ccp: "000012850251",
  codiceFiscale: "01702160985",
  emailRicevute: "segreteria@lautari.it",
  telefono: "+39 030 9918700",

  // Costo di una giornata di un ragazzo in comunità (fonte: lautari.it)
  costoGiornata: 40,
  importi: [20, 40, 100, 280],
  importoPredefinito: 40,

  // Link di pagamento online (es. Stripe Payment Link, PayPal.me, Satispay Business).
  // Lascia la stringa vuota per nascondere il metodo.
  online: {
    carta: "",
    paypal: "",
    satispay: ""
  },

  progetti: [
    { id: "generale", nome: "Dove serve di più" },
    { id: "drug-zero", nome: "Progetto Drug Zero" },
    { id: "salvagente", nome: "Progetto Salvagente" },
    { id: "grest", nome: "Progetto Grest" },
    { id: "prevenzione", nome: "Prevenzione e informazione" }
  ]
};

/*
 * Collegamento al database (Supabase) usato dall'area riservata.
 * url e anonKey si trovano in Supabase → Project Settings → API.
 * La anonKey è pubblica per natura: i permessi di scrittura sono protetti
 * dalle regole del database (solo i collaboratori abilitati possono modificare).
 * Se restano vuoti, il sito usa i contenuti del file contenuti/iniziative.json.
 */
window.LAUTARI_DB = {
  // Progetto Supabase "labpiattaforma" (condiviso, tabelle con prefisso lautari_)
  url: "https://gdeyyyirgriwknkcqcwl.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkZXl5eWlyZ3Jpd2tua2NxY3dsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2NzUxOTUsImV4cCI6MjEwNjI1MTE5NX0.9Ymve0cI_Tnmq9AioEnIkGNfHLJJ6BUpzZco-AOwqcE",
  // Nomi usati nel database (il progetto Supabase è condiviso con altre app)
  tabellaContenuti: "lautari_iniziative",
  tabellaCollaboratori: "lautari_collaboratori",
  bucketImmagini: "lautari-immagini"
};
