/* eslint-disable */
/* global WebImporter */
/**
 * Import for the intranet's "Side-Nav Page" template (361 pages), from the local mirror.
 * Components are converted by type (lib/inside-adobe-components.js), so one script covers every
 * page; this adds the section menu and the side-nav template.
 * The bulk runner saves one document per URL, so the query string picks which one:
 *   (none)                      the page
 *   ?emit=menu                  the section's menu → /fragments/side-nav/<name>
 *   ?emit=fragment&name=<name>  a shared fragment on this page → /fragments/shared/<name>
 */
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import {
  INTRANET, sitePath, el, convert, dedupeBreaks, rewriteLinks, sharedFragments, mapDropIds,
} from './lib/inside-adobe-components.js';

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
    const fragments = sharedFragments(main, payload, pageUrl, emit === 'fragment' && source.searchParams.get('name'));
    if (emit === 'fragment') return fragments.slice(0, 1);

    const dropIds = {};
    convert(main, document, pageUrl, dropIds);
    cleanupTransformer('afterTransform', main, payload);
    dedupeBreaks(main);
    rewriteLinks(main);
    mapDropIds(main, path, dropIds);

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
