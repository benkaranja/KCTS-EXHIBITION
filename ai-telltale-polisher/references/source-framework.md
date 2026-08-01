# AI-Assisted Website, Code, UI/UX & Graphic Design Detection Framework

## 0. Purpose

Use this framework to estimate whether a website, backend codebase, UI/UX flow, or graphic design output was likely:

* **Human-made**
* **AI-assisted but human-refined**
* **Mostly AI-generated**
* **Indeterminate**

This framework does **not** “prove” AI authorship. AI detectors for text and source code are unreliable in real-world settings, and code-specific AI detectors have shown poor generalizability across languages, tasks, and models. Treat the result as an evidence-based probability, not a legal or disciplinary verdict.

---

# 1. Scoring Model

Start at **0 AI evidence points**.

Each pass adds or subtracts points. Easy passes come first. Deeper passes require access to code, design files, commit history, analytics, or creator process.

## Final AI-Assistance Likelihood

|  Score | Interpretation                                  |
| -----: | ----------------------------------------------- |
|   0–20 | Mostly human-made or heavily human-refined      |
|  21–40 | Some AI assistance possible, weak evidence      |
|  41–60 | Indeterminate / mixed / cannot confidently tell |
|  61–80 | Likely AI-assisted or AI-generated              |
| 81–100 | Strong evidence of heavy AI generation          |

## Confidence Modifier

After scoring, assign confidence:

| Confidence | Meaning                                                                                              |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| Low        | Only screenshots, public website, or final image available                                           |
| Medium     | Live site plus frontend code/design files available                                                  |
| High       | Full repo, backend, design system, commit history, prompts, metadata, and process evidence available |

A score of **61+ with Low confidence** should be reported as:
**“Likely AI-assisted, but not conclusive.”**

A score of **41–60 at any confidence level** should be reported as:
**“Cannot confidently tell.”**

---

# 2. Pass 1 — Fast First-Glance Website / UI Scan

**Goal:** Catch obvious AI-default aesthetics within 2–5 minutes.

AI-generated UI often looks “finished” at a glance but generic underneath: predictable SaaS layouts, beige/gray backgrounds, rounded cards, soft shadows, generic sans-serif typography, gradient accents, emoji/icon chips, fake dashboards, and polished landing pages that feel disconnected from real product depth. UX Planet describes this as predictable design skeletons; Business Insider and The New Yorker describe a similar “regression to the mean” or AI house-style effect.

## Add Points

| Signal                                                                                                                      | Points |
| --------------------------------------------------------------------------------------------------------------------------- | -----: |
| Generic SaaS hero: navbar, badge/eyebrow, huge headline, CTA buttons, three feature cards, testimonial strip, pricing cards |     +5 |
| Overuse of rounded cards, soft shadows, glassmorphism, glow, purple/blue gradients, neon borders                            |     +5 |
| Looks polished but emotionally empty; no strong brand point of view                                                         |     +5 |
| Fake-looking dashboard mockups, fake metrics, fake trust badges, fake customer logos                                        |     +4 |
| Same icon style everywhere, especially line icons that feel decorative rather than meaningful                               |     +3 |
| Overuse of emojis in chips, cards, or section headings                                                                      |     +3 |
| Typography feels default: Inter-like sans, generic serif accent, weak hierarchy                                             |     +3 |
| Spacing feels mathematically even but not optically refined                                                                 |     +3 |
| Everything looks like a template but no single template is identifiable                                                     |     +3 |

## Subtract Points

| Human-refinement signal                                                                      | Points |
| -------------------------------------------------------------------------------------------- | -----: |
| Clear custom art direction, distinctive visual language, non-default brand system            |     -5 |
| Strong hierarchy, meaningful asymmetry, intentional rhythm, real editorial/design taste      |     -4 |
| Visual decisions clearly map to audience, product category, or brand strategy                |     -4 |
| Uses familiar patterns but with custom details, copy, imagery, motion, and interaction logic |     -3 |

## Pass 1 Interpretation

* **0–8:** No obvious AI visual smell.
* **9–20:** Possible AI or template-based design.
* **21+:** Strong AI-default / vibe-coded visual smell.

Community comments on Reddit repeatedly mention small fonts, strokes, overuse of icons/emojis, rounded corners, large shadows, neon gradients, weak hierarchy, poor spacing systems, and “AI SaaS default” aesthetics as common tells.

