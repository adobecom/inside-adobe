# news-box

A short list of the newest articles with one tag, as the intranet's embedded news lists (e.g.
"Latest Adobe Awards" on Adobe Achievements): a heading with an optional More link, then each
article's image, date and title.

## Authoring (Document Authoring)

Model: `standalone`

- Row 1: the heading (H2) | optional link, e.g. `More` to the News page filtered by the same tag
  (`/news?tagtype=article_topic&tagValue=article_topic:adobe-life/awards`).
- `Tag` | the tag, as in the article-meta tag links: `article_topic:adobe-life/awards`,
  `collection:need`. A topic covers its sub-topics.
- `Limit` | how many articles (default 5).

Articles come from `/news/query-index.json` (`tags`: each article's article-meta tag links),
newest first.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
