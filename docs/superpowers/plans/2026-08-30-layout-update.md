# Kenya-China Tea Summit 2027 — Layout & Pricing Tier Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the exhibition layout to the new 254-booth floor plan from `ACTUAL_LAYOUT/Kenyachinateasummit2027_layout_draft_260824.xlsx`, updating booth positions, 8-tier pricing matrix, and color-branded fascia boards across 3D scene and 2D master plan.

**Architecture:** Data-driven floor plan architecture where `src/data/booths.json` defines all 254 booth locations and tier attributes (Platinum, Gold, Silver, Bronze, Prime, Better, Base, Value). `BoothBuilder.js` dynamically renders stand fascias and floor pads with tier colors, while `SVGOverlay.js` and `BoothPanel.js` provide interactive 2D selection and dual currency drawer details.

**Tech Stack:** Three.js r182, Vanilla JS ES modules, Vite 8, HTML5/CSS3.

## Global Constraints

- Total booths: **254 booths** (146 in Pavilion A, 108 in Pavilion B).
- Base price: **USD 3,000** (KES 390,000 @ 130 KES/USD).
- 8 Tiers: S1 Platinum ($6,000 | 2.0x), S2 Gold ($5,250 | 1.75x), S3 Silver ($4,500 | 1.5x), S4 Bronze ($3,750 | 1.25x), E1 Prime ($4,500 | 1.5x), E2 Better ($3,600 | 1.2x), E3 Base ($3,000 | 1.0x), E4 Value ($2,400 | 0.8x).
- Standard booth dimensions: 3m × 3m.

---

### Task 1: Generate Master Booth Manifest (`src/data/booths.json`)

**Files:**
- Create/Modify: `d:\Projects\EXHIBITION\src\data\booths.json`
- Test: Run validation script in `scratch/verify_booths.py`

**Interfaces:**
- Produces: Master JSON manifest array `booths` with 254 objects containing `{id, tent, x, y, w, h, tier, category, multiplier, price_usd, rate, color, fascia_bg, fascia_text}`.

- [ ] **Step 1: Write verification script for manifest structure**

Create `d:\Projects\EXHIBITION\scratch\verify_booths.py`:
```python
import json

with open(r'd:\Projects\EXHIBITION\src\data\booths.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

booths = data['booths']
assert len(booths) == 254, f"Expected 254 booths, found {len(booths)}"

tent_a = [b for b in booths if b['tent'] == 'tent-a']
tent_b = [b for b in booths if b['tent'] == 'tent-b']
assert len(tent_a) == 146, f"Expected 146 in Tent A, found {len(tent_a)}"
assert len(tent_b) == 108, f"Expected 108 in Tent B, found {len(tent_b)}"

print("Manifest verification passed: 254 booths valid!")
```

- [ ] **Step 2: Run verification script to verify current failure**

Run: `python d:\Projects\EXHIBITION\scratch\verify_booths.py`
Expected: FAIL with "Expected 254 booths, found 196"

- [ ] **Step 3: Update `src/data/booths.json` with 254 booths**

Run node/python generator to overwrite `src/data/booths.json` with all 254 extracted booths from `process_booths_clean.json`.

- [ ] **Step 4: Run verification script to verify it passes**

Run: `python d:\Projects\EXHIBITION\scratch\verify_booths.py`
Expected: PASS with "Manifest verification passed: 254 booths valid!"

- [ ] **Step 5: Commit**

```bash
git add src/data/booths.json
git commit -m "feat: update booths.json manifest to 254-booth layout with 8-tier pricing"
```

---

### Task 2: Update 3D Booth Builder (`src/scene/BoothBuilder.js`) for Fascia & Tier Branding

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\BoothBuilder.js`

**Interfaces:**
- Consumes: `booth.fascia_bg`, `booth.color`, `booth.tier`, `booth.price_usd` from `booths.json`.
- Produces: Tier-branded 3D fascia boards and floor pads in Three.js scene.

- [ ] **Step 1: Update fascia material creation in `BoothBuilder.js`**

Modify `_createBooth` method in `BoothBuilder.js`:
```javascript
const fasciaMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color(booth.fascia_bg || 0x0A2318),
  roughness: 0.3,
  metalness: 0.1
});

const floorMat = new THREE.MeshStandardMaterial({
  color: new THREE.Color(booth.color || 0x2E8B57),
  roughness: 0.6
});
```

- [ ] **Step 2: Test production build**

Run: `npm run build`
Expected: PASS with 0 build errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/BoothBuilder.js
git commit -m "feat: implement dynamic tier fascia board colors and stand branding"
```

---

### Task 3: Scale Pavilion B Canopy & Outdoor Grounds (`src/scene/TentBuilder.js` & `FloorBuilder.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\TentBuilder.js`
- Modify: `d:\Projects\EXHIBITION\src\scene\FloorBuilder.js`

**Interfaces:**
- Consumes: `tents` configuration from `src/data/booths.json`.
- Produces: Extended 3D Pavilion B tent structures (85m length) and plaza ground tiles.

- [ ] **Step 1: Update TentBuilder and FloorBuilder bounds**

Update `TentBuilder.js` to set Pavilion B length to 85m matching Pavilion A. Update `FloorBuilder.js` ground plane sizes.

- [ ] **Step 2: Test production build**

Run: `npm run build`
Expected: PASS with 0 build errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/TentBuilder.js src/scene/FloorBuilder.js
git commit -m "feat: expand Pavilion B canopy and plaza ground plane for 108 booths"
```

---

### Task 4: Update 2D Interactive SVG Master Plan & Legend (`src/ui/SVGOverlay.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\ui\SVGOverlay.js`

**Interfaces:**
- Consumes: `booths.json` manifest.
- Produces: High-contrast 2D SVG map with tier color cards and 8-tier pricing matrix legend.

- [ ] **Step 1: Update SVG rendering logic and legend in `SVGOverlay.js`**

Update `SVGOverlay.js` to render all 254 booths using `booth.color` and `booth.fascia_bg`, and render the updated 8-tier legend (S1-S4 Sponsor, E1-E4 Exhibitor).

- [ ] **Step 2: Test production build**

Run: `npm run build`
Expected: PASS with 0 build errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/SVGOverlay.js
git commit -m "feat: update 2D SVG master plan overlay and 8-tier pricing legend"
```

---

### Task 5: Update Reservation Drawer & Detail Panel (`src/ui/BoothPanel.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\ui\BoothPanel.js`

**Interfaces:**
- Consumes: Selected booth data from `main.js`.
- Produces: Drawer with tier badge, USD rate, and KES currency conversion (at 130 KES/USD).

- [ ] **Step 1: Update BoothPanel drawer details**

Modify `BoothPanel.js` to display tier name badge (e.g., `S1 Platinum` / `E1 Prime`) with tier background color, and compute dual currency values.

- [ ] **Step 2: Test production build**

Run: `npm run build`
Expected: PASS with 0 build errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/BoothPanel.js
git commit -m "feat: update stand reservation drawer with tier badges and dual currency"
```

---

### Task 6: Final Verification & End-to-End Build Validation

**Files:**
- Verify: Full codebase

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: PASS with clean bundle output in `/dist`.

- [ ] **Step 2: Run verification script**

Run: `python d:\Projects\EXHIBITION\scratch\verify_booths.py`
Expected: PASS.
