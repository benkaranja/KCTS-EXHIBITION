import * as THREE from 'three';

/**
 * SkylineBuilder — renders the stylized Nairobi City Skyline and Sky Dome
 * accurately modeled from the reference illustration (NAIROBI SKY INSPIRATION.png):
 * - Telecommunications needle tower with observation pod
 * - KICC cylindrical tower with saucer & conical amphitheatre
 * - Curved sail-shaped skyscraper with vibrant green fin
 * - Times Tower with stepped spire & green columns
 * - Sloped-roof modern glass high-rises
 * - Layered foreground savanna trees and lush green parkland
 * - Azure blue gradient sky with soft clouds
 */
export class SkylineBuilder {
  build(scene, venueWidth, venueLength) {
    const skylineGroup = new THREE.Group();
    skylineGroup.name = 'skyline-environment';

    const centerX = venueWidth / 2;
    const centerZ = venueLength / 2;

    // 1. Sky Dome Background
    const skyRadius = 260;
    const skyGeo = new THREE.SphereGeometry(skyRadius, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyTexture = this._createSkyTexture();
    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTexture,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skyMesh = new THREE.Mesh(skyGeo, skyMat);
    skyMesh.position.set(centerX, -5, centerZ);
    skylineGroup.add(skyMesh);

    // 2. Horizon Cylinder with Nairobi Skyline Inspiration Art
    const cylRadius = 220;
    const cylHeight = 75;
    const cylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 64, 1, true);
    const skylineTexture = this._createNairobiVectorSkylineTexture();
    const skylineMat = new THREE.MeshBasicMaterial({
      map: skylineTexture,
      transparent: true,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skylineMesh = new THREE.Mesh(cylGeo, skylineMat);
    skylineMesh.position.set(centerX, cylHeight / 2 - 3, centerZ);
    skylineGroup.add(skylineMesh);

    scene.add(skylineGroup);
    return skylineGroup;
  }

  _createSkyTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0.0, '#0F5A9E'); // Rich azure sky
    grad.addColorStop(0.35, '#2989D0');
    grad.addColorStop(0.70, '#75C0F5');
    grad.addColorStop(0.92, '#D2EAFB');
    grad.addColorStop(1.0, '#EDF6FC');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);

    // Soft procedural cloud layers
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    this._drawPuffyCloud(ctx, 160, 110, 110, 26);
    this._drawPuffyCloud(ctx, 460, 75, 150, 34);
    this._drawPuffyCloud(ctx, 780, 130, 120, 28);
    this._drawPuffyCloud(ctx, 950, 85, 90, 22);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  _drawPuffyCloud(ctx, cx, cy, w, h) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.5, h * 0.4, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - w * 0.25, cy + h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(cx + w * 0.25, cy + h * 0.1, w * 0.35, h * 0.35, 0, 0, Math.PI * 2);
    ctx.ellipse(cx - w * 0.1, cy - h * 0.2, w * 0.3, h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  /**
   * Generates a 360-degree panorama directly capturing the vector art style
   * of NAIROBI SKY INSPIRATION.png: green & silver buildings with dark outlines.
   */
  _createNairobiVectorSkylineTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    ctx.clearRect(0, 0, 2048, 512);

    const baseY = 440;

    // Distant mountain silhouette layer
    ctx.fillStyle = 'rgba(30, 75, 55, 0.2)';
    ctx.beginPath();
    ctx.moveTo(0, baseY);
    for (let x = 0; x <= 2048; x += 40) {
      const hill = Math.sin(x * 0.005) * 35 + Math.cos(x * 0.015) * 15;
      ctx.lineTo(x, baseY - 60 - hill);
    }
    ctx.lineTo(2048, baseY);
    ctx.closePath();
    ctx.fill();

    // Dark forest backdrop block layer
    ctx.fillStyle = '#0F3824';
    for (let x = 0; x < 2048; x += 60) {
      const bh = 90 + ((x * 17) % 80);
      ctx.fillRect(x, baseY - bh, 65, bh);
    }

    // Render Nairobi Skyline Landmarks in repeating clusters across 360°
    const clusterWidth = 1024;
    for (let offset = 0; offset < 2048; offset += clusterWidth) {
      this._drawNairobiInspirationCluster(ctx, offset, baseY);
    }

    // Layered foreground trees & parkland shrubs along the entire base
    this._drawForegroundParkland(ctx, baseY);

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.ClampToEdgeWrapping;
    return texture;
  }

