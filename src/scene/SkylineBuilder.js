import * as THREE from 'three';

/**
 * SkylineBuilder — renders the panoramic Nairobi skyline and atmospheric sky dome
 * using Nairobi_skybox.png for a 360° horizon with crisp vertical proportions.
 */
export class SkylineBuilder {
  build(scene, venueWidth, venueLength) {
    const skylineGroup = new THREE.Group();
    skylineGroup.name = 'skyline-environment';

    const centerX = venueWidth / 2;
    const centerZ = venueLength / 2;

    const textureLoader = new THREE.TextureLoader();

    // 1. Sky Dome Zenith Cap (Azure blue sky background)
    const skyCapGeo = new THREE.SphereGeometry(260, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyCapMat = new THREE.MeshBasicMaterial({
      color: 0x2A82D2,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skyCap = new THREE.Mesh(skyCapGeo, skyCapMat);
    skyCap.position.set(centerX, 0, centerZ);
    skylineGroup.add(skyCap);

    // 2. 360° Panoramic Horizon Cylinder with Nairobi_skybox.png
    const skyboxTexture = textureLoader.load('/src/textures/Nairobi_skybox.png');
    skyboxTexture.colorSpace = THREE.SRGBColorSpace;
    skyboxTexture.wrapS = THREE.RepeatWrapping;
    skyboxTexture.wrapT = THREE.ClampToEdgeWrapping;

    const cylRadius = 240;
    const cylHeight = 120;
    const cylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 64, 1, true);

    const cylMat = new THREE.MeshBasicMaterial({
      map: skyboxTexture,
      side: THREE.BackSide,
      depthWrite: false
    });

    const cylMesh = new THREE.Mesh(cylGeo, cylMat);
    // Position so that the skyline horizon in the texture aligns perfectly with the ground level (y ≈ 0)
    cylMesh.position.set(centerX, 42, centerZ);
    cylMesh.rotation.y = -Math.PI / 2; // Orient iconic KICC and towers towards default camera
    skylineGroup.add(cylMesh);

    scene.add(skylineGroup);
    return skylineGroup;
  }
}
