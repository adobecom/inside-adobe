/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import welcomeParser from './parsers/welcome.js';
import newsGridParser from './parsers/news-grid.js';
import eventsParser from './parsers/events.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import sectionsTransformer from './transformers/inside-adobe-sections.js';

// PARSER REGISTRY
const parsers = {
  welcome: welcomeParser,
  'news-grid': newsGridParser,
  events: eventsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "home",
  "description": "Inside Adobe homepage: welcome line, news grid fed from the news index, right rail with promo images, product feedback banner and events.",
  "urls": [
    "http://127.0.0.1:8765/home.html"
  ],
  "blocks": [
    {
      "name": "welcome",
      "instances": [
        ".welcome"
      ]
    },
    {
      "name": "news-grid",
      "instances": [
        ".newsgrid"
      ]
    },
    {
      "name": "events",
      "instances": [
        ".eventlist"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Welcome + news",
      "selector": [
        ".welcome"
      ],
      "style": null,
      "blocks": [
        "welcome",
        "news-grid"
      ],
      "defaultContent": []
    },
    {
      "id": "2",
      "name": "Rail",
      "selector": [
        ".position:has(.eventlist):not(:has(.welcome))"
      ],
      "style": "rail",
      "blocks": [
        "events"
      ],
      "defaultContent": [
        ".image.parbase",
        ".text"
      ]
    }
  ]
};

// The source is a local copy of an intranet page; map it to its real site path.
const PATH_MAP = {
  '/home': '/index',
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
    main.append(WebImporter.Blocks.getMetadataBlock(document, { Title: 'Inside Adobe', Template: 'home' }));
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Images come from the saved export (the intranet source is SSO-protected);
    // point them at the copies stored next to the page in ./media/.
    main.querySelectorAll('img[src*="/home_files/"]').forEach((img) => {
      const file = img.getAttribute('src').split('/').pop().toLowerCase().replace(/[_ ]/g, '-');
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
