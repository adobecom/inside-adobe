---
title: Inside Adobe on Edge Delivery — Migration Handover
date: 2026-10-15
---

# Inside Adobe on Edge Delivery — Migration Handover

This guide hands over the migration of the Inside Adobe intranet (`inside.corp.adobe.com`) to AEM
Edge Delivery Services. Content is authored in Document Authoring (DA); the code is an Author Kit
repository.

| | |
|---|---|
| **Organization / site** | `adobecom` / `inside-adobe` |
| **Repository** | https://github.com/adobecom/inside-adobe (public) |
| **Code** | All merged: PR #1 (Mission & Plan, header, footer), PR #3 (templates, blocks, Side-Nav/Event/Full-Width imports), PR #4 (news, documents, redirects, page names), PR #5 (handover), PR #6 (image pop-up tiles), PR #9 (launch prep), PR #10 (editions), PR #11 (editions crawler), PR #12 and #13 (homepage news and events by edition); PR #2 closed. CDN config (`config/cdn.yaml`) on `main`, deployed 2026-10-15. |
| **Source copy** | Private repo `adobecom/inside-adobe-mirror`: a signed-in crawl of the intranet, plus every country and manager version of the 19 edition topics |
| **Pages migrated** | **1,437 intranet pages**: everything crawled, all editions (459 country and manager versions), plus 19 topic pages |
| **Published** | **Everything**, behind sign-in (2026-10-14/15): 1,456 pages, 140 fragments, 1,357 PDFs, `/redirects`, `/editions`; news and events republished 2026-10-15 with `Geography` (news and events indexes). `preview.inside.adobe.com` is in use from Adobe's network (it doesn't resolve from outside) |
| **Authoring** | Authors started editing in DA on 2026-10-14; DA is now the source of truth, not the import (§1) |

---

## 1. Status and open items

### Do first

1. **Confirm access control.** As of 2026-10-14 `*.aem.page`, `*.aem.live` and `content.da.live`
   answer 401 to anonymous requests, so site authentication is on (§4.4). Confirm the allowed users
   in the Config Service `access` settings. The repo itself is still public.
2. **Confirm `preview.inside.adobe.com` is restricted.** It was in use on 2026-10-14, reachable from
   Adobe's network only (no public DNS). `config/cdn.yaml` sends the site token to the origin, so the
   CDN serves the protected pages to anyone who can reach the hostname: keep it internal, or add
   sign-in on the CDN, before any public DNS.
3. **Publish or discard the pending author edits.** Saved in DA after the bulk publish, still not live
   on 2026-10-15:
   `/about-adobe/adobe-mission-and-plan` (16:23 UTC, not previewed), `/index` (17:05, previewed, not
   published), `/about-adobe` (17:09, not previewed).
4. **Mirror history:** replaced with a fresh history (the commit with session cookies is no longer
   on a branch; GitHub drops unreferenced commits over time). Sign out of the intranet to end that
   session if not done yet.

### Migration progress

| Template (source) | Pages | Status |
|---|---|---|
| Side-Nav Page | 360 | Published. Includes Mission & Plan, Adobe Research, Employee Survey (the Side-Nav versions since 2026-10-13) |
| Event | 246 | Published: 149 from the first crawl, 93 found by the re-crawl, 4 linked from country pages |
| Full-Width Page | 86 | Published (44 section landing pages, 42 office pages) |
| Homepage | 1 | Published; the news grid and events list follow the reader's edition (§2.7). An author edit is pending (§1) |
| News Article | 285 | Published, full archive from the news feed (281), plus 4 older articles linked from country pages |
| Edition versions | 459 | Published: every country version of 13 topics (up to 37 countries each) and the manager version of 6 role topics (§2.7) |
| Edition topic pages | 19 | Published: the topic's own address picks the reader's version (§2.7) |
| Shared content | 84 section menus, 54 shared fragments, header, footer | Published |
| Images | ~1,530 | In DA under `/dam/…` (intranet DAM paths, lowercased); served from the pages once previewed. One 26 MB PNG (Steven Bartlett article) replaced by a resized JPEG to fit the 20 MB limit; the Ovidiu Eftimie photo (Career Opportunities), missing from the crawl, saved by hand from the intranet |
| Documents | 1,357 PDFs | Published under `/dam/…`; every page link to them rewritten (305 added with the editions) |

