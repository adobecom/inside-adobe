---
title: Inside Adobe on Edge Delivery — Migration Handover
date: 2026-10-09
---

# Inside Adobe on Edge Delivery — Migration Handover

This guide hands over the first page migrated from the Inside Adobe intranet to AEM Edge Delivery Services. It covers the page itself, the site-wide design, and the global header and footer. Content is authored in Document Authoring (DA). The code is an Author Kit repository.

| | |
|---|---|
| **Organization / site** | `adobecom` / `inside-adobe` |
| **Repository** | https://github.com/adobecom/inside-adobe |
| **Code** | Merged to `main` via pull request #1 (merge commit `d839414`; migration commit `e274f4b`) |
| **Migrated page** | `/about-adobe/adobe-mission-and-plan` (source: `inside.corp.adobe.com/content/inside/en/about-adobe/adobe-mission-and-plan.html`) |
| **Shared fragments** | `/fragments/nav/header`, `/fragments/nav/footer` |
| **Content status** | Uploaded to DA and previewed; **not published**; preview is publicly readable |

---

## 1. Status and open items

### Do first

1. **Restrict access before sharing any links (security).** The original page sits behind Adobe SSO, and the footer is labelled "Adobe Confidential". The previewed page currently loads without signing in at `https://main--inside-adobe--adobecom.aem.page/about-adobe/adobe-mission-and-plan`. Configure site authentication for preview (and live) before publishing or sharing URLs (see §4.4).
2. **Publish** the page, header and footer once access control is in place (§2.6). All three are previewed; none is live yet.
3. **Set the production hostname and locales** in `scripts/scripts.js` (still the template's `authorkit.dev` and template locale list; see below).

### Also outstanding

| Item | Detail |
|---|---|
| Production hostname | `scripts/scripts.js` still has the template's `hostnames = ['authorkit.dev']`. Set the real production host(s) so links are treated as internal correctly. |
| Locales | `scripts/scripts.js` still lists the template locales (`/de`, `/es`, `/fr`, `/hi`, `/ja`, `/zh`). Trim them to what Inside Adobe needs. |
| Branch code sync | Before the merge, the branch preview served content but no code (404 for `scripts/ak.js`) while `main` worked. Confirm the AEM Code Sync app handles branch pushes before relying on branch previews (§4.3). |
| Block library | `columns-video`, `columns-image` and `card-resource` aren't registered in the DA block library yet. |
| Block READMEs | The three new blocks' `README.md` files are generic and say "one row, one cell". Replace them with the structures in §2.3. |
| Live features left out | Tools rail (Profile, Quick Links, Notifications, Learning Resources, Employee Directory), the intranet search box and the profile avatar weren't migrated: they load live, signed-in data. The edition picker is a plain link to the office directory. |
| Left side navigation | The source page's "About Adobe" section nav wasn't migrated. |
| Images | The page images are JPEG renditions from the saved export, not the original PNGs from the AEM DAM. Replace them if higher fidelity is needed. |
| Absolute intranet links | Download links (PDF/PPTX) and the "Adobe's values" link still point to `inside.corp.adobe.com`. Re-point them as those pages and assets migrate. |
| Intermittent tests | Two existing tests occasionally fail under load: `dapreview > should load da.js module` and `action state > resets the language trigger…`. Both pass on re-run and exercise code untouched by this migration. |

---

## 2. Authoring guide

### 2.1 Where content lives (DA)

| Content | DA path | Edit link |
|---|---|---|
| Mission & Plan page | `/about-adobe/adobe-mission-and-plan` | https://da.live/edit#/adobecom/inside-adobe/about-adobe/adobe-mission-and-plan |
| Page images (11) | `/about-adobe/media/` | — |
| Header | `/fragments/nav/header` | https://da.live/edit#/adobecom/inside-adobe/fragments/nav/header |
| Footer | `/fragments/nav/footer` | https://da.live/edit#/adobecom/inside-adobe/fragments/nav/footer |
| Header/footer icons (3 SVGs) | `/fragments/nav/` | — |

### 2.2 Page structure

The page is made of sections separated by horizontal rules (`---`). Most content is plain text that authors type directly. Blocks are used only for side-by-side layouts and the resource cards.

| # | Section | Built with |
|---|---|---|
| 1 | Title and "Jump to" links | Default content (H1 + paragraph of links) |
| 2 | Intro text with the Shantanu video | `columns-video` |
| 3 | Mission & Plan — all on one page | Default content (H2, text, image, download links) |
| 4 | Our Mission | Default content + `columns-video` + image + download links |
| 5–8 | Values, What we do, Audience strategy, FY26 Must Wins | One `columns-image` each |
| 9 | Videos | H2 + `columns-video` (video on the left) |
| 10 | Resources | H2 + two `card-resource` blocks + Section Metadata |

**Jump links:** headings get automatic ids from their text, e.g. "Our Company Values" → `#our-company-values`. If you rename a heading, update its "Jump to" link to match.

### 2.3 Blocks

**columns-video** — text beside a linked video thumbnail.

| columns-video | |
|---|---|
| Text: paragraphs or a bulleted list | Thumbnail image **linked** to the video URL, followed by an H3 caption |

- Put the cells in either order; the video column is detected automatically (it's the cell whose link wraps a picture).
- The play button is drawn by the block; don't add a play-icon image.
- Videos link out (e.g. to `iatv.adobe.com`); they aren't embedded.

**columns-image** — text beside an image.

| columns-image | |
|---|---|
| H2 heading, paragraphs, download links | Image only |

From 900px the two columns sit side by side at equal width; below that they stack (text first).

**card-resource** — a boxed resource card. Use one block per card.

| card-resource |
|---|
| H3 title, image, optional paragraph, bulleted list of links |

The title is always shown above the image.

### 2.4 Section Metadata

The Resources section uses a Section Metadata table to place its two cards side by side:

| Section Metadata | |
|---|---|
| grid | 2 |
| style | container |

`grid` sets the number of cards per row; `style: container` keeps the grid within the page content width. The local file preview doesn't apply Section Metadata (the table appears as text); the real preview at `aem.page` does.

### 2.5 Header and footer content

**Header** (`/fragments/nav/header`), two sections:

1. **Brand:** first paragraph = logo image linked to the intranet home; second = globe icon + "United States" linked to the office directory; third = a link to `/tools/widgets/toggle` (the mobile menu button — keep it).
2. **Menus:** one nested bulleted list. Level 1 = menu name (link `#`); level 2 = section headings (each a link); level 3 = the links under a heading. Level 3 shows as a second column on desktop and is hidden on mobile.

**Footer** (`/fragments/nav/footer`), sections in this order:

1. One section per column: H2 heading + bulleted list of links (currently 4 columns).
2. **Second to last:** globe + "United States" link, then a bulleted list of legal links.
3. **Last:** the copyright line.

The footer code relies on this order: the last section is treated as copyright and the second to last as legal. Add or remove columns before those two.

### 2.6 Preview and publish

1. Edit in DA, then use the Sidekick **Preview** button (or `aem.page` URL) to check.
2. **Publish** when ready. Publish the header and footer fragments as well as the page — pages pick them up from the published fragments.
3. Images uploaded to DA are referenced by their DA content URLs; no separate image publishing is needed.

---

## 3. Developer guide

### 3.1 Conventions

Read `AGENTS.md` first. Key points: the repo is buildless (every line ships), the browser baseline is "Baseline Newly available", breakpoints are min-width only at 600/900/1200px, and `scripts/ak.js` is the shared engine and was **not** modified. Decisions are recorded in `docs/adr/`.

### 3.2 What changed (commit `e274f4b`, merged in pull request #1)

| Area | Files | Summary |
|---|---|---|
| Design tokens | `styles/styles.css` | adobe-clean font stack; text `#2f2f2f`, links `#0265dc` bold (no underline, underline on hover); heading scale 36/24/20px (H2 20px below 900px); body 16px, 20px from 900px; content width `min(83.4%, 960px)`; section padding with grey `#d3d3d3` dividers; `--header-height` 72px (88px ≥1200px). Montserrat `@font-face` rules removed (font files left on disk). |
| Font loading | `scripts/postlcp.js` | Loads the Adobe Fonts kit `toa0oji` (contains adobe-clean) after LCP, matching the existing `body.session` font switch, so fonts never block first paint. |
| Section colour | `blocks/section-metadata/section-metadata.css` | `.section > *` now uses `var(--color-text)` instead of hard-coded black/white. |
| New blocks | `blocks/columns-video`, `blocks/columns-image`, `blocks/card-resource` | See §2.3. Each is a few lines of `init(el)` plus CSS. |
| Header | `blocks/header/header.js`, `header.css` | See §3.3. |
| Footer | `blocks/footer/footer.js`, `footer.css` | See §3.4. |
| Tests | `test/blocks/header.test.js`, `footer.test.js` | The two "header/footer source" tests now assert the *first* path requested (the local-preview fallback may add a second request). |
| Import tooling | `tools/importer/` | See §3.6. |

### 3.3 Header block

- **Content model:** Author Kit's — brand section, then main-nav section; the mobile toggle widget sits in the brand section because only the brand row is visible when the mobile header is collapsed.
- **Desktop (≥1200px):** 80px white bar + 8px `#eb1000` bottom border. Menus open on hover (`mouseenter`) and toggle on click; close on `mouseleave`, outside click or Escape. Each menu is a 380px `#f4f6fa` column of section headings; hovering (or focusing) a heading reveals a 380px white second column. Near the right edge, `align()` adds `menu-flip` (second column opens leftward) or `menu-end` (whole panel right-anchored, so it never leaves the viewport). Label size, padding and right gutter are fluid between 1200 and 1440px so the 7 menus fit on one line.
- **Mobile (<1200px):** 64px bar with a three-bar hamburger that morphs into an × (0.2s); a full-width drawer of 80px rows with chevrons, single-expand accordion showing two levels, over a 40% black backdrop that closes the drawer when clicked. Escape first collapses an open item, then closes the drawer.
- **Bug fix:** in the open drawer, `focusout` no longer collapses items — it shifted the layout mid-tap so taps missed the next item.
- **`dropdown` class:** the menu wrapper carries `menu dropdown`; only `menu` is used for styling.

### 3.4 Footer block

- `footer.js` keeps the Author Kit contract (last section = copyright, second to last = legal), then wraps the columns in `.footer-main` (charcoal `#191c1f`) and legal + copyright in `.footer-bar` (black).
- **Desktop (≥900px):** four columns in a 989px area (1236px from 1200px); uppercase white headings over a 1px `#a8a8a8` rule; bulleted links `#838383`. No hover effect (matches the source).
- **Mobile (<900px):** each heading is wrapped in a `<button aria-expanded>` that toggles its list; the buttons are created only below 900px and unwrapped on desktop (`syncColumns` on breakpoint change). The bottom band stacks and centres.

### 3.5 Fragment loading in local previews

`header.js` and `footer.js` first load `${locale.prefix}/fragments/nav/{header|footer}`. If that fails, they retry `/content…`, because `aem up --html-folder content` serves imported files under `/content`. On the live site the first request succeeds, so the fallback never runs.

### 3.6 Import tooling

The source page is behind Adobe SSO, so all imports ran from a **saved export** served locally (`http://127.0.0.1:8765/adobe-mission-and-plan.html`), with the export's scripts stripped and images renamed to their original slots.

| Script | Output |
|---|---|
| `import-adobe-mission-and-plan.js` (+ `parsers/`, `transformers/`) | `/about-adobe/adobe-mission-and-plan` |
| `import-nav.js` | `/fragments/nav/header` |
| `import-footer.js` | `/fragments/nav/footer` |

- `page-templates.json` holds the block and section selectors (positional `:nth-of-type` selectors; all blocks are resolved before any parser runs).
- The cleanup transformer removes chrome, promotes topic H4s to H2, rewrites the jump links and strips the " | Inside Adobe" title suffix. The sections transformer adds section breaks and Section Metadata.
- `import-nav.js` and `import-footer.js` read `payload.html` because the importer strips `<nav>`/`<footer>` from the live document.
- To re-run, serve an export at the same local URL and use the excat content-import scripts (`aem-import-bundle.sh` then `run-bulk-import.js`). Bundles (`*.bundle.js`) and reports are generated and not committed.

### 3.7 Verification done

- Content: word-level diff of the source content column vs the import — no missing words, all 11 images, no missing links.
- Visual: page-level critique at 1440px and 375px, every block at 100% after fixes; desktop and mobile side-by-side comparisons.
- Header: all 7 menus, 46 headings and 279 links identical and in order; panel widths and positions within 1px of the source where the source stays on screen; hover/click/Escape/keyboard behaviour; mobile coverage of all 7 items.
- Footer: structure 100%, appearance (including gutters) passing, 18/19 behaviours identical (the edition link is a deliberate change).
- `npm run lint` clean; test suite 133 tests (see the intermittent tests in §1).

---

## 4. Admin guide

### 4.1 Environments

| Environment | URL |
|---|---|
| Preview (main) | https://main--inside-adobe--adobecom.aem.page |
| Live (main) | https://main--inside-adobe--adobecom.aem.live |
| Branch preview | `https://{branch}--inside-adobe--adobecom.aem.page` |
| Authoring | https://da.live/#/adobecom/inside-adobe |

### 4.2 Current content status (Admin API, 2026-10-09)

| Path | Preview | Live |
|---|---|---|
| `/about-adobe/adobe-mission-and-plan` | 200 (previewed 15:45 GMT) | 404 (not published) |
| `/fragments/nav/header` | 200 (previewed 15:45 GMT) | 404 |
| `/fragments/nav/footer` | 200 (previewed 15:45 GMT) | 404 |

Admin API operations (authenticated):

```
POST https://admin.hlx.page/preview/adobecom/inside-adobe/main/{path}   # preview
POST https://admin.hlx.page/live/adobecom/inside-adobe/main/{path}      # publish
GET  https://admin.hlx.page/status/adobecom/inside-adobe/main/{path}    # status
POST https://admin.hlx.page/cache/adobecom/inside-adobe/main/{path}     # purge live cache
```

### 4.3 Code sync

`main` serves the merged code (verified 2026-10-09: new block files and the font-loading change are live on `main--inside-adobe--adobecom.aem.page`). Before the merge, the feature branch's preview served no code at all (404 for `scripts/ak.js`). Check that the AEM Code Sync GitHub app is installed for `adobecom/inside-adobe` and processes branch pushes, so branch previews can be used for review.

### 4.4 Access control (action required)

The source is internal (Adobe SSO, "Adobe Confidential"). Edge Delivery preview and live sites are public unless site authentication is configured. Before publishing or sharing URLs, configure authentication for the site (Config Service `access` settings for preview and live, e.g. restricting to Adobe IMS users), and confirm unauthenticated requests are rejected. Reading the site configuration returned 403 for this session, so the current settings couldn't be verified.

### 4.5 Permissions used during migration

- DA uploads used the Adobe-credentials permission in the agent's Settings → LLM Permissions. Revoke it there when no longer needed.
- The commit was authored as Chris Peyer <cpeyer@adobe.com>; the branch was pushed with the repository's configured credentials.