---

# 3. Pass 2 — Graphic Design / Image / Visual Asset Scan

**Goal:** Detect AI-generated graphic assets, posters, social posts, website illustrations, hero images, mockups, and brand visuals.

Lovart’s detection guide highlights text-rendering artifacts, excessive symmetry, inconsistent lighting, uniform detail density, and metadata/reverse-image checks. AP and other image-forensics guidance similarly emphasize strange sheen, lighting/shadow mismatches, background artifacts, and implausible physical details.

## Add Points

| Signal                                                                                  | Points |
| --------------------------------------------------------------------------------------- | -----: |
| Gibberish small text, fake labels, pseudo-letters, broken fine print                    |     +8 |
| Typography looks plausible from far away but fails when zoomed in                       |     +7 |
| Inconsistent lighting, shadows, reflections, or impossible perspective                  |     +6 |
| Over-smooth skin, plastic sheen, over-polished surfaces                                 |     +5 |
| Repeated textures, cloned background details, warped patterns                           |     +5 |
| Hands, limbs, glasses, jewelry, teeth, hair, or object edges are malformed              |     +5 |
| Uniform detail density: everything equally detailed, no natural focal hierarchy         |     +4 |
| Composition is too symmetrical or too “perfect” without human visual tension            |     +4 |
| Brand assets contain mismatched logo details, wrong letterforms, or fake packaging text |     +6 |
| Image has no plausible source, shoot context, EXIF, layered file, or asset trail        |     +5 |

## Subtract Points

| Human-refinement signal                                                                                               | Points |
| --------------------------------------------------------------------------------------------------------------------- | -----: |
| Layered source file shows manual construction, named layers, linked assets, revisions                                 |     -6 |
| Real photography metadata, shoot references, contact sheets, or RAW/JPEG progression available                        |     -6 |
| Typography is editable, accurate, kerned, and brand-compliant                                                         |     -5 |
| Visual imperfections are consistent with real medium: print texture, lens distortion, hand retouching, scan artifacts |     -4 |
| Reverse image/source search confirms original human-made asset or licensed stock                                      |     -4 |

## Pass 2 Interpretation

* **One strong text-rendering failure** is enough to flag an asset for deeper review.
* Absence of artifacts does **not** prove human creation. Modern AI tools can hide many early tells.
* If provenance is missing, do not assume AI; mark as “unverified.”

---

# 4. Pass 3 — UX Flow, Product Logic & Edge-State Audit

**Goal:** Determine whether the interface only solves the “happy path.”

AI-generated interfaces often optimize for a polished first screen and skip the difficult UX work: onboarding, empty states, loading states, errors, permissions, irreversible actions, offline states, and recovery flows. Business Insider quotes researchers and practitioners describing AI-coded products as “pretty but dysfunctional” and weak on edge cases. NN/g’s usability heuristics are a useful neutral baseline for evaluating whether the UX has real human-centered thinking.

## Test These Screens

Ask the evaluator to inspect:

* First-time user onboarding
* Empty dashboard
* No search results
* Loading state
* Network failure
* Payment failure
* Form validation
* Wrong password / account recovery
* Permission denied
* Mobile breakpoint
* Long names, long text, missing image
* Delete/cancel/undo flow
* Accessibility state: keyboard, screen reader, contrast, focus order

## Add Points

| Signal                                                                                | Points |
| ------------------------------------------------------------------------------------- | -----: |
| Only the happy path exists                                                            |     +8 |
| Generic error copy: “Something went wrong. Please try again.” everywhere              |     +5 |
| Buttons, cards, hover states, or icons suggest interaction but do nothing             |     +5 |
| Loading/empty/error states missing or visually inconsistent                           |     +6 |
| Forms lack validation, helper text, recovery, or accessible error messaging           |     +5 |
| Flow ignores real user anxiety, trust, permissions, privacy, or risk moments          |     +5 |
| Product claims do not match available functionality                                   |     +5 |
| No evidence of user research, task prioritization, or domain-specific workflows       |     +4 |
| Mobile view breaks hierarchy or simply stacks desktop cards                           |     +4 |
| Accessibility basics missing: focus states, labels, alt text, contrast, keyboard flow |     +6 |

## Subtract Points