  _drawNairobiInspirationCluster(ctx, ox, baseY) {
    // 1. Building 1: Low-rise modern office (grey with green square logo)
    this._drawBuilding1(ctx, ox + 60, baseY);

    // 2. Building 2: Green & Silver striped tower with arched portico
    this._drawBuilding2(ctx, ox + 170, baseY);

    // 3. Building 3: Telecommunications Needle Tower
    this._drawTelepostTower(ctx, ox + 290, baseY);

    // 4. Building 4: KICC Cylindrical Tower with saucer & conical amphitheatre
    this._drawKICCComplete(ctx, ox + 410, baseY);

    // 5. Building 5: Curved Sail Skyscraper (Britam/UAP style) with green structural fin
    this._drawSailTower(ctx, ox + 550, baseY);

    // 6. Building 6: Times Tower (stepped crown with spire and green trim)
    this._drawTimesTowerVector(ctx, ox + 680, baseY);

    // 7. Building 7: Sloped glass high-rise
    this._drawSlopedHighRise(ctx, ox + 810, baseY);

    // 8. Building 8: Secondary green tower
    this._drawBuilding8(ctx, ox + 920, baseY);
  }

  _drawBuilding1(ctx, x, baseY) {
    const w = 70;
    const h = 170;
    // Grey body
    ctx.fillStyle = '#8D99AE';
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    ctx.strokeStyle = '#1E2D24';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - w / 2, baseY - h, w, h);

    // Green square emblem
    ctx.fillStyle = '#2E7D4E';
    ctx.fillRect(x - 14, baseY - h + 15, 28, 28);
    ctx.strokeRect(x - 14, baseY - h + 15, 28, 28);

