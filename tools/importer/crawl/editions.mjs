/* eslint-disable no-console */
/**
 * Find the intranet's edition-specific pages (see README.md): switch to each edition in the
 * header's edition picker, record where the edition-routed topics land, then switch back.
 *   --probe   two editions only, plus a check whether the home page text changes per edition
 * Writes <out>/_editions/editions.json (editions, landing URL per topic) and urls.txt (pages to
 * crawl with crawl.mjs --urls). Stores edition names and page URLs only: no cookie or storage
 * values.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { parseArgs } from 'node:util';
// eslint-disable-next-line import/no-unresolved
import { chromium } from 'playwright';

const { values: opts } = parseArgs({
  options: {
    out: { type: 'string', default: 'inside-mirror' },
    profile: { type: 'string', default: '.crawl-profile' },
    probe: { type: 'boolean', default: false },
    headless: { type: 'boolean', default: false },
  },
});

const SITE = 'https://inside.corp.adobe.com';
// topics that send each person to their edition's page (…/us, …/default on the US edition)
const TOPICS = [
  '/benefits-wellbeing/discounts', '/benefits-wellbeing/emotional-wellbeing', '/benefits-wellbeing/espp',
  '/benefits-wellbeing/health-insurance', '/benefits-wellbeing/physical-wellbeing',
  '/benefits-wellbeing/retirement-financial', '/benefits-wellbeing/time-off', '/compensation-pay/lti',
  '/compensation-pay/payroll', '/compensation-pay/sti', '/computers-devices/hw-standards', '/travel/reservations',
  '/career-growth/check-in', '/career-growth/promotions', '/career-growth/rewards', '/hybridwork/managers',
  '/managing-at-adobe/people-leader-hub', '/university/managers',
];
const DIR = join(opts.out, '_editions');
const brief = (msg) => String(msg).split('\n')[0].slice(0, 160);

const context = await chromium.launchPersistentContext(opts.profile, { headless: opts.headless, channel: 'chrome' })
  .catch(() => chromium.launchPersistentContext(opts.profile, { headless: opts.headless }));
const page = context.pages()[0] || await context.newPage();
await page.goto(`${SITE}/home.html`, { waitUntil: 'domcontentloaded' });
if (!page.url().startsWith(SITE) || await page.locator('input[type="password"]').count()) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  await rl.question('Sign in to the intranet in the browser window, then press Enter here... ');
  rl.close();
  await page.goto(`${SITE}/home.html`, { waitUntil: 'domcontentloaded' });
}
await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});

const current = async () => {
  const visible = page.locator('.gnav-edition:visible').first();
  const button = await visible.count() ? visible : page.locator('.gnav-edition').first();
  return (await button.textContent().catch(() => '') || '').trim();
};

// open the picker and read the editions (the lists are filled in by the site's script)
async function openPicker() {
  // the header has a desktop and a mobile edition button; only one is visible
  const button = page.locator('.gnav-edition:visible').first();
  if (await button.count()) await button.click();
  else await page.locator('.gnav-edition').first().evaluate((el) => el.click());
  const modal = page.locator('.edition-modal:visible').first();
  await modal.waitFor({ state: 'visible', timeout: 15000 });
  for (const b of await modal.locator('.accordion-heading[aria-expanded="false"]:visible').all()) await b.click();
  await page.waitForFunction(
    () => document.querySelectorAll('.edition-list-office li, .edition-list-remote li').length > 0,
    null,
    { timeout: 15000 },
  );
}
async function readEditions() {
  await openPicker();
  return page.evaluate(() => [...document.querySelectorAll('.edition-list-office li, .edition-list-remote li')].map((li) => {
    const target = li.querySelector('a, button, [role="button"], input') || li;
    return {
      name: li.textContent.trim().replace(/\s+/g, ' '),
      group: li.closest('.edition-list-office') ? 'office' : 'remote',
      tag: target.tagName.toLowerCase(),
      href: target.getAttribute?.('href') || '',
      // attribute names and non-URL values describe how the site switches (no personal data here)
      attrs: Object.fromEntries([...target.attributes].filter((a) => /^(data-|value|id|name)/.test(a.name)).map((a) => [a.name, a.value])),
    };
  }));
}

// names only: which cookies / storage keys change when the edition changes
const cookieNames = async () => new Set((await context.cookies(SITE)).map((c) => c.name));
const storageKeys = () => page.evaluate(() => [
  ...Object.keys(localStorage), ...Object.keys(sessionStorage),
]);

async function switchTo(edition) {
  await page.goto(`${SITE}/home.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  await openPicker();
  // exact name, so "United States" can't pick a longer name that contains it
  const exact = new RegExp(`^\\s*${edition.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`);
  const item = page.locator('.edition-modal:visible li').filter({ hasText: exact }).first();
  const target = item.locator('a, button, [role="button"], input').first();
  await Promise.all([
    page.waitForLoadState('load', { timeout: 30000 }).catch(() => {}),
    (await target.count() ? target : item).click(),
  ]);
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  return current();
}

async function landings() {
  const out = {};
  for (const t of TOPICS) {
    try {
      const resp = await page.goto(`${SITE}${t}.html`, { waitUntil: 'domcontentloaded', timeout: 60000 });
      out[t] = { url: page.url().replace(SITE, ''), status: resp?.status() };
    } catch (e) { out[t] = { error: brief(e.message) }; }
  }
  return out;
}

const homeText = async () => {
  await page.goto(`${SITE}/home.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 20000 }).catch(() => {});
  return page.evaluate(() => document.querySelector('main, #main, body').innerText.replace(/\s+/g, ' ').slice(0, 4000));
};

const original = await current();
console.log(`Current edition: ${original || '(not shown)'}`);
const editions = await readEditions();
console.log(`Editions in the picker: ${editions.length} (${editions.filter((e) => e.group === 'office').length} offices, ${editions.filter((e) => e.group === 'remote').length} remote)`);
const home0 = await homeText();
const cookies0 = await cookieNames();
const storage0 = new Set(await storageKeys());

const todo = editions.filter((e) => e.name !== original);
const run = opts.probe ? todo.slice(0, 2) : todo;
const result = {
  original, editions, probe: opts.probe, switching: {}, landings: {}, homeChanges: {},
};
result.landings[original || 'current'] = await landings();
await mkdir(DIR, { recursive: true });
const persist = () => writeFile(join(DIR, opts.probe ? 'probe.json' : 'editions.json'), JSON.stringify(result, null, 1));

for (const [i, e] of run.entries()) {
  try {
    const shown = await switchTo(e);
    result.switching[e.name] = {
      shown,
      newCookies: [...await cookieNames()].filter((n) => !cookies0.has(n)),
      newStorage: (await storageKeys()).filter((k) => !storage0.has(k)),
    };
    result.landings[e.name] = await landings();
    if (opts.probe || i < 3) result.homeChanges[e.name] = (await homeText()) !== home0;
    const own = Object.values(result.landings[e.name]).filter((l) => l.url && !/\/(us|default)\.html$/.test(l.url)).length;
    console.log(`[${i + 1}/${run.length}] ${e.name}: edition shown "${shown}", ${own} of ${TOPICS.length} topics have an own page`);
  } catch (err) {
    result.switching[e.name] = { error: brief(err.message) };
    console.log(`[${i + 1}/${run.length}] ${e.name}: FAILED ${brief(err.message)}`);
  }
  await persist();
}

// back to the edition you started with
if (original) {
  const back = editions.find((e) => e.name === original);
  if (back) console.log(`Switched back to: ${await switchTo(back)}`);
  else console.log(`Could not find "${original}" in the picker: switch back in the browser window.`);
}

const urls = new Set(Object.values(result.landings)
  .flatMap((l) => Object.values(l).map((x) => x.url).filter(Boolean)));
await persist();
if (!opts.probe) await writeFile(join(DIR, 'urls.txt'), [...urls].map((u) => `${SITE}${u}`).join('\n'));
console.log(`Done: ${urls.size} distinct landing pages. Saved ${join(DIR, opts.probe ? 'probe.json' : 'editions.json')}`);
await context.close();
