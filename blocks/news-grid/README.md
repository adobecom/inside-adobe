# news-grid

Tiles for the newest news articles, filled in automatically. Shows up to 10 (2 per row from
1200px wide; the 6 newest below that).

## Authoring (Document Authoring)

Model: `standalone`

Add the block with no content. It reads `/news/query-index.json` (the `news` index in
`helix-query.yaml`), sorted newest first by each article's `Publication Date` metadata
(`YYYY-MM-DD`). A tile shows the article's feature image (gray if it has none), the date and
collection tag from its **article-meta** block, the title, and the subtitle (the H2 right after
the H1).

Only articles for the reader's edition (the header's edition picker; United States by default) are
shown: an article's `Geography` metadata (comma-separated, e.g. `global` or
`global/americas/united-states/seattle`) must be the edition's geography or contain it. `global`
is for everyone, and so is an article without `Geography`. Changing the edition updates the tiles
in place.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
