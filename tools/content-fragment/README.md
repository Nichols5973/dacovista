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

### Option A — AEM Sling servlet (recommended)

`servlet/ContentFragmentVariationsServlet.java` is a ready-to-adapt Sling servlet.
It runs inside AEM Author (uses the author session — no external token, same-origin
so no CORS) and lists the child nodes of `<cfPath>/jcr:content/data` as variation
options.

To deploy:
1. Move the file into your AEM Maven project's bundle, e.g.
   `core/src/main/java/com/covista/core/servlets/ContentFragmentVariationsServlet.java`,
   and change the `package` line to match (the stub uses `com.covista.core.servlets`).
2. Ensure Gson (`com.google.gson`) is available to the bundle (it ships with AEM;
   otherwise swap the JSON building for your preferred library).
3. It registers on the fixed path `/tools/content-fragment/variations` via
   `sling.servlet.paths`, so AEM serves it at
   **`/tools/content-fragment/variations.json`** — exactly the URL the model field
   calls. (The `.json` extension is the request selector/extension; the path
   registration handles it.)
4. Build & deploy the bundle (`mvn clean install -PautoInstallPackage` or your
   pipeline). Test: `GET /tools/content-fragment/variations.json?fragment=<cfPath>`.

> Registering a servlet on a `/tools/...` path may require allow-listing that path
> depending on your AEM security config. If it 404s, confirm the path binding is
> permitted, or register under an approved servlet root and update the model `url`.

### Option B — Node / edge service

Host `variations.js` behind `/tools/content-fragment/variations.json`, giving it an
authenticated `aemFetch` (service token / technical account) to call AEM Author.
Ensure CORS allows the Universal Editor origin. `variations.js` exports
`getVariations(fragmentPath, aemFetch)` and includes an Express adapter example in
comments.

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
