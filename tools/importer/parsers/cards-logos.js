/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-logos. Base block: cards (container).
 * Source: https://www.covista.com/ (institution logos row, 5 cards)
 * Project type: xwalk. Item model blocks/cards-logos/_cards-logos.json -> card = { image, imageAlt, text }.
 *
 * Library convention (Cards container): zero..N child rows, one row per card.
 *   Each card row has 2 cells: [image cell (field:image)] + [text cell (field:text)].
 *   An empty text cell must still exist (no hint on empty cells).
 *
 * Content model decisions:
 *   - Each card = a logo <img> wrapped in an outbound link (e.g. https://www.aucmed.edu/).
 *   - Image cell (field:image) carries the logo <img>. To preserve the outbound link,
 *     the anchor is kept wrapping the image so the destination survives migration.
 *   - There is no per-card text, so the second (text) cell is left empty.
 */
export default function parse(element, { document }) {
  const items = Array.from(element.querySelectorAll('.c-universal-grid__item--universal, .c-universal-grid__item'))
    .filter((el, i, arr) => !arr.some((other) => other !== el && other.contains(el)));

  const cells = [];

  items.forEach((item) => {
    const img = item.querySelector('img');
    const linkEl = item.querySelector('a[href]');
    if (!img) return;

    // Image cell (field:image): logo image wrapped in its outbound link (if present).
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (linkEl && linkEl.getAttribute('href')) {
      const a = document.createElement('a');
      a.setAttribute('href', linkEl.getAttribute('href'));
      a.appendChild(img);
      imageCell.appendChild(a);
    } else {
      imageCell.appendChild(img);
    }

    // Text cell: empty (no per-card text) — keep the cell, no hint.
    cells.push([imageCell, '']);
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-logos', cells });
  element.replaceWith(block);
}
