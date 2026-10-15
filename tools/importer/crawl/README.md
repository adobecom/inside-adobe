# Intranet crawl

Mirrors Inside Adobe for migration. The intranet is only reachable signed in, on Adobe's network,
so this runs on your machine; the migration then works from the copy.

## What it saves

- Every page it can reach, as rendered after load (lazy images included), at its URL path:
  `inside-mirror/content/inside/en/news/2026/09/….html`
- The images and stylesheets those pages use, also at their URL paths (`inside-mirror/content/dam/…`)
- `inside-mirror/manifest.json`: one entry per page (final URL, status, title, AEM template, page
  type, publish date, linked documents, or the error)

It starts from the sitemap if there is one, plus the homepage, and follows links on the intranet.
Search, profile and system paths are skipped. Query strings are dropped, so listing filters
(`news.html?tagtype=…`) are not crawled separately.

## Run it

You need Node 20+, Google Chrome, and VPN.

```sh
npm install --no-save playwright
node tools/importer/crawl/crawl.mjs
```

1. A Chrome window opens. Sign in to the intranet there, then press Enter in the terminal.
2. Leave it running. It saves as it goes; if it stops (or you press Ctrl+C), run the same command
   again to resume.
3. If your session expires mid-run, sign in again in the window and re-run.

Useful options:

| Option | Default | |
| --- | --- | --- |
| `--out <dir>` | `inside-mirror` | Where the copy goes |
| `--urls <file>` | | Extra start URLs, one per line (for example an AEM page list) |
| `--start <url>` | homepage | Start page (repeatable) |
| `--max <n>` | `5000` | Stop after this many pages |
| `--concurrency <n>` | `2` | Pages loaded at once; keep it low to be polite |
| `--with-docs` | off | Also download linked PDFs and Office files from the DAM (works on a finished crawl too: re-run with it to fetch just the documents) |
| `--no-follow` | off | Only crawl the start URLs / list, don't follow links |
| `--news-archive` | off | Page through the news listing's feed and crawl every article in it, including ones nothing links to; raw feed responses go in `_feeds/` |
| `--retry-failed` | off | Crawl pages again that failed to load last time (network errors; 404s stay) |

A first test run: `node tools/importer/crawl/crawl.mjs --max 50`.

## Other editions

19 topics send each person to their own version: 13 by country (health insurance, time off,
payroll, computers…; up to 37 countries each) and 6 by role (check-in, promotions…; `default` and `manager`).
`editions.mjs --topics` lists every version without changing anything in your profile:

```sh
node tools/importer/crawl/editions.mjs --topics  # no switching: topic pages, listings, urls.txt
node tools/importer/crawl/crawl.mjs --urls inside-mirror/_editions/urls.txt --with-docs --retry-failed
```

`--topics` reads each topic's child pages (country and manager versions) from AEM's page listing
(`.1.json`) and writes them to `urls.txt`. Without `--topics` the script instead switches through
the picker's editions (`--probe` tries two); that changes your profile's edition, so it's only a
fallback.

Results go in `inside-mirror/_editions/` (`probe.json` / `editions.json`, `urls.txt`). They hold
edition names, page addresses and the names (not values) of cookies or storage keys that change.
Switching changes the edition saved in your intranet profile (no cookie is involved); if a run
stops early, switch your edition back in the intranet's header.

## Sharing the result

Share **only the `inside-mirror` folder**, by pushing it to the private mirror repository (never to
this site repository, which is public). Do **not** share `.crawl-profile`:
it holds your signed-in browser session. Both folders are git-ignored.

Pages are saved as you see them, so personalized bits (your name, favorites, profile picture) are
in the copy; the import drops them, but keep the copy internal.
