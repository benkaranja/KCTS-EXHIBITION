import * as THREE from 'three';

/**
 * TentBuilder — builds Pavilion A (30m x 85m) & Pavilion B (20m x 85m)
 * with mathematically exact truss-aligned roof geometries,
 * dynamic distance-based & selection-based transparency,
 * and high-priority camera-facing sprites (renderOrder: 2000, depthTest: false)
 * rendering on top of all elements including booth numbers.
 */
export class TentBuilder {
  constructor() {
    this.tentAGroup = null;
    this.tentBGroup = null;
    this.walkwayGroup = null;
    this.roofMaterials = [];
    this.wallMaterials = [];
    this.currentRoofOpacity = 0.18;
    this.targetRoofOpacity = 0.18;
    this.currentWallOpacity = 0.30;
    this.targetWallOpacity = 0.30;
  }

  build(scene, venueWidth, venueLength) {
    const tentsGroup = new THREE.Group();
    tentsGroup.name = 'all-tents-structure';

    // 1. Build Pavilion B (Innovation & Culture - North Tent: x:5 to 90, z:10 to 40)
    this.tentBGroup = this._buildTent({
      id: 'tent-b',
      name: 'PAVILION B — TEA INNOVATION & B2B MATCHMAKING',
      x: 5,
      z: 10,
      width: 85,
      length: 30,
      height: 4.8,
      ridgeHeight: 7.2,
      postSpacing: 8.5,
      colorTheme: 0x143D2B,
      badgeText: 'PAVILION B · INNOVATION & B2B'
    });
    tentsGroup.add(this.tentBGroup);

    // 2. Build Pavilion A (Main Exhibition Hall - South Tent: x:5 to 90, z:40 to 70)
    this.tentAGroup = this._buildTent({
      id: 'tent-a',
      name: 'PAVILION A — MAIN EXHIBITION HALL',
      x: 5,
      z: 40,
      width: 85,
      length: 30,
      height: 5.5,
      ridgeHeight: 7.2,
      postSpacing: 8.5,
      colorTheme: 0x1E5E3A,
      badgeText: 'PAVILION A · MAIN HALL'
    });
    tentsGroup.add(this.tentAGroup);

    // 3. Inter-Pavilion Portals & Boundary Arches (tents touch at z = 40)
    this.walkwayGroup = new THREE.Group();
    this.walkwayGroup.name = 'inter-tent-connections';
    this._addEntranceArch(this.walkwayGroup, 42.5, 40, 'INTER-PAVILION PASSAGE 1', 0x1E5E3A);
    this._addEntranceArch(this.walkwayGroup, 73.5, 40, 'INTER-PAVILION PASSAGE 2', 0x1E5E3A);

    // 4. Welcome Gate at South-West Arrival (outside Pavilion A Booth 1)
    this._buildWelcomeGate(this.walkwayGroup, 5, 67);

    // 5. Exit Gate at North-West Departure (outside Pavilion B Booth 148)
    this._buildExitGate(this.walkwayGroup, 5, 14);

    tentsGroup.add(this.walkwayGroup);

    // 6. Perimeter & Shared Touching Walls with Entry/Exit & Passage Openings
    this._buildWalls(tentsGroup);

    scene.add(tentsGroup);
    return tentsGroup;
  }

  _buildTent(config) {
    const { x, z, width, length, height, ridgeHeight, postSpacing, colorTheme, badgeText } = config;
    const tentGroup = new THREE.Group();
    tentGroup.name = config.id;

    const frameColor = 0xE0E6E2;
    const postMat = new THREE.MeshBasicMaterial({ color: frameColor });
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, height, 8);

    // Vertical Posts along South (z) and North (z + length) eaves
    for (let px = 0; px <= width; px += postSpacing) {
      const postS = new THREE.Mesh(postGeo, postMat);
      postS.position.set(x + px, height / 2, z);
      tentGroup.add(postS);

      const postN = new THREE.Mesh(postGeo, postMat);
      postN.position.set(x + px, height / 2, z + length);
      tentGroup.add(postN);
    }

    // Roof Truss Beams & Ridge Lines
    const frameLineMat = new THREE.LineBasicMaterial({ color: 0xF5FAF6, linewidth: 2 });
    const ridgeZ = z + length / 2;

    for (let px = 0; px <= width; px += postSpacing) {
      const beamPoints = [
        new THREE.Vector3(x + px, height, z),
        new THREE.Vector3(x + px, ridgeHeight, ridgeZ),
        new THREE.Vector3(x + px, height, z + length)
      ];
      const beamGeo = new THREE.BufferGeometry().setFromPoints(beamPoints);
      tentGroup.add(new THREE.Line(beamGeo, frameLineMat));
    }

