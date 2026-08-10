# Photography, Layout and Language Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**STATUS: NOT STARTED — written 10 August 2026, approved, zero tasks executed.**

**Goal:** Replace nine AI-generated photographs with 22 real client images, add a
two-row grid variant, reclaim the ~40% of horizontal space currently dead on all
17 inner pages with a right rail, and fold the second language audit into the
approved V2 copy run.

**Architecture:** This plan does **not** replace
`docs/superpowers/plans/2026-08-03-copy-v2.md`. It amends that plan in Task A,
then adds five tasks that run after its copy work lands. Copy is applied first
and imagery second, deliberately: the V2 copy tasks replace page bodies
wholesale, so adding plates and rails beforehand would mean writing that markup
twice.

**Tech Stack:** Eleventy 3 + Nunjucks, sharp 0.35 (devDependency), CSS Grid with
`:has()`, Node 22 built-in test runner. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-08-10-photography-layout-language-design.md`

## Global Constraints

Everything in the V2 plan's own Global Constraints section still applies. In
addition:

- **No image of a person, a building interior or exterior, a vehicle, packaging,
  a logo, or any legible text may ship.** `website_content/FACTS.md` §2 forbids
  it. The excluded source files are listed in Task B and must not be reinstated.
- **No shipped image may carry EXIF metadata of any kind.** The drone files
  contain GPS coordinates of a private estate.
- Every `<img>` carries a non-empty `alt` written in the manifest, not at the
  template.
- Per-file image cap 200 KB; aggregate `public/img` cap 6 MB;
  `hero-poster.avif` stays under 100 KB.
- `src/assets/css/tokens.css` is the only file permitted a hex literal.
- Preserve every existing route. No page is created or deleted.
- Never assert a location more specific than "Kenyan highlands". The source
  files do not establish one.
- Commit after every task. Never use `git push --force`.

## Running Order

| Order | Task | Document |
|---|---|---|
| 1 | **A — Amend the V2 plan** | this plan |
| 2 | V2 Tasks 1–3 (strip vocabulary, rule 10, FACTS/ADR-015/B-005) | V2 plan |
| 3 | V2 Task 4 (navigation, as amended) | V2 plan |
| 4 | V2 Tasks 5–11 (copy, as amended) | V2 plan |
| 5 | **B — Photography pipeline** | this plan |
| 6 | **C — Grid variants and responsive sources** | this plan |
| 7 | **D — Plate placement** | this plan |
| 8 | **E — The right rail** | this plan |
| 9 | **F — Annotated client review export** | this plan |
| 10 | V2 Task 12 (translate, verify, deploy) | V2 plan |

V2 Task 12 must run last. It regenerates the Chinese edition from built English
pages, and Tasks D and E add captions and CTA text that need translating.

---

### Task A: Amend the V2 plan

The V2 plan was written before the second language audit and before the client
supplied photography. Five edits make it correct. This task edits a planning
document, not source code, so it has no test cycle — its verification is that
the quoted strings are found and replaced.

**Files:**
- Modify: `docs/superpowers/plans/2026-08-03-copy-v2.md`

**Interfaces:**
- Consumes: nothing.
- Produces: an amended V2 plan. Tasks B–F assume V2 Task 4 has shipped the
  navigation defined below, and that V2 Tasks 5–11 have applied the editorial
  rules below.

- [ ] **Step 1: Add the editorial rules to Global Constraints**

In `docs/superpowers/plans/2026-08-03-copy-v2.md`, find this line in the
`## Global Constraints` list:

```markdown
- The words `premier`, `landmark` and `First Edition` do not appear anywhere in the shipped site.
```

Insert immediately after it:

```markdown
- The words `Class 1`, `Class 2`, `unallocated`, `no bulletins yet` and `why this page is mostly empty` do not appear anywhere in the shipped site.
- **Editorial rules, applied to every page in Tasks 5-11** (from `docs/kenya_china_tea_summit_website_language_audit.md` §12). Where V2's own wording breaks one of these, fix the wording; do not invent new claims to do it.
  1. Lead with the opportunity, not the administration.
  2. State the benefit before the process.
  3. One status message per page, not several placeholders.
  4. Do not apologise for the summit's stage.
  5. Prefer specific evidence to prestige adjectives.
  6. "Summit team" in marketing copy; "Secretariat" only in formal or legal copy.
  7. Write for translation: literal, short, one idea per sentence.
  8. No idiom that depends on British or Kenyan conversational English. The six the audit names are banned outright: `zero-tariff door`, `the floor and the close`, `in the building`, `left to chance`, `mirror image`, and any construction warning that someone may `quote you a rate`.
  9. Kenya and China as bilateral partners with complementary strengths — Kenya brings origin, quality and production expertise; China brings market, investment, technology and distribution. Never one-directional.
  10. One main idea per paragraph.
  11. Calls to action name an outcome.
  12. No internal planning or CMS language on a public page.
  13. Warnings become positive statements of policy. "Do not trust anyone else who quotes you a price" becomes "Official participation rates are issued by the Secretariat and published here once confirmed."
  14. Commercial outcomes, not generic networking language.
  15. Keep the visual world; let plain human language do the selling.
- Add warmth where it costs nothing: Nairobi as the meeting point, and the depth of tea culture on both sides. The commercial argument stays primary.
```

- [ ] **Step 2: Widen rule 10 in Task 2**

> **Superseded during execution, 10 August 2026.** This step as written put all
> ten patterns into Task 2's `FORBIDDEN` array. That was wrong: seven of them
> match copy that is still on eight pages until Tasks 5-10 rewrite it, so the
> build would have gone red at Task 2 and stayed red for eight tasks. The V2
> plan now carries only the four placeholder patterns in Task 2, and closes over
> the retired vocabulary in **Task 10, Step 4**, once the copy is gone. The
> correction is already applied; do not re-apply this step as written.

In the same file, in **Task 2, Step 3**, find the `FORBIDDEN` array and replace
it in full:

```js
const FORBIDDEN = [
  [/\[Confirm\b/i, 'an unresolved "[Confirm ...]" approval marker'],
  [/\[Insert\b/i, 'an unresolved "[Insert ...]" placeholder'],
  [/\bTBD\b/, 'a "TBD" placeholder'],
  [/to be entered/i, 'the retired wording "to be entered" — use "To be announced"'],
  [/\bClass [12]\b/, 'the retired registration label "Class 1"/"Class 2" — use the plain category name'],
  [/\bpremier\b/i, 'the superlative "premier", which FACTS.md no longer supports'],
  [/\blandmark\b/i, 'the superlative "landmark", which FACTS.md no longer supports'],
  [/\bunallocated\b/i, 'the sponsorship status "unallocated" — state no availability claim'],
  [/no bulletins yet/i, 'the placeholder "no bulletins yet"'],
  [/why this page is mostly empty/i, 'the self-deprecating heading "why this page is mostly empty"'],
];
```

Then in **Task 2, Step 1**, find the fixture test that asserts `[Confirm this]`
fails the build, and immediately after it add a second fixture covering the new
patterns. The V2 plan's Step 1 already establishes the fixture helper; reuse it
verbatim with this body:

```js
test("rule 10 rejects the retired vocabulary", async () => {
  for (const bad of ["Class 1 Delegate", "premier forum", "landmark platform",
                     "Unallocated", "No bulletins yet",
                     "Why this page is mostly empty"]) {
    const { code, out } = await runValidatorAgainstFixture(
      `---\ntitle: Fixture\nbasePath: /fixture/\n---\n<p>${bad}</p>\n`);
    assert.equal(code, 1, `expected "${bad}" to fail the build`);
    assert.match(out, /fixture/);
  }
});
```

