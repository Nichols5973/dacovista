import { getMetadata } from '../../scripts/aem.js';

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';

  // dual-fetch: localhost (/content/footer.plain.html) then DA/EDS ({footerPath}.plain.html)
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch(`${footerPath}.plain.html`);
  if (!resp.ok) return;
  const html = await resp.text();

  block.textContent = '';
  const footer = document.createElement('div');
  footer.innerHTML = html;

  // label the four source sections for styling
  const classes = ['footer-top', 'footer-nav', 'footer-legal', 'footer-meta'];
  classes.forEach((c, i) => {
    const section = footer.children[i];
    if (section) section.classList.add(c);
  });

  block.append(footer);
}
