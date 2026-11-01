import * as THREE from 'three';
import { MaterialLibrary } from './materials';

/**
 * Creates high-altitude atmospheric cumulus clouds drifting across the modern village sky.
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

  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.95,
    metalness: 0.05,
    transparent: true,
    opacity: 0.85,
  });

  const puffGeo = new THREE.DodecahedronGeometry(1.0, 1);
  const count = isMobile ? 12 : 22;

  // High sky cumulus cloud clusters drifting over the landscape
  for (let i = 0; i < count; i++) {
    const cluster = new THREE.Group();
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const r = 50 + Math.random() * 85;
    const y = 35 + Math.random() * 25;

    cluster.position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);

    // Each cloud cluster has 4-6 organic soft overlapping puffs
    const subCount = isMobile ? 3 : 5;
    for (let s = 0; s < subCount; s++) {
      const puff = new THREE.Mesh(puffGeo, cloudMaterial);
      const sx = (Math.random() - 0.5) * 14;
      const sy = (Math.random() - 0.5) * 3.5;
      const sz = (Math.random() - 0.5) * 14;
      puff.position.set(sx, sy, sz);

      const scaleX = 8.0 + Math.random() * 8.0;
      const scaleY = 3.5 + Math.random() * 4.0;
      const scaleZ = 8.0 + Math.random() * 8.0;
      puff.scale.set(scaleX, scaleY, scaleZ);

      cluster.add(puff);
      cloudPuffs.push(puff);
    }

    midClouds.add(cluster);
  }

  return {
    cloudGroup,
    midClouds,
    lowClouds,
    cloudPuffs,
  };
}