| Human-refinement signal                                                               | Points |
| ------------------------------------------------------------------------------------- | -----: |
| Edge states are designed with specific, helpful, brand-appropriate copy               |     -6 |
| User flows show domain knowledge and real-world constraints                           |     -6 |
| UX decisions are traceable to user needs, analytics, testing, or product requirements |     -5 |
| Accessibility states are complete and tested                                          |     -5 |
| System feedback is timely, specific, and consistent                                   |     -4 |

## Pass 3 Interpretation

* **High visual polish + weak UX depth** is one of the strongest AI-assisted product signals.
* Human juniors and template sites can also fail here, so score this as **AI-assistance evidence**, not proof.

---

# 5. Pass 4 — Frontend Code & Design-System Inspection

**Goal:** Look for AI-generated frontend patterns behind the visual surface.

AI-generated frontend code often uses common stacks and statistically safe defaults: Tailwind, shadcn/ui, Radix, Lucide icons, generic component names, repeated cards, repeated layout sections, generic tokens, and inconsistent design-system usage. These tools are not suspicious by themselves; the signal is unedited defaultness plus inconsistent integration. Reddit discussions and design commentary repeatedly identify Tailwind/shadcn-style sameness, default fonts/icons/layouts, gradient text, and repeated component patterns as AI/vibe-coded tells.

## Add Points

| Signal                                                                                        | Points |
| --------------------------------------------------------------------------------------------- | -----: |
| Repeated component structures with only text/icon swapped                                     |     +5 |
| Every section built from generic cards, badges, icons, and CTAs                               |     +5 |
| Tailwind class soup with inconsistent spacing values and no token discipline                  |     +5 |
| shadcn/Radix/Lucide defaults used without brand adaptation                                    |     +4 |
| Components named generically: `FeatureCard`, `HeroSection`, `StatsSection`, `ModernDashboard` |     +3 |
| CSS/design tokens are duplicated instead of centralized                                       |     +4 |
| Accessibility props appear mechanically added but not functionally correct                    |     +4 |
| Responsive behavior is superficial: stack everything, no content prioritization               |     +4 |
| Animations are decorative and unrelated to user feedback                                      |     +3 |
| Code comments are unusually explanatory for obvious code                                      |     +3 |
| No real design-system mapping: no Figma tokens, no component variants, no usage rules         |     +5 |

## Subtract Points

| Human-refinement signal                                   | Points |
| --------------------------------------------------------- | -----: |
| Components map cleanly to a documented design system      |     -6 |
| Tokens are consistent across Figma/code/theme files       |     -5 |
| Component variants cover realistic states and constraints |     -5 |
| Naming reflects product domain, not generic UI sections   |     -4 |
| Accessibility implementation is tested, not decorative    |     -5 |
| Responsive design shows deliberate content strategy       |     -4 |

## Pass 4 Interpretation

* A modern stack is not AI evidence.
* A modern stack used with **unmodified defaults, repeated cards, shallow semantics, and inconsistent state coverage** is AI-assistance evidence.

---

# 6. Pass 5 — Backend Code, Data Model & Security Audit

**Goal:** Detect AI-generated backend weaknesses.

Research and practitioner checklists repeatedly identify predictable AI-code failure modes: hallucinated APIs/imports, missing edge cases, wrong business logic, stale patterns, over-engineered abstractions, weak tests, placeholder logic, unfiltered input, secret exposure, and security gaps.

## Add Points

| Signal                                                                                 | Points |
| -------------------------------------------------------------------------------------- | -----: |
| Hallucinated package, function, method, API, route, or config option                   |     +8 |
| Code compiles but business logic is subtly wrong                                       |     +8 |
| Tests mirror the implementation instead of challenging it                              |     +6 |
| Tests assert tautologies or only check that something exists                           |     +5 |
| Missing unhappy paths: null, empty, timeout, partial failure, race conditions          |     +6 |
| Auth/authz logic is shallow, duplicated, or inconsistent                               |     +7 |
| Secrets, tokens, API keys, or credentials exposed in repo or frontend                  |     +8 |
| Placeholder logic in production path                                                   |     +7 |
| Input not validated or sanitized                                                       |     +6 |
| Error handling leaks implementation details                                            |     +5 |
| Over-engineered abstraction for simple task                                            |     +4 |
| Random unused dependencies or duplicated libraries                                     |     +4 |
| Inconsistent database schema, migrations, naming, or relationship handling             |     +5 |
| Backend has “demo app” assumptions: one user, no roles, no audit trail, no rate limits |     +6 |
| Comments sound like tutorial explanations rather than project-specific reasoning       |     +3 |

