# Comunità Lautari · sito

Sito statico (HTML, CSS, JavaScript, nessuna dipendenza) ispirato a lautari.it, pensato per raccontare la comunità e portare più persone a donare.

## Avvio in locale

```bash
python3 -m http.server 5173
```

Poi apri http://localhost:5173. Il link `http://localhost:5173/#dona` (valido su qualsiasi pagina) apre direttamente il percorso di donazione.

> Serve un server: aprendo i file con doppio clic la sezione Progetti e iniziative non si carica.

## Pagine

| File | Contenuto |
|---|---|
| `index.html` | Home: donazione rapida, chi siamo in breve, percorso, numeri, ultime iniziative, come aiutare |
| `chi-siamo.html` | Storia, missione e valori, come ci sosteniamo, équipe, trasparenza |
| `percorso.html` | Come si accede, fasi, strumenti, giornata tipo, regole, famiglie, reinserimento |
| `cosa-facciamo.html` | Lavoro e formazione, prevenzione, accoglienza sociale, aiuti alimentari, sport, impatto |
| `progetti.html` | Elenco filtrabile di progetti, iniziative, eventi e collaborazioni |
| `iniziativa.html?id=…` | Pagina di dettaglio di ogni voce |
| `contatti.html` | Richiesta di aiuto e sedi |

Header, footer, barra mobile e percorso di donazione sono comuni a tutte le pagine e stanno in `js/layout.js`.

## Aggiungere un progetto, un'iniziativa o un evento

Tutto sta in `contenuti/iniziative.json`. Copia un blocco esistente e cambia i campi:

```json
{
  "id": "cena-di-natale-2026",
  "tipo": "evento",
  "titolo": "Cena di Natale in comunità",
  "sommario": "Una frase che compare nella card.",
  "immagine": "https://…/foto.jpg",
  "data": "2026-12-12",
  "ora": "19:30",
  "luogo": "Pozzolengo (BS)",
  "inEvidenza": true,
  "testo": [
    "Primo paragrafo.",
    { "titolo": "Un sottotitolo" },
    { "elenco": ["Punto uno", "Punto due"] }
  ]
}
```

- `tipo`: `progetto`, `iniziativa`, `evento` o `collaborazione`.
- `id`: solo minuscole e trattini; diventa l'indirizzo della pagina (`iniziativa.html?id=…`).
- Gli eventi futuri compaiono sempre per primi; poi le voci `inEvidenza`, poi le più recenti.
- `donazione` (facoltativo) collega il pulsante "Dona ora" della pagina a un progetto di `js/config.js`.
- `link` (facoltativo): `{ "testo": "…", "url": "https://…" }`.

## Dati delle donazioni

IBAN, conto postale, intestatario, codice fiscale, importi suggeriti e progetti stanno in `js/config.js`.
Per attivare il pagamento online basta incollare in `online` un link di pagamento (es. Stripe Payment Link, PayPal, Satispay Business): il metodo compare da solo nel percorso.
