/* eslint-disable */
/* global WebImporter */
/**
 * Import for the intranet's "News Article" template (283 articles), from the local mirror.
 * Page: More News button, a section break, then the article-meta block (tags + date), headline,
 * subtitle, feature image and body. Body components, image pop-up tiles included, go through the
 * shared conversion (lib/inside-adobe-components.js). Metadata: Template article, Publication Date
 * (YYYY-MM-DD), Geography (the intranet's geography tags, comma-separated; the homepage filters by it).
 */
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import articleMetaParser from './parsers/article-meta.js';
import {
  INTRANET, sitePath, el, convert, dedupeBreaks, rewriteLinks, sharedFragments, mapDropIds,
} from './lib/inside-adobe-components.js';

function publicationDate(document) {
  const raw = document.querySelector('meta[name="articlePublishDate"]')?.content
    || document.querySelector('.article-date')?.textContent || '';
  const d = new Date(raw.replace(/\s+\d{1,2}:\d{2}\s*[AP]M$/i, '').trim());
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;
    const source = new URL(params.originalURL);
    const path = sitePath(source.pathname);
    const pageUrl = `${INTRANET}${path}.html`;
    const published = publicationDate(document);
    // who the article is for: the intranet's geography tags (global, a country, offices)
    const geography = (document.querySelector('meta[name="geography"]')?.content || '').split(',')
      .map((t) => t.trim().replace(/^geography:/, '')).filter(Boolean).join(', ');

    sharedFragments(main, payload, pageUrl); // also runs the cleanup's beforeTransform

    const tags = main.querySelector('.articletags');
    if (tags) {
      tags.before(el(document, 'hr'));
      articleMetaParser(tags, { document });
    }

    const dropIds = {};
    convert(main, document, pageUrl, dropIds);
    cleanupTransformer('afterTransform', main, payload);
    dedupeBreaks(main);
    rewriteLinks(main);
    mapDropIds(main, path, dropIds);

    main.append(el(document, 'hr'));
    main.append(WebImporter.Blocks.getMetadataBlock(document, {
      Title: document.title,
      Template: 'article',
      ...(published && { 'Publication Date': published }),
      ...(geography && { Geography: geography }),
    }));
    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);
    return [{ element: main, path, report: { title: document.title, published } }];
  },
};
