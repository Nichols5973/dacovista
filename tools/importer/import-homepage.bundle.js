/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // tools/importer/import-homepage.js
  var import_homepage_exports = {};
  __export(import_homepage_exports, {
    default: () => import_homepage_default
  });

  // tools/importer/parsers/hero-video.js
  function parse(element, { document }) {
    let videoUrl = "";
    const sources = Array.from(element.querySelectorAll("video source"));
    const mp4Source = sources.find((s) => (s.getAttribute("src") || "").toLowerCase().includes(".mp4")) || sources.find((s) => (s.getAttribute("src") || "").trim());
    if (mp4Source) videoUrl = mp4Source.getAttribute("src").trim();
    const fallbackImg = element.querySelector(".i-mobile-only img, .e-image--mobile img, picture img, img");
    const headingEl = element.querySelector('.p-banner-heading, h1, h2, [class*="banner"][class*="heading"]');
    let heading = null;
    if (headingEl) {
      const clone = headingEl.cloneNode(true);
      clone.querySelectorAll("br").forEach((br) => br.replaceWith(document.createTextNode(" ")));
      const text = (clone.textContent || "").replace(/\s+/g, " ").trim();
      if (text) {
        heading = document.createElement("h1");
        heading.textContent = text;
      }
    }
    const ctaAnchors = Array.from(element.querySelectorAll('.p-banner-cta a[href], .p-cv-banner--cta a[href], [class*="banner"][class*="cta"] a[href]'));
    const ctaLinks = ctaAnchors.map((a) => {
      const link = document.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = (a.textContent || "").replace(/\s+/g, " ").trim();
      return link;
    }).filter((a) => a.getAttribute("href") && a.textContent);
    if (!heading && ctaLinks.length === 0 && !fallbackImg && !videoUrl) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [];
    if (fallbackImg || videoUrl) {
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (fallbackImg) imageCell.appendChild(fallbackImg);
      if (videoUrl) {
        const videoAnchor = document.createElement("a");
        videoAnchor.setAttribute("href", videoUrl);
        videoAnchor.textContent = "Background video";
        imageCell.appendChild(videoAnchor);
      }
      cells.push([imageCell]);
    }
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(" field:text "));
    if (heading) textCell.appendChild(heading);
    ctaLinks.forEach((a) => textCell.appendChild(a));
    cells.push([textCell]);
    const block = WebImporter.Blocks.createBlock(document, { name: "hero-video", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-stats.js
  function parse2(element, { document }) {
    const items = Array.from(element.querySelectorAll(".c-universal-grid__item--universal, .c-universal-grid__item")).filter((el, i, arr) => !arr.some((other) => other !== el && other.contains(el)));
    const cells = [];
    items.forEach((item) => {
      const iconImg = item.querySelector(".e-icon-svg img, .c-icon img, img");
      const statEl = item.querySelector(".e-stat");
      const labelEl = item.querySelector(".e-stat-copy");
      let imageCell;
      if (iconImg) {
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:image "));
        imageCell.appendChild(iconImg);
      } else {
        imageCell = "";
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:text "));
      if (statEl) {
        const statText = (statEl.textContent || "").replace(/\s+/g, " ").trim();
        if (statText) {
          const h = document.createElement("h3");
          h.textContent = statText;
          textCell.appendChild(h);
        }
      }
      if (labelEl) {
        const clone = labelEl.cloneNode(true);
        clone.querySelectorAll("br").forEach((br) => br.replaceWith(document.createTextNode(" ")));
        const labelText = (clone.textContent || "").replace(/\s+/g, " ").trim();
        if (labelText) {
          const p = document.createElement("p");
          p.textContent = labelText;
          textCell.appendChild(p);
        }
      }
      if (iconImg || statEl || labelEl) {
        cells.push([imageCell, textCell]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-stats", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-feature.js
  function parse3(element, { document }) {
    const item = element.querySelector(".c-card__item") || element;
    const image = item.querySelector(".c-card__item--media img, picture img, img");
    const textCell = [];
    const heading = item.querySelector(".c-card__item--copy h2, .c-card__item--content h2, h2");
    if (heading) {
      const h = document.createElement("h2");
      h.textContent = (heading.textContent || "").replace(/\s+/g, " ").trim();
      textCell.push(h);
    }
    const paragraphs = Array.from(item.querySelectorAll(".c-card__item--copy p, .c-card__item--content p"));
    paragraphs.forEach((p) => {
      if ((p.textContent || "").trim()) textCell.push(p);
    });
    const ctaAnchors = Array.from(item.querySelectorAll(".c-card__item--cta a[href], a.e-btn--primary, a.e-btn--secondary, a.e-btn--tertiary")).filter((el, i, arr) => arr.indexOf(el) === i);
    ctaAnchors.forEach((a) => {
      const link = document.createElement("a");
      link.setAttribute("href", a.getAttribute("href"));
      link.textContent = (a.textContent || "").replace(/\s+/g, " ").trim();
      if (link.getAttribute("href") && link.textContent) textCell.push(link);
    });
    if (!image && textCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const isReversed = !!item.closest(".c-card--reverse-cols") || item.classList.contains("c-card--reverse-cols");
    const imageCell = image ? [image] : "";
    const cells = [];
    if (isReversed) {
      cells.push([textCell, imageCell]);
    } else {
      cells.push([imageCell, textCell]);
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-feature", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-logos.js
  function parse4(element, { document }) {
    const items = Array.from(element.querySelectorAll(".c-universal-grid__item--universal, .c-universal-grid__item")).filter((el, i, arr) => !arr.some((other) => other !== el && other.contains(el)));
    const cells = [];
    items.forEach((item) => {
      const img = item.querySelector("img");
      const linkEl = item.querySelector("a[href]");
      if (!img) return;
      const imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(" field:image "));
      if (linkEl && linkEl.getAttribute("href")) {
        const a = document.createElement("a");
        a.setAttribute("href", linkEl.getAttribute("href"));
        a.appendChild(img);
        imageCell.appendChild(a);
      } else {
        imageCell.appendChild(img);
      }
      cells.push([imageCell, ""]);
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "cards-logos", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-stock.js
  function parse5(element, { document }) {
    const stockRoot = element.querySelector(".c-stock-ticker, .layout__region--sidebar") || element;
    const leftCell = [];
    const stockHeading = stockRoot.querySelector("h2");
    if (stockHeading) {
      const h = document.createElement("h2");
      h.textContent = (stockHeading.textContent || "").replace(/\s+/g, " ").trim();
      leftCell.push(h);
    }
    const symbol = stockRoot.querySelector(".c-stock-ticker--symbol");
    if (symbol && (symbol.textContent || "").trim()) {
      const p = document.createElement("p");
      p.textContent = (symbol.textContent || "").replace(/\s+/g, " ").trim();
      leftCell.push(p);
    }
    Array.from(stockRoot.querySelectorAll(".c-stock-ticker--date, .c-stock-ticker--timewait")).forEach((el) => {
      const t = (el.textContent || "").replace(/\s+/g, " ").trim();
      if (t) {
        const p = document.createElement("p");
        p.textContent = t;
        leftCell.push(p);
      }
    });
    const priceEl = stockRoot.querySelector(".c-stock-ticker--current-price-value");
    if (priceEl && (priceEl.textContent || "").trim()) {
      const p = document.createElement("p");
      const price = (priceEl.textContent || "").replace(/\s+/g, " ").trim();
      p.textContent = price.startsWith("$") ? price : `$${price}`;
      leftCell.push(p);
    }
    const changeLabel = stockRoot.querySelector(".c-stock-ticker--data-label");
    const changeValue = stockRoot.querySelector(".c-stock-ticker--data-value");
    if (changeLabel || changeValue) {
      const parts = [];
      if (changeLabel) parts.push((changeLabel.textContent || "").replace(/\s+/g, " ").trim());
      if (changeValue) parts.push((changeValue.textContent || "").replace(/\s+/g, " ").trim());
      const text = parts.filter(Boolean).join(" ");
      if (text) {
        const p = document.createElement("p");
        p.textContent = text;
        leftCell.push(p);
      }
    }
    const calloutRoot = element.querySelector(".layout__region--main .c-card__item, .c-card__item") || element;
    const rightCell = [];
    const calloutImg = calloutRoot.querySelector(".c-card__item--media img, picture img, img");
    if (calloutImg) rightCell.push(calloutImg);
    Array.from(calloutRoot.querySelectorAll(".c-card__item--copy p, .c-card__item--content p")).forEach((p) => {
      if ((p.textContent || "").trim()) rightCell.push(p);
    });
    const calloutCta = calloutRoot.querySelector(".c-card__item--cta a[href], a.e-btn--tertiary, a.e-btn--primary, a.e-btn--secondary");
    if (calloutCta && calloutCta.getAttribute("href")) {
      const a = document.createElement("a");
      a.setAttribute("href", calloutCta.getAttribute("href"));
      a.textContent = (calloutCta.textContent || "").replace(/\s+/g, " ").trim();
      if (a.textContent) rightCell.push(a);
    }
    if (leftCell.length === 0 && rightCell.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[
      leftCell.length ? leftCell : "",
      rightCell.length ? rightCell : ""
    ]];
    const block = WebImporter.Blocks.createBlock(document, { name: "columns-stock", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/carousel-news.js
  function parse6(element, { document }) {
    let slides = Array.from(element.querySelectorAll(".views-row.slick-slide:not(.slick-cloned)"));
    if (slides.length === 0) slides = Array.from(element.querySelectorAll(".views-row:not(.slick-cloned)"));
    if (slides.length === 0) slides = Array.from(element.querySelectorAll(".slide"));
    const cells = [];
    slides.forEach((slide) => {
      const img = slide.querySelector(".image--container img, img");
      const tagsEl = slide.querySelector(".view-tag-field, .tags-date--wrapper");
      const titleLink = slide.querySelector(".view-title-field a[href]") || slide.querySelector('a[href^="/news/"]') || slide.querySelector('a[href]:not([href^="/taxonomy"])');
      let imageCell;
      if (img) {
        imageCell = document.createDocumentFragment();
        imageCell.appendChild(document.createComment(" field:media_image "));
        imageCell.appendChild(img);
      } else {
        imageCell = "";
      }
      const textCell = document.createDocumentFragment();
      textCell.appendChild(document.createComment(" field:content_text "));
      if (tagsEl) {
        const tagsText = (tagsEl.textContent || "").replace(/\s+/g, " ").trim();
        if (tagsText) {
          const p = document.createElement("p");
          p.textContent = tagsText;
          textCell.appendChild(p);
        }
      }
      if (titleLink && titleLink.getAttribute("href")) {
        const a = document.createElement("a");
        a.setAttribute("href", titleLink.getAttribute("href"));
        a.textContent = (titleLink.textContent || "").replace(/\s+/g, " ").trim();
        if (a.textContent) textCell.appendChild(a);
      }
      if (img || tagsEl || titleLink) {
        cells.push([imageCell, textCell]);
      }
    });
    if (cells.length === 0) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const block = WebImporter.Blocks.createBlock(document, { name: "carousel-news", cells });
    element.replaceWith(block);
  }

  // tools/importer/transformers/covista-cleanup.js
  var TransformHook = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Cookie/consent bar at top of <body> (cleaned.html line 5)
        "#consent_blackbar",
        // "Skip to main content" accessibility link (cleaned.html line 2)
        "a.skip-link",
        // Hidden banner play/pause control inside the hero video (cleaned.html line ~775)
        ".c-banner-videobutton"
      ]);
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Global site header / primary + utility navigation (cleaned.html line 10)
        "header.page--header",
        // Drupal admin/toolbar region (cleaned.html line 745)
        ".region__admin",
        // Global site footer (cleaned.html line 1924)
        "footer.page--footer"
      ]);
      WebImporter.DOMUtils.remove(element, [
        "script",
        "style",
        "noscript",
        "link",
        "iframe"
      ]);
      element.querySelectorAll("*").forEach((el) => {
        [...el.attributes].forEach((attr) => {
          const n = attr.name;
          if (n === "onclick" || n === "data-once" || n.startsWith("data-gtm") || n.startsWith("data-ga") || n.startsWith("data-analytics") || n.startsWith("data-track") || n.startsWith("data-drupal")) {
            el.removeAttribute(n);
          }
        });
      });
    }
  }

  // tools/importer/transformers/covista-sections.js
  var TransformHook2 = {
    beforeTransform: "beforeTransform",
    afterTransform: "afterTransform"
  };
  function resolveSectionElement(root, selector) {
    if (!selector) return null;
    try {
      const el = root.querySelector(selector);
      if (el) return el;
    } catch (e) {
    }
    const base = selector.replace(/:nth-(of-type|child)\([^)]*\)\s*$/i, "").trim();
    if (base && base !== selector) {
      try {
        const el = root.querySelector(base);
        if (el) return el;
      } catch (e) {
      }
    }
    return null;
  }
  function hasContentBefore(el) {
    let node = el.previousElementSibling;
    while (node) {
      if (node.tagName !== "HR" && (node.textContent || "").trim().length > 0) return true;
      if (node.querySelector && node.querySelector("img, picture, video, svg, table")) return true;
      node = node.previousElementSibling;
    }
    return el !== el.ownerDocument.body.firstElementChild;
  }
  function transform2(hookName, element, payload) {
    if (hookName !== TransformHook2.afterTransform) return;
    const { document } = payload;
    const sections = payload && payload.template && payload.template.sections;
    if (!Array.isArray(sections) || sections.length < 2) return;
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section) continue;
      const sectionEl = resolveSectionElement(element, section.selector);
      if (!sectionEl) continue;
      if (section.style) {
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        sectionEl.parentNode.insertBefore(metadataBlock, sectionEl.nextSibling);
      }
      if (hasContentBefore(sectionEl)) {
        const hr = document.createElement("hr");
        sectionEl.parentNode.insertBefore(hr, sectionEl);
      }
    }
  }

  // tools/importer/import-homepage.js
  var parsers = {
    "hero-video": parse,
    "cards-stats": parse2,
    "columns-feature": parse3,
    "cards-logos": parse4,
    "columns-stock": parse5,
    "carousel-news": parse6
  };
  var PAGE_TEMPLATE = {
    name: "homepage",
    description: "Covista homepage: hero banner with video/overlay + CTA, stats row (institutions/graduates/alumni), research feature card, 'Our institutions' intro + 5 institution logos, supporting-workers feature, careers feature, stock information + investor callout, and a 'News and stories' carousel of article cards.",
    urls: [
      "https://www.covista.com/"
    ],
    blocks: [
      {
        name: "hero-video",
        instances: ["div.homepage-hero"]
      },
      {
        name: "cards-stats",
        instances: ["div.t-layout__one-column.standard-width.overlap.pad-bottom-40-desktop.cc-bg-secondary-mobile"]
      },
      {
        name: "columns-feature",
        instances: [
          "div.t-layout__one-column.standard-width.pad-top-0.pad-bottom-0.edge-to-edge__mobile",
          "div.t-layout__one-column.edge-to-edge.pad-top-20-desktop.pad-bottom-40-desktop",
          "div.t-layout__one-column.edge-to-edge.pad-y-0.pad-bottom-50-desktop"
        ]
      },
      {
        name: "cards-logos",
        instances: ["div.t-layout__one-column.standard-width.p-universal-bg-color--secondary.pad-bottom-0.pad-top-0"]
      },
      {
        name: "columns-stock",
        instances: ["div.t-layout__two-column.edge-to-edge.layout__split--5050.sidebar-first.p-universal-bg-color--secondary"]
      },
      {
        name: "carousel-news",
        instances: ["div.t-layout__one-column.edge-to-edge.carousel-view--edge-to-edge"]
      }
    ],
    sections: [
      {
        id: "rc7",
        name: "Our institutions intro",
        selector: "div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-0.pad-bottom-0",
        style: "secondary",
        blocks: [],
        defaultContent: [
          "div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-0.pad-bottom-0 h2",
          "div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-0.pad-bottom-0 p"
        ]
      },
      {
        id: "rc8",
        name: "Institution logos row",
        selector: "div.t-layout__one-column.standard-width.p-universal-bg-color--secondary.pad-bottom-0.pad-top-0",
        style: "secondary",
        blocks: ["cards-logos"],
        defaultContent: []
      },
      {
        id: "rc9",
        name: "Learn more CTA",
        selector: "div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-20.pad-bottom-40",
        style: "secondary",
        blocks: [],
        defaultContent: [
          "div.t-layout__one-column.optimized-width.p-universal-bg-color--secondary.pad-top-20.pad-bottom-40 a"
        ]
      },
      {
        id: "rc12",
        name: "Stock information + investor callout",
        selector: "div.t-layout__two-column.edge-to-edge.layout__split--5050.sidebar-first.p-universal-bg-color--secondary",
        style: "secondary",
        blocks: ["columns-stock"],
        defaultContent: []
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), { template: PAGE_TEMPLATE });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
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
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var import_homepage_default = {
    transform: (payload) => {
      const {
        document,
        url,
        html,
        params
      } = payload;
      const main = document.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);
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
      executeTransformers("afterTransform", main, payload);
      const hr = document.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document);
      WebImporter.rules.transformBackgroundImages(main, document);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_homepage_exports);
})();
