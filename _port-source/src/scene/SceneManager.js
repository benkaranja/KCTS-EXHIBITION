import * as THREE from 'three';

/**
 * SceneManager — Three.js renderer, scene, atmospheric lighting, and animation loop.
 */
export class SceneManager {
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
    this.renderer.setClearColor(0x6BA4D8, 1); // Soft blue sky background
    this.renderer.sortObjects = true;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;

    // Atmospheric Kenyan sunlight
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.92);
    this.scene.add(ambient);

    // Warm sun directional light
    const sunLight = new THREE.DirectionalLight(0xFFF6E5, 0.65);
    sunLight.position.set(60, 100, 40);
    this.scene.add(sunLight);

    // Soft fill light from the horizon
    const skyFill = new THREE.DirectionalLight(0xD8EEF8, 0.35);
    skyFill.position.set(-50, 40, -40);
    this.scene.add(skyFill);

    window.addEventListener('resize', () => this.resize());
    return this;
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
  }

  onAnimate(callback) {
    this.animationCallbacks.push(callback);
  }

  startLoop(getCamera) {
    const animate = () => {
      this._rafId = requestAnimationFrame(animate);
      const dt = this.clock.getDelta();
      const elapsed = this.clock.getElapsedTime();

      for (const cb of this.animationCallbacks) {
        cb(dt, elapsed);
      }

      const camera = getCamera();
      if (camera) {
        this.renderer.render(this.scene, camera);
      }
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
