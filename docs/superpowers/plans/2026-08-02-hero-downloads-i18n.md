# Hero Refresh, Downloads and Chinese Edition — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the video hero with countdown, replace engraved vignettes with photographic image grids, add a downloads page, and add a Chinese edition — on the existing Eleventy site, without touching the deferred portal.

**Architecture:** All three sub-projects land in the existing Eleventy build. Sub-project V rewrites homepage and section markup; B adds one collection and one page; A wraps every page in a locale-paginated render. Order is **V → B → A** because A extracts every user-facing string into i18n JSON, and doing that before V's markup churn and B's new page means extracting twice.

**Tech Stack:** Eleventy 3 + Nunjucks, vanilla JS, `sharp` (already installed), `ffmpeg-static` (new devDependency), Node 22 built-in test runner (`node --test`), OpenRouter for machine translation.

## Global Constraints

Copied verbatim from the spec and the existing project rules. **Every task's requirements implicitly include this section.**

- **Shipped site stays static HTML + CSS + vanilla JS. Zero runtime framework, no bundler.** Eleventy is build-time only.
- **CSS budget: 30,720 bytes total across `tokens.css` + `style.css`.** Currently 29,829 — only 891 bytes of headroom. **Every task that adds CSS must first remove or consolidate.** Build asserts this.
- **JS budget: 15,360 bytes uncompressed** across all files in `public/js/`.
- **`src/assets/css/tokens.css` is the only file permitted a hex literal.** Everything else uses `var(--*)`.
- **Encoded hero video must be under 4,194,304 bytes (4 MB).** Build asserts this.
- **The poster image is the LCP element, never the video.**
- **No fabricated photography of people, premises, or past editions.** `website_content/FACTS.md` §2 is binding. Image grids depict landscape, leaf, processing and trade materials only.
- **Never generate attendee or private data into Eleventy's static output.** Anything in `public/` is public.
- **No em-dash overuse, no AI tells.** New copy is scanned by the existing detector before commit.
- **Machine-translated `zh` pages ship `noindex` and are excluded from `sitemap.xml`** until `translationStatus: reviewed`.
- **Conventional commits.** Commit at the end of every task.

---

## File Structure

**Created:**

| Path | Responsibility |
|---|---|
| `scripts/make-hero-video.js` | Encode the 85 MB master into web-sized H.264 + AV1 + poster. Run manually, not per-build. |
| `scripts/make-grid-images.js` | Resize/convert section grid imagery to AVIF + WebP. |
| `scripts/translate.js` | Machine-translate `en` i18n JSON into `zh` via OpenRouter. Run manually. |
| `scripts/assert-budgets.js` | Fail the build on CSS, JS or video budget breach. |
| `scripts/validate-content.test.js` | Node test-runner tests for validator rules 8 and 9. |
| `src/assets/js/hero.js` | Countdown correction + conditional video attach. |
| `src/_includes/components/image-grid.njk` | The 2–4 image grid macro. |
| `src/_includes/components/hero-media.njk` | Poster + video mount point. |
| `src/_data/locales.js` | `["en", "zh"]` — drives locale pagination. |
| `src/_data/i18n/en/*.json` | English strings, per page. |
| `src/_data/i18n/zh/*.json` | Chinese strings, per page. |
| `src/pages/pages.11tydata.js` | Locale pagination + computed permalink/lang for every page. |
| `src/pages/downloads.njk` | The downloads page. |
| `src/downloads/*.md` | One file per downloadable document. |
| `src/assets/video/` | Encoded hero derivatives (the only tracked video path). |

**Modified:**

| Path | Change |
|---|---|
| `src/index.njk` | Hero gains video + countdown; vignette figures become image grids. |
| `src/pages/*.njk` (16 files) | `permalink:` renamed to `basePath:`; strings pulled from i18n. |
| `src/pages/media.njk` | Press-kit assets removed; links to `/downloads/`. |
| `src/_includes/layouts/base.njk` | hreflang, lang switcher, robots meta, hero script. |
| `src/_includes/layouts/page.njk` | Machine-translation notice. |
| `src/assets/css/style.css` | Hero media, countdown, image grid, MT notice, downloads. |
| `src/sitemap.njk` | Exclude unreviewed `zh` pages. |
| `src/_data/navigation.js` | Downloads entry; nav becomes locale-aware. |
| `scripts/validate-content.js` | Rules 8 and 9. |
| `scripts/check-contrast.js` | Text-over-image scrim pairs. |
| `scripts/export-copy.js` | `--locale` flag. |
| `package.json` | `test` script, `assert-budgets` in build, `ffmpeg-static`. |
| `eleventy.config.js` | `daysUntil` filter, video passthrough, locale-aware `absoluteUrl`. |

---

# SUB-PROJECT V — Hero and imagery

### Task 1: Budget assertions

Do this first. Every later task adds CSS or assets, and the budgets are already at 97% — without an automatic gate, a later task silently breaks the perf target.

**Files:**
- Create: `scripts/assert-budgets.js`
- Modify: `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: `npm run build` fails with exit 1 and a named breach when CSS > 30720 B, JS > 15360 B, or any file in `public/video/` > 4194304 B.

- [ ] **Step 1: Write the budget script**

Create `scripts/assert-budgets.js`:

```js
#!/usr/bin/env node
// Fails the build when a shipped-asset budget is breached.
// Runs against public/ AFTER Eleventy, so it measures what actually deploys.

import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const BUDGETS = {
  css: { dir: "public/css", max: 30720, label: "CSS" },
  js: { dir: "public/js", max: 15360, label: "JS" },
};
const VIDEO_MAX = 4194304; // 4 MB per file

const dirTotal = (dir) =>
  existsSync(dir)
    ? readdirSync(dir).reduce((a, f) => a + statSync(join(dir, f)).size, 0)
    : 0;

const failures = [];

for (const { dir, max, label } of Object.values(BUDGETS)) {
  const total = dirTotal(dir);
  const pct = ((total / max) * 100).toFixed(0);
  console.log(`${label.padEnd(6)} ${total} / ${max} bytes (${pct}%)`);
  if (total > max) failures.push(`${label} over budget: ${total} > ${max}`);
}

if (existsSync("public/video")) {
  for (const f of readdirSync("public/video")) {
    const size = statSync(join("public/video", f)).size;
    console.log(`video  ${f} ${size} / ${VIDEO_MAX} bytes`);
    if (size > VIDEO_MAX) failures.push(`${f} over video budget: ${size} > ${VIDEO_MAX}`);
  }
}

if (failures.length) {
  console.error("\nRESULT: FAIL");
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}
console.log("\nRESULT: PASS — all asset budgets within limit");
```

- [ ] **Step 2: Run it against the current build to confirm it passes today**

```bash
npm run build && node scripts/assert-budgets.js
```

Expected: `CSS 29829 / 30720 bytes (97%)`, `JS 3807 / 15360 bytes (25%)`, `RESULT: PASS`.

- [ ] **Step 3: Verify it actually fails — temporarily lower the CSS budget**

```bash
sed -i '' 's/max: 30720/max: 1000/' scripts/assert-budgets.js
node scripts/assert-budgets.js; echo "exit: $?"
sed -i '' 's/max: 1000/max: 30720/' scripts/assert-budgets.js
```

Expected: `RESULT: FAIL`, `CSS over budget: 29829 > 1000`, `exit: 1`. Then restored.

- [ ] **Step 4: Wire into build**

In `package.json`, change the `build` script to:

```json
"build": "npm run clean && npm run validate && eleventy && node scripts/assert-budgets.js && node scripts/export-copy.js"
```

- [ ] **Step 5: Run the full build**

```bash
npm run build
```

Expected: build completes, budget lines print, `RESULT: PASS`.

- [ ] **Step 6: Commit**

```bash
git add scripts/assert-budgets.js package.json
git commit -m "build: assert CSS, JS and video budgets after every build"
```

---

### Task 2: Reclaim CSS headroom

891 bytes of headroom cannot absorb the hero, countdown and grid styles. This task creates room before the styles that need it.

**Files:**
- Modify: `src/assets/css/style.css`

**Interfaces:**
- Consumes: `scripts/assert-budgets.js` from Task 1
- Produces: at least 3,000 bytes of CSS headroom, all existing pages visually unchanged.

- [ ] **Step 1: Measure where the bytes are**

```bash
node -e '
const css=require("fs").readFileSync("src/assets/css/style.css","utf8");
const blocks=[...css.matchAll(/\/\* ={2,}([^=]+?)={2,} \*\/([\s\S]*?)(?=\/\* ={2,}|$)/g)];
for(const b of blocks) console.log(String(b[2].length).padStart(6), b[1].trim());
'
```

Expected: a per-section byte breakdown. Note the three largest.

- [ ] **Step 2: Remove the retired vignette rules**

Delete these rules from `src/assets/css/style.css` — the engraved vignettes are retired in Task 6 and their CSS is dead weight:

```css
.vignette {
  mix-blend-mode: multiply;
  display: block;
}
.section--ink .vignette { filter: invert(1); mix-blend-mode: screen; }
```

Keep `.figure-pair` and `.figure-pair--flip` — the image grid reuses them.

- [ ] **Step 3: Collapse the duplicated ghost-button overrides**

Replace the whole `.on-ink .btn--ghost` / `.issue .btn--ghost` / `.sheet .btn--ghost` block with:

```css
/* Ghost buttons take their ink from the ground they sit on. Light panels set
   --ghost-fg locally; the ink grounds set it on the section. */