## Subtract Points

| Human-refinement signal                                                                           | Points |
| ------------------------------------------------------------------------------------------------- | -----: |
| Business logic matches product spec and edge cases                                                |     -8 |
| Tests fail meaningfully when logic is broken                                                      |     -7 |
| Threat model, validation, authorization, rate limits, logging, and secrets management are present |     -8 |
| Code follows existing project conventions                                                         |     -5 |
| Dependencies are minimal, current, and justified                                                  |     -4 |
| Migration/history shows incremental human reasoning                                               |     -5 |

## Pass 5 Interpretation

* Backend evidence is stronger than surface UI evidence.
* If the code is clean but wrong in domain logic, treat that as a major AI-assistance clue.
* If the developer cannot explain the code paths, raise confidence in AI assistance.

---

# 7. Pass 6 — Design-System Drift & Cross-Page Consistency

**Goal:** Detect whether AI generated page-by-page without understanding the whole product.

A major concern in UX communities is that vibe coding “fills gaps” confidently, ignores existing systems, creates inconsistent patterns, and quietly wrecks design systems before review.

## Add Points

| Signal                                                                                 | Points |
| -------------------------------------------------------------------------------------- | -----: |
| Same component behaves differently across pages                                        |     +5 |
| Multiple button styles with no hierarchy rule                                          |     +4 |
| Different card radius, spacing, shadows, icon sizes, or typography scales across pages |     +5 |
| New patterns introduced where existing components should have been reused              |     +5 |
| Similar flows use different copy, validation, or layout logic                          |     +5 |
| Design system exists but output ignores or partially imitates it                       |     +6 |
| Figma and code diverge with no documented reason                                       |     +5 |

## Subtract Points

| Human-refinement signal                                      | Points |
| ------------------------------------------------------------ | -----: |
| Clear component governance and reuse                         |     -5 |
| Variants, tokens, and patterns are consistent across screens |     -5 |
| Exceptions are documented and justified                      |     -4 |
| Design QA or product review notes exist                      |     -4 |

---

# 8. Pass 7 — Copywriting, Microcopy & Content Authenticity

**Goal:** Detect AI-generated web copy and UX writing.

AI-assisted product copy often sounds polished but vague: “unlock your potential,” “streamline your workflow,” “seamless experience,” “powerful insights,” “designed for modern teams.” It may avoid concrete user pain, product constraints, pricing specifics, implementation details, or proof.

## Add Points

| Signal                                                                              | Points |
| ----------------------------------------------------------------------------------- | -----: |
| Generic benefit claims with no concrete proof                                       |     +5 |
| Repeated “not just X, but Y” constructions, polished but empty phrasing             |     +3 |
| Same sentence rhythm across sections                                                |     +3 |
| Microcopy lacks situational empathy at stressful moments                            |     +4 |
| Testimonials sound fake, over-balanced, or too generic                              |     +5 |
| Case studies lack names, dates, metrics, screenshots, constraints, or tradeoffs     |     +5 |
| Legal/privacy/security claims are vague or unsupported                              |     +4 |
| Copy says everything is “seamless,” “intuitive,” “powerful,” “modern,” “effortless” |     +3 |

## Subtract Points

| Human-refinement signal                                  | Points |
| -------------------------------------------------------- | -----: |
| Specific product facts, real constraints, real tradeoffs |     -5 |
| Distinct brand voice that remains useful under pressure  |     -4 |
| Real user quotes, named case studies, credible proof     |     -5 |
| Microcopy helps users recover from errors                |     -4 |

---

# 9. Pass 8 — Provenance, Metadata & Process Evidence

**Goal:** Move beyond surface analysis into authorship evidence.

C2PA Content Credentials can record provenance, edits, and AI use through cryptographically bound metadata, but C2PA itself warns that credentials are opt-in, can be incomplete, and should not be treated as automatic truth. Recent research also argues C2PA is promising but not sufficient for high-stakes verification by itself.

## Check

