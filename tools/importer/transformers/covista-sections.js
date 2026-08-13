/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Covista section boundaries + section metadata.
 *
 * Driven by payload.template.sections (from tools/importer/page-templates.json).
 * For the covista homepage, four main-content sections are flagged with
 * style="secondary" (rc7, rc8, rc9, rc12). For each flagged section this:
 *   1. inserts a Section Metadata block (style=secondary) after the section, and
 *   2. inserts an <hr> section break before the section (when it is not the
 *      first element and content precedes it).
 *
 * Runs in afterTransform only (block parsers run between the hooks and need the
 * original DOM; adding <hr>/tables earlier would disturb block matching).
 *
 * Selector robustness: the template selector for rc7 uses ":nth-of-type(1)",
 * which does NOT resolve against the live/scraped DOM (rc7 is the 4th div of its
 * type among siblings). To avoid dropping a section we validated each selector
 * against migration-work/cleaned.html and, when the template selector fails,
 * fall back to the same selector with the trailing ":nth-of-type(n)" stripped
 * (the base class chain is unique in the captured DOM). Every fallback below was
 * confirmed to resolve to exactly one element.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

/**
 * Resolve the first element for a section, tolerant of a template selector that
 * does not match (e.g. a stale :nth-of-type). Returns the matched element or null.
 */
function resolveSectionElement(root, selector) {
  if (!selector) return null;

  // 1) Try the template selector verbatim.
  try {
    const el = root.querySelector(selector);
    if (el) return el;
  } catch (e) {
    // invalid selector string -> fall through to fallback
  }

  // 2) Fallback: strip any trailing :nth-of-type()/:nth-child() pseudo-class.
  const base = selector.replace(/:nth-(of-type|child)\([^)]*\)\s*$/i, '').trim();
  if (base && base !== selector) {
    try {
      const el = root.querySelector(base);
      if (el) return el;
    } catch (e) {
      // ignore
    }
  }

  return null;
}

/**
 * True when there is real content before `el` in the document, so an <hr>
 * section break is meaningful (i.e. it is not the very first content element).
 */
function hasContentBefore(el) {
  let node = el.previousElementSibling;
  while (node) {
    if (node.tagName !== 'HR' && (node.textContent || '').trim().length > 0) return true;
    if (node.querySelector && node.querySelector('img, picture, video, svg, table')) return true;
    node = node.previousElementSibling;
  }
  // Also consider content in ancestors' preceding siblings (nested layouts).
  return el !== el.ownerDocument.body.firstElementChild;
}

export default function transform(hookName, element, payload) {
  if (hookName !== TransformHook.afterTransform) return;

  const { document } = payload;
  const sections = payload && payload.template && payload.template.sections;
  if (!Array.isArray(sections) || sections.length < 2) return;

  // Process in reverse so inserting nodes does not shift not-yet-processed
  // sections' positions.
  for (let i = sections.length - 1; i >= 0; i -= 1) {
    const section = sections[i];
    if (!section) continue;

    const sectionEl = resolveSectionElement(element, section.selector);
    if (!sectionEl) continue;

    // 1) Section Metadata block (only when the section defines a style).
    if (section.style) {
      const metadataBlock = WebImporter.Blocks.createBlock(document, {
        name: 'Section Metadata',
        cells: { style: section.style },
      });
      // Place the metadata block at the end of the section's content.
      sectionEl.parentNode.insertBefore(metadataBlock, sectionEl.nextSibling);
    }

    // 2) Section break before the section (not for the first content element).
    if (hasContentBefore(sectionEl)) {
      const hr = document.createElement('hr');
      sectionEl.parentNode.insertBefore(hr, sectionEl);
    }
  }
}
