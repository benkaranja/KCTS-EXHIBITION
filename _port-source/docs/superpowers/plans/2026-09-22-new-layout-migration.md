# Kenya-China Tea Summit 2027 — New Layout Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the exhibition floor plan and 3D visualization to the new layout from `ACTUAL_LAYOUT/NEW EXHIBITION LAYOUT.jpg` and `ACTUAL_LAYOUT/NEW EXHIBITION FLOOR MOVEMENT.jpeg`, swapping Pavilion A (South) and Pavilion B (North), aligning physical portals and walkways, and deploying the updated application online.

**Architecture:** Data-driven Three.js & SVG architecture. `src/data/booths.json` maintains the 254-booth manifest with updated spatial coordinates ($y: 10\dots 40$ for Pavilion B; $y: 50\dots 80$ for Pavilion A). `TentBuilder.js`, `FloorBuilder.js`, `BoothBuilder.js`, `CameraManager.js`, and `SVGOverlay.js` consume these coordinates to render the 3D structures, 2D floor plan, and visitor flow architecture.

**Tech Stack:** Three.js r182, Vanilla JavaScript ES modules, Vite 8, HTML5/CSS3, Git & GitHub Actions (Pages).

## Global Constraints

- Total booths: **254 booths** (146 in Pavilion A, 108 in Pavilion B).
- Pavilion B (Booths 147–254 + 4 VIP lounges) located at North ($z = 10\text{m} \dots 40\text{m}$).
- Pavilion A (Booths 1–146, Main Exhibition Hall) located at South ($z = 50\text{m} \dots 80\text{m}$).
- Physical entrance at South-West ($X \approx -1\text{m}, Z \approx 77\text{m}$).
- Physical exit at North-West ($X \approx -1\text{m}, Z \approx 13\text{m}$).
- Dual covered connecting walkways at $X = 42.5\text{m}$ and $X = 73.5\text{m}$ across $z = 40\text{m} \dots 50\text{m}$.
- All 8 pricing tiers, rates, categories, and colors preserved verbatim from current specification.
- Production build validation must pass cleanly with `cmd /c "npm run build"`.

---

### Task 1: Update Booth Manifest Coordinates (`src/data/booths.json`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\data\booths.json`
- Test: `d:\Projects\EXHIBITION\scratch\verify_booths.py`

**Interfaces:**
- Produces: Updated JSON manifest with 254 booth objects:
  - Tent A (146 booths): $y \in [50, 80]$
  - Tent B (108 booths): $y \in [10, 40]$
  - `tents` configuration reflecting swapped pavilion positions.

- [ ] **Step 1: Write the failing verification test**

Create `d:\Projects\EXHIBITION\scratch\verify_booths.py`:
```python
import json

with open(r'd:\Projects\EXHIBITION\src\data\booths.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

booths = data['booths']
assert len(booths) == 254, f"Expected 254 booths, found {len(booths)}"

tent_a = [b for b in booths if b['tent'] == 'tent-a']
tent_b = [b for b in booths if b['tent'] == 'tent-b']
assert len(tent_a) == 146, f"Expected 146 in Tent A, got {len(tent_a)}"
assert len(tent_b) == 108, f"Expected 108 in Tent B, got {len(tent_b)}"

# Verify Tent A is in South (y >= 50 and y <= 80)
for b in tent_a:
    assert 50 <= b['y'] <= 80, f"Tent A booth {b['id']} y={b['y']} outside [50, 80]"

# Verify Tent B is in North (y >= 10 and y <= 40)
for b in tent_b:
    assert 10 <= b['y'] <= 40, f"Tent B booth {b['id']} y={b['y']} outside [10, 40]"

# Verify tent metadata
tent_meta = {t['id']: t for t in data['tents']}
assert tent_meta['tent-a']['z'] == 50, f"Tent A metadata z should be 50, got {tent_meta['tent-a']['z']}"
assert tent_meta['tent-b']['z'] == 10, f"Tent B metadata z should be 10, got {tent_meta['tent-b']['z']}"

print("PASS: Booth manifest verified successfully with correct swapped coordinates!")
```

