import * as THREE from 'three';

/**
 * Procedural texture generators using 2D Canvas.
 * 100% zero-dependency, zero-404, high-fidelity PBR surfaces.
 */

// Procedural rock strata / cliff texture with erosion and moss veins
export function createRockTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Base stone gradient with rich earthy slate tones
  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, '#333e54');
  grad.addColorStop(0.35, '#22293a');
  grad.addColorStop(0.7, '#181e2b');
  grad.addColorStop(1, '#0f1420');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Geological sedimentary strata
  for (let i = 0; i < 60; i++) {
    const y = Math.random() * 512;
    const h = 2 + Math.random() * 12;
    const isLight = Math.random() > 0.45;
    ctx.fillStyle = isLight
      ? `rgba(90, 110, 145, ${0.12 + Math.random() * 0.18})`
      : `rgba(10, 15, 24, ${0.25 + Math.random() * 0.25})`;
    ctx.fillRect(0, y, 512, h);
  }

  // Micro-crevices and moss fissures
  for (let i = 0; i < 25; i++) {
    const y = Math.random() * 512;
    ctx.strokeStyle = Math.random() > 0.5 ? 'rgba(20, 80, 60, 0.22)' : 'rgba(5, 8, 15, 0.45)';
    ctx.lineWidth = 1 + Math.random() * 2;
    ctx.beginPath();
    let cx = 0;
    ctx.moveTo(cx, y);
    while (cx < 512) {
      cx += 15 + Math.random() * 25;
      ctx.lineTo(cx, y + (Math.random() - 0.5) * 8);
    }
    ctx.stroke();
  }

  // Organic fine noise speckling
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 28;
    data[i] = Math.min(255, Math.max(0, data[i] + noise));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural rich grass / moss texture with clover/wildflower accents
