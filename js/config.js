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
