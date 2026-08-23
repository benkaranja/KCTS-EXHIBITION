# Bringing the Antigravity exhibition layout into this repo

Two parts. **Part A** is for Ben. **Part B** is a self-contained prompt to paste
into the Antigravity workspace.

---

# Part A — how to treat the other workspace

## Do not merge the histories

The obvious move is to add this repo as a second remote in the Antigravity
workspace and push. Do not. That workspace has its own initial commit, so the
two histories are unrelated, and joining them needs `--allow-unrelated-histories`
and drags in every scaffold file the tool generated: its own `index.html`, its
Vite config, its `package.json`, possibly a lockfile for dependencies this repo
does not have. You would spend longer untangling that than porting the source.

**Port the source, not the repository.**

## The sequence

**1. Publish our branches first.** Nothing on GitHub currently has the portal
work. Antigravity has nothing to clone.

```bash
git push origin main
git push -u origin feat/portal
git branch feat/exhibition-layout feat/portal
git push -u origin feat/exhibition-layout
```

**2. Give Antigravity a fresh clone, in a new directory.** Not the existing
workspace, and not inside this one.

```bash
git clone https://github.com/benkaranja/kenya-china-tea-summit.git ~/Desktop/WORK/KCTS-EXHIBITION
cd ~/Desktop/WORK/KCTS-EXHIBITION && git checkout feat/exhibition-layout
```

**3. Point Antigravity at the new clone and paste Part B.** It re-homes its own
source into our structure and commits there.

**4. Keep the original workspace, read-only, until the port is verified.** It is
the only copy of that work until the first push lands. Once
`feat/exhibition-layout` renders correctly on staging, archive it. Do not delete
it before then.

## After the port

- Antigravity owns `feat/exhibition-layout` and pushes to it directly.
- We never commit to that branch. We forward-integrate into it weekly
  (`git checkout feat/exhibition-layout && git merge feat/portal`) so it does
  not drift from the design system.
- Antigravity opens a PR into `feat/portal` at each milestone.
- Conflicts are prevented by directory ownership, not resolved. The file list in
  Part B is the whole agreement.

## Before you paste Part B

It ends by asking five questions. **Read the answers before letting it write
code.** Question 1 in particular decides whether the port is an afternoon or a
rewrite: if the layout styles itself through a runtime style injector, it will
render completely unstyled under our Content-Security-Policy.

---

# Part B — paste this into Antigravity

---

You are taking over an exhibition floor-plan layout you already built (2D and
3D) and re-homing it into an existing production website's repository. The
repository is already cloned in this workspace and checked out on the branch
`feat/exhibition-layout`. Read this whole brief before writing anything.

## What the host project is

Kenya-China Tea Summit 2027, Nairobi, 21-23 April 2027. A live client site at
`kenyachinateasummit.com`.

- **Eleventy 3 + Nunjucks**, static generation at build time.
- **Plain HTML, CSS and vanilla ES modules. No framework at runtime.** No React,
  no Vue, no Svelte, no hydration. This is an architectural decision (ADR-003),
  not an oversight.
- **No bundler currently exists.** `src/assets/js/` is copied to `public/js/`
  verbatim by Eleventy passthrough.
- Cloudflare Pages, with Pages Functions for the API and D1 for storage.
- Every page is built twice, English at the root and Chinese under `/zh/`.

## The hard constraints

These are enforced by response headers and by build gates that fail the build.
Working around them is not available.

**1. Content-Security-Policy: `style-src 'self'`, with no `unsafe-inline`.**

- No `<style>` elements.
- No `style="..."` attributes in HTML or in template output.
- No CSS-in-JS, styled-components, Emotion, or any library that injects a style
  tag at runtime. It will silently render unstyled.
- **The CSSOM is allowed.** `element.style.fill = "..."` and
  `element.style.setProperty(...)` from JavaScript work fine. The restriction is
  on inline style *content in the document*, not on scripted style. The existing
  site already uses this for the country-flag sprite.

**2. Content-Security-Policy: `script-src 'self'`.**

- No CDN imports. No `unpkg`, no `jsdelivr`, no `esm.sh`.
- **No `<script type="importmap">`.** An import map is inline script and is
  blocked.
- three.js must be **pre-bundled into a single self-hosted ESM file** and
  committed. Add `esbuild` as a devDependency and a `scripts/build-exhibition.js`
  step that emits `src/assets/js/exhibition/three-view.js`.

**3. `X-Frame-Options: DENY` and `frame-ancestors 'none'`.**

The layout cannot be delivered in an iframe, not even from the same origin.
It has to be a real page in this site.

**4. Asset budgets, enforced by `scripts/assert-budgets.js`.**

- `public/js` is capped at **15,360 bytes total** and is at ~11,500. Your code
  cannot go there.
- Put the exhibition bundle in `public/js/exhibition/`. A separate budget entry
  will be added for it at 720 KB.
- **The 3D view must be dynamically imported on user action**, never at page
  load: `await import("/js/exhibition/three-view.js")` behind a "3D view"
  button. The 2D plan must work with three.js never downloaded.

