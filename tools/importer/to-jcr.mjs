/* eslint-disable no-console */
/**
 * Convert migrated content/*.plain.html into JCR XML for AEM Author (xwalk).
 * Uses @adobe/helix-md2jcr with the project's Universal Editor component files.
 *
 * Usage: node tools/importer/to-jcr.mjs <plain.html> <out.xml> [pageTitle]
 */
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const SCRIPTS = '/home/node/.excat-marketplaces/excat-marketplace/excat/skills/excat-content-import/scripts/node_modules';
const { html2md } = await import(`${SCRIPTS}/@adobe/helix-importer/src/index.js`);
const { md2jcr } = await import(`${SCRIPTS}/@adobe/helix-md2jcr/src/index.js`);
const { JSDOM } = await import(`${SCRIPTS}/jsdom/lib/api.js`);

const PROJECT = process.cwd();

async function readJson(p) {
  return JSON.parse(await readFile(p, 'utf-8'));
}

async function main() {
  const [, , inFile, outFile, pageTitle] = process.argv;
  if (!inFile || !outFile) {
    console.error('Usage: node to-jcr.mjs <plain.html> <out.xml> [pageTitle]');
    process.exit(1);
  }

  // Load UE component files (arrays / wrapped forms both handled)
  const modelsRaw = await readJson(path.join(PROJECT, 'component-models.json'));
  const defRaw = await readJson(path.join(PROJECT, 'component-definition.json'));
  const filtersRaw = await readJson(path.join(PROJECT, 'component-filters.json'));

  const models = Array.isArray(modelsRaw) ? modelsRaw : modelsRaw.models;
  const filters = Array.isArray(filtersRaw) ? filtersRaw : filtersRaw.filters;
  let definition;
  if (defRaw.groups) definition = defRaw;
  else if (defRaw.definitions) definition = { groups: [{ title: 'Blocks', id: 'blocks', components: defRaw.definitions }] };
  else definition = defRaw;

  // Wrap the plain.html fragment into a full document so html2md sees a <main>.
  const frag = await readFile(inFile, 'utf-8');
  const title = pageTitle || path.basename(inFile, '.plain.html');
  const html = `<!DOCTYPE html><html><head><title>${title}</title></head><body><main>${frag}</main></body></html>`;

  // Step 1: HTML -> Markdown (block tables preserved as gridtables).
  // html2md needs a real DOM document — build one with jsdom.
  const url = 'https://main--dacovista--nichols5973.aem.page/';
  const { document } = new JSDOM(html, { url }).window;
  const res = await html2md(url, document, null, {}, {});
  const md = res.md;

  // Step 2: Markdown -> JCR XML using the project's UE models
  const xml = await md2jcr(md, { models, definition, filters });

  await writeFile(outFile, xml, 'utf-8');
  console.log(`✅ ${inFile} -> ${outFile} (${xml.length} bytes)`);
  // quick sanity: report top-level jcr node + block names present
  const dom = new JSDOM(xml, { contentType: 'text/xml' });
  const doc = dom.window.document;
  const root = doc.documentElement;
  console.log('   root:', root.nodeName);
  const blocks = [...doc.querySelectorAll('*')]
    .map((n) => n.getAttribute && n.getAttribute('sling:resourceType'))
    .filter(Boolean);
  const names = [...new Set(blocks)];
  console.log('   resourceTypes:', names.join(', ').slice(0, 400));
}

main().catch((e) => { console.error(e); process.exit(1); });