- [ ] **Step 3: Add the photography line to FACTS.md in Task 3**

In **Task 3, Step 2**, after the instruction that moves "first edition" into §2,
add a new bullet to the step:

```markdown
Then append to §2, as its own bullet:

- **Photography.** The images on this site are client-supplied photographs of
  Kenyan tea estates and leaf. They are not a record of this summit. No caption,
  alt text or surrounding sentence may imply that any of them was taken at a
  previous edition, or that a previous edition took place.
```

- [ ] **Step 4: Replace the navigation in Task 4**

In **Task 4, Step 1**, replace the `primary` array and the `footer` array. The
audit's §13 hierarchy is adopted because it promotes B2B matchmaking — which
both audits independently name as the site's strongest proposition — into the
primary bar. Find:

```js
  primary: [
    { text: "About", url: "/about/" },
    { text: "Programme", url: "/programme/" },
    { text: "Exhibit", url: "/exhibition/" },
    { text: "Partner", url: "/sponsorship/" },
    { text: "Travel", url: "/travel/" },
    { text: "News", url: "/news/" },
  ],
```

Replace with:

```js
  primary: [
    { text: "About", url: "/about/" },
    { text: "Programme", url: "/programme/" },
    { text: "Expo", url: "/exhibition/" },
    { text: "B2B Meetings", url: "/b2b-matchmaking/" },
    { text: "Partners", url: "/sponsorship/" },
    { text: "Plan Your Visit", url: "/travel/" },
  ],
```

Then in the `footer` array, change the "Summit" group's links to add News back
and the "Take part" group to drop B2B, so nothing is orphaned:

```js
    {
      heading: "Summit",
      links: [
        { text: "About", url: "/about/" },
        { text: "Programme", url: "/programme/" },
        { text: "Speakers", url: "/speakers/" },
        { text: "News and insights", url: "/news/" },
        { text: "Downloads", url: "/downloads/" },
        { text: "Media accreditation", url: "/media/" },
      ],
    },
    {
      heading: "Take part",
      links: [
        { text: "Register interest", url: "/registration/" },
        { text: "Exhibit", url: "/exhibition/" },
        { text: "Partner", url: "/sponsorship/" },
      ],
    },
```

`Plan Your Visit` points at `/travel/`, whose page title stays "Travel and
stay". That is deliberate: the nav label is the reader's language, the page
title is the page's. Both audits ask for the former.

The V2 plan's **Task 4, Step 2** measures the header at 1280 px. The primary bar
still has six items, so the measurement stands — but `B2B Meetings` and `Plan
Your Visit` are two words each. Re-run the measurement rather than assuming it
passes.

- [ ] **Step 5: Correct the Partnership step in Task 7**

In **Task 7, Step 3**, after the paragraph ending "and any scarcity or discount
framing.", append:

```markdown
The audit (§4.9) is right that deleting the discount framing leaves a hole. Fill
it with the six things premium sponsors actually evaluate — strategic
relevance, audience access, category leadership, visibility, influence and
relationship-building — written as plain statements of what partnership gives.

**Do not use the audit's own prescribed opener.** It reads "The 2027 summit is
the first edition, giving partners the opportunity to establish an early
leadership position", and "first edition" is not in FACTS §1 — Task 3 of this
plan moves it to §2, do-not-imply. "Founding partner" carries the same
unsupported claim. Both are reinstatable the day the client confirms the
inaugural status in writing; that is logged as an open item in `BLOCKERS.md`.
```

- [ ] **Step 6: Log the reinstatement condition in BLOCKERS.md**

Append to `BLOCKERS.md`:

```markdown
## B-006 — "First edition" is unconfirmed, and it is blocking sponsorship copy

The client's brief never states that 2027 is the first Kenya-China Tea Summit.
FACTS.md §2 therefore lists it as do-not-imply.

The language audit's strongest sponsorship recommendation ("become a founding
partner", "establish an early leadership position in the first edition") depends
on it. The commercial substance has shipped without the framing; the framing is
a one-paragraph change the moment the client confirms in writing.

**Needs:** written confirmation from the Secretariat that no prior edition of
this summit has been held.
**Blocks:** the founding-partner positioning on `/sponsorship/` only. Nothing
else.
```

- [ ] **Step 7: Commit**

```bash
git add docs/superpowers/plans/2026-08-03-copy-v2.md BLOCKERS.md
git commit -m "docs: fold the language audit into the V2 plan

Widens validator rule 10 to the retired vocabulary, adopts the audit's
navigation hierarchy so B2B reaches the primary bar, adds the editorial
rules to the plan's global constraints, and records B-006 — the
founding-partner positioning is cut because FACTS.md does not confirm
that 2027 is the first edition."
```

---

### Task B: Photography pipeline

**Files:**
- Create: `scripts/make-plates.js`
- Create: `scripts/assert-no-exif.js`
- Modify: `package.json` (scripts block)
- Modify: `scripts/assert-budgets.js`
- Delete: `scripts/make-grid-images.js`
- Delete: `src/assets/img/plates/*.{avif,webp}` (the nine AI plates)

**Interfaces:**
- Consumes: nothing.
- Produces: `src/assets/img/plates/<slug>-{600,1200}.{avif,webp}` for the 22
  slugs listed in Step 1. Tasks C and D reference those slugs by name. The
  template path prefix is `/img/plates/<slug>` with no width or extension —
  Task C's macro appends them.

- [ ] **Step 1: Write the generator**

Create `scripts/make-plates.js`:

