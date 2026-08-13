/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroImageParser from './parsers/hero-image.js';
import cardsStatsParser from './parsers/cards-stats.js';
import columnsFeatureParser from './parsers/columns-feature.js';
import cardsLogosParser from './parsers/cards-logos.js';
import columnsStockParser from './parsers/columns-stock.js';
import carouselNewsParser from './parsers/carousel-news.js';

// TRANSFORMER IMPORTS
import cleanupTransformer from './transformers/covista-cleanup.js';
import sectionsTransformer from './transformers/covista-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-image': heroImageParser,
  'cards-stats': cardsStatsParser,
  'columns-feature': columnsFeatureParser,
  'cards-logos': cardsLogosParser,
  'columns-stock': columnsStockParser,
  'carousel-news': carouselNewsParser,
};

// PAGE TEMPLATE CONFIGURATION - embedded from page-templates.json
const PAGE_TEMPLATE = {
  name: 'homepage',
  description: "Covista homepage: hero banner with video/overlay + CTA, stats row (institutions/graduates/alumni), research feature card, 'Our institutions' intro + 5 institution logos, supporting-workers feature, careers feature, stock information + investor callout, and a 'News and stories' carousel of article cards.",
  urls: [
    'https://www.covista.com/',
  ],
  blocks: [
    {
      name: 'hero-image',
      instances: ['div.homepage-hero'],
    },
    {
      name: 'cards-stats',
      instances: ['div.t-layout__one-column.standard-width.overlap.pad-bottom-40-desktop.cc-bg-secondary-mobile'],
    },
    {
      name: 'columns-feature',
      instances: [
        'div.t-layout__one-column.standard-width.pad-top-0.pad-bottom-0.edge-to-edge__mobile',
        'div.t-layout__one-column.edge-to-edge.pad-top-20-desktop.pad-bottom-40-desktop',
        'div.t-layout__one-column.edge-to-edge.pad-y-0.pad-bottom-50-desktop',
      ],
    },
    {
      name: 'cards-logos',
      instances: ['div.t-layout__one-column.standard-width.p-universal-bg-color--secondary.pad-bottom-0.pad-top-0'],
    },
    {
      name: 'columns-stock',
      instances: ['div.t-layout__two-column.edge-to-edge.layout__split--5050.sidebar-first.p-universal-bg-color--secondary'],
    },
    {
      name: 'carousel-news',
      instances: ['div.t-layout__one-column.edge-to-edge.carousel-view--edge-to-edge'],
    },
  ],
  sections: [
    {
      id: 'rc7',
      name: 'Our institutions intro',
      selector: 'div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-0.pad-bottom-0',
      style: 'secondary',
      blocks: [],
      defaultContent: [
        'div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-0.pad-bottom-0 h2',
        'div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-0.pad-bottom-0 p',
      ],
    },
    {
      id: 'rc8',
      name: 'Institution logos row',
      selector: 'div.t-layout__one-column.standard-width.p-universal-bg-color--secondary.pad-bottom-0.pad-top-0',
      style: 'secondary',
      blocks: ['cards-logos'],
      defaultContent: [],
    },
    {
      id: 'rc9',
      name: 'Learn more CTA',
      selector: 'div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-20.pad-bottom-40',
      style: 'secondary',
      blocks: [],
      defaultContent: [
        'div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-20.pad-bottom-40 a',
      ],
    },
    {
      id: 'rc12',
      name: 'Stock information + investor callout',
      selector: 'div.t-layout__two-column.edge-to-edge.layout__split--5050.sidebar-first.p-universal-bg-color--secondary',
      style: 'secondary',
      blocks: ['columns-stock'],
      defaultContent: [],
    },
  ],
};

// TRANSFORMER REGISTRY - cleanup runs first, then sections (afterTransform adds breaks/metadata)
const transformers = [
  cleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [sectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook.
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - DOM element to transform (document.body)
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
 * Find all blocks on the page based on the embedded template configuration.
 * @param {Document} document
 * @param {Object} template - PAGE_TEMPLATE
 * @returns {Array} block instances found on the page
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
    const {
      document, url, html, params,
    } = payload;

    const main = document.body;

    // 1. beforeTransform (initial cleanup)
    executeTransformers('beforeTransform', main, payload);

    // 2. Discover blocks on page (before cleanup removes their context)
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block using registered parsers. Skip detached elements.
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return; // already replaced by earlier parser
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

    // 4. afterTransform (final cleanup + section breaks/metadata)
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path — map the root/homepage URL to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

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
