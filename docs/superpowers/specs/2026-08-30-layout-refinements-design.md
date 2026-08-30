# Kenya-China Tea Summit 2027 — Layout & UI Refinements Design Spec

## Executive Summary
This specification documents 8 critical layout, UI, camera, and visual refinements requested for the 254-booth 3D & 2D Exhibition floor plan.

---

## 1. Summary of 8 Refinement Requirements

1. **Official Summit Branding Logo Integration**:
   - Replace generic SVG leaf icon with official summit logo `src/textures/KCT-Summit Logo.png` across header bar, loading screen, 2D overlay modal header, and scene branding.
2. **Environment & Sprite Cleanup**:
   - Temporarily disable sprite billboards (trees, bushes, teardrop banners) and 3D rollup banner stands (`PropBuilder.js`, `BoothBuilder.js`).
   - Replace 3D cylindrical sky dome (`SkylineBuilder.js`) with a serene, clean blue sky gradient in Three.js background (`SceneManager.js`).
3. **2D Bounding Box Overlap Remediation**:
   - Resolve bounding box overlaps in Tent B manifest (`booths.json`):
     - Convert Booths #147 and #148 from 3.0m width to 1.5m single-booth width (matching Booths #1 and #2).
     - Adjust y-spacing along right perimeter column AK (Booths #248, #249, #252, #253) to guarantee 0.0m overlap.
4. **Outdoor Tea Tasting Lounge 2D Placement**:
   - Adjust `SVGOverlay.js` promenade lounge position (`y = 42.5`, `height = 5.0`) so it sits gracefully between Pavilion A (`y: 10..40`) and Pavilion B (`y: 50..80`) without overlapping Pavilion B.
5. **Isometric Camera Orientation**:
   - Re-orient Isometric orthographic camera angle in `CameraManager.js` to look from the South perspective (`-Math.PI * 0.75`), placing Booth #1 and Pavilion entrances at the bottom of the viewport.
6. **Non-Clipped 2D Stand Selection Highlight**:
   - Replace tacky clipped rounded-rectangle strokes in `SVGOverlay.js` with a top-layer `<g class="selection-overlay-layer">` rendered AFTER all booth nodes.
   - Design: High-contrast gold glow border (`stroke="#FFD700"`, `filter="drop-shadow(0 0 6px rgba(255,215,0,0.8))"`), outer white outline, and floating active selection badge.
7. **2D Modal Header Pill Text**:
   - Rename `.summit-pill` text in `SVGOverlay.js` to: `"2D MASTER FLOOR PLAN & BOOTH RESERVATION"`.
8. **2D Modal Heading Text**:
   - Rename `<h2>` text in `SVGOverlay.js` to: `"CLICK TO MAKE BOOTH RESERVATION"`.

---

## 2. Verification Plan

1. **Overlap Audit Script**: Run `python scratch/check_overlaps.py` to confirm 0 overlapping booths.
2. **Production Build**: Run `cmd /c "npm run build"` to ensure 0 build errors.
3. **Dev Server Verification**: Run `cmd /c "npm run dev"` and test Web UI rendering.
