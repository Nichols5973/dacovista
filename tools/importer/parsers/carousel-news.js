/* eslint-disable */
/* global WebImporter */
/**
 * Parser for carousel-news. Base block: carousel (container).
 * Source: https://www.covista.com/ (div.t-layout__one-column.edge-to-edge.carousel-view--edge-to-edge)
 * Project type: xwalk. Item model blocks/carousel-news/_carousel-news.json ->
 *   carousel-news-item = { media_image, media_imageAlt, content_text }.
 *
 * Library convention (Carousel container): row 1 = block name; one row per slide.
 *   Each slide row has 2 cells: [image cell (field:media_image)] + [text cell (field:content_text)].
 *
 * Content model decisions:
 *   - The source uses a Slick slider that CLONES slides for infinite scroll
 *     (.slick-cloned). We select only real slides (:not(.slick-cloned)) to avoid
 *     emitting duplicate rows — 6 unique slides.
 *   - Image cell (field:media_image) carries the slide image.
 *   - Text cell (field:content_text) = taxonomy tags line (as a paragraph, links flattened
 *     to plain text since they point to internal /taxonomy term pages) + the article title
 *     link (preserved as an anchor to the /news/... article).
 */
export default function parse(element, { document }) {
  // Real slides only — exclude Slick clones.
  let slides = Array.from(element.querySelectorAll('.views-row.slick-slide:not(.slick-cloned)'));
  // Fallbacks for non-slick / variant markup.
  if (slides.length === 0) slides = Array.from(element.querySelectorAll('.views-row:not(.slick-cloned)'));
  if (slides.length === 0) slides = Array.from(element.querySelectorAll('.slide'));

  const cells = [];

  slides.forEach((slide) => {
    const img = slide.querySelector('.image--container img, img');
    const tagsEl = slide.querySelector('.view-tag-field, .tags-date--wrapper');
    // Title link: query in priority order. A single comma-selector querySelector returns
    // the first match in DOM order (which would be a taxonomy tag anchor), so use an
    // explicit fallback chain instead.
    const titleLink = slide.querySelector('.view-title-field a[href]')
      || slide.querySelector('a[href^="/news/"]')
      || slide.querySelector('a[href]:not([href^="/taxonomy"])');

    // Image cell (field:media_image).
    let imageCell;
    if (img) {
      imageCell = document.createDocumentFragment();
      imageCell.appendChild(document.createComment(' field:media_image '));
      imageCell.appendChild(img);
    } else {
      imageCell = ''; // keep the cell; no hint on empty
    }

    // Text cell (field:content_text): tags paragraph + article title link.
    const textCell = document.createDocumentFragment();
    textCell.appendChild(document.createComment(' field:content_text '));
    if (tagsEl) {
      const tagsText = (tagsEl.textContent || '').replace(/\s+/g, ' ').trim();
      if (tagsText) {
        const p = document.createElement('p');
        p.textContent = tagsText;
        textCell.appendChild(p);
      }
    }
    if (titleLink && titleLink.getAttribute('href')) {
      const a = document.createElement('a');
      a.setAttribute('href', titleLink.getAttribute('href'));
      a.textContent = (titleLink.textContent || '').replace(/\s+/g, ' ').trim();
      if (a.textContent) textCell.appendChild(a);
    }

    if (img || tagsEl || titleLink) {
      cells.push([imageCell, textCell]);
    }
  });

  // Empty-block guard.
  if (cells.length === 0) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'carousel-news', cells });
  element.replaceWith(block);
}
