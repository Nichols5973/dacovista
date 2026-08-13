/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-stock. Base block: columns.
 * Source: https://www.covista.com/ (div.t-layout__two-column...layout__split--5050.sidebar-first...)
 * Project type: xwalk. Model blocks/columns-stock/_columns-stock.json = columns block (2 cols, 1 row).
 *
 * Library convention (Columns): row 1 = block name; row 2 = N cells (one per column).
 *   NOTE: Columns blocks do NOT use field hints (hinting.md Rule 4) — default content only.
 *
 * Content model decisions:
 *   - 2-column 50/50 split. Left column = stock ticker: heading "Stock information",
 *     symbol NYSE:CVSA, timestamp/delay notes, current price, and change (%). The source
 *     values are live/dynamic; they are migrated as static text (snapshot at import time).
 *   - Right column = investor callout: image + heading/copy + CTA "View our financials"
 *     -> https://investors.covista.com.
 */
export default function parse(element, { document }) {
  // --- Left column: stock information ---
  const stockRoot = element.querySelector('.c-stock-ticker, .layout__region--sidebar') || element;
  const leftCell = [];

  const stockHeading = stockRoot.querySelector('h2');
  if (stockHeading) {
    const h = document.createElement('h2');
    h.textContent = (stockHeading.textContent || '').replace(/\s+/g, ' ').trim();
    leftCell.push(h);
  }

  const symbol = stockRoot.querySelector('.c-stock-ticker--symbol');
  if (symbol && (symbol.textContent || '').trim()) {
    const p = document.createElement('p');
    p.textContent = (symbol.textContent || '').replace(/\s+/g, ' ').trim();
    leftCell.push(p);
  }

  // Timestamp + delay notes.
  Array.from(stockRoot.querySelectorAll('.c-stock-ticker--date, .c-stock-ticker--timewait')).forEach((el) => {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (t) {
      const p = document.createElement('p');
      p.textContent = t;
      leftCell.push(p);
    }
  });

  // Current price (prefix with $).
  const priceEl = stockRoot.querySelector('.c-stock-ticker--current-price-value');
  if (priceEl && (priceEl.textContent || '').trim()) {
    const p = document.createElement('p');
    const price = (priceEl.textContent || '').replace(/\s+/g, ' ').trim();
    p.textContent = price.startsWith('$') ? price : `$${price}`;
    leftCell.push(p);
  }

  // Change (%) label + value.
  const changeLabel = stockRoot.querySelector('.c-stock-ticker--data-label');
  const changeValue = stockRoot.querySelector('.c-stock-ticker--data-value');
  if (changeLabel || changeValue) {
    const parts = [];
    if (changeLabel) parts.push((changeLabel.textContent || '').replace(/\s+/g, ' ').trim());
    if (changeValue) parts.push((changeValue.textContent || '').replace(/\s+/g, ' ').trim());
    const text = parts.filter(Boolean).join(' ');
    if (text) {
      const p = document.createElement('p');
      p.textContent = text;
      leftCell.push(p);
    }
  }

  // --- Right column: investor callout ---
  const calloutRoot = element.querySelector('.layout__region--main .c-card__item, .c-card__item') || element;
  const rightCell = [];

  const calloutImg = calloutRoot.querySelector('.c-card__item--media img, picture img, img');
  if (calloutImg) rightCell.push(calloutImg);

  Array.from(calloutRoot.querySelectorAll('.c-card__item--copy p, .c-card__item--content p')).forEach((p) => {
    if ((p.textContent || '').trim()) rightCell.push(p);
  });

  const calloutCta = calloutRoot.querySelector('.c-card__item--cta a[href], a.e-btn--tertiary, a.e-btn--primary, a.e-btn--secondary');
  if (calloutCta && calloutCta.getAttribute('href')) {
    const a = document.createElement('a');
    a.setAttribute('href', calloutCta.getAttribute('href'));
    a.textContent = (calloutCta.textContent || '').replace(/\s+/g, ' ').trim();
    if (a.textContent) rightCell.push(a);
  }

  // Empty-block guard.
  if (leftCell.length === 0 && rightCell.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[
    leftCell.length ? leftCell : '',
    rightCell.length ? rightCell : '',
  ]];

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-stock', cells });
  element.replaceWith(block);
}
