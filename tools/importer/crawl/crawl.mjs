/* eslint-disable no-console */
/**
 * Mirror the Inside Adobe intranet for migration: run on a signed-in machine (see README.md).
 * Saves each page as rendered, plus its images and stylesheets, under --out at the URL's path,
 * and writes manifest.json (one entry per page). Re-running resumes where it stopped.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
// eslint-disable-next-line import/no-unresolved
import { chromium } from 'playwright';

const { values: opts } = parseArgs({
  options: {
    start: { type: 'string', multiple: true, default: ['https://inside.corp.adobe.com/home.html'] },
    urls: { type: 'string' },
    out: { type: 'string', default: 'inside-mirror' },
    profile: { type: 'string', default: '.crawl-profile' },
    include: { type: 'string', default: '^https://inside\\.corp\\.adobe\\.com/' },
    exclude: { type: 'string', default: '/(search|profile|login|bin|libs|etc|apps|system)[/.]|/content/dam/' },
    max: { type: 'string', default: '5000' },
    concurrency: { type: 'string', default: '2' },
    delay: { type: 'string', default: '300' },
    'with-docs': { type: 'boolean', default: false },
    'no-follow': { type: 'boolean', default: false },
    headless: { type: 'boolean', default: false },
  },
});

const OUT = opts.out;
const include = new RegExp(opts.include);
const exclude = new RegExp(opts.exclude);
const DOC = /\.(pdf|docx?|xlsx?|pptx?|zip)$/i;
const sleep = (ms) => new Promise((r) => { setTimeout(r, ms); });
const exists = (f) => access(f).then(() => true, () => false);

// Pages are served both as /x.html and /content/inside/en/x.html; crawl the short form,
// remembering the long one in case the short form 404s
const LONG = /^\/content\/inside\/en(\.html|\/)/;
const longForm = {};

// Pages: strip hash and query (listing filters), keep .html or extension-less paths
function pageUrl(href, base) {
  try {
    const url = new URL(href, base);
    url.hash = '';
    url.search = '';
    const last = url.pathname.split('/').pop();
    if (!include.test(url.href) || exclude.test(url.pathname)) return null;
    if (last.includes('.') && !last.endsWith('.html')) return null;
    const long = url.href;
    url.pathname = url.pathname.replace(LONG, (m, end) => (end === '/' ? '/' : '/home.html'));
    if (url.pathname === '/') url.pathname = '/home.html';
    if (url.href !== long) longForm[url.href] ??= long;
    return url.href;
  } catch { return null; }
}

function filePath(href) {
  const { pathname } = new URL(href);
  const path = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  return join(OUT, decodeURIComponent(path));
}

async function save(file, data) {
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, data);
}

const statePath = join(OUT, 'manifest.json');
const state = await exists(statePath)
  ? JSON.parse(await readFile(statePath, 'utf8'))
  : { pages: {}, queue: [], assets: {} };
// re-normalize a queue saved by an earlier version of this script
state.queue = [...new Set(state.queue.map((u) => pageUrl(u)))].filter((u) => u && !state.pages[u]);
const seen = new Set([...Object.keys(state.pages).map((u) => pageUrl(u) || u), ...state.queue]);
const enqueue = (u) => {
  if (!u || seen.has(u)) return;
  seen.add(u);
  state.queue.push(u);
};
const persist = () => save(statePath, JSON.stringify(state, null, 1));

const { headless } = opts;
console.log(`Opening Chrome, checking sign-in at ${opts.start[0]} ...`);
const context = await chromium.launchPersistentContext(opts.profile, { headless, channel: 'chrome' })
  .catch(() => chromium.launchPersistentContext(opts.profile, { headless }));

// Sign in once in the window; the session stays in the --profile folder on this machine
const first = context.pages()[0] || await context.newPage();
await first.goto(opts.start[0], { waitUntil: 'domcontentloaded' });
if (!include.test(first.url()) || await first.locator('input[type="password"]').count()) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question('Sign in to the intranet in the browser window, then press Enter here... ');
  rl.close();
}
console.log('Signed in.');

const saved = Object.keys(state.pages).length;
if (!saved) {
  const sitemap = await context.request.get(new URL('/sitemap.xml', opts.start[0]).href).catch(() => null);
  const xml = sitemap?.ok() ? await sitemap.text() : '';
  [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].forEach(([, loc]) => enqueue(pageUrl(loc.trim())));
  console.log(xml ? 'Sitemap found' : 'No sitemap; following links from the start page');
}
if (opts.urls) (await readFile(opts.urls, 'utf8')).split(/\s+/).forEach((u) => enqueue(pageUrl(u)));
opts.start.forEach((u) => enqueue(pageUrl(u)));
console.log(saved
  ? `Resuming: ${saved} pages already saved, ${state.queue.length} to crawl`
  : `Starting: ${state.queue.length} URLs to crawl`);

// Ctrl+C: save progress first, so the next run resumes from here
process.on('SIGINT', async () => {
  console.log('\nStopping; saving progress...');
  await persist();
  process.exit(130);
});

// returns 'saved', 'exists', or an error; failed downloads are retried on the next run
async function download(href) {
  const file = filePath(href);
  if (state.assets[href] === 'ok' || await exists(file)) {
    state.assets[href] = 'ok';
    return 'exists';
  }
  const failed = (e) => ({ ok: () => false, status: () => e.message });
  const resp = await context.request.get(href).catch(failed);
  state.assets[href] = resp.ok() ? 'ok' : `error ${resp.status()}`;
  if (!resp.ok()) return state.assets[href];
  await save(file, await resp.body());
  return 'saved';
}

async function crawl(page, url) {
  const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (resp?.status() === 404) return { finalUrl: page.url(), status: 404 };
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
  // scroll in steps so lazy images load
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => { setTimeout(r, 100); });
    }
  });
  await page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {});

  const finalUrl = page.url();
  const info = await page.evaluate(() => {
    const meta = (n) => document.querySelector(`meta[name="${n}"]`)?.content || '';
    const urls = new Set();
    document.querySelectorAll('img, source').forEach((el) => {
      ['src', 'data-src'].forEach((a) => el.getAttribute(a) && urls.add(el.getAttribute(a)));
      (el.getAttribute('srcset') || '').split(',').forEach((s) => s.trim() && urls.add(s.trim().split(/\s+/)[0]));
    });
    document.querySelectorAll('link[rel="stylesheet"]').forEach((l) => urls.add(l.getAttribute('href')));
    document.querySelectorAll('[style*="url("]').forEach((el) => {
      [...el.getAttribute('style').matchAll(/url\(["']?([^"')]+)/g)].forEach(([, u]) => urls.add(u));
    });
    return {
      title: document.title,
      template: meta('template'),
      pageType: meta('pageType'),
      publishDate: meta('articlePublishDate'),
      links: [...document.querySelectorAll('a[href]')].map((a) => a.href),
      assets: [...urls].map((u) => new URL(u, document.baseURI).href),
    };
  });

  const file = filePath(finalUrl.endsWith('.html') || finalUrl.endsWith('/') ? finalUrl : `${finalUrl}.html`);
  await save(file, await page.content());
  const sameHost = (u) => new URL(u).host === new URL(finalUrl).host;
  for (const a of info.assets.filter(sameHost)) await download(a);
  const docs = [...new Set(info.links.filter((l) => DOC.test(new URL(l).pathname)))];
  if (opts['with-docs']) for (const d of docs.filter(sameHost)) await download(d);
  if (!opts['no-follow']) info.links.forEach((l) => enqueue(pageUrl(l)));

  return {
    finalUrl,
    status: resp?.status(),
    title: info.title,
    template: info.template,
    pageType: info.pageType,
    publishDate: info.publishDate,
    file,
    docs,
  };
}

const max = Number(opts.max);
let active = 0;
const worker = async () => {
  const page = await context.newPage();
  while ((state.queue.length || active) && Object.keys(state.pages).length < max) {
    const url = state.queue.shift();
    if (url) {
      active += 1;
      try {
        state.pages[url] = await crawl(page, url);
        if (state.pages[url].status === 404 && longForm[url]) {
          state.pages[url] = await crawl(page, longForm[url]);
        }
      } catch (e) {
        state.pages[url] = { error: e.message };
      }
      active -= 1;
      const done = Object.keys(state.pages).length;
      console.log(`[${done}] ${state.pages[url].error ? 'FAILED' : 'saved '} ${url} (${state.queue.length} queued)`);
      if (done % 10 === 0) await persist();
    }
    // with an empty queue, wait: other workers may still be adding links
    await sleep(url ? Number(opts.delay) : 500);
  }
  await page.close();
};

await Promise.all(Array.from({ length: Number(opts.concurrency) }, worker));
if (opts['with-docs']) {
  // documents linked from pages saved in earlier runs
  const { host } = new URL(opts.start[0]);
  const docs = [...new Set(Object.values(state.pages).flatMap((p) => p.docs || []))]
    .filter((u) => new URL(u).host === host);
  console.log(`Documents: ${docs.length} linked from saved pages`);
  const count = { saved: 0, exists: 0, failed: 0 };
  for (const [i, d] of docs.entries()) {
    const result = await download(d);
    const key = ['saved', 'exists'].includes(result) ? result : 'failed';
    count[key] += 1;
    const n = `[${i + 1}/${docs.length}]`;
    if (key === 'saved') console.log(`${n} saved  ${d}`);
    if (key === 'failed') console.log(`${n} FAILED ${d} (${result})`);
    if (key === 'exists' && (i + 1) % 50 === 0) console.log(`${n} ...`);
    if ((i + 1) % 25 === 0) await persist();
  }
  console.log(`Documents: ${count.saved} downloaded, ${count.exists} already saved, ${count.failed} failed`);
}
await persist();
await context.close();
const pages = Object.values(state.pages);
const ok = pages.filter((p) => p.status === 200).length;
console.log(`Done: ${ok} pages saved, ${pages.length - ok} failed or not found, ${Object.keys(state.assets).length} files. Manifest: ${statePath}`);
