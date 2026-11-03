import * as THREE from 'three';

/**
 * Procedural texture generators using 2D Canvas.
 * 100% zero-dependency, zero-404, high-fidelity PBR surfaces.
 * Strictly periodic & seamless boundary wrapping to prevent tiling seams/checkerboards.
 */

// Procedural rich seamless meadow grass texture without directional gradients
export function createGrassTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  // 1. Continuous periodic harmonic field for natural turf variations (strictly wraps seamlessly)
  const imgData = ctx.createImageData(512, 512);
  const data = imgData.data;

  // Precompute periodic harmonics
  for (let y = 0; y < 512; y++) {
    const ny = (y / 512) * Math.PI * 2;
    for (let x = 0; x < 512; x++) {
      const nx = (x / 512) * Math.PI * 2;

      // Harmonic sum (multi-scale organic turf noise)
      const h1 = Math.sin(nx) * Math.cos(ny);
      const h2 = Math.sin(nx * 2 + 0.8) * Math.sin(ny * 2 + 0.4);
      const h3 = Math.cos(nx * 4 + ny * 2) * 0.5;
      const h4 = Math.sin(nx * 8) * Math.cos(ny * 8) * 0.25;
      const val = (h1 + h2 + h3 + h4) / 2.75; // Normalized approx -1 to 1

      // Blend between rich meadow green (R:45, G:106, B:70) and fresh vibrant lawn (R:68, G:158, B:104)
      const t = (val + 1) * 0.5;
      const r = Math.floor(45 + t * 24);
      const g = Math.floor(104 + t * 54);
      const b = Math.floor(68 + t * 34);

      // Fine micro blade noise
      const noise = (Math.random() - 0.5) * 16;
      const idx = (y * 512 + x) * 4;
      data[idx] = Math.min(255, Math.max(0, r + noise * 0.6));
      data[idx + 1] = Math.min(255, Math.max(0, g + noise * 1.1));
      data[idx + 2] = Math.min(255, Math.max(0, b + noise * 0.7));
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  // 2. Add toroidally wrapped turf clumping & clover flecks
  for (let i = 0; i < 90; i++) {
    const cx = Math.random() * 512;
    const cy = Math.random() * 512;
    const rad = 6 + Math.random() * 18;
    const alpha = 0.12 + Math.random() * 0.18;
    const isLighter = Math.random() > 0.45;
    const fillStyle = isLighter
      ? `rgba(134, 239, 172, ${alpha})`
      : `rgba(22, 101, 52, ${alpha})`;

    // Draw with seamless periodic boundary offsets
    for (const ox of [-512, 0, 512]) {
      for (const oy of [-512, 0, 512]) {
        const px = cx + ox;
        const py = cy + oy;
        if (px + rad > 0 && px - rad < 512 && py + rad > 0 && py - rad < 512) {
          ctx.beginPath();
          ctx.fillStyle = fillStyle;
          ctx.arc(px, py, rad, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(18, 18);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural seamless asphalt road texture with subtle aggregate
export function createAsphaltTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#21262d';
  ctx.fillRect(0, 0, 512, 512);

  // Periodic aggregate variation
  const imgData = ctx.getImageData(0, 0, 512, 512);
  const data = imgData.data;
  for (let y = 0; y < 512; y++) {
    const ny = (y / 512) * Math.PI * 2;
    for (let x = 0; x < 512; x++) {
      const nx = (x / 512) * Math.PI * 2;
      const wave = Math.sin(nx * 6) * Math.cos(ny * 6) * 4;
      const grain = (Math.random() - 0.5) * 22;
      const idx = (y * 512 + x) * 4;
      data[idx] = Math.min(255, Math.max(0, data[idx] + wave + grain));
      data[idx + 1] = Math.min(255, Math.max(0, data[idx + 1] + wave + grain));
      data[idx + 2] = Math.min(255, Math.max(0, data[idx + 2] + wave + grain + 2));
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural stone / plaza paver texture
export function createPaverTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(0, 0, 256, 256);

  // Paver grid
  const tileSize = 32;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }

  // Paver tile hue variation
  for (let x = 0; x < 256; x += tileSize) {
    for (let y = 0; y < 256; y += tileSize) {
      if (Math.random() > 0.4) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural architectural wood plank texture
export function createWoodPlankTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#9a613d';
  ctx.fillRect(0, 0, 256, 256);

  // Horizontal wood slats
  const slatHeight = 16;
  for (let y = 0; y < 256; y += slatHeight) {
    const tone = 0.85 + Math.random() * 0.3;
    ctx.fillStyle = `rgb(${Math.floor(154 * tone)}, ${Math.floor(97 * tone)}, ${Math.floor(61 * tone)})`;
    ctx.fillRect(0, y, 256, slatHeight - 1);
    ctx.fillStyle = '#45220d';
    ctx.fillRect(0, y + slatHeight - 1, 256, 1);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export interface MaterialLibrary {
  // Environmental & Landscaping
  grassMaterial: THREE.MeshStandardMaterial;
  parkLawnMaterial: THREE.MeshStandardMaterial;
  lakeWaterMaterial: THREE.MeshStandardMaterial;
  riverBankMaterial: THREE.MeshStandardMaterial;
  rockStoneMaterial: THREE.MeshStandardMaterial;
  asphaltMaterial: THREE.MeshStandardMaterial;
  roadMarkingWhite: THREE.MeshBasicMaterial;
  roadMarkingYellow: THREE.MeshBasicMaterial;
  sidewalkMaterial: THREE.MeshStandardMaterial;
  plazaPaverMaterial: THREE.MeshStandardMaterial;
  gravelPathMaterial: THREE.MeshStandardMaterial;
  flowerBedMulchMaterial: THREE.MeshStandardMaterial;

  // Architectural
  modernWhiteStucco: THREE.MeshStandardMaterial;
  modernDarkSlate: THREE.MeshStandardMaterial;
  modernWarmBeige: THREE.MeshStandardMaterial;
  modernWoodSiding: THREE.MeshStandardMaterial;
  roofTileDark: THREE.MeshStandardMaterial;
  roofTileTerracotta: THREE.MeshStandardMaterial;
  glassWindowDay: THREE.MeshStandardMaterial;
  glassWindowGlow: THREE.MeshStandardMaterial;
  greenhouseGlass: THREE.MeshStandardMaterial;
  metalSteel: THREE.MeshStandardMaterial;
  metalBronze: THREE.MeshStandardMaterial;
  metalBlack: THREE.MeshStandardMaterial;
  doorWood: THREE.MeshStandardMaterial;
  concreteCurbs: THREE.MeshStandardMaterial;

  // Botanical & Foliage
  treeFoliageDarkGreen: THREE.MeshStandardMaterial;
  treeFoliageLightGreen: THREE.MeshStandardMaterial;
  treeFoliageOlive: THREE.MeshStandardMaterial;
  treeFoliageFloweringPink: THREE.MeshStandardMaterial;
  treeFoliageWillow: THREE.MeshStandardMaterial;
  treeTrunkBark: THREE.MeshStandardMaterial;
  treeTrunkBirch: THREE.MeshStandardMaterial;
  hedgeBoxwood: THREE.MeshStandardMaterial;
  flowerRed: THREE.MeshStandardMaterial;
  flowerLavender: THREE.MeshStandardMaterial;
  flowerYellow: THREE.MeshStandardMaterial;
  waterLilyMaterial: THREE.MeshStandardMaterial;
  lotusBlossomMaterial: THREE.MeshStandardMaterial;

  // Vehicles & Street Furniture
  carPaintWhite: THREE.MeshStandardMaterial;
  carPaintBlue: THREE.MeshStandardMaterial;
  carPaintRed: THREE.MeshStandardMaterial;
  carPaintGrey: THREE.MeshStandardMaterial;
  carPaintEmerald: THREE.MeshStandardMaterial;
  carTireRubber: THREE.MeshStandardMaterial;
  carGlass: THREE.MeshStandardMaterial;
  lampGlow: THREE.MeshBasicMaterial;
  awningStriped: THREE.MeshStandardMaterial;
  timberBench: THREE.MeshStandardMaterial;

  // Sports Courts & Civic Facilities
  sportCourtBlue: THREE.MeshStandardMaterial;
  sportCourtOrange: THREE.MeshStandardMaterial;
  medicalCrossRed: THREE.MeshStandardMaterial;

  // Vehicle Headlights, Taillights & Signals
  headlightGlow: THREE.MeshBasicMaterial;
  taillightGlow: THREE.MeshBasicMaterial;
  turnSignalGlow: THREE.MeshBasicMaterial;
  emergencyRedGlow: THREE.MeshBasicMaterial;
  emergencyBlueGlow: THREE.MeshBasicMaterial;

  // Pedestrian Figurines
  pedestrianShirt1: THREE.MeshStandardMaterial;
  pedestrianShirt2: THREE.MeshStandardMaterial;
  pedestrianShirt3: THREE.MeshStandardMaterial;
  pedestrianPants: THREE.MeshStandardMaterial;
  pedestrianSkin: THREE.MeshStandardMaterial;

  // Watersports & Kayaks
  kayakYellow: THREE.MeshStandardMaterial;
  kayakRed: THREE.MeshStandardMaterial;

  // Helpers
  updateNightGlow: (isNight: boolean | number) => void;
}

export function createMaterialLibrary(isSoftwareGl: boolean): MaterialLibrary {
  const grassTex = createGrassTexture();
  const asphaltTex = createAsphaltTexture();
  const paverTex = createPaverTexture();
  const woodTex = createWoodPlankTexture();

  // 1. Terrain & Pathways
  const grassMaterial = new THREE.MeshStandardMaterial({
    map: grassTex,
    color: 0x48966b,
    roughness: 0.88,
    metalness: 0.02,
    flatShading: false,
  });

  const parkLawnMaterial = new THREE.MeshStandardMaterial({
    map: grassTex,
    color: 0x54af79,
    roughness: 0.84,
    metalness: 0.02,
  });

  const lakeWaterMaterial = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.08,
    metalness: 0.85,
    transparent: true,
    opacity: 0.86,
  });

  const riverBankMaterial = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.95,
    metalness: 0.05,
  });

  const rockStoneMaterial = new THREE.MeshStandardMaterial({
    color: 0x475569,
    roughness: 0.88,
    metalness: 0.1,
  });

  const asphaltMaterial = new THREE.MeshStandardMaterial({
    map: asphaltTex,
    color: 0x242a35,
    roughness: 0.9,
    metalness: 0.06,
  });

  const roadMarkingWhite = new THREE.MeshBasicMaterial({
    color: 0xffffff,
  });

  const roadMarkingYellow = new THREE.MeshBasicMaterial({
    color: 0xfacc15,
  });

  const sidewalkMaterial = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.8,
    metalness: 0.05,
  });

  const concreteCurbs = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.82,
    metalness: 0.05,
  });

  const plazaPaverMaterial = new THREE.MeshStandardMaterial({
    map: paverTex,
    color: 0xcbd5e1,
    roughness: 0.75,
    metalness: 0.1,
  });

  const gravelPathMaterial = new THREE.MeshStandardMaterial({
    color: 0xd6d3d1,
    roughness: 0.95,
    metalness: 0.02,
  });

  const flowerBedMulchMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2314,
    roughness: 0.95,
    metalness: 0.02,
  });

  // 2. Modern Architecture
  const modernWhiteStucco = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.62,
    metalness: 0.05,
  });

  const modernDarkSlate = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.68,
    metalness: 0.15,
  });

  const modernWarmBeige = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.68,
    metalness: 0.05,
  });

  const modernWoodSiding = new THREE.MeshStandardMaterial({
    map: woodTex,
    color: 0xb45309,
    roughness: 0.65,
    metalness: 0.05,
  });

  const roofTileDark = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.72,
    metalness: 0.12,
  });

  const roofTileTerracotta = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.78,
    metalness: 0.05,
  });

  const glassWindowDay = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    roughness: 0.12,
    metalness: 0.85,
    transparent: true,
    opacity: 0.75,
  });

  const glassWindowGlow = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.35,
    roughness: 0.25,
  });

  const greenhouseGlass = new THREE.MeshStandardMaterial({
    color: 0x67e8f9,
    roughness: 0.08,
    metalness: 0.9,
    transparent: true,
    opacity: 0.42,
  });

  const metalSteel = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.32,
    metalness: 0.85,
  });

  const metalBronze = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.38,
    metalness: 0.8,
  });

  const metalBlack = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.45,
    metalness: 0.7,
  });

  const doorWood = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.58,
    metalness: 0.1,
  });

  // 3. Foliage & Botanical
  const treeFoliageDarkGreen = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.85,
    metalness: 0.04,
    flatShading: true,
  });

  const treeFoliageLightGreen = new THREE.MeshStandardMaterial({
    color: 0x4ade80,
    roughness: 0.85,
    metalness: 0.04,
    flatShading: true,
  });

  const treeFoliageOlive = new THREE.MeshStandardMaterial({
    color: 0x65a30d,
    roughness: 0.85,
    metalness: 0.04,
    flatShading: true,
  });

  const treeFoliageFloweringPink = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.82,
    metalness: 0.04,
    flatShading: true,
  });

  const treeFoliageWillow = new THREE.MeshStandardMaterial({
    color: 0x86efac,
    roughness: 0.85,
    metalness: 0.04,
    flatShading: true,
  });

  const treeTrunkBark = new THREE.MeshStandardMaterial({
    color: 0x451a03,
    roughness: 0.9,
    metalness: 0.05,
  });

  const treeTrunkBirch = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.82,
    metalness: 0.05,
  });

  const hedgeBoxwood = new THREE.MeshStandardMaterial({
    color: 0x166534,
    roughness: 0.85,
    metalness: 0.04,
  });

  const flowerRed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.65,
  });

  const flowerLavender = new THREE.MeshStandardMaterial({
    color: 0xa855f7,
    roughness: 0.65,
  });

  const flowerYellow = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    roughness: 0.65,
  });

  const waterLilyMaterial = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.5,
    metalness: 0.1,
  });

  const lotusBlossomMaterial = new THREE.MeshStandardMaterial({
    color: 0xf472b6,
    roughness: 0.45,
    emissive: 0xf472b6,
    emissiveIntensity: 0.15,
  });

  // 4. Vehicles & Amenities
  const carPaintWhite = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.18,
    metalness: 0.78,
  });

  const carPaintBlue = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    roughness: 0.18,
    metalness: 0.82,
  });

  const carPaintRed = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    roughness: 0.18,
    metalness: 0.82,
  });

  const carPaintGrey = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.22,
    metalness: 0.78,
  });

  const carPaintEmerald = new THREE.MeshStandardMaterial({
    color: 0x059669,
    roughness: 0.2,
    metalness: 0.75,
  });

  const carTireRubber = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.92,
    metalness: 0.08,
  });

  const carGlass = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.08,
    metalness: 0.92,
    transparent: true,
    opacity: 0.85,
  });

  const lampGlow = new THREE.MeshBasicMaterial({
    color: 0xfef08a,
  });

  const awningStriped = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.68,
  });

  const timberBench = new THREE.MeshStandardMaterial({
    color: 0x92400e,
    roughness: 0.72,
  });

  // Sports Court & Recreation Materials
  const sportCourtBlue = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    roughness: 0.45,
  });

  const sportCourtOrange = new THREE.MeshStandardMaterial({
    color: 0xea580c,
    roughness: 0.5,
  });

  // Civic Healthcare Red Cross Accent
  const medicalCrossRed = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    roughness: 0.3,
    emissive: 0x991b1b,
    emissiveIntensity: 0.4,
  });

  // Vehicle Headlights, Taillights & Dynamic Turn/Emergency Signals
  const headlightGlow = new THREE.MeshBasicMaterial({
    color: 0xfffbeb,
  });

  const taillightGlow = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  const turnSignalGlow = new THREE.MeshBasicMaterial({
    color: 0xf59e0b,
  });

  const emergencyRedGlow = new THREE.MeshBasicMaterial({
    color: 0xef4444,
  });

  const emergencyBlueGlow = new THREE.MeshBasicMaterial({
    color: 0x3b82f6,
  });

  // Pedestrian Clothing & Figurines
  const pedestrianShirt1 = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7 });
  const pedestrianShirt2 = new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.7 });
  const pedestrianShirt3 = new THREE.MeshStandardMaterial({ color: 0x10b981, roughness: 0.7 });
  const pedestrianPants = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
  const pedestrianSkin = new THREE.MeshStandardMaterial({ color: 0xfbbf24, roughness: 0.6 });

  // Lakeside Kayaks & Watersports
  const kayakYellow = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.35 });
  const kayakRed = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.35 });

  const updateNightGlow = (isNight: boolean | number) => {
    const factor = typeof isNight === 'number' ? Math.max(0, Math.min(1, isNight)) : isNight ? 1 : 0;
    glassWindowGlow.emissiveIntensity = THREE.MathUtils.lerp(0.25, 0.95, factor);
    lampGlow.color.lerpColors(new THREE.Color(0xfef9c3), new THREE.Color(0xfef08a), factor);
    headlightGlow.color.lerpColors(new THREE.Color(0xfef08a), new THREE.Color(0xffffff), factor);
    taillightGlow.color.lerpColors(new THREE.Color(0xb91c1c), new THREE.Color(0xff0033), factor);
  };

  return {
    grassMaterial,
    parkLawnMaterial,
    lakeWaterMaterial,
    riverBankMaterial,
    rockStoneMaterial,
    asphaltMaterial,
    roadMarkingWhite,
    roadMarkingYellow,
    sidewalkMaterial,
    plazaPaverMaterial,
    gravelPathMaterial,
    flowerBedMulchMaterial,
    modernWhiteStucco,
    modernDarkSlate,
    modernWarmBeige,
    modernWoodSiding,
    roofTileDark,
    roofTileTerracotta,
    glassWindowDay,
    glassWindowGlow,
    greenhouseGlass,
    metalSteel,
    metalBronze,
    metalBlack,
    doorWood,
    concreteCurbs,
    treeFoliageDarkGreen,
    treeFoliageLightGreen,
    treeFoliageOlive,
    treeFoliageFloweringPink,
    treeFoliageWillow,
    treeTrunkBark,
    treeTrunkBirch,
    hedgeBoxwood,
    flowerRed,
    flowerLavender,
    flowerYellow,
    waterLilyMaterial,
    lotusBlossomMaterial,
    carPaintWhite,
    carPaintBlue,
    carPaintRed,
    carPaintGrey,
    carPaintEmerald,
    carTireRubber,
    carGlass,
    lampGlow,
    awningStriped,
    timberBench,
    sportCourtBlue,
    sportCourtOrange,
    medicalCrossRed,
    headlightGlow,
    taillightGlow,
    turnSignalGlow,
    emergencyRedGlow,
    emergencyBlueGlow,
    pedestrianShirt1,
    pedestrianShirt2,
    pedestrianShirt3,
    pedestrianPants,
    pedestrianSkin,
    kayakYellow,
    kayakRed,
    updateNightGlow,
  };
}
