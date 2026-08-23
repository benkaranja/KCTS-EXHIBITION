#!/usr/bin/env node
/**
 * scripts/build-exhibition.js
 *
 * Bundles three.js + OrbitControls + 3D exhibition scene into a single
 * self-hosted ESM module at src/assets/js/exhibition/three-view.js.
 *
 * Requirements:
 * - Pre-bundled into a single self-hosted ESM file
 * - esbuild with --minify
 * - Emits src/assets/js/exhibition/three-view.js
 * - Tested under asset budget JS/3D (720 KB ceiling)
 */

import * as esbuild from "esbuild";
import { statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const entryPoint = `
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ── Scene Manager ────────────────────────────────────────────────────────
class SceneManager {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.renderer = null;
    this.animationCallbacks = [];
    this.clock = new THREE.Clock();
    this._rafId = null;
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setClearColor(0x0f2e16, 1);
    this.renderer.sortObjects = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.92);
    this.scene.add(ambient);

    const sunLight = new THREE.DirectionalLight(0xFFF6E5, 0.65);
    sunLight.position.set(60, 100, 40);
    this.scene.add(sunLight);

    const skyFill = new THREE.DirectionalLight(0xD8EEF8, 0.35);
    skyFill.position.set(-50, 40, -40);
    this.scene.add(skyFill);

    window.addEventListener('resize', () => this.resize());
    return this;
  }

  resize() {
    if (this.renderer) {
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
  }

  onAnimate(cb) {
    this.animationCallbacks.push(cb);
  }

  startLoop(getCamera) {
    const animate = () => {
      this._rafId = requestAnimationFrame(animate);
      const dt = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();
      for (const cb of this.animationCallbacks) cb(dt, elapsed);
      const cam = getCamera();
      if (cam && this.renderer) this.renderer.render(this.scene, cam);
    };
    animate();
  }

  stopLoop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  getScene() { return this.scene; }
  getRenderer() { return this.renderer; }
}

// ── Camera Manager ──────────────────────────────────────────────────────
class CameraManager {
  constructor(renderer, venueWidth, venueLength) {
    this.renderer = renderer;
    this.venueWidth = venueWidth;
    this.venueLength = venueLength;
    this.centerX = 47.5;
    this.centerZ = 40.0;
    this.mode = 'perspective';
    this.activeCamera = null;

    this.autoRotate = true;
    this.autoRotateSpeed = 0.12;
    this._orbitAngle = Math.PI * 0.35;
    this._orbitRadius = 95;
    this._orbitElevation = 45;
    this._userInteracting = false;
    this._idleTimer = null;

    this._setupCameras();
  }

  _setupCameras() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 95;
    this.orthoCamera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      800
    );

    this.perspCamera = new THREE.PerspectiveCamera(45, aspect, 0.5, 900);
    this._setPerspectivePosition();
    this.activeCamera = this.perspCamera;

    this.orbitControls = new OrbitControls(this.perspCamera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.05;
    this.orbitControls.target.set(this.centerX, 2, this.centerZ);
    this.orbitControls.minDistance = 15;
    this.orbitControls.maxDistance = 220;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.02;

    const onUserInteract = () => {
      this.autoRotate = false;
      if (this._idleTimer) clearTimeout(this._idleTimer);
      this._idleTimer = setTimeout(() => {
        this.autoRotate = true;
      }, 6000);
    };

    this.orbitControls.addEventListener('start', onUserInteract);
    this.orbitControls.addEventListener('change', () => {
      if (this.mode === 'perspective') {
        const dx = this.perspCamera.position.x - this.centerX;
        const dz = this.perspCamera.position.z - this.centerZ;
        this._orbitAngle = Math.atan2(dx, dz);
        this._orbitRadius = Math.sqrt(dx * dx + dz * dz);
        this._orbitElevation = this.perspCamera.position.y;
      }
    });
  }

  _setPerspectivePosition() {
    const x = this.centerX + Math.sin(this._orbitAngle) * this._orbitRadius;
    const z = this.centerZ + Math.cos(this._orbitAngle) * this._orbitRadius;
    this.perspCamera.position.set(x, this._orbitElevation, z);
    this.perspCamera.lookAt(this.centerX, 2, this.centerZ);
  }

  setMode(mode) {
    this.mode = mode;
    const aspect = window.innerWidth / window.innerHeight;
    if (mode === 'top') {
      this.orthoCamera.position.set(this.centerX, 120, this.centerZ);
      this.orthoCamera.lookAt(this.centerX, 0, this.centerZ);
      this.orthoCamera.up.set(0, 0, -1);
      this.orthoCamera.zoom = 1.0;
      this.orthoCamera.updateProjectionMatrix();
      this.activeCamera = this.orthoCamera;
      this.orbitControls.enabled = false;
    } else if (mode === 'isometric') {
      const dist = 90;
      this.orthoCamera.position.set(this.centerX + dist, dist * 0.8, this.centerZ + dist);
      this.orthoCamera.lookAt(this.centerX, 0, this.centerZ);
      this.orthoCamera.up.set(0, 1, 0);
      this.orthoCamera.zoom = 1.1;
      this.orthoCamera.updateProjectionMatrix();
      this.activeCamera = this.orthoCamera;
      this.orbitControls.enabled = false;
    } else {
      this.activeCamera = this.perspCamera;
      this.orbitControls.enabled = true;
    }
  }

  update(dt) {
    if (this.mode === 'perspective') {
      if (this.autoRotate) {
        this._orbitAngle += this.autoRotateSpeed * dt;
        this._setPerspectivePosition();
      }
      this.orbitControls.update();
    }
  }

  resize() {
    const aspect = window.innerWidth / window.innerHeight;
    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();

    const frustumSize = 95;
    this.orthoCamera.left = -frustumSize * aspect / 2;
    this.orthoCamera.right = frustumSize * aspect / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = -frustumSize / 2;
    this.orthoCamera.updateProjectionMatrix();
  }

  getActiveCamera() { return this.activeCamera; }
}

// ── Floor & Grounds Builder ─────────────────────────────────────────────
class FloorBuilder {
  build(scene, venueWidth, venueLength) {
    const group = new THREE.Group();
    const cx = venueWidth / 2;
    const cz = venueLength / 2;

    // Outer Lawn
    const grassGeo = new THREE.PlaneGeometry(360, 360);
    const grassMat = new THREE.MeshBasicMaterial({ color: 0x14401e, side: THREE.FrontSide });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(cx, -0.05, cz);
    group.add(grass);

    // Plaza
    const plazaGeo = new THREE.PlaneGeometry(110, 95);
    const plazaMat = new THREE.MeshBasicMaterial({ color: 0xdfe7d9, side: THREE.FrontSide });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(cx, -0.02, cz);
    group.add(plaza);

    // Hall A Floor Pad
    const hallAGeo = new THREE.PlaneGeometry(85, 30);
    const hallAMat = new THREE.MeshBasicMaterial({ color: 0xf3f6ef, side: THREE.FrontSide });
    const hallAFloor = new THREE.Mesh(hallAGeo, hallAMat);
    hallAFloor.rotation.x = -Math.PI / 2;
    hallAFloor.position.set(47.5, 0, 25);
    group.add(hallAFloor);

    // Hall B Floor Pad
    const hallBGeo = new THREE.PlaneGeometry(85, 20);
    const hallBMat = new THREE.MeshBasicMaterial({ color: 0xf3f6ef, side: THREE.FrontSide });
    const hallBFloor = new THREE.Mesh(hallBGeo, hallBMat);
    hallBFloor.rotation.x = -Math.PI / 2;
    hallBFloor.position.set(47.5, 0, 60);
    group.add(hallBFloor);

    scene.add(group);
    return group;
  }
}

// ── Tent / Pavilion Builder ─────────────────────────────────────────────
class TentBuilder {
  constructor() {
    this.roofMaterials = [];
  }

  build(scene) {
    const group = new THREE.Group();
    // Hall A frame: x:5 to 90 (w:85), z:10 to 40 (d:30)
    group.add(this._buildTentStructure(5, 10, 85, 30, 5.5, 7.2, 0x2e7d32));
    // Hall B frame: x:5 to 90 (w:85), z:50 to 70 (d:20)
    group.add(this._buildTentStructure(5, 50, 85, 20, 4.8, 6.4, 0x14401e));
    scene.add(group);
    return group;
  }

  _buildTentStructure(x, z, width, length, height, ridgeHeight, frameColor) {
    const tentGroup = new THREE.Group();
    const frameMat = new THREE.MeshBasicMaterial({ color: frameColor });
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, height, 8);

    const postSpacing = 8.5;
    const numPosts = Math.floor(width / postSpacing);
    for (let i = 0; i <= numPosts; i++) {
      const px = i * postSpacing;
      const pS = new THREE.Mesh(postGeo, frameMat);
      pS.position.set(x + px, height / 2, z);
      tentGroup.add(pS);

      const pN = new THREE.Mesh(postGeo, frameMat);
      pN.position.set(x + px, height / 2, z + length);
      tentGroup.add(pN);
    }

    // Roof truss lines
    const lineMat = new THREE.LineBasicMaterial({ color: 0xa8bba1 });
    const ridgeZ = z + length / 2;
    for (let i = 0; i <= numPosts; i++) {
      const px = i * postSpacing;
      const pts = [
        new THREE.Vector3(x + px, height, z),
        new THREE.Vector3(x + px, ridgeHeight, ridgeZ),
        new THREE.Vector3(x + px, height, z + length)
      ];
      tentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lineMat));
    }

    // Roof Pitch Surface
    const roofMat = new THREE.MeshBasicMaterial({
      color: 0xf3f6ef,
      transparent: true,
      opacity: 0.22,
      side: THREE.DoubleSide
    });
    this.roofMaterials.push(roofMat);

    const southVerts = new Float32Array([
      x, height, z,
      x + width, height, z,
      x + width, ridgeHeight, ridgeZ,
      x, height, z,
      x + width, ridgeHeight, ridgeZ,
      x, ridgeHeight, ridgeZ
    ]);
    const southGeo = new THREE.BufferGeometry();
    southGeo.setAttribute('position', new THREE.BufferAttribute(southVerts, 3));
    tentGroup.add(new THREE.Mesh(southGeo, roofMat));

    const northVerts = new Float32Array([
      x, ridgeHeight, ridgeZ,
      x + width, ridgeHeight, ridgeZ,
      x + width, height, z + length,
      x, ridgeHeight, ridgeZ,
      x + width, height, z + length,
      x, height, z + length
    ]);
    const northGeo = new THREE.BufferGeometry();
    northGeo.setAttribute('position', new THREE.BufferAttribute(northVerts, 3));
    tentGroup.add(new THREE.Mesh(northGeo, roofMat));

    return tentGroup;
  }
}

// ── Booth 3D Builder ────────────────────────────────────────────────────
const BOOTH_COLORS = {
  available: 0xdfe7d9,
  held: 0xe0b13a,
  booked: 0x14401e,
  blocked: 0xc3d1bc,
  frame: 0xa8bba1
};

class BoothBuilder {
  constructor() {
    this.boothGroups = new Map();
    this.boothData = new Map();
    this.raycasterTargets = [];
  }

  build(scene, halls) {
    const container = new THREE.Group();
    const wallHeight = 2.4;

    for (const hall of halls) {
      for (const booth of hall.booths) {
        const group = new THREE.Group();
        group.name = 'booth-' + booth.id;
        group.userData = { boothId: booth.id };

        const w = booth.w;
        const h = booth.h;
        const color = BOOTH_COLORS[booth.status] || BOOTH_COLORS.available;

        // Floor
        const floorGeo = new THREE.PlaneGeometry(w - 0.08, h - 0.08);
        const floorMat = new THREE.MeshBasicMaterial({ color, side: THREE.FrontSide });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(booth.x + w / 2, 0.01, booth.y + h / 2);
        floor.userData = { boothId: booth.id };
        group.add(floor);
        this.raycasterTargets.push(floor);

        // Partition Walls (Back wall)
        const wallMat = new THREE.MeshBasicMaterial({ color: 0xf3f6ef, side: THREE.DoubleSide });
        const backWallGeo = new THREE.BoxGeometry(w, wallHeight, 0.05);
        const backWall = new THREE.Mesh(backWallGeo, wallMat);
        backWall.position.set(booth.x + w / 2, wallHeight / 2, booth.y + 0.025);
        group.add(backWall);

        // Corner Posts
        const postGeo = new THREE.BoxGeometry(0.06, wallHeight, 0.06);
        const postMat = new THREE.MeshBasicMaterial({ color: BOOTH_COLORS.frame });
        const p1 = new THREE.Mesh(postGeo, postMat);
        p1.position.set(booth.x + 0.03, wallHeight / 2, booth.y + h - 0.03);
        group.add(p1);
        const p2 = new THREE.Mesh(postGeo, postMat);
        p2.position.set(booth.x + w - 0.03, wallHeight / 2, booth.y + h - 0.03);
        group.add(p2);

        // Top Fascia Bar
        const fasciaGeo = new THREE.BoxGeometry(w, 0.35, 0.05);
        const fasciaMat = new THREE.MeshBasicMaterial({ color: 0x0f2e16 });
        const fascia = new THREE.Mesh(fasciaGeo, fasciaMat);
        fascia.position.set(booth.x + w / 2, wallHeight - 0.175, booth.y + h - 0.025);
        group.add(fascia);

        container.add(group);
        this.boothGroups.set(booth.id, group);
        this.boothData.set(booth.id, booth);
      }
    }

    scene.add(container);
    return container;
  }

  getBoothAtRaycast(raycaster) {
    const hits = raycaster.intersectObjects(this.raycasterTargets, false);
    if (hits.length > 0) {
      return hits[0].object.userData.boothId || null;
    }
    return null;
  }

  updateBoothStatus(id, status) {
    const group = this.boothGroups.get(id);
    if (!group) return;
    const color = BOOTH_COLORS[status] || BOOTH_COLORS.available;
    group.traverse((child) => {
      if (child.isMesh && child.geometry.type === 'PlaneGeometry') {
        child.material.color.setHex(color);
      }
    });
  }
}

// ── Entry export ────────────────────────────────────────────────────────
export function init3D(container, manifest, onSelectBooth) {
  container.innerHTML = '';
  container.hidden = false;

  const canvas = document.createElement('canvas');
  canvas.id = 'three-viewport-canvas';
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);

  // Top close / view toggle bar
  const overlayBar = document.createElement('div');
  overlayBar.style.position = 'fixed';
  overlayBar.style.top = '1.5rem';
  overlayBar.style.right = '1.5rem';
  overlayBar.style.zIndex = '110';
  overlayBar.style.display = 'flex';
  overlayBar.style.gap = '0.5rem';

  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  btnClose.textContent = 'Back to 2D plan';
  btnClose.className = 'plan-controls__btn plan-controls__btn--active';
  btnClose.addEventListener('click', () => {
    container.hidden = true;
    sceneManager.stopLoop();
  });
  overlayBar.appendChild(btnClose);
  container.appendChild(overlayBar);

  const sceneManager = new SceneManager(canvas);
  sceneManager.init();

  const cameraManager = new CameraManager(sceneManager.getRenderer(), 95, 80);

  const floorBuilder = new FloorBuilder();
  floorBuilder.build(sceneManager.getScene(), 95, 80);

  const tentBuilder = new TentBuilder();
  tentBuilder.build(sceneManager.getScene());

  const boothBuilder = new BoothBuilder();
  boothBuilder.build(sceneManager.getScene(), manifest.halls);

  // Raycasting for stand click
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

    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, cameraManager.getActiveCamera());
    const boothId = boothBuilder.getBoothAtRaycast(raycaster);
    if (boothId && onSelectBooth) {
      onSelectBooth(boothId);
    }
  });

  sceneManager.onAnimate((dt) => {
    cameraManager.update(dt);
  });

  sceneManager.startLoop(() => cameraManager.getActiveCamera());

  return {
    destroy: () => {
      sceneManager.stopLoop();
      container.hidden = true;
    },
    updateBoothStatus: (id, status) => {
      boothBuilder.updateBoothStatus(id, status);
    }
  };
}
`;

async function build() {
  const outDir = "src/assets/js/exhibition";
  const outFile = join(outDir, "three-view.js");

  if (!existsSync(outDir)) {
    mkdirSync(outDir, { recursive: true });
  }

  console.log("Bundling three-view.js with esbuild --minify...");

  const result = await esbuild.build({
    stdin: {
      contents: entryPoint,
      resolveDir: process.cwd(),
      loader: "js",
    },
    bundle: true,
    minify: true,
    format: "esm",
    target: "es2022",
    outfile: outFile,
    metafile: true,
  });

  const stat = statSync(outFile);
  const kb = (stat.size / 1024).toFixed(1);
  console.log(`Bundle complete: ${outFile} — ${stat.size} bytes (${kb} KB)`);

  if (stat.size > 737280) {
    console.error(`FAIL: Bundle exceeds 720 KB ceiling (${stat.size} > 737280 bytes)`);
    process.exit(1);
  }
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
