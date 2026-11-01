import * as THREE from 'three';
import { MaterialLibrary } from './materials';

/**
 * Creates layered atmospheric clouds:
 * - Low dense cloud sea beneath the floating island
 * - Mid-altitude puffy cumulus islands drifting across the periphery
 * - High-altitude wispy celestial rings
 */
export function createAtmosphericClouds(materials: MaterialLibrary, isMobile: boolean): {
  cloudGroup: THREE.Group;
  midClouds: THREE.Group;
  lowClouds: THREE.Group;
  cloudPuffs: THREE.Mesh[];
} {
  const cloudGroup = new THREE.Group();
  cloudGroup.name = 'AtmosphericClouds';
  const cloudPuffs: THREE.Mesh[] = [];

  const midClouds = new THREE.Group();
  const lowClouds = new THREE.Group();
  cloudGroup.add(midClouds);
  cloudGroup.add(lowClouds);

  const puffGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const count = isMobile ? 14 : 26;

  // 1. Mid-altitude volumetric cumulus formations
  for (let i = 0; i < count; i++) {
    const cluster = new THREE.Group();
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const r = 36 + Math.random() * 40;
    const y = -10 + Math.random() * 18;

    cluster.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);

    // Each cloud cluster has 4-6 organic soft overlapping puffs
    const subCount = isMobile ? 3 : 5;
    for (let s = 0; s < subCount; s++) {
      const puff = new THREE.Mesh(puffGeo, materials.cloudMat);
      const sx = (Math.random() - 0.5) * 7;
      const sy = (Math.random() - 0.5) * 2.5;
      const sz = (Math.random() - 0.5) * 7;
      puff.position.set(sx, sy, sz);

      const scaleX = 4.5 + Math.random() * 5.5;
      const scaleY = 2.0 + Math.random() * 2.8;
      const scaleZ = 4.5 + Math.random() * 5.5;
      puff.scale.set(scaleX, scaleY, scaleZ);

      cluster.add(puff);
      cloudPuffs.push(puff);
    }

    midClouds.add(cluster);
  }

  // 2. Low cloud sea drifting beneath island
  for (let i = 0; i < (isMobile ? 8 : 16); i++) {
    const angle = (i / (isMobile ? 8 : 16)) * Math.PI * 2;
    const r = 24 + Math.random() * 55;
    const y = -28 + Math.random() * 6;

    const lowPuff = new THREE.Mesh(puffGeo, materials.cloudMat);
    lowPuff.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
    lowPuff.scale.set(12 + Math.random() * 8, 3 + Math.random() * 3, 12 + Math.random() * 8);
    lowClouds.add(lowPuff);
  }

  // 3. Dense atmospheric mist cylinder bed
  const mistBedGeo = new THREE.CylinderGeometry(95, 120, 6, 32);
  const mistBedMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity: 0.52,
    depthWrite: false,
  });
  const mistBed = new THREE.Mesh(mistBedGeo, mistBedMat);
  mistBed.position.y = -32;
  cloudGroup.add(mistBed);

  return { cloudGroup, midClouds, lowClouds, cloudPuffs };
}
