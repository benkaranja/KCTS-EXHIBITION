# Kenya-China Tea Summit 2027 — Layout & UI Tweaks Implementation Plan #2

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement 6 UI, camera, interaction, and copy refinements including single-booth selection mode, "Pavilion" to "Tent" rename, 2D lounge box clearance, removal of logo from 2D modal header, new orange hover hue, and top view camera re-orientation (entrance on left).

**Architecture:** Updates state logic in `main.js`, material colors in `BoothBuilder.js`, camera view in `CameraManager.js`, layout/copy in `SVGOverlay.js` & `BoothPanel.js`, and JSON manifest descriptions.

**Tech Stack:** Three.js r182, Vanilla JS, Vite 8.

## Global Constraints
- Single stand selection only (max 1 selected booth in state).
- Terminology: "Tent" instead of "Pavilion".
- Top view orientation: Entrance (South, z=10) on left side.

---

### Task 1: Single-Stand Selection Mode (`src/main.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\main.js`

- [ ] **Step 1: Update `toggleBoothSelection` in `main.js`**
Update selection logic so clicking a stand deselects any previously selected stand and selects only the target stand.

- [ ] **Step 2: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add src/main.js
git commit -m "feat: enforce single-booth selection mode across 3D and 2D views"
```

---

### Task 2: Terminology Rename ("Pavilion" → "Tent")

**Files:**
- Modify: `d:\Projects\EXHIBITION\index.html`
- Modify: `d:\Projects\EXHIBITION\src\data\booths.json`
- Modify: `d:\Projects\EXHIBITION\src\ui\SVGOverlay.js`
- Modify: `d:\Projects\EXHIBITION\src\ui\BoothPanel.js`
- Modify: `d:\Projects\EXHIBITION\src\scene\TentBuilder.js`

- [ ] **Step 1: Replace all user-facing instances of "Pavilion" with "Tent"**
Update tab labels, titles, drawer headers, and tent descriptions to use "Tent A" and "Tent B".

- [ ] **Step 2: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add index.html src/data/booths.json src/ui/SVGOverlay.js src/ui/BoothPanel.js src/scene/TentBuilder.js
git commit -m "refactor: rename Pavilion to Tent across all UI components and data manifests"
```

---

### Task 3: 2D Lounge Clearance & Logo Removal (`src/ui/SVGOverlay.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\ui\SVGOverlay.js`

- [ ] **Step 1: Remove logo img from `.svg-header-bar`**
Remove `<img ... class="svg-header-logo" />` from `SVGOverlay.js`.

- [ ] **Step 2: Adjust lounge box position**
Set lounge `y = 41.2`, `height = 4.6` (range `y: 41.2..45.8`) to ensure 1.4m clearance from Tent B header banner (`y = 47.2`).

- [ ] **Step 3: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS.

- [ ] **Step 4: Commit**
```bash
git add src/ui/SVGOverlay.js
git commit -m "fix: remove 2D overlay logo image and adjust outdoor lounge clearance"
```

---

### Task 4: 3D Mouseover Hover Effect (New Orange Hue) (`BoothBuilder.js`, `main.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\BoothBuilder.js`
- Modify: `d:\Projects\EXHIBITION\src\main.js`

- [ ] **Step 1: Add hover color handling in `BoothBuilder.js`**
Define `COLORS.hover = 0xFF9F43` (bright amber-coral orange) and implement `setHoverState(id, isHovered)`.

- [ ] **Step 2: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add src/scene/BoothBuilder.js src/main.js
git commit -m "feat: implement warm orange hue mouseover hover highlight in 3D scene"
```

---

### Task 5: Re-orient Top View Camera (Entrance on Left) (`CameraManager.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\CameraManager.js`

- [ ] **Step 1: Update `top` view camera orientation in `CameraManager.js`**
Set `orthoCamera` up vector `camera.up.set(-1, 0, 0)` for `top` mode so the South entrance (z=10) points to the left side of the viewport.

- [ ] **Step 2: Test production build**
Run: `cmd /c "npm run build"`
Expected: PASS.

- [ ] **Step 3: Commit**
```bash
git add src/scene/CameraManager.js
git commit -m "feat: re-orient top view camera so South entrance appears on the left"
```

---

### Task 6: Final Verification & Build Check

**Files:**
- Verify: Full codebase

- [ ] **Step 1: Run production build**
Run: `cmd /c "npm run build"`
Expected: PASS.
