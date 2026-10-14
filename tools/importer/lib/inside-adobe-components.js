/* eslint-disable */
/* global WebImporter */
/**
 * Shared component conversion for the Inside Adobe imports (Side-Nav and Full-Width pages).
 * Components are matched by type, not position:
 *   droptab        → one collapsible section per item (heading + anything inside)
 *   accordion      → accordion block      table → table block       callout → callout (alert)
 *   calltoaction   → cta                  pullquote → quote          thumbnail → card-resource (video)
 *   boxtextandimage→ columns-aside (beside text) or card-resource (alone / in a grid section)
 *   servicenow     → titled link list     live tools → a note linking to the intranet page
 *   shared experience fragments (shared-fragments.json) → /fragments/shared/<name>
 */
import accordionParser from '../parsers/accordion.js';
import tableParser from '../parsers/table.js';
import calloutParser from '../parsers/callout.js';
import ctaParser from '../parsers/cta.js';
import quoteParser from '../parsers/quote.js';
import cardResourceParser from '../parsers/card-resource.js';
import cardResourceVideoParser from '../parsers/card-resource-video.js';
import columnsAsideParser from '../parsers/columns-aside.js';
import cleanupTransformer from '../transformers/inside-adobe-cleanup.js';
import SHARED from '../shared-fragments.json';

export const INTRANET = 'https://inside.corp.adobe.com';
const COL = '[class*="aem-GridColumn"]';
const TOOLS = {
  cafemenu: 'café menu and hours',
  eventlist: 'events list',
  events: 'events list',
  filters: 'filtered listing',
  calendarwizard: 'calendar tool',
  yourholiday: 'holiday calendar',
  newslist: 'news listing',
  sectionnews: 'news list',
  trickshotmenu: 'menu',
  eventform: 'event submission form',
};

// Intranet URL → site path: drop host, /content/inside/en and .html
export function sitePath(url) {
  return url.replace(/^\/content\/inside\/en(?=[/.])/, '').replace(/^\.html$/, '/').replace(/\.html$/, '') || '/';
}

// FNV-1a 32-bit of the text without scripts/styles/svg, lowercased, letters and digits only
// (same as shared_fragments.py). Run it on the saved HTML, before the page's scripts change it.
export function fingerprint(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('script, style, noscript, svg').forEach((n) => n.remove());
  const text = clone.textContent.toLowerCase().replace(/[^0-9a-z]/g, '');
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text)) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0');
}

// heading ids as Edge Delivery makes them (same as the cleanup's jump-link mapping)
export const slug = (text) => text.trim().replace(/\s+/g, ' ').toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
// droptab item id → its section heading's id, for jump links (#NDA → #non-disclosure-agreements-ndas)

// a component is an AEM grid column, or an item directly inside a flex container
export const comps = (root, name) => [...root.querySelectorAll(`.${name}${COL}, .dexter-FlexContainer-Items > .${name}`)];

export const el = (document, tag, text) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};

export function sectionMetadata(document, cells) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells });
}

function rename(document, node, tag) {
  const n = document.createElement(tag);
  n.append(...node.childNodes);
  n.querySelectorAll('b, strong').forEach((b) => b.replaceWith(...b.childNodes));
  node.replaceWith(n);
  return n;
}

