/*
 * Content Fragment Block
 * Renders an AEM Content Fragment selected by the author via an
 * `aem-content-fragment` reference field (see _content-fragment.json).
 *
 * Delivery model (AEM crosswalk / Universal Editor):
 *   When a CF is referenced, AEM SERVER-SIDE renders the fragment's fields
 *   directly INTO this block's DOM (headings, paragraphs, <picture>/<img>,
 *   links, etc.) — the content is already present after decoration. The block
 *   must therefore DECORATE the existing content in place, not fetch-and-replace.
 *
 *   Wiping the block and fetching a JSON endpoint breaks two things:
 *     1) Author mode — it strips the Universal Editor instrumentation
 *        (data-aue-* attributes) AEM adds, so the component stops being editable
 *        and renders blank.
 *     2) Preview/publish — the reliable inline content is discarded in favour of
 *        a `.cfm.gql.json` call that only works when a persisted GraphQL query
 *        exists, which most fragments do not have.
 *
 *   So: keep AEM's inline output, just add the styling wrapper. Only if the block
 *   contains nothing but a bare reference link (rare edge case, e.g. hand-authored
 *   EDS content) do we attempt a best-effort fetch as a fallback.
 */

/** True when the block already holds AEM-rendered fragment content. */
function hasInlineContent(block) {
  // Any real content element (not just an empty wrapper or a lone reference link).
  const meaningful = block.querySelector(
    'h1,h2,h3,h4,h5,h6,p,ul,ol,li,picture,img,table,blockquote',
  );
  if (meaningful) return true;
  // Text content beyond a single reference link also counts.
  const onlyLink = block.querySelector('a[href]');
  const text = block.textContent.replace(/\s+/g, ' ').trim();
  return !!text && !(onlyLink && text === onlyLink.textContent.trim());
}

/** Fallback: render fields from a fetched CF JSON payload. */
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
  if (typeof value === 'string' && /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(value)) {
    const img = document.createElement('img');
    img.src = value;
    img.alt = name;
    img.loading = 'lazy';
    return img;
  }
  const el = document.createElement(/title|heading|name/i.test(name) ? 'h2' : 'p');
  el.textContent = String(value);
  return el;
}

function extractFields(data) {
  let fields = data;
  if (fields && fields.data) [fields] = Object.values(fields.data);
  if (fields && fields.item) fields = fields.item;
  if (fields && Array.isArray(fields.items) && fields.items.length) [fields] = fields.items;
  if (fields && fields.fields) fields = fields.fields;
  return fields;
}

async function fetchCfData(url) {
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}

async function fetchAndRender(block, path) {
  const clean = path.replace(/\.html?$/, '').replace(/\/$/, '');
  // Try the model-export JSON first (works without a persisted query), then GraphQL.
  const urls = [`${clean}.json`, `${clean}.cfm.gql.json`];
  // Sequential best-effort: resolve the first URL that returns usable data.
  const data = await urls.reduce(
    (acc, url) => acc.then((found) => found || fetchCfData(url)),
    Promise.resolve(null),
  );
  if (!data) return false;

  const fields = extractFields(data);
  const container = document.createElement('div');
  container.className = 'content-fragment-inner';
  if (Array.isArray(fields)) {
    fields.forEach(({ name, value }) => {
      const el = renderField(name, value);
      if (el) container.append(el);
    });
  } else if (fields && typeof fields === 'object') {
    Object.entries(fields).forEach(([name, value]) => {
      if (name.startsWith('_') || name === 'model') return;
      const el = renderField(name, value);
      if (el) container.append(el);
    });
  }
  if (!container.children.length) return false;
  block.textContent = '';
  block.append(container);
  return true;
}

export default async function decorate(block) {
  // Preferred path: AEM already rendered the fragment inline — keep it, just wrap
  // for styling. This preserves Universal Editor instrumentation (author mode) and
  // works in preview/publish without any network call.
  if (hasInlineContent(block)) {
    const inner = document.createElement('div');
    inner.className = 'content-fragment-inner';
    while (block.firstElementChild) inner.append(block.firstElementChild);
    block.append(inner);
    return;
  }

  // Fallback: block holds only a reference link/path (e.g. hand-authored EDS).
  const link = block.querySelector('a[href]');
  const text = block.textContent.trim();
  const path = (link && link.getAttribute('href'))
    || (text.startsWith('/content/') ? text : null);
  if (path) {
    await fetchAndRender(block, path);
  }
}
