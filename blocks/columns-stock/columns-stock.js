export default function decorate(block) {
  const rows = [...block.children];
  const firstRow = rows[0];
  const cells = firstRow ? [...firstRow.children] : [];
  block.classList.add(`columns-stock-${cells.length}-cols`);

  // Classify cells: the cell with a picture is the media/callout column,
  // the other holds the stock figures.
  cells.forEach((cell) => {
    if (cell.querySelector('picture')) {
      cell.classList.add('columns-stock-content');
    } else {
      cell.classList.add('columns-stock-figures');
    }
  });

  // --- LEFT: structure the stock ticker figures ---
  const figCell = block.querySelector('.columns-stock-figures');
  if (figCell) {
    const paras = [...figCell.querySelectorAll(':scope > p')];
    let symbolP;
    let timeP;
    let delayP;
    let priceP;
    let changeP;
    paras.forEach((p) => {
      const t = p.textContent.trim();
      if (/^\$/.test(t)) priceP = p;
      else if (/^change/i.test(t)) changeP = p;
      else if (/^as of/i.test(t)) timeP = p;
      else if (/delay/i.test(t)) delayP = p;
      else if (!symbolP) symbolP = p;
    });

    // Header: symbol on the left, timestamp + delay right-aligned.
    if (symbolP && (timeP || delayP)) {
      const head = document.createElement('div');
      head.className = 'columns-stock-head';
      symbolP.classList.add('columns-stock-symbol');
      const ts = document.createElement('div');
      ts.className = 'columns-stock-timestamp';
      if (timeP) ts.append(timeP);
      if (delayP) ts.append(delayP);
      symbolP.replaceWith(head);
      head.append(symbolP, ts);
    }

    if (priceP) priceP.classList.add('columns-stock-price');

    // Change row: split into label + value so we can push value right.
    if (changeP) {
      changeP.classList.add('columns-stock-change');
      const t = changeP.textContent.trim();
      const m = t.match(/^(.*?)(?:\s+)([-+]?[\d.,]+%?)$/);
      if (m) {
        const [, labelText, valueText] = m;
        changeP.textContent = '';
        const label = document.createElement('span');
        label.className = 'columns-stock-change-label';
        label.textContent = labelText;
        const value = document.createElement('span');
        value.className = 'columns-stock-change-value';
        value.textContent = valueText;
        changeP.append(label, value);
      }
    }
  }

  // --- RIGHT: separate the image from the callout copy ---
  const contentCell = block.querySelector('.columns-stock-content');
  if (contentCell) {
    const pic = contentCell.querySelector('picture');
    const mediaP = pic ? pic.closest('p') : null;
    if (mediaP) mediaP.classList.add('columns-stock-media');

    // Wrap everything that is not the image into a callout panel.
    const callout = document.createElement('div');
    callout.className = 'columns-stock-callout';
    [...contentCell.children].forEach((child) => {
      if (child !== mediaP) callout.append(child);
    });
    if (mediaP) mediaP.after(callout);
    else contentCell.append(callout);
  }
}
