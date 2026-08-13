/*
 * Content Fragment Block
 * Renders an AEM Content Fragment selected by the author in Universal Editor.
 *
 * Authoring model (_content-fragment.json): a single `aem-content-fragment`
 * reference field. In the decorated DOM that reference arrives either as a link
 * (`<a href="/content/dam/.../fragment">`) in the block's first cell, or as text
 * holding the fragment path. This block resolves the path, fetches the CF's JSON
 * via AEM's Content Services endpoint, and renders its fields generically
 * (headings, rich text, images) in source order.
 *
 * Generic-by-design: it does not assume a specific CF model, so any model works.
 */

/** Pull the CF path from the block's authored content. */
function findReferencePath(block) {
  const link = block.querySelector('a[href]');
  if (link) return link.getAttribute('href');
  const text = block.textContent.trim();
  if (text.startsWith('/content/')) return text;
  return null;
}

/**
 * Build the AEM Content Services JSON URL for a CF path.
 * /content/dam/<space>/<fragment> -> /content/dam/<space>/<fragment>.cfm.gql.json
 * Falls back to the model-export `.json` if needed by the caller.
 */
function toCfJsonUrl(path) {
  const clean = path.replace(/\.html?$/, '').replace(/\/$/, '');
  return `${clean}.cfm.gql.json`;
}

/** Render a single CF field value into an element, styled generically. */
function renderField(name, value) {
  if (value === null || value === undefined || value === '') return null;

  // Rich text / multiline text objects: { html } or { plaintext }
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

  // Image-like field (path to an asset)
  if (typeof value === 'string' && /\.(jpe?g|png|gif|webp|svg)(\?|$)/i.test(value)) {
    const img = document.createElement('img');
    img.src = value;
    img.alt = name;
    img.loading = 'lazy';
    return img;
  }

  // Title-ish field -> heading; everything else -> paragraph
  const el = document.createElement(/title|heading|name/i.test(name) ? 'h2' : 'p');
  el.textContent = String(value);
  return el;
}

/** Render all fields from a CF JSON payload into the block. */
function renderFragment(block, data) {
  // Content Services shapes vary:
  //   { data: { <queryName>: { item(s): { ...fields } } } }  (GraphQL persisted query)
  //   { <fragmentName>: { fields } }                          (model export)
  //   { fields: [{ name, value }] }                           (some exports)
  let fields = data;
  if (fields && fields.data) [fields] = Object.values(fields.data);
  if (fields && fields.item) fields = fields.item; // GraphQL single-item wrapper
  if (fields && Array.isArray(fields.items) && fields.items.length) [fields] = fields.items;
  if (fields && fields.fields) fields = fields.fields; // some exports nest under fields[]

  block.textContent = '';
  const container = document.createElement('div');
  container.className = 'content-fragment-inner';

  if (Array.isArray(fields)) {
    // fields as [{ name, value }]
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
  block.append(container);
  return true;
}

export default async function decorate(block) {
  const path = findReferencePath(block);
  if (!path) {
    block.textContent = '';
    return;
  }

  try {
    const resp = await fetch(toCfJsonUrl(path));
    if (!resp.ok) throw new Error(`CF fetch ${resp.status}`);
    const data = await resp.json();
    const ok = renderFragment(block, data);
    if (!ok) block.textContent = '';
  } catch (e) {
    // Non-fatal: leave the block empty rather than showing a broken state.
    // eslint-disable-next-line no-console
    console.warn('content-fragment: could not load', path, e);
    block.textContent = '';
  }
}
