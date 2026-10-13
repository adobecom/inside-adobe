/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import articleMetaParser from './parsers/article-meta.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import sectionsTransformer from './transformers/inside-adobe-sections.js';

// PARSER REGISTRY
const parsers = {
  'article-meta': articleMetaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "news-article",
  "description": "Inside Adobe news article: More News button, tags + date, H1, subtitle, feature image, article body.",
  "urls": [
    "http://127.0.0.1:8765/cybersecurity-awareness-month-2026.html"
  ],
  "blocks": [
    {
      "name": "article-meta",
      "instances": [
        ".aem-Grid--9 .articletags"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "More News",
      "selector": [
        ".aem-Grid--9 .dexter-Cta"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".aem-Grid--9 .dexter-Cta"
      ]
    },
    {
      "id": "2",
      "name": "Article",
      "selector": [
        ".aem-Grid--9 .articletags"
      ],
      "style": null,
      "blocks": [
        "article-meta"
      ],
      "defaultContent": [
        ".aem-Grid--9 .articlecontent",
        ".aem-Grid--9 .articlecontent + .text"
      ]
    }
  ]
};

// The source is a local copy of an intranet page; map it to its real site path.
const PATH_MAP = {
  '/cybersecurity-awareness-month-2026': '/news/2026/09/cybersecurity-awareness-month-2026',
};

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = { ...payload, template: PAGE_TEMPLATE };
  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all block instances on the page. Every element is resolved up front,
 * before any parser runs: the instance selectors are positional
 * (:nth-of-type), and replacing an earlier block shifts later counts.
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });
  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;
    const main = document.body;

    // 1. Initial cleanup + section breaks
    executeTransformers('beforeTransform', main, payload);

    // 2. Resolve every block element before parsing any of them
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    // News articles: page title, the article template, and the publish date as YYYY-MM-DD
    // (the news index sorts on it)
    const published = new Date(document.querySelector('meta[name="articlePublishDate"]')?.content
      .replace(/\s+\d{1,2}:\d{2}\s*[AP]M$/i, ''));
    const pad = (n) => String(n).padStart(2, '0');
    main.append(WebImporter.Blocks.getMetadataBlock(document, {
      Title: document.title,
      Template: 'article',
      ...(!Number.isNaN(published.getTime()) && {
        'Publication Date': `${published.getFullYear()}-${pad(published.getMonth() + 1)}-${pad(published.getDate())}`,
      }),
    }));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Images come from the saved export (the intranet source is SSO-protected);
    // point them at the copies stored next to the page in ./media/.
    main.querySelectorAll('img[src*="/cybersecurity-awareness-month-2026_files/"]').forEach((img) => {
      const file = img.getAttribute('src').split('/').pop().toLowerCase().replace(/_/g, '-');
      img.setAttribute('src', `./media/${file}`);
    });

    // 6. Document path
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const mapped = PATH_MAP[rawPath] || rawPath;
    const path = WebImporter.FileUtils.sanitizePath(mapped === '' ? '/index' : mapped);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
