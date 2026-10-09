/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import columnsVideoParser from './parsers/columns-video.js';
import columnsImageParser from './parsers/columns-image.js';
import cardResourceParser from './parsers/card-resource.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import sectionsTransformer from './transformers/inside-adobe-sections.js';

// PARSER REGISTRY
const parsers = {
  'columns-video': columnsVideoParser,
  'columns-image': columnsImageParser,
  'card-resource': cardResourceParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'adobe-mission-and-plan',
  description: 'Inside Adobe about-page: H1, jump links, then H4-titled topic sections with side-by-side text/media and download links, ending in resource cards.',
  urls: [
    'http://127.0.0.1:8765/adobe-mission-and-plan.html',
  ],
  blocks: [
    {
      name: 'columns-video',
      instances: [
        '.aem-Grid--9 > .flex:nth-of-type(5)',
        '.aem-Grid--9 > .flex:nth-of-type(17)',
        '.aem-Grid--9 > .flex:nth-of-type(42)',
      ],
    },
    {
      name: 'columns-image',
      instances: [
        '.aem-Grid--9 > .flex:nth-of-type(24)',
        '.aem-Grid--9 > .flex:nth-of-type(28)',
        '.aem-Grid--9 > .flex:nth-of-type(32)',
        '.aem-Grid--9 > .flex:nth-of-type(37)',
      ],
    },
    {
      name: 'card-resource',
      instances: ['.boxtextandimage'],
    },
  ],
  sections: [
    { id: '1', name: 'Page title + jump links', selector: ['.aem-Grid--9 > .position'], style: null, blocks: [], defaultContent: ['.aem-Grid--9 > .position', '.aem-Grid--9 > .text:nth-of-type(3)'] },
    { id: '2', name: 'Intro + Shantanu video', selector: ['.aem-Grid--9 > .flex:nth-of-type(5)'], style: null, blocks: ['columns-video'], defaultContent: [] },
    { id: '3', name: 'Mission & Plan — all on one page', selector: ['.aem-Grid--9 > .text:nth-of-type(9)'], style: null, blocks: [], defaultContent: ['.aem-Grid--9 > .text:nth-of-type(9)', '.aem-Grid--9 > .image:nth-of-type(10)', '.aem-Grid--9 > .text:nth-of-type(11)'] },
    { id: '4', name: 'Our Mission', selector: ['.aem-Grid--9 > .text:nth-of-type(15)'], style: null, blocks: ['columns-video'], defaultContent: ['.aem-Grid--9 > .text:nth-of-type(15)', '.aem-Grid--9 > .text:nth-of-type(16)', '.aem-Grid--9 > .image:nth-of-type(19)', '.aem-Grid--9 > .text:nth-of-type(20)'] },
    { id: '5', name: 'Our Company Values', selector: ['.aem-Grid--9 > .flex:nth-of-type(24)'], style: null, blocks: ['columns-image'], defaultContent: [] },
    { id: '6', name: 'What we do', selector: ['.aem-Grid--9 > .flex:nth-of-type(28)'], style: null, blocks: ['columns-image'], defaultContent: [] },
    { id: '7', name: 'Our audience strategy', selector: ['.aem-Grid--9 > .flex:nth-of-type(32)'], style: null, blocks: ['columns-image'], defaultContent: [] },
    { id: '8', name: 'FY26 Must Wins', selector: ['.aem-Grid--9 > .flex:nth-of-type(37)'], style: null, blocks: ['columns-image'], defaultContent: [] },
    { id: '9', name: 'Videos', selector: ['.aem-Grid--9 > .text:nth-of-type(41)'], style: null, blocks: ['columns-video'], defaultContent: ['.aem-Grid--9 > .text:nth-of-type(41)'] },
    { id: '10', name: 'Resources', selector: ['.aem-Grid--9 > .text:nth-of-type(45)'], style: 'container, grid-2', blocks: ['card-resource'], defaultContent: ['.aem-Grid--9 > .text:nth-of-type(45)'] },
  ],
};

// The source is a local copy of an intranet page; map it to its real site path.
const PATH_MAP = {
  '/adobe-mission-and-plan': '/about-adobe/adobe-mission-and-plan',
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
    main.querySelectorAll('img[src*="/adobe-mission-and-plan_files/"]').forEach((img) => {
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
