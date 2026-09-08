/**
 * Kenya-China Tea Summit 2027 — Main Application Bootstrap
 * Wires 3D Three.js environment, dual pavilions, tent visibility toggle,
 * dynamic roof canopy opacity on zoom & booth selection,
 * 2D SVG overlay, and stand reservation state management.
 */
import * as THREE from 'three';
import { SceneManager } from './scene/SceneManager.js';
import { CameraManager } from './scene/CameraManager.js';
import { FloorBuilder } from './scene/FloorBuilder.js';
import { BoothBuilder } from './scene/BoothBuilder.js';
import { TentBuilder } from './scene/TentBuilder.js';
import { PropBuilder } from './scene/PropBuilder.js';
import { SkylineBuilder } from './scene/SkylineBuilder.js';
import { SVGOverlay } from './ui/SVGOverlay.js';
import { Controls } from './ui/Controls.js';
import { BoothPanel } from './ui/BoothPanel.js';
import boothManifest from './data/booths.json';
import './styles/index.css';

// ── Venue Dimensions ──
const VENUE_WIDTH = 95;
const VENUE_LENGTH = 80;

// ── App State ──
function loadSavedSelections() {
  try {
    const saved = localStorage.getItem('tea_summit_selected_booths');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch (e) {
    return new Set();
  }
}

const state = {
  selectedBooths: loadSavedSelections(),
  hoveredBoothId: null,
  activeTent: 'all',
  isPanelOpen: false
};

// ── Application Init ──
async function init() {
  const canvas = document.getElementById('three-canvas');
  const loadingScreen = document.getElementById('loading-screen');
  const svgContainer = document.getElementById('svg-overlay');

  // 1. Scene Manager (Sunlight & WebGL renderer)
  const sceneManager = new SceneManager(canvas);
  sceneManager.init();

  // 2. Camera Manager (Defaults to PERSPECTIVE mode with turntable auto-rotation)
  const cameraManager = new CameraManager(
    sceneManager.getRenderer(),
    VENUE_WIDTH,
    VENUE_LENGTH
  );

  window.addEventListener('resize', () => {
    sceneManager.resize();
    cameraManager.resize();
  });

  // 3. Nairobi Skyline Panorama (Temporarily disabled for clean blue sky gradient)
  // const skylineBuilder = new SkylineBuilder();
  // skylineBuilder.build(sceneManager.getScene(), VENUE_WIDTH, VENUE_LENGTH);

  // 4. Ground Environment, Plazas & Outdoor Tea Lounge
  const floorBuilder = new FloorBuilder();
  floorBuilder.build(sceneManager.getScene(), VENUE_WIDTH, VENUE_LENGTH);

  // 5. Dual Exhibition Tents (Pavilion A & Pavilion B) with Exact Roof Canopies
  const tentBuilder = new TentBuilder();
  tentBuilder.build(sceneManager.getScene(), VENUE_WIDTH, VENUE_LENGTH);

  // 6. 3D Booths (All 196 stands across Pavilion A & B)
  const boothBuilder = new BoothBuilder();
  boothBuilder.build(sceneManager.getScene(), boothManifest.booths);

  // 7. Clean White Teardrop Banners, Savanna Acacia Trees & Pathway Lights
  const propBuilder = new PropBuilder();
  propBuilder.build(sceneManager.getScene(), VENUE_WIDTH, VENUE_LENGTH);

  // 8. 2D Master SVG Plan Modal
  const svgOverlay = new SVGOverlay(
    svgContainer,
    boothManifest.booths,
    VENUE_WIDTH,
    VENUE_LENGTH
  );

  // 9. Booth Detail Slide-in Panel
  const boothPanel = new BoothPanel((boothId) => {
    toggleBoothSelection(boothId, boothBuilder, svgOverlay, boothPanel);
  });

  // Hook into panel close button to track panel state
  const closeBtn = document.getElementById('panel-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      state.isPanelOpen = false;
    });
  }
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') state.isPanelOpen = false;
  });

  // 10. SVG Click Handler
  svgOverlay.onBoothClick((boothId) => {
    toggleBoothSelection(boothId, boothBuilder, svgOverlay, boothPanel);
    const data = boothBuilder.getBoothData(boothId);
    if (data) {
      boothPanel.show(data);
      state.isPanelOpen = true;
    }
  });

  // 11. View & Tent Controls Bar
  const controls = new Controls(
    cameraManager,
    svgOverlay,
    (mode) => {
      // Mode change callback
    },
    (tent) => {
      state.activeTent = tent;
      
      floorBuilder.setTentVisibility(tent);
      tentBuilder.setTentVisibility(tent);
      boothBuilder.setTentVisibility(tent);

      cameraManager.setTentFocus(tent);

      svgOverlay.activeFilter = tent;
      const tabBtns = document.querySelectorAll('.svg-tab');
      tabBtns.forEach(t => t.classList.toggle('active', t.getAttribute('data-filter') === tent));
      svgOverlay.generateSVG();

      updateCounters(boothBuilder);
    }
  );

  // Default to perspective mode & all tents
  controls.setMode('perspective');
  controls.setTent('all');

  // 12. 3D Click & Hover Interaction (Raycasting)
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let pointerDownPos = new THREE.Vector2();

  canvas.addEventListener('pointerdown', (e) => {
    pointerDownPos.set(e.clientX, e.clientY);
  });

  canvas.addEventListener('pointerup', (e) => {
    const dx = e.clientX - pointerDownPos.x;
    const dy = e.clientY - pointerDownPos.y;
    if (Math.sqrt(dx * dx + dy * dy) > 6) return;

    if (svgOverlay.isVisible()) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraManager.getActiveCamera());
    const boothId = boothBuilder.getBoothAtRaycast(raycaster);

    if (boothId !== null) {
      const data = boothBuilder.getBoothData(boothId);
      if (data) {
        boothPanel.show(data);
        state.isPanelOpen = true;
      }
    } else {
      // Click on ground closes panel
      boothPanel.hide();
      state.isPanelOpen = false;
    }
  });

  // Hover Highlight
  canvas.addEventListener('pointermove', (e) => {
    if (svgOverlay.isVisible()) return;

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraManager.getActiveCamera());
    const boothId = boothBuilder.getBoothAtRaycast(raycaster);

    if (boothId !== state.hoveredBoothId) {
      if (state.hoveredBoothId !== null) {
        boothBuilder.unhighlightBooth(state.hoveredBoothId);
      }
      if (boothId !== null) {
        boothBuilder.highlightBooth(boothId);
        canvas.style.cursor = 'pointer';
      } else {
        canvas.style.cursor = 'default';
      }
      state.hoveredBoothId = boothId;
    }
  });

  // 13. Animation Loop (Updates camera & dynamic roof canopy opacity on zoom / booth selection)
  sceneManager.onAnimate((dt, elapsed) => {
    cameraManager.update(dt);

    // Calculate distance from active camera to venue center
    const cam = cameraManager.getActiveCamera();
    if (cam) {
      let cameraDist = 95;
      if (cam.isPerspectiveCamera) {
        const dx = cam.position.x - cameraManager.centerX;
        const dy = cam.position.y - 2;
        const dz = cam.position.z - cameraManager.centerZ;
        cameraDist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      } else if (cam.isOrthographicCamera) {
        cameraDist = 95 / cam.zoom;
      }

      // Update roof opacity dynamically: zooming out increases opacity, zooming in fades it out, clicking a booth removes it completely
      tentBuilder.updateRoofOpacity(cameraDist, state.isPanelOpen, dt);
    }
  });

  sceneManager.startLoop(() => cameraManager.getActiveCamera());

  // 14. Restore Saved Selections
  state.selectedBooths.forEach(id => {
    const data = boothBuilder.getBoothData(id);
    if (data) {
      data.status = 'selected';
      boothBuilder.updateBoothStatus(id, 'selected');
      svgOverlay.updateBoothStatus(id, 'selected');
    }
  });

  updateCounters(boothBuilder);

  // 15. Dismiss Loading Screen
  setTimeout(() => {
    loadingScreen.classList.add('fade-out');
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 700);
  }, 1200);
}

