import * as THREE from 'three';

/**
 * FloorBuilder — builds perfectly aligned floors, plazas, and outdoor grounds:
 * 1. Surrounding vast green savanna lawn (Plane 350m × 350m)
 * 2. Main paved plaza grounds (Plane 110m × 95m)
 * 3. Pavilion A Dedicated Floor Pad (85m × 30m at x:47.5, z:25) with exact 3m grid
 * 4. Pavilion B Dedicated Floor Pad (85m × 20m at x:47.5, z:60) with exact 3m grid
 * 5. Central Outdoor Promenade connecting Pavilion A & B (x:47.5, z:45)
 * 6. Raised Teak Wooden Tea Tasting Deck with shade umbrellas
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
    const grassTexture = textureLoader.load('/src/textures/Grass_Texture.jpg');
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

    // 2. Main Paved Exhibition Plaza (stone pavement beneath both tents + outdoor areas)
    const plazaW = 110;
    const plazaL = 95;
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

    // 3. Pavilion A Dedicated Floor Pad (Exact bounds: x: 5 to 90, z: 10 to 40 => 85m × 30m)
    const tentAGeo = new THREE.PlaneGeometry(85, 30);
    const tentATexture = this._createTentGridTexture(85, 30, '#F5FAF7', '#1E5E3A', '#D4E2D9');
    const tentAMat = new THREE.MeshBasicMaterial({
      map: tentATexture,
      side: THREE.FrontSide
    });
    this.tentAFloor = new THREE.Mesh(tentAGeo, tentAMat);
    this.tentAFloor.rotation.x = -Math.PI / 2;
    this.tentAFloor.position.set(5 + 85 / 2, 0.01, 10 + 30 / 2); // (47.5, 0.01, 25.0)
    this.tentAFloor.name = 'tent-a-floor';
    groundsGroup.add(this.tentAFloor);

    // 4. Pavilion B Dedicated Floor Pad (Exact bounds: x: 5 to 90, z: 50 to 70 => 85m × 20m)
    const tentBGeo = new THREE.PlaneGeometry(85, 20);
    const tentBTexture = this._createTentGridTexture(85, 20, '#F0F6F2', '#143D2B', '#CFDFD5');
    const tentBMat = new THREE.MeshBasicMaterial({
      map: tentBTexture,
      side: THREE.FrontSide
    });
    this.tentBFloor = new THREE.Mesh(tentBGeo, tentBMat);
    this.tentBFloor.rotation.x = -Math.PI / 2;
    this.tentBFloor.position.set(5 + 85 / 2, 0.01, 50 + 20 / 2); // (47.5, 0.01, 60.0)
    this.tentBFloor.name = 'tent-b-floor';
    groundsGroup.add(this.tentBFloor);

    // 5. Central Outdoor Wooden Deck (x: 35 to 60, z: 41 to 49 => 25m × 8m)
    const deckGeo = new THREE.BoxGeometry(25, 0.12, 8);
    const deckMat = new THREE.MeshBasicMaterial({ color: 0x8B5A2B });
    const deck = new THREE.Mesh(deckGeo, deckMat);
    deck.position.set(47.5, 0.06, 45);
    groundsGroup.add(deck);

    // Outdoor Lounge Umbrellas & Tables on Wooden Deck
    this._buildOutdoorTeaLounge(groundsGroup, 47.5, 45);

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

  _buildOutdoorTeaLounge(group, centerX, centerZ) {
    const tableMat = new THREE.MeshBasicMaterial({ color: 0x4A3728 });
    const umbrellaMatWhite = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide });
    const umbrellaMatGreen = new THREE.MeshBasicMaterial({ color: 0x1E5E3A, side: THREE.DoubleSide });
    const poleMat = new THREE.MeshBasicMaterial({ color: 0xD0D0D0 });

    const tableOffsets = [
      [-8, -2], [-2.5, -2], [3.5, -2], [9, -2],
      [-8, 2],  [-2.5, 2],  [3.5, 2],  [9, 2]
    ];

    const chairMat = new THREE.MeshBasicMaterial({ color: 0x2C3E50 });
    const chairGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.45, 8);

    for (let i = 0; i < tableOffsets.length; i++) {
      const [ox, oz] = tableOffsets[i];
      const tx = centerX + ox;
      const tz = centerZ + oz;

      // Table cylinder
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 0.75, 12), tableMat);
      table.position.set(tx, 0.45, tz);
      group.add(table);

      // 3 Chairs around table
      for (let c = 0; c < 3; c++) {
        const angle = (c * Math.PI * 2) / 3;
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.set(tx + Math.cos(angle) * 1.3, 0.28, tz + Math.sin(angle) * 1.3);
        group.add(chair);
      }

      // Umbrella pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.8, 8), poleMat);
      pole.position.set(tx, 1.45, tz);
      group.add(pole);

      // Umbrella canopy
      const umbMat = i % 2 === 0 ? umbrellaMatWhite : umbrellaMatGreen;
      const umbrella = new THREE.Mesh(new THREE.ConeGeometry(1.6, 0.6, 12), umbMat);
      umbrella.position.set(tx, 2.7, tz);
      group.add(umbrella);
    }

    // Green Planter Boxes along deck perimeter
    const planterMat = new THREE.MeshBasicMaterial({ color: 0x143D2B });
    const bushMat = new THREE.MeshBasicMaterial({ color: 0x2E8B57 });
    const planterGeo = new THREE.BoxGeometry(2.5, 0.5, 0.6);
    const bushGeo = new THREE.SphereGeometry(0.45, 8, 6);

    const planterPositions = [
      [centerX - 11, centerZ - 3.8], [centerX - 6, centerZ - 3.8], [centerX + 6, centerZ - 3.8], [centerX + 11, centerZ - 3.8],
      [centerX - 11, centerZ + 3.8], [centerX - 6, centerZ + 3.8], [centerX + 6, centerZ + 3.8], [centerX + 11, centerZ + 3.8]
    ];

    for (const [px, pz] of planterPositions) {
      const box = new THREE.Mesh(planterGeo, planterMat);
      box.position.set(px, 0.35, pz);
      group.add(box);

      for (let bx = -0.8; bx <= 0.8; bx += 0.8) {
        const bush = new THREE.Mesh(bushGeo, bushMat);
        bush.position.set(px + bx, 0.75, pz);
        group.add(bush);
      }
    }
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
