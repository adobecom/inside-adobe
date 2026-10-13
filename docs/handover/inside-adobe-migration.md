---
title: Inside Adobe on Edge Delivery — Migration Handover
date: 2026-10-13
---

# Inside Adobe on Edge Delivery — Migration Handover

This guide hands over the migration of the Inside Adobe intranet (`inside.corp.adobe.com`) to AEM
Edge Delivery Services. Content is authored in Document Authoring (DA); the code is an Author Kit
repository.

| | |
|---|---|
| **Organization / site** | `adobecom` / `inside-adobe` |
| **Repository** | https://github.com/adobecom/inside-adobe (public) |
| **Code** | PR #1 merged (Mission & Plan, header, footer). **PR #3 open**, branch `migrate/research-survey-news-home`: everything since. PR #2 (the first version of this guide) can be closed once PR #3 merges. |
| **Source copy** | Private repo `adobecom/inside-adobe-mirror`: a signed-in crawl of the intranet (US edition) |
| **Pages migrated** | **597 of ~660** intranet pages, in DA |
| **Published** | Nothing. 5 pages + header/footer were previewed early on; everything since is **upload only** |

---

## 1. Status and open items

### Do first

1. **Restrict access (security).** The repo is public and `*.aem.page` / `*.aem.live` are publicly
   readable unless site authentication is configured. The 5 early previews (homepage, Mission &
   Plan, Adobe Research, Employee Survey, the Cybersecurity article) and the header/footer are
   readable now without signing in. Configure site authentication (§4.4) **before previewing
   anything else**.
2. **Clean the mirror repo's history.** A failed download in the crawl stored the crawling user's
   intranet session cookies in `manifest.json`, and that commit is in `adobecom/inside-adobe-mirror`.
   Sign out of the intranet (ends that session), re-run the crawl (it now stores one-line errors and
   cleans old manifests), and replace the repo history with a fresh `git init` + force push (§3.7).
3. **Merge PR #3** after review. Until then the main preview has none of the new blocks or
   templates, and the homepage news grid has no index (§4.6).

### Migration progress

| Template (source) | Pages | Status |
|---|---|---|
| Side-Nav Page | 360 | In DA. Includes Mission & Plan, Adobe Research, Employee Survey (replaced with the Side-Nav versions on 2026-10-13; earlier versions backed up locally) |
| Event | 149 | In DA |
| Full-Width Page | 86 | In DA (44 section landing pages, 42 office pages) |
| Homepage | 1 | In DA, previewed |
| News Article | 1 of 62 crawled | In DA (Cybersecurity Awareness Month), previewed. **The rest and the full archive are waiting on the news re-crawl** (§3.7) |
| Shared content | 84 section menus, 54 shared fragments, header, footer | In DA |
| Images | ~1,000 | In DA under `/dam/…` (intranet DAM paths, lowercased) |

### Also outstanding

| Item | Detail |
|---|---|
| News archive | Re-crawl with `--news-archive --with-docs`, push the mirror, then import with the article template. |
| Linked documents | ~1,080 PDFs/Office files on the intranet DAM. Links still point to `inside.corp.adobe.com`; decision is to move them into DA and rewrite links (needs the `--with-docs` crawl). |
| Redirects | 47 old → new redirects plus 43 alias URLs were recorded by the crawl; not yet in a redirects sheet. |
| Other editions | Only the US edition was crawled (24 US-specific pages, e.g. `…/health-insurance/us`). Other countries deferred. |
| Production hostname, locales | `scripts/scripts.js` still has the template's `hostnames = ['authorkit.dev']` and template locale list. |
| Block library | New blocks aren't registered in the DA block library. |
| Live tools (by decision) | Café menus/hours, news listing, events calendar, holiday list, calendar filters, awards feed and the event submission form are replaced by a note linking to the intranet page. Stock quote and My Favorites (homepage) dropped. |
| Left out | Left-column "Need help?" box under some section menus; profile/search/tools rail; 5 section captions on 3 pages; 1 image missing from the crawl (`ovidiu-eftimie-286x343.png`). |
| Engine bug (upstream) | `ak.js` `decorateButton` turns a bold/italic run that holds a link *plus other text* into a button and drops the text. Worked around in the importer; report it upstream. |
| Flaky test | `dapreview > should load da.js module` fails intermittently under load (pre-existing). |

