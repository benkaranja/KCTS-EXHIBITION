import * as THREE from 'three';

/**
 * PropBuilder — creates outdoor landscape and summit props:
 * - Crisp White Teardrop / Feather Flag Banners with green tea leaf emblems (TEXT-FREE)
 * - Sprite Trees using realistic illustrated textures (Tree_Large, Tree_Medium, Tree_Small)
 * - Sprite Bushes in all grass areas (Bush_1, Bush_2)
 * - Solar LED pathway lighting poles along outdoor boulevards
 * - Directional wayfinding boards (renderOrder: 2000, depthTest: false)
 */
export class PropBuilder {
  build(scene, venueWidth, venueLength) {
    const propsGroup = new THREE.Group();
    propsGroup.name = 'landscape-props';

    // 1. Text-Free White Teardrop Banners along Plazas & Entrances
    this._buildWhiteTeardropBanners(propsGroup, venueWidth, venueLength);

    // 2. Sprite Trees (Tree_Large, Tree_Medium, Tree_Small)
    this._buildSpriteTrees(propsGroup, venueWidth, venueLength);

    // 3. Sprite Bushes in Grass Areas (Bush_1, Bush_2)
    this._buildSpriteBushes(propsGroup, venueWidth, venueLength);

    // 4. Modern Pathway Lighting Poles
    this._buildPathLighting(propsGroup, venueWidth, venueLength);

    // 5. Summit Wayfinding Information Boards
    this._buildWayfindingSigns(propsGroup);

    scene.add(propsGroup);
    return propsGroup;
  }

  _buildWhiteTeardropBanners(group, venueWidth, venueLength) {
    const bannerTexture = this._createCleanWhiteBannerTexture();
    const bannerMat = new THREE.SpriteMaterial({
      map: bannerTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });

    const positions = [
      // South promenade of Pavilion A
      [8, 5], [20, 5], [32, 5], [44, 5], [56, 5], [68, 5], [80, 5], [92, 5],
      // Central Boulevard between Pavilion A & B
      [12, 45], [24, 45], [36, 45], [60, 45], [72, 45], [84, 45],
      // North promenade of Pavilion B
      [8, 75], [22, 75], [36, 75], [50, 75], [64, 75], [78, 75], [92, 75],
      // West Entrance & Registration Concourse
      [-2, 18], [-2, 28], [-2, 38], [-2, 48], [-2, 58],
      // East VIP & Shuttle area
      [96, 20], [96, 35], [96, 55], [96, 68]
    ];

    for (const [bx, bz] of positions) {
      const banner = new THREE.Sprite(bannerMat);
      banner.position.set(bx, 2.5, bz);
      banner.scale.set(2.8, 5.2, 1);
      group.add(banner);
    }
  }

