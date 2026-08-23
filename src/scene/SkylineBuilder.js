import * as THREE from 'three';

/**
 * SkylineBuilder — renders the panoramic Nairobi skyline and atmospheric sky dome
 * using the new high-resolution Nairobi_skybox.png.
 */
export class SkylineBuilder {
  build(scene, venueWidth, venueLength) {
    const skylineGroup = new THREE.Group();
    skylineGroup.name = 'skyline-environment';

    const centerX = venueWidth / 2;
    const centerZ = venueLength / 2;

    const textureLoader = new THREE.TextureLoader();

    // 1. Sky Dome Zenith Cap (Smooth azure blue sky blending into top of panorama)
    const skyCapGeo = new THREE.SphereGeometry(265, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
    const skyCapMat = new THREE.MeshBasicMaterial({
      color: 0x0C78DE,
      side: THREE.BackSide,
      depthWrite: false
    });
    const skyCap = new THREE.Mesh(skyCapGeo, skyCapMat);
    skyCap.position.set(centerX, -2, centerZ);
    skylineGroup.add(skyCap);

    // 2. 360° Panoramic Horizon Cylinder mapping the new Nairobi_skybox.png
    const skyboxTexture = textureLoader.load('/src/textures/Nairobi_skybox.png');
    skyboxTexture.colorSpace = THREE.SRGBColorSpace;
    skyboxTexture.wrapS = THREE.RepeatWrapping;
    skyboxTexture.wrapT = THREE.ClampToEdgeWrapping;

    const cylRadius = 250;
    const cylHeight = 135;
    const cylGeo = new THREE.CylinderGeometry(cylRadius, cylRadius, cylHeight, 64, 1, true);

    const cylMat = new THREE.MeshBasicMaterial({
      map: skyboxTexture,
      side: THREE.BackSide,
      depthWrite: false
    });

    const cylMesh = new THREE.Mesh(cylGeo, cylMat);
    // Align city skyline base directly with the 3D ground level (y = 0)
    cylMesh.position.set(centerX, 42, centerZ);
    cylMesh.rotation.y = -Math.PI / 2; // Face iconic landmarks towards default camera
    skylineGroup.add(cylMesh);

    scene.add(skylineGroup);
    return skylineGroup;
  }
}
