# Kenya-China Tea Summit 2027 — Layout & UI Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 8 requested visual, layout, camera, and overlay refinements including official logo integration, 0-overlap booth coordinates, clean sky gradient, re-oriented isometric view, unclipped 2D selection glow, and updated modal copy.

**Architecture:** Refines Three.js scene components (`SceneManager.js`, `CameraManager.js`, `BoothBuilder.js`, `PropBuilder.js`), updates `src/data/booths.json` spatial layout, and enhances `SVGOverlay.js` 2D master plan UI and top-layer selection rendering.

**Tech Stack:** Three.js r182, Vanilla JS, Vite 8, HTML5/CSS3.

## Global Constraints
- Zero overlapping booths (`check_overlaps.py` output = 0).
- Logo source: `/src/textures/KCT-Summit Logo.png`.
- 2D modal pill copy: `"2D MASTER FLOOR PLAN & BOOTH RESERVATION"`.
- 2D modal h2 copy: `"CLICK TO MAKE BOOTH RESERVATION"`.

---

### Task 1: Fix Tent B Booth Overlaps (`src/data/booths.json`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\data\booths.json`
- Test: `python scratch/check_overlaps.py`

- [ ] **Step 1: Write overlap check script**
Create `scratch/check_overlaps.py` if not present.

- [ ] **Step 2: Run script to verify initial overlaps**
Run: `python scratch/check_overlaps.py`
Expected: 5 overlaps found.

- [ ] **Step 3: Fix widths and coordinates in `booths.json`**
Set Booths #147 and #148 width to 1.5m, and adjust y-coordinates for Booths #248, #249, #252, #253.

- [ ] **Step 4: Run script to verify zero overlaps**
Run: `python scratch/check_overlaps.py`
Expected: PASS with "Total overlapping booth pairs found: 0".

- [ ] **Step 5: Commit**
```bash
git add src/data/booths.json
git commit -m "fix: resolve all 5 booth bounding box overlaps in Pavilion B"
```

---

### Task 2: Official Summit Logo Integration (`index.html`, `SVGOverlay.js`, `index.css`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\index.html`
- Modify: `d:\Projects\EXHIBITION\src\ui\SVGOverlay.js`
- Modify: `d:\Projects\EXHIBITION\src\styles\index.css`

- [ ] **Step 1: Update `index.html` header and loading screen with official logo image**
Replace inline SVG in `.logo-mark` with `<img src="/src/textures/KCT-Summit Logo.png" alt="Tea Summit Logo" class="brand-logo-img" />`.

- [ ] **Step 2: Update `SVGOverlay.js` header logo**
Add official logo image in `SVGOverlay.js` header.

- [ ] **Step 3: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS with 0 build errors.

- [ ] **Step 4: Commit**
```bash
git add index.html src/ui/SVGOverlay.js src/styles/index.css
git commit -m "feat: integrate official KCT-Summit Logo across header and 2D overlay"
```

---

### Task 3: Sky Blue Gradient & Environment Sprites Toggle (`SceneManager.js`, `PropBuilder.js`, `BoothBuilder.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\SceneManager.js`
- Modify: `d:\Projects\EXHIBITION\src\scene\PropBuilder.js`
- Modify: `d:\Projects\EXHIBITION\src\scene\BoothBuilder.js`

- [ ] **Step 1: Set serene blue sky background in `SceneManager.js`**
Set `scene.background = new THREE.Color(0x6BA4D8)` and clear skybox dome mesh.

- [ ] **Step 2: Disable trees, bushes, and rollup banners**
Return empty group in `PropBuilder.js` and hide `rollupGroup` in `BoothBuilder.js`.

- [ ] **Step 3: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS with 0 build errors.

- [ ] **Step 4: Commit**
```bash
git add src/scene/SceneManager.js src/scene/PropBuilder.js src/scene/BoothBuilder.js
git commit -m "feat: apply soft blue sky background and disable billboard sprites"
```

---

### Task 4: Re-orient Isometric Camera & 2D Lounge Placement (`CameraManager.js`, `SVGOverlay.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\CameraManager.js`
- Modify: `d:\Projects\EXHIBITION\src\ui\SVGOverlay.js`

- [ ] **Step 1: Update isometric camera angle in `CameraManager.js`**
Set isometric camera position from South perspective (`-Math.PI * 0.75`), placing Booth #1 and Pavilion A entrance at the bottom.

- [ ] **Step 2: Update Tea Lounge placement and 2D modal header copy in `SVGOverlay.js`**
Set lounge `y = 42.5`, `height = 5.0`. Update pill copy to `"2D MASTER FLOOR PLAN & BOOTH RESERVATION"` and h2 copy to `"CLICK TO MAKE BOOTH RESERVATION"`.

- [ ] **Step 3: Implement top-layer SVG selection highlight overlay**
Render a `<g id="svg-selection-overlay">` above all booth cards with bright gold glow border (`stroke="#FFD700"`, `stroke-width="0.35"`), preventing any clipping under adjacent stands.

- [ ] **Step 4: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS with 0 build errors.

- [ ] **Step 5: Commit**
```bash
git add src/scene/CameraManager.js src/ui/SVGOverlay.js
git commit -m "feat: re-orient isometric camera, fix 2D lounge placement, and update modal copy"
```

---

### Task 5: Final End-to-End Build & Overlap Verification

**Files:**
- Verify: Full codebase

- [ ] **Step 1: Run production build**
Run: `cmd /c "npm run build"`
Expected: PASS.

- [ ] **Step 2: Run overlap check**
Run: `python scratch/check_overlaps.py`
Expected: PASS with 0 overlaps.
