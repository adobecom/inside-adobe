/* eslint-disable */
/* global WebImporter */
/**
 * Import for the intranet's "Full-Width Page" template (86 section landing and office pages).
 * Related-link tiles become related-cards blocks; a group with a background (the gray
 * "Explore" / "Related Sites" bands) becomes its own section with style "band". Everything else
 * goes through the shared component conversion (lib/inside-adobe-components.js).
 */
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import relatedCardsParser from './parsers/related-cards.js';
import {
  INTRANET, sitePath, el, convert, dedupeBreaks, rewriteLinks, sharedFragments, mapDropIds, sectionMetadata,
} from './lib/inside-adobe-components.js';

const hasBackground = (n) => getComputedStyle(n).backgroundColor !== 'rgba(0, 0, 0, 0)';

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;
    const source = new URL(params.originalURL);
    const emit = source.searchParams.get('emit');
    const path = sitePath(source.pathname);
    const pageUrl = `${INTRANET}${path}.html`;

    // card groups, found while the page still has its layout: the nearest ancestor with a
    // background (a band), else the nearest one with a heading
    const up = (n, test) => { let g = n.parentElement; while (g && g !== main && !test(g)) g = g.parentElement; return g === main ? null : g; };
    const groups = new Map();
    document.querySelectorAll('.related').forEach((card) => {
      const band = up(card, hasBackground);
      const g = band || up(card, (n) => n.querySelector(':scope h2, :scope h3:not(.related-content-title)'));
      if (g && !groups.has(g)) groups.set(g, Boolean(band));
    });

    const fragments = sharedFragments(main, payload, pageUrl, emit === 'fragment' && source.searchParams.get('name'));
    if (emit === 'fragment') return fragments.slice(0, 1);

    groups.forEach((band, g) => {
      if (!g || !g.isConnected) return;
      relatedCardsParser(g, { document });
      if (band) {
        g.before(el(document, 'hr'));
        g.after(sectionMetadata(document, { style: 'band' }), el(document, 'hr'));
      }
    });

    const dropIds = {};
    convert(main, document, pageUrl, dropIds);
    cleanupTransformer('afterTransform', main, payload);
    dedupeBreaks(main);
    rewriteLinks(main);
    mapDropIds(main, path, dropIds);

    main.append(el(document, 'hr'));
    main.append(WebImporter.Blocks.getMetadataBlock(document, { Title: document.title, Template: 'full-width' }));
    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);
    return [{ element: main, path, report: { title: document.title } }];
  },
};