- [ ] **Step 2: Run test to verify it fails**

Run: `python d:\Projects\EXHIBITION\scratch\verify_booths.py`
Expected: FAIL with assertion error (e.g., `Tent A booth 1 y=10 outside [50, 80]`).

- [ ] **Step 3: Update `src/data/booths.json` with swapped Y coordinates**

Execute transformation script to swap coordinates in `src/data/booths.json`:
- For booths with `tent === 'tent-a'`: $y = y + 40$.
- For booths with `tent === 'tent-b'`: $y = y - 40$.
- Update `tents` array:
  - `tent-a`: `z = 50`
  - `tent-b`: `z = 10`

- [ ] **Step 4: Run test to verify it passes**

Run: `python d:\Projects\EXHIBITION\scratch\verify_booths.py`
Expected: PASS with "PASS: Booth manifest verified successfully with correct swapped coordinates!".

- [ ] **Step 5: Commit**

```bash
git add src/data/booths.json scratch/verify_booths.py
git commit -m "feat(data): swap Pavilion A and Pavilion B coordinates in booth manifest"
```

---

### Task 2: Update 3D Pavilion Structures & Portals (`src/scene/TentBuilder.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\TentBuilder.js`

**Interfaces:**
- Consumes: Venue dimensions and pavilion configs.
- Produces: 3D tent canopies, trusses, dual connecting walkways, South-West welcome gate, and North-West exit arch.

- [ ] **Step 1: Update pavilion positions, walkway canopies, and portal arches**

In `TentBuilder.js`:
1. Build Pavilion B at `z: 10`, `length: 30`, `badgeText: 'PAVILION B · INNOVATION & B2B'`.
2. Build Pavilion A at `z: 50`, `length: 30`, `badgeText: 'PAVILION A · MAIN HALL'`.
3. Build two connecting walkways spanning $z = 40$ to $50$:
   - Walkway 1 at $X = 42.5$
   - Walkway 2 at $X = 73.5$
4. Position Welcome Gate at South-West: $X = -1, Z = 77$.
5. Add North-West Exit Arch at $X = -1, Z = 13$ labeled `SUMMIT EXIT · NORTH DEPARTURE`.

- [ ] **Step 2: Test production build**

Run: `cmd /c "npm run build"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/TentBuilder.js
git commit -m "feat(scene): swap pavilion tent structures and align entry/exit portals"
```

---

### Task 3: Align 3D Floors, Plazas & Outdoor Deck (`src/scene/FloorBuilder.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\FloorBuilder.js`

**Interfaces:**
- Consumes: Venue dimensions.
- Produces: Paved plaza ground, Pavilion B floor pad at $z = 25$, Pavilion A floor pad at $z = 65$, central tea deck at $z = 45$.

- [ ] **Step 1: Update floor positions in `FloorBuilder.js`**

1. Set `tentBFloor` position to $(47.5, 0.01, 25.0)$ for bounds $z = 10\dots 40$.
2. Set `tentAFloor` position to $(47.5, 0.01, 65.0)$ for bounds $z = 50\dots 80$.
3. Keep outdoor wooden tea deck at $(47.5, 0.06, 45.0)$.

- [ ] **Step 2: Test production build**

Run: `cmd /c "npm run build"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/FloorBuilder.js
git commit -m "feat(scene): align floor pads for swapped pavilion locations"
```

---

### Task 4: Update Adjacency & Perimeter Logic (`src/scene/BoothBuilder.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\BoothBuilder.js`

**Interfaces:**
- Consumes: Booth positions and dimensions.
- Produces: Accurate shell scheme walls on perimeter and shared partitions.

- [ ] **Step 1: Update perimeter wall boundary checks in `BoothBuilder.js`**