export function convert(root, document, pageUrl, dropIds = {}) {
  root.querySelectorAll(`.target${COL}, .dexter-Spacer${COL}`).forEach((t) => {
    if (t.matches('.target') && t.textContent.trim()) t.replaceWith(...t.childNodes);
    else t.remove();
  });

  Object.entries(TOOLS).forEach(([cls, label]) => {
    root.querySelectorAll(`.${cls}${COL}, .dexter-FlexContainer-Items > .${cls}, .${cls}:has(form)`).forEach((tool) => {
      const p = el(document, 'p');
      const em = el(document, 'em', `The ${label} is on `);
      const a = el(document, 'a', 'the current Inside Adobe page');
      a.href = pageUrl;
      a.dataset.intranet = ''; // stays on the intranet: rewriteLinks leaves it
      em.append(a, '.');
      p.append(em);
      tool.replaceWith(p);
    });
  });

  // timeline tabs (one per month, each with real content) → accordion rows
  root.querySelectorAll(`.tabchevron${COL}`).forEach((tc) => {
    const cells = [...tc.querySelectorAll('.tab-chevron-item')].map((tab) => {
      const panel = tc.querySelector(`#${CSS.escape(tab.getAttribute('aria-controls') || '')}`);
      const title = [tab.querySelector('.tab-chevron-heading'), tab.querySelector('.tab-chevron-displayed-date')]
        .map((e) => e?.textContent.trim()).filter(Boolean).join(' · ');
      return [title, panel ? [...panel.querySelectorAll('.cmp-text')].flatMap((t) => [...t.children]) : []];
    });
    tc.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'accordion', cells }));
  });

  // flex groups: text beside a box, video card or image → columns-aside; several boxes on
  // their own → a grid section (top level only). Runs first, before those items are parsed.
  root.querySelectorAll(`.flex${COL}`).forEach((flex) => {
    if (!flex.isConnected) return;
    const asides = comps(flex, 'boxtextandimage').concat(comps(flex, 'thumbnail'), comps(flex, 'image'));
    const shared = flex.querySelector('a[href^="/fragments/"]');
    const text = comps(flex, 'text').some((t) => !t.closest('.boxtextandimage, .thumbnail'));
    if (text && (asides.length || shared)) { columnsAsideParser(flex, { document }); return; }
    const boxes = comps(flex, 'boxtextandimage');
    if (boxes.length < 2 || flex.closest('.panel')) return;
    boxes.forEach((b) => cardResourceParser(b, { document }));
    flex.before(el(document, 'hr'));
    flex.after(sectionMetadata(document, { style: 'container', grid: String(Math.min(boxes.length, 3)) }), el(document, 'hr'));
  });

  // innermost first, so an accordion inside an accordion lands in its parent's cell
  comps(root, 'accordion').reverse().forEach((a) => accordionParser(a, { document }));
  comps(root, 'table').forEach((t) => tableParser(t, { document }));
  // tables typed into rich text would otherwise become blocks named after their first row
  [...root.querySelectorAll('.cmp-text table')].filter((t) => !t.closest('.accordion, .table')).forEach((t) => {
    const wrap = el(document, 'div');
    t.replaceWith(wrap);
    wrap.append(t);
    tableParser(wrap, { document });
  });
  comps(root, 'callout').forEach((c) => calloutParser(c, { document }));
  comps(root, 'pullquote').forEach((q) => quoteParser(q, { document }));
  comps(root, 'thumbnail').forEach((t) => cardResourceVideoParser(t, { document }));
  comps(root, 'calltoaction').forEach((c) => ctaParser(c, { document }));

  comps(root, 'boxtextandimage').forEach((b) => cardResourceParser(b, { document }));

  comps(root, 'servicenow').forEach((s) => {
    const title = s.querySelector('.title');
    const list = el(document, 'ul');
    s.querySelectorAll('li a').forEach((a) => {
      const li = el(document, 'li');
      li.append(a);
      list.append(li);
    });
    const p = el(document, 'p');
    if (title) p.append(el(document, 'strong', title.textContent.trim()));
    s.replaceWith(...(title ? [p] : []), list);
  });

  // droptab items → collapsible sections; their sub-headings move down a level
  root.querySelectorAll(`.droptab${COL}`).forEach((dt) => {
    const out = [];
    dt.querySelectorAll(':scope > .drop-tab-wrapper > .drop-tab-item').forEach((item) => {
      const title = item.querySelector(':scope > .drop-tab-content .drop-tab-heading')?.textContent.trim();
      const panel = item.querySelector(':scope > .panel');
      if (!panel) return;
      if (item.id && title) dropIds[item.id] = slug(title);
      panel.querySelectorAll(`.horizontalRule${COL}`).forEach((h) => h.remove());
      // h3: the cleanup later promotes any h4/h5 to top-level headings
      panel.querySelectorAll('h2, h4, h5, h6').forEach((h) => rename(document, h, 'h3'));
      out.push(el(document, 'hr'), el(document, 'h2', title), ...panel.childNodes,
        sectionMetadata(document, { style: 'collapsible' }), el(document, 'hr'));
    });
    dt.replaceWith(...out);
  });

  root.querySelectorAll(`.horizontalRule${COL}`).forEach((h) => h.replaceWith(el(document, 'hr')));
}

