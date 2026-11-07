# Comunità Lautari · sito per la raccolta fondi

Sito statico (HTML, CSS, JavaScript, nessuna dipendenza) ispirato a lautari.it, pensato per portare più persone a donare.

## Avvio in locale

```bash
python3 -m http.server 5173
```

Poi apri http://localhost:5173. Il link `http://localhost:5173/#dona` apre direttamente il percorso di donazione.

## Dati delle donazioni

IBAN, conto postale, intestatario, codice fiscale, importi suggeriti e progetti stanno tutti in `js/config.js`.
Per attivare il pagamento online basta incollare in `online` un link di pagamento (es. Stripe Payment Link, PayPal, Satispay Business): il metodo compare da solo nel percorso.