// ── State Helpers ──
function toggleBoothSelection(boothId, boothBuilder, svgOverlay, boothPanel) {
  const data = boothBuilder.getBoothData(boothId);
  if (!data) return;

  if (data.status === 'selected') {
    // Clicking the already-selected booth deselects it
    data.status = 'available';
    state.selectedBooths.delete(boothId);
    boothBuilder.updateBoothStatus(boothId, 'available');
    svgOverlay.updateBoothStatus(boothId, 'available');
    boothPanel.updateStatus('available');
  } else if (data.status === 'available') {
    // Deselect any previously selected booth first (single-select mode)
    for (const prevId of state.selectedBooths) {
      const prevData = boothBuilder.getBoothData(prevId);
      if (prevData) {
        prevData.status = 'available';
        boothBuilder.updateBoothStatus(prevId, 'available');
        svgOverlay.updateBoothStatus(prevId, 'available');
      }
    }
    state.selectedBooths.clear();

    // Select the new booth
    data.status = 'selected';
    state.selectedBooths.add(boothId);
    boothBuilder.updateBoothStatus(boothId, 'selected');
    svgOverlay.updateBoothStatus(boothId, 'selected');
    boothPanel.updateStatus('selected');
  } else {
    return;
  }

  try {
    localStorage.setItem('tea_summit_selected_booths', JSON.stringify(Array.from(state.selectedBooths)));
  } catch (e) {}

  updateCounters(boothBuilder);
}

function updateCounters(boothBuilder) {
  const all = boothBuilder.getAllBoothData();
  const filtered = all.filter(b => state.activeTent === 'all' || b.tent === state.activeTent);
  const available = filtered.filter(b => b.status === 'available').length;
  const selected = filtered.filter(b => b.status === 'selected').length;

  const availEl = document.getElementById('available-count');
  const selEl = document.getElementById('selected-count');
  if (availEl) availEl.textContent = available;
  if (selEl) selEl.textContent = selected;
}

// Boot application
init().catch(console.error);
