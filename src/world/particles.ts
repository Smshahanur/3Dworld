import * as THREE from 'three';

/**
 * Creates high-fidelity floating particle systems:
 * - Ambient celestial motes & spores drifting through the island sky
 * - Swirling vortex energy particles spiraling around the Central Portal core
 * - Cascading waterfall mist particles at the cliff base
 */
export function createParticleSystems(isMobile: boolean): {
  particleGroup: THREE.Group;
  updateParticles: (delta: number, elapsed: number) => void;
} {
  const particleGroup = new THREE.Group();
  particleGroup.name = 'ParticleSystems';

  // 1. Soft glowing circular particle texture
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 30);
  grad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  grad.addColorStop(0.25, 'rgba(125, 211, 252, 0.85)');
  grad.addColorStop(0.65, 'rgba(168, 85, 247, 0.35)');
  grad.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 64, 64);

  const particleTexture = new THREE.CanvasTexture(canvas);

  // --- System A: Ambient Island Motes ---
  const moteCount = isMobile ? 300 : 750;
  const moteGeo = new THREE.BufferGeometry();
  const motePos = new Float32Array(moteCount * 3);
  const moteVel = new Float32Array(moteCount * 3);
  const moteCol = new Float32Array(moteCount * 3);

  const cCyan = new THREE.Color(0x38bdf8);
  const cViolet = new THREE.Color(0xc084fc);
  const cGold = new THREE.Color(0xfbbf24);

  for (let i = 0; i < moteCount; i++) {
    const i3 = i * 3;
    const radius = 6 + Math.random() * 42;
    const angle = Math.random() * Math.PI * 2;
    motePos[i3] = Math.cos(angle) * radius;
    motePos[i3 + 1] = -4 + Math.random() * 26;
    motePos[i3 + 2] = Math.sin(angle) * radius;

    moteVel[i3] = (Math.random() - 0.5) * 0.3;
    moteVel[i3 + 1] = 0.25 + Math.random() * 0.55; // gentle upward drift
    moteVel[i3 + 2] = (Math.random() - 0.5) * 0.3;

    const r = Math.random();
    const col = r < 0.45 ? cCyan : r < 0.8 ? cViolet : cGold;
    moteCol[i3] = col.r;
    moteCol[i3 + 1] = col.g;
    moteCol[i3 + 2] = col.b;
  }

  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePos, 3));
  moteGeo.setAttribute('color', new THREE.BufferAttribute(moteCol, 3));

  const moteMat = new THREE.PointsMaterial({
    size: isMobile ? 0.65 : 0.85,
    map: particleTexture,
    transparent: true,
    opacity: 0.88,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const motesPoints = new THREE.Points(moteGeo, moteMat);
  particleGroup.add(motesPoints);

  // --- System B: Swirling Portal Vortex Energy ---
  const vortexCount = isMobile ? 120 : 280;
  const vortexGeo = new THREE.BufferGeometry();
  const vortexPos = new Float32Array(vortexCount * 3);
  const vortexAngles = new Float32Array(vortexCount);
  const vortexDist = new Float32Array(vortexCount);

  for (let i = 0; i < vortexCount; i++) {
    const i3 = i * 3;
    vortexAngles[i] = Math.random() * Math.PI * 2;
    vortexDist[i] = 0.5 + Math.random() * 3.8;
    vortexPos[i3] = Math.cos(vortexAngles[i]) * vortexDist[i];
    vortexPos[i3 + 1] = 5.6 + (Math.random() - 0.5) * 1.6;
    vortexPos[i3 + 2] = Math.sin(vortexAngles[i]) * vortexDist[i];
  }

  vortexGeo.setAttribute('position', new THREE.BufferAttribute(vortexPos, 3));

  const vortexMat = new THREE.PointsMaterial({
    size: 0.7,
    map: particleTexture,
    color: 0x67e8f9,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const vortexPoints = new THREE.Points(vortexGeo, vortexMat);
  particleGroup.add(vortexPoints);

  function updateParticles(delta: number, elapsed: number) {
    // 1. Update ambient motes
    const pAttr = moteGeo.attributes.position as THREE.BufferAttribute;
    const arr = pAttr.array as Float32Array;

    for (let i = 0; i < moteCount; i++) {
      const i3 = i * 3;
      arr[i3 + 1] += moteVel[i3 + 1] * delta;
      arr[i3] += Math.sin(elapsed * 0.8 + i) * 0.02;
      arr[i3 + 2] += Math.cos(elapsed * 0.8 + i) * 0.02;

      if (arr[i3 + 1] > 28) {
        arr[i3 + 1] = -5;
      }
    }
    pAttr.needsUpdate = true;

    // 2. Update swirling vortex energy
    const vAttr = vortexGeo.attributes.position as THREE.BufferAttribute;
    const vArr = vAttr.array as Float32Array;

    for (let i = 0; i < vortexCount; i++) {
      const i3 = i * 3;
      vortexAngles[i] += delta * (1.8 + (4.0 - vortexDist[i]) * 0.8);
      // slowly spiral inward, then reset to outer radius
      vortexDist[i] -= delta * 0.45;
      if (vortexDist[i] < 0.4) {
        vortexDist[i] = 3.6 + Math.random() * 0.6;
      }

      vArr[i3] = Math.cos(vortexAngles[i]) * vortexDist[i];
      vArr[i3 + 1] = 5.6 + Math.sin(elapsed * 3.0 + i) * 0.4;
      vArr[i3 + 2] = Math.sin(vortexAngles[i]) * vortexDist[i];
    }
    vAttr.needsUpdate = true;
  }

  return { particleGroup, updateParticles };
}
