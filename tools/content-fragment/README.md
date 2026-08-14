# Content Fragment — dynamic variation dropdown (scaffold)

Goal: the **Fragment Variation** dropdown on the `content-fragment` block should
list *the variations that the selected fragment actually has* (instead of a fixed
Master/Broker/Doctor list).

> ⚠️ **Unverified against your AEM.** This wiring could not be built or tested
> against your Author instance from the migration environment (no Author access).
> You must deploy the endpoint and confirm the field picks it up. Until then, the
> dropdown falls back to the static options in `_content-fragment.json`
> (Master/Broker/Doctor), and the block still renders whichever variation is
> chosen — so nothing is broken in the meantime.

## How it's wired

1. **Model field** (`blocks/content-fragment/_content-fragment.json`) — the
   `variation` select declares a dynamic `optionsSource`:

   ```json
   "optionsSource": {
     "type": "json",
     "url": "/tools/content-fragment/variations.json?fragment=${reference}",
     "map": { "value": "name", "text": "title" }
   }
   ```

   `${reference}` is substituted with the currently-selected fragment path, so the
   dropdown re-queries when the author changes the fragment. The static `options`
   array remains as the fallback.

   > **Verify the exact property name** your Universal Editor build expects for a
   > remote data source. Depending on UE version it may be `optionsSource`,
   > `dataSource`, or an `options` string that is a URL. Check an existing dynamic
   > select in your environment (or the UE component-model docs) and adjust the key
   > if the dropdown doesn't populate. The block itself does not depend on this —
   > it's purely the authoring convenience.

2. **Endpoint** (`variations.js`) — given `?fragment=<cfPath>`, it lists the child
   nodes under `<cfPath>/jcr:content/data` (each child = one variation) and returns:

   ```json
   [ { "name": "master", "title": "Master" },
     { "name": "broker", "title": "Broker" },
     { "name": "doctor", "title": "Doctor" } ]
   ```

## Deploy options (pick one)

- **AEM servlet / proxy (recommended):** expose `/tools/content-fragment/variations.json`
  from AEM itself so it runs with the author session and can read
  `<cfPath>/jcr:content/data.1.json` directly. Map `getVariations()` logic into a
  Sling servlet, or just have the servlet return the child-node names of the data
  node. Same-origin with the editor, so no CORS.
- **Small Node/edge service:** host `variations.js` behind
  `/tools/content-fragment/variations.json`, giving it an authenticated
  `aemFetch` (service token / technical account) to call AEM Author. Ensure CORS
  allows the Universal Editor origin.

`variations.js` exports `getVariations(fragmentPath, aemFetch)` and includes an
Express adapter example in comments.

## Test the wiring before going live

1. Serve the static sample so the field has something to read:
   `variations.sample.json` mirrors the expected response shape.
2. Temporarily point the model `url` at the sample
   (`/tools/content-fragment/variations.sample.json`) and confirm the dropdown in
   Universal Editor shows Master/Broker/Doctor from the file (not the inline
   fallback).
3. Swap the URL to the live endpoint and confirm it changes with the selected
   fragment.

## If you'd rather keep it simple

The static list already works and the content swaps correctly on selection. If the
dynamic source proves fiddly in your UE version, keep the static
Master/Broker/Doctor options — that's a supported, zero-maintenance setup.
