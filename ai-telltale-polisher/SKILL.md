---
name: ai-telltale-polisher
description: Use before writing implementation plans, before or during design/code/prompt/image execution, or after completion to detect and fix excessive AI tell-tale signs in web design, UI/UX, graphic design, generated images, prompts, copy, frontend/backend code, and process artifacts while avoiding wasted tokens on generic defaults.
---

# AI Telltale Polisher

Use this skill as a quality gate for work that may look AI-generated, generic, shallow, over-polished, or under-grounded. It is not an authorship detector. It is a craft, provenance, and specificity audit.

Prefer narrower skills when the scope is narrower:

- For text-only prose cleanup, use `humanizer`.
- For visual taste and generic frontend feel, use `taste-skill` if available.
- For code bloat and needless abstraction, use `ponytail`.
- Use this skill when the task crosses design, UX, visuals, copy, code, prompt design, or process evidence.

## Modes

### Plan Gate

Run before writing an implementation plan or design brief.

1. Identify the artifact type: website, UI flow, graphic asset, generated image, prompt, copy, frontend, backend, or mixed.
2. Name the intended audience, brand or project context, existing files to reuse, and non-negotiable constraints.
3. List the most likely AI-default risks for this artifact.
4. Add plan checkpoints that force reuse, edge states, provenance, accessibility, responsive behavior, and domain-specific details.
5. If the brief lacks source material, brand constraints, screenshots, design-system rules, or acceptance criteria, ask for them before generating broad output.

### Execution Gate

Run before or during code/design generation when the work risks token burn.

1. Reuse existing components, tokens, naming, layouts, prompts, assets, and workflows before inventing new ones.
2. Avoid generic SaaS skeletons unless the product truly needs them.
3. Replace vague visual polish with specific hierarchy, spacing, interaction states, and real domain content.
4. Cover unhappy paths: loading, empty, error, permission, validation, mobile, keyboard, screen-reader, and slow-network states.
5. Do not invent fake logos, fake testimonials, fake metrics, unverifiable claims, or imaginary provenance.
6. Keep code minimal, domain-named, tested where risk warrants it, and free of placeholder logic.
7. Run cheap inspections before expensive regeneration: search existing patterns, inspect screenshots, check tokens, compare copy, and verify reachable states.

### Audit Gate

Run after work is complete or when asked to review an artifact.

1. Audit only the relevant categories from `references/source-framework.md`.
2. Score cautiously if scoring helps; otherwise give a verdict and ranked fixes.
3. Separate evidence from suspicion. "Cannot tell" is valid when provenance is missing or signals are weak.
4. Apply small, high-impact fixes when the user asked for implementation; otherwise report the fixes needed.
5. Preserve strong human work. Do not rewrite merely because something is old, simple, or uses common patterns.

## Checks

### Website and UI

Look for generic hero sections, rounded card grids, glassy gradients, fake dashboards, uniform icon sets, emoji chips, weak hierarchy, over-even spacing, shallow mobile stacking, decorative animations, missing accessibility, and missing edge states.

Fix by grounding the interface in audience needs, real workflows, existing design-system pieces, clear hierarchy, content-specific layout choices, responsive constraints, and verified interaction states.

### UX and Product Logic

Look for happy-path-only flows, vague errors, dead controls, weak forms, ignored trust/privacy needs, claims that do not match product behavior, and absent research or domain logic.

Fix by adding realistic user journeys, recovery copy, validation, disabled/loading/empty/error states, trust details, and domain-specific decisions.

### Graphic Design and Generated Images

Look for gibberish text, fake labels, broken small type, malformed hands or objects, inconsistent shadows, impossible perspective, plastic sheen, repeated textures, too-perfect symmetry, mismatched logos, and missing source files or metadata.

Fix by replacing fake text with editable real typography, checking brand assets, correcting lighting and perspective, preserving layered source files, and documenting provenance or licensed inputs.

### Frontend and Backend Code

Look for hallucinated APIs, placeholder logic, tutorial comments, broad abstractions, random dependencies, shallow tests, weak auth or validation, leaked errors, inconsistent schemas, and code that ignores project conventions.

Fix by using existing local patterns, domain names, minimal dependencies, meaningful unhappy-path tests, input validation, safe error handling, and small focused changes.

### Copy and Prompt Design

Look for vague claims, repeated rhythms, "seamless", "intuitive", "powerful", "modern", "effortless", fake case studies, invented testimonials, prompts without scope, prompts without output contracts, and prompts without stop conditions.

Fix by adding concrete facts, tradeoffs, audience language, constraints, examples, acceptance criteria, verification steps, and clear handoff format.

### Process and Provenance

Look for one giant unexplained commit, no brief, no iteration history, no source files, no licensing trail, no screenshots, no rationale, AI tool metadata, or inability to explain decisions.

Fix by preserving source material, WIP notes, screenshots, prompts, design rationale, licenses, git history, and verification evidence.

## Output

Use this format for audits:

```markdown
## AI telltale audit
Mode:
Scope:
Confidence:
Verdict:

Top risks:
-

Fixes applied:
-

Fixes still needed:
-

Skipped:
-
```

Use this shorter format during planning or execution:

```markdown
AI-default risks:
-

Prevention checkpoints:
-

Need before continuing:
-
```

## Full Framework

For detailed scoring, confidence levels, pass-by-pass evidence, and the final report template, read `references/source-framework.md`.
