# Kenya-China Tea Summit 2027 — Layout & UI Tweaks Spec #2

## Executive Summary
This design specification defines 6 precise UI, interaction, camera, and terminology adjustments requested for the exhibition web application.

---

## 1. Requirement Specifications

1. **Remove Logo Image from 2D SVG Header Bar**:
   - In `SVGOverlay.js`, remove `<img ... class="svg-header-logo" />` from `.svg-header-bar`. (Keep the official logo in the site header and loading screen).
2. **Single-Booth Selection Mode (Disable Multi-Select)**:
   - In `main.js`, update `selectedBooths` handling so selecting a stand clears any previous selection, ensuring strictly one stand can be selected at a time across both 3D and 2D modes.
3. **2D Outdoor Tea Tasting Lounge Clearance**:
   - Reposition lounge box in `SVGOverlay.js` to `y = 41.2`, `height = 4.6` (range `y: 41.2..45.8`) to avoid overlapping Pavilion B's title banner (which begins at `y = 47.2`).
4. **Terminology Rename ("Pavilion" → "Tent")**:
   - Rename all user-facing instances of "Pavilion" / "PAVILION" to "Tent" / "TENT" across `index.html`, `booths.json`, `SVGOverlay.js`, `BoothPanel.js`, `TentBuilder.js`, and `Controls.js` (e.g., "Tent A — Main Hall", "Tent B — Innovation").
5. **3D Mouseover Hover Highlight (Vibrant Orange Hue)**:
   - Implement hover state in `BoothBuilder.js` / `main.js` using a distinct warm orange hue (`#FF9F43` / `0xFF9F43` bright amber-coral orange) to clearly communicate booth hover state.
6. **Top View Entrance Orientation (Entrance on Left Side)**:
   - Re-orient Top View camera in `CameraManager.js` so that the South entrance (z = 10) is oriented along the LEFT side of the landscape viewport by configuring camera position and up vector (`camera.up.set(-1, 0, 0)`).

---

## 2. Verification Plan

1. **Build Verification**: Run `cmd /c "npm run build"` (exit code 0).
2. **Dev Server & UI Verification**: Verify single-selection, "Tent" text, logo removal, 2D lounge clearance, hover color, and top view orientation.
