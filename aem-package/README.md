# Covista Homepage — AEM Content Package

Installable AEM content package for the **dacovista** crosswalk / Universal Editor project.
Contains the homepage, header (nav), and footer as JCR content.

## Download

From the GitHub repo (`Nichols5973/dacovista`, branch `main`):

- **Install zip:** `aem-package/covista-homepage-content.zip` — open it in GitHub and click
  **Download raw file**. This is the file you upload to Package Manager.
- **Raw JCR (browsable):** the same content unzipped, under `aem-package/jcr_root/…` — useful
  for review or manual copy.

Or clone/pull the repo and grab `aem-package/covista-homepage-content.zip` directly.

## What's inside

```
jcr_root/content/dacovista/index/.content.xml    ← homepage
jcr_root/content/dacovista/nav/.content.xml       ← header / navigation
jcr_root/content/dacovista/footer/.content.xml    ← footer
META-INF/vault/filter.xml                          ← install filter (3 roots)
META-INF/vault/properties.xml                      ← package name / group / version
```

Installs to: `/content/dacovista/index`, `/content/dacovista/nav`, `/content/dacovista/footer`.

> **Target path.** If your Author content root differs from `/content/dacovista`, edit
> `META-INF/vault/filter.xml` and the folder names under `jcr_root/content/…`, then re-zip.

## Install (AEM Package Manager)

1. Open `https://author-p87302-e1492027.adobeaemcloud.com/crx/packmgr`
2. **Upload Package** → choose `covista-homepage-content.zip` → **OK**
3. Click **Install** on the package row.
4. Confirm the pages exist: `/content/dacovista/index` (+ `nav`, `footer`) in the Sites console
   or Universal Editor.

## Publish (after install)

The site code (blocks, styles, fonts, header/footer) is already deployed on `main`. Once the
content is in Author, publish preview → live for each path:

```bash
curl -X POST "https://admin.hlx.page/preview/nichols5973/dacovista/main/index"
curl -X POST "https://admin.hlx.page/live/nichols5973/dacovista/main/index"

curl -X POST "https://admin.hlx.page/preview/nichols5973/dacovista/main/nav"
curl -X POST "https://admin.hlx.page/live/nichols5973/dacovista/main/nav"

curl -X POST "https://admin.hlx.page/preview/nichols5973/dacovista/main/footer"
curl -X POST "https://admin.hlx.page/live/nichols5973/dacovista/main/footer"
```

Verify:
- Preview: `https://main--dacovista--nichols5973.aem.page/index`
- Live:    `https://main--dacovista--nichols5973.aem.live/index`

## Notes

- **Hero** is a still image (`hero-image`), not a background video, so it renders reliably.
- **Logos** (`nav`/`footer`) are standalone images — `md2jcr` drops an image wrapped in a link,
  which previously left an empty/black logo in Universal Editor. Trade-off: the logo is not
  click-to-home in AEM; re-add a link in UE if desired.
- **Header fonts/colors** use literal fallbacks in `blocks/header/header.css` (and
  `blocks/hero-image/hero-image.css`) so the cream text / green bar render even when the
  `brand.css` custom-property tokens don't resolve in the Universal Editor canvas.
- Images reference the original `www.covista.com/sites/g/files/…` URLs. If governance requires
  DAM-hosted assets, upload them and re-point the `image=` / `media_image=` attributes (or in UE).