### Also outstanding

| Item | Detail |
|---|---|
| Linked documents left | 54 links still point to `inside.corp.adobe.com`. **Decision needed** for 28: 22 Word/Excel/PowerPoint files and 6 PDFs over 20 MB, which Edge Delivery can't serve (aem.live/docs/limits). Also 12 images linked as downloads (not crawled), 11 already 404 on the intranet, 3 never fetched. |
| Re-importing | Authors now edit in DA. Never bulk re-upload imported content: re-import only to fix a converter bug, and replace a document only after checking it is unchanged since our last upload (`.migration/scripts/da_safe_overwrite.py` compares DA with the previous upload). |
| Re-save incident (2026-10-14) | Between 04:25 and 04:59 UTC an unidentified tool re-saved every DA document, pointing images at page-folder copies it never created (images broke in preview), rewriting `#` links to `/`, dropping `?` queries and trimming hyphens. All 1,110 documents were restored from the import and verified byte for byte before the bulk preview; the re-saved versions are backed up locally. The tool is still unidentified: don't run bulk tools that rewrite media or links on this content. |
| Redirects | Sheet `/redirects` (2,250 rows, §4.6), published and active: intranet redirects, renamed pages, moved PDFs. The two CDN rules in `config/cdn.yaml` (`.html` suffix, `/content/inside/en` prefix) were deployed through the Cloud Manager config pipeline on 2026-10-15; check them with the `curl -I` commands in §4.6. |
| Editions: language | The intranet's picker says an edition may change the language; no other-language pages turned up (country versions are in English). Homepage news and events are filtered by edition (each page's `Geography`). |
| Block library | Example documents for 14 blocks and `/library/blocks.json` are in DA, registered in the site config's `library` sheet (2026-10-15): authors see **Blocks** in the editor's Library panel. Add a block by adding its example under `/library/blocks/` and a row to `blocks.json`. |
| Leftovers in DA | Unlinked test uploads: 3 Office files and the 57 MB PDF (under `/dam/…`); early header/footer copies under `/content/fragments/nav`. Safe to delete. |
| Live tools (by decision) | Café menus/hours, events calendar, holiday list, calendar filters, awards feed and the event submission form are replaced by a note linking to the intranet page. My Favorites (homepage) dropped; the stock quote is the `stock` block and the news listing (`/news`) the `news-list` block (§2.5). |
| Left out | Left-column "Need help?" box under some section menus; profile/search/tools rail; 5 section captions on 3 pages; 3 news images broken on the intranet itself (employee-communications: Premier League key visual, Creative residents, Women's FA Cup final). |
| Engine bug (upstream) | `ak.js` `decorateButton` turns a bold/italic run that holds a link *plus other text* into a button and drops the text. Worked around in the importer; report it upstream. |
| Flaky tests | `dapreview > should load da.js module` and one header test (language trigger) fail intermittently under load (pre-existing). |
| Computers listing | Optional: `editions.mjs --topics` with the current script also lists `/computers-devices/computers` (25 versions came from links already); then rebuild the topic page with `build_editions.py`. |

---

## 2. Authoring guide

### 2.1 Where content lives (DA)

| Content | DA path |
|---|---|
| Pages | same path as the intranet page without `/content/inside/en` and `.html`, e.g. `/benefits-wellbeing/health-insurance/us`, `/events/2026/10/<slug>`, `/news/2026/09/<slug>`; homepage `/index` |
| Images | `/dam/<intranet DAM path>` (lowercase), shared by all pages |
| Documents (PDF) | `/dam/<intranet DAM path>`, lowercase, accents removed, anything but letters/digits/`/` → `-` (e.g. `…/restroom_noida132.pdf` → `…/restroom-noida132.pdf`) |
| Header / footer | `/fragments/nav/header`, `/fragments/nav/footer` |
| Section menus | `/fragments/side-nav/<section>` (e.g. `benefits-wellbeing`, `offices-san-jose`) |
| Shared content | `/fragments/shared/<name>` (e.g. `offices-printers`, `travel-paying-for-your-trip`) |

Edit at `https://da.live/edit#/adobecom/inside-adobe/<path>`.

### 2.2 Templates (page metadata `Template`)

| Template | Used for | What it does |
|---|---|---|
| `side-nav` | 360 section pages | Adds the section menu (left on desktop, a bar above the content on mobile); 1236px grid |
| `full-width` | 86 landing/office pages | 1236px grid; `band` sections (gray strips) |
| `event` | 242 event pages | More Events button top right; no section dividers; the event submission box in a column beside it from 1200px (§2.6) |
| `article` | news | Narrower column, More News top right, normal-weight body links; the news submit boxes in a column beside it from 1200px (§2.6) |
| `home` | homepage | Content + right rail layout from 1200px |

### 2.3 Page metadata

| Key | Where | Meaning |
|---|---|---|
| `Title` | all | Page title |
| `Template` | all | See §2.2 |
| `Side Nav` | side-nav pages, only when not the default | Menu name or path; default is the first path segment |
| `Publication Date` | articles | `YYYY-MM-DD`; drives the homepage news grid order |
| `Geography` | articles, events | Who it's for: the intranet's geography tags, comma-separated (`global`, `global/americas/united-states`, `…/seattle`); the homepage shows an article when one tag is the reader's edition or contains it |
| `Event Start` / `Event End` | events | `YYYY-MM-DD` (all day) or `YYYY-MM-DDTHH:MM`; date chip, "Multi Day", Add to Calendar |
| `Event Time Zone` | timed events | IANA zone, e.g. `America/Los_Angeles` (leave out → viewer's local time). Imported from the date line, else from the event's single office region |
| `Event Type`, `Event Region` | events | Repeat the block values for future listings |

### 2.4 Section styles (Section Metadata `style`)

- **`collapsible`**: the section's first heading becomes a clickable title; everything below it
  collapses (closed by default; opens when a link's `#hash` points inside it). Anything can go
  inside, including tables and accordions. Used for the intranet's large expanding sections.
- **`band`** (full-width template): gray strip with 60px padding and a large heading; holds card groups.
- **`container` + `grid: N`**: N cards per row (Author Kit).

### 2.5 Blocks

| Block | Rows / cells | Notes |
|---|---|---|
| `accordion` | one row per item: question \| answer | Expand All / Collapse All added automatically. Tables in answers are written as lists (a table can't sit inside a block). |
| `table` | one row per table row; first row is the header | Author as rows; the block builds the table |
| `callout` / `callout (alert)` | one cell: **bold** title paragraph, then text | Blue info / yellow alert |
| `cta` | one cell: H3, text, **bold** link (button) | Gray call-to-action box |
| `quote` | one cell: quote, then attribution paragraph | |
| `card-resource` / `card-resource (video)` | one cell: H3 and image (either order), text, links | Video option draws a play button |
| `columns-aside` | one row: main text \| aside (box, video card, image, callout, call to action or shared fragment link) | Side by side from 900px |
| `columns-video`, `columns-image` | one row: text \| video thumbnail or image | Mission & Plan |
| `related-cards` | one row per card: image \| linked H3 + description | Photo tiles, 4/2/1 per row |
| `event` | label \| value rows: Type, Region, Title (H1), When, Where, Link, Details | Chip and calendar file come from metadata (§2.3); keep **When** in step with `Event Start/End` |
| `article-meta` | row 1: collection tag \| topic tags; row 2: date; optional row 3: list of office locations | Articles; locations show under the tags |
| `image-modal` / `image-modal (center)` | one row per tile: image \| title, then caption \| pop-up content | Tiles (3 per row) that open a pop-up as on the intranet; image cell last = image on the right of the pop-up; `center` for short rows. 30 pages (Check-in, Tech Award, Founders Award…) |
| `edition-pages` | one row per version: link to the version \| geographies it serves (or `manager` / `employee`) | The page at an edition topic's address; opens the reader's version (§2.7) |
| `welcome`, `news-grid`, `events` | homepage | `news-grid` has no content: it reads `/news/query-index.json`; `events` keeps its heading row and reads `/events/query-index.json` (authored event rows are only a fallback). Both filter by edition |
| `side-nav` | — | Added by the page script on side-nav pages; edit the menu fragment instead |
| `news-list` | row 1: heading (`News`); further rows (e.g. the `news-feedback` fragment link) go under the filters | `/news`: filters by topic, collection and location (Global and the reader's region first; an article's tag link adds its tag), 15 at a time. Filter lists are the `/news-filters` sheet (`topics`, `collections`, `locations`: `Name` \| `Tag`); articles come from the news index (`tags` = the article-meta tag links) |
| `stock` | row 1: heading; `Symbol` \| `ADBE`; `API key` \| the Barchart OnDemand key | Homepage rail: price, change and Barchart credit, loaded once per visit as on the intranet. The key is authored, never in code (the repo is public); "unavailable" means a wrong key or Barchart refusing the site |

**Buttons:** a **bold** link alone in a paragraph is a blue button. Don't make a whole paragraph
bold when it contains a link plus other text (it becomes a button and loses the text; §1).

### 2.6 Fragments

- **Section menu** (`/fragments/side-nav/<section>`): an H2 linking to the section landing page,
  then a bulleted list of links. The current page is highlighted automatically.
- **Shared content** (`/fragments/shared/<name>`): pages include it with a link to the fragment
  on its own line. Editing the fragment updates every page that uses it.
- **Submit boxes** (`/fragments/shared/news-feedback`, `/fragments/shared/event-submission`): `cta`
  blocks the page script adds beside every news article ("Got a story idea?", "News issue or
  feedback?") and every event page ("Want to Promote an Event?"). As on the intranet they sit in a
  left column from 1200px and are hidden on smaller screens. Edit the fragment to change them
  everywhere; don't add them to the pages.
- **Header / footer:** structure from PR #1 (brand section + nested menu list; footer columns, then
  legal links, then copyright, in that order). Their links point to the migrated pages (310 links;
  they pointed at the intranet until 2026-10-14). Menu headings link to `#`; keep it that way.

### 2.7 Editions

19 topics have one version per country (13) or per role (6). Each version is a normal page under
the topic (`/benefits-wellbeing/health-insurance/france`, `/career-growth/check-in/manager`);
the topic's own address is a small page with the `edition-pages` block listing its versions, each
with the geographies it serves. It opens the reader's version.

- **Edition picker** (header): the "United States" link opens "Change Your Edition" (81 offices and
  remote locations, "I'm a people manager"). The choice is kept in the browser; United States is
  the default. Picking a city (Paris) opens the country's version (France); the most specific
  geography wins (`global/apac/korea/seoul` before `global/apac`).
- **No match** (Norway, Serbia have editions but no versions): the topic page shows the list.
  `?versions` on a topic address shows the list too (for checking).
- **`/editions` sheet**: `locations` (Name, Group `office`/`remote`, Geography) feeds the picker;
  `topics` (Topic, Kind) lists the 19 topics. Add a location or topic there; add a version as a row
  in its topic page's `edition-pages` block (see the block's README).
- In the header fragment the picker is the link `/tools/widgets/edition`.
- **Homepage news and events** follow the edition too: only articles and events whose `Geography`
  is the reader's edition or contains it (`global` is for everyone). The events list shows the next
  three upcoming events from the `events` index, leaving out observances as the intranet did. Changing the edition updates both in place.

### 2.8 Preview and publish

Everything was previewed and published on 2026-10-14 (fragments, then pages, then PDFs and
`/redirects`). After editing, preview and publish from the DA editor or Sidekick as usual. For bulk
runs use the Admin API jobs (§4.3), fragments first.

---

## 3. Developer guide

### 3.1 Conventions

Read `AGENTS.md`. The repo is buildless, Baseline Newly available, min-width breakpoints at
600/900/1200px. `scripts/ak.js` (the shared engine) was **not** modified; project hooks live in
`scripts/scripts.js`.

### 3.2 Site code added in PR #3, #4, #6, #9 and #10

| Area | Files | Summary |
|---|---|---|
| Templates | `templates/{article,home,side-nav,event,full-width}` | CSS per page type, loaded from `Template` metadata |
| Side nav | `scripts/scripts.js` (`decorateArea`), `blocks/side-nav` | On side-nav pages, appends a section with the side-nav block; the block loads `/fragments/side-nav/<name>`, marks the current link, collapses on mobile |
| Submit boxes | `scripts/scripts.js` (`decorateArea`), `templates/article`, `templates/event` | On news and event pages, appends a section linking the shared fragment (§2.6); the template CSS puts that last section in a 285px left column from 1200px and hides it below. 27 older articles had no such column on the intranet; they get the boxes too |
| Collapsible sections | `blocks/section-metadata` | `style: collapsible` builds `<details>/<summary>` from the section |
| Fragment fix | `blocks/fragment/fragment.js` | A multi-section fragment that fills a whole section is inserted as page sections (it was a bare `main > div`, hidden by the base styles); test in `test/blocks/fragment.test.js` |
| New blocks | `accordion`, `article-meta`, `callout`, `columns-aside`, `cta`, `event`, `events`, `news-grid`, `quote`, `related-cards`, `welcome` | See §2.5; tests for `event`, `related-cards`, `fragment` |
| Changed blocks | `card-resource` (order, linked image, video), `table` (rows → table), `callout` (alert) | |
| Index | `helix-query.yaml` | `news` index → `/news/query-index.json` (title, subtitle, image, collection, date, geography); `events` index → `/events/query-index.json` (title, start, end, type, region, geography) |
| Styles | `styles/styles.css` | Blue pill primary button; H3 in text 16px below 900px |
| Article locations (PR #4) | `blocks/article-meta` | Optional third row: office locations, shown under the tags |
| Editions (PR #10) | `blocks/header/edition-picker.{js,css}`, `blocks/edition-pages`, `scripts/utils/edition.js`, `test/scripts/edition.test.js` | Picker loaded on first click from the header's edition link; `pickVersion()` matches an edition's geography to a version's tags (longest prefix) or the manager setting; tests cover matching and storage |
| Image pop-up tiles (PR #6) | `blocks/image-modal`, `test/blocks/image-modal.test.js` | Tiles open a native modal `<dialog>` (Escape, × or a click outside closes it, focus returns to the tile); the overlay starts below the fixed header so the panel sits 140px from the top, as on the intranet |
| Site settings | `scripts/scripts.js` | `hostnames`: `inside.adobe.com` (covers `preview.inside.adobe.com`) and the aem.page/aem.live hosts, so links to the site itself become relative; the intranet stays absolute. `locales`: US English only |

### 3.3 Import tooling (`tools/importer/`)

| File | Imports |
|---|---|
| `crawl/crawl.mjs` | Mirrors the intranet from a signed-in machine (see its README); `--retry-failed` crawls pages again that failed to load |
| `crawl/editions.mjs` | `--topics`: saves the 19 edition topics' AEM listings (`.1.json`) and writes the crawl list of their versions; no profile change. Without `--topics` it switches the picker's editions (changes your profile's edition; fallback only) |
| `import-side-nav.js` | Side-Nav pages; `?emit=menu` → section menu, `?emit=fragment&name=<n>` → shared fragment |
| `import-full-width.js` | Full-Width pages (related cards, bands) |
| `import-events.js` | Events; parses the date line into `Event Start/End/Time Zone` (all 246 parse; zone from the date line or the event's office); `Geography` |
| `import-news.js` | News articles: article-meta (tags, date, locations), image pop-ups inline, `Publication Date`, `Geography` |
| `import-home.js`, `import-cybersecurity-awareness-month-2026.js`, `import-adobe-*.js`, `import-employee-survey.js`, `import-nav.js`, `import-footer.js` | The first single pages, header, footer |
| `lib/inside-adobe-components.js` | Shared conversion by component type (droptab → collapsible sections, accordions, tables, callouts, cta, quote, boxes, flex groups → columns-aside, image pop-up tiles → image-modal, live tools → note, shared fragments) |
| `parsers/*.js`, `transformers/inside-adobe-cleanup.js` | Per-block parsers; site-wide cleanup (chrome removal, heading promotion, jump links, Outlook tracking, emphasis/link fix, line breaks at emphasis edges) |
| `shared-fragments.json` | Text fingerprint → name for the 54 shared experience fragments |

Things to know:

- **One document per URL:** the bulk runner saves one result per URL, hence the `?emit=` modes.
- **Components are matched by type**, never by position, so one script covers a whole template.
- **Shared fragments** are recognized by an FNV-1a fingerprint of their text (letters/digits only),
  computed on the saved HTML (the page's own scripts change the live DOM).
- **Tables**: any table inside a block, or a bare table in text, becomes a bogus block named after
  its first row. The importer turns accordion tables into labelled lists and text tables into
  `table` blocks; keep it that way.
- **Links in emphasis:** a link is taken out of any bold/italic run that also holds other text
  (nested runs and spans included), and out of a run it touches, so `decorateButton` can't turn the
  paragraph into a text-dropping button.
- **YouTube links** get `#_dnb`: they were links on the intranet, not embeds.
- **Intranet panel links** (`?flyouttab=employeeDirectory&uid=…`, profile, quick links, learning
  resources, notifications: 493 links, mostly people's names) point to
  `inside.corp.adobe.com/home.html?flyouttab=…`; the new site has no directory or profile panel.
- **Page names** are cleaned the way Edge Delivery names web paths (lowercase, runs of anything but
  letters and digits → one `-`, no `-` at either end); a document under any other name can't be
  previewed. Two intranet names that clean to an existing article get a country suffix (`RENAMED`
  in `lib/inside-adobe-components.js`). Links and redirects go through the same `sitePath`.
- **Bundles** (`*.bundle.js`), reports and imported content aren't committed.

### 3.4 How the migration was run (local)

1. Mirror pages fetched from the private repo via the GitHub API (the git endpoint timed out on the
   1.4 GB repo) into `.migration/mirror/` (git-ignored locally via `.git/info/exclude`).
2. Served on `127.0.0.1:8765` by `.migration/scripts/serve-mirror.py`, which adds a click guard
   (the runner's pop-up closer clicked "agreement" links and navigated away).
3. Bundled with `aem-import-bundle.sh`, imported with `run-bulk-import.js` per URL list.
4. Uploaded with the DA source API, **only to targets that didn't exist**, or that were unchanged
   since our own previous upload (checked document by document before replacing). The last bulk
   upload was 2026-10-14 13:31 UTC; later uploads were the 30 tile pages and Career Opportunities
   (each checked first). Documents edited by authors since are left alone. After the
   2026-10-14 re-save incident, all documents were restored (backup first) and 316 old-named
   documents removed, each checked against its backup.
5. Previewed and published with Admin API bulk jobs (`.migration/scripts/bulk_preview.py`).

### 3.5 Verification

- **Content completeness:** for every page, words visible in the source main column (all panels
  opened) vs words visible on the migrated page (all sections opened, fragments loaded).
  Side-Nav 311/360 ≥ 99% (all below 90% are live tools); Events 146/149 ≥ 95% and the rest fixed
  to 100%; Full-Width 84/86 ≥ 99% (event submission form is a tool note by decision); News
  281/281 ≥ 98.4%. After the 2026-10-14 cleanup fixes all templates were re-imported and re-checked:
  Events 143/149 ≥ 99%, Side-Nav 326/360, Full-Width 85/86; the only drops are office events lists
  that are now tool notes. The 93 re-crawl events: 92 at 100%, 1 at 97.9%.
- **Layout:** measured against the source at 1440/768/375px for each template (menu 285px, content
  927px at 1440, cards and chips to the pixel or within the container difference).
- **Rendering:** no error boxes, no horizontal overflow, no unknown blocks across all output.
- **Site sweep (2026-10-14):** all 970 pages rendered with the current code at 1440 and 390px
  (`.migration/scripts/sweep.cjs`): no blocks failing to load, no missing block code, no script
  errors. 32 pages scrolled sideways on phones (wide tables, long URLs, tiles in narrow sections),
  fixed in CSS. 13 pages carry empty, invisible links copied from the intranet (harmless).
- **Code:** eslint/stylelint clean; 152 tests pass (`dapreview` and one header test are flaky under load).
- **Homepage by edition:** the rule was checked against the intranet's own homepage for the US
  edition on 2026-10-12: the same 10 news articles qualify, and the events list picks the same 3
  events (observances left out, only events starting that day or later).
- **Preview:** the stored version of every page and fragment was checked for failed images:
  1,107 of 1,110 clean; the 3 others are the news images broken on the intranet itself (§1).

### 3.6 Local preview caveats

`aem up --html-folder content` keeps authored capitals in meta names (`Template`, not `template`)
and serves imported files under `/content`. Templates and the side nav therefore don't apply in a
plain local preview; a harness (`.migration/scripts/preview-sim.cjs`) simulates the live pipeline.
The live site lowercases meta names, so this doesn't affect production. With site authentication
on, `aem up` can't fetch the origin to wrap pages either; `.migration/scripts/local-pages.cjs` builds
each page from `head.html` and the imported `.plain.html` for the checks.

### 3.7 Mirror and crawl

- `node tools/importer/crawl/crawl.mjs` (signed in, VPN): resumable; `--news-archive` pages through
  the news feed; `--with-docs` downloads linked documents; `--urls` adds a list.
- Push only the `inside-mirror` folder to `adobecom/inside-adobe-mirror`; never `.crawl-profile`
  (it holds the signed-in session).
- The mirror's history was replaced with a single fresh commit on 2026-10-13 (§1).
- Editions: `editions.mjs --topics`, then `crawl.mjs --urls inside-mirror/_editions/urls.txt
  --with-docs --retry-failed`. Edition data and topic pages are rebuilt from the crawl by
  `.migration/scripts/build_editions.py` (versions, geography tags from each version's page).

---

## 4. Admin guide

### 4.1 Environments

| Environment | URL |
|---|---|
| Preview (main) | https://main--inside-adobe--adobecom.aem.page |
| Live (main) | https://main--inside-adobe--adobecom.aem.live |
| Authoring | https://da.live/#/adobecom/inside-adobe |

### 4.2 Content status (Admin API, 2026-10-15)

| Paths | Preview | Live |
|---|---|---|
| 1,456 pages (incl. 459 edition versions, 19 topic pages), 140 fragments | 200 | 200 |
| 1,357 PDFs under `/dam/…`, `/redirects.json`, `/editions.json` | 200 | 200 |
| `/news/query-index.json`, `/events/query-index.json` | 200 | 200 (filled by publishing the articles and events; both carry `geography`) |
| Office files and PDFs over 20 MB (§1) | not previewable | — |
| `/about-adobe/adobe-mission-and-plan`, `/about-adobe` | author edits in DA not previewed | older version |
| `/index` | author edit previewed | older version |

### 4.3 Admin API

```
POST https://admin.hlx.page/preview/adobecom/inside-adobe/main/{path}   # preview
POST https://admin.hlx.page/live/adobecom/inside-adobe/main/{path}      # publish
GET  https://admin.hlx.page/status/adobecom/inside-adobe/main/{path}    # status
POST https://admin.hlx.page/index/adobecom/inside-adobe/main/{path}     # (re)index a page
POST https://admin.hlx.page/cache/adobecom/inside-adobe/main/{path}     # purge live cache
```

For bulk operations POST `{"paths": [...], "forceUpdate": true}` to `…/preview/…/main/*` or
`…/live/…/main/*`; poll `GET /job/adobecom/inside-adobe/main/{preview|publish}/{job}` (publish
jobs are listed under `publish`, not `live`). Fragments before pages. The admin API rate-limits
(429) above a few parallel calls.

### 4.4 Access control

Site authentication is on: on 2026-10-14 preview, live and `content.da.live` returned 401 without
sign-in. Confirm the allowed users in the Config Service `access` settings. The production CDN
(`preview.inside.adobe.com`) authenticates to the origin with the site token, so it needs its own
access restriction before DNS is connected (§1).

### 4.5 Code sync

`main` serves merged code; branch previews serve their branch's code, so reviews can use the
branch URL (sign-in required).

### 4.6 Redirects

`config/cdn.yaml` configures a CDN 301 redirect from paths ending in `.html` to their
extensionless equivalent on `preview.inside.adobe.com`. Query strings are preserved;
`.plain.html` fragment requests are excluded. Deploy the `config` directory through the
Cloud Manager configuration pipeline for the domain (Edge Delivery pipeline for an Edge
Delivery Site, or Targeted Deployment > Config for a Publish environment). DA publication
and AEM Code Sync do not deploy this configuration. Keep `envTypes: ["prod"]` for Edge
Delivery, including the preview hostname.

After deployment, check that
`curl -I 'https://preview.inside.adobe.com/benefits-wellbeing/health-insurance/us.html?source=email'`
returns 301 with an extensionless Location retaining `?source=email`, the destination loads,
and `.plain.html` requests do not redirect. Extend the domain condition when the production
hostname is ready.

A second rule, `remove-legacy-prefix`, runs first: `/content/inside/en/<path>.html` (and
`/content/inside/en`, `/content/inside/en.html`) → `/<path>`. Renamed pages and moved documents
then resolve through the `/redirects` sheet. After deployment, check that
`curl -I 'https://preview.inside.adobe.com/content/inside/en/benefits-wellbeing/health-insurance/us.html'`
returns 301 to `/benefits-wellbeing/health-insurance/us`.

`/redirects` (DA sheet, columns Source, Destination, Note; Edge Delivery reads the first two).
Built by `.migration/scripts/build_redirects.py` from the crawl and the news feed:

| Rows | What |
|---|---|
| 42 | Intranet redirects between pages (e.g. `/global-safety/crisis-outage` → `/global-safety/office-building-security`) |
| 25 | Intranet pages and news items that redirected to another site (blog.adobe.com, max.adobe.com, Navan…) |
| 5 | News items that opened a PDF; the PDFs weren't crawled, so they still point to the intranet |
| 4 | `/home` → `/`, and three links already broken on the intranet with a clear new page (Founders Award, Tech Award, VIA) |
| 316 | Renamed pages: the intranet name (lowercased, e.g. `/collaboration/email---calendaring`) → the clean name |
| 1,858 | The 1,357 moved PDFs: old `/content/dam/…` address → `/dam/…`, as typed (lowercased), percent-encoded, and cleaned |

The 19 edition topics are pages (§2.7), so the intranet's redirects from a topic to its US or
employee version are not in the sheet.

Edge Delivery lowercases and cleans a request path before the redirect lookup (`/Home` finds
`/home`), so sources are lowercase. Redirects win over pages at the same path; none of the
sources is a migrated page. Preview and
publish `/redirects` like a page. Still dead (not redirected): office "activities" pages that
never existed (Ottawa, Denver, Los Angeles), `/adobe-life/communities…`, intranet search, a few
malformed source links and calendar files for events that weren't crawled.

### 4.7 News index

`helix-query.yaml` defines the `news` index (merged with PR #3). Publishing the articles on
2026-10-14 filled `/news/query-index.json` (checked: records carry title, subtitle, image,
collection, date). If the Config Service has its own index configuration, it overrides the file.
Re-index a page with the `index` Admin API call. News items that only redirected elsewhere
(§4.6) aren't pages, so they don't appear in the homepage feed.

### 4.8 Permissions and credentials

- DA uploads used the Adobe-credentials permission and GitHub access used a fine-grained token,
  both set in Settings → LLM Permissions. Revoke or rotate them when no longer needed.
- Commits are authored as Chris Peyer <cpeyer@adobe.com>.
- The mirror's manifest contained session cookies (§1); signing out invalidates that session.