```js
#!/usr/bin/env node
// Converts the client's photographs into shipped plate imagery.
//
// Replaces scripts/make-grid-images.js, which generated the previous plates
// with an image model. Real photography is strictly better and needs no key.
//
// CONSTRAINT (website_content/FACTS.md §2): no people, no premises, no
// packaging, no signage, no logos, and nothing implying a previous edition of
// this summit. The source folder contains all of those; the manifest below is
// the allowlist, and it is the only thing that ships.
//
// Two widths, because a 3-up cell in a 74rem wrap is ~380px on desktop. Sending
// 1200px to a 380px box wastes roughly 4x the bytes on every small cell.
//
// Run: node scripts/make-plates.js

import { mkdirSync, existsSync, statSync } from "node:fs";
import sharp from "sharp";

const SRC = "assets-raw/Tea Project";
const OUT = "src/assets/img/plates";
const WIDTHS = [600, 1200];
const MAX_BYTES = 204800; // matches the per-file cap in assert-budgets.js

mkdirSync(OUT, { recursive: true });

const PLATES = [
  // --- aerial estate landscape ---
  { src: "DJI_20260807221056_0292_D.jpg", slug: "tea-plantation-road-through-estate",
    alt: "Aerial view of a road curving through a tea plantation on a Kenyan hillside." },
  { src: "DJI_20260807221218_0301_D.jpg", slug: "tea-plantation-contour-rows-hillside",
    alt: "Contour rows of tea following the shape of a hillside, seen from above." },
  { src: "DJI_20260807221042_0290_D.jpg", slug: "tea-estate-contour-rows-aerial",
    alt: "Regular planted rows of tea across a broad slope, seen from the air." },
  { src: "DJI_20260807215622_0275_D.jpg", slug: "tea-estate-rolling-hills-aerial",
    alt: "Rolling hills under continuous tea cultivation in the Kenyan highlands." },
  { src: "DJI_20260807213735_0225_D.jpg", slug: "tea-estate-forest-boundary-mist",
    alt: "Tea fields meeting a belt of forest, with morning mist along the treeline." },
  { src: "DJI_20260807214506_0244_D.jpg", slug: "tea-fields-hedgerow-boundaries-aerial",
    alt: "Tea fields divided by mature hedgerows, seen from the air." },
  { src: "DJI_20260807213702_0221_D.jpg", slug: "tea-estate-hillside-kenyan-highlands",
    alt: "A rounded hill planted with tea, framed by scattered trees." },
  { src: "DJI_20260723154635_0456_D.jpg", slug: "tea-smallholder-fields-aerial-kenya",
    alt: "A patchwork of smallholder tea plots seen from above." },

  // --- wide landscape and field ---
  { src: "DJI_20260807221105_0294_D.jpg", slug: "tea-estate-highway-aerial",
    alt: "A tarmac road running between planted tea fields." },
  { src: "DJI_20260807215628_0276_D.jpg", slug: "tea-estate-road-ridge-aerial",
    alt: "A ridge of tea cultivation with a track along its spine." },
  { src: "DJI_20260807221222_0302_D.jpg", slug: "tea-estate-terraced-rows-aerial",
    alt: "Terraced rows of tea receding towards a distant treeline." },
  { src: "DJI_20260723154639_0457_D.jpg", slug: "tea-fields-patchwork-aerial-kenya",
    alt: "Cultivated fields in a patchwork of greens and worked earth." },
  { src: "DSC_6017.jpg", slug: "tea-field-highland-landscape",
    alt: "A tea field in the foreground with highland country beyond." },

  // --- leaf ---
  { src: "DSC_6001.jpg", slug: "tea-leaves-two-leaves-and-a-bud",
    alt: "Close view of a tea shoot showing two leaves and an unopened bud." },
  { src: "DSC_6002.jpg", slug: "fresh-green-tea-shoots-close-up",
    alt: "Fresh green tea shoots at the top of the plucking table." },
  { src: "DSC_6003.jpg", slug: "tea-bud-new-growth-macro",
    alt: "A single new tea bud in sharp focus against blurred foliage." },
  { src: "DSC_6018.jpg", slug: "tea-leaves-plantation-backdrop",
    alt: "Tea leaves in the foreground with planted slopes out of focus behind." },
  { src: "DSC_6008.jpg", slug: "tea-shoots-ready-for-plucking",
    alt: "Tea shoots standing proud of the bush, ready for plucking." },
  { src: "DSC_5999.jpg", slug: "mature-tea-bush-foliage",
    alt: "Dense mature foliage on a tea bush." },
  { src: "DSC_6026.jpg", slug: "tea-canopy-plucking-table",
    alt: "The even canopy of a tea plucking table seen from directly above." },

  // --- processed leaf ---
  // Both shot indoors, admitted because the frame is filled edge to edge with
  // leaf: no premises, people, packaging or marking is visible in either.
  { src: "DSC_5970.jpg", slug: "withered-tea-leaf-processing-bed",
    alt: "A bed of withering tea leaf spread evenly across a processing trough." },
  { src: "DSC_6034.jpg", slug: "dried-green-tea-leaf-grading",
    alt: "Dried, curled green tea leaf on a plain white dish." },
];

const kb = (p) => (statSync(p).size / 1024).toFixed(0);

// Encode, stepping quality down until the file is under the shipped cap. The
// build gate would otherwise fail on the densest aerials, and hand-tuning a
// quality number per photograph is not a thing anyone will maintain.
async function encode(pipeline, out, fmt, start) {
  for (let q = start; q >= 30; q -= 6) {
    await pipeline.clone()[fmt]({ quality: q }).toFile(out);
    if (statSync(out).size <= MAX_BYTES) return q;
  }
  throw new Error(`${out} cannot be brought under ${MAX_BYTES} bytes`);
}

for (const { src, slug, alt } of PLATES) {
  if (!alt?.trim()) throw new Error(`${slug}: alt text is required`);
  for (const w of WIDTHS) {
    const base = `${OUT}/${slug}-${w}`;
    if (existsSync(`${base}.webp`) && existsSync(`${base}.avif`)) {
      console.log(`${slug}-${w}`.padEnd(46) + "exists, skipping");
      continue;
    }
    // .rotate() with no argument applies the EXIF orientation tag, then drops
    // it. Without this, portrait-flagged sources come out sideways.
    const img = sharp(`${SRC}/${src}`)
      .rotate()
      .resize(w, Math.round((w * 3) / 4), { fit: "cover" });
    const qw = await encode(img, `${base}.webp`, "webp", 74);
    const qa = await encode(img, `${base}.avif`, "avif", 52);
    console.log(
      `${slug}-${w}`.padEnd(46) +
        `webp ${kb(`${base}.webp`).padStart(4)}KB q${qw}  ` +
        `avif ${kb(`${base}.avif`).padStart(4)}KB q${qa}`,
    );
  }
}

console.log(`\n${PLATES.length} plates, ${WIDTHS.length} widths, 2 formats.`);
console.log("Client photography of Kenyan tea estates. Not a record of this summit.");
```

- [ ] **Step 2: Write the EXIF assertion**

Create `scripts/assert-no-exif.js`:

```js
#!/usr/bin/env node
// Fails the build if any shipped image carries EXIF metadata.
//
// The source photographs are drone captures. Their EXIF contains GPS
// coordinates of a private estate. Sharp drops metadata unless withMetadata()
// is called, so this should never fire — which is exactly why it is worth
// having: the failure mode is silent publication of someone's location.

import { readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const walk = (dir) => {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((e) => {
    if (e.startsWith(".")) return [];
    const p = join(dir, e);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
};

const images = walk("public/img").filter((f) => /\.(avif|webp|jpe?g|png)$/i.test(f));
const dirty = [];

for (const f of images) {
  const meta = await sharp(f).metadata();
  if (meta.exif) dirty.push(f);
}

console.log(`exif   ${images.length} image(s) checked`);
if (dirty.length) {
  console.error("\nRESULT: FAIL — EXIF metadata present");
  for (const f of dirty) console.error(`  ${f}`);
  process.exit(1);
}
console.log("RESULT: PASS — no EXIF metadata in any shipped image");
```

- [ ] **Step 3: Add the aggregate image budget**

In `scripts/assert-budgets.js`, find the `public/img` block:

```js
// public/img is optional — a missing directory is not a failure, unlike css/js.
if (existsSync("public/img")) {
  for (const { path, size } of walkFiles("public/img")) {
```

Replace the whole `if` block with:

```js
// public/img is optional — a missing directory is not a failure, unlike css/js.
// The aggregate cap is a growth gate, not a performance gate: every plate image
// is below the fold and lazy-loaded, so directory size does not affect LCP. It
// exists so a later run cannot quietly add sixty photographs.
const IMG_DIR_MAX = 6 * 1024 * 1024;
if (existsSync("public/img")) {
  let imgTotal = 0;
  for (const { path, size } of walkFiles("public/img")) {
    imgTotal += size;
    // Match IMG_FILE_CAPS by basename (e.g., "hero-poster.avif" in any subdirectory)
    const basename = path.split("/").pop();
    const cap = IMG_FILE_CAPS[basename] ?? IMG_MAX;
    console.log(`img    ${path} ${size} / ${cap} bytes`);
    if (size > cap) failures.push(`${path} over img budget: ${size} > ${cap}`);
  }
  const pct = ((imgTotal / IMG_DIR_MAX) * 100).toFixed(0);
  console.log(`img    TOTAL ${imgTotal} / ${IMG_DIR_MAX} bytes (${pct}%)`);
  if (imgTotal > IMG_DIR_MAX) {
    failures.push(`public/img over aggregate budget: ${imgTotal} > ${IMG_DIR_MAX}`);
  }
}
```

