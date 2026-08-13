/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-video. Base block: hero.
 * Source: https://www.covista.com/ (div.homepage-hero)
 * Project type: xwalk (field hints required — model blocks/hero-video/_hero-video.json: image, imageAlt, text)
 *
 * Library convention (Hero): 1 column, up to 3 rows.
 *   Row 1 = block name.
 *   Row 2 = background media (field:image).
 *   Row 3 = title + subheading + CTA as richtext (field:text).
 *
 * Content model decisions:
 *   - The source hero uses a background <video> (header_final.mp4) with a mobile
 *     fallback <img> (homepage_hero.png). Both are carried in the field:image cell:
 *     the fallback <img> (natural asset reference) plus a carrier <a href=mp4> that
 *     preserves the video URL end-to-end (same carrier-anchor philosophy the DM
 *     transformer uses for non-plain image URLs).
 *   - H1 heading (<br>-separated in source) is normalized to a single clean line.
 *   - Single CTA "Our story" -> /our-story is rebuilt as a clean anchor (icon span dropped).
 */
export default function parse(element, { document }) {
  // --- Extract background video mp4 (skip empty <source src="">) ---
  let videoUrl = '';
  const sources = Array.from(element.querySelectorAll('video source'));
  const mp4Source = sources.find((s) => (s.getAttribute('src') || '').toLowerCase().includes('.mp4'))
    || sources.find((s) => (s.getAttribute('src') || '').trim());
  if (mp4Source) videoUrl = mp4Source.getAttribute('src').trim();

  // --- Extract mobile fallback image ---
  const fallbackImg = element.querySelector('.i-mobile-only img, .e-image--mobile img, picture img, img');

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
  if (!heading && ctaLinks.length === 0 && !fallbackImg && !videoUrl) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [];

  // Row 2: background media (field:image) — fallback image + video carrier anchor.
  if (fallbackImg || videoUrl) {
    const imageCell = document.createDocumentFragment();
    imageCell.appendChild(document.createComment(' field:image '));
    if (fallbackImg) imageCell.appendChild(fallbackImg);
    if (videoUrl) {
      const videoAnchor = document.createElement('a');
      videoAnchor.setAttribute('href', videoUrl);
      videoAnchor.textContent = 'Background video';
      imageCell.appendChild(videoAnchor);
    }
    cells.push([imageCell]);
  }

  // Row 3: content (field:text) — heading + CTA(s).
  const textCell = document.createDocumentFragment();
  textCell.appendChild(document.createComment(' field:text '));
  if (heading) textCell.appendChild(heading);
  ctaLinks.forEach((a) => textCell.appendChild(a));
  cells.push([textCell]);

  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-video', cells });
  element.replaceWith(block);
}
