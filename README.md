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
| `blog.html` | Blog: articolo in evidenza, filtro per categoria, elenco |
| `articolo.html?id=…` | Pagina di ogni articolo, con condivisione e articoli correlati |
| `comunicazione.html` | Media e comunicazione: testate, campagne ed eventi, rassegna stampa, social, messaggio da condividere, area stampa |
| `aiuto.html` | Chiedi aiuto: come contattarci, come si entra, chi può accedere, familiari |
| `sedi.html` | Sede centrale e unità locali |
| `faq.html` | Domande frequenti |
| `sostienici.html` | Donazione rapida, progetti da sostenere, 5×1000, bonifico, bollettino, trasparenza |

La barra laterale (8 voci, modificabili nell'elenco `NAV`), il footer, la barra mobile e il percorso di donazione sono comuni a tutte le pagine e stanno in `js/layout.js`. La pagina Cosa facciamo non è nella barra: si raggiunge dal footer e dai link interni.

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

## Pubblicare un articolo nel blog

Gli articoli stanno in `contenuti/blog.json`. Copia un blocco in `articoli` e cambia i campi:

```json
{
  "id": "festa-di-primavera-2027",
  "titolo": "Titolo dell'articolo",
  "sommario": "Una o due frasi che compaiono nell'anteprima.",
  "categoria": "Vita in comunità",
  "immagine": "https://…/foto.jpg",
  "data": "2027-04-10",
  "autore": "Comunità Lautari",
  "inEvidenza": false,
  "testo": [
    "Un paragrafo.",
    { "titolo": "Un sottotitolo" },
    { "elenco": ["Punto uno", "Punto due"] },
    { "citazione": "Una frase da mettere in risalto.", "autore": "Chi l'ha detta" }
  ]
}
```

- Le categorie si creano da sole: basta scriverne una nuova.
- Gli articoli più recenti compaiono per primi; quello con `inEvidenza: true` è mostrato in grande in cima al blog.
- `"bozza": true` nasconde un articolo finché non è pronto.
- Il tempo di lettura è calcolato in automatico.

## Aggiornare i numeri dell'impatto

La sezione "Il nostro impatto" (home, Chi siamo, Cosa facciamo, Sostienici) prende tutti i numeri da `js/impatto.js`, oggetto `IMPATTO`. I dati attuali vengono dal Bilancio sociale 2022 e, per gli aiuti alimentari, dal programma PN Inclusione 2025. Quando esce un nuovo bilancio sociale basta aggiornare quei valori e il link alla fonte.

## Rassegna stampa, social e materiali

La pagina Media e comunicazione legge `contenuti/comunicazione.json`:

- `stampa`: un blocco per articolo (testata, titolo, sintesi, data `AAAA-MM-GG` o `null`, tipo, url). Vengono raggruppati per anno, i più recenti in alto.
- `social`: compila `url` per far comparire Instagram, YouTube o TikTok; i canali senza indirizzo restano nascosti.
- `materiali`: documenti e logo da scaricare.

Campagne ed eventi stanno in `contenuti/iniziative.json` (tipo `evento` o `iniziativa`): compaiono sia nella pagina Progetti sia in Media e comunicazione.
