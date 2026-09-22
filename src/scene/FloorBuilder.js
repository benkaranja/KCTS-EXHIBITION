import * as THREE from 'three';
import grassTextureUrl from '../textures/Grass_Texture.jpg';

/**
 * FloorBuilder — builds aligned floors, plazas, and outdoor grounds:
 * 1. Surrounding green lawn landscape
 * 2. Main paved exhibition plaza (110m × 76m centered at z:40)
 * 3. Pavilion B Dedicated Floor Pad (85m × 30m at x:47.5, z:25)
 * 4. Pavilion A Dedicated Floor Pad (85m × 30m at x:47.5, z:55)
 * Touching boundary at z:40 with zero gap (no outdoor tea tasting area)
 */
export class FloorBuilder {
  constructor() {
    this.tentAFloor = null;
    this.tentBFloor = null;
  }

  build(scene, venueWidth, venueLength) {
    const groundsGroup = new THREE.Group();
    groundsGroup.name = 'grounds-environment';

    const centerX = venueWidth / 2;   // 47.5m
    const centerZ = venueLength / 2;  // 40.0m

    // 1. Vast outer green tea estate landscape with seamless grass texture
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load(grassTextureUrl);
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(36, 36);

    const grassGeo = new THREE.PlaneGeometry(360, 360);
    const grassMat = new THREE.MeshBasicMaterial({
      map: grassTexture,
      side: THREE.FrontSide
    });
    const grass = new THREE.Mesh(grassGeo, grassMat);
    grass.rotation.x = -Math.PI / 2;
    grass.position.set(centerX, -0.05, centerZ);
    groundsGroup.add(grass);

    // 2. Main Paved Exhibition Plaza (stone pavement beneath both tents + outdoor perimeter)
    const plazaW = 110;
    const plazaL = 76;
    const plazaGeo = new THREE.PlaneGeometry(plazaW, plazaL);
    
    const plazaTexture = this._createPavedPlazaTexture();
    const plazaMat = new THREE.MeshBasicMaterial({
      map: plazaTexture,
      side: THREE.FrontSide
    });
    const plaza = new THREE.Mesh(plazaGeo, plazaMat);
    plaza.rotation.x = -Math.PI / 2;
    plaza.position.set(centerX, -0.02, centerZ);
    plaza.name = 'plaza-pavement';
    groundsGroup.add(plaza);

    // 3. Pavilion B Dedicated Floor Pad (Exact bounds: x: 5 to 90, z: 10 to 40 => 85m × 30m)
    const tentBGeo = new THREE.PlaneGeometry(85, 30);
    const tentBTexture = this._createTentGridTexture(85, 30, '#F0F6F2', '#143D2B', '#CFDFD5');
    const tentBMat = new THREE.MeshBasicMaterial({
      map: tentBTexture,
      side: THREE.FrontSide
    });
    this.tentBFloor = new THREE.Mesh(tentBGeo, tentBMat);
    this.tentBFloor.rotation.x = -Math.PI / 2;
    this.tentBFloor.position.set(5 + 85 / 2, 0.01, 10 + 30 / 2); // (47.5, 0.01, 25.0)
    this.tentBFloor.name = 'tent-b-floor';
    groundsGroup.add(this.tentBFloor);

    // 4. Pavilion A Dedicated Floor Pad (Exact bounds: x: 5 to 90, z: 40 to 70 => 85m × 30m)
    const tentAGeo = new THREE.PlaneGeometry(85, 30);
    const tentATexture = this._createTentGridTexture(85, 30, '#F5FAF7', '#1E5E3A', '#D4E2D9');
    const tentAMat = new THREE.MeshBasicMaterial({
      map: tentATexture,
      side: THREE.FrontSide
    });
    this.tentAFloor = new THREE.Mesh(tentAGeo, tentAMat);
    this.tentAFloor.rotation.x = -Math.PI / 2;
    this.tentAFloor.position.set(5 + 85 / 2, 0.01, 40 + 30 / 2); // (47.5, 0.01, 55.0)
    this.tentAFloor.name = 'tent-a-floor';
    groundsGroup.add(this.tentAFloor);

    scene.add(groundsGroup);
    return groundsGroup;
  }

  _createPavedPlazaTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Stone paver base
    ctx.fillStyle = '#E5ECE7';
    ctx.fillRect(0, 0, 1024, 1024);

    // Subtle stone tile pattern
    ctx.strokeStyle = 'rgba(180, 195, 185, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 1024);
      ctx.stroke();
    }
    for (let y = 0; y <= 1024; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(1024, y);
      ctx.stroke();
    }

    // Outer garden border
    ctx.strokeStyle = '#123D24';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, 1008, 1008);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  _createTentGridTexture(widthM, lengthM, bgColor, borderColor, gridColor) {
    const canvas = document.createElement('canvas');
    const scale = 20; // 20 pixels per meter
    canvas.width = widthM * scale;
    canvas.height = lengthM * scale;
    const ctx = canvas.getContext('2d');

    // Base tent floor color
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3m booth grid lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 2;

    for (let x = 0; x <= widthM; x += 3) {
      ctx.beginPath();
      ctx.moveTo(x * scale, 0);
      ctx.lineTo(x * scale, canvas.height);
      ctx.stroke();
    }

    for (let z = 0; z <= lengthM; z += 3) {
      ctx.beginPath();
      ctx.moveTo(0, z * scale);
      ctx.lineTo(canvas.width, z * scale);
      ctx.stroke();
    }

    // Aisle lane highlighting (Perimeter & central aisles)
    ctx.fillStyle = 'rgba(46, 139, 87, 0.06)';
    ctx.fillRect(0, 0, canvas.width, 3 * scale); // south perimeter aisle
    ctx.fillRect(0, (lengthM - 3) * scale, canvas.width, 3 * scale); // north perimeter aisle

    // Perimeter brand border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }

  setTentVisibility(filter) {
    if (this.tentAFloor) {
      this.tentAFloor.visible = (filter === 'all' || filter === 'tent-a');
    }
    if (this.tentBFloor) {
      this.tentBFloor.visible = (filter === 'all' || filter === 'tent-b');
    }
  }
}