    const southEave = [new THREE.Vector3(x, height, z), new THREE.Vector3(x + width, height, z)];
    const northEave = [new THREE.Vector3(x, height, z + length), new THREE.Vector3(x + width, height, z + length)];
    const ridgeLine = [new THREE.Vector3(x, ridgeHeight, ridgeZ), new THREE.Vector3(x + width, ridgeHeight, ridgeZ)];

    tentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(southEave), frameLineMat));
    tentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(northEave), frameLineMat));
    tentGroup.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ridgeLine), frameLineMat));

    // Semi-Transparent Roof Canopy Geometries
    const roofMat = new THREE.MeshBasicMaterial({
      color: 0xFAFCFA,
      transparent: true,
      opacity: 0.18,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.roofMaterials.push(roofMat);

    // South Pitch Canopy
    const southPitchGeo = new THREE.BufferGeometry();
    const southVertices = new Float32Array([
      x, height, z,
      x + width, height, z,
      x + width, ridgeHeight, ridgeZ,
      x, height, z,
      x + width, ridgeHeight, ridgeZ,
      x, ridgeHeight, ridgeZ
    ]);
    southPitchGeo.setAttribute('position', new THREE.BufferAttribute(southVertices, 3));
    southPitchGeo.computeVertexNormals();
    const southRoof = new THREE.Mesh(southPitchGeo, roofMat);
    tentGroup.add(southRoof);

    // North Pitch Canopy
    const northPitchGeo = new THREE.BufferGeometry();
    const northVertices = new Float32Array([
      x, ridgeHeight, ridgeZ,
      x + width, ridgeHeight, ridgeZ,
      x + width, height, z + length,
      x, ridgeHeight, ridgeZ,
      x + width, height, z + length,
      x, height, z + length
    ]);
    northPitchGeo.setAttribute('position', new THREE.BufferAttribute(northVertices, 3));
    northPitchGeo.computeVertexNormals();
    const northRoof = new THREE.Mesh(northPitchGeo, roofMat);
    tentGroup.add(northRoof);

    // Gable End Wall Triangles
    const westGableGeo = new THREE.BufferGeometry();
    const westGableVertices = new Float32Array([
      x, height, z,
      x, ridgeHeight, ridgeZ,
      x, height, z + length
    ]);
    westGableGeo.setAttribute('position', new THREE.BufferAttribute(westGableVertices, 3));
    westGableGeo.computeVertexNormals();
    const westGable = new THREE.Mesh(westGableGeo, roofMat);
    tentGroup.add(westGable);

    const eastGableGeo = new THREE.BufferGeometry();
    const eastGableVertices = new Float32Array([
      x + width, height, z,
      x + width, height, z + length,
      x + width, ridgeHeight, ridgeZ
    ]);
    eastGableGeo.setAttribute('position', new THREE.BufferAttribute(eastGableVertices, 3));
    eastGableGeo.computeVertexNormals();
    const eastGable = new THREE.Mesh(eastGableGeo, roofMat);
    tentGroup.add(eastGable);

    // Pavilion Ridge Sign Banner (renderOrder: 2000 — on top of all booth numbers)
    this._addPavilionSign(tentGroup, x + width / 2, ridgeHeight + 1.8, ridgeZ, badgeText);

    return tentGroup;
  }

  _addEntranceArch(group, cx, cz, label, colorHex) {
    const archMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const pillarGeo = new THREE.BoxGeometry(0.3, 3.8, 0.3);

    const p1 = new THREE.Mesh(pillarGeo, archMat);
    p1.position.set(cx - 2.8, 1.9, cz);
    group.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, archMat);
    p2.position.set(cx + 2.8, 1.9, cz);
    group.add(p2);

    const beam = new THREE.Mesh(new THREE.BoxGeometry(6.0, 0.5, 0.35), archMat);
    beam.position.set(cx, 3.8, cz);
    group.add(beam);

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0F3020';
    ctx.fillRect(0, 0, 512, 100);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 504, 92);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 30px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, 256, 50);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(cx, 4.6, cz);
    sprite.scale.set(5.5, 1.1, 1);
    sprite.renderOrder = 2000; // Render ON TOP of all elements & booth numbers
    group.add(sprite);
  }

  _addPavilionSign(group, x, y, z, text) {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 130;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = 'rgba(12, 42, 28, 0.98)';
    ctx.beginPath();
    ctx.roundRect(8, 8, 624, 114, 18);
    ctx.fill();

    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4.5;
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 34px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 320, 65);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,  // Guarantees it is NEVER occluded or clipped
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x, y, z);
    sprite.scale.set(11, 2.2, 1);
    sprite.renderOrder = 2000; // Top-priority rendering above booth numbers
    group.add(sprite);
  }

  _buildConnectingWalkway(group, centerX, startZ, length) {
    const walkwayMat = new THREE.MeshBasicMaterial({
      color: 0xFAFCFA,
      transparent: true,
      opacity: 0.25,
      side: THREE.DoubleSide
    });
    const postMat = new THREE.MeshBasicMaterial({ color: 0xDCE3DF });

    const canopy = new THREE.Mesh(new THREE.PlaneGeometry(6, length), walkwayMat);
    canopy.rotation.x = -Math.PI / 2;
    canopy.position.set(centerX, 3.8, startZ + length / 2);
    group.add(canopy);

    const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8);
    for (let z = startZ; z <= startZ + length; z += 3.3) {
      const pL = new THREE.Mesh(postGeo, postMat);
      pL.position.set(centerX - 3, 1.9, z);
      group.add(pL);

      const pR = new THREE.Mesh(postGeo, postMat);
      pR.position.set(centerX + 3, 1.9, z);
      group.add(pR);
    }
  }

  _buildWelcomeGate(group, x, z) {
    const gateMat = new THREE.MeshBasicMaterial({ color: 0x1E5E3A });

    const pylonGeo = new THREE.BoxGeometry(0.8, 6.0, 0.8);
    const p1 = new THREE.Mesh(pylonGeo, gateMat);
    p1.position.set(x - 6, 3.0, z - 8);
    group.add(p1);

    const p2 = new THREE.Mesh(pylonGeo, gateMat);
    p2.position.set(x - 6, 3.0, z + 8);
    group.add(p2);

    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 16.8), gateMat);
    truss.position.set(x - 6, 6.0, z);
    group.add(truss);

    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 160;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0F3020';
    ctx.fillRect(0, 0, 800, 160);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 6;
    ctx.strokeRect(6, 6, 788, 148);

    ctx.fillStyle = '#E8F5E9';
    ctx.font = 'bold 36px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KENYA-CHINA TEA SUMMIT 2027', 400, 55);

    ctx.fillStyle = '#C99738';
    ctx.font = '500 24px Inter, sans-serif';
    ctx.fillText('WELCOME · REGISTRATION & ACCREDITATION', 400, 110);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x - 6.2, 7.2, z);
    sprite.scale.set(12, 2.4, 1);
    sprite.renderOrder = 2000;
    group.add(sprite);
  }

  _buildExitGate(group, x, z) {
    const gateMat = new THREE.MeshBasicMaterial({ color: 0x143D2B });

    const pylonGeo = new THREE.BoxGeometry(0.8, 5.0, 0.8);
    const p1 = new THREE.Mesh(pylonGeo, gateMat);
    p1.position.set(x - 6, 2.5, z - 6);
    group.add(p1);

    const p2 = new THREE.Mesh(pylonGeo, gateMat);
    p2.position.set(x - 6, 2.5, z + 6);
    group.add(p2);

    const truss = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 12.8), gateMat);
    truss.position.set(x - 6, 5.0, z);
    group.add(truss);

    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#0F3020';
    ctx.fillRect(0, 0, 640, 140);
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, 630, 130);

    ctx.fillStyle = '#E8F5E9';
    ctx.font = 'bold 32px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('KENYA-CHINA TEA SUMMIT 2027', 320, 48);

    ctx.fillStyle = '#C99738';
    ctx.font = '600 22px Inter, sans-serif';
    ctx.fillText('SUMMIT EXIT · NORTH DEPARTURE', 320, 95);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(x - 6.2, 6.2, z);
    sprite.scale.set(9.5, 2.1, 1);
    sprite.renderOrder = 2000;
    group.add(sprite);
  }

  _buildWalls(group) {
    const wallGroup = new THREE.Group();
    wallGroup.name = 'tent-enclosure-walls';

    const wallMat = new THREE.MeshBasicMaterial({
      color: 0xEEF5F1,
      transparent: true,
      opacity: 0.30,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.wallMaterials.push(wallMat);

    const frameMat = new THREE.MeshBasicMaterial({ color: 0x143D2B });

    const createWallSegment = (x1, z1, x2, z2, height = 4.5) => {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const length = Math.sqrt(dx * dx + dz * dz);
      const angle = Math.atan2(dz, dx);
      const mx = (x1 + x2) / 2;
      const mz = (z1 + z2) / 2;

      // Translucent marquee wall curtain
      const panel = new THREE.Mesh(new THREE.PlaneGeometry(length, height), wallMat);
      panel.position.set(mx, height / 2, mz);
      panel.rotation.y = -angle;
      wallGroup.add(panel);

      // Baseboard / ground sill beam
      const sill = new THREE.Mesh(new THREE.BoxGeometry(length, 0.25, 0.16), frameMat);
      sill.position.set(mx, 0.125, mz);
      sill.rotation.y = -angle;
      wallGroup.add(sill);

      // Top eave rail
      const rail = new THREE.Mesh(new THREE.BoxGeometry(length, 0.18, 0.16), frameMat);
      rail.position.set(mx, height, mz);
      rail.rotation.y = -angle;
      wallGroup.add(rail);
    };

    // 1. Shared touching wall at z = 40 between Pavilion B and Pavilion A
    // (with openings for Passage 1 at x:40..45 and Passage 2 at x:71..76)
    createWallSegment(5, 40, 40, 40);   // West shared wall segment
    createWallSegment(45, 40, 71, 40);  // Center shared wall segment
    createWallSegment(76, 40, 90, 40);  // East shared wall segment

    // 2. Pavilion B North Perimeter Wall (z = 10, x: 5 to 90)
    createWallSegment(5, 10, 90, 10);

    // 3. Pavilion A South Perimeter Wall (z = 70, x: 5 to 90)
    createWallSegment(5, 70, 90, 70);

    // 4. East Perimeter Wall (x = 90, z: 10 to 70)
    createWallSegment(90, 10, 90, 70);

    // 5. West Perimeter Wall with Entry & Exit Openings (x = 5)
    // [Summit Exit Opening: z = 10 to 16, outside Booth 148]
    createWallSegment(5, 16, 5, 40); // Pavilion B West wall segment
    createWallSegment(5, 40, 5, 64); // Pavilion A West wall segment
    // [Main Entrance Opening: z = 64 to 70, outside Booth 1]

    // 6. Floor passage threshold carpets at Passage 1 & Passage 2
    const thresholdMat = new THREE.MeshBasicMaterial({ color: 0x1E5E3A, side: THREE.FrontSide });
    const p1Floor = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 1.2), thresholdMat);
    p1Floor.rotation.x = -Math.PI / 2;
    p1Floor.position.set(42.5, 0.015, 40.0);
    wallGroup.add(p1Floor);

    const p2Floor = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 1.2), thresholdMat);
    p2Floor.rotation.x = -Math.PI / 2;
    p2Floor.position.set(73.5, 0.015, 40.0);
    wallGroup.add(p2Floor);

    group.add(wallGroup);
  }

  updateRoofOpacity(cameraDistance, hasSelectedBooth, dt = 0.016) {
    if (hasSelectedBooth) {
      this.targetRoofOpacity = 0.0;
      this.targetWallOpacity = 0.04;
    } else {
      const minDistance = 45;
      const maxDistance = 140;
      const clampedDist = Math.max(minDistance, Math.min(maxDistance, cameraDistance));
      const factor = (clampedDist - minDistance) / (maxDistance - minDistance);
      this.targetRoofOpacity = Math.pow(factor, 1.4) * 0.55;
      this.targetWallOpacity = Math.pow(factor, 1.2) * 0.40;
    }

    this.currentRoofOpacity += (this.targetRoofOpacity - this.currentRoofOpacity) * Math.min(1, dt * 6.0);
    this.currentWallOpacity += (this.targetWallOpacity - this.currentWallOpacity) * Math.min(1, dt * 6.0);

    for (const mat of this.roofMaterials) {
      mat.opacity = this.currentRoofOpacity;
      mat.visible = this.currentRoofOpacity > 0.005;
    }
    for (const mat of this.wallMaterials) {
      mat.opacity = this.currentWallOpacity;
      mat.visible = this.currentWallOpacity > 0.005;
    }
  }

  setTentVisibility(filter) {
    if (this.tentAGroup) {
      this.tentAGroup.visible = (filter === 'all' || filter === 'tent-a');
    }
    if (this.tentBGroup) {
      this.tentBGroup.visible = (filter === 'all' || filter === 'tent-b');
    }
    if (this.walkwayGroup) {
      this.walkwayGroup.visible = (filter === 'all');
    }
  }
}