* C2PA / Content Credentials
* EXIF / file metadata
* Figma version history
* Photoshop/Illustrator/InDesign layer history
* Git commits
* Pull requests
* Issue tickets
* Design briefs
* Prompt logs, if voluntarily provided
* Screenshots of work-in-progress
* Deployment logs
* Asset licensing trail

## Add Points

| Signal                                                                                            | Points |
| ------------------------------------------------------------------------------------------------- | -----: |
| No source files, no layers, no history, only final flattened output                               |     +5 |
| Figma/PSD/AI file has auto-generated-looking layer names or one-shot generation structure         |     +5 |
| Git history appears as one huge commit: “initial commit,” “final,” “update UI”                    |     +6 |
| Large codebase appears in one commit with no intermediate reasoning                               |     +7 |
| Commit messages or comments mention AI tools, prompts, “Claude,” “ChatGPT,” “v0,” “Lovable,” etc. |     +8 |
| Metadata indicates generative AI tool use                                                         |    +10 |
| Creator cannot explain key design/code decisions                                                  |     +6 |
| No design brief, no rejected options, no iteration trail                                          |     +5 |

## Subtract Points

| Human-refinement signal                                                | Points |
| ---------------------------------------------------------------------- | -----: |
| Clear iteration history with rejected alternatives                     |     -6 |
| Layered files show manual craft and logical organization               |     -5 |
| Git history shows incremental implementation and debugging             |     -6 |
| Design decisions documented against brief/user needs                   |     -5 |
| Creator can explain tradeoffs, constraints, and implementation details |     -6 |
| Verified provenance from trusted source                                |     -6 |

---

# 10. Pass 9 — External Verification

**Goal:** Use outside evidence.

## Add Points

| Signal                                                                        | Points |
| ----------------------------------------------------------------------------- | -----: |
| Reverse image search finds many near-identical AI-style variants              |     +5 |
| Same UI appears across multiple unrelated sites with only text changed        |     +6 |
| Product screenshots look like common AI tool outputs or tutorial templates    |     +5 |
| Public repo/issues show AI-generated bugs, placeholder logic, or user reports |     +5 |
| Community comments independently flag the same AI tells                       |     +4 |

## Subtract Points

| Human-refinement signal                                                | Points |
| ---------------------------------------------------------------------- | -----: |
| Design is traceable to known designer, agency, case study, or campaign |     -5 |
| Assets are licensed, credited, or source-verifiable                    |     -4 |
| Public changelog shows real iteration and user feedback                |     -5 |

YouTube’s own platform response shows that major platforms increasingly rely on labels, internal signals, and metadata like C2PA, but even YouTube allows creators to correct some AI labels and treats automatic detection as improving rather than perfect.

---

# 11. Final Report Template

Use this after all passes.

## AI Detection Assessment

**Subject:**
Website / backend / UI flow / graphic asset / full product

**Access level:**
Screenshot only / live site / frontend code / full repo / design files / metadata / commit history

**Final score:**
`__ / 100`

**Confidence:**
Low / Medium / High

**Verdict:**
Human-made / Some AI assistance possible / Indeterminate / Likely AI-assisted / Strongly AI-generated

## Evidence Summary

| Pass                     | Score Contribution | Key Evidence | Confidence |
| ------------------------ | -----------------: | ------------ | ---------- |
| 1. First-glance UI       |                    |              |            |
| 2. Graphic/design asset  |                    |              |            |
| 3. UX flow/edge states   |                    |              |            |
| 4. Frontend code         |                    |              |            |
| 5. Backend/security      |                    |              |            |
| 6. Design-system drift   |                    |              |            |
| 7. Copy/microcopy        |                    |              |            |
| 8. Provenance/process    |                    |              |            |
| 9. External verification |                    |              |            |

## Strongest AI Evidence

1.
2.
3.

## Strongest Human-Craft Evidence

1.
2.
3.

## What Cannot Be Determined

List missing evidence:

* No source file
* No metadata
* No repo access
* No commit history
* No prompt/process disclosure
* No user-research/design rationale
* No deployment history

## Recommended Conclusion Wording

Use cautious language:

> “Based on available evidence, this appears likely AI-assisted, mainly because of generic AI-default UI patterns, missing edge states, and shallow code/test coverage. However, without source files, commit history, or creator process evidence, this is not conclusive.”

Avoid:

> “This is definitely AI-generated.”

---

# 12. Quick LLM Prompt Version

