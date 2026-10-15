# news-list

The news listing on `/news`, as on the intranet: a Filters column (Article Topics, Collections,
Locations) and the newest articles, 15 at a time with **Load 15 more articles**. Each row shows the
feature image, date, location and title.

The listing starts with **Global** and the reader's region (Americas for a United States
edition, from the header's edition picker); an article's tag link (`/news?tagtype=…&tagValue=…`)
adds that tag. **Reset Filters** goes back to Global and the region. Ticking a parent ticks its
children. Within a filter group any ticked tag matches; across groups all must match.

## Authoring (Document Authoring)

Model: `standalone`

- Row 1: the heading (`News`, H1).
- Further rows: shown under the filters from 900px, e.g. a link to the shared submit boxes
  (`/fragments/shared/news-feedback`).

Articles come from `/news/query-index.json` (the `news` index in `helix-query.yaml`): `date`,
`geography`, and `tags`, the links in the first row of each article's **article-meta** block. The
filter lists are the `/news-filters` sheet (sheets `topics`, `collections`, `locations`; columns
`Name`, `Tag`, e.g. `Security` | `article_topic:ops/security`). A tag's parent is its path prefix;
locations named `Remote` aren't listed.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