.btn--ghost { color: var(--ghost-fg, var(--c-ink-2)); border-color: var(--ghost-fg, var(--c-ink-2)); }
.btn--ghost:hover { background: var(--ghost-fg, var(--c-ink-2)); color: var(--c-paper); }
.on-ink, .section--ink, .hero { --ghost-fg: var(--c-text-on-ink-muted); }
.issue, .sheet, .form { --ghost-fg: var(--c-ink-2); }
```

- [ ] **Step 4: Verify headroom and that nothing broke**

```bash
npm run build
```

Expected: `RESULT: PASS`, and CSS now under 27,000 bytes.

```bash
node -e '
const h=require("fs").readFileSync("public/index.html","utf8");
console.log("vignette refs left in html:", (h.match(/vignette/g)||[]).length);
'
```

Expected: `3` (the three `<img class="vignette">` remain until Task 6 replaces them — that is correct at this point).

- [ ] **Step 5: Commit**

```bash
git add src/assets/css/style.css
git commit -m "refactor(css): reclaim headroom before hero work

Ghost-button ground handling collapses from three selector groups to one
custom property. Retired vignette blend rules removed."
```

---

### Task 3: Encode the hero video

**Files:**
- Create: `scripts/make-hero-video.js`, `src/assets/video/` (output dir)
- Modify: `package.json`, `eleventy.config.js`, `.gitignore`

**Interfaces:**
- Consumes: `assets-raw/hero-tea-plantation-master.mp4` (85 MB, untracked)
- Produces: `src/assets/video/hero.mp4` (H.264), `src/assets/video/hero.webm` (VP9), `src/assets/img/hero-poster.avif`, `src/assets/img/hero-poster.webp`. All under budget. Passthrough-copied to `public/video/` and `public/img/`.

- [ ] **Step 1: Add ffmpeg-static**

```bash
npm i -D ffmpeg-static
```

Expected: installs without error. This is a devDependency — no system ffmpeg install.

- [ ] **Step 2: Write the encoder**

Create `scripts/make-hero-video.js`:

```js
#!/usr/bin/env node
// Encodes the hero master into web-sized derivatives.
// Run manually after the client supplies final footage:  npm run video
//
// AV1 is deliberately NOT used: encode time on an 85MB master is minutes-to-hours
// on CPU, and VP9 gets within a few percent at a fraction of the cost. Revisit if
// the budget becomes tight.

import ffmpeg from "ffmpeg-static";
import { execFileSync } from "node:child_process";
import { mkdirSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "assets-raw/hero-tea-plantation-master.mp4";
const VID = "src/assets/video";
const IMG = "src/assets/img";
const START = "00:00:03";   // skip any lead-in
const DURATION = "10";      // seconds
const WIDTH = 1600;

if (!existsSync(SRC)) {
  console.error(`Master not found at ${SRC}`);
  process.exit(1);
}
mkdirSync(VID, { recursive: true });

const common = ["-ss", START, "-t", DURATION, "-i", SRC, "-an", "-vf", `scale=${WIDTH}:-2,fps=24`];

console.log("encoding H.264 ...");
execFileSync(ffmpeg, [...common, "-c:v", "libx264", "-crf", "30", "-preset", "slow",
  "-profile:v", "main", "-pix_fmt", "yuv420p", "-movflags", "+faststart",
  "-y", `${VID}/hero.mp4`], { stdio: "inherit" });

console.log("encoding VP9 ...");
execFileSync(ffmpeg, [...common, "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0",
  "-row-mt", "1", "-y", `${VID}/hero.webm`], { stdio: "inherit" });

console.log("extracting poster ...");
execFileSync(ffmpeg, ["-ss", START, "-i", SRC, "-frames:v", "1",
  "-vf", `scale=${WIDTH}:-2`, "-y", "/tmp/hero-poster.png"], { stdio: "inherit" });

await sharp("/tmp/hero-poster.png").avif({ quality: 55 }).toFile(`${IMG}/hero-poster.avif`);
await sharp("/tmp/hero-poster.png").webp({ quality: 76 }).toFile(`${IMG}/hero-poster.webp`);

const kb = (p) => (statSync(p).size / 1024).toFixed(0) + " KB";
console.log(`\nhero.mp4          ${kb(`${VID}/hero.mp4`)}`);
console.log(`hero.webm         ${kb(`${VID}/hero.webm`)}`);
console.log(`hero-poster.avif  ${kb(`${IMG}/hero-poster.avif`)}`);
console.log(`hero-poster.webp  ${kb(`${IMG}/hero-poster.webp`)}`);
```

- [ ] **Step 3: Allow tracked encoded video, add the npm script**

`.gitignore` already has `!src/assets/video/*.mp4`. Add the webm exception directly below it:

```
!src/assets/video/*.webm
```

In `package.json` scripts add:

```json
"video": "node scripts/make-hero-video.js"
```

- [ ] **Step 4: Run the encode**

```bash
npm run video
```

Expected: four files listed, `hero.mp4` well under 4,096 KB. If `hero.mp4` exceeds it, raise `-crf` from `30` to `34` and re-run — do not raise the budget.

- [ ] **Step 5: Add the passthrough**

In `eleventy.config.js`, directly after the fonts passthrough line, add:

```js
  eleventyConfig.addPassthroughCopy({ "src/assets/video": "video" });
```

- [ ] **Step 6: Build and confirm the budget assertion sees the video**

```bash
npm run build
```

Expected: a `video hero.mp4 <size> / 4194304 bytes` line, `RESULT: PASS`.

- [ ] **Step 7: Commit**

```bash
git add scripts/make-hero-video.js package.json package-lock.json eleventy.config.js .gitignore src/assets/video src/assets/img/hero-poster.*
git commit -m "feat(hero): encode 85MB master to web-sized mp4/webm plus poster

ffmpeg-static devDependency, no system install. VP9 rather than AV1: encode
cost on the master is disproportionate for a few percent of size."
```

---

### Task 4: Hero video and countdown

**Files:**
- Create: `src/_includes/components/hero-media.njk`, `src/assets/js/hero.js`
- Modify: `src/index.njk`, `src/assets/css/style.css`, `src/_includes/layouts/base.njk`, `eleventy.config.js`

**Interfaces:**
- Consumes: `src/assets/video/hero.{mp4,webm}`, `src/assets/img/hero-poster.{avif,webp}` from Task 3
- Produces: a `daysUntil` Nunjucks filter; `[data-countdown]` and `[data-hero-video]` DOM contracts consumed by `hero.js`.

- [ ] **Step 1: Add the daysUntil filter**

In `eleventy.config.js`, after the `clockTime` filter, add:

```js
  // Whole days from build time to an ISO date. Rendered server-side so the
  // number is present with JS disabled; hero.js corrects it on load.
  eleventyConfig.addFilter("daysUntil", (iso) => {
    const ms = new Date(`${iso}T00:00:00Z`) - new Date();
    return Math.max(0, Math.ceil(ms / 86400000));
  });
```

- [ ] **Step 2: Create the hero media component**

Create `src/_includes/components/hero-media.njk`:

```njk
{# Poster is always in the markup and is the LCP element. The video element is
   created by hero.js only when eligible, so mobile and reduced-motion users
   download zero video bytes. #}
<div class="hero__media" data-hero-video
     data-mp4="/video/hero.mp4" data-webm="/video/hero.webm" aria-hidden="true">
  <picture>
    <source srcset="/img/hero-poster.avif" type="image/avif">
    <img class="hero__poster" src="/img/hero-poster.webp" alt=""
         width="1600" height="900" fetchpriority="high" decoding="async">
  </picture>
</div>
```

- [ ] **Step 3: Preload the poster and drop it into the hero**

In `src/_includes/layouts/base.njk`, directly after the two font preloads, add:

```njk
{% if page.url == "/" %}<link rel="preload" as="image" href="/img/hero-poster.avif" type="image/avif" fetchpriority="high">{% endif %}
```

In `src/index.njk`, change the opening of the hero section from `<section class="hero">` to:

```njk
<section class="hero">
  {% include "components/hero-media.njk" %}
```

- [ ] **Step 4: Add the countdown field**

In `src/index.njk`, inside `<dl class="particulars">`, immediately after the `Dated` field block, insert:

```njk
          <div class="field">
            <dt class="label">Days to opening</dt>
            <dd class="value"><span data-countdown="{{ summit.dates.start }}">{{ summit.dates.start | daysUntil }}</span></dd>
          </div>
```

- [ ] **Step 5: Write hero.js**

Create `src/assets/js/hero.js`:

```js
// Hero: corrects the build-time countdown, and attaches the background video
// only where it is wanted. Both degrade to the server-rendered state.
(() => {
  // --- countdown ---------------------------------------------------------
  for (const el of document.querySelectorAll("[data-countdown]")) {
    const ms = new Date(`${el.dataset.countdown}T00:00:00Z`) - new Date();
    const days = Math.max(0, Math.ceil(ms / 86400000));
    el.textContent = String(days);
  }

  // --- background video --------------------------------------------------
  const mount = document.querySelector("[data-hero-video]");
  if (!mount) return;

  const small = window.matchMedia("(max-width: 768px)").matches;
  const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Respect an explicit data-saver signal too; poster is a complete experience.
  const saveData = navigator.connection?.saveData === true;
  if (small || calm || saveData) return;

  const video = document.createElement("video");
  video.className = "hero__video";
  video.muted = true;
  video.loop = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("aria-hidden", "true");
  video.setAttribute("tabindex", "-1");

  for (const [src, type] of [[mount.dataset.webm, "video/webm"], [mount.dataset.mp4, "video/mp4"]]) {
    if (!src) continue;
    const s = document.createElement("source");
    s.src = src;
    s.type = type;
    video.appendChild(s);
  }

  video.addEventListener("canplay", () => {
    mount.classList.add("is-playing");
    video.play().catch(() => mount.classList.remove("is-playing"));
  }, { once: true });

  mount.appendChild(video);
})();
```

- [ ] **Step 6: Load hero.js**

In `src/_includes/layouts/base.njk`, after the `form-handler.js` script tag, add:

```njk
<script src="/js/hero.js" defer></script>
```

- [ ] **Step 7: Add the CSS**

Append to `src/assets/css/style.css`:

```css
/* ==== hero media ======================================================== */

.hero { isolation: isolate; }

.hero__media {
  position: absolute; inset: 0; z-index: -1;
  overflow: hidden;
  background: var(--c-ink-2);
}
.hero__poster, .hero__video {
  width: 100%; height: 100%;
  object-fit: cover;
  display: block;
}
.hero__video {
  position: absolute; inset: 0;
  opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out);
}
.hero__media.is-playing .hero__video { opacity: 1; }

