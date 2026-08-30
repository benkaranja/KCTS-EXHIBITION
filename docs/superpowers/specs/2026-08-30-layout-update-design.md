# Kenya-China Tea Summit 2027 — Layout & Pricing Tier Migration Design

## Executive Summary
This design document specifies the complete migration of the Kenya-China Tea Summit 2027 Exhibition interactive 3D and 2D floor plan layout from the legacy 196-booth scheme to the updated **254-booth master layout** defined in `ACTUAL_LAYOUT/Kenyachinateasummit2027_layout_draft_260824.xlsx`.

Additionally, all booth pricing, pricing multipliers, tier classifications, and booth fascia board color brandings are updated to reflect the new 8-tier hierarchy (S1 Platinum, S2 Gold, S3 Silver, S4 Bronze, E1 Prime, E2 Better, E3 Base, E4 Value).

---

## 1. System Architecture & Component Changes

### 1.1 Master JSON Manifest (`src/data/booths.json`)
- **Total Booth Count**: Expanded from 196 to **254 booths**.
  - **Pavilion A (Main Exhibition Hall)**: 146 Booths (IDs 1 – 146).
  - **Pavilion B (Tea Innovation & Culture Pavilion)**: 108 Booths (IDs 147 – 254).
- **Tent Dimensions**:
  - Pavilion A: 30m × 85m.
  - Pavilion B: Extended to 30m × 85m to accommodate all 108 innovation booths.
- **Booth Attributes**:
  - `id`: Integer (1..254).
  - `tent`: `"tent-a"` or `"tent-b"`.
  - `x`, `y`, `w`, `h`: Precise spatial coordinates for 3D rendering and 2D overlay mapping.
  - `tier`: Tier name (`"S1 Platinum"`, `"S2 Gold"`, `"S3 Silver"`, `"S4 Bronze"`, `"E1 Prime"`, `"E2 Better"`, `"E3 Base"`, `"E4 Value"`).
  - `category`: `"Sponsor"` or `"Exhibitor"`.
  - `multiplier`: Tier price multiplier (0.8x to 2.0x).
  - `price_usd`: Numeric price in USD ($2,400 to $6,000).
  - `rate`: Formatted rate string (e.g., `"USD 4,500"`).
  - `color`: Hex color representation for the 3D floor pad and 2D map card.
  - `fascia_bg`: Hex color for 3D/2D booth fascia header.
  - `fascia_text`: Contrast text color for fascia headers.

### 1.2 3D Scene Builders
- **`BoothBuilder.js`**:
  - Dynamically applies tier-specific color branding to fascia boards (`booth.fascia_bg`), floor pads (`booth.color`), and top frame trims.
  - Generates 3D canvas textures for fascia text labels displaying the Booth Number and Tier Name with crisp typography.
  - Updates selection state colors while preserving tier color identity on hover/unselect.
- **`TentBuilder.js` & `FloorBuilder.js`**:
  - Scales Pavilion B canopy, trusses, entrance arches, and outdoor plaza tiling to match the expanded 108-booth footprint.

### 1.3 2D Interactive SVG Master Plan (`src/ui/SVGOverlay.js`)
- **Dynamic ViewBox & Grid Scale**: Updated to render both Pavilion A (146 booths) and Pavilion B (108 booths) seamlessly.
- **Color Branding**: Renders each SVG booth card with its tier's distinct fill color, border accent, and crisp booth ID label.
- **Enhanced Interactive Legend**:
  - Replaces generic legend with the full 8-tier pricing matrix:
    - **Sponsor Tiers**: S1 Platinum ($6,000), S2 Gold ($5,250), S3 Silver ($4,500), S4 Bronze ($3,750).
    - **Exhibitor Tiers**: E1 Prime ($4,500 | 1.5x), E2 Better ($3,600 | 1.2x), E3 Base ($3,000 | 1.0x), E4 Value ($2,400 | 0.8x).

### 1.4 Reservation & Stand Detail Drawer (`src/ui/BoothPanel.js`)
- **Tier Badge Display**: Displays branded color badges for Sponsor / Exhibitor tiers.
- **Dual Currency Formatting**:
  - Top Line: `USD <amount>` (e.g., `USD 4,500`)
  - Bottom Line: `KES <amount>` calculated at 130 KES/USD (e.g., `KES 585,000`).

---

## 2. Verification & Validation Strategy

1. **Data Completeness Verification**:
   - Automated check verifying all 254 booth IDs (1-146 in Pavilion A, 147-254 in Pavilion B) match the Excel grid.
2. **Pricing & Tier Audit**:
   - Automated check asserting all booth pricing matches exact multiplier math.
3. **Build & Runtime Verification**:
   - Execute `npm run build` with zero errors.
   - Serve dev server with Vite and verify 3D/2D rendering, raycasting, camera transitions, and stand reservation flows.
