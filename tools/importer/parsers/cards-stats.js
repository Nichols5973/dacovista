/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-stats. Base block: cards (container).
 * Source: https://www.covista.com/ (stats row inside div.t-layout__one-column.standard-width.overlap...)
 * Project type: xwalk. Item model blocks/cards-stats/_cards-stats.json -> card = { image, imageAlt, text }.
 *
 * Library convention (Cards container): zero..N child rows, one row per card.
 *   Each card row has 2 cells: [image/icon cell (field:image)] + [text cell (field:text)].
 *   An image cell may be empty (no icon image), but the cell must still exist.
 *
 * Content model decisions:
 *   - Each stat = an icon (base64-SVG <img> for items 1-2; an icon-font <span> with no
 *     image for item 3) + a big stat number (.e-stat) + a 2-line label (.e-stat-copy).
 *   - Image cell carries the icon <img> when present (field:image); when the icon is a
 *     font glyph with no <img>, the image cell is left empty (no hint on empty cells).
 *   - Text cell (field:text) = the stat number as a heading + the label as a paragraph
 *     (the source <br> inside the label is normalized to a space).
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.c-universal-grid__item--universal, .c-universal-grid__item'))
    // de-dup: --universal is a subset of __item, keep only the outermost stat items
    .filter((el, i, arr) => !arr.some((other) => other !== el && other.contains(el)));

  const cells = [];

  items.forEach((item) => {
    // --- Icon image (base64 SVG). Font-glyph icons have no <img> -> empty image cell. ---
    const iconImg = item.querySelector('.e-icon-svg img, .c-icon img, img');

    // --- Stat number + label ---
    const statEl = item.querySelector('.e-stat');
    const labelEl = item.querySelector('.e-stat-copy');

    // Image cell (field:image) — only add hint when there is an image.
    let imageCell;
    if (iconImg) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:image '));
      imageCell.appendChild(iconImg);
    } else {
      imageCell = ''; // empty cell, no hint
    }

    // Text cell (field:text) — stat heading + label paragraph.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:text '));
    if (statEl) {
      const statText = (statEl.textContent || '').replace(/\s+/g, ' ').trim();
      if (statText) {
        const h = document.createElement('h3');
        h.textContent = statText;
        textCell.appendChild(h);
      }
    }
    if (labelEl) {
      const clone = labelEl.cloneNode(true);
      clone.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode(' ')));
      const labelText = (clone.textContent || '').replace(/\s+/g, ' ').trim();
      if (labelText) {
        const p = document.createElement('p');
        p.textContent = labelText;
        textCell.appendChild(p);
      }
    }

    // Only emit a card row if it has any content.
    if (iconImg || statEl || labelEl) {
      cells.push([imageCell, textCell]);
    }
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-stats', cells });
  element.replaceWith(block);
}
