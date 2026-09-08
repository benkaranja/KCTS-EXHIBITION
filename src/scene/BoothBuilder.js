import * as THREE from 'three';

/**
 * BoothBuilder — builds exhibition booths with authentic shell scheme architecture:
 * - Walls ONLY on sides that are up against another booth or an actual tent perimeter wall
 * - Open on all aisle sides with top aluminum frame and fascia board retained
 * - Corner booths open on 2 sides; inline booths open on 1 side; perimeter booths backed by tent wall
 * - Rollup banner stands placed outside booths along the aisles
 * - Double-sided partition walls and responsive color updating on selection
 */

const COLORS = {
  available:          0x2E8B57,
  available_light:    0x48B676,
  selected:           0xE67E22,
  selected_light:     0xF39C12,
  reserved:           0x607274,
  reserved_light:     0x8B9A9C,
  vip:                0x1B4D3E,
  vip_fascia:         0xC99738,

  hover_wall:         0xFF9F43,
  hover_floor:        0xF5891D,
  hover_fascia:       0xFFB366,

  floor_available:    0x236B43,
  floor_selected:     0xD35400,
  floor_reserved:     0x485658,
  floor_vip:          0x12362B,

  fascia_available:   0x1E5E3A,
  fascia_selected:    0xB34700,
  fascia_reserved:    0x3F4B4D,

  frame:              0xE6ECE8,
  desk:               0xD1DDD5
};

const WALL_HEIGHT = 2.4;
const WALL_THICKNESS = 0.05;
const POST_SIZE = 0.08;
const FASCIA_HEIGHT = 0.35;

export class BoothBuilder {
  constructor() {
    this.boothGroups = new Map(); // id -> THREE.Group
    this.boothData = new Map();   // id -> booth manifest data
    this.raycasterTargets = [];   // flat array of meshes for raycasting
    this.rollupGroup = null;
  }

  build(scene, booths) {
    const boothContainer = new THREE.Group();
    boothContainer.name = 'booths-container';

    // Index all booths by ID for adjacency lookup
    const boothMap = new Map(booths.map(b => [b.id, b]));

    for (const booth of booths) {
      const group = this._createBooth(booth, booths);
      boothContainer.add(group);
      this.boothGroups.set(booth.id, group);
      this.boothData.set(booth.id, { ...booth });
    }

    // Rollup banners temporarily disabled
    // this.rollupGroup = this._buildRollupBanners(booths);
    // boothContainer.add(this.rollupGroup);

    scene.add(boothContainer);
    return boothContainer;
  }

  /**
   * Computes which of the 4 sides (South, North, West, East) have an adjacent booth or tent wall.
   */
  _computeAdjacency(b, allBooths) {
    const tent = b.tent;
    const bx = b.x, by = b.y, bw = b.w, bh = b.h;
    const eps = 0.2;

    // Tent perimeter wall boundaries
    const isTentASouthWall = (tent === 'tent-a' && Math.abs(by - 10) < eps);
    const isTentANorthWall = (tent === 'tent-a' && Math.abs((by + bh) - 40) < eps);
    const isTentBSouthWall = (tent === 'tent-b' && Math.abs(by - 50) < eps);
    const isTentBNorthWall = (tent === 'tent-b' && Math.abs((by + bh) - 70) < eps);

    let hasSouthWall = isTentASouthWall || isTentBSouthWall;
    let hasNorthWall = isTentANorthWall || isTentBNorthWall;
    let hasWestWall = false;
    let hasEastWall = false;

    for (const o of allBooths) {
      if (o.id === b.id || o.tent !== tent) continue;
      const ox = o.x, oy = o.y, ow = o.w, oh = o.h;

      // Overlap checks
      const xOverlap = (Math.min(bx + bw, ox + ow) - Math.max(bx, ox)) > 0.5;
      const yOverlap = (Math.min(by + bh, oy + oh) - Math.max(by, oy)) > 0.5;

      // Neighbor to South (o is immediately below b)
      if (xOverlap && Math.abs((oy + oh) - by) < eps) {
        hasSouthWall = true;
      }
      // Neighbor to North (o is immediately above b)
      if (xOverlap && Math.abs(oy - (by + bh)) < eps) {
        hasNorthWall = true;
      }
      // Neighbor to West (o is immediately to the left of b)
      if (yOverlap && Math.abs((ox + ow) - bx) < eps) {
        hasWestWall = true;
      }
      // Neighbor to East (o is immediately to the right of b)
      if (yOverlap && Math.abs(ox - (bx + bw)) < eps) {
        hasEastWall = true;
      }
    }

    return { hasSouthWall, hasNorthWall, hasWestWall, hasEastWall };
  }