- [ ] **Step 4: Wire the scripts into package.json**

In `package.json`, in the `scripts` block, replace the `assets` line and extend
`build`:

```json
    "validate": "node scripts/validate-content.js && node scripts/check-contrast.js",
    "test": "node --test scripts/*.test.js",
    "build": "npm run clean && npm run validate && eleventy && node scripts/minify-css.js && node scripts/assert-budgets.js && node scripts/assert-no-exif.js && node scripts/export-copy.js",
    "assets": "node scripts/make-guilloche.js && node scripts/make-plates.js",
    "plates": "node scripts/make-plates.js",
```

- [ ] **Step 5: Delete the AI plates and their generator**

```bash
git rm scripts/make-grid-images.js
git rm src/assets/img/plates/acacia-dusk.avif src/assets/img/plates/acacia-dusk.webp \
       src/assets/img/plates/chest-stack.avif src/assets/img/plates/chest-stack.webp \
       src/assets/img/plates/highland.avif src/assets/img/plates/highland.webp \
       src/assets/img/plates/leaf-close.avif src/assets/img/plates/leaf-close.webp \
       src/assets/img/plates/liquor.avif src/assets/img/plates/liquor.webp \
       src/assets/img/plates/rows-morning.avif src/assets/img/plates/rows-morning.webp \
       src/assets/img/plates/sacks.avif src/assets/img/plates/sacks.webp \
       src/assets/img/plates/sorting.avif src/assets/img/plates/sorting.webp \
       src/assets/img/plates/withering.avif src/assets/img/plates/withering.webp
```

The site will not build until Task D repoints the templates. That is expected
and is why B, C and D are one commit each in sequence rather than one commit.

- [ ] **Step 6: Generate the plates**

```bash
node scripts/make-plates.js
```

Expected: 88 files written (22 slugs × 2 widths × 2 formats), every reported
size under 200 KB, no `cannot be brought under` error.

- [ ] **Step 7: Verify the output**

```bash
ls src/assets/img/plates | wc -l          # expect 88
node -e '
const s=require("./node_modules/sharp/dist/index.cjs"), fs=require("fs");
const d="src/assets/img/plates";
(async()=>{let bad=0,total=0;
for(const f of fs.readdirSync(d)){
  const p=d+"/"+f, sz=fs.statSync(p).size; total+=sz;
  const m=await s(p).metadata();
  if(m.exif){console.log("EXIF  "+f);bad++}
  if(sz>204800){console.log("SIZE  "+f+" "+sz);bad++}
  if(m.width!==600&&m.width!==1200){console.log("DIM   "+f+" "+m.width);bad++}
}
console.log((bad?"FAIL ":"ok   ")+bad+" problem(s), total "+(total/1048576).toFixed(2)+"MB");
})();'
```

Expected: `ok   0 problem(s)`, total comfortably under 6 MB.

Then look at the images. Open the two contact-sheet directories side by side and
confirm no frame contains a person, a building, a vehicle, packaging, or legible
text, and that no leaf macro has been cropped through its subject:

```bash
open src/assets/img/plates
```

- [ ] **Step 8: Commit**

```bash
git add scripts/make-plates.js scripts/assert-no-exif.js scripts/assert-budgets.js \
        package.json src/assets/img/plates
git commit -m "feat: real client photography replaces the AI-generated plates

22 photographs from the client's folder, at two widths in AVIF and WebP,
quality stepped down per file until each is under the 200KB shipped cap.

Excludes every frame containing people, premises, vehicles, packaging or
branding — FACTS.md §2. That rules out the delegation and Kangaita
material, which is the most persuasive imagery in the folder and the
most dangerous: it reads as a record of a previous edition.

Adds assert-no-exif.js to the build. The sources are drone captures
carrying GPS coordinates of a private estate."
```

---

### Task C: Grid variants and responsive sources

**Files:**
- Modify: `src/_includes/components/image-grid.njk`
- Modify: `src/assets/css/style.css:712-750`

**Interfaces:**
- Consumes: the slugs produced by Task B.
- Produces: `grid(images, caption, plate)` where each `images` entry is
  `{ src: "/img/plates/<slug>", alt: "…" }` — **no width, height or extension**.
  The macro appends `-600` / `-1200` and the format suffix, and hard-codes
  `width="1200" height="900"`. Task D calls it with 1, 2, 4 or 6 images.

- [ ] **Step 1: Rewrite the macro**

Replace the whole of `src/_includes/components/image-grid.njk`:

```njk
{# Plate figure: 1-6 photographs in a grid, gaps transparent so the section
   ground shows through. The gap is the design, not padding.

   Images are {src, alt} only. `src` is the slug path with no width and no
   extension — the macro appends both, because the two-width source set is a
   property of the pipeline (scripts/make-plates.js), not of the page.

   Usage:
     {% from "components/image-grid.njk" import grid %}
     {{ grid([{src:"/img/plates/tea-canopy-plucking-table", alt:"..."}],
             "Caption text", "I") }}
#}
{% macro grid(images, caption, plate) %}
{%- set n = images | length -%}
{#- Column count at >=52rem. Below that the CSS is 1 or 2 columns and the
    100vw fallback in `sizes` covers it. -#}
{%- set cols = 1 if n == 1 else (2 if n in [2, 4] else 3) -%}
{%- set sizes = "(min-width: 52rem) " + (100 // cols) + "vw, 100vw" -%}
<figure class="plate plate--{{ n }}">
  <div class="plate__grid">
    {% for im in images %}
    <picture class="plate__cell">
      <source type="image/avif" sizes="{{ sizes }}"
              srcset="{{ im.src }}-600.avif 600w, {{ im.src }}-1200.avif 1200w">
      <source type="image/webp" sizes="{{ sizes }}"
              srcset="{{ im.src }}-600.webp 600w, {{ im.src }}-1200.webp 1200w">
      <img src="{{ im.src }}-1200.webp" alt="{{ im.alt }}"
           width="1200" height="900" loading="lazy" decoding="async">
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

- [ ] **Step 2: Add the two-row variant and retire the four-across row**

In `src/assets/css/style.css`, find:

```css
.plate--2 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--3 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--3 .plate__cell:first-child { grid-column: span 2; }
.plate--4 .plate__grid { grid-template-columns: repeat(2, 1fr); }
```

Replace with:

```css
/* A single-image plate is the rail's format — one cell, full width of its
   container. Without this it inherits the 2-column default and renders half
   width against empty space. */
.plate--1 .plate__grid { grid-template-columns: 1fr; }
.plate--2 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--3 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--3 .plate__cell:first-child { grid-column: span 2; }
/* --4 and --6 stay 2-up on narrow screens; --6 goes to 3 columns at 52rem,
   --4 deliberately does not. A four-across row in a 74rem wrap gives ~280px
   cells, which wastes the photograph. Two rows of two is the point. */