---

## 2. Authoring guide

### 2.1 Where content lives (DA)

| Content | DA path |
|---|---|
| Pages | same path as the intranet page without `/content/inside/en` and `.html`, e.g. `/benefits-wellbeing/health-insurance/us`, `/events/2026/10/<slug>`, `/news/2026/09/<slug>`; homepage `/index` |
| Images | `/dam/<intranet DAM path>` (lowercase), shared by all pages |
| Header / footer | `/fragments/nav/header`, `/fragments/nav/footer` |
| Section menus | `/fragments/side-nav/<section>` (e.g. `benefits-wellbeing`, `offices-san-jose`) |
| Shared content | `/fragments/shared/<name>` (e.g. `offices-printers`, `travel-paying-for-your-trip`) |

Edit at `https://da.live/edit#/adobecom/inside-adobe/<path>`.

### 2.2 Templates (page metadata `Template`)

| Template | Used for | What it does |
|---|---|---|
| `side-nav` | 360 section pages | Adds the section menu (left on desktop, a bar above the content on mobile); 1236px grid |
| `full-width` | 86 landing/office pages | 1236px grid; `band` sections (gray strips) |
| `event` | 149 event pages | More Events button top right; no section dividers |
| `article` | news | Narrower column, More News top right, normal-weight body links |
| `home` | homepage | Content + right rail layout from 1200px |

### 2.3 Page metadata

| Key | Where | Meaning |
|---|---|---|
| `Title` | all | Page title |
| `Template` | all | See §2.2 |
| `Side Nav` | side-nav pages, only when not the default | Menu name or path; default is the first path segment |
| `Publication Date` | articles | `YYYY-MM-DD`; drives the homepage news grid order |
| `Event Start` / `Event End` | events | `YYYY-MM-DD` (all day) or `YYYY-MM-DDTHH:MM`; date chip, "Multi Day", Add to Calendar |
| `Event Time Zone` | timed events | IANA zone, e.g. `America/Los_Angeles` (leave out → viewer's local time) |
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
| `article-meta` | row 1: collection tag \| topic tags; row 2: date | Articles |
| `welcome`, `news-grid`, `events` | homepage | `news-grid` has no content: it reads `/news/query-index.json` |
| `side-nav` | — | Added by the page script on side-nav pages; edit the menu fragment instead |

**Buttons:** a **bold** link alone in a paragraph is a blue button. Don't make a whole paragraph
bold when it contains a link plus other text (it becomes a button and loses the text; §1).

### 2.6 Fragments

- **Section menu** (`/fragments/side-nav/<section>`): an H2 linking to the section landing page,
  then a bulleted list of links. The current page is highlighted automatically.
- **Shared content** (`/fragments/shared/<name>`): pages include it with a link to the fragment
  on its own line. Editing the fragment updates every page that uses it.
- **Header / footer:** unchanged from PR #1 (brand section + nested menu list; footer columns, then
  legal links, then copyright, in that order).

### 2.7 Preview and publish

Nothing migrated since the first pages has been previewed. After site authentication is in place,
preview/publish in bulk via the Admin API (§4.3), fragments first, then pages.

---

## 3. Developer guide

### 3.1 Conventions

Read `AGENTS.md`. The repo is buildless, Baseline Newly available, min-width breakpoints at
600/900/1200px. `scripts/ak.js` (the shared engine) was **not** modified; project hooks live in
`scripts/scripts.js`.

### 3.2 Site code added in PR #3