In `_computeAdjacency(b, allBooths)`:
- Pavilion B perimeter walls:
  - North wall: $y = 10\text{m}$
  - South wall: $y + h = 40\text{m}$
- Pavilion A perimeter walls:
  - North wall: $y = 50\text{m}$
  - South wall: $y + h = 80\text{m}$

- [ ] **Step 2: Test production build**

Run: `cmd /c "npm run build"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/BoothBuilder.js
git commit -m "feat(scene): update booth wall perimeter boundary detection for swapped tents"
```

---

### Task 5: Realign Camera Focus Centers (`src/scene/CameraManager.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\scene\CameraManager.js`

**Interfaces:**
- Consumes: View mode and tent filter selection (`all`, `tent-a`, `tent-b`).
- Produces: Camera lookAt and position targets centered on active pavilion.

- [ ] **Step 1: Update camera target centers**

In `setTentFocus(tentFilter)`:
- If `tentFilter === 'tent-a'`: `centerZ = 65.0` (Pavilion A at South).
- If `tentFilter === 'tent-b'`: `centerZ = 25.0` (Pavilion B at North).
- If `tentFilter === 'all'`: `centerZ = 45.0` (All venue).

- [ ] **Step 2: Test production build**

Run: `cmd /c "npm run build"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/scene/CameraManager.js
git commit -m "feat(camera): update focus coordinates for swapped pavilions"
```

---

### Task 6: Synchronize 2D Interactive SVG Floor Plan (`src/ui/SVGOverlay.js`)

**Files:**
- Modify: `d:\Projects\EXHIBITION\src\ui\SVGOverlay.js`

**Interfaces:**
- Consumes: `booths.json` manifest.
- Produces: 2D interactive floor plan with Pavilion B on top ($Y = 10\dots 40$), Pavilion A on bottom ($Y = 50\dots 80$), dual walkways, entry/exit indicators, and updated tab zoom filters.

- [ ] **Step 1: Update SVG rendering layout**

In `SVGOverlay.js`:
1. Render Tent B outline at $Y = 10\dots 40$ labeled `TENT B — TEA INNOVATION & B2B MATCHMAKING (30M × 85M)`.
2. Render Tent A outline at $Y = 50\dots 80$ labeled `TENT A — MAIN EXHIBITION HALL (30M × 85M)`.
3. Render dual connecting walkways between $Y = 40$ and $50$ at $X = 42.5$ and $X = 73.5$.
4. Add entrance badge at South-West: `▶ MAIN ENTRANCE` ($X = 4, Y = 82$).
5. Add exit badge at North-West: `◀ SUMMIT EXIT` ($X = 4, Y = 7.5$).
6. Update filter tab bounds:
   - `tent-a`: `minY = 46`, `maxY = 86`.
   - `tent-b`: `minY = 5`, `maxY = 45`.

- [ ] **Step 2: Test production build**

Run: `cmd /c "npm run build"`
Expected: PASS with 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/ui/SVGOverlay.js
git commit -m "feat(ui): update 2D SVG overlay layout, labels, and entrance/exit indicators"
```

---

### Task 7: Comprehensive Verification & Online Deployment

**Files:**
- Verify: Full codebase
- Deploy: Push to `origin/master` and sync to `origin/feat/exhibition-layout` (`_port-source`)

- [ ] **Step 1: Run verification script**

Run: `python d:\Projects\EXHIBITION\scratch\verify_booths.py`
Expected: PASS.

- [ ] **Step 2: Run production build**

Run: `cmd /c "npm run build"`
Expected: PASS with 0 build warnings/errors.

- [ ] **Step 3: Sync changes to `_port-source` on `feat/exhibition-layout` and push**

Update `origin/feat/exhibition-layout` with the new build and trigger GitHub Pages deployment. Verify live page at `https://benkaranja.github.io/KCTS-EXHIBITION/`.

- [ ] **Step 4: Commit and finalize walkthrough**