export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // Lush emerald-teal base
  const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 320);
  grad.addColorStop(0, '#105244');
  grad.addColorStop(0.5, '#0b3e34');
  grad.addColorStop(1, '#072b24');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 512, 512);

  // Soft moss & meadow patches
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const r = 12 + Math.random() * 45;
    const pGrad = ctx.createRadialGradient(x, y, 0, x, y, r);
    const rColor = Math.random();
    if (rColor < 0.45) {
      pGrad.addColorStop(0, 'rgba(46, 204, 113, 0.38)'); // vibrant emerald
    } else if (rColor < 0.8) {
      pGrad.addColorStop(0, 'rgba(26, 188, 156, 0.42)'); // teal shimmer
    } else {
      pGrad.addColorStop(0, 'rgba(234, 179, 8, 0.22)'); // golden lichen
    }
    pGrad.addColorStop(1, 'rgba(7, 43, 36, 0)');
    ctx.fillStyle = pGrad;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Micro foliage tufts
  ctx.fillStyle = 'rgba(74, 222, 128, 0.3)';
  for (let i = 0; i < 400; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    ctx.fillRect(x, y, 2, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural runic glyphs / celestial symbols for portal and temples
export function createRunicTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, 1024, 128);

  // Golden and cyan glowing celestial runes
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.shadowColor = '#38bdf8';
  ctx.shadowBlur = 12;

  for (let x = 20; x < 1000; x += 45) {
    ctx.beginPath();
    ctx.moveTo(x, 64);
    ctx.lineTo(x + 15, 18);
    ctx.lineTo(x + 30, 64);
    ctx.lineTo(x + 15, 110);
    ctx.closePath();
    ctx.stroke();

    // Inner orbital rings
    ctx.beginPath();
    ctx.arc(x + 15, 64, 7, 0, Math.PI * 2);
    ctx.fillStyle = Math.random() > 0.4 ? '#67e8f9' : '#facc15';
    ctx.fill();

    // Runic ticks
    ctx.beginPath();
    ctx.moveTo(x - 5, 64);
    ctx.lineTo(x + 35, 64);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(2, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural futuristic skyscraper window facade
export function createWindowFacadeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0b1324';
  ctx.fillRect(0, 0, 256, 512);

  const cols = 8;
  const rows = 24;
  const cellW = 256 / cols;
  const cellH = 512 / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const isLit = Math.random() > 0.35;
      const x = c * cellW + 3;
      const y = r * cellH + 3;
      const w = cellW - 6;
      const h = cellH - 6;

      if (isLit) {
        const hueChoice = Math.random();
        ctx.fillStyle = hueChoice < 0.65 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(251, 191, 36, 0.75)';
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 4;
      } else {
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.shadowBlur = 0;
      }
      ctx.fillRect(x, y, w, h);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural flowing water foam texture for waterfalls
export function createWaterFoamTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 0, 512);
  grad.addColorStop(0, 'rgba(56, 189, 248, 0.8)');
  grad.addColorStop(0.5, 'rgba(14, 165, 233, 0.9)');
  grad.addColorStop(1, 'rgba(125, 211, 252, 0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 512);

  // Vertical foaming speed-lines
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * 256;
    const y = Math.random() * 512;
    const h = 20 + Math.random() * 60;
    ctx.fillRect(x, y, 2 + Math.random() * 3, h);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface MaterialLibrary {
  rockMaterial: THREE.MeshStandardMaterial;
  rockCliffMaterial: THREE.MeshStandardMaterial;
  grassMaterial: THREE.MeshStandardMaterial;
  pathStoneMaterial: THREE.MeshStandardMaterial;
  woodMaterial: THREE.MeshStandardMaterial;
  portalObsidian: THREE.MeshStandardMaterial;
  portalGold: THREE.MeshStandardMaterial;
  portalCore: THREE.MeshStandardMaterial;
  runicRing: THREE.MeshStandardMaterial;
  crystalCyan: THREE.MeshPhysicalMaterial;
  crystalViolet: THREE.MeshPhysicalMaterial;
  crystalGold: THREE.MeshPhysicalMaterial;
  templeWhite: THREE.MeshStandardMaterial;
  templeGold: THREE.MeshStandardMaterial;
  templeTiles: THREE.MeshStandardMaterial;
  cityCeramic: THREE.MeshStandardMaterial;
  cityFacade: THREE.MeshStandardMaterial;
  cityGlass: THREE.MeshPhysicalMaterial;
  cityGlowCyan: THREE.MeshStandardMaterial;
  treeBark: THREE.MeshStandardMaterial;
  treeFoliageTeal: THREE.MeshStandardMaterial;
  treeFoliageViolet: THREE.MeshStandardMaterial;
  flowerPetalMat: THREE.MeshStandardMaterial;
  mushroomCap: THREE.MeshStandardMaterial;
  waterfallMat: THREE.MeshStandardMaterial;
  waterfallFoamTex: THREE.CanvasTexture;
  beaconMat: THREE.MeshBasicMaterial;
  cloudMat: THREE.MeshStandardMaterial;
}

export function createMaterialLibrary(isSoftwareGl: boolean): MaterialLibrary {
  const rockTex = createRockTexture();
  const grassTex = createGrassTexture();
  const runicTex = createRunicTexture();
  const windowTex = createWindowFacadeTexture();
  const waterfallFoamTex = createWaterFoamTexture();

  const rockMaterial = new THREE.MeshStandardMaterial({
    map: rockTex,
    roughness: 0.86,
    metalness: 0.14,
    color: 0x93a4be,
    bumpMap: rockTex,
    bumpScale: 0.12,
  });

  const rockCliffMaterial = new THREE.MeshStandardMaterial({
    map: rockTex,
    roughness: 0.92,
    metalness: 0.08,
    color: 0x6e7e96,
    bumpMap: rockTex,
    bumpScale: 0.22,
  });

  const grassMaterial = new THREE.MeshStandardMaterial({
    map: grassTex,
    roughness: 0.72,
    metalness: 0.04,
    color: 0x34d399,
    bumpMap: grassTex,
    bumpScale: 0.06,
  });

  const pathStoneMaterial = new THREE.MeshStandardMaterial({
    map: rockTex,
    roughness: 0.78,
    metalness: 0.12,
    color: 0xb0bec5,
  });

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c4033,
    roughness: 0.8,
    metalness: 0.05,
  });

  const portalObsidian = new THREE.MeshStandardMaterial({
    color: 0x090e18,
    roughness: 0.12,
    metalness: 0.92,
  });

  const portalGold = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.18,
    metalness: 0.94,
  });

  const portalCore = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 2.2,
    roughness: 0.08,
    metalness: 0.15,
    transparent: true,
    opacity: 0.92,
  });

  const runicRing = new THREE.MeshStandardMaterial({
    map: runicTex,
    emissiveMap: runicTex,
    emissive: 0x38bdf8,
    emissiveIntensity: 1.6,
    roughness: 0.25,
    metalness: 0.8,
    side: THREE.DoubleSide,
  });

  // Prismatic crystal materials with physical refraction and dispersion
  const crystalCyan = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    emissive: 0x0369a1,
    emissiveIntensity: 1.1,
    roughness: 0.08,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.78 : 0.95,
    ior: 1.54,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const crystalViolet = new THREE.MeshPhysicalMaterial({
    color: 0xc084fc,
    emissive: 0x6b21a8,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.9,
    transparent: true,
    opacity: isSoftwareGl ? 0.78 : 0.95,
    ior: 1.56,
    clearcoat: 1.0,
    clearcoatRoughness: 0.06,
  });

  const crystalGold = new THREE.MeshPhysicalMaterial({
    color: 0xfde047,
    emissive: 0xb45309,
    emissiveIntensity: 0.9,
    roughness: 0.12,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.88,
    transparent: true,
    opacity: isSoftwareGl ? 0.8 : 0.95,
    ior: 1.54,
    clearcoat: 1.0,
  });

  // Sky Temple materials
  const templeWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.28,
    metalness: 0.18,
  });

  const templeGold = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.92,
  });

  const templeTiles = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.35,
    metalness: 0.4,
  });

  // Cloud City materials
  const cityCeramic = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.5,
  });

  const cityFacade = new THREE.MeshStandardMaterial({
    map: windowTex,
    emissiveMap: windowTex,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.65,
  });

  const cityGlass = new THREE.MeshPhysicalMaterial({
    color: 0x38bdf8,
    roughness: 0.08,
    metalness: 0.1,
    transmission: isSoftwareGl ? 0 : 0.92,
    transparent: true,
    opacity: isSoftwareGl ? 0.65 : 0.88,
  });

  const cityGlowCyan = new THREE.MeshStandardMaterial({
    color: 0x22d3ee,
    emissive: 0x06b6d4,
    emissiveIntensity: 2.4,
  });

  // Forest materials
  const treeBark = new THREE.MeshStandardMaterial({
    map: rockTex,
    color: 0x241d1a,
    roughness: 0.88,
    metalness: 0.05,
  });

  const treeFoliageTeal = new THREE.MeshStandardMaterial({
    color: 0x2dd4bf,
    emissive: 0x0f766e,
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.05,
  });

  const treeFoliageViolet = new THREE.MeshStandardMaterial({
    color: 0xc084fc,
    emissive: 0x7e22ce,
    emissiveIntensity: 0.7,
    roughness: 0.4,
    metalness: 0.05,
  });

  const flowerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    emissive: 0xdb2777,
    emissiveIntensity: 1.2,
    roughness: 0.3,
    metalness: 0.1,
  });

  const mushroomCap = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.6,
    roughness: 0.25,
    metalness: 0.1,
  });

  // Waterfall stream with foaming animated texture
  const waterfallMat = new THREE.MeshStandardMaterial({
    map: waterfallFoamTex,
    color: 0x7dd3fc,
    emissive: 0x0284c7,
    emissiveIntensity: 1.1,
    transparent: true,
    opacity: 0.85,
    roughness: 0.12,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  // 3D Landmark Beacons
  const beaconMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.9,
  });

  // Atmospheric Clouds
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.9,
    metalness: 0.02,
    transparent: true,
    opacity: 0.82,
  });

  return {
    rockMaterial,
    rockCliffMaterial,
    grassMaterial,
    pathStoneMaterial,
    woodMaterial,
    portalObsidian,
    portalGold,
    portalCore,
    runicRing,
    crystalCyan,
    crystalViolet,
    crystalGold,
    templeWhite,
    templeGold,
    templeTiles,
    cityCeramic,
    cityFacade,
    cityGlass,
    cityGlowCyan,
    treeBark,
    treeFoliageTeal,
    treeFoliageViolet,
    flowerPetalMat,
    mushroomCap,
    waterfallMat,
    waterfallFoamTex,
    beaconMat,
    cloudMat,
  };
}