**5. `public/css` is capped at 34,816 bytes and is at 32,642.**

Do not add to `style.css`. Write `src/assets/css/exhibition.css`, loaded only on
the floor-plan route, with its own budget entry.

**6. Contrast is a build gate.** `scripts/check-contrast.js` verifies declared
colour pairs against WCAG. Text needs 4.5:1, graphical objects 3.0:1. Every
booth status colour you introduce becomes a declared pair.

## Directory ownership

Write **only** these paths. Everything else in the repository belongs to another
agent and editing it will cause merge conflicts.

```
src/pages/exhibition-plan.njk        the route
src/assets/js/exhibition/            all layout JS, including the three.js bundle
src/assets/css/exhibition.css        route-scoped styles
src/_data/booths.json                the booth manifest
scripts/build-exhibition.js          the bundle step
```

One exception: you may add your bundle script and `esbuild` to `package.json`.
Change nothing else in that file.

## Visual consistency: use the tokens, never literals

The host site is a "security print" world: intaglio green, safety-tint stock,
carbon-copy plies, oxblood for seals. The floor plan has to look like it was
drawn by the same engraver as the rest of the site.

The mechanism is `src/assets/css/tokens.css`. It is the only file in the project
permitted a hex literal. Your route loads exactly two stylesheets:

```html
<link rel="stylesheet" href="/css/tokens.css">
<link rel="stylesheet" href="/css/exhibition.css">
```

and `exhibition.css` must contain **no literal colour, no literal size, no
literal spacing**. Every value is `var(--…)`. This is checkable and will be
checked:

```bash
grep -nE '#[0-9a-fA-F]{3,8}|rgba?\(|[0-9.]+(px|rem)' src/assets/css/exhibition.css
```

A clean run is the acceptance criterion. Exception: geometry computed from the
booth manifest is set through the CSSOM or as SVG attributes, not in CSS.

### Colour on SVG booths comes from CSS, never from setAttribute

The current code does `rect.setAttribute("fill", "#2E8B57")`. That is a literal
colour in JavaScript, which is exactly what the token rule exists to prevent,
and it cannot follow a token change.

Set a data attribute instead and let the stylesheet colour it:

```js
rect.dataset.status = "available";        // in the module
```

```css
.booth[data-status="available"] { fill: var(--c-tint); }
.booth[data-status="held"]      { fill: var(--c-ply-canary); }
.booth[data-status="booked"]    { fill: var(--c-ink-2); }
.booth[data-status="blocked"]   { fill: var(--c-tint-deep); }
```

This works because `fill` as a **presentation attribute** has lower priority
than any CSS rule, so the stylesheet always wins. Geometry (`x`, `y`, `width`,
`height`) stays as attributes, because it is data. Colour is design and belongs
in the stylesheet.


### The tokens

Colour:

```
--c-ink        #0f2e16   deepest intaglio, body text
--c-ink-2      #14401e   brand deep green, ground for drenched bands
--c-engrave    #2e7d32   mid green, line work
--c-seal       #a5111a   oxblood. Seals, stamps, endorsements ONLY
--c-paper      #f3f6ef   lightest safety tint, reading surfaces
--c-tint       #dfe7d9   safety tint, document panels
--c-tint-deep  #c3d1bc   heavier tint, rules and inset fields
--c-ply-canary #e0b13a   carbon-copy ply, accent
--c-ply-orange #ec9740   engraved marks ON the green ground only
--c-rule       #a8bba1   hairlines
--c-focus      #d42027   focus ring
--c-text-on-ink       paper, for text on a green ground
--c-text-on-ink-muted secondary text on a green ground
```

Two colour rules that are not negotiable:

- **Oxblood never sits on the green ground.** It measures about 1.6:1 there. Use
  `--c-ply-orange` for marks on green; it clears 5.09:1.
- **Oxblood is reserved for authority marks.** It is not a generic accent red.

Type: `--font-display` (Bricolage Grotesque), `--font-ui` (Google Sans Flex),
`--font-data` (Google Sans Code, for booth numbers and any figure). Sizes are
`--step--2` through `--step-6`. Line heights `--lh-tight`, `--lh-heading`,
`--lh-body`. **Add no fonts**; `font-src` is `'self'` and these three are
already loaded.

Spacing: `--sp-3xs` `--sp-2xs` `--sp-xs` `--sp-s` `--sp-m` `--sp-l` `--sp-xl`
`--sp-2xl` `--sp-3xl`. Radii `--radius-s` (2px) and `--radius-m` (3px) only;
this world has hard corners. Layout: `--wrap`, `--wrap-narrow`, `--gutter`,
`--header-h`. Motion: `--dur-fast` `--dur` `--dur-slow` and `--ease-out`, all of
which collapse to 1ms under `prefers-reduced-motion`.

## Booth status

| Status | Fill token | Meaning |
|---|---|---|
| Available | `--c-tint` | Blank stock. Selectable |
| Held | `--c-ply-canary` | Provisional, awaiting Secretariat confirmation |
| Booked | `--c-ink-2` | Committed. Not selectable |
| Blocked | `--c-tint-deep` plus a hatch fill | Not sellable at all |

