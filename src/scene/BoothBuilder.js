import * as THREE from 'three';

/**
 * BoothBuilder — generates booth meshes from manifest data with tent filtering.
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

  floor_available:    0x236B43,
  floor_selected:     0xD35400,
  floor_reserved:     0x485658,
  floor_vip:          0x12362B,

  fascia_available:   0x1E5E3A,
  fascia_selected:    0xB34700,
  fascia_reserved:    0x3F4B4D,

  frame:              0xE6ECE8,
  wallInner:          0xF9FBF9,
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
  }

  build(scene, booths) {
    const boothContainer = new THREE.Group();
    boothContainer.name = 'booths-container';

    for (const booth of booths) {
      const group = this._createBooth(booth);
      boothContainer.add(group);
      this.boothGroups.set(booth.id, group);
      this.boothData.set(booth.id, { ...booth });
    }

    scene.add(boothContainer);
    return boothContainer;
  }

  _createBooth(booth) {
    const group = new THREE.Group();
    group.name = `booth-${booth.id}`;
    group.userData = { boothId: booth.id, tent: booth.tent, type: 'booth' };

    const w = booth.w;
    const h = booth.h;
    const isVip = booth.type === 'vip' || booth.type === 'premium';

    const statusColor = isVip
      ? (booth.status === 'selected' ? COLORS.selected : COLORS.vip)
      : (COLORS[booth.status] || COLORS.available);

    const floorColor = isVip
      ? (booth.status === 'selected' ? COLORS.floor_selected : COLORS.floor_vip)
      : (COLORS[`floor_${booth.status}`] || COLORS.floor_available);

    const fasciaColor = isVip
      ? COLORS.vip_fascia
      : (COLORS[`fascia_${booth.status}`] || COLORS.fascia_available);

    // Materials
    const wallOuterMat = new THREE.MeshBasicMaterial({
      color: statusColor,
      side: THREE.DoubleSide
    });

    const frameMat = new THREE.MeshBasicMaterial({ color: COLORS.frame });
    const floorMat = new THREE.MeshBasicMaterial({ color: floorColor, side: THREE.FrontSide });
    const fasciaMat = new THREE.MeshBasicMaterial({ color: fasciaColor });
    const deskMat = new THREE.MeshBasicMaterial({ color: COLORS.desk });

    // Floor pad
    const floorGeo = new THREE.PlaneGeometry(w - 0.04, h - 0.04);
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.set(w / 2, 0.02, h / 2);
    floorMesh.userData = { boothId: booth.id, type: 'booth-floor' };
    group.add(floorMesh);
    this.raycasterTargets.push(floorMesh);

    // 1. Back wall
    const backWallGeo = new THREE.BoxGeometry(w, WALL_HEIGHT, WALL_THICKNESS);
    const backWall = new THREE.Mesh(backWallGeo, wallOuterMat.clone());
    backWall.position.set(w / 2, WALL_HEIGHT / 2, WALL_THICKNESS / 2);
    backWall.userData = { boothId: booth.id, type: 'booth-wall' };
    group.add(backWall);
    this.raycasterTargets.push(backWall);

    // Inner poster
    const posterGeo = new THREE.PlaneGeometry(w * 0.7, WALL_HEIGHT * 0.55);
    const posterMat = new THREE.MeshBasicMaterial({ color: 0xE2EBE5, side: THREE.DoubleSide });
    const poster = new THREE.Mesh(posterGeo, posterMat);
    poster.position.set(w / 2, WALL_HEIGHT * 0.58, WALL_THICKNESS + 0.01);
    group.add(poster);

    // 2. Left wall
    const sideWallGeo = new THREE.BoxGeometry(WALL_THICKNESS, WALL_HEIGHT, h);
    const leftWall = new THREE.Mesh(sideWallGeo, wallOuterMat.clone());
    leftWall.position.set(WALL_THICKNESS / 2, WALL_HEIGHT / 2, h / 2);
    leftWall.userData = { boothId: booth.id, type: 'booth-wall' };
    group.add(leftWall);
    this.raycasterTargets.push(leftWall);

    // 3. Right wall
    const rightWall = new THREE.Mesh(sideWallGeo, wallOuterMat.clone());
    rightWall.position.set(w - WALL_THICKNESS / 2, WALL_HEIGHT / 2, h / 2);
    rightWall.userData = { boothId: booth.id, type: 'booth-wall' };
    group.add(rightWall);
    this.raycasterTargets.push(rightWall);

    // 4 Corner Metal Posts
    const postGeo = new THREE.BoxGeometry(POST_SIZE, WALL_HEIGHT + FASCIA_HEIGHT, POST_SIZE);
    const postPositions = [[0, 0], [w, 0], [0, h], [w, h]];
    for (const [px, pz] of postPositions) {
      const post = new THREE.Mesh(postGeo, frameMat);
      post.position.set(px, (WALL_HEIGHT + FASCIA_HEIGHT) / 2, pz);
      group.add(post);
    }

    // Top Header Rails
    const railY = WALL_HEIGHT + FASCIA_HEIGHT;
    const railThick = POST_SIZE * 0.7;

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

    // Fascia Strip
    const fasciaGeo = new THREE.BoxGeometry(w, FASCIA_HEIGHT, WALL_THICKNESS * 1.5);
    const fascia = new THREE.Mesh(fasciaGeo, fasciaMat.clone());
    fascia.position.set(w / 2, WALL_HEIGHT + FASCIA_HEIGHT / 2, h);
    fascia.userData = { boothId: booth.id, type: 'booth-fascia' };
    group.add(fascia);

    // Counter Desk
    if (w >= 2.5 && h >= 2.5) {
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.75, 0.5), deskMat);
      desk.position.set(w / 2, 0.375, h * 0.45);
      group.add(desk);
    }

    // Floating High-Contrast Number Label
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

  setTentVisibility(filter) {
    this.boothGroups.forEach((group, id) => {
      const data = this.boothData.get(id);
      if (!data) return;
      const isVisible = (filter === 'all' || data.tent === filter);
      group.visible = isVisible;
    });
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
    group.scale.set(1.03, 1.06, 1.03);
  }

  unhighlightBooth(id) {
    const group = this.boothGroups.get(id);
    if (!group) return;
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