  _createCleanWhiteBannerTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 160, 320);

    const cx = 80;

    // Curved Aluminum Pole
    ctx.strokeStyle = '#90A4AE';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, 310);
    ctx.lineTo(cx, 80);
    ctx.bezierCurveTo(cx, 28, cx - 12, 10, cx - 38, 12);
    ctx.stroke();

    // Pole Base / Water Weight Stand
    ctx.fillStyle = '#263238';
    ctx.beginPath();
    ctx.ellipse(cx, 312, 18, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Teardrop Fabric Shape
    ctx.beginPath();
    ctx.moveTo(cx - 38, 12);
    ctx.bezierCurveTo(cx + 44, 18, cx + 48, 75, cx + 34, 130);
    ctx.bezierCurveTo(cx + 20, 185, cx + 6, 235, cx, 260);
    ctx.lineTo(cx, 45);
    ctx.bezierCurveTo(cx, 25, cx - 18, 12, cx - 38, 12);
    ctx.closePath();

    const grad = ctx.createLinearGradient(cx - 38, 20, cx + 48, 260);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.75, '#F9FBF9');
    grad.addColorStop(1, '#E2EBE5');
    ctx.fillStyle = grad;
    ctx.fill();

    // Emerald border trim
    ctx.strokeStyle = '#1E5E3A';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Minimalist Tea Leaf Emblem (NO TEXT)
    const emX = cx + 5;
    const emY = 95;

    ctx.strokeStyle = 'rgba(201, 151, 56, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(emX, emY, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#1E5E3A';
    ctx.beginPath();
    ctx.ellipse(emX + 5, emY - 2, 13, 22, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#C99738';
    ctx.beginPath();
    ctx.ellipse(emX - 6, emY + 4, 9, 16, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#D8F3DC';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(emX - 8, emY + 16);
    ctx.quadraticCurveTo(emX + 4, emY - 2, emX + 16, emY - 14);
    ctx.stroke();

    ctx.fillStyle = '#1E5E3A';
    ctx.beginPath();
    ctx.moveTo(cx + 14, 205);
    ctx.lineTo(cx + 6, 235);
    ctx.lineTo(cx, 235);
    ctx.lineTo(cx, 205);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#C99738';
    ctx.beginPath();
    ctx.moveTo(cx + 6, 238);
    ctx.lineTo(cx + 2, 252);
    ctx.lineTo(cx, 252);
    ctx.lineTo(cx, 238);
    ctx.closePath();
    ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  _buildSpriteTrees(group, venueWidth, venueLength) {
    const loader = new THREE.TextureLoader();
    const treeLargeTex = loader.load('/src/textures/Tree_Large.png');
    const treeMedTex = loader.load('/src/textures/Tree_Medium.png');
    const treeSmallTex = loader.load('/src/textures/Tree_Small.png');

    const treeMats = [
      new THREE.SpriteMaterial({ map: treeLargeTex, transparent: true, depthTest: true, depthWrite: false }),
      new THREE.SpriteMaterial({ map: treeMedTex, transparent: true, depthTest: true, depthWrite: false }),
      new THREE.SpriteMaterial({ map: treeSmallTex, transparent: true, depthTest: true, depthWrite: false })
    ];

    const treeLocations = [
      // South Lawn
      [-8, -16], [12, -18], [28, -15], [45, -20], [62, -17], [80, -19], [98, -16], [115, -18],
      // North Lawn
      [-10, 95], [10, 98], [32, 94], [52, 99], [70, 95], [88, 97], [108, 96], [120, 94],
      // West Approach
      [-22, 5], [-26, 25], [-24, 45], [-25, 65], [-22, 85],
      // East Approach
      [118, 5], [122, 28], [119, 50], [123, 72], [117, 88]
    ];

    for (let i = 0; i < treeLocations.length; i++) {
      const [tx, tz] = treeLocations[i];
      const matIndex = i % 3; // Random distribution across tree textures
      const sprite = new THREE.Sprite(treeMats[matIndex]);

      const baseScale = 7.0 + (i % 4) * 1.5;
      const height = baseScale * 1.5;
      const width = baseScale * 0.9;

      sprite.position.set(tx, height / 2, tz);
      sprite.scale.set(width, height, 1);
      group.add(sprite);
    }
  }

  _buildSpriteBushes(group, venueWidth, venueLength) {
    const loader = new THREE.TextureLoader();
    const bush1Tex = loader.load('/src/textures/Bush_1.png');
    const bush2Tex = loader.load('/src/textures/Bush_2.png');

    const bushMats = [
      new THREE.SpriteMaterial({ map: bush1Tex, transparent: true, depthTest: true, depthWrite: false }),
      new THREE.SpriteMaterial({ map: bush2Tex, transparent: true, depthTest: true, depthWrite: false })
    ];

    const bushLocations = [
      // Surrounding South Plaza Perimeter
      [-3, -3], [5, -4], [15, -3], [25, -5], [35, -4], [48, -5], [58, -3], [68, -4], [78, -5], [88, -3], [98, -4], [105, -3],
      // Surrounding North Plaza Perimeter
      [-3, 85], [8, 86], [20, 84], [35, 87], [48, 85], [60, 86], [75, 84], [88, 86], [98, 85], [105, 86],
      // Surrounding West Plaza Edge
      [-12, 10], [-10, 22], [-14, 34], [-11, 46], [-13, 58], [-10, 70], [-12, 80],
      // Surrounding East Plaza Edge
      [104, 10], [107, 22], [105, 36], [108, 48], [104, 60], [107, 72], [105, 82],
      // Near Tree Bases
      [-6, -14], [14, -16], [30, -13], [64, -15], [82, -17], [100, -14],
      [-8, 93], [34, 92], [72, 93], [90, 95]
    ];

    for (let i = 0; i < bushLocations.length; i++) {
      const [bx, bz] = bushLocations[i];
      const matIndex = i % 2;
      const sprite = new THREE.Sprite(bushMats[matIndex]);

      const scale = 1.6 + (i % 3) * 0.4;
      sprite.position.set(bx, scale * 0.45, bz);
      sprite.scale.set(scale, scale * 0.9, 1);
      group.add(sprite);
    }
  }

  _buildPathLighting(group, venueWidth, venueLength) {
    const poleMat = new THREE.MeshBasicMaterial({ color: 0x78909C });
    const lampMat = new THREE.MeshBasicMaterial({ color: 0xFFF9C4 });

    const lampPositions = [
      [10, 42], [30, 42], [50, 42], [70, 42], [90, 42],
      [10, 48], [30, 48], [50, 48], [70, 48], [90, 48]
    ];

    const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 4.2, 6);
    const headGeo = new THREE.BoxGeometry(0.5, 0.12, 0.3);

    for (const [lx, lz] of lampPositions) {
      const pole = new THREE.Mesh(poleGeo, poleMat);
      pole.position.set(lx, 2.1, lz);
      group.add(pole);

      const head = new THREE.Mesh(headGeo, lampMat);
      head.position.set(lx, 4.2, lz);
      group.add(head);
    }
  }

  _buildWayfindingSigns(group) {
    const wayfindingMat = new THREE.MeshBasicMaterial({ color: 0x143D2B });

    const signPosts = [
      { x: 3, z: 25, title: 'PAVILION A · MAIN HALL ➔' },
      { x: 3, z: 55, title: 'PAVILION B · TEA INNOVATION ➔' },
      { x: 48, z: 41, title: '☕ OUTDOOR TEA TASTING LOUNGE' }
    ];

    for (const sign of signPosts) {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#0F3020';
      ctx.beginPath();
      ctx.roundRect(5, 5, 390, 90, 12);
      ctx.fill();

      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(sign.title, 200, 50);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        depthWrite: false
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.set(sign.x, 2.2, sign.z);
      sprite.scale.set(4.5, 1.1, 1);
      sprite.renderOrder = 2000;
      group.add(sprite);

      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.2, 6), wayfindingMat);
      p.position.set(sign.x, 1.1, sign.z);
      group.add(p);
    }
  }
}
