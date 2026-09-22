# Kenya-China Tea Summit 2027 — Floor Plan & 3D Visualization Migration Design Spec

## 1. Executive Summary & Context

- **Client / Summit**: Kenya-China Tea Summit 2027 (KICC Nairobi Outdoor Grounds & Pavilion Complex)
- **Objective**: Realize the new layout defined in `ACTUAL_LAYOUT/NEW EXHIBITION LAYOUT.jpg` and circulation dynamics in `ACTUAL_LAYOUT/NEW EXHIBITION FLOOR MOVEMENT.jpeg`.
- **Key Realignment**:
  - **Pavilion B** (108 Booths: 147–254, plus 4 East VIP lounges) is relocated to the **Top (North)** position ($z = 10\text{m}$ to $40\text{m}$).
  - **Pavilion A** (146 Booths: 1–146, Main Exhibition Hall) is relocated to the **Bottom (South)** position ($z = 50\text{m}$ to $80\text{m}$).
  - **Circulation & Physical Portals**:
    - Physical Summit Entrance & Registration Pylon at South-West arrival ($X \approx -1\text{m}, Z \approx 77\text{m}$) outside Booth 1.
    - Physical Summit Exit Arch at North-West departure ($X \approx -1\text{m}, Z \approx 13\text{m}$) outside Booth 148.
    - Dual Covered Walkways connecting Pavilion A and B between $z = 40\text{m}$ and $50\text{m}$ at cross-aisles $X = 42.5\text{m}$ and $X = 73.5\text{m}$.
  - **Missing Numbers in CAD Image Decoded**:
    - The top tent in `NEW EXHIBITION LAYOUT.jpg` displayed placeholder digits (1–6) at bottom-left. The definitive numbering is mapped 1:1 from `ACTUAL_LAYOUT/Kenyachinateasummit2027_layout_draft_260824.xlsx` (Area B, 108 booths total).

---

## 2. Spatial Architecture & Coordinate System

### Coordinate Definitions
- **X-axis**: Horizontal East-West across both pavilions ($X = 5\text{m}$ to $90\text{m}$, width = $85\text{m}$).
- **Y-axis (Manifest) / Z-axis (3D Scene)**: North-South across the venue ($80\text{m}$ length).

| Zone | Previous Position | New Position | Center (X, Z) | Content |
| :--- | :--- | :--- | :--- | :--- |
| **Pavilion B** (Innovation & B2B) | $z = 50\text{m} \dots 80\text{m}$ | $z = 10\text{m} \dots 40\text{m}$ | $(47.5, 25.0)$ | 108 Booths (147–254) + 4 VIP Lounges (251–254) |
| **Central Promenade & Walkways** | $z = 40\text{m} \dots 50\text{m}$ | $z = 40\text{m} \dots 50\text{m}$ | $(47.5, 45.0)$ | Outdoor Teak Deck + 2 Covered Connecting Walkways |
| **Pavilion A** (Main Exhibition Hall) | $z = 10\text{m} \dots 40\text{m}$ | $z = 50\text{m} \dots 80\text{m}$ | $(47.5, 65.0)$ | 146 Booths (1–146) |
| **Main Summit Entrance** | $X = -1, Z = 25$ | $X = -1, Z = 77$ | $(-1.0, 77.0)$ | Branded Registration & Welcome Gate Portal |
| **Summit Exit Arch** | N/A | $X = -1, Z = 13$ | $(-1.0, 13.0)$ | Dedicated Exit Portal Arch |

---

## 3. Component Details & Modifications

### 3.1 Data Layer (`src/data/booths.json`)
- **Tents metadata**:
  - `tent-a`: `x: 5`, `z: 50`, `width: 85`, `length: 30`, `color: '#1B4D3E'`
  - `tent-b`: `x: 5`, `z: 10`, `width: 85`, `length: 30`, `color: '#143D2B'`
- **Booth coordinates**:
  - For all booths with `tent === 'tent-a'` (IDs 1–146): $y_{\text{new}} = y_{\text{old}} + 40$.
  - For all booths with `tent === 'tent-b'` (IDs 147–254): $y_{\text{new}} = y_{\text{old}} - 40$.
  - Verification: all 254 booth records maintain their exact $w, h$, tier, category, multiplier, price, and fascia properties.

### 3.2 3D Scene Layer

#### `TentBuilder.js`
- **Tent A Group**: Built at `z = 50`, `length = 30`, `name: 'PAVILION A — MAIN EXHIBITION HALL'`.
- **Tent B Group**: Built at `z = 10`, `length = 30`, `name: 'PAVILION B — TEA INNOVATION & B2B MATCHMAKING'`.
- **Connecting Walkways**:
  - Walkway 1: $X = 42.5\text{m}$, spans $z = 40\text{m} \dots 50\text{m}$.
  - Walkway 2: $X = 73.5\text{m}$, spans $z = 40\text{m} \dots 50\text{m}$.
- **Entrance & Exit Portals**:
  - Welcome Gate at $X = -1\text{m}, Z = 77\text{m}$ (South-West).
  - Exit Arch at $X = -1\text{m}, Z = 13\text{m}$ (North-West).

#### `FloorBuilder.js`
- Pavilion B floor pad geometry at center $(47.5, 0.01, 25.0)$ (bounds $z = 10\dots 40$).
- Pavilion A floor pad geometry at center $(47.5, 0.01, 65.0)$ (bounds $z = 50\dots 80$).
- Central teak deck at $(47.5, 0.06, 45.0)$.

#### `BoothBuilder.js`
- **Adjacency Logic (`_computeAdjacency`)**:
  - Perimeter wall boundaries updated:
    - Tent B North wall: $y = 10\text{m}$; Tent B South wall: $y + h = 40\text{m}$.
    - Tent A North wall: $y = 50\text{m}$; Tent A South wall: $y + h = 80\text{m}$.

#### `CameraManager.js`
- Focus targets updated:
  - All venue: center $Z = 45.0\text{m}$.
  - Tent A: center $Z = 65.0\text{m}$.
  - Tent B: center $Z = 25.0\text{m}$.

### 3.3 2D Interactive Floor Plan (`SVGOverlay.js`)
- Viewport and outlines updated:
  - Tent B outline rendered at $Y = 10\dots 40$.
  - Tent A outline rendered at $Y = 50\dots 80$.
  - Walkway corridors rendered at $Y = 40\dots 50$.
  - Entry badge labeled `▶ MAIN SUMMIT ENTRANCE` at South-West ($X = 5, Y = 82$).
  - Exit badge labeled `◀ SUMMIT EXIT` at North-West ($X = 5, Y = 8$).
  - Filter tabs updated:
    - Tab `tent-a`: focuses $Y = 46\dots 86$.
    - Tab `tent-b`: focuses $Y = 5\dots 44$.

---

## 4. Verification & Testing Strategy
- Automated validation via Python script (`scratch/verify_booths.py`):
  - 254 total booths.
  - Tent A: 146 booths with $y \in [50, 80]$.
  - Tent B: 108 booths with $y \in [10, 40]$.
- Build validation: `cmd /c "npm run build"` compiles with 0 errors.
- Visual inspection across Perspective, Isometric, Top View, and 2D Master Plan.
