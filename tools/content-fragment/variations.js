/*
 * Content Fragment Variations — data source for the Universal Editor
 * "Fragment Variation" dropdown.
 *
 * ⚠️ SCAFFOLD / UNVERIFIED: this endpoint must run somewhere Universal Editor
 * can reach and that is allowed to call your AEM Author instance. It could NOT
 * be built or tested against your AEM from the migration environment — you must
 * deploy + verify it (see tools/content-fragment/README.md).
 *
 * Contract (what the model field expects):
 *   GET  /tools/content-fragment/variations.json?fragment=<cfPath>
 *   ->   [ { "name": "master", "title": "Master" },
 *          { "name": "broker", "title": "Broker" },
 *          { "name": "doctor", "title": "Doctor" } ]
 *
 * How it derives variations: AEM stores each CF variation as a child node under
 *   <cfPath>/jcr:content/data
 * (e.g. .../data/master, .../data/broker, .../data/doctor). This handler lists
 * those child node names and returns them as options. "master" is always first.
 *
 * This file is written as a generic async handler so it can be adapted to
 * whatever runtime you deploy it in (AEM servlet proxy, a small Node/Express
 * service, an edge function, etc.). Provide `aemFetch` that performs an
 * AUTHENTICATED GET against AEM Author and returns the parsed JSON.
 */

/**
 * @param {string} fragmentPath e.g. "/content/dam/covista/en/fragments/agent"
 * @param {(url:string)=>Promise<any>} aemFetch authenticated JSON getter for AEM Author
 * @returns {Promise<Array<{name:string,title:string}>>}
 */
export async function getVariations(fragmentPath, aemFetch) {
  const fallback = [
    { name: 'master', title: 'Master' },
    { name: 'broker', title: 'Broker' },
    { name: 'doctor', title: 'Doctor' },
  ];
  if (!fragmentPath || !aemFetch) return fallback;

  const clean = fragmentPath.replace(/\.html?$/, '').replace(/\/$/, '');
  try {
    // .1.json lists immediate child nodes of the data node (the variations).
    const data = await aemFetch(`${clean}/jcr:content/data.1.json`);
    if (!data || typeof data !== 'object') return fallback;

    const titleCase = (s) => s.replace(/(^|[-_])([a-z])/g, (_, sep, ch) => (sep ? ' ' : '') + ch.toUpperCase()).trim();
    const names = Object.keys(data).filter(
      (k) => !k.startsWith('jcr:') && !k.startsWith('cq:') && !k.startsWith(':')
        && data[k] && typeof data[k] === 'object',
    );
    if (!names.length) return fallback;

    // Always surface master first, then the rest alphabetically.
    const ordered = [
      ...names.filter((n) => n === 'master'),
      ...names.filter((n) => n !== 'master').sort(),
    ];
    return ordered.map((n) => ({ name: n, title: titleCase(n) }));
  } catch (e) {
    return fallback;
  }
}

/*
 * Example Express-style adapter (adapt to your runtime). `authedGet` must attach
 * the AEM Author credentials (service token / technical account).
 *
 *   import express from 'express';
 *   const app = express();
 *   app.get('/tools/content-fragment/variations.json', async (req, res) => {
 *     const authedGet = async (url) => {
 *       const r = await fetch(new URL(url, AEM_AUTHOR_HOST), {
 *         headers: { Authorization: `Bearer ${AEM_TOKEN}` },
 *       });
 *       return r.ok ? r.json() : null;
 *     };
 *     const options = await getVariations(req.query.fragment, authedGet);
 *     res.json(options);
 *   });
 */

export default getVariations;