.plate--4 .plate__grid { grid-template-columns: repeat(2, 1fr); }
.plate--6 .plate__grid { grid-template-columns: repeat(2, 1fr); }
```

Then find the `@media (min-width: 52rem)` block and delete the `--4` line,
adding a `--6` line:

```css
@media (min-width: 52rem) {
  .plate--3 .plate__grid { grid-template-columns: repeat(3, 1fr); }
  .plate--3 .plate__cell:first-child { grid-column: auto; }
  .plate--3 .plate__cell:first-child img { aspect-ratio: 4 / 3; }
  .plate--6 .plate__grid { grid-template-columns: repeat(3, 1fr); }
}
```

- [ ] **Step 3: Verify the CSS budget still passes**

The CSS aggregate budget is 30720 bytes and is measured after minification.

```bash
node scripts/minify-css.js && node -e '
const fs=require("fs");
const t=fs.readdirSync("public/css").reduce((a,f)=>a+fs.statSync("public/css/"+f).size,0);
console.log(t+" / 30720 bytes ("+((t/30720)*100).toFixed(0)+"%)");'
```

This will fail if `public/` has been cleaned. Run `npm run build` first if so;
it is expected to fail at the template stage until Task D lands, but the CSS is
written before that.

- [ ] **Step 4: Commit**

```bash
git add src/_includes/components/image-grid.njk src/assets/css/style.css
git commit -m "feat: two-row plate grid, single-image plate, responsive sources

Adds .plate--6 (3x2 above 52rem, 2x3 below) and .plate--1 for the rail.
Removes the four-across desktop rule from .plate--4: at the 74rem wrap it
gave ~280px cells. Two rows of two is what the request asked for and what
the photographs deserve.

The macro now emits a 600w/1200w srcset with a sizes attribute derived
from the column count, so a 3-up cell no longer downloads a 1200px file."
```

---

### Task D: Plate placement

**Files:**
- Modify: `src/index.njk:83-87`, `src/index.njk:151-157`, `src/index.njk:210-214`
- Modify: `src/pages/about.njk`, `src/pages/exhibition.njk`,
  `src/pages/travel.njk`, `src/pages/programme.njk`

**Interfaces:**
- Consumes: `grid()` from Task C, slugs from Task B.
- Produces: no interface. Task E's rail plates are separate calls.

**Reuse rule:** 22 images fill 28 grid cells. No image appears twice on the same
page; the homepage's 14 cells are 14 distinct images.

- [ ] **Step 1: Homepage Plate I**

Replace `src/index.njk:83-87` (the `rows-morning` / `leaf-close` / `highland`
call) with:

```njk
      {{ grid([
        {src:"/img/plates/tea-plantation-road-through-estate",   alt:"Aerial view of a road curving through a tea plantation on a Kenyan hillside."},
        {src:"/img/plates/tea-plantation-contour-rows-hillside", alt:"Contour rows of tea following the shape of a hillside, seen from above."},
        {src:"/img/plates/tea-estate-contour-rows-aerial",       alt:"Regular planted rows of tea across a broad slope, seen from the air."},
        {src:"/img/plates/tea-estate-rolling-hills-aerial",      alt:"Rolling hills under continuous tea cultivation in the Kenyan highlands."},
        {src:"/img/plates/tea-estate-forest-boundary-mist",      alt:"Tea fields meeting a belt of forest, with morning mist along the treeline."},
        {src:"/img/plates/tea-fields-hedgerow-boundaries-aerial", alt:"Tea fields divided by mature hedgerows, seen from the air."}
      ], "Kenya's growing highlands", "I") }}
```

- [ ] **Step 2: Homepage Plate II, with a new caption**

Replace `src/index.njk:151-157`. The existing caption reads "Processing and the
expo floor" over AI images of sorting tables, hessian sacks and shipping chests.
None of those subjects exists in the client's folder, so the caption is rewritten
to describe what actually ships:

```njk
      {{ grid([
        {src:"/img/plates/withered-tea-leaf-processing-bed", alt:"A bed of withering tea leaf spread evenly across a processing trough."},
        {src:"/img/plates/dried-green-tea-leaf-grading",     alt:"Dried, curled green tea leaf on a plain white dish."},
        {src:"/img/plates/tea-leaves-two-leaves-and-a-bud",  alt:"Close view of a tea shoot showing two leaves and an unopened bud."},
        {src:"/img/plates/fresh-green-tea-shoots-close-up",  alt:"Fresh green tea shoots at the top of the plucking table."},
        {src:"/img/plates/tea-bud-new-growth-macro",         alt:"A single new tea bud in sharp focus against blurred foliage."},
        {src:"/img/plates/tea-leaves-plantation-backdrop",   alt:"Tea leaves in the foreground with planted slopes out of focus behind."}
      ], "From leaf to grade", "II") }}
```

- [ ] **Step 3: Homepage Plate III**

Replace `src/index.njk:210-214`:

```njk
      {{ grid([
        {src:"/img/plates/tea-estate-hillside-kenyan-highlands", alt:"A rounded hill planted with tea, framed by scattered trees."},
        {src:"/img/plates/tea-smallholder-fields-aerial-kenya",  alt:"A patchwork of smallholder tea plots seen from above."}
      ], "Coming to Nairobi", "III") }}
```

- [ ] **Step 4: About — four aerials**

In `src/pages/about.njk`, add at the top of the body, before the first `<h2>`:

```njk
{% from "components/image-grid.njk" import grid %}
{{ grid([
  {src:"/img/plates/tea-estate-highway-aerial",       alt:"A tarmac road running between planted tea fields."},
  {src:"/img/plates/tea-estate-road-ridge-aerial",    alt:"A ridge of tea cultivation with a track along its spine."},
  {src:"/img/plates/tea-estate-terraced-rows-aerial", alt:"Terraced rows of tea receding towards a distant treeline."},
  {src:"/img/plates/tea-fields-patchwork-aerial-kenya", alt:"Cultivated fields in a patchwork of greens and worked earth."}
], "The country the summit is convened in", "IV") }}
```

- [ ] **Step 5: Exhibition — four leaf**

In `src/pages/exhibition.njk`, add before the first `<h2>`:

```njk
{% from "components/image-grid.njk" import grid %}
{{ grid([
  {src:"/img/plates/tea-shoots-ready-for-plucking",   alt:"Tea shoots standing proud of the bush, ready for plucking."},
  {src:"/img/plates/mature-tea-bush-foliage",         alt:"Dense mature foliage on a tea bush."},
  {src:"/img/plates/tea-canopy-plucking-table",       alt:"The even canopy of a tea plucking table seen from directly above."},
  {src:"/img/plates/tea-leaves-two-leaves-and-a-bud", alt:"Close view of a tea shoot showing two leaves and an unopened bud."}
], "What the expo is about", "V") }}
```

- [ ] **Step 6: Travel — four landscape**

In `src/pages/travel.njk`, add before the first `<h2>`:

```njk
{% from "components/image-grid.njk" import grid %}
{{ grid([
  {src:"/img/plates/tea-field-highland-landscape",         alt:"A tea field in the foreground with highland country beyond."},
  {src:"/img/plates/tea-estate-rolling-hills-aerial",      alt:"Rolling hills under continuous tea cultivation in the Kenyan highlands."},
  {src:"/img/plates/tea-estate-forest-boundary-mist",      alt:"Tea fields meeting a belt of forest, with morning mist along the treeline."},
  {src:"/img/plates/tea-estate-hillside-kenyan-highlands", alt:"A rounded hill planted with tea, framed by scattered trees."}
], "Beyond the conference days", "VI") }}
```

- [ ] **Step 7: Programme — two leaf**

In `src/pages/programme.njk`, add before the first `<h2>`:

```njk
{% from "components/image-grid.njk" import grid %}
{{ grid([
  {src:"/img/plates/fresh-green-tea-shoots-close-up", alt:"Fresh green tea shoots at the top of the plucking table."},
  {src:"/img/plates/tea-bud-new-growth-macro",        alt:"A single new tea bud in sharp focus against blurred foliage."}
], "Three days, one subject", "VII") }}
```

- [ ] **Step 8: Build and verify**

```bash
npm run build 2>&1 | grep -E "RESULT|img    TOTAL|exif|rror"
node -e '
const fs=require("fs");
const pages=["index","about","exhibition","travel","programme"];
let cells=0, missingAlt=0, oldSlug=0, noSrcset=0;
for(const p of pages){
  const f = p==="index" ? "public/index.html" : `public/${p}/index.html`;
  const h = fs.readFileSync(f,"utf8");
  cells += (h.match(/class="plate__cell"/g)||[]).length;
  missingAlt += (h.match(/<img[^>]*alt=""/g)||[]).length;
  oldSlug += (h.match(/rows-morning|leaf-close|highland\.|withering|sorting|sacks|chest-stack|liquor|acacia-dusk/g)||[]).length;
  const imgs=(h.match(/<picture class="plate__cell">/g)||[]).length;
  const srcsets=(h.match(/srcset="[^"]*-600\.avif 600w/g)||[]).length;
  if(imgs!==srcsets) noSrcset++;
}
const T=(k,v)=>console.log((v?"ok  ":"FAIL")+"  "+k);
T("28 plate cells across the five pages", cells===28);
T("no empty alt", missingAlt===0);
T("no retired AI slug", oldSlug===0);
T("every cell has an avif srcset", noSrcset===0);
'
```

Expected: `RESULT: PASS` from both budget gates, `RESULT: PASS` from the EXIF
gate, and all four assertions `ok`.

- [ ] **Step 9: Look at it**

```bash
npm run dev
```

Open `http://localhost:8080/` and check at 1280 px that Plate I and Plate II
render as three columns over two rows, and at 375 px that they render as two
columns over three rows. Confirm the same for `/about/`, `/exhibition/` and
`/travel/` at two columns over two rows.

