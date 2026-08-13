/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-feature. Base block: columns.
 * Source: https://www.covista.com/ (3 instances: research, supporting-workers, careers-reversed)
 * Project type: xwalk. Model blocks/columns-feature/_columns-feature.json = columns block (2 cols, 1 row).
 *
 * Library convention (Columns): row 1 = block name; row 2 = N cells (one per column).
 *   NOTE: Columns blocks do NOT use field hints (hinting.md Rule 4) — default content only.
 *
 * Content model decisions:
 *   - 2-column image+text feature. Cell 1 = image, cell 2 = H2 + paragraph(s) + CTA.
 *   - The "careers" instance is authored reverse-columns (c-card--reverse-cols): image is
 *     visually on the right. We detect the reverse modifier and swap cell order so the
 *     migrated block preserves the text|image reading order for that instance.
 */
export default function parse(element, { document }) {
  // The feature content lives inside a card item (c-card__item). Fall back to the section itself.
  const item = element.querySelector('.c-card__item') || element;

  // --- Image (cell 1) ---
  const image = item.querySelector('.c-card__item--media img, picture img, img');

  // --- Text column (cell 2): heading + paragraphs + CTA ---
  const textCell = [];

  const heading = item.querySelector('.c-card__item--copy h2, .c-card__item--content h2, h2');
  if (heading) {
    const h = document.createElement('h2');
    h.textContent = (heading.textContent || '').replace(/\s+/g, ' ').trim();
    textCell.push(h);
  }

  // Paragraphs from the copy area (preserve inline <strong> etc.).
  const paragraphs = Array.from(item.querySelectorAll('.c-card__item--copy p, .c-card__item--content p'));
  paragraphs.forEach((p) => {
    if ((p.textContent || '').trim()) textCell.push(p);
  });

  // CTA link(s) — rebuild clean anchors (strip decorative icon spans / button wrappers).
  const ctaAnchors = Array.from(item.querySelectorAll('.c-card__item--cta a[href], a.e-btn--primary, a.e-btn--secondary, a.e-btn--tertiary'))
    .filter((el, i, arr) => arr.indexOf(el) === i);
  ctaAnchors.forEach((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = (a.textContent || '').replace(/\s+/g, ' ').trim();
    if (link.getAttribute('href') && link.textContent) textCell.push(link);
  });

  // Empty-block guard.
  if (!image && textCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Reverse-columns instance (careers): render text | image instead of image | text.
  const isReversed = !!item.closest('.c-card--reverse-cols') || item.classList.contains('c-card--reverse-cols');

  const imageCell = image ? [image] : '';
  const cells = [];
  if (isReversed) {
    cells.push([textCell, imageCell]);
  } else {
    cells.push([imageCell, textCell]);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-feature', cells });
  element.replaceWith(block);
}
