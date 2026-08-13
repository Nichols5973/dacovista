Let me check whether execution is now permitted.# Covista.com Homepage Migration Plan

## Objective
Migrate the homepage of **https://www.covista.com/** into the AEM Edge Delivery Services project (`Nichols5973/dacovista`), including the site **header (navigation)** and **footer**, styled to **match the original design**, then **upload and publish** to the AEM environment.

## Status: Cannot Execute — Plan Mode Still Active (re-verified this turn)
I just ran a write probe again; it was rejected with "Plan mode is active." I cannot exit plan mode myself — it is a harness/client setting. Per the plan-mode rules, when asked to proceed while still in plan mode I return the finalized, execution-ready artifact and note that **execution requires Execute mode**. Once you switch modes (Claude Code: **Shift+Tab** to cycle out of plan mode) and send any message, I will run Step 0 through the full checklist without stopping.

## Context (discovered)
- **Project type:** Crosswalk / Universal Editor (`xwalk`) — mountpoint `author-p87302-e1492027.adobeaemcloud.com` (AEM Cloud author, `markup` delivery); imported HTML becomes JCR.
- **Preview target:** org `nichols5973`, site `dacovista`.
- **Available blocks (16):** accordion, cards, carousel, columns, embed, footer, form, fragment, header, hero, modal, quote, search, table, tabs, video.
- **Migration mode:** Single Page (homepage URL provided).
- **Content dir** (`/content`) and `migration-work` are empty — fresh migration.

## Migration Workflow (Single Page Mode)
The site-migration orchestration skill is loaded and ready. Steps run in order, each delegating to a specialized sub-skill/agent. The checklist mirrors those steps plus the confirmed follow-on work (design, header/footer, verification, publish).

---

## Checklist

### Step 0 — Initialize Migration Plan
- [ ] Write `migration-work/migration-plan.md` (mode: Single Page; source: covista.com homepage)

### Step 1 — Project Setup
- [ ] Detect project type (xwalk) and block-library endpoint; write `.migration/project.json`

### Step 2 — Site Analysis
- [ ] Scrape homepage and create page-template skeleton in `tools/importer/page-templates.json`

### Step 3 — Page Analysis
- [ ] Analyze homepage → `migration-work/authoring-analysis.json`, `cleaned.html`, screenshots, images
- [ ] Identify sections, content sequences, and block variants (create new variant code where needed)

### Step 4 — Block Mapping
- [ ] Populate `page-templates.json` blocks[] with DOM selectors for each mapped block

### Step 5 — Import Infrastructure
- [ ] Generate parsers (`tools/importer/parsers/*.js`) and transformers (`tools/importer/transformers/*.js`)
- [ ] If DM/Scene7 image URLs detected: install DM auto-block (5a), patch `aem.js` dispatcher (5b), apply xwalk model override (5c)

### Step 6 — Content Import
- [ ] Generate import script (`tools/importer/import-*.js`) and URL list
- [ ] Run bulk import → `content/*.plain.html` + import report

### Follow-on — Design Migration (match original)
- [ ] Extract original design tokens (colors, fonts, spacing) into project styles
- [ ] Style each mapped block variant to visually match covista.com (with visual verification)

### Follow-on — Header & Footer
- [ ] Migrate header/navigation (desktop + mobile + megamenu) with screenshot-based validation
- [ ] Migrate footer (desktop + mobile) with appearance comparison
- [ ] Wire nav/footer fragments so the homepage renders complete

### Follow-on — Local Verification
- [ ] Preview imported homepage; visual critique vs. original; fix divergences
- [ ] Confirm images, links, and metadata are correct

### Follow-on — Upload & Publish
- [ ] Upload homepage + header/footer to Document Authoring / AEM author
- [ ] Publish (preview + live) to `nichols5973/dacovista`
- [ ] Final verification; report the live URL

---

## Decisions (confirmed)
- **Scope:** Homepage + header/footer
- **Styling:** Match original design
- **Delivery:** Upload & publish after local review
- **Unblock:** Switch to Execute mode (pending — toggle is in your client via Shift+Tab)

## Open Items / Risks
- **Mode switch required (current blocker):** Execution stays blocked until the harness leaves Plan mode. "continue" / "exit plan mode" messages in chat do not flip it — press Shift+Tab in the client.
- **Publish permissions:** Upload/publish to AEM author + `admin.hlx.page` need the Adobe credentials opt-in (Settings → LLM Permissions). A 401/403 means the opt-in is off — no token is needed in chat.
- **New block variants:** Sections that don't fit existing blocks get new variants (adds time).
- **Dynamic/JS-rendered content:** Client-side content on covista.com may need special scrape handling.

---

> **Execution note:** The plan is complete and execution-ready. I re-verified I am still in Plan mode and cannot exit it myself. **Switch to Execute mode** (Shift+Tab in Claude Code), then send any message — I will run Step 0 through the full checklist without stopping.