Copy and paste this into any LLM with screenshots, code, or files:

## Prompt

You are an AI-assisted content forensic reviewer. Evaluate whether the supplied website, backend code, UI/UX flow, or graphic design asset is likely human-made, AI-assisted, or heavily AI-generated.

Use the following rules:

1. Do not claim certainty unless there is direct provenance evidence.
2. Score evidence from 0–100.
3. Separate AI evidence from poor human design, templates, junior work, and stock components.
4. Use passes in this order:

   * First-glance UI scan
   * Graphic/image/text-rendering scan
   * UX flow and edge-state audit
   * Frontend code/design-system audit
   * Backend/security/data-model audit
   * Cross-page design-system drift
   * Copy/microcopy authenticity
   * Provenance/metadata/process evidence
   * External verification
5. For each pass, list:

   * Observed evidence
   * AI likelihood points added
   * Human-refinement points subtracted
   * Confidence level
6. Final score interpretation:

   * 0–20 mostly human-made or heavily human-refined
   * 21–40 weak AI-assistance evidence
   * 41–60 indeterminate / cannot confidently tell
   * 61–80 likely AI-assisted
   * 81–100 strong evidence of heavy AI generation
7. Final answer must include:

   * Final score
   * Confidence
   * Verdict
   * Top 5 AI indicators
   * Top 5 human-craft indicators
   * Missing evidence
   * A cautious conclusion suitable for a professional audit

Do not use “AI detector” results as the sole basis. Prioritize observable design/code/process evidence.

---

# 13. Detection Principles to Remember

## A. AI usually reveals itself through defaults

The common tell is not one magic artifact. It is a stack of safe average choices: generic layout, generic copy, generic icons, generic gradients, generic error handling, generic tests, generic business logic.

## B. The strongest AI signal is shallow completeness

AI output often looks complete before it is complete. It may have a beautiful landing page but weak onboarding, weak errors, weak permissions, weak backend boundaries, and weak real-world edge cases.

## C. The second strongest signal is mismatch

Look for mismatch between:

* Visual polish and product maturity
* UI affordance and actual functionality
* Copy promise and backend capability
* Design system and implemented components
* Tests and real failure modes
* Claimed originality and template-like execution

## D. Provenance beats vibes

Screenshots are weak evidence. Source files, metadata, commits, prompts, Figma history, layered assets, and creator explanation are stronger evidence.

## E. “Cannot tell” is a valid result

If the score falls between **41–60**, or if evidence is mostly aesthetic, the correct professional answer is:

> “The content shows AI-like patterns, but available evidence is insufficient to determine whether it was AI-assisted or human-made.”

---

# 14. Practical Red-Flag Cheat Sheet

## Website / UI

* Beige or gray SaaS sameness
* Purple/blue gradients
* Rounded cards everywhere
* Lucide-style icons everywhere
* Generic feature cards
* Fake dashboards
* Fake metrics
* Fake testimonials
* Overuse of badges and eyebrow text
* Polished landing page, shallow product

## UX

* No empty states
* No loading states
* No real error recovery
* No permission handling
* No mobile thoughtfulness
* No accessibility testing
* Hover states that imply non-existent actions
* Generic “Something went wrong” copy

## Graphic Design

* Gibberish microtext
* Broken typography
* Over-perfect composition
* Wrong reflections/shadows
* Warped patterns
* Plastic sheen
* Inconsistent brand marks
* No editable source file

## Frontend Code

* Repeated card components
* Tailwind class soup
* shadcn/Radix defaults without adaptation
* Generic component names
* Inconsistent spacing
* Decorative accessibility
* Decorative animation
* No design-token discipline

## Backend Code

* Hallucinated imports/APIs
* Placeholder logic
* Missing validation
* Weak auth
* Secret exposure
* Tests that don’t test
* Happy-path-only logic
* Business rules guessed from patterns
* Over-engineered abstractions

## Process

* One giant commit
* No iteration trail
* No design rationale
* No source/layer files
* No user research
* No creator explanation
* Metadata points to AI generation

---

# 15. Final Rule

Do not ask:
**“Does this look AI?”**

Ask:
**“Does the artifact contain the depth, specificity, provenance, constraints, edge-case handling, and intentionality normally left by a competent human process?”**

If the answer is no, score it as AI-assisted risk — but only call it AI-generated when the evidence is strong enough.