  _createBooth(booth, allBooths) {
    const group = new THREE.Group();
    group.name = `booth-${booth.id}`;
    group.userData = { boothId: booth.id, tent: booth.tent, type: 'booth' };

    const w = booth.w;
    const h = booth.h;
    const isVip = booth.type === 'vip' || booth.type === 'premium';

    const statusColor = isVip
      ? (booth.status === 'selected' ? COLORS.selected : COLORS.vip)
      : (booth.status === 'selected' ? COLORS.selected : (booth.color || COLORS.available));

    const floorColor = isVip
      ? (booth.status === 'selected' ? COLORS.floor_selected : COLORS.floor_vip)
      : (booth.status === 'selected' ? COLORS.floor_selected : (booth.color || COLORS.floor_available));

    const fasciaColor = isVip
      ? COLORS.vip_fascia
      : (booth.status === 'selected' ? COLORS.fascia_selected : (booth.fascia_bg || COLORS.fascia_available));

    // Materials
    const wallOuterMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(statusColor),
      side: THREE.DoubleSide
    });

    const frameMat = new THREE.MeshBasicMaterial({ color: COLORS.frame });
    const floorMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(floorColor), side: THREE.FrontSide });
    const fasciaMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(fasciaColor) });
    const deskMat = new THREE.MeshBasicMaterial({ color: COLORS.desk });

    // 1. Floor Pad
    const floorGeo = new THREE.PlaneGeometry(w - 0.04, h - 0.04);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(w / 2, 0.02, h / 2);
    floorMesh.userData = { boothId: booth.id, type: 'booth-floor' };
    group.add(floorMesh);
    this.raycasterTargets.push(floorMesh);

    // 2. Compute Adjacency: only keep walls up against another booth or tent wall
    const adj = this._computeAdjacency(booth, allBooths);

    // 3. Walls & Fascias on all 4 sides
    const railY = WALL_HEIGHT + FASCIA_HEIGHT;
    const railThick = POST_SIZE * 0.7;

    // --- South Side (z = 0) ---
    if (adj.hasSouthWall) {
      const southWallGeo = new THREE.BoxGeometry(w, WALL_HEIGHT, WALL_THICKNESS);
      const southWall = new THREE.Mesh(southWallGeo, wallOuterMat.clone());
      southWall.position.set(w / 2, WALL_HEIGHT / 2, WALL_THICKNESS / 2);
      southWall.userData = { boothId: booth.id, type: 'booth-wall' };
      group.add(southWall);
      this.raycasterTargets.push(southWall);
    } else {
      // Open South side -> Fascia Board
      const fasciaSGeo = new THREE.BoxGeometry(w, FASCIA_HEIGHT, WALL_THICKNESS * 1.5);
      const fasciaS = new THREE.Mesh(fasciaSGeo, fasciaMat.clone());
      fasciaS.position.set(w / 2, WALL_HEIGHT + FASCIA_HEIGHT / 2, 0);
      fasciaS.userData = { boothId: booth.id, type: 'booth-fascia' };
      group.add(fasciaS);
    }

    // --- North Side (z = h) ---
    if (adj.hasNorthWall) {
      const northWallGeo = new THREE.BoxGeometry(w, WALL_HEIGHT, WALL_THICKNESS);
      const northWall = new THREE.Mesh(northWallGeo, wallOuterMat.clone());
      northWall.position.set(w / 2, WALL_HEIGHT / 2, h - WALL_THICKNESS / 2);
      northWall.userData = { boothId: booth.id, type: 'booth-wall' };
      group.add(northWall);
      this.raycasterTargets.push(northWall);
    } else {
      // Open North side -> Fascia Board
      const fasciaNGeo = new THREE.BoxGeometry(w, FASCIA_HEIGHT, WALL_THICKNESS * 1.5);
      const fasciaN = new THREE.Mesh(fasciaNGeo, fasciaMat.clone());
      fasciaN.position.set(w / 2, WALL_HEIGHT + FASCIA_HEIGHT / 2, h);
      fasciaN.userData = { boothId: booth.id, type: 'booth-fascia' };
      group.add(fasciaN);
    }

    // --- West Side (x = 0) ---
    if (adj.hasWestWall) {
      const westWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, h);
      const westWall = new THREE.Mesh(westWallGeo, wallOuterMat.clone());
      westWall.position.set(WALL_THICKNESS / 2, WALL_HEIGHT / 2, h / 2);
      westWall.userData = { boothId: booth.id, type: 'booth-wall' };
      group.add(westWall);
      this.raycasterTargets.push(westWall);
    } else {
      // Open West side -> Fascia Board
      const fasciaWGeo = new THREE.BoxGeometry(WALL_THICKNESS * 1.5, FASCIA_HEIGHT, h);
      const fasciaW = new THREE.Mesh(fasciaWGeo, fasciaMat.clone());
      fasciaW.position.set(0, WALL_HEIGHT + FASCIA_HEIGHT / 2, h / 2);
      fasciaW.userData = { boothId: booth.id, type: 'booth-fascia' };
      group.add(fasciaW);
    }

    // --- East Side (x = w) ---
    if (adj.hasEastWall) {
      const eastWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, h);
      const eastWall = new THREE.Mesh(eastWallGeo, wallOuterMat.clone());
      eastWall.position.set(w - WALL_THICKNESS / 2, WALL_HEIGHT / 2, h / 2);
      eastWall.userData = { boothId: booth.id, type: 'booth-wall' };
      group.add(eastWall);
      this.raycasterTargets.push(eastWall);
    } else {
      // Open East side -> Fascia Board
      const fasciaEGeo = new THREE.BoxGeometry(WALL_THICKNESS * 1.5, FASCIA_HEIGHT, h);
      const fasciaE = new THREE.Mesh(fasciaEGeo, fasciaMat.clone());
      fasciaE.position.set(w, WALL_HEIGHT + FASCIA_HEIGHT / 2, h / 2);
      fasciaE.userData = { boothId: booth.id, type: 'booth-fascia' };
      group.add(fasciaE);
    }

    // 4. Aluminum Corner Frame Posts (4 posts per booth)
    const postGeo = new THREE.BoxGeometry(POST_SIZE, WALL_HEIGHT + FASCIA_HEIGHT, POST_SIZE);
    const postPositions = [[0, 0], [w, 0], [0, h], [w, h]];
    for (const [px, pz] of postPositions) {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(px, (WALL_HEIGHT + FASCIA_HEIGHT) / 2, pz);
      group.add(post);
    }

    // 5. Top Horizontal Frame Rails
    const backRail = new THREE.Mesh(new THREE.BoxGeometry(w, railThick, railThick), frameMat);
    backRail.position.set(w / 2, railY, 0);
    group.add(backRail);

    const frontRail = new THREE.Mesh(new THREE.BoxGeometry(w, railThick, railThick), frameMat);
    frontRail.position.set(w / 2, railY, h);
    group.add(frontRail);

    const leftRail = new THREE.Mesh(new THREE.BoxGeometry(railThick, railThick, h), frameMat);
    leftRail.position.set(0, railY, h / 2);
    group.add(leftRail);

    const rightRail = new THREE.Mesh(new THREE.BoxGeometry(railThick, railThick, h), frameMat);
    rightRail.position.set(w, railY, h / 2);
    group.add(rightRail);

    // 6. Reception Presentation Desk
    if (w >= 2.5 && h >= 2.5) {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.5), deskMat);
      desk.position.set(w / 2, 0.375, h * 0.45);
      group.add(desk);
    }

    // 7. Floating Number Circle Label
    const label = this._createLabel(booth.id.toString(), w, h, isVip);
    group.add(label);

    group.position.set(booth.x, 0, booth.y);
    return group;
  }

  _createLabel(text, boothW, boothH, isVip) {
    const canvas = document.createElement('canvas');
    const size = 128;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, size, size);

    ctx.fillStyle = isVip ? 'rgba(20, 61, 43, 0.95)' : 'rgba(26, 46, 36, 0.92)';
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isVip ? '#D4AF37' : '#52B788';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = isVip ? '#FFDF80' : '#FFFFFF';
    ctx.font = text.length > 3 ? 'bold 44px Inter, sans-serif' : 'bold 54px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, size / 2, size / 2 + 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      sizeAttenuation: true
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(boothW / 2, WALL_HEIGHT + FASCIA_HEIGHT + 0.75, boothH / 2);
    sprite.scale.set(1.9, 1.9, 1);
    sprite.renderOrder = 999;
    sprite.userData = { type: 'label' };

    return sprite;
  }

  /**
   * Builds simple, elegant rollup pull-up banner stands placed outside select booths
   * along aisle corners using the tea summit color shades (emerald green, gold, white).
   */
  _buildRollupBanners(booths) {
    const rollupGroup = new THREE.Group();
    rollupGroup.name = 'booth-rollup-banners';

    const bannerTexture = this._createRollupTexture();
    const bannerMat = new THREE.SpriteMaterial({
      map: bannerTexture,
      transparent: true,
      depthTest: true,
      depthWrite: false
    });

    const baseMat = new THREE.MeshBasicMaterial({ color: 0xCFD8DC });
    const baseGeo = new THREE.BoxGeometry(0.8, 0.08, 0.25);

    // Selected key booths to place rollup banner stands outside along walkways
    const rollupBoothIds = [
      3, 10, 17, 24, 31, 33, 40, 47, 49, 61, 70, 77, 84, 91, 100, 109, 123, 137, 139,
      201, 203, 210, 216, 222, 228, 234, 240, 246, 249, 250
    ];

    for (const id of rollupBoothIds) {
      const booth = booths.find(b => b.id === id);
      if (!booth) continue;

      // Position outside booth front entrance
      const rx = booth.x + (booth.w > 3 ? 0.8 : booth.w * 0.2);
      const rz = booth.tent === 'tent-a' ? booth.y + booth.h + 0.35 : booth.y - 0.35;

      // 1. Aluminum Base cassette
      const base = new THREE.Mesh(baseGeo, baseMat);
      base.position.set(rx, 0.04, rz);
      rollupGroup.add(base);

      // 2. Vertical banner sprite
      const sprite = new THREE.Sprite(bannerMat);
      sprite.position.set(rx, 1.1, rz);
      sprite.scale.set(0.75, 2.0, 1);
      rollupGroup.add(sprite);
    }

    return rollupGroup;
  }

  _createRollupTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    // Background gradient in Summit Shades
    const grad = ctx.createLinearGradient(0, 0, 0, 320);
    grad.addColorStop(0, '#0F3020');
    grad.addColorStop(0.45, '#1E5E3A');
    grad.addColorStop(1, '#2E8B57');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 320);

    // Gold accent header line
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(0, 0, 128, 8);
    ctx.fillRect(0, 314, 128, 6);

    // Tea Leaf motif
    const cx = 64, cy = 90;
    ctx.strokeStyle = '#D8F3DC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#D8F3DC';
    ctx.beginPath();
    ctx.ellipse(cx + 4, cy - 2, 10, 18, Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#D4AF37';
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy + 4, 8, 14, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    // Graphic decorative bars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(20, 160, 88, 4);
    ctx.fillRect(30, 175, 68, 3);
    ctx.fillRect(20, 190, 88, 3);

    ctx.fillStyle = '#FFDF80';
    ctx.fillRect(24, 230, 80, 18);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    return texture;
  }

  setTentVisibility(filter) {
    this.boothGroups.forEach((group, id) => {
      const data = this.boothData.get(id);
      if (!data) return;
      const isVisible = (filter === 'all' || data.tent === filter);
      group.visible = isVisible;
    });

    if (this.rollupGroup) {
      this.rollupGroup.visible = (filter === 'all' || filter === 'tent-a' || filter === 'tent-b');
    }
  }

  updateBoothStatus(id, status) {
    const group = this.boothGroups.get(id);
    const data = this.boothData.get(id);
    if (!group || !data) return;

    data.status = status;
    const isVip = data.type === 'vip' || data.type === 'premium';

    const statusColor = isVip
      ? (status === 'selected' ? COLORS.selected : COLORS.vip)
      : (COLORS[status] || COLORS.available);

    const floorColor = isVip
      ? (status === 'selected' ? COLORS.floor_selected : COLORS.floor_vip)
      : (COLORS[`floor_${status}`] || COLORS.floor_available);

    const fasciaColor = isVip
      ? (status === 'selected' ? COLORS.selected : COLORS.vip_fascia)
      : (COLORS[`fascia_${status}`] || COLORS.fascia_available);

    group.children.forEach(child => {
      if (child.userData?.type === 'booth-wall') {
        child.material.color.setHex(statusColor);
      }
      if (child.userData?.type === 'booth-floor') {
        child.material.color.setHex(floorColor);
      }
      if (child.userData?.type === 'booth-fascia') {
        child.material.color.setHex(fasciaColor);
      }
    });
  }

  highlightBooth(id) {
    const group = this.boothGroups.get(id);
    if (!group || !group.visible) return;

    // Store original colors before hover and apply orange hue
    group.children.forEach(child => {
      if (!child.material) return;
      if (child.userData?.type === 'booth-wall') {
        child.userData._origColor = child.material.color.getHex();
        child.material.color.setHex(COLORS.hover_wall);
      }
      if (child.userData?.type === 'booth-floor') {
        child.userData._origColor = child.material.color.getHex();
        child.material.color.setHex(COLORS.hover_floor);
      }
      if (child.userData?.type === 'booth-fascia') {
        child.userData._origColor = child.material.color.getHex();
        child.material.color.setHex(COLORS.hover_fascia);
      }
    });
    group.scale.set(1.03, 1.06, 1.03);
  }

  unhighlightBooth(id) {
    const group = this.boothGroups.get(id);
    if (!group) return;

    // Restore original colors
    group.children.forEach(child => {
      if (!child.material) return;
      if (child.userData?._origColor !== undefined) {
        child.material.color.setHex(child.userData._origColor);
        delete child.userData._origColor;
      }
    });
    group.scale.set(1, 1, 1);
  }

  getBoothAtRaycast(raycaster) {
    const visibleTargets = this.raycasterTargets.filter(mesh => mesh.parent && mesh.parent.visible);
    const intersects = raycaster.intersectObjects(visibleTargets);
    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hit.userData?.boothId !== undefined) {
        return hit.userData.boothId;
      }
    }
    return null;
  }

  getBoothData(id) {
    return this.boothData.get(id) || null;
  }

  getAllBoothData() {
    return Array.from(this.boothData.values());
  }
}
