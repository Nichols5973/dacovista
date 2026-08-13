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

/** Build the decorative search affordance (magnifying-glass icon). */
function buildSearch() {
  const search = document.createElement('div');
  search.className = 'nav-search';
  search.innerHTML = `<button type="button" aria-label="Search">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
        <circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/>
        <line x1="16.5" y1="16.5" x2="21" y2="21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>`;
  return search;
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

  const navUtility = nav.querySelector('.nav-utility');
  const navBrand = nav.querySelector('.nav-brand');
  const navSections = nav.querySelector('.nav-sections');

  // brand: strip button decoration off the logo link
  if (navBrand) {
    navBrand.querySelectorAll('.button-container').forEach((bc) => bc.classList.remove('button-container'));
    navBrand.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
  }

  // main nav: mark items with a submenu as dropdowns, wire interactions
  if (navSections) {
    navSections.querySelectorAll(':scope > ul > li').forEach((navSection) => {
      if (navSection.querySelector(':scope > ul')) {
        navSection.classList.add('nav-drop');
        navSection.setAttribute('aria-expanded', 'false');
      }
      navSection.querySelectorAll('.button-container').forEach((bc) => bc.classList.remove('button-container'));
      navSection.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));

      navSection.addEventListener('click', (e) => {
        if (!navSection.classList.contains('nav-drop')) return;
        if (e.target.closest(':scope > ul')) return; // let submenu link clicks through
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

  const search = buildSearch();

  // Compose two full-width bands: cream utility strip + green main bar.
  const utilityBar = document.createElement('div');
  utilityBar.className = 'nav-utility-bar';
  if (navUtility) utilityBar.append(navUtility);

  const mainBar = document.createElement('div');
  mainBar.className = 'nav-main-bar';
  if (navBrand) mainBar.append(navBrand);
  if (navSections) mainBar.append(navSections);
  mainBar.append(search);
  mainBar.append(hamburger);

  nav.append(utilityBar, mainBar);

  // reset state on breakpoint change
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
