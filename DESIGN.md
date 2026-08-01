# DESIGN — Kenya-China Tea Summit 2027

Written from the built world, not from intention. Direction seed `14313fed`,
persuade, grounded candidate 4 of 7. The contract this describes is embedded as
an HTML comment at the top of `<body>` in `src/_includes/layouts/base.njk` and
survives into the built output.

## The world

**Security print — the bill of lading.** This summit's mechanism is trade
documentation: the paperwork that moves tea from Kericho to Fujian. The site is
that document. Registration issues you a numbered entry; it does not sell you a
ticket.

The world was chosen because it solves the product's hardest problem. A
first-edition summit with no prices, no speakers and no venue has every external
signal of vapourware, and `FACTS.md` forbids papering over that with stock
photography or invented statistics. In security-print grammar those gaps become
**unstamped fields on a document awaiting countersignature** — procedure rather
than absence.

Refused, explicitly: the conference template (photo hero, countdown, speaker
grid, sponsor wall), its cream-editorial opposite, and the literal reading of the
client's own logo imagery (green gradients, tea-leaf motifs, a two-cultures
split-screen).

## Colour

**Committed strategy.** Intaglio green owns whole regions as ground, never as an
accent scattered over white. All values live in `src/assets/css/tokens.css`,
which is the only file permitted a hex literal.

| Token | Value | Role |
|---|---|---|
| `--c-ink` | `#0f2e16` | deepest intaglio, body text |
| `--c-ink-2` | `#14401e` | ground for drenched bands, header, footer |
| `--c-engrave` | `#2e7d32` | guilloche line work |
| `--c-seal` | `#a5111a` | oxblood — seals, stamps, endorsements, links |
| `--c-paper` | `#f3f6ef` | lightest safety tint, reading surfaces |
| `--c-tint` | `#dfe7d9` | safety tint, document panels |
| `--c-ply-canary` | `#e0b13a` | duplicate copy — masthead, footer headings |
| `--c-ply-salmon` | `#cf8b83` | triplicate copy |

The light surfaces are a **green-grey safety tint**, the stock share
certificates are actually printed on. Deliberately not cream, ivory or
parchment: that is the warm-paper default this world does not need.

Oxblood is reserved for marks of authority. It never becomes a generic accent
red — that discipline is what keeps a seal reading as a seal.

`scripts/check-contrast.js` measures all 12 text/ground pairs the design uses and
fails the build below the WCAG floor. Current: all pass, lowest 4.31 (salmon on
intaglio, large-only, floor 3.0).

## Type

Self-hosted, latin subset, zero requests to any font CDN. 104 KB across five
files; the two that render the first viewport are preloaded.

- **Libre Caslon Display** (`--font-engrave`) — headings. Caslon is the face cut for engraved and official documents.
- **Archivo Narrow** (`--font-label`) — body, nav, buttons, and the tracked uppercase field labels of a printed form. 400/600/700.
- **Courier Prime** (`--font-data`) — filled-in values only. Monospace here is data and measurement, not a technical costume.

Display ceiling `4.44rem`, body measure `68ch`, tracking `0.16em` on field labels
and `0.28em` on stamped ones.

## Components

The page's primary structural unit is the **field pair** (`.field` → `.label` +
`.value`), not the card. There is no icon-plus-heading-plus-text grid anywhere.

| Component | What it is |
|---|---|
| `.sheet` | a document lifted off the desk: keyline, inner rule, offset+blur shadow |
| `.field` / `.label` / `.value` | a form's labelled box and its typed entry |
| `.value--pending` | dashed unstamped box — the honest state for venue, price, speakers |
| `.particulars` | the filled-in top half of a bill of lading |
| `.issue` | the issuing panel; light stock on the intaglio ground, carries the primary action |
| `.clauses` / `.clause` | numbered terms, replacing the card grid. Numbers carry real order |
| `.manifest` | the three-day schedule as a lot list |
| `.classes` | six registration categories as six document classes |
| `.endorsements` | sponsor tiers as countersignature blocks, currently "Unallocated" |
| `.seal` | struck circular stamp |
| `.rule` | engine-turned divider, masked from the generated band |

## Generated assets

`scripts/make-guilloche.js` produces the rosette and band as SVG paths from
hypotrochoid maths — the same curves a rose engine cut for banknotes. Exact,
ours, no licence. **R must be an exact multiple of r**: the first pass used
`R=210, r=47`, which are coprime, so the curve looped 47 times and stacked into a
furry disc instead of legible engine-turning. `R=220, r=44` closes in one
revolution.

`scripts/make-vignettes.js` produces three steel-engraving vignettes via
OpenRouter — tea branch, Mount Kenya, shipping chest. The prompts are constrained
to botanical and topographic line engraving with no people, no buildings, no
lettering, because `FACTS.md §2` forbids depicting the client's premises or
implying a previous edition. Delivered as AVIF + WebP, all under 200 KB.
Vignettes are `mix-blend-mode: multiply` on light stock and `invert(1)` +
`screen` on the intaglio ground, so the engraving prints in light ink on dark
rather than disappearing into it.

## Motion

One authored moment: the seal strikes the document (`@keyframes strike` —
scale, rotate and blur resolving), driven by `animation-timeline: view()` with a
static fallback and a full `prefers-reduced-motion` opt-out. No scattered hover
effects, no per-section entrance.

## Budgets

CSS 24.5 KB of 30 KB. JS 836 B of 15 KB. No runtime framework, no bundler.

## Known open

- `.section--ink .vignette` uses `filter: invert(1)`; if a vignette is ever regenerated with genuine mid-tones rather than pure line work, that inversion will read as a negative and needs a light-ink source instead.
- CSS and JS filenames carry no content hash. `_headers` therefore serves them `no-cache` (revalidate, usually a 304) rather than a long max-age — a returning visitor was served a stale stylesheet against fresh HTML during this build. Move to `immutable` once filenames are fingerprinted.
- Only the homepage exists in this world. The remaining 12 launch pages inherit these components; they do not re-derive the world.
