import * as THREE from 'three';

/**
 * Creates subtle environmental particle systems:
 * - Gentle ambient summer motes / pollen drifting across the parklands
 * - Subtle fountain mist spray over Central Park
 */
export function createParticleSystems(isMobile: boolean): {
  particleGroup: THREE.Group;
  updateParticles: (delta: number, elapsed: number) => void;
} {
  const particleGroup = new THREE.Group();
  particleGroup.name = 'EnvironmentalParticles';

  // Soft circular particle texture
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
  grad.addColorStop(0.3, 'rgba(254, 240, 138, 0.6)');
  grad.addColorStop(0.8, 'rgba(254, 240, 138, 0.15)');
  grad.addColorStop(1, 'rgba(254, 240, 138, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const particleTexture = new THREE.CanvasTexture(canvas);

  // System: Ambient Park & Village Breeze Motes
  const moteCount = isMobile ? 180 : 420;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(moteCount * 3);
  const moteVel = new Float32Array(moteCount * 3);

  for (let i = 0; i < moteCount; i++) {
    const i3 = i * 3;
    motePos[i3] = (Math.random() - 0.5) * 120;
    motePos[i3 + 1] = 0.5 + Math.random() * 18;
    motePos[i3 + 2] = (Math.random() - 0.5) * 120;

    moteVel[i3] = 0.4 + Math.random() * 0.6; // gentle breeze moving +X
    moteVel[i3 + 1] = (Math.random() - 0.5) * 0.2;
    moteVel[i3 + 2] = (Math.random() - 0.5) * 0.3;
  }

  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));

  const moteMat = new THREE.PointsMaterial({
    map: particleTexture,
    size: isMobile ? 1.0 : 1.4,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });

  const motePoints = new THREE.Points(moteGeo, moteMat);
  particleGroup.add(motePoints);

  const updateParticles = (delta: number, elapsed: number) => {
    const posArr = moteGeo.attributes.position.array as Float32Array;

    for (let i = 0; i < moteCount; i++) {
      const i3 = i * 3;
      posArr[i3] += (moteVel[i3] + Math.sin(elapsed * 0.8 + i) * 0.15) * delta * 4;
      posArr[i3 + 1] += (moteVel[i3 + 1] + Math.cos(elapsed * 0.5 + i) * 0.1) * delta;
      posArr[i3 + 2] += (moteVel[i3 + 2] + Math.sin(elapsed * 0.6 + i) * 0.1) * delta * 2;

      // Wrap around bounding volume
      if (posArr[i3] > 65) posArr[i3] = -65;
      if (posArr[i3] < -65) posArr[i3] = 65;
      if (posArr[i3 + 1] > 22) posArr[i3 + 1] = 0.5;
      if (posArr[i3 + 1] < 0.2) posArr[i3 + 1] = 20;
      if (posArr[i3 + 2] > 65) posArr[i3 + 2] = -65;
      if (posArr[i3 + 2] < -65) posArr[i3 + 2] = 65;
    }

    moteGeo.attributes.position.needsUpdate = true;
  };

  return {
    particleGroup,
    updateParticles,
  };
}
