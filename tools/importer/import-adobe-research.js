/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsAsideParser from './parsers/columns-aside.js';
import cardResourceParser from './parsers/card-resource.js';
import cardResourceVideoParser from './parsers/card-resource-video.js';
import ctaParser from './parsers/cta.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import sectionsTransformer from './transformers/inside-adobe-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-aside': columnsAsideParser,
  'card-resource': cardResourceParser,
  'card-resource-video': cardResourceVideoParser,
  cta: ctaParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  "name": "adobe-research",
  "description": "Inside Adobe about-page: H1, text with boxed note, three resource cards (one video), H2 topic with boxed note, call-to-action box.",
  "urls": [
    "http://127.0.0.1:8765/adobe-research.html"
  ],
  "blocks": [
    {
      "name": "columns-aside",
      "instances": [
        ".aem-Grid--9 > .flex:nth-of-type(3)",
        ".aem-Grid--9 > .flex:nth-of-type(8)"
      ]
    },
    {
      "name": "card-resource",
      "instances": [
        ".aem-Grid--9 > .flex:nth-of-type(5) .boxtextandimage"
      ]
    },
    {
      "name": "card-resource-video",
      "instances": [
        ".aem-Grid--9 > .flex:nth-of-type(5) .thumbnail"
      ]
    },
    {
      "name": "cta",
      "instances": [
        ".aem-Grid--9 > .calltoaction"
      ]
    }
  ],
  "sections": [
    {
      "id": "1",
      "name": "Title",
      "selector": [
        ".aem-Grid--9 > .position"
      ],
      "style": null,
      "blocks": [],
      "defaultContent": [
        ".aem-Grid--9 > .position"
      ]
    },
    {
      "id": "2",
      "name": "Intro + newsletter",
      "selector": [
        ".aem-Grid--9 > .flex:nth-of-type(3)"
      ],
      "style": null,
      "blocks": [
        "columns-aside"
      ],
      "defaultContent": []
    },
    {
      "id": "3",
      "name": "Resource cards",
      "selector": [
        ".aem-Grid--9 > .flex:nth-of-type(5)"
      ],
      "style": "container, grid-3",
      "blocks": [
        "card-resource",
        "card-resource-video"
      ],
      "defaultContent": []
    },
    {
      "id": "4",
      "name": "Technical Publications Program",
      "selector": [
        ".aem-Grid--9 > .text:nth-of-type(7)"
      ],
      "style": null,
      "blocks": [
        "columns-aside",
        "cta"
      ],
      "defaultContent": [
        ".aem-Grid--9 > .text:nth-of-type(7)"
      ]
    }
  ]
};

// The source is a local copy of an intranet page; map it to its real site path.
const PATH_MAP = {
  '/adobe-research': '/about-adobe/adobe-research',
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
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // Images come from the saved export (the intranet source is SSO-protected);
    // point them at the copies stored next to the page in ./media/.
    main.querySelectorAll('img[src*="/adobe-research_files/"]').forEach((img) => {
      img.setAttribute('src', `./media/${img.getAttribute('src').split('/').pop()}`);
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
