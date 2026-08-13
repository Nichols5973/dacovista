# Covista Homepage — Content Ingestion & Publish

This folder contains the migrated Covista homepage (plus header and footer) converted to
**JCR XML** for the `dacovista` crosswalk / Universal Editor project, packaged for import
into **AEM Author**.

- **Preview/Live host:** `https://main--dacovista--nichols5973.aem.page` / `.aem.live`
- **AEM Author:** `https://author-p87302-e1492027.adobeaemcloud.com`
- **Org / repo (admin.hlx.page):** `nichols5973` / `dacovista`
- **Project type:** `xwalk` (content is delivered from AEM Author via `franklin.delivery`)

## Status

- ✅ **Code is already live** on `main` (blocks, styles/brand tokens + fonts, header, footer).
  Auto-deployed via GitHub push; verified serving from `…aem.page`.
- ⏳ **Content** is packaged here and must be installed into AEM Author (below). It is **not**
  yet in Author, which is why `admin.hlx.page/preview` returns `error from content-bus`.

## Files in this folder

| File | Description |
|------|-------------|
| `covista-homepage-content.zip` | **Ready-to-install AEM content package** (vault/crx layout). Installs `/content/dacovista/index`, `/nav`, `/footer`. |
| `index.xml` | Homepage JCR (hero-video, cards-stats, 3× columns-feature, cards-logos, columns-stock, 6-slide carousel-news, 2 section-metadata `style=secondary`, page metadata). |
| `nav.xml` | Header/navigation fragment JCR. |
| `footer.xml` | Footer fragment JCR. |
| `index.md`, `nav.md`, `footer.md` | Intermediate EDS block markdown (source for the XML — kept for regeneration). |
| `pkg/` | Unzipped package tree (same content as the zip). |

### Package layout (inside the zip)

```
jcr_root/content/dacovista/index/.content.xml    ← homepage
jcr_root/content/dacovista/nav/.content.xml       ← header fragment
jcr_root/content/dacovista/footer/.content.xml    ← footer fragment
META-INF/vault/filter.xml                          ← install filters (3 roots)
META-INF/vault/properties.xml                      ← package name/group/version
```

> **Target paths.** The package installs under `/content/dacovista/`. If your Author content
> root differs, edit `META-INF/vault/filter.xml` and the folder names under
> `jcr_root/content/…` to match, then re-zip (see "Regenerate" below).

---

## Option A — Install via AEM Package Manager (fastest)

1. Open **Package Manager**: `https://author-p87302-e1492027.adobeaemcloud.com/crx/packmgr`
2. Click **Upload Package** → choose `covista-homepage-content.zip` → **OK**.
3. In the package row, click **Install**.
4. This creates:
   - `/content/dacovista/index` (the homepage)
   - `/content/dacovista/nav` (header)
   - `/content/dacovista/footer` (footer)
5. Open `/content/dacovista/index` in the AEM Sites console or Universal Editor to confirm the
   blocks rendered.

## Option B — Author in Universal Editor

If you prefer to author interactively rather than import:

1. Open the page in **Universal Editor** against the Author instance.
2. Recreate the sections using the deployed blocks (Hero Video, Cards Stats, Columns Feature,
   Cards Logos, Columns Stock, Carousel News). The block models and styles are already live.
3. Use `index.md` in this folder as the content reference (all copy, links, and image URLs).

> The images referenced in the JCR are the original `www.covista.com/sites/g/files/...`
> URLs. If your governance requires assets in the AEM DAM, upload them and update the
> `image=` / `media_image=` attributes (or re-point in Universal Editor) before publishing.

### Universal Editor rendering notes (header logo & fonts)

Two AEM-specific fixes are already baked into the current code/JCR:

- **Header colors/fonts:** `blocks/header/header.css` and `blocks/hero-image/hero-image.css`
  now include literal fallbacks on every brand token (e.g.
  `color: var(--hero-text-color, rgb(255 249 245))`). Without these, the Universal Editor
  canvas — where the `@import`ed `brand.css` tokens may not resolve — rendered the nav text
  black and dropped the green bar. The fallbacks guarantee the cream text / green bar / brand
  fonts regardless of token resolution.
- **Logo image:** the nav/footer logo is authored as a **standalone image**
  (`![Covista](…cv_logo.svg)`), not an image wrapped in a link. `md2jcr` drops the image when
  it is wrapped in a link (`[![…](…)](/)`), leaving an empty button — which is why the logo
  appeared missing/black in UE. As standalone images they convert to proper `<image>` JCR
  nodes. Trade-off: the logo is not click-to-home in AEM; re-add a link in UE if desired.
- The header logo SVG (`cv_logo.svg`) is white (`fill="#FFF9F5"`) by design — it sits on the
  green bar. If you ever place it on a light background, swap to a dark-fill variant.

---

## Publish (after content is in Author)

Once the content exists in Author, publish through the normal pipeline. Credentials for
`admin.hlx.page` are injected automatically (no token needed) **if** the Adobe-credentials
opt-in is enabled in **Settings → LLM Permissions**.

Preview, then Live, for each path:

```bash
# Homepage
curl -X POST "https://admin.hlx.page/preview/nichols5973/dacovista/main/index"
curl -X POST "https://admin.hlx.page/live/nichols5973/dacovista/main/index"

# Header fragment
curl -X POST "https://admin.hlx.page/preview/nichols5973/dacovista/main/nav"
curl -X POST "https://admin.hlx.page/live/nichols5973/dacovista/main/nav"

# Footer fragment
curl -X POST "https://admin.hlx.page/preview/nichols5973/dacovista/main/footer"
curl -X POST "https://admin.hlx.page/live/nichols5973/dacovista/main/footer"
```

Then verify:

- Preview: `https://main--dacovista--nichols5973.aem.page/index`
- Live:    `https://main--dacovista--nichols5973.aem.live/index`

> If preview returns `error from content-bus`, the content is not yet in Author — complete
> Option A or B first. If it returns 401/403, the Adobe-credentials opt-in is off — enable it
> in Settings → LLM Permissions (do **not** paste a token into chat).

---

## Regenerate the JCR / package (if content changes)

From the project root (`/workspace/current`):

```bash
# 1. (Re)build the Universal Editor component files if block models changed
npm run build:json

# 2. Convert the EDS markdown -> JCR XML using the project's UE component files
MD2JCR=<helix-md2jcr>/bin/md2jcr.js   # from the content-import skill's node_modules
node "$MD2JCR" --path migration-work/jcr/index.md  --ue-files .
node "$MD2JCR" --path migration-work/jcr/nav.md    --ue-files .
node "$MD2JCR" --path migration-work/jcr/footer.md --ue-files .

# 3. Re-copy the .xml files into pkg/jcr_root/content/dacovista/{index,nav,footer}/.content.xml
#    then re-zip pkg/ into covista-homepage-content.zip
```

The `index.md` markdown was produced by running the project's bundled import
(`tools/importer/import-homepage.bundle.js`) against `https://www.covista.com/` and capturing
the transform's markdown output — the same pipeline used for the local `.plain.html`.
