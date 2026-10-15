# stock

Share price box for the homepage rail, as on the intranet: symbol (linked to Yahoo Finance), price,
a red or green arrow with the day's change, the time it was loaded, and a ⓘ tooltip crediting
Barchart. The price comes from Barchart OnDemand once, when the page loads.

## Authoring (Document Authoring)

Model: `standalone`

- Row 1: the heading (`Stock`).
- `Symbol` | the ticker, e.g. `ADBE` (the default).
- `API key` | the Barchart OnDemand API key. It's read from the page, not kept in code, and isn't
  shown; anyone who can open the page can still find it, as on the intranet.

If the quote can't be loaded (wrong key, or Barchart refusing the site), the box says the price is
unavailable.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