// drop section breaks with nothing between them (or before the first content)
export function dedupeBreaks(root) {
  let content = false;
  const walker = root.ownerDocument.createTreeWalker(root, 5 /* elements + text */);
  const breaks = [];
  while (walker.nextNode()) {
    const n = walker.currentNode;
    if (n.nodeType === 3) { if (n.nodeValue.trim()) content = true; }
    else if (n.tagName === 'HR') { if (!content) breaks.push(n); content = false; }
    else if (n.matches('img, table')) content = true;
  }
  breaks.forEach((b) => b.remove());
}

export function rewriteLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    if (a.hasAttribute('data-intranet')) { a.removeAttribute('data-intranet'); return; }
    const href = a.getAttribute('href');
    let url;
    try { url = new URL(href, INTRANET); } catch { return; }
    // YouTube links (channels, playlists, videos in a sentence) were links on the intranet: keep
    // them links rather than letting the youtube auto-block embed them
    if (/(^|\.)youtube\.com$/.test(url.host) && !url.hash) { a.href = `${url.href}#_dnb`; return; }
    const local = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(url.host);
    if (!(url.origin === INTRANET || local)) return;
    if (url.pathname.startsWith('/content/dam/')) { a.href = `${INTRANET}${url.pathname}`; return; } // documents: moved later
    if (href.startsWith('#')) return;
    a.href = `${sitePath(url.pathname)}${url.search}${url.hash}`;
  });
}

/**
 * Shared experience fragments → links to /fragments/shared/<name> (one-off fragments are inlined).
 * Fingerprints come from the saved HTML, matched to the live page by position. Call before the
 * cleanup's beforeTransform. With emitName, also returns that fragment's converted content.
 */
export function sharedFragments(main, payload, pageUrl, emitName) {
  const { document, params } = payload;
  const outermost = (root) => [...root.querySelectorAll('.xfreference')].filter((x) => !x.parentElement.closest('.xfreference'));
  const saved = outermost(new DOMParser().parseFromString(payload.html, 'text/html'));
  const live = outermost(main);
  const names = live.map((x, i) => SHARED[fingerprint(saved.length === live.length ? saved[i] : x)]);
  cleanupTransformer('beforeTransform', main, payload);

  const fragments = [];
  live.forEach((xf, i) => {
    if (!xf.isConnected) return;
    const name = names[i];
    if (!name) { xf.replaceWith(...xf.childNodes); return; }
    if (emitName && name === emitName) {
      const frag = xf.cloneNode(true);
      convert(frag, document, pageUrl);
      cleanupTransformer('afterTransform', frag, payload);
      dedupeBreaks(frag);
      rewriteLinks(frag);
      WebImporter.rules.adjustImageUrls(frag, payload.url, params.originalURL);
      fragments.push({ element: frag, path: `/fragments/shared/${name}`, report: { title: name } });
    }
    const p = el(document, 'p');
    const a = el(document, 'a', `/fragments/shared/${name}`);
    a.href = `/fragments/shared/${name}`;
    p.append(a);
    xf.replaceWith(p);
  });
  return fragments;
}

// jump links to a droptab item's id on this page → the id of its section heading
export function mapDropIds(main, path, dropIds) {
  main.querySelectorAll('a[href*="#"]').forEach((a) => {
    const [target, id] = a.getAttribute('href').split('#');
    if ((target === '' || target === path) && dropIds[id]) a.setAttribute('href', `#${dropIds[id]}`);
  });
}