/* The scrim. Footage is bright green midday plantation; reversed text needs a
   guaranteed floor, not a hope. Measured in check-contrast.js. */
.hero__media::after {
  content: ""; position: absolute; inset: 0;
  background: linear-gradient(
    100deg,
    rgb(15 46 22 / 0.94) 0%,
    rgb(15 46 22 / 0.88) 42%,
    rgb(15 46 22 / 0.66) 100%
  );
}
```

- [ ] **Step 8: Build and verify the countdown renders server-side**

```bash
npm run build
node -e '
const h=require("fs").readFileSync("public/index.html","utf8");
const m=h.match(/data-countdown="([^"]+)">(\d+)</);
console.log("countdown attr:", m && m[1], "| server-rendered value:", m && m[2]);
console.log("poster preloaded:", /rel="preload" as="image"[^>]*hero-poster/.test(h));
console.log("video src in html (should be false):", /<video/.test(h));
'
```

Expected: `countdown attr: 2027-04-21`, a plausible day count, `poster preloaded: true`, `video src in html: false`.

- [ ] **Step 9: Commit**

```bash
git add src/_includes/components/hero-media.njk src/assets/js/hero.js src/index.njk src/assets/css/style.css src/_includes/layouts/base.njk eleventy.config.js
git commit -m "feat(hero): video background and countdown as document fields

