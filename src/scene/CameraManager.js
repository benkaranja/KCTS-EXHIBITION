import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/**
 * CameraManager — manages Perspective, Isometric, and Top View cameras.
 * Supports Tent Filtering & Focus (All Tents, Tent 1, Tent 2).
 * Defaults to Perspective mode with turntable auto-rotation.
 */
export class CameraManager {
  constructor(renderer, venueWidth, venueLength) {
    this.renderer = renderer;
    this.venueWidth = venueWidth;
    this.venueLength = venueLength;
    
    // Default focus is 'all'
    this.currentTentFilter = 'all';
    this.centerX = 47.5;
    this.centerZ = 40.0;

    // View Mode
    this.mode = 'perspective';
    this.activeCamera = null;

    // Transition state
    this._transitioning = false;
    this._transitionProgress = 0;
    this._transitionDuration = 1.2;
    this._fromPos = new THREE.Vector3();
    this._toPos = new THREE.Vector3();
    this._fromTarget = new THREE.Vector3();
    this._toTarget = new THREE.Vector3();
    this._fromZoom = 1;
    this._toZoom = 1;

    // Auto-rotate in perspective mode
    this.autoRotate = true;
    this.autoRotateSpeed = 0.12;
    this._orbitAngle = Math.PI * 0.35;
    this._orbitRadius = 95;
    this._orbitElevation = 45;
    this._userInteracting = false;
    this._idleTimer = null;

    this._setupCameras();
    this._setupInteractionListeners();
  }

  _setupCameras() {
    const aspect = window.innerWidth / window.innerHeight;

    // 1. Orthographic camera for Isometric and Top Views
    const frustumSize = 95;
    this.orthoCamera = new THREE.OrthographicCamera(
      -frustumSize * aspect / 2,
      frustumSize * aspect / 2,
      frustumSize / 2,
      -frustumSize / 2,
      0.1,
      800
    );

    // 2. Perspective camera (Default)
    this.perspCamera = new THREE.PerspectiveCamera(45, aspect, 0.5, 900);
    this._setPerspectivePosition();

    this.activeCamera = this.perspCamera;

    // 3. OrbitControls attached to Perspective Camera
    this.orbitControls = new OrbitControls(this.perspCamera, this.renderer.domElement);
    this.orbitControls.enableDamping = true;
    this.orbitControls.dampingFactor = 0.06;
    this.orbitControls.minDistance = 15;
    this.orbitControls.maxDistance = 220;
    this.orbitControls.maxPolarAngle = Math.PI / 2 - 0.04;
    this.orbitControls.target.set(this.centerX, 2, this.centerZ);
    this.orbitControls.enabled = true;

    // 4. Ortho Controls for panning in Top / Iso View
    this.orthoControls = new OrbitControls(this.orthoCamera, this.renderer.domElement);
    this.orthoControls.enableDamping = true;
    this.orthoControls.dampingFactor = 0.06;
    this.orthoControls.enableRotate = false;
    this.orthoControls.minZoom = 0.4;
    this.orthoControls.maxZoom = 4.0;
    this.orthoControls.target.set(this.centerX, 0, this.centerZ);
    this.orthoControls.enabled = false;
  }

  _setPerspectivePosition() {
    const x = this.centerX + this._orbitRadius * Math.cos(this._orbitAngle);
    const z = this.centerZ + this._orbitRadius * Math.sin(this._orbitAngle);
    const y = this._orbitElevation;

    this.perspCamera.position.set(x, y, z);
    this.perspCamera.lookAt(this.centerX, 2, this.centerZ);
  }

  _setupInteractionListeners() {
    const onUserInteract = () => {
      this._userInteracting = true;
      clearTimeout(this._idleTimer);
      this._idleTimer = setTimeout(() => {
        this._userInteracting = false;
        if (this.mode === 'perspective') {
          const dx = this.perspCamera.position.x - this.centerX;
          const dz = this.perspCamera.position.z - this.centerZ;
          this._orbitAngle = Math.atan2(dz, dx);
          this._orbitRadius = Math.sqrt(dx * dx + dz * dz);
        }
      }, 6000);
    };

    const dom = this.renderer.domElement;
    dom.addEventListener('pointerdown', onUserInteract);
    dom.addEventListener('wheel', onUserInteract, { passive: true });
    dom.addEventListener('touchstart', onUserInteract, { passive: true });
  }

  setTentFocus(tentFilter) {
    this.currentTentFilter = tentFilter;

    if (tentFilter === 'tent-a') {
      this.centerX = 47.5;
      this.centerZ = 25.0; // Pavilion A center
      this._orbitRadius = 70;
      this._orbitElevation = 38;
    } else if (tentFilter === 'tent-b') {
      this.centerX = 47.5;
      this.centerZ = 60.0; // Pavilion B center
      this._orbitRadius = 65;
      this._orbitElevation = 35;
    } else {
      this.centerX = 47.5;
      this.centerZ = 40.0; // All venue center
      this._orbitRadius = 95;
      this._orbitElevation = 45;
    }

    // Trigger smooth transition to the focused tent center
    this.setMode(this.mode, true);
  }

