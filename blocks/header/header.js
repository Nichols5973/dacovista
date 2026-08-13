import { getMetadata } from '../../scripts/aem.js';

// media query match that indicates desktop width
const isDesktop = window.matchMedia('(min-width: 900px)');

/**
 * Collapse every open nav dropdown.
 * @param {Element} navSections container of the top-level nav items
 * @param {Boolean} expanded desired expanded state
 */
function toggleAllNavSections(navSections, expanded = false) {
  navSections.querySelectorAll(':scope > ul > li').forEach((section) => {
    if (section.querySelector(':scope > ul')) {
      section.setAttribute('aria-expanded', expanded);
    }
  });
}

/**
 * Toggle the whole mobile nav open/closed.
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null
    ? !forceExpanded
    : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, false);
  if (button) {
    button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  }
}

function closeOnEscape(nav, navSections) {
  window.addEventListener('keydown', (e) => {
    if (e.code !== 'Escape') return;
    const openDrop = navSections.querySelector(':scope > ul > li[aria-expanded="true"]');
    if (openDrop && isDesktop.matches) {
      toggleAllNavSections(navSections);
    } else if (!isDesktop.matches && nav.getAttribute('aria-expanded') === 'true') {
      toggleMenu(nav, navSections);
    }
  });
}

/**
 * Loads and decorates the header nav.
 * @param {Element} block the header block element
 */
export default async function decorate(block) {
  // resolve nav fragment path (metadata override, else default)
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';

  // dual-fetch: localhost (/content/nav.plain.html) then DA/EDS ({navPath}.plain.html)
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch(`${navPath}.plain.html`);
  if (!resp.ok) return;
  const html = await resp.text();

  const fragment = document.createElement('div');
  fragment.innerHTML = html;

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.setAttribute('aria-expanded', 'false');
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  // three source sections: utility bar, brand (logo), main nav
  const classes = ['utility', 'brand', 'sections'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  // brand: strip button decoration off the logo link
  const navBrand = nav.querySelector('.nav-brand');
  if (navBrand) {
    navBrand.querySelectorAll('.button-container').forEach((bc) => bc.classList.remove('button-container'));
    navBrand.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
  }

  // main nav: mark items with a submenu as dropdowns, wire interactions
  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
      if (navSection.querySelector(':scope > ul')) {
        navSection.classList.add('nav-drop');
        navSection.setAttribute('aria-expanded', 'false');
      }
      // strip any button decoration inside the nav
      navSection.querySelectorAll('.button-container').forEach((bc) => bc.classList.remove('button-container'));
      navSection.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));

      // click to toggle (mobile primarily; desktop uses hover via CSS but click also works)
      navSection.addEventListener('click', (e) => {
        if (!navSection.classList.contains('nav-drop')) return;
        // let clicks on the submenu links through
        if (e.target.closest(':scope > ul')) return;
        if (isDesktop.matches) return; // desktop opens on hover
        e.preventDefault();
        const expanded = navSection.getAttribute('aria-expanded') === 'true';
        toggleAllNavSections(navSections);
        navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);

  // reset state on breakpoint change (prevents desktop layout stuck open)
  const applyBreakpoint = () => {
    if (isDesktop.matches) {
      document.body.style.overflowY = '';
      nav.setAttribute('aria-expanded', 'false');
      toggleAllNavSections(navSections, false);
    }
  };
  isDesktop.addEventListener('change', applyBreakpoint);

  closeOnEscape(nav, navSections);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);
}
