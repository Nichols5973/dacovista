/*
 * Content Fragment Block
 * Renders an AEM Content Fragment selected by the author via an
 * `aem-content-fragment` reference field (see _content-fragment.json).
 *
 * Delivery model (observed in this project):
 *   AEM delivers the referenced fragment to the block as a REFERENCE LINK, e.g.
 *     <p class="button-container">
 *       <a class="button" href="/content/dam/<space>/<fragment>.html">
 *         /content/dam/<space>/<fragment></a>
 *     </p>
 *   i.e. the block gets the DAM path, NOT the fragment's rendered fields. The
 *   block must resolve that path, fetch the fragment's data, and render it.
 *
 *   (Some AEM setups instead render CF fields inline into the block — we handle
 *   that case too: if the block already contains real content elements, we keep
 *   them and only add the styling wrapper, preserving Universal Editor
 *   instrumentation.)
 */

/** Find the CF reference path from the block (link href or plain text path). */
function findReferencePath(block) {
  const link = block.querySelector('a[href*="/content/"]');
  if (link) return link.getAttribute('href');
  const text = block.textContent.replace(/\s+/g, ' ').trim();
  return text.startsWith('/content/') ? text : null;
}

/**
 * True only when the block holds real rendered fragment content — NOT when it
 * holds just a reference link to the fragment (which needs fetching).
 */
function hasInlineFragment(block, referencePath) {
  const meaningful = block.querySelector('h1,h2,h3,h4,h5,h6,ul,ol,table,blockquote,picture,img');
  if (meaningful) return true;
  // A lone reference link (its text is the /content/... path) is NOT content.
  const link = block.querySelector('a[href]');
  const text = block.textContent.replace(/\s+/g, ' ').trim();
  if (link) {
    const linkText = link.textContent.replace(/\s+/g, ' ').trim();
    const isRefLink = link.getAttribute('href') === referencePath
      || linkText === referencePath
      || linkText.startsWith('/content/');
    if (isRefLink && text === linkText) return false;
  }
  // Any substantive paragraph text that isn't just the path counts as inline.
  return !!text && !text.startsWith('/content/');
}

/** Candidate JSON endpoints for a CF DAM path + chosen variation. */
function candidateUrls(path, variation = 'master') {
  const clean = path.replace(/\.html?$/, '').replace(/\/$/, '');
  const v = (variation || 'master').trim() || 'master';
  const urls = [
    // CF field values live on the variation node under jcr:content/data.
    // ({clean}.json returns dam:Asset system metadata — jcr:*, uuids, dates.)
    `${clean}/jcr:content/data/${v}.json`,
  ];
  // Always keep master as a fallback if a non-master variation is missing.
  if (v !== 'master') urls.push(`${clean}/jcr:content/data/master.json`);
  urls.push(`${clean}.cfm.gql.json`); // Content Services / GraphQL export
  urls.push(`${clean}.model.json`); // Sling model export (some setups)
  return urls;
}

/** JCR/system property names that are never real CF fields. */
function isSystemKey(name) {
  return (
    name.startsWith('_')
    || name.startsWith(':')
    || /^(jcr|cq|sling|dam|xmp|mix|nt|rep|pdf|tiff|exif|dc|granite):/i.test(name)
    || /@/.test(name) // element metadata sidecars, e.g. "description@ContentType"
    || name === 'model'
  );
}

/** True if a value is a JCR system artifact (uuid, iso-date, primary-type-ish). */
function isSystemValue(value) {
  if (typeof value !== 'string') return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return true; // uuid
  if (/^[A-Z][a-z]{2} [A-Z][a-z]{2} \d{2} \d{4} \d{2}:\d{2}:\d{2} GMT/.test(value)) return true; // JCR date
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return true; // ISO date
  if (/^(nt|dam|cq|mix|sling):/i.test(value)) return true; // primaryType / mixin values
  return false;
}

/** Normalise the many CF JSON shapes down to a flat { fieldName: value } map. */
function extractFields(data) {
  if (!data || typeof data !== 'object') return null;

  // .../jcr:content/data/master.json -> { ":type": "<model>", field: value, ... }
  // (system keys are filtered later in buildInner via isSystemKey/isSystemValue).
  // If the payload nests the master node, unwrap it.
  let node = data;
  if (node['jcr:content']) node = node['jcr:content'];
  if (node.data && node.data.master) node = node.data.master;
  else if (node.master) node = node.master;

  // AEM Assets HTTP API: { properties: { elements: { name: { value, ":type" } } } }
  const elements = node.properties && node.properties.elements;
  if (elements && typeof elements === 'object') {
    const out = {};
    Object.entries(elements).forEach(([name, el]) => {
      out[name] = el && typeof el === 'object' && 'value' in el ? el.value : el;
    });
    return out;
  }

  // Content Services / GraphQL: { data: { <query>: { item(s): { ...fields } } } }
  let fields = node;
  if (fields.data && !fields.data.master) [fields] = Object.values(fields.data);
  if (fields && fields.item) fields = fields.item;
  if (fields && Array.isArray(fields.items) && fields.items.length) [fields] = fields.items;
  if (fields && fields.fields) fields = fields.fields;
  return fields;
}

