/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Covista site-wide cleanup.
 *
 * Removes non-authorable chrome (site header/nav, footer, cookie/consent bar,
 * admin region, skip link) and non-content elements (scripts, styles, hidden
 * media controls, tracking attributes) so only the main article content under
 * <main class="page--main"> survives for block parsing.
 *
 * ALL selectors were validated against migration-work/cleaned.html.
 * Source lines noted per selector.
 *
 * Runtime note: both the import script and the validation hook set
 * `element` = document.body, so header/footer/consent (siblings of <main>,
 * not descendants) are all reachable from here.
 */

const TransformHook = {
  beforeTransform: 'beforeTransform',
  afterTransform: 'afterTransform',
};

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // --- Overlays / consent / non-content that could interfere with parsing ---
    WebImporter.DOMUtils.remove(element, [
      // Cookie/consent bar at top of <body> (cleaned.html line 5)
      '#consent_blackbar',
      // "Skip to main content" accessibility link (cleaned.html line 2)
      'a.skip-link',
      // Hidden banner play/pause control inside the hero video (cleaned.html line ~775)
      '.c-banner-videobutton',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // --- Non-authorable site chrome (removed after block parsing) ---
    WebImporter.DOMUtils.remove(element, [
      // Global site header / primary + utility navigation (cleaned.html line 10)
      'header.page--header',
      // Drupal admin/toolbar region (cleaned.html line 745)
      '.region__admin',
      // Global site footer (cleaned.html line 1924)
      'footer.page--footer',
    ]);

    // --- Non-content elements that may exist on the live page (safe no-ops
    // if absent in the scraped DOM; the validation hook loads the live URL) ---
    WebImporter.DOMUtils.remove(element, [
      'script',
      'style',
      'noscript',
      'link',
      'iframe',
    ]);

    // --- Strip GTM / analytics / Drupal behavior attributes site-wide ---
    element.querySelectorAll('*').forEach((el) => {
      // Google Tag Manager / dataLayer hooks
      [...el.attributes].forEach((attr) => {
        const n = attr.name;
        if (
          n === 'onclick'
          || n === 'data-once'                // Drupal "once" behavior marker (cleaned.html body)
          || n.startsWith('data-gtm')
          || n.startsWith('data-ga')
          || n.startsWith('data-analytics')
          || n.startsWith('data-track')
          || n.startsWith('data-drupal')
        ) {
          el.removeAttribute(n);
        }
      });
    });
  }
}