**Colour alone is not sufficient** (WCAG 1.4.1). Every booth carries its number
as real text, its status in the accessible name, and held and booked carry a
fill pattern as well as a hue. The plan must remain readable in greyscale.

## 2D must be SVG, not canvas

If your current 2D view is canvas, it needs converting, and the reason is worth
stating because it is the whole accessibility argument.

In SVG each booth is a real DOM node. It is focusable, it takes an
`aria-label`, it is keyboard-reachable, and a screen reader can enumerate the
plan. On canvas every one of those has to be rebuilt by hand for 146 booths, and
the result is worse. SVG also means no rendering library at all for the 2D view,
which is what keeps it inside the budget.

3D stays three.js, orthographic camera for isometric and top, perspective for
the walk-through, **read-only**. It extrudes from the same manifest as the 2D
plan so the two views cannot disagree.

## The manifest is the contract

Both views read `src/_data/booths.json`. So does the backend, which another
agent is building in parallel. Agree the shape now and neither side blocks the
other.

```json
{
  "unit": "m",
  "provisional": true,
  "halls": [
    {
      "id": "A",
      "name": "Hall A",
      "width": 80,
      "depth": 30,
      "booths": [
        { "id": "A-001", "x": 2.0, "y": 1.0, "w": 3.0, "h": 3.0,
          "type": "single", "zone": "perimeter-north", "status": "available" }
      ]
    }
  ]
}
```

- **Two halls, not one.** `summit.js` carries `halls: 2`. An earlier draft of
  this brief showed a single `"hall": "A"` string, which could not represent the
  actual venue. The array above is the correct shape.
- Coordinates in **metres**, origin at each hall's north-west corner, x east,
  y south. Not pixels.
- `status` in the committed file is always `"available"`. Live status comes from
  the API at runtime and overlays the manifest. **Never commit a real booking
  state.**
- **No commercial fields.** No `rate`, no price, no size class that implies a
  price. Stand pricing is not confirmed by the client (FACTS.md §2) and invented
  rates on a client site are a commercial risk, not a placeholder.

### Do NOT re-derive the geometry yet

Reshape the envelope and carry the existing coordinates across as they are.
Convert the units if that is arithmetic, but **do not measure booth positions
off the client drawing.**

Stand inventory and pricing are the number one outstanding client item, and
`summit.js` marks the layout `layoutProvisional: true`. The real inventory
replaces whatever is in the manifest when it arrives, so hand-measuring a
provisional PNG is work that gets deleted. Set `"provisional": true`, keep the
booth count you already have, and move on.

Reference only, not a task: `exhibition_layout/actual_layout/30 BY 80 EXHIBITION
TENT LAYOUT V1.png`.

The plan is **generated from the manifest**, never hand-drawn. A layout change
must be a data edit. That is a requirement the client set directly.

## Selection behaviour

Rendering only, in this branch. Do not build booking.

Expose a small API the portal calls, and emit events rather than calling an
endpoint yourself:

```js
export function renderPlan(root, manifest, options) { /* … */ }
export function setStatus(boothId, status) { /* … */ }
// dispatch on root: "booth:select" with { detail: { id } }
```

Booking, holds and authentication are being built on `feat/portal` against a
D1-backed conditional-update lock. Your side never talks to the database.

## Internationalisation

Every page in this site is built twice. Your route must go through the normal
Eleventy layout and permalink machinery so it gets a Chinese edition. Copy any
existing page in `src/pages/` for the front-matter shape. **Do not hand-write a
standalone HTML file**; it will ship English-only and that will be found late.

All user-facing strings come from the template or a data file, never from a
literal inside a JS module, or they cannot be translated.

## Definition of done for this branch

```bash
npm install
npm run build     # must pass: content validation, contrast, budgets, EXIF
npm test          # must pass
```

plus:

- `grep -nE '#[0-9a-fA-F]{3,8}|rgba?\(|[0-9.]+(px|rem)' src/assets/css/exhibition.css` is empty
- The 2D plan renders and is fully keyboard operable with three.js never fetched
- The 3D view loads only after the user asks for it
- No file outside the five owned paths is modified, `package.json` excepted
- The page renders in both English and Chinese

## Answer these before you write code

Reply with the answers. Do not start porting until they have been read.

1. **How does the current layout get its styles?** Name the exact mechanism:
   plain CSS files, CSS modules, Tailwind, styled-components, inline `style`
   attributes, or scripted CSSOM. This decides whether the port is
   straightforward or a restyle, because anything that injects a style tag at
   runtime is blocked outright.
2. **Is the 2D view SVG, canvas, or WebGL?**
3. **What does your dependency tree look like beyond three.js?** List every
   runtime dependency. Anything that assumes a framework or a bundler at runtime
   has to go.
4. **How is the booth data currently stored,** and how far is it from the
   manifest shape above?
5. **What is the minified size of your three.js bundle,** and which three.js
   modules does it actually import?