  setMode(newMode, force = false) {
    if (newMode === this.mode && !force && !this._transitioning) return;

    this.mode = newMode;
    this.orbitControls.enabled = false;
    this.orthoControls.enabled = false;

    let targetPos, targetLookAt, targetZoom, targetCamera;

    switch (newMode) {
      case 'perspective':
        targetCamera = this.perspCamera;
        targetPos = new THREE.Vector3(
          this.centerX + this._orbitRadius * Math.cos(this._orbitAngle),
          this._orbitElevation,
          this.centerZ + this._orbitRadius * Math.sin(this._orbitAngle)
        );
        targetLookAt = new THREE.Vector3(this.centerX, 2, this.centerZ);
        targetZoom = 1;
        this.autoRotate = true;
        break;

      case 'isometric':
        targetCamera = this.orthoCamera;
        const isoDist = this.currentTentFilter === 'all' ? 110 : 75;
        // Looking from South perspective (-Math.PI * 0.75) so Booth 1 and entrance stay at the bottom
        targetPos = new THREE.Vector3(
          this.centerX + isoDist * Math.cos(-Math.PI * 0.75),
          isoDist * 0.82,
          this.centerZ + isoDist * Math.sin(-Math.PI * 0.75)
        );
        targetLookAt = new THREE.Vector3(this.centerX, 0, this.centerZ);
        targetZoom = this.currentTentFilter === 'all' ? 1.0 : 1.35;
        this.autoRotate = false;
        break;

      case 'top':
        targetCamera = this.orthoCamera;
        targetPos = new THREE.Vector3(this.centerX, 160, this.centerZ);
        targetLookAt = new THREE.Vector3(this.centerX, 0, this.centerZ);
        targetZoom = this.currentTentFilter === 'all' ? 1.1 : 1.5;
        this.autoRotate = false;
        break;

      default:
        return;
    }

    this._transitioning = true;
    this._transitionProgress = 0;

    this._fromPos.copy(this.activeCamera.position);
    this._toPos.copy(targetPos);
    this._fromTarget.copy(
      this.activeCamera === this.orthoCamera
        ? this.orthoControls.target
        : this.orbitControls.target
    );
    this._toTarget.copy(targetLookAt);
    this._fromZoom = this.orthoCamera.zoom;
    this._toZoom = targetZoom;

    if (targetCamera !== this.activeCamera) {
      targetCamera.position.copy(this.activeCamera.position);
      if (targetCamera === this.perspCamera) {
        targetCamera.lookAt(this._fromTarget);
      }
    }
    this.activeCamera = targetCamera;
  }

  update(dt) {
    if (this._transitioning) {
      this._transitionProgress += dt / this._transitionDuration;

      if (this._transitionProgress >= 1) {
        this._transitionProgress = 1;
        this._transitioning = false;

        if (this.mode === 'perspective') {
          this.orbitControls.enabled = true;
          this.orbitControls.target.copy(this._toTarget);
          const helpTip = document.getElementById('help-tip');
          if (helpTip) helpTip.classList.remove('hidden');
        } else if (this.mode === 'top' || this.mode === 'isometric') {
          this.orthoControls.enabled = true;
          this.orthoControls.target.copy(this._toTarget);
          const helpTip = document.getElementById('help-tip');
          if (helpTip) helpTip.classList.add('hidden');
        }
      }

      const t = this._easeInOutCubic(this._transitionProgress);
      const newPos = new THREE.Vector3().lerpVectors(this._fromPos, this._toPos, t);
      this.activeCamera.position.copy(newPos);

      const newTarget = new THREE.Vector3().lerpVectors(this._fromTarget, this._toTarget, t);

      if (this.activeCamera === this.orthoCamera) {
        this.orthoControls.target.copy(newTarget);
        this.orthoCamera.lookAt(newTarget);
        this.orthoCamera.zoom = this._fromZoom + (this._toZoom - this._fromZoom) * t;
        this.orthoCamera.updateProjectionMatrix();
      } else {
        this.orbitControls.target.copy(newTarget);
        this.perspCamera.lookAt(newTarget);
      }
    }

    // Auto-rotate in perspective mode
    if (this.autoRotate && this.mode === 'perspective' && !this._transitioning && !this._userInteracting) {
      this._orbitAngle += this.autoRotateSpeed * dt;
      const x = this.centerX + this._orbitRadius * Math.cos(this._orbitAngle);
      const z = this.centerZ + this._orbitRadius * Math.sin(this._orbitAngle);
      
      this.perspCamera.position.x = x;
      this.perspCamera.position.z = z;
      this.perspCamera.lookAt(this.centerX, 2, this.centerZ);
      this.orbitControls.target.set(this.centerX, 2, this.centerZ);
    }

    if (this.orbitControls.enabled) {
      this.orbitControls.update();
    }
    if (this.orthoControls.enabled) {
      this.orthoControls.update();
    }
  }

  resize() {
    const aspect = window.innerWidth / window.innerHeight;
    const frustumSize = 95;

    this.orthoCamera.left = -frustumSize * aspect / 2;
    this.orthoCamera.right = frustumSize * aspect / 2;
    this.orthoCamera.top = frustumSize / 2;
    this.orthoCamera.bottom = -frustumSize / 2;
    this.orthoCamera.updateProjectionMatrix();

    this.perspCamera.aspect = aspect;
    this.perspCamera.updateProjectionMatrix();
  }

  getActiveCamera() {
    return this.activeCamera;
  }

  pauseAutoRotate() {
    this.autoRotate = false;
  }

  resumeAutoRotate() {
    if (this.mode === 'perspective') {
      this.autoRotate = true;
    }
  }

  _easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }
}