    // Windows
    ctx.fillStyle = '#1E2D24';
    for (let r = 0; r < 7; r++) {
      ctx.fillRect(x - 20, baseY - h + 55 + r * 14, 40, 5);
    }
  }

  _drawBuilding2(ctx, x, baseY) {
    const w = 75;
    const h = 210;
    // Green outer pillars
    ctx.fillStyle = '#2E7D4E';
    ctx.fillRect(x - w / 2, baseY - h, 14, h);
    ctx.fillRect(x + w / 2 - 14, baseY - h, 14, h);

    // Silver center
    ctx.fillStyle = '#D8E2DC';
    ctx.fillRect(x - w / 2 + 14, baseY - h + 15, w - 28, h - 15);

    // Outlines
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - w / 2, baseY - h, w, h);

    // Window grid
    ctx.fillStyle = '#142E1F';
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillRect(x - 16 + c * 12, baseY - h + 30 + r * 16, 8, 8);
      }
    }
  }

  _drawTelepostTower(ctx, x, baseY) {
    const totalH = 340;
    // Mast
    ctx.fillStyle = '#A8B2A1';
    ctx.fillRect(x - 4, baseY - totalH + 60, 8, totalH - 60);
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - 4, baseY - totalH + 60, 8, totalH - 60);

    // Octagonal Observation Pod (Green)
    ctx.fillStyle = '#2E7D4E';
    ctx.beginPath();
    ctx.moveTo(x - 18, baseY - totalH + 110);
    ctx.lineTo(x + 18, baseY - totalH + 110);
    ctx.lineTo(x + 28, baseY - totalH + 135);
    ctx.lineTo(x + 12, baseY - totalH + 155);
    ctx.lineTo(x - 12, baseY - totalH + 155);
    ctx.lineTo(x - 28, baseY - totalH + 135);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pod window strip
    ctx.fillStyle = '#D8F3DC';
    ctx.fillRect(x - 20, baseY - totalH + 128, 40, 10);
    ctx.strokeRect(x - 20, baseY - totalH + 128, 40, 10);

    // Spire top needle
    ctx.fillStyle = '#142E1F';
    ctx.fillRect(x - 1.5, baseY - totalH, 3, 60);
  }

  _drawKICCComplete(ctx, x, baseY) {
    const towerW = 60;
    const towerH = 290;

    // 1. KICC Main Cylindrical Tower Body
    ctx.fillStyle = '#6C757D';
    ctx.fillRect(x - towerW / 2, baseY - towerH, towerW, towerH);
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - towerW / 2, baseY - towerH, towerW, towerH);

    // Horizontal louvers (characteristic KICC texture)
    ctx.fillStyle = '#D8E2DC';
    for (let y = baseY - towerH + 20; y < baseY - 40; y += 12) {
      ctx.fillRect(x - towerW / 2 + 4, y, towerW - 8, 4);
    }

    // 2. KICC Revolving Restaurant Saucer Top
    const saucerW = 90;
    const saucerH = 22;
    ctx.fillStyle = '#495057';
    ctx.beginPath();
    ctx.ellipse(x, baseY - towerH - 4, saucerW / 2, saucerH / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Saucer green accent ring
    ctx.fillStyle = '#2E7D4E';
    ctx.beginPath();
    ctx.ellipse(x, baseY - towerH - 8, saucerW * 0.35, saucerH * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 3. KICC Conical Amphitheatre at Base (distinctive flower-like pleated cone)
    const coneW = 100;
    const coneH = 65;
    ctx.fillStyle = '#6C757D';
    ctx.beginPath();
    ctx.moveTo(x + 25, baseY - coneH);
    ctx.lineTo(x + 25 + coneW / 2, baseY - coneH + 30);
    ctx.lineTo(x + 25 + coneW * 0.35, baseY);
    ctx.lineTo(x + 25 - coneW * 0.35, baseY);
    ctx.lineTo(x + 25 - coneW / 2, baseY - coneH + 30);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Pleat lines
    ctx.strokeStyle = '#142E1F';
    ctx.beginPath();
    ctx.moveTo(x + 25, baseY - coneH);
    ctx.lineTo(x + 25, baseY);
    ctx.moveTo(x + 25, baseY - coneH);
    ctx.lineTo(x + 25 - 20, baseY);
    ctx.moveTo(x + 25, baseY - coneH);
    ctx.lineTo(x + 25 + 20, baseY);
    ctx.stroke();
  }

  _drawSailTower(ctx, x, baseY) {
    const w = 70;
    const h = 280;

    // Curved Sail Silhouette (Grey body)
    ctx.fillStyle = '#8D99AE';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY);
    ctx.lineTo(x - w / 2, baseY - h * 0.5);
    ctx.quadraticCurveTo(x - w * 0.3, baseY - h, x, baseY - h);
    ctx.lineTo(x + w * 0.1, baseY - h);
    ctx.quadraticCurveTo(x + w / 2, baseY - h * 0.6, x + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vibrant Green Structural Fin (Right edge)
    ctx.fillStyle = '#2E7D4E';
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, baseY - h);
    ctx.lineTo(x + w * 0.25, baseY - h + 15);
    ctx.quadraticCurveTo(x + w / 2 + 10, baseY - h * 0.5, x + w / 2 + 4, baseY);
    ctx.lineTo(x + w / 2 - 6, baseY);
    ctx.quadraticCurveTo(x + w * 0.4, baseY - h * 0.6, x + w * 0.1, baseY - h);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Horizontal louvers
    ctx.fillStyle = '#142E1F';
    for (let y = baseY - h + 40; y < baseY - 20; y += 14) {
      ctx.fillRect(x - w * 0.3, y, w * 0.5, 4);
    }
  }

  _drawTimesTowerVector(ctx, x, baseY) {
    const w = 75;
    const h = 270;

    // Main Silver Tower
    ctx.fillStyle = '#CED4DA';
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - w / 2, baseY - h, w, h);

    // Green Vertical Structural Ribs
    ctx.fillStyle = '#1E5E3A';
    ctx.fillRect(x - w / 2, baseY - h, 12, h);
    ctx.fillRect(x + w / 2 - 12, baseY - h, 12, h);
    ctx.strokeRect(x - w / 2, baseY - h, 12, h);
    ctx.strokeRect(x + w / 2 - 12, baseY - h, 12, h);

    // Stepped Crown & Spire
    ctx.fillStyle = '#6C757D';
    ctx.fillRect(x - 20, baseY - h - 25, 40, 25);
    ctx.strokeRect(x - 20, baseY - h - 25, 40, 25);

    ctx.fillStyle = '#142E1F';
    ctx.fillRect(x - 2, baseY - h - 60, 4, 35);

    // Windows
    for (let r = 0; r < 10; r++) {
      ctx.fillRect(x - 14, baseY - h + 20 + r * 20, 28, 8);
    }
  }

  _drawSlopedHighRise(ctx, x, baseY) {
    const w = 65;
    const h = 230;

    ctx.fillStyle = '#8D99AE';
    ctx.beginPath();
    ctx.moveTo(x - w / 2, baseY);
    ctx.lineTo(x - w / 2, baseY - h);
    ctx.lineTo(x + w / 2, baseY - h + 45);
    ctx.lineTo(x + w / 2, baseY);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Spire
    ctx.fillStyle = '#142E1F';
    ctx.fillRect(x - w / 2 + 6, baseY - h - 30, 3, 30);

    // Windows
    ctx.fillStyle = '#2E7D4E';
    for (let r = 0; r < 8; r++) {
      ctx.fillRect(x - w / 2 + 10, baseY - h + 40 + r * 18, 30, 8);
    }
  }

  _drawBuilding8(ctx, x, baseY) {
    const w = 55;
    const h = 180;
    ctx.fillStyle = '#2E7D4E';
    ctx.fillRect(x - w / 2, baseY - h, w, h);
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(x - w / 2, baseY - h, w, h);

    ctx.fillStyle = '#D8F3DC';
    for (let r = 0; r < 7; r++) {
      ctx.fillRect(x - 18, baseY - h + 18 + r * 20, 36, 8);
    }
  }

  _drawForegroundParkland(ctx, baseY) {
    // 1. Dark green background tree masses
    ctx.fillStyle = '#1B432C';
    for (let x = 0; x < 2048; x += 55) {
      const r = 26 + (x % 14);
      ctx.beginPath();
      ctx.arc(x + 20, baseY - 15, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Vibrant Mid-ground Trees
    ctx.fillStyle = '#2E7D4E';
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 2.0;

    for (let x = 10; x < 2048; x += 48) {
      const h = 42 + (x % 20);
      // Trunk
      ctx.fillStyle = '#543D2B';
      ctx.fillRect(x + 14, baseY - h * 0.5, 6, h * 0.5);

      // Crown
      ctx.fillStyle = (x % 3 === 0) ? '#38A169' : '#2E7D4E';
      ctx.beginPath();
      ctx.ellipse(x + 17, baseY - h * 0.7, 22, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // 3. Flat bottom ground bar (Deep savanna green)
    ctx.fillStyle = '#16402E';
    ctx.fillRect(0, baseY - 5, 2048, 512 - baseY + 5);
    ctx.strokeStyle = '#142E1F';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, baseY - 5);
    ctx.lineTo(2048, baseY - 5);
    ctx.stroke();
  }
}