/** Render one field value into a styled element. */
function renderField(name, value) {
  if (value === null || value === undefined || value === '') return null;

  if (typeof value === 'object' && !Array.isArray(value)) {
    if (value.html) {
      const div = document.createElement('div');
      div.className = 'cf-richtext';
      div.innerHTML = value.html;
      return div;
    }
    if (value.plaintext) {
      const p = document.createElement('p');
      p.textContent = value.plaintext;
      return p;
    }
    return null;
  }

  // HTML string (rich text element from the Assets API :type text/html)
  if (typeof value === 'string' && /<[a-z][\s\S]*>/i.test(value)) {
    const div = document.createElement('div');
    div.className = 'cf-richtext';
    div.innerHTML = value;
    return div;
  }

  // Image/asset path
  if (typeof value === 'string' && /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(value)) {
    const img = document.createElement('img');
    img.src = value;
    img.alt = name;
    img.loading = 'lazy';
    return img;
  }

  // A page/content reference path with no paired label -> render as a link,
  // never as raw path text.
  if (typeof value === 'string' && /^\/content\//.test(value)) {
    const p = document.createElement('p');
    p.className = 'button-container';
    const a = document.createElement('a');
    a.className = 'button';
    a.href = value.replace(/\.html?$/, '');
    a.textContent = 'Learn more';
    p.append(a);
    return p;
  }

  const el = document.createElement(/title|heading|name|headline/i.test(name) ? 'h2' : 'p');
  el.textContent = String(value);
  return el;
}

/** Is this a /content path reference value? */
function isContentRef(value) {
  return typeof value === 'string' && /^\/content\//.test(value);
}

/** Build the inner container from a flat/array field set. Returns it or null. */
function buildInner(fields) {
  const container = document.createElement('div');
  container.className = 'content-fragment-inner';
  if (Array.isArray(fields)) {
    fields.forEach(({ name, value }) => {
      const el = renderField(name, value);
      if (el) container.append(el);
    });
  } else if (fields && typeof fields === 'object') {
    const entries = Object.entries(fields).filter(
      ([name, value]) => !isSystemKey(name) && !isSystemValue(value)
        && value !== null && value !== undefined && value !== '',
    );
    for (let i = 0; i < entries.length; i += 1) {
      const [name, value] = entries[i];
      const next = entries[i + 1];
      // CTA pairing: a /content reference followed by a short plain-text label
      // (e.g. ctaLink="/content/…" + ctaText="Learn More") -> one styled button.
      const nextIsLabel = next
        && typeof next[1] === 'string'
        && !isContentRef(next[1])
        && !/<[a-z][\s\S]*>/i.test(next[1])
        && next[1].length <= 40;
      if (isContentRef(value) && nextIsLabel) {
        const [, label] = next;
        const p = document.createElement('p');
        p.className = 'button-container';
        const a = document.createElement('a');
        a.className = 'button';
        a.href = value.replace(/\.html?$/, '');
        a.textContent = label;
        p.append(a);
        container.append(p);
        i += 1; // consume the label entry
      } else {
        const el = renderField(name, value);
        if (el) container.append(el);
      }
    }
  }
  return container.children.length ? container : null;
}

async function fetchCf(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}

/**
 * Reorganise a flat .content-fragment-inner into a two-column card:
 *   .cf-media   (the first image / picture)
 *   .cf-content (heading, subheading, body, CTA — everything else)
 * Matches the reference card layout (image left, text right, CTA button).
 * If there's no image, leaves a single content column (CSS falls back to 1-up).
 */
function layoutAsCard(inner) {
  const media = document.createElement('div');
  media.className = 'cf-media';
  const content = document.createElement('div');
  content.className = 'cf-content';

  Array.from(inner.children).forEach((child) => {
    const isImage = child.tagName === 'PICTURE' || child.tagName === 'IMG'
      || child.querySelector?.('picture, img');
    if (isImage && !media.children.length) media.append(child);
    else content.append(child);
  });

  inner.textContent = '';
  if (media.children.length) inner.append(media);
  inner.append(content);
  inner.classList.toggle('cf-has-media', !!media.children.length);
}

/**
 * Extract the selected CF variation from the block and remove its cell so it
 * doesn't render as content. The `variation` select renders as a short text
 * cell holding one of the known variation values. Returns 'master' if absent.
 */
function extractVariation(block) {
  const known = ['master', 'mobile', 'desktop', 'teaser', 'summary', 'social'];
  let variation = 'master';
  block.querySelectorAll('p, div').forEach((el) => {
    // Only consider leaf cells with just a short text value (no child elements).
    if (el.children.length) return;
    const text = el.textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    if (known.includes(text)) {
      variation = text;
      const cell = el.closest('div') || el;
      cell.remove();
    }
  });
  return variation;
}

export default async function decorate(block) {
  const variation = extractVariation(block);
  const referencePath = findReferencePath(block);

  // Case 1: AEM rendered the fragment fields inline — keep them, just wrap.
  if (hasInlineFragment(block, referencePath)) {
    const inner = document.createElement('div');
    inner.className = 'content-fragment-inner';
    while (block.firstElementChild) inner.append(block.firstElementChild);
    block.append(inner);
    layoutAsCard(inner);
    return;
  }

  // Case 2: block holds only a reference path — fetch and render the fragment.
  if (!referencePath) return;

  const urls = candidateUrls(referencePath, variation);
  const data = await urls.reduce(
    (acc, url) => acc.then((found) => found || fetchCf(url)),
    Promise.resolve(null),
  );

  const inner = data && buildInner(extractFields(data));
  if (inner) {
    block.textContent = '';
    block.append(inner);
    layoutAsCard(inner);
  }
  // If the fetch failed (e.g. CORS/auth in a context that can't reach the DAM),
  // leave the block as-is rather than throwing — avoids a broken author view.
}