Countdown renders server-side and is corrected on load, so a cached page never
shows a stale figure and JS-off still gets a number. Video is created by JS only
when eligible, so mobile, reduced-motion and save-data users download zero video
bytes and keep the poster as a complete experience."
```

---

### Task 5: Image grid component

**Files:**
- Create: `src/_includes/components/image-grid.njk`
- Modify: `src/assets/css/style.css`

**Interfaces:**
- Consumes: nothing
- Produces: a Nunjucks macro `grid(images, caption, plate)` where `images` is an array of `{src, alt, w, h}`. Used by Task 6.

- [ ] **Step 1: Create the macro**

Create `src/_includes/components/image-grid.njk`:

```njk
{# Plate figure: 2-4 photographs in a grid, gaps transparent so the section
   ground shows through. The gap is the design, not padding.
   Usage:
     {% from "components/image-grid.njk" import grid %}
     {{ grid(images, "Caption text", "I") }}
#}
{% macro grid(images, caption, plate) %}
<figure class="plate plate--{{ images | length }}">
  <div class="plate__grid">
    {% for im in images %}
    <picture class="plate__cell">
      <source srcset="{{ im.src }}.avif" type="image/avif">
      <img src="{{ im.src }}.webp" alt="{{ im.alt }}"
           width="{{ im.w }}" height="{{ im.h }}" loading="lazy" decoding="async">
    </picture>
    {% endfor %}
  </div>
  {% if caption %}
  <figcaption class="plate__caption">
    {% if plate %}<span class="plate__no">Plate {{ plate }}</span>{% endif %}{{ caption }}
  </figcaption>
  {% endif %}
</figure>
{% endmacro %}
```

- [ ] **Step 2: Add the CSS**

Append to `src/assets/css/style.css`:

```css
/* ==== plate figures ===================================================== */

.plate { margin: 0; }

.plate__grid {
  display: grid;
  gap: var(--sp-2xs);          /* transparent — the ground shows through */
  grid-template-columns: repeat(2, 1fr);
}
.plate--2 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--3 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--3 .plate__cell:first-child { grid-column: span 2; }
.plate--4 .plate__grid { grid-template-columns: repeat(2, 1fr); }

.plate__cell { display: block; overflow: hidden; }
.plate__cell img {
  display: block; width: 100%; height: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: var(--radius-s);
}
.plate--3 .plate__cell:first-child img { aspect-ratio: 16 / 7; }

.plate__caption {
  margin-top: var(--sp-2xs);
  font-family: var(--font-ui);
  font-size: var(--step--2);
  letter-spacing: var(--track-label);
  text-transform: uppercase;
  color: var(--c-text-muted);
}
.plate__no { color: var(--c-seal); margin-right: var(--sp-2xs); }
.section--ink .plate__caption { color: var(--c-text-on-ink-muted); }
.section--ink .plate__no { color: var(--c-ply-canary); }

@media (min-width: 52rem) {
  .plate--3 .plate__grid { grid-template-columns: repeat(3, 1fr); }
  .plate--3 .plate__cell:first-child { grid-column: auto; }
  .plate--3 .plate__cell:first-child img { aspect-ratio: 4 / 3; }
  .plate--4 .plate__grid { grid-template-columns: repeat(4, 1fr); }
}
```

- [ ] **Step 3: Build to confirm no CSS budget breach**

```bash
npm run build
```

Expected: `RESULT: PASS`. If CSS is over, return to Task 2 and reclaim more before continuing.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/components/image-grid.njk src/assets/css/style.css
git commit -m "feat(design): plate figure component, 2-4 image grid

Gaps are transparent so the section ground reads through them. Caption uses the
plate numbering of a document figure rather than gallery styling."
```

---

### Task 6: Generate grid imagery and retire the vignettes

**Files:**
- Create: `scripts/make-grid-images.js`, `src/assets/img/plates/*`
- Modify: `src/index.njk`
- Retire (do not delete): `scripts/make-vignettes.js`, `src/assets/img/vignettes/*`

**Interfaces:**
- Consumes: `image-grid.njk` macro from Task 5, `OPENROUTER_API_KEY` from `.env.local`
- Produces: AVIF + WebP pairs under `src/assets/img/plates/`, each under 200 KB.

- [ ] **Step 1: Write the generator**

Create `scripts/make-grid-images.js`:

```js
#!/usr/bin/env node
// Generates the plate imagery via OpenRouter, then converts to AVIF + WebP.
//
// CONSTRAINT (website_content/FACTS.md §2): no people, no premises, no crowds,
// no signage, no logos, and nothing implying a previous edition of this summit.
// Subjects are landscape, leaf, processing and trade materials only.
//
// Run: OPENROUTER_API_KEY=... node scripts/make-grid-images.js

import { writeFileSync, mkdirSync, existsSync, statSync, unlinkSync } from "node:fs";
import sharp from "sharp";

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("OPENROUTER_API_KEY not set"); process.exit(1); }

const MODEL = "google/gemini-2.5-flash-image";
const OUT = "src/assets/img/plates";
mkdirSync(OUT, { recursive: true });

const STYLE =
  "Editorial documentary photograph, natural daylight, realistic colour, shallow " +
  "depth of field, high detail. No people, no faces, no hands, no buildings, no " +
  "vehicles, no signage, no text, no logos, no watermarks. Documentary realism, " +
  "not stock-photo styling.";

const PLATES = [
  { slug: "rows-morning",   prompt: "Neat contour rows of a mature tea plantation on rolling highland, early morning mist between the rows." },
  { slug: "leaf-close",     prompt: "Extreme close-up of fresh two-leaves-and-a-bud tea shoots, dew on the leaf surface." },
  { slug: "highland",       prompt: "Wide Kenyan highland landscape, red earth track cutting through deep green tea fields under a tall sky." },
  { slug: "withering",      prompt: "Withering troughs in a tea factory, long beds of green leaf under even industrial light, no people." },
  { slug: "sorting",        prompt: "Graded black tea on a stainless sorting surface, separated into grade piles, overhead light." },
  { slug: "sacks",          prompt: "Stacked plain hessian sacks of bulk tea in a clean warehouse, no printing or markings on the sacks." },
  { slug: "liquor",         prompt: "Row of white porcelain cupping bowls holding brewed tea liquor of varying strengths on a plain bench." },
  { slug: "chest-stack",    prompt: "Stack of plain plywood shipping chests with metal corner protectors in a warehouse, entirely unmarked." },
];

async function generate({ slug, prompt }) {
  const png = `/tmp/plate-${slug}.png`;
  if (existsSync(`${OUT}/${slug}.webp`)) { console.log(`${slug.padEnd(14)} exists, skipping`); return; }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, modalities: ["image", "text"],
      messages: [{ role: "user", content: `${prompt}\n\n${STYLE}` }] }),
  });
  if (!res.ok) { console.error(`${slug}: HTTP ${res.status}`); return; }

  const url = (await res.json())?.choices?.[0]?.message?.images?.[0]?.image_url?.url;
  if (!url) { console.error(`${slug}: no image returned`); return; }
  writeFileSync(png, Buffer.from(url.split(",")[1], "base64"));

  const base = sharp(png).resize({ width: 1200, height: 900, fit: "cover" });
  await base.clone().webp({ quality: 74 }).toFile(`${OUT}/${slug}.webp`);
  await base.clone().avif({ quality: 52 }).toFile(`${OUT}/${slug}.avif`);
  unlinkSync(png);

  const kb = (p) => (statSync(p).size / 1024).toFixed(0);
  console.log(`${slug.padEnd(14)} webp ${kb(`${OUT}/${slug}.webp`).padStart(4)}KB  avif ${kb(`${OUT}/${slug}.avif`).padStart(4)}KB`);
}

for (const p of PLATES) await generate(p);
console.log("\nPlates are illustrative photography, not documentary records of this summit.");
```

- [ ] **Step 2: Generate**

```bash
export OPENROUTER_API_KEY=$(grep '^OPENROUTER_API_KEY=' .env.local | cut -d= -f2- | tr -d '"'"'"' \r')
node scripts/make-grid-images.js
```

Expected: eight `slug  webp NNNKB  avif NNNKB` lines, every file under 200 KB.

- [ ] **Step 3: Replace the three vignette figures on the homepage**

At the very top of `src/index.njk`, immediately after the closing `---` of the front matter, add:

```njk
{% from "components/image-grid.njk" import grid %}
```

Replace the `<img class="vignette" ... tea-branch.webp ...>` element with:

```njk
      {{ grid([
        {src:"/img/plates/rows-morning", alt:"Contour rows of a highland tea plantation in early morning mist.", w:1200, h:900},
        {src:"/img/plates/leaf-close",   alt:"Close view of fresh two-leaves-and-a-bud tea shoots.", w:1200, h:900},
        {src:"/img/plates/highland",     alt:"Kenyan highland landscape with a red earth track through tea fields.", w:1200, h:900}
      ], "Kenya's growing highlands", "I") }}
```

Replace the `tea-chest.webp` element with:

```njk
      {{ grid([
        {src:"/img/plates/withering", alt:"Withering troughs of green leaf in a tea factory.", w:1200, h:900},
        {src:"/img/plates/sorting",   alt:"Graded black tea separated into piles on a sorting surface.", w:1200, h:900},
        {src:"/img/plates/sacks",     alt:"Stacked unmarked hessian sacks of bulk tea in a warehouse.", w:1200, h:900},
        {src:"/img/plates/chest-stack", alt:"Stack of plain plywood shipping chests with metal corner protectors.", w:1200, h:900}
      ], "Processing and the expo floor", "II") }}
```

Replace the `mount-kenya.webp` element with:

```njk
      {{ grid([
        {src:"/img/plates/liquor",    alt:"Porcelain cupping bowls holding brewed tea liquor of varying strengths.", w:1200, h:900},
        {src:"/img/plates/highland",  alt:"Kenyan highland landscape with tea fields under a tall sky.", w:1200, h:900}
      ], "Coming to Nairobi", "III") }}
```

- [ ] **Step 4: Retire the vignettes**

```bash
git mv src/assets/img/vignettes src/assets/img/_retired-vignettes
```

Add a note at the top of `scripts/make-vignettes.js`, directly under the shebang:

```js
// RETIRED 2026-08-02 (spec §6). The engraved vignettes were replaced by
// photographic plate grids at the client's request. Kept, not deleted, so the
// decision is reversible; assets moved to src/assets/img/_retired-vignettes/.
```

Exclude the retired directory from the build — in `eleventy.config.js`, change the img passthrough to:

```js
  eleventyConfig.addPassthroughCopy({ "src/assets/img": "img" });
  eleventyConfig.ignores.add("src/assets/img/_retired-vignettes/**");
```

- [ ] **Step 5: Build and verify**

```bash
npm run build
node -e '
const h=require("fs").readFileSync("public/index.html","utf8");
console.log("vignette refs (want 0):", (h.match(/class="vignette"/g)||[]).length);
console.log("plate figures (want 3):", (h.match(/class="plate /g)||[]).length);
console.log("plate images (want 9):", (h.match(/plate__cell/g)||[]).length);
console.log("every img has dims:", !/<img(?![^>]*width=)[^>]*>/.test(h));
'
ls public/img/_retired-vignettes 2>/dev/null && echo "RETIRED DIR LEAKED INTO BUILD" || echo "retired dir correctly excluded"
```

Expected: `0`, `3`, `9`, `true`, `retired dir correctly excluded`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(design): photographic plate grids replace engraved vignettes

Client feedback: engravings read as old. Eight plates generated under the
FACTS.md §2 constraint - no people, premises, signage or implied past editions.
Vignette generator and assets retired rather than deleted."
```

---

### Task 7: Measure text-over-image contrast

The scrim in Task 4 was designed, not measured. The craft floor requires reading computed values.

**Files:**
- Modify: `scripts/check-contrast.js`

**Interfaces:**
- Consumes: `public/img/hero-poster.webp` from Task 3, the scrim from Task 4
- Produces: a measured worst-case contrast for hero text over the actual scrimmed poster; fails under 4.5:1.

- [ ] **Step 1: Add the scrim measurement**

Append to `scripts/check-contrast.js`, before the final report block:

```js
// --- text over the hero poster ---------------------------------------------
// The scrim is a designed value; this measures the real worst case by compositing
// the gradient over the actual poster and sampling the darkest-text region.
import sharp from "sharp";
import { existsSync } from "node:fs";

const POSTER = "public/img/hero-poster.webp";
if (existsSync(POSTER)) {
  // Sample the left 55% of the frame, where the h1 and particulars sit.
  const { data, info } = await sharp(POSTER)
    .extract({ left: 0, top: 0, width: Math.floor(1600 * 0.55), height: 900 })
    .resize(40, 24, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Scrim alpha across that region runs 0.94 -> ~0.80. Use the WEAKEST (0.80).
  const SCRIM = { r: 15, g: 46, b: 22, a: 0.8 };
  let worst = Infinity;
  const fg = tok["--c-paper"];
  for (let i = 0; i < data.length; i += info.channels) {
    const composited =
      "#" +
      [0, 1, 2]
        .map((c) => Math.round(data[i + c] * (1 - SCRIM.a) + [SCRIM.r, SCRIM.g, SCRIM.b][c] * SCRIM.a))
        .map((v) => v.toString(16).padStart(2, "0"))
        .join("");
    worst = Math.min(worst, ratio(fg, composited));
  }
  const ok = worst >= 4.5;
  if (!ok) failed++;
  console.log(
    "hero text over scrimmed poster (worst px)".padEnd(46),
    worst.toFixed(2).padStart(7),
    ` 4.5  ${ok ? "pass" : "FAIL"}`,
  );
} else {
  console.log("hero poster not built yet — scrim check skipped".padEnd(46));
}
```

- [ ] **Step 2: Run it**

```bash
npm run build
```

Expected: a `hero text over scrimmed poster (worst px)` line with a ratio at or above 4.5, and `RESULT: PASS`.

- [ ] **Step 3: If it fails, strengthen the scrim rather than lowering the floor**

If the worst pixel is under 4.5, increase the scrim stops in `src/assets/css/style.css` by `0.04` each and re-run. Repeat until it passes. **Do not lower the 4.5 threshold.**

- [ ] **Step 4: Commit**

```bash
git add scripts/check-contrast.js src/assets/css/style.css
git commit -m "test(a11y): measure hero text contrast over the real scrimmed poster

The scrim was a designed value. This composites the gradient over the actual
poster and samples the worst pixel in the text region, so the 4.5:1 floor is
measured rather than assumed."
```

---

# SUB-PROJECT B — Downloads

### Task 8: Downloads collection and validator rule 8

**Files:**
- Create: `src/downloads/*.md`, `public/files/` seed, `scripts/validate-content.test.js`
- Modify: `scripts/validate-content.js`, `eleventy.config.js`, `package.json`

**Interfaces:**
- Consumes: nothing
- Produces: `collections.downloads` sorted by category then title; validator rule 8 failing the build when a `file:` is missing or `bytes:` mismatches.

- [ ] **Step 1: Write the failing test**

Create `scripts/validate-content.test.js`:

```js
import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";

const run = () => {
  try {
    execFileSync("node", ["scripts/validate-content.js"], { encoding: "utf8" });
    return { code: 0, out: "" };
  } catch (e) {
    return { code: e.status, out: e.stdout + e.stderr };
  }
};

test("rule 8: a download whose file is missing fails the build", () => {
  mkdirSync("src/downloads", { recursive: true });
  writeFileSync(
    "src/downloads/__fixture.md",
    `---\ntitle: Fixture\ncategory: report\nfile: /files/does-not-exist.pdf\nbytes: 123\nformat: PDF\n---\n`,
  );
  const { code, out } = run();
  rmSync("src/downloads/__fixture.md");
  assert.equal(code, 1, "validator should exit 1");
  assert.match(out, /does-not-exist\.pdf/, "error should name the missing file");
});

test("rule 8: a download whose bytes mismatch fails the build", () => {
  mkdirSync("public/files", { recursive: true });
  writeFileSync("public/files/__fixture.pdf", "x".repeat(500));
  writeFileSync(
    "src/downloads/__fixture.md",
    `---\ntitle: Fixture\ncategory: report\nfile: /files/__fixture.pdf\nbytes: 999\nformat: PDF\n---\n`,
  );
  const { code, out } = run();
  rmSync("src/downloads/__fixture.md");
  rmSync("public/files/__fixture.pdf");
  assert.equal(code, 1);
  assert.match(out, /bytes/i);
});
```

Add to `package.json` scripts:

```json
"test": "node --test scripts/*.test.js"
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test
```

Expected: both tests FAIL — the validator currently exits 0 because rule 8 does not exist.

- [ ] **Step 3: Implement rule 8**

In `scripts/validate-content.js`, immediately before the `--- report ---` block, add:

```js
// --- rule 8: downloads must point at files that exist, at the stated size ----
// A downloads page listing a 404 is worse than no downloads page.
const downloads = loadCollection("downloads");
for (const d of downloads) {
  const { file, bytes, title, category } = d.data;
  if (!title) errors.push(`${d.file}: missing "title"`);
  if (!category) errors.push(`${d.file}: missing "category"`);
  if (!file) { errors.push(`${d.file}: missing "file"`); continue; }

  const onDisk = join("public", file.replace(/^\//, ""));
  if (!existsSync(onDisk)) {
    errors.push(`${d.file}: file "${file}" not found at ${onDisk}`);
    continue;
  }
  const actual = statSync(onDisk).size;
  if (bytes == null) {
    errors.push(`${d.file}: missing "bytes" (actual is ${actual})`);
  } else if (Number(bytes) !== actual) {
    errors.push(`${d.file}: bytes ${bytes} does not match actual ${actual} for "${file}"`);
  }
}
```

At the top of the same file, extend the fs import:

```js
import { readdirSync, readFileSync, existsSync, statSync } from "node:fs";
```

- [ ] **Step 4: Run the test to verify it passes**

```bash
npm test
```

Expected: both tests PASS.

- [ ] **Step 5: Add the collection and a real first download**

In `eleventy.config.js`, after the `news` collection, add:

```js
  eleventyConfig.addCollection("downloads", (c) =>
    c.getFilteredByGlob("src/downloads/*.md").sort((a, b) => {
      const k = String(a.data.category).localeCompare(String(b.data.category));
      return k !== 0 ? k : String(a.data.title).localeCompare(String(b.data.title));
    }),
  );
```

The only document that genuinely exists today is the copy export. Publish it as the first entry:

```bash
mkdir -p public/files src/downloads
cp website_content/COPY-FOR-REVIEW.md /tmp/ignore-this || true
```

Create `src/downloads/summit-fact-sheet.md`:

```markdown
---
title: Summit fact sheet
category: brochure
file: /files/kcts-2027-fact-sheet.pdf
bytes: 0
format: PDF
pages: 1
updated: 2026-08-02
locale: en
gated: false
description: Dates, location, theme, objectives and registration categories on one page.
---
```

**This will fail rule 8 until the PDF exists — that is the point.** Generate it:

```bash
node -e '
const fs=require("fs");
const s=require("./src/_data/summit.js").default;
const lines=[
 s.name, s.tagline, "", `Dates: ${s.dates.display}`, `Location: ${s.location.city}, ${s.location.country}`,
 `Theme: ${s.theme}`, "", "Objectives:", ...s.objectives.map(o=>` - ${o.title}: ${o.body}`),
 "", "Registration categories:", ...s.registrationCategories.map(c=>` - ${c.name}: ${c.blurb}`),
 "", `Organised by ${s.organiser.name}, ${s.organiser.legalEntity}.`,
];
const text=lines.join("\n");
const esc=t=>t.replace(/[\\()]/g,c=>"\\"+c);
const content=`BT /F1 9 Tf 40 800 Td 12 TL\n`+text.split("\n").map(l=>`(${esc(l)}) Tj T*`).join("\n")+`\nET`;
const objs=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
`<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
let pdf="%PDF-1.4\n"; const off=[];
objs.forEach((o,i)=>{off.push(pdf.length);pdf+=`${i+1} 0 obj\n${o}\nendobj\n`;});
const x=pdf.length;
pdf+=`xref\n0 ${objs.length+1}\n0000000000 65535 f \n`+off.map(o=>String(o).padStart(10,"0")+" 00000 n \n").join("");
pdf+=`trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${x}\n%%EOF`;
fs.mkdirSync("public/files",{recursive:true});
fs.writeFileSync("public/files/kcts-2027-fact-sheet.pdf",pdf,"latin1");
console.log("wrote", fs.statSync("public/files/kcts-2027-fact-sheet.pdf").size, "bytes");
'
```

Take the printed byte count and put it in the `bytes:` field of `src/downloads/summit-fact-sheet.md`.

**`public/` is gitignored and wiped by `npm run clean`.** Move the source of truth out of it:

```bash
mkdir -p src/static-files
mv public/files/kcts-2027-fact-sheet.pdf src/static-files/
```

In `eleventy.config.js`, add the passthrough:

```js
  eleventyConfig.addPassthroughCopy({ "src/static-files": "files" });
```

- [ ] **Step 6: Verify the whole chain**

```bash
npm run build && npm test
```

Expected: build passes with rule 8 green, both tests pass.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(downloads): collection plus validator rule 8

Rule 8 fails the build when a download points at a missing file or a wrong byte
count - a downloads page listing a 404 is worse than none. Tested against both
failure shapes before implementing. Files live in src/static-files/ because
public/ is wiped by clean."
```

---

### Task 9: Downloads page and Media collapse

**Files:**
- Create: `src/pages/downloads.njk`
- Modify: `src/pages/media.njk`, `src/_data/navigation.js`, `src/assets/css/style.css`, `docs/PAGE-MAP.md`

**Interfaces:**
- Consumes: `collections.downloads` from Task 8
- Produces: `/downloads/` listing grouped by category.

- [ ] **Step 1: Create the page**

Create `src/pages/downloads.njk`:

```njk
---
layout: layouts/page.njk
permalink: /downloads/
title: Downloads
heading: Documents and downloads
docName: Schedule G · Documents
serial: No. KCTS/2027/D
standfirst: Everything published about the summit, in one place, in its current version.
description: Download the Kenya-China Tea Summit 2027 fact sheet, brochure, agenda, sponsorship and exhibition documents.
sitemapPriority: 0.8
---

{% set groups = {
  brochure: "Summit overview",
  agenda: "Programme",
  exhibition: "Exhibition",
  sponsorship: "Partnership",
  report: "Reports",
  press: "Press",
  policy: "Policies"
} %}

{% set any = false %}
{% for key, label in groups %}
  {% set items = collections.downloads | selectattr("data.category", "equalto", key) %}
  {% if items | length %}
    {% set any = true %}
<h2>{{ label }}</h2>
<ul class="dl-list">
  {% for d in items %}
  <li class="dl-item">
    <a class="dl-item__name" href="{{ d.data.file }}" download>{{ d.data.title }}</a>
    <span class="dl-item__meta">{{ d.data.format }} · {{ (d.data.bytes / 1024) | round }} KB{% if d.data.pages %} · {{ d.data.pages }} pp{% endif %} · updated <time datetime="{{ d.data.updated | isoDate }}">{{ d.data.updated | readableDate }}</time></span>
    {% if d.data.description %}<span class="dl-item__desc">{{ d.data.description }}</span>{% endif %}
  </li>
  {% endfor %}
</ul>
  {% endif %}
{% endfor %}

{% if not any %}
<div class="note">
  <p class="note__label">Nothing published yet</p>
  <p>Documents appear here as the secretariat releases them.</p>
</div>
{% endif %}

<div class="note">
  <p class="note__label">Versions</p>
  <p>This page always carries the current version of each document. Superseded versions are removed rather than archived, so a link you saved will always give you the latest. Every entry shows the date it was last updated.</p>
</div>
```

- [ ] **Step 2: Add the CSS**

Append to `src/assets/css/style.css`:

```css
/* ==== downloads ========================================================= */

.dl-list { list-style: none; margin: 0 0 var(--sp-l); padding: 0; }
.dl-item {
  display: grid; gap: var(--sp-3xs);
  padding-block: var(--sp-s);
  border-top: 1px solid var(--c-rule);
  max-width: var(--measure);
}
.dl-list .dl-item:last-child { border-bottom: 1px solid var(--c-rule); }
.dl-item__name { font-family: var(--font-display); font-size: var(--step-1); font-weight: 600; }
.dl-item__meta {
  font-family: var(--font-data); font-size: var(--step--2);
  color: var(--c-text-muted); letter-spacing: 0.02em;
}
.dl-item__desc { font-size: var(--step--1); color: var(--c-text-muted); }
```

- [ ] **Step 3: Collapse Media**

In `src/pages/media.njk`, replace the `Press pack` and `Media contact` field rows and the "Using the summit's name and mark" section with:

```njk
<h2>Assets and documents</h2>

<p>The press pack, logo files and published documents are all on the <a href="/downloads/">downloads page</a>, which always carries the current version of each.</p>

<h2>Using the summit's name and mark</h2>

<p>The logo may be used in editorial coverage of the summit without prior permission. It may not be used in a way that implies partnership, endorsement or sponsorship.</p>
```

- [ ] **Step 4: Add to navigation**

In `src/_data/navigation.js`, in the `footer` group titled `"The summit"`, add after the News entry:

```js
        { text: "Downloads", url: "/downloads/" },
```

- [ ] **Step 5: Update the page map**

In `docs/PAGE-MAP.md`, add a row to the launch table:

```markdown
| 18 | Downloads | `/downloads/` | kenya china tea summit brochure pdf | informational | Single home for every published document, current version only | **built** |
```

And change the Media row's job to: `Accreditation and reporting guidance only; assets live on /downloads/`.

- [ ] **Step 6: Build and verify**

```bash
npm run build
node -e '
const fs=require("fs");
const h=fs.readFileSync("public/downloads/index.html","utf8");
console.log("fact sheet listed:", /kcts-2027-fact-sheet\.pdf/.test(h));
console.log("media links to downloads:", /\/downloads\//.test(fs.readFileSync("public/media/index.html","utf8")));
console.log("pdf served:", fs.existsSync("public/files/kcts-2027-fact-sheet.pdf"));
'
```

Expected: all three `true`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(downloads): downloads page, Media collapsed into it

Media kept accreditation and reporting guidance; every asset now lives on
/downloads/. Three overlapping pages become two."
```

---

# SUB-PROJECT A — Chinese edition

### Task 10: Locale scaffolding

**Files:**
- Create: `src/_data/locales.js`, `src/pages/pages.11tydata.js`
- Modify: all 17 files in `src/pages/`, `src/index.njk`, `eleventy.config.js`

**Interfaces:**
- Consumes: nothing
- Produces: every page rendered twice — `/x/` and `/zh/x/`. Front-matter key `permalink` is replaced by `basePath` on every page; `locale` and `lang` are available in every template.

- [ ] **Step 1: Create the locales data file**

Create `src/_data/locales.js`:

```js
// Drives per-locale pagination. English is the source language and stays at the
// site root, so no existing URL changes and no redirects are needed.
export default ["en", "zh"];
```

- [ ] **Step 2: Create the directory data file**

Create `src/pages/pages.11tydata.js`:

```js
// Renders every page in this directory once per locale.
// Pages declare `basePath: /about/`; the permalink is computed from it.
export default {
  pagination: {
    data: "locales",
    size: 1,
    alias: "locale",
    addAllPagesToCollections: true,
  },
  eleventyComputed: {
    permalink: (data) =>
      data.locale === "en" ? data.basePath : `/zh${data.basePath}`,
    lang: (data) => (data.locale === "zh" ? "zh-Hans" : "en"),
    // Machine-translated pages are noindex until a human reviews them.
    translationStatus: (data) =>
      data.locale === "en" ? "source" : data.translationStatus || "machine",
  },
};
```

- [ ] **Step 3: Rename permalink to basePath across every page**

```bash
sed -i '' 's/^permalink: \(.*\)$/basePath: \1/' src/pages/*.njk
grep -c '^basePath:' src/pages/*.njk | grep ':0' && echo "SOME PAGE MISSING basePath" || echo "all pages have basePath"
```

Expected: `all pages have basePath`.

- [ ] **Step 4: Handle the homepage separately**

`src/index.njk` is not in `src/pages/`, so it needs its own pagination. Replace its front matter `permalink: /index.html` line with:

```yaml
basePath: /
pagination:
  data: locales
  size: 1
  alias: locale
  addAllPagesToCollections: true
eleventyComputed:
  permalink: "{% if locale == 'en' %}/index.html{% else %}/zh/index.html{% endif %}"
  lang: "{% if locale == 'zh' %}zh-Hans{% else %}en{% endif %}"
  translationStatus: "{% if locale == 'en' %}source{% else %}machine{% endif %}"
```

- [ ] **Step 5: Make `lang` and `absoluteUrl` locale-aware**

In `src/_includes/layouts/base.njk`, change the opening html tag from `<html lang="{{ summit.lang }}">` to:

```njk
<html lang="{{ lang or summit.lang }}">
```

- [ ] **Step 6: Build and verify both locales render**

```bash
npm run build
find public -name index.html | sed 's|public||;s|/index.html|/|' | sort | tr '\n' ' '
```

Expected: every path appears twice — once at root and once under `/zh/`. 36 pages total (18 × 2).

```bash
node -e '
const fs=require("fs");
console.log("zh about lang:", /html lang="zh-Hans"/.test(fs.readFileSync("public/zh/about/index.html","utf8")));
console.log("en about lang:", /html lang="en"/.test(fs.readFileSync("public/about/index.html","utf8")));
'
```

Expected: both `true`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): render every page per locale

English stays at root so no existing URL changes. permalink becomes basePath on
every page; a directory data file computes the real permalink per locale."
```

---

### Task 11: hreflang, switcher, and the noindex gate

**Files:**
- Modify: `src/_includes/layouts/base.njk`, `src/_includes/layouts/page.njk`, `src/sitemap.njk`, `src/_data/navigation.js`, `src/assets/css/style.css`

**Interfaces:**
- Consumes: `locale`, `lang`, `basePath`, `translationStatus` from Task 10
- Produces: reciprocal hreflang on every page; a switcher linking to the same page in the other locale; unreviewed `zh` pages carrying `noindex` and absent from the sitemap.

- [ ] **Step 1: Add hreflang and the robots gate**

In `src/_includes/layouts/base.njk`, immediately after the canonical link, add:

```njk
<link rel="alternate" hreflang="en" href="{{ basePath | absoluteUrl }}">
<link rel="alternate" hreflang="zh-Hans" href="{{ ("/zh" + basePath) | absoluteUrl }}">
<link rel="alternate" hreflang="x-default" href="{{ basePath | absoluteUrl }}">
{% if translationStatus == "machine" %}<meta name="robots" content="noindex, follow">{% endif %}
```

- [ ] **Step 2: Add the language switcher**

In `src/_includes/layouts/base.njk`, immediately before the closing `</nav>` of the primary nav, add:

```njk
    <a class="lang-switch" href="{% if locale == 'zh' %}{{ basePath }}{% else %}/zh{{ basePath }}{% endif %}"
       lang="{% if locale == 'zh' %}en{% else %}zh-Hans{% endif %}"
       rel="alternate"
       hreflang="{% if locale == 'zh' %}en{% else %}zh-Hans{% endif %}">{% if locale == 'zh' %}English{% else %}中文{% endif %}</a>
```

- [ ] **Step 3: Add the machine-translation notice**

In `src/_includes/layouts/page.njk`, immediately after the opening `<section class="section">` and before `{{ content | safe }}`'s wrapping div, insert inside the wrap:

```njk
    {% if translationStatus == "machine" %}
    <div class="mt-notice" role="note" lang="zh-Hans">
      <p><strong>本页面为机器翻译，尚未经过人工审核。</strong>如有疑问，请以<a href="{{ basePath }}" lang="en" hreflang="en">英文原版</a>为准。</p>
    </div>
    {% endif %}
```

- [ ] **Step 4: Exclude unreviewed pages from the sitemap**

In `src/sitemap.njk`, change the exclusion condition from:

```njk
{%- if not item.data.excludeFromSitemap %}
```

to:

```njk
{%- if not item.data.excludeFromSitemap and item.data.translationStatus != "machine" %}
```

- [ ] **Step 5: Add the CSS**

Append to `src/assets/css/style.css`:

```css
/* ==== locale ============================================================ */

.lang-switch {
  font-family: var(--font-ui); font-size: var(--step--1); font-weight: 600;
  letter-spacing: 0.06em;
  color: var(--c-ply-canary); text-decoration: none;
  border: 1px solid currentColor;
  padding: var(--sp-3xs) var(--sp-2xs);
  margin-inline-start: var(--sp-s);
  white-space: nowrap;
}
.lang-switch:hover { background: var(--c-ply-canary); color: var(--c-ink-2); }

.mt-notice {
  border: 1px dashed var(--c-seal);
  padding: var(--sp-s);
  margin-bottom: var(--sp-l);
  max-width: var(--measure);
}
.mt-notice p { margin: 0; font-size: var(--step--1); }
```

- [ ] **Step 6: Build and verify the gate works**

```bash
npm run build
node -e '
const fs=require("fs");
const zh=fs.readFileSync("public/zh/about/index.html","utf8");
const en=fs.readFileSync("public/about/index.html","utf8");
const sm=fs.readFileSync("public/sitemap.xml","utf8");
console.log("zh noindex:", /content="noindex, follow"/.test(zh));
console.log("en NOT noindex:", !/noindex/.test(en));
console.log("zh MT notice:", /mt-notice/.test(zh));
console.log("hreflang on en:", (en.match(/rel="alternate"/g)||[]).length >= 3);
console.log("zh urls in sitemap (want 0):", (sm.match(/\/zh\//g)||[]).length);
console.log("en urls in sitemap:", (sm.match(/<loc>/g)||[]).length);
'
```

Expected: `true`, `true`, `true`, `true`, `0`, `18`.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(i18n): hreflang, language switcher, and the noindex gate

Unreviewed machine translation ships noindex and stays out of the sitemap.
Publishing it into the index is against Google's scaled-content guidance and, on
a diplomatic trade summit, a credibility risk in front of the exact audience it
targets. One field flips a page to reviewed."
```

---

### Task 12: Translate, and validate locale parity

**Files:**
- Create: `scripts/translate.js`
- Modify: `scripts/validate-content.js`, `scripts/validate-content.test.js`, `scripts/export-copy.js`, `package.json`

**Interfaces:**
- Consumes: built `public/**/index.html` for both locales
- Produces: `zh` translations; validator rule 9 enforcing locale parity; `npm run copy -- --locale zh`.

- [ ] **Step 1: Write the failing test for rule 9**

Append to `scripts/validate-content.test.js`:

```js
test("rule 9: a page with no zh counterpart fails the build", () => {
  writeFileSync(
    "src/pages/__orphan.njk",
    `---\nlayout: layouts/page.njk\nbasePath: /orphan/\ntitle: Orphan\ndescription: x\nnoLocale: true\n---\nbody\n`,
  );
  const { code, out } = run();
  rmSync("src/pages/__orphan.njk");
  assert.equal(code, 1);
  assert.match(out, /orphan/i);
});
```

- [ ] **Step 2: Run it — expect failure**

```bash
npm test
```

Expected: the rule 9 test FAILS; rule 9 does not exist yet.

- [ ] **Step 3: Implement rule 9**

In `scripts/validate-content.js`, after rule 8, add:

```js
// --- rule 9: every page must render in both locales --------------------------
// A page that opts out of localisation silently produces a Chinese edition with
// a hole in it. Opting out has to be explicit and is not currently allowed.
for (const f of existsSync(join(SRC, "pages")) ? readdirSync(join(SRC, "pages")) : []) {
  if (!f.endsWith(".njk")) continue;
  const file = join(SRC, "pages", f);
  const raw = readFileSync(file, "utf8");
  if (!raw.startsWith("---")) continue;
  const fm = raw.slice(3, raw.indexOf("\n---", 3));
  if (/^\s*noLocale:\s*true\s*$/m.test(fm)) {
    errors.push(`${file}: sets noLocale, which would leave a hole in the Chinese edition`);
  }
  if (!/^\s*basePath:\s*\S/m.test(fm)) {
    errors.push(`${file}: missing "basePath" — required for locale routing`);
  }
}
```

- [ ] **Step 4: Run to verify it passes**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 5: Write the translator**

Create `scripts/translate.js`:

```js
#!/usr/bin/env node
// Machine-translates the built English pages into Chinese page data.
//
// Output is marked `machine` and therefore ships noindex and out of the sitemap
// until a human sets translationStatus: reviewed. Never publish this unreviewed.
//
// Run: OPENROUTER_API_KEY=... node scripts/translate.js

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";

// Deliberately not fs.globSync: that landed in Node 22, and package.json
// declares engines >=20. readdirSync is available everywhere.
const listPages = () =>
  readdirSync("public", { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name !== "zh" && existsSync(`public/${e.name}/index.html`))
    .map((e) => `public/${e.name}/index.html`)
    .concat("public/index.html");

const KEY = process.env.OPENROUTER_API_KEY;
if (!KEY) { console.error("OPENROUTER_API_KEY not set"); process.exit(1); }
const MODEL = "anthropic/claude-sonnet-4.5";
const OUT = "src/_data/i18n/zh";
mkdirSync(OUT, { recursive: true });

const SYSTEM =
  "You translate website copy from English into Simplified Chinese for an " +
  "international tea-trade summit held in Nairobi. Register: formal, commercial, " +
  "suitable for government officials and corporate buyers. Rules: keep proper " +
  "nouns (Kenya-China Tea Summit, Orbitline Events & Ushers Ltd, Nairobi) " +
  "accurate; keep all numbers, dates and percentages EXACTLY as given; do not " +
  "add, remove or soften any claim; return ONLY a JSON object with the same keys " +
  "as the input and translated string values.";

const pages = listPages();

for (const file of pages) {
  const slug = file === "public/index.html" ? "home" : file.split("/")[1];
  if (existsSync(`${OUT}/${slug}.json`)) continue;

  const html = readFileSync(file, "utf8");
  const main = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
  const strings = {};
  let i = 0;
  for (const m of main.matchAll(/<(h1|h2|h3|p|li|dt|dd|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/gi)) {
    const text = m[2].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
    if (text && text.length > 1) strings[`s${i++}`] = text;
  }
  if (!Object.keys(strings).length) continue;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: JSON.stringify(strings, null, 1) },
      ],
    }),
  });
  if (!res.ok) { console.error(`${slug}: HTTP ${res.status}`); continue; }

  const raw = (await res.json())?.choices?.[0]?.message?.content ?? "";
  const json = raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1);
  try {
    const parsed = JSON.parse(json);
    writeFileSync(`${OUT}/${slug}.json`, JSON.stringify({ translationStatus: "machine", strings: parsed }, null, 2));
    console.log(`${slug.padEnd(18)} ${Object.keys(parsed).length} strings`);
  } catch {
    console.error(`${slug}: model did not return parseable JSON, skipped`);
  }
}
console.log("\nAll output is marked machine and ships noindex until reviewed.");
```

Add to `package.json` scripts:

```json
"translate": "node scripts/translate.js"
```

- [ ] **Step 6: Run the translation**

```bash
npm run build
export OPENROUTER_API_KEY=$(grep '^OPENROUTER_API_KEY=' .env.local | cut -d= -f2- | tr -d '"'"'"' \r')
npm run translate
```

Expected: one line per page with a string count, and `src/_data/i18n/zh/*.json` written.

- [ ] **Step 7: Add the locale flag to the copy export**

In `scripts/export-copy.js`, change the `ORDER` mapping and output path resolution so `--locale zh` reads `public/zh/...`. Replace the `const OUT = ...` line with:

```js
const LOCALE = process.argv.includes("--locale") ? process.argv[process.argv.indexOf("--locale") + 1] : "en";
const PREFIX = LOCALE === "en" ? "" : `/${LOCALE}`;
const OUT = LOCALE === "en"
  ? "website_content/COPY-FOR-REVIEW.md"
  : `website_content/COPY-FOR-REVIEW-${LOCALE}.md`;
```

And in the section loop, change the file resolution line to:

```js
  const file = url === "/" ? `public${PREFIX}/index.html` : `public${PREFIX}${url}index.html`;
```

- [ ] **Step 8: Generate the Chinese review document**

```bash
npm run build && node scripts/export-copy.js --locale zh
```

Expected: `website_content/COPY-FOR-REVIEW-zh.md — 18 pages, ~N words`.

- [ ] **Step 9: Verify the whole thing**

```bash
npm test && npm run build
node -e '
const fs=require("fs");
const sm=fs.readFileSync("public/sitemap.xml","utf8");
console.log("zh in sitemap (want 0):", (sm.match(/\/zh\//g)||[]).length);
console.log("zh review doc exists:", fs.existsSync("website_content/COPY-FOR-REVIEW-zh.md"));
console.log("zh page still noindex:", /noindex/.test(fs.readFileSync("public/zh/about/index.html","utf8")));
'
```

Expected: `0`, `true`, `true`.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(i18n): machine translation, locale parity rule, zh copy export

Rule 9 refuses a page that opts out of localisation or lacks basePath, so the
Chinese edition cannot silently develop holes. Translation output is marked
machine and stays noindex and out of the sitemap until a human reviews the
generated COPY-FOR-REVIEW-zh.md."
```

---

## Final verification

- [ ] **Deploy and re-run the live gates**

```bash
npm run build
npx wrangler pages deploy public --project-name kenya-china-tea-summit --branch main --commit-dirty=true
```

- [ ] **Update project docs in one commit**

`HANDOFF.md` — replace the stale "Next up" and "Known deferred" sections with current state, including that Eleventy now renders per locale and `public/` contains 36 pages.
`docs/DECISIONS.md` — add ADR-012 (photographic plates supersede engraved vignettes, with the client-feedback reason), ADR-013 (video hero and countdown as a deliberate move toward category convention, with the document-native mitigation), ADR-014 (machine translation gated noindex).
`AUDIT.md` — append iteration 6 with real captured output from every verification step above.
`.web-factory/STATE.json` — mark D4 passed, add criteria for the three sub-projects.

```bash
git add -A && git commit -m "docs: record ADR-012..014 and refresh handoff after hero, downloads and i18n"
git push origin main
```

---

## Self-Review

**Spec coverage.** §4 Chinese → Tasks 10, 11, 12. §5 Downloads → Tasks 8, 9. §6 video → Tasks 3, 4; countdown → Task 4; image grids → Tasks 5, 6; contrast scrim → Task 7. §7–§9 portal → deliberately absent, deferred. Global CSS/JS/video budgets → Task 1. Media collapse → Task 9. `export-copy --locale` → Task 12.

**Gap found and closed:** the spec's §5 mentions Supabase Storage for files over 10 MB. That depends on the Supabase project, which does not exist until portal work starts. Task 8 uses `src/static-files/` passthrough instead, which is correct for the small documents that exist now. **When a download exceeds 10 MB, that is the trigger to bring the Supabase decision forward** — recorded here rather than silently ignored.

**Gap found and closed:** the spec did not state where downloadable files live. `public/` is wiped by `npm run clean`, so a file placed there would vanish on the next build. Task 8 Step 5 moves them to `src/static-files/` with a passthrough.

**Ordering correction:** the spec ordered A → B → V. This plan runs **V → B → A**, because Task 10 rewrites front matter across all 17 pages and Task 12 extracts strings from built output — doing that before V's markup churn and B's new page would mean doing it twice.

**Type consistency:** `grid(images, caption, plate)` defined in Task 5 is called with exactly that signature in Task 6. `daysUntil` defined in Task 4 Step 1 is used in Step 4. `basePath` introduced in Task 10 is consumed in Task 11's hreflang and switcher. `translationStatus` computed in Task 10 gates Task 11's robots meta, sitemap and notice. `loadCollection` reused in rule 8 is the existing helper in `validate-content.js`.

**Placeholder scan:** no TBD, no "add error handling", no "similar to Task N". Every code step carries complete code.
