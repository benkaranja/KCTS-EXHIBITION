# Kenya-China Tea Summit 2027 — 3D Interactive Exhibition Floor Plan
## Comprehensive System Specification & Developer Handoff Document

---

## 1. Project Overview & Context

- **Client / Summit**: **Kenya-China Tea Summit 2027**
- **Venue**: KICC Nairobi Outdoor Grounds & Pavilion Complex
- **Website & Brand**: [kenyachinateasummit.com](https://kenyachinateasummit.com/)
- **Core Technology**: Three.js (r182 ES module), Vanilla HTML5/CSS3/JavaScript, Vite 8
- **Master Drawing / Floor Plan Reference**: `ACTUAL_LAYOUT/30 BY 80 EXHIBITION TENT LAYOUT 2.png`
- **Total Stands**: **196 Booths**
  - **Pavilion A (Main Hall)**: 146 Booths (1 to 146, 3m × 3m standard shell scheme, 3m × 6m doubles, 6m × 6m VIP lounge)
  - **Pavilion B (Innovation & B2B)**: 50 Booths (201 to 250, 3m × 3m shell scheme, 6m × 6m corner pavilion)

---

## 2. Brand Identity & Design System

### Color Palette (Tea Summit Jade & Gold)
- **Deep Jade / Forest Background**: `#081C15` / `#0D2B1D` / `#143D2B`
- **Primary Emerald (Available Booths)**: `#2E8B57` (3D: `0x2E8B57`, SVG: `#2E8B57`)
- **Accent Gold / Amber (Selected Booths)**: `#E67E22` / `#C99738` (3D: `0xE67E22`, SVG: `#E67E22`)
- **VIP / Lounge Gold**: `#D4AF37` / `#F39C12` (3D: `0xD4AF37`, SVG: `#D4AF37`)
- **Reserved Stand Gray**: `#5A6B63` / `#7F8C8D` (3D: `0x5A6B63`, SVG: `#5A6B63`)
- **Fascia Board / Headers**: `#0A2318` with crisp `#FFFFFF` typography
- **Sky Zenith**: `#0C78DE` blending smoothly into the horizon panorama

### Typography
- Primary Stack: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Dual Currency Display in Stand Detail Panel:
  - Top Line (Gold/Ivory): `USD <amount>` (e.g., `USD 3,200`)
  - Bottom Line (Mint Green): `KES <amount>` (e.g., `KES 416,000` @ 1 USD = 130 KES)

---

## 3. Architecture & File Structure

```
d:\Projects\EXHIBITION\
├── index.html                   # Core HTML entry point, glassmorphism UI overlays, navigation header
├── package.json                 # Project configuration & npm scripts (Vite, Three.js)
├── vite.config.js               # Dev server configuration (port 3000)
├── HANDOFF_AND_SPECIFICATION.md # [THIS FILE] Complete developer specification & handoff
├── ACTUAL_LAYOUT/               # Architectural reference images & AutoCAD floor layouts
│   └── 30 BY 80 EXHIBITION TENT LAYOUT 2.png
├── INSPIRATION/                 # Architectural visual reference photos (shell scheme, sky, layout)
│   ├── gettyimages-2212454644-612x612.jpg  (Open-sided shell scheme construction diagram)
│   ├── gettyimages-179982785-612x612.jpg   (Exhibition stand frames & rollup banners)
│   └── NAIROBI SKY INSPIRATION.png          (Skyline vector art inspiration)
├── src/
│   ├── main.js                  # Main coordinator, state management, event routing, raycasting, localStorage
│   ├── data/
│   │   └── booths.json          # Master manifest for all 196 booths (coordinates, sizes, types, pricing)
│   ├── scene/
│   │   ├── SceneManager.js      # Three.js WebGLRenderer, ACES tone mapping, sRGB color, lighting, RAF loop
│   │   ├── CameraManager.js     # Perspective 360°, Isometric Orthographic, Top View Orthographic cameras & transitions
│   │   ├── BoothBuilder.js      # Smart shell scheme builder (open sides, fascia boards, rollup banners, raycasting)
│   │   ├── TentBuilder.js       # Dynamic canopy roof with distance-based alpha fade, trusses, entrance arches
│   │   ├── FloorBuilder.js      # Textured grass landscape, tiled plaza, outdoor tea lounges, planter boxes
│   │   ├── PropBuilder.js       # Sprite billboard trees (Large/Med/Small), bushes, teardrop banners, wayfinding
│   │   └── SkylineBuilder.js    # 360° cylindrical panorama + sky zenith dome mapping Nairobi_skybox.png
│   ├── ui/
│   │   ├── SVGOverlay.js        # Interactive 2D master plan with high-contrast legend & direct booth selection
│   │   ├── Controls.js          # Bottom view mode switchers (Perspective 360°, Isometric, Top View, 2D Plan)
│   │   └── BoothPanel.js        # Slide-out stand reservation drawer with two-line dual currency (USD/KES)
│   ├── styles/
│   │   └── index.css            # Complete design system, glassmorphism panels, responsive layout, animations
│   └── textures/
│       ├── Bush_1.png           # Illustrated vector bush sprite (dense)
│       ├── Bush_2.png           # Illustrated vector bush sprite (round)
│       ├── Grass_Texture.jpg    # Seamless tiling grass texture (36x36 repeat)
│       ├── Nairobi_skybox.png   # 360° panoramic horizon texture (KICC, skyline, clouds)
│       ├── Tree_Large.png       # Illustrated vector shade tree sprite
│       ├── Tree_Medium.png      # Illustrated vector medium acacia tree sprite
│       └── Tree_Small.png       # Illustrated vector small garden tree sprite
```

---

## 4. Key Engineering Systems & Implementation Details

### 4.1 Shell Scheme Construction Logic (`BoothBuilder.js`)
- **Adjacency Computation (`_computeAdjacency`)**: Evaluates booth boundaries relative to all neighbor stands and tent perimeter walls.
- **Selective Solid Walls**: Solid partition walls are rendered **only** on sides backing an adjacent stand or tent perimeter wall.
- **Open Aisles & Fascia Rail**: Open sides have clear passage with top aluminum crossbars and dark green/white fascia boards spanning the entrance.
- **Rollup Banners (`_buildRollupBanners`)**: Retractable banner stands placed at aisle corners with tea summit graphics.

### 4.2 Dynamic Roof Canopy Opacity (`TentBuilder.js`)
- Roof canopy planes are angled to match the roof truss pitch.
- **Camera-Distance Fading**: When zooming in, roof fades out (`opacity → 0.0`) to reveal booth interiors; zooming out fades roof in (`opacity → 0.55`).
- **Focus Mode**: Selecting any booth immediately clears the roof for unobstructed viewing.

### 4.3 Render Order & Sprite Priority Hierarchy
- `Floor / Ground`: `renderOrder: 0`
- `Booth Meshes & Walls`: `renderOrder: 0`
- `Floating Booth Number Circles`: `renderOrder: 999`, `depthTest: false`
- `Pavilion Ridge Titles, Entrance Portals, Signs`: `renderOrder: 2000`, `depthTest: false`

### 4.4 Camera Modes (`CameraManager.js`)
1. **Perspective 360°**: Full 3D orbit controls (`THREE.PerspectiveCamera`, FOV 45, damping 0.05, turntable auto-rotation).
2. **Isometric**: Orthographic camera at true isometric angle (45° azimuth, 35.264° elevation).
3. **Top View**: Pure 2D orthographic top-down camera with pan/zoom.
4. **2D Master Plan**: High-resolution SVG overlay rendered from the JSON manifest with interactive selection.

### 4.5 Persistence & Dual Currency
- **State Persistence**: Selected stand IDs are saved to `localStorage` under `tea_summit_selected_booths` and restored automatically on page load.
- **Dual Currency**: Stand rates are formatted simultaneously in USD and KES on separate stacked lines.

---

## 5. Skybox Generation & Texture Specifications

| Texture | Type / Format | Resolution | Aspect Ratio | Three.js Usage |
| :--- | :--- | :--- | :--- | :--- |
| `Nairobi_skybox.png` | Panoramic Cylinder / Equirectangular | 4096 × 2048 | 2:1 | `CylinderGeometry(radius: 250, height: 135)` @ `y = 42` |
| `Grass_Texture.jpg` | Seamless Diffuse Texture | 1024 × 1024 | 1:1 | `PlaneGeometry(360, 360)`, `wrapS/T: Repeat`, `repeat(36, 36)` |
| `Tree_Large.png` | Alpha RGBA PNG Sprite | 512 × 512 | 1:1 | `SpriteMaterial` billboard |
| `Tree_Medium.png` | Alpha RGBA PNG Sprite | 512 × 512 | 1:1 | `SpriteMaterial` billboard |
| `Tree_Small.png` | Alpha RGBA PNG Sprite | 512 × 512 | 1:1 | `SpriteMaterial` billboard |
| `Bush_1.png` / `Bush_2.png` | Alpha RGBA PNG Sprite | 512 × 512 | 1:1 | `SpriteMaterial` billboard |

### AI Generation Prompt for Future Skybox Panoramas:
```text
360 degree equirectangular panorama 2:1 ratio, seamless panoramic skyline of Nairobi Kenya with iconic KICC cylinder tower and saucer, Times Tower, modern glass skyscrapers in vector flat illustration art style, bright clear azure blue sky with scattered puffy white clouds, distant green acacia parkland at the horizon line, horizon centered at the exact middle equator, VR 360 environment map, game asset, vibrant lighting, ultra clean --ar 2:1
```

---

## 6. How to Run, Test & Build

```bash
# 1. Navigate to project root
cd d:\Projects\EXHIBITION

# 2. Run local development server (Vite)
npm run dev
# Server starts at http://localhost:3000/

# 3. Validate production build
npm run build
# Outputs optimized static bundle to /dist
```

---

## 7. Recommended Next Phase Features

1. **Exhibitor Search & Filter Bar**: Real-time search filter for stand numbers, booth categories (Standard Shell, Double, Corner, VIP Lounge), and price ranges.
2. **Interactive Stand Booking Form**: Modal with exhibitor company details, contact info, invoice generation, and reservation submission to backend/Supabase API.
3. **PDF Stand Quotation Export**: Downloadable branded PDF with stand reservation summary, payment details, and floor plan map excerpt.
4. **Exhibitor Directory & Stand Customizer**: Allow booked stands to display custom company logos and branding on their 3D fascia boards.
