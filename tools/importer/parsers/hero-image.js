/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-image. Base block: hero.
 * Source: https://www.covista.com/ (div.homepage-hero)
 * Project type: xwalk (field hints required — model blocks/hero-image/_hero-image.json: image, imageAlt, text)
 *
 * Library convention (Hero): 1 column, up to 3 rows (never more than 3).
 *   Row 1 = block name (added by WebImporter.Blocks.createBlock).
 *   Row 2 = background image (field:image).
 *   Row 3 = title + optional subheading + CTA as richtext (field:text).
 *
 * Content model decisions:
 *   - The source hero uses a background <video> with a mobile fallback <img>
 *     (homepage_hero.png). This block migrates it as a still hero IMAGE: only the
 *     fallback <img> is carried in the field:image cell (the video is dropped so the
 *     hero previews reliably as an image).
 *   - H1 heading (<br>-separated in source) is normalized to a single clean line.
 *   - Single CTA "Our story" -> /our-story is rebuilt as a clean anchor (icon span dropped).
 */
export default function parse(element, { document }) {
  // --- Extract hero image (mobile fallback / first available image) ---
  const heroImg = element.querySelector('.i-mobile-only img, .e-image--mobile img, picture img, img');

  // --- Extract heading (normalize <br> line-breaks to spaces for a single clean title) ---
  const headingEl = element.querySelector('.p-banner-heading, h1, h2, [class*="banner"][class*="heading"]');
  let heading = null;
  if (headingEl) {
    const clone = headingEl.cloneNode(true);
    // Replace <br> with a space so "Talent<br>to" becomes "Talent to", not "Talentto".
    clone.querySelectorAll('br').forEach((br) => br.replaceWith(document.createTextNode(' ')));
    const text = (clone.textContent || '').replace(/\s+/g, ' ').trim();
    if (text) {
      heading = document.createElement('h1');
      heading.textContent = text;
    }
  }

  // --- Extract CTA link(s), rebuilt clean (drop decorative icon spans) ---
  const ctaAnchors = Array.from(element.querySelectorAll('.p-banner-cta a[href], .p-cv-banner--cta a[href], [class*="banner"][class*="cta"] a[href]'));
  const ctaLinks = ctaAnchors.map((a) => {
    const link = document.createElement('a');
    link.setAttribute('href', a.getAttribute('href'));
    link.textContent = (a.textContent || '').replace(/\s+/g, ' ').trim();
    return link;
  }).filter((a) => a.getAttribute('href') && a.textContent);

  // --- Empty-block guard ---
  if (!heading && ctaLinks.length === 0 && !heroImg) {
    element.replaceWith(...element.childNodes);
    return;
  }

  // Hero convention: max 3 rows -> [block name], [image], [text]. Build rows 2 & 3.
  const cells = [];

  // Row 2: background image (field:image).
  if (heroImg) {
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    imageCell.appendChild(heroImg);
    cells.push([imageCell]);
  }

  // Row 3: content (field:text) — heading + CTA(s).
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  if (heading) textCell.appendChild(heading);
  ctaLinks.forEach((a) => textCell.appendChild(a));
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-image', cells });
  element.replaceWith(block);
}