- [ ] **Step 10: Commit**

```bash
git add src/index.njk src/pages/about.njk src/pages/exhibition.njk \
        src/pages/travel.njk src/pages/programme.njk
git commit -m "feat: place the client photography, two rows where it earns it

Homepage Plates I and II become 3x2. Plate II's caption changes from
'Processing and the expo floor' to 'From leaf to grade' — the old caption
described AI images of sorting tables, sacks and shipping chests, none of
which the client's folder contains.

About, Exhibition and Travel gain 2x2 plates; Programme gains a pair.
These four pages carried no photography at all."
```

---

### Task E: The right rail

**Files:**
- Modify: `src/_includes/layouts/page.njk`
- Modify: `src/assets/css/style.css`
- Modify: 10 pages to move `.spec` into the rail: `about`, `b2b-matchmaking`,
  `contact`, `exhibition`, `media`, `privacy`, `programme`, `registration`,
  `travel`, `venue`
- Modify: 7 pages to add a rail card: `code-of-conduct`, `downloads`, `faq`,
  `news`, `speakers`, `sponsorship`, `terms`

**Interfaces:**
- Consumes: `grid()` from Task C.
- Produces: `<aside class="rail">` as the opt-in element. A page that does not
  contain one renders exactly as before.

**The finding this fixes:** `--wrap` is 74rem, `--measure` is 68ch, and `p`,
`li` and `.spec` are all capped at `--measure`. Measured on `/about/` at 1440 px,
text ends at 61% of the frame. That is every inner page, not one of them.

- [ ] **Step 1: Wrap the page body**

In `src/_includes/layouts/page.njk`, replace lines 15-24:

```njk
<section class="section">
  <div class="wrap">
    {% if translationStatus == "machine" %}
    <div class="mt-notice" role="note" lang="zh-Hans">
      <p><strong>本页面为机器翻译，尚未经过人工审核。</strong>如有疑问，请以<a href="{{ basePath }}" lang="en" hreflang="en" data-nolocale>英文原版</a>为准。</p>
    </div>
    {% endif %}
    {{ content | safe }}
  </div>
</section>
```

with:

```njk
<section class="section">
  <div class="wrap">
    {% if translationStatus == "machine" %}
    <div class="mt-notice" role="note" lang="zh-Hans">
      <p><strong>本页面为机器翻译，尚未经过人工审核。</strong>如有疑问，请以<a href="{{ basePath }}" lang="en" hreflang="en" data-nolocale>英文原版</a>为准。</p>
    </div>
    {% endif %}
    {#- Two-column grid when the page supplies an <aside class="rail">, plain
        block when it does not. See .doc-body in style.css. The machine
        translation notice stays outside so it always spans full width. -#}
    <div class="doc-body">
      {{ content | safe }}
    </div>
  </div>
</section>
```

- [ ] **Step 2: Add the rail CSS**

In `src/assets/css/style.css`, immediately before the `/* ==== downloads ====`
comment, add:

```css
/* ==== the rail ========================================================== */

/* The prose measure is 68ch inside a 74rem wrap, so roughly 40% of every inner
   page was empty. The rail spends it on the page's own facts. A page opts in by
   putting <aside class="rail"> anywhere in its body — grid places it, so source
   order does not matter and the markup stays where it reads best. */
.doc-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 20rem;
  gap: var(--sp-xl);
  align-items: start;
}
.doc-body > *     { grid-column: 1; }
.doc-body > .rail { grid-column: 2; grid-row: 1 / span 99; position: sticky; top: var(--sp-l); }

/* No rail, no second track. */
.doc-body:not(:has(.rail)) { display: block; }

.rail > :first-child { margin-top: 0; }
.rail .spec { margin-top: 0; max-width: none; }
.rail__card {
  border: 1px solid var(--c-rule);
  border-radius: var(--radius-s);
  padding: var(--sp-s);
  margin-top: var(--sp-m);
}
.rail__card p { font-size: var(--step--1); color: var(--c-text-muted); max-width: none; }
.rail__card > :first-child { margin-top: 0; }

@media (max-width: 63.999rem) {
  .doc-body { display: block; }
  .doc-body > .rail { position: static; }
}
```

`:has()` carries only the single-column fallback. A browser without it renders
the two-column grid with an empty second track on rail-less pages — cosmetic
degradation on an out-of-support browser generation, not a correctness failure.
The mobile collapse is a plain media query and works everywhere.

- [ ] **Step 3: Move the spec blocks into the rail**

On each of `about`, `b2b-matchmaking`, `contact`, `exhibition`, `media`,
`privacy`, `programme`, `registration`, `travel`, `venue`: wrap the existing
`<dl class="spec">…</dl>` in an `<aside>`. The dl's markup does not change.

Using `src/pages/venue.njk` as the worked example, replace lines 12-37:

```njk
<dl class="spec">
  <div class="field">
    <dt class="label">City</dt>
```

so the block opens and closes like this:

```njk
<aside class="rail">
  <dl class="spec">
    <div class="field">
      <dt class="label">City</dt>
      <dd class="value">{{ summit.location.city }}, {{ summit.location.country }}</dd>
    </div>
    ...every existing field, unchanged...
  </dl>
</aside>
```