| Area | Files | Summary |
|---|---|---|
| Templates | `templates/{article,home,side-nav,event,full-width}` | CSS per page type, loaded from `Template` metadata |
| Side nav | `scripts/scripts.js` (`decorateArea`), `blocks/side-nav` | On side-nav pages, appends a section with the side-nav block; the block loads `/fragments/side-nav/<name>`, marks the current link, collapses on mobile |
| Collapsible sections | `blocks/section-metadata` | `style: collapsible` builds `<details>/<summary>` from the section |
| Fragment fix | `blocks/fragment/fragment.js` | A multi-section fragment that fills a whole section is inserted as page sections (it was a bare `main > div`, hidden by the base styles); test in `test/blocks/fragment.test.js` |
| New blocks | `accordion`, `article-meta`, `callout`, `columns-aside`, `cta`, `event`, `events`, `news-grid`, `quote`, `related-cards`, `welcome` | See §2.5; tests for `event`, `related-cards`, `fragment` |
| Changed blocks | `card-resource` (order, linked image, video), `table` (rows → table), `callout` (alert) | |
| Index | `helix-query.yaml` | `news` index → `/news/query-index.json` (title, subtitle, image, collection, date) |
| Styles | `styles/styles.css` | Blue pill primary button; H3 in text 16px below 900px |

### 3.3 Import tooling (`tools/importer/`)

| File | Imports |
|---|---|
| `crawl/crawl.mjs` | Mirrors the intranet from a signed-in machine (see its README) |
| `import-side-nav.js` | Side-Nav pages; `?emit=menu` → section menu, `?emit=fragment&name=<n>` → shared fragment |
| `import-full-width.js` | Full-Width pages (related cards, bands) |
| `import-events.js` | Events; parses the date line into `Event Start/End/Time Zone` (all 149 parse) |
| `import-home.js`, `import-cybersecurity-awareness-month-2026.js`, `import-adobe-*.js`, `import-employee-survey.js`, `import-nav.js`, `import-footer.js` | The first single pages, header, footer |
| `lib/inside-adobe-components.js` | Shared conversion by component type (droptab → collapsible sections, accordions, tables, callouts, cta, quote, boxes, flex groups → columns-aside, live tools → note, shared fragments) |
| `parsers/*.js`, `transformers/inside-adobe-cleanup.js` | Per-block parsers; site-wide cleanup (chrome removal, heading promotion, jump links, Outlook tracking, emphasis/link fix) |
| `shared-fragments.json` | Text fingerprint → name for the 54 shared experience fragments |

Things to know:

- **One document per URL:** the bulk runner saves one result per URL, hence the `?emit=` modes.
- **Components are matched by type**, never by position, so one script covers a whole template.
- **Shared fragments** are recognized by an FNV-1a fingerprint of their text (letters/digits only),
  computed on the saved HTML (the page's own scripts change the live DOM).
- **Tables**: any table inside a block, or a bare table in text, becomes a bogus block named after
  its first row. The importer turns accordion tables into labelled lists and text tables into
  `table` blocks; keep it that way.
- **Bundles** (`*.bundle.js`), reports and imported content aren't committed.

### 3.4 How the migration was run (local)

1. Mirror pages fetched from the private repo via the GitHub API (the git endpoint timed out on the
   1.4 GB repo) into `.migration/mirror/` (git-ignored locally via `.git/info/exclude`).
2. Served on `127.0.0.1:8765` by `.migration/scripts/serve-mirror.py`, which adds a click guard
   (the runner's pop-up closer clicked "agreement" links and navigated away).
3. Bundled with `aem-import-bundle.sh`, imported with `run-bulk-import.js` per URL list.
4. Uploaded with the DA source API, **only to targets that didn't exist**, or that were unchanged
   since our own previous upload (checked document by document before replacing).

### 3.5 Verification

- **Content completeness:** for every page, words visible in the source main column (all panels
  opened) vs words visible on the migrated page (all sections opened, fragments loaded).
  Side-Nav 311/360 ≥ 99% (all below 90% are live tools); Events 146/149 ≥ 95% and the rest fixed
  to 100%; Full-Width 84/86 ≥ 99% (event submission form is a tool note by decision).
- **Layout:** measured against the source at 1440/768/375px for each template (menu 285px, content
  927px at 1440, cards and chips to the pixel or within the container difference).
- **Rendering:** no error boxes, no horizontal overflow, no unknown blocks across all output.
- **Code:** eslint/stylelint clean; 139 tests pass (the flaky `dapreview` aside).

### 3.6 Local preview caveats

`aem up --html-folder content` keeps authored capitals in meta names (`Template`, not `template`)
and serves imported files under `/content`. Templates and the side nav therefore don't apply in a
plain local preview; a harness (`.migration/scripts/preview-sim.cjs`) simulates the live pipeline.
The live site lowercases meta names, so this doesn't affect production.

### 3.7 Mirror and crawl

- `node tools/importer/crawl/crawl.mjs` (signed in, VPN): resumable; `--news-archive` pages through
  the news feed; `--with-docs` downloads linked documents; `--urls` adds a list.
- Push only the `inside-mirror` folder to `adobecom/inside-adobe-mirror`; never `.crawl-profile`
  (it holds the signed-in session).
- **History clean-up still to do** (§1): `cd inside-mirror && rm -rf .git && git init -b main &&
  git add . && git commit -m "Intranet mirror" && git remote add origin
  https://github.com/adobecom/inside-adobe-mirror.git && git push --force -u origin main`.

---

## 4. Admin guide

### 4.1 Environments

| Environment | URL |
|---|---|
| Preview (main) | https://main--inside-adobe--adobecom.aem.page |
| Live (main) | https://main--inside-adobe--adobecom.aem.live |
| PR #3 branch preview | https://migrate-research-survey-news-home--inside-adobe--adobecom.aem.page |
| Authoring | https://da.live/#/adobecom/inside-adobe |

### 4.2 Content status (Admin API, 2026-10-13)

| Paths | Preview | Live |
|---|---|---|
| `/index`, `/about-adobe/adobe-mission-and-plan`, `/about-adobe/adobe-research`, `/about-adobe/employee-survey`, `/news/2026/09/cybersecurity-awareness-month-2026`, `/fragments/nav/header`, `/fragments/nav/footer` | 200 (early previews; the three About previews still show the *old* single-page versions) | 404 |
| Everything else (590+ pages, 138 fragments) | 404 (DA only) | 404 |

### 4.3 Admin API

```
POST https://admin.hlx.page/preview/adobecom/inside-adobe/main/{path}   # preview
POST https://admin.hlx.page/live/adobecom/inside-adobe/main/{path}      # publish
GET  https://admin.hlx.page/status/adobecom/inside-adobe/main/{path}    # status
POST https://admin.hlx.page/index/adobecom/inside-adobe/main/{path}     # (re)index a page
POST https://admin.hlx.page/cache/adobecom/inside-adobe/main/{path}     # purge live cache
```

For bulk operations use the Admin API's bulk preview/publish jobs (or script per path), fragments
before pages.

### 4.4 Access control (action required)

Configure site authentication for preview and live (Config Service `access` settings, restricted to
Adobe IMS users) and confirm unauthenticated requests are rejected. Until then, don't preview.

### 4.5 Code sync

`main` serves merged code. The PR #3 branch preview serves the new code (verified), so reviews can
use the branch URL.

### 4.6 News index

`helix-query.yaml` defines the `news` index (PR #3). After merging, preview/publish the news pages
and check `/news/query-index.json`; if the Config Service has its own index configuration, it
overrides the file. Re-index a page with the `index` Admin API call.

### 4.7 Permissions and credentials

- DA uploads used the Adobe-credentials permission and GitHub access used a fine-grained token,
  both set in Settings → LLM Permissions. Revoke or rotate them when no longer needed.
- Commits are authored as Chris Peyer <cpeyer@adobe.com>.
- The mirror's manifest contained session cookies (§1); signing out invalidates that session.
