/* eslint-disable */
/* global WebImporter */
/**
 * Import for the intranet's "Side-Nav Page" template (361 pages), from the local mirror.
 * Components are matched by type, not position, so one script covers every page:
 *   droptab        → one collapsible section per item (heading + anything inside)
 *   accordion      → accordion block      table → table block       callout → callout (alert)
 *   calltoaction   → cta                  pullquote → quote          thumbnail → card-resource (video)
 *   boxtextandimage→ columns-aside (beside text) or card-resource (alone / in a grid section)
 *   servicenow     → titled link list     live tools → a note linking to the intranet page
 *   shared experience fragments (shared-fragments.json) → /fragments/shared/<name>
 * The bulk runner saves one document per URL, so the query string picks which one:
 *   (none)                      the page
 *   ?emit=menu                  the section's menu → /fragments/side-nav/<name>
 *   ?emit=fragment&name=<name>  a shared fragment on this page → /fragments/shared/<name>
 */
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import accordionParser from './parsers/accordion.js';
import tableParser from './parsers/table.js';
import calloutParser from './parsers/callout.js';
import ctaParser from './parsers/cta.js';
import quoteParser from './parsers/quote.js';
import cardResourceParser from './parsers/card-resource.js';
import cardResourceVideoParser from './parsers/card-resource-video.js';
import columnsAsideParser from './parsers/columns-aside.js';
import SHARED from './shared-fragments.json';

const INTRANET = 'https://inside.corp.adobe.com';
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
};

// Intranet URL → site path: drop host, /content/inside/en and .html
function sitePath(url) {
  return url.replace(/^\/content\/inside\/en(?=[/.])/, '').replace(/^\.html$/, '/').replace(/\.html$/, '') || '/';
}

// FNV-1a 32-bit of the text without scripts/styles/svg, lowercased, letters and digits only
// (same as shared_fragments.py). Run it on the saved HTML, before the page's scripts change it.
function fingerprint(node) {
  const clone = node.cloneNode(true);
  clone.querySelectorAll('script, style, noscript, svg').forEach((n) => n.remove());
  const text = clone.textContent.toLowerCase().replace(/[^0-9a-z]/g, '');
  let h = 0x811c9dc5;
  for (const b of new TextEncoder().encode(text)) h = Math.imul(h ^ b, 0x01000193) >>> 0;
  return h.toString(16).padStart(8, '0');
}

// heading ids as Edge Delivery makes them (same as the cleanup's jump-link mapping)
const slug = (text) => text.trim().replace(/\s+/g, ' ').toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');
// droptab item id → its section heading's id, for jump links (#NDA → #non-disclosure-agreements-ndas)
let dropIds = {};

// a component is an AEM grid column, or an item directly inside a flex container
const comps = (root, name) => [...root.querySelectorAll(`.${name}${COL}, .dexter-FlexContainer-Items > .${name}`)];

const el = (document, tag, text) => {
  const e = document.createElement(tag);
  if (text) e.textContent = text;
  return e;
};

function sectionMetadata(document, cells) {
  return WebImporter.Blocks.createBlock(document, { name: 'Section Metadata', cells });
}

function rename(document, node, tag) {
  const n = document.createElement(tag);
  n.append(...node.childNodes);
  n.querySelectorAll('b, strong').forEach((b) => b.replaceWith(...b.childNodes));
  node.replaceWith(n);
  return n;
}

function convert(root, document, pageUrl) {
  root.querySelectorAll(`.target${COL}, .dexter-Spacer${COL}`).forEach((t) => {
    if (t.matches('.target') && t.textContent.trim()) t.replaceWith(...t.childNodes);
    else t.remove();
  });

  Object.entries(TOOLS).forEach(([cls, label]) => {
    root.querySelectorAll(`.${cls}${COL}`).forEach((tool) => {
      const p = el(document, 'p');
      const em = el(document, 'em', `The ${label} is on `);
      const a = el(document, 'a', 'the current Inside Adobe page');
      a.href = pageUrl;
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
function dedupeBreaks(root) {
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

function rewriteLinks(root) {
  root.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href');
    let url;
    try { url = new URL(href, INTRANET); } catch { return; }
    const local = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(url.host);
    if (!(url.origin === INTRANET || local)) return;
    if (url.pathname.startsWith('/content/dam/')) { a.href = `${INTRANET}${url.pathname}`; return; } // documents: moved later
    if (href.startsWith('#')) return;
    a.href = `${sitePath(url.pathname)}${url.search}${url.hash}`;
  });
}

function menu(document) {
  const nav = document.querySelector('#root_content_position_position-par_position_1 .falcon-side-nav .desktop-layout');
  if (!nav) return null;
  const out = el(document, 'div');
  const t = nav.querySelector('.nav-title a');
  if (t) {
    const h2 = el(document, 'h2');
    const a = el(document, 'a', t.textContent.trim());
    a.href = t.getAttribute('href');
    h2.append(a);
    out.append(h2);
  }
  const ul = el(document, 'ul');
  nav.querySelectorAll(':scope > ul > li:not(.sidenav-header) > a').forEach((src) => {
    const li = el(document, 'li');
    const a = el(document, 'a', src.textContent.trim());
    a.href = src.getAttribute('href');
    li.append(a);
    ul.append(li);
  });
  out.append(ul);
  rewriteLinks(out);
  return out;
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;
    const source = new URL(params.originalURL);
    const emit = source.searchParams.get('emit');
    const path = sitePath(source.pathname);
    const pageUrl = `${INTRANET}${path}.html`;
    const [, first, second] = path.split('/');
    const menuName = first === 'offices' && second ? `offices-${second}` : first;

    if (emit === 'menu') {
      const menuEl = menu(document) || el(document, 'div');
      return [{ element: menuEl, path: `/fragments/side-nav/${menuName}`, report: { title: document.title } }];
    }
    // shared fragments: fingerprint the saved HTML, matched to the live page by position
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
      if (emit === 'fragment' && name === source.searchParams.get('name')) {
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
    if (emit === 'fragment') return fragments.slice(0, 1);

    dropIds = {};
    convert(main, document, pageUrl);
    cleanupTransformer('afterTransform', main, payload);
    dedupeBreaks(main);
    rewriteLinks(main);
    main.querySelectorAll('a[href*="#"]').forEach((a) => {
      const [target, id] = a.getAttribute('href').split('#');
      if ((target === '' || target === path) && dropIds[id]) a.setAttribute('href', `#${dropIds[id]}`);
    });

    main.append(el(document, 'hr'));
    main.append(WebImporter.Blocks.getMetadataBlock(document, {
      Title: document.title,
      Template: 'side-nav',
      ...(menuName !== first && { 'Side Nav': menuName }),
    }));
    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);

    return [{ element: main, path, report: { title: document.title, menu: menuName } }];
  },
};