Do the same on the other nine. Change nothing inside the `dl` — V2's copy tasks
have already rewritten those values, and re-editing them here would undo that
work.

On `exhibition` and `programme`, the `<aside class="rail">` goes **after** the
plate added in Task D, so the plate keeps the full content width.

- [ ] **Step 4: Add rail cards to the seven pages without a spec**

On each of `code-of-conduct`, `downloads`, `faq`, `news`, `speakers`,
`sponsorship`, `terms`, add an `<aside class="rail">` at the top of the body
containing a single-image plate and a CTA card. The slug differs per page:

| Page | Plate slug | Alt |
|---|---|---|
| `sponsorship` | `tea-plantation-contour-rows-hillside` | Contour rows of tea following the shape of a hillside, seen from above. |
| `speakers` | `tea-leaves-plantation-backdrop` | Tea leaves in the foreground with planted slopes out of focus behind. |
| `news` | `tea-field-highland-landscape` | A tea field in the foreground with highland country beyond. |
| `downloads` | `dried-green-tea-leaf-grading` | Dried, curled green tea leaf on a plain white dish. |
| `faq` | `tea-canopy-plucking-table` | The even canopy of a tea plucking table seen from directly above. |
| `terms` | `tea-fields-hedgerow-boundaries-aerial` | Tea fields divided by mature hedgerows, seen from the air. |
| `code-of-conduct` | `tea-fields-patchwork-aerial-kenya` | Cultivated fields in a patchwork of greens and worked earth. |

The markup, shown for `/faq/`:

```njk
{% from "components/image-grid.njk" import grid %}
<aside class="rail">
  {{ grid([
    {src:"/img/plates/tea-canopy-plucking-table", alt:"The even canopy of a tea plucking table seen from directly above."}
  ]) }}
  <div class="rail__card">
    <p class="label">Still have a question</p>
    <p>Anything this page does not answer, the summit team will. Replies come from a person, not an autoresponder.</p>
    <p><a class="btn btn--ghost" href="/contact/">Contact the summit team</a></p>
  </div>
</aside>
```

The `grid()` call passes no caption and no plate number — a rail image is
illustrative, not a numbered plate. Vary the card copy per page so it names that
page's next step: `/downloads/` points at `/media/`, `/speakers/` and
`/sponsorship/` point at `/contact/`, `/news/` points at `/registration/`, and
the two legal pages point at `/contact/`. Follow the editorial rules added in
Task A — name an outcome, no idiom.

- [ ] **Step 5: Build and verify**

```bash
npm run build 2>&1 | grep -E "RESULT|rror"
node -e '
const fs=require("fs");
const withRail=["about","b2b-matchmaking","contact","exhibition","media","privacy",
  "programme","registration","travel","venue","code-of-conduct","downloads","faq",
  "news","speakers","sponsorship","terms"];
let missing=[], specOutside=[];
for(const p of withRail){
  const h=fs.readFileSync(`public/${p}/index.html`,"utf8");
  if(!/<aside class="rail">/.test(h)) missing.push(p);
  const rail=(h.match(/<aside class="rail">[\s\S]*?<\/aside>/)||[""])[0];
  const specs=(h.match(/<dl class="spec"/g)||[]).length;
  if(specs && !/<dl class="spec"/.test(rail)) specOutside.push(p);
}
const T=(k,v,d)=>console.log((v?"ok  ":"FAIL")+"  "+k+(v?"":"  "+JSON.stringify(d)));
T("all 17 inner pages have a rail", missing.length===0, missing);
T("every spec block sits inside its rail", specOutside.length===0, specOutside);
T("doc-body wrapper present", /class="doc-body"/.test(fs.readFileSync("public/faq/index.html","utf8")), []);
'
```

Expected: three `ok` lines.

- [ ] **Step 6: Check contrast and overflow**

```bash
node scripts/check-contrast.js
```

Expected: PASS. The rail sits on the paper ground and introduces no new
text/ground pair; the photographic plates carry no overlaid text. If this fails,
a plate has been placed inside a `.section--ink` without its caption colour
being checked — fix the placement, not the threshold.

Then check overflow at four widths with the dev server running:

```bash
npm run dev
```

For each of 360, 768, 1280 and 1440, load `/venue/` and `/faq/` and confirm
`document.documentElement.scrollWidth === document.documentElement.clientWidth`.
Confirm the rail is a second column at 1280 and 1440, and a block below the
prose at 360 and 768.

- [ ] **Step 7: Commit**

```bash
git add src/_includes/layouts/page.njk src/assets/css/style.css src/pages
git commit -m "feat: right rail reclaims the dead 40% on every inner page

--wrap is 74rem and --measure is 68ch, so all 17 inner pages rendered a
~640px text column inside a ~1180px container. Measured on /about/ at
1440px, text ended at 61% of the frame.

Ten pages move their existing spec block into the rail, which also lifts
the key facts above the fold. Seven pages without a spec get a plate and
a card naming their next step. Opt-in is one <aside class=rail>; grid
places it, so source order stays wherever it reads best."
```

---

### Task F: Annotated client review export

**Files:**
- Modify: `scripts/export-copy.js`
- Create: `website_content/COPY-FOR-CLIENT-REVIEW.md` (generated, committed)

**Interfaces:**
- Consumes: the built English pages in `public/`.
- Produces: `website_content/COPY-FOR-CLIENT-REVIEW.md`. V2 Task 12 Step 4
  regenerates it as part of the final build.

- [ ] **Step 1: Read what export-copy.js already does**

```bash
sed -n '1,60p' scripts/export-copy.js
```

It already walks the built English pages and emits
`website_content/COPY-FOR-REVIEW.md`. This task adds a second output that
reuses the same extraction; do not write a parallel extractor.

- [ ] **Step 2: Add the annotation map and the second output**

Append to `scripts/export-copy.js`, after the existing write of
`COPY-FOR-REVIEW.md`:

```js
// --- annotated export for client sign-off -----------------------------------
// Same extraction, plus what changed and why. The client commissioned two
// audits; this is where they see the answer to each finding next to the copy
// that answers it. Generated, never hand-written — a hand-written version goes
// stale the first time a sentence is edited.
const AUDIT_NOTES = {
  "/": [
    "Hero rewritten for opportunity rather than administration (audit §4.4, §9 P3).",
    "Document masthead, serial and seal removed (client audit; ADR-015).",
    "'Premier' and 'landmark' removed — neither is independently defensible (§4.6).",
  ],
  "/about/": [
    "Positioning narrowed from a continental claim to the Kenya-China relationship (§4.5).",
    "Bilateral framing: Kenya brings origin and production expertise, China brings market, investment and technology (§4.10).",
  ],
  "/programme/": ["Day-level themes only. No session times are implied (FACTS §2)."],
  "/exhibition/": [
    "Expo duration is no longer asserted. Both this page and Programme state one 'to be announced' field (client audit).",
  ],
  "/b2b-matchmaking/": [
    "'AI-powered business matching' removed — it describes a platform that has not been selected (client audit).",
  ],
  "/sponsorship/": [
    "Scarcity and discount framing removed; the page now leads on strategic relevance, audience access and category leadership (§4.9).",
    "'Unallocated' tier badges removed — they date instantly and require active management (§11).",
    "The 'founding partner' framing is held back: FACTS.md does not confirm that 2027 is the first edition (BLOCKERS B-006).",
  ],
  "/registration/": ["'You go on the list' removed. No discounted rate is implied for any category (client audit)."],
  "/speakers/": [
    "Product-led proposals redirected to exhibition and partnership in positive language rather than dismissed (§4.8).",
  ],
  "/venue/": ["'Why this page is mostly empty' removed. One status message, not several (§11, §12.3)."],
  "/travel/": ["'Safe to book flights against' removed — the organiser cannot indemnify a date change (client audit)."],
  "/faq/": ["Pricing warnings restated as positive policy: rates are issued by the Secretariat (§4.8)."],
  "/news/": ["'No bulletins yet' removed (§11). Figures carry a named source and a date (FACTS §3)."],
  "/privacy/": [
    "Two contradictions fixed: the technical data actually processed, and the processors (Brevo, Cloudflare) it is shared with (client audit).",
  ],
  "/media/": [], "/downloads/": [], "/contact/": [],
  "/terms/": ["Editorial draft. Kenyan counsel review is outstanding (BLOCKERS B-005)."],
  "/code-of-conduct/": ["Editorial draft. Kenyan counsel review is outstanding (BLOCKERS B-005)."],
};

const GLOBAL_NOTES = [
  "The security-print document vocabulary is gone: 'Schedule A', 'Form B', 'No. KCTS/2027/S', 'Particulars', 'Issued by', the dashed unstamped fields and the MMXXVII seal. The visual world is unchanged (ADR-015).",
  "'To be entered' is replaced everywhere by 'To be announced', and the build now fails if it returns.",
  "Six idioms that translate poorly were replaced with literal commercial language (§4.7).",
  "Navigation promotes B2B Meetings into the primary bar (§13). No route URL changed.",
  "Photography is client-supplied imagery of Kenyan tea estates. It is not a record of this summit and no caption implies one.",
];

const annotated = [
  "# Copy for client review — Kenya-China Tea Summit 2027",
  "",
  "Generated from the built site. This is what is live, not a draft of it.",
  "",
  "## Changes that apply to every page",
  "",
  ...GLOBAL_NOTES.map((n) => `- ${n}`),
  "",
  ...pages.flatMap((p) => [
    "---",
    "",
    `## ${p.title}`,
    "",
    `\`${p.url}\``,
    "",
    ...(AUDIT_NOTES[p.url]?.length
      ? ["**What changed here**", "", ...AUDIT_NOTES[p.url].map((n) => `- ${n}`), ""]
      : []),
    p.body,
    "",
  ]),
].join("\n");

writeFileSync("website_content/COPY-FOR-CLIENT-REVIEW.md", annotated);
console.log(`COPY-FOR-CLIENT-REVIEW.md  ${pages.length} pages`);
```

If the existing script's page objects are not named `pages` or do not expose
`{ url, title, body }`, adapt these three property reads to whatever it already
produces. Do not restructure the existing extraction to match this snippet.

- [ ] **Step 3: Generate and read it**

```bash
npm run build 2>&1 | tail -5
wc -l website_content/COPY-FOR-CLIENT-REVIEW.md
```

Expected: the file exists and covers all 18 English pages. Read the first 80
lines and confirm the annotations sit above the copy they describe, not below.

- [ ] **Step 4: Verify every page is covered**

```bash
node -e '
const fs=require("fs");
const md=fs.readFileSync("website_content/COPY-FOR-CLIENT-REVIEW.md","utf8");
const urls=["/","/about/","/programme/","/exhibition/","/b2b-matchmaking/","/sponsorship/",
"/registration/","/speakers/","/venue/","/travel/","/faq/","/news/","/contact/","/media/",
"/downloads/","/privacy/","/terms/","/code-of-conduct/"];
const missing=urls.filter(u=>!md.includes("`"+u+"`"));
console.log((missing.length?"FAIL  missing ":"ok    all 18 pages present ")+missing.join(" "));
'
```

Expected: `ok    all 18 pages present`.

- [ ] **Step 5: Commit**

```bash
git add scripts/export-copy.js website_content/COPY-FOR-CLIENT-REVIEW.md
git commit -m "feat: annotated copy export for client sign-off

Reuses the existing extraction and adds the audit finding each page's
change answers. Generated from the built site so it cannot drift from
what shipped."
```

---

## After this plan

Run **V2 Task 12** last: `npm run translate -- --force`, verify the noindex gate
and 18/18 zh coverage, run the acceptance sweep, regenerate both copy exports,
deploy, and update `HANDOFF.md` and `.web-factory/STATE.json`.

The V2 Task 12 acceptance sweep must be extended with the checks this plan adds:

```bash
node -e '
const fs=require("fs"), path="public";
const pages=fs.readdirSync(path,{withFileTypes:true})
  .filter(d=>d.isDirectory()&&d.name!=="zh"&&!["css","js","img","video","files","fonts"].includes(d.name))
  .map(d=>`${path}/${d.name}/index.html`).concat(`${path}/index.html`);
const all=pages.map(f=>fs.readFileSync(f,"utf8")).join("");
const banned=[/Schedule [A-G]\b/,/\bForm [A-C]\b/,/No\. KCTS\//,/Issued by/,/to be entered/i,
/\bpremier\b/i,/\blandmark\b/i,/First Edition/i,/\[Confirm/,/\[Insert/,/\bTBD\b/,
/\bClass [12]\b/,/\bunallocated\b/i,/no bulletins yet/i,/why this page is mostly empty/i,
/zero-tariff door/i,/the floor and the close/i,/in the building/i,/left to chance/i,
/mirror image/i,/quote you a rate/i];
const hits=banned.filter(re=>re.test(all)).map(re=>re.source);
console.log((hits.length?"FAIL  ":"ok    ")+(hits.join(" | ")||"no banned string in any English page"));
console.log((/B2B Meetings/.test(all)?"ok    ":"FAIL  ")+"B2B Meetings in the primary nav");
console.log(((all.match(/<img[^>]*alt=""/g)||[]).length===0?"ok    ":"FAIL  ")+"no empty alt");
'
```

Expected: three `ok` lines.

## Self-Review

**Spec coverage.** Spec §1 photography → Task B (pipeline, selection, EXIF, budget)
and Task A Step 3 (the FACTS line). §2 grid → Task C (variants) and Task D
(placement, reuse rule, Plate II caption). §3 rail → Task E. §4 language → Task A
(all five amendments plus B-006). §5 client review document → Task F. Spec
verification items 1–12 → Task B Step 7, Task D Step 8, Task E Steps 5–6, Task F
Step 4, and the extended sweep above.

**Known gap, stated rather than hidden.** The spec's verification item 6 says
measured contrast is unchanged. Task E Step 6 checks it but the rail introduces
`.rail__card` with `--c-text-muted` on `--c-paper`, which is an existing measured
pair, and `.btn--ghost` inside the card, which is also existing. No new pair is
created. If a later change puts a rail on a `.section--ink` page, that assumption
breaks and `check-contrast.js` must gain a zone for it.

**Ordering risk.** Task B Step 5 deletes the nine AI plates while the templates
still reference them, so the build is broken between Task B and Task D. This is
deliberate — the alternative is one enormous commit — but it means B, C and D
must be executed in sequence without stopping in between. If work must pause,
pause after D, not inside it.

**Type consistency.** `grid(images, caption, plate)` takes `{src, alt}` in Tasks
C, D and E; the `w`/`h` keys the old macro required are gone from every call site
and the macro now hard-codes `width="1200" height="900"`. Slugs used in Tasks D
and E all appear in Task B's `PLATES` manifest — checked name by name.
