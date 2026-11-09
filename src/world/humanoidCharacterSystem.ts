/**
 * 3DWorld Humanoid Character System
 * High-Quality Anatomical Human Character Architecture & Realistic Physics Rig
 *
 * Implements natural adult human proportions, detailed facial structure, volumetric hair,
 * fabric-textured modern clothing, and authentic articulated skeletal kinematics.
 */

import * as THREE from 'three';

export type HumanGender = 'male' | 'female';

export type HumanHairStyle =
  | 'short_crop'
  | 'pompadour'
  | 'long_flowing'
  | 'braided'
  | 'bun'
  | 'beanie'
  | 'explorer_hat'
  | 'builder_helmet'
  | 'cyber_visor';

export type HumanOutfitType =
  | 'casual'
  | 'formal_blazer'
  | 'jacket'
  | 'traditional'
  | 'modern_urban'
  | 'explorer'
  | 'builder'
  | 'rural_villager'
  | 'cyber';

export interface HumanoidOptions {
  gender?: HumanGender;
  isChild?: boolean;
  skinTone?: string | number;
  hairStyle?: HumanHairStyle;
  hairColor?: string | number;
  outfitType?: HumanOutfitType;
  primaryColor?: string | number;
  secondaryColor?: string | number;
  pantsColor?: string | number;
  shoesColor?: string | number;
  eyeColor?: string | number;
  heightScale?: number;
  castShadow?: boolean;
}

export type HumanoidGesture = 'none' | 'idle' | 'walk' | 'sit' | 'wave' | 'cheer' | 'work' | 'jog' | 'dance';

export interface HumanoidRig {
  root: THREE.Group;
  torsoGroup: THREE.Group;
  chestMesh: THREE.Mesh;
  neckMesh: THREE.Mesh;
  headGroup: THREE.Group;
  headMesh: THREE.Mesh;
  leftEyeMesh?: THREE.Mesh;
  rightEyeMesh?: THREE.Mesh;
  leftShoulder: THREE.Group;
  leftForearmGroup: THREE.Group;
  rightShoulder: THREE.Group;
  rightForearmGroup: THREE.Group;
  leftHip: THREE.Group;
  leftKneeGroup: THREE.Group;
  rightHip: THREE.Group;
  rightKneeGroup: THREE.Group;
  updateAnimation: (
    walkTime: number,
    isMoving: boolean,
    isSprinting: boolean,
    isJumping: boolean,
    verticalVelocity: number,
    dt: number,
    movementSpeed?: number,
    gesture?: HumanoidGesture
  ) => void;
  dispose: () => void;
}

// ---------------------------------------------------------------------------
// 1. CURATED COLOR PALETTES
// ---------------------------------------------------------------------------
export const SKIN_TONES = {
  fair: 0xfce4d6,
  warmBeige: 0xf1c27d,
  olive: 0xe0ac69,
  bronze: 0xc68642,
  chestnut: 0x8d5524,
  espresso: 0x4a2a16,
};

export const HAIR_COLORS = {
  black: 0x18181b,
  darkBrown: 0x271c19,
  chestnut: 0x4a2e1b,
  auburn: 0x6d2a1b,
  blonde: 0xb58b4c,
  silver: 0x94a3b8,
};

export const EYE_COLORS = {
  brown: 0x45220c,
  hazel: 0x5c4827,
  amber: 0x82521c,
  green: 0x235338,
  blue: 0x1d4ed8,
  charcoal: 0x1f2937,
};

// ---------------------------------------------------------------------------
// 2. PROCEDURAL HIGH-FIDELITY TEXTURE GENERATOR & CACHE
// ---------------------------------------------------------------------------
class ProceduralTextureCache {
  private static skinTextures = new Map<string, THREE.CanvasTexture>();
  private static fabricTextures = new Map<string, THREE.CanvasTexture>();
  private static eyeTextures = new Map<string, THREE.CanvasTexture>();

  // Realistic human skin texture with subtle micro-grain and warm tone variation
  public static getSkinTexture(color: THREE.Color): THREE.CanvasTexture {
    const key = color.getHexString();
    if (this.skinTextures.has(key)) return this.skinTextures.get(key)!;
    if (typeof document === 'undefined') {
      const tex = new THREE.Texture();
      this.skinTextures.set(key, tex as any);
      return tex as any;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = `#${key}`;
      ctx.fillRect(0, 0, 128, 128);

      // Subtle warm organic micro-tonal variation (simulates soft dermal scatter)
      const r = Math.round(color.r * 255);
      const g = Math.round(color.g * 255);
      const b = Math.round(color.b * 255);

      for (let i = 0; i < 600; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const delta = (Math.random() - 0.5) * 12;
        ctx.fillStyle = `rgba(${Math.min(255, Math.max(0, r + delta + 4))}, ${Math.min(
          255,
          Math.max(0, g + delta)
        )}, ${Math.min(255, Math.max(0, b + delta))}, 0.15)`;
        ctx.fillRect(x, y, 2, 2);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    this.skinTextures.set(key, tex);
    return tex;
  }

  // Realistic fabric textures (denim twill, cotton weave, suiting wool)
  public static getFabricTexture(type: 'denim' | 'cotton' | 'wool' | 'linen', baseHex: string): THREE.CanvasTexture {
    const key = `${type}_${baseHex}`;
    if (this.fabricTextures.has(key)) return this.fabricTextures.get(key)!;
    if (typeof document === 'undefined') {
      const tex = new THREE.Texture();
      this.fabricTextures.set(key, tex as any);
      return tex as any;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = `#${baseHex}`;
      ctx.fillRect(0, 0, 128, 128);

      if (type === 'denim') {
        // Diagonal twill weave
        ctx.strokeStyle = 'rgba(240, 245, 255, 0.14)';
        ctx.lineWidth = 1.5;
        for (let x = -128; x < 256; x += 4) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x + 128, 128);
          ctx.stroke();
        }
      } else if (type === 'wool') {
        // Fine worsted suit crosshatch
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        for (let i = 0; i < 128; i += 3) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(i, 128);
          ctx.moveTo(0, i);
          ctx.lineTo(128, i);
          ctx.stroke();
        }
      } else {
        // Natural cotton/linen woven grain
        for (let x = 0; x < 128; x += 2) {
          for (let y = 0; y < 128; y += 2) {
            if ((x + y) % 4 === 0) {
              ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
              ctx.fillRect(x, y, 1, 1);
            }
          }
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 4);
    this.fabricTextures.set(key, tex);
    return tex;
  }

  // Realistic iris texture with limbal ring, radial striations, and pupil
  public static getEyeTexture(irisColor: THREE.Color): THREE.CanvasTexture {
    const key = irisColor.getHexString();
    if (this.eyeTextures.has(key)) return this.eyeTextures.get(key)!;
    if (typeof document === 'undefined') {
      const tex = new THREE.Texture();
      this.eyeTextures.set(key, tex as any);
      return tex as any;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Sclera (White)
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, 128, 128);

      const cx = 64;
      const cy = 64;
      const r = 42;

      // Dark Limbal Ring
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Iris Base Gradient
      const grad = ctx.createRadialGradient(cx, cy, 14, cx, cy, r - 2);
      grad.addColorStop(0, `#${key}`);
      grad.addColorStop(1, '#090d16');
      ctx.beginPath();
      ctx.arc(cx, cy, r - 2, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Radial Iris Fibers
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.lineWidth = 1;
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 18) {
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * 16, cy + Math.sin(a) * 16);
        ctx.lineTo(cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4));
        ctx.stroke();
      }

      // Pupil (Dark center)
      ctx.beginPath();
      ctx.arc(cx, cy, 15, 0, Math.PI * 2);
      ctx.fillStyle = '#020617';
      ctx.fill();

      // Corneal light reflection
      ctx.beginPath();
      ctx.arc(cx - 8, cy - 8, 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.eyeTextures.set(key, tex);
    return tex;
  }
}

// ---------------------------------------------------------------------------
// 3. ANATOMICALLY DETAILED HUMAN RIG GENERATOR
// ---------------------------------------------------------------------------
export function createHumanoidCharacter(options: HumanoidOptions = {}): HumanoidRig {
  const gender = options.gender || 'male';
  const isChild = !!options.isChild;
  const isFemale = gender === 'female';
  const castShadow = options.castShadow !== false;

  // Adult height: ~1.75m. Child: ~1.18m
  const scale = options.heightScale || (isChild ? 0.68 : 1.0);

  const root = new THREE.Group();
  root.name = 'HumanoidRoot';

  // 1. Resolve Palette
  const skinColor = new THREE.Color(options.skinTone ?? SKIN_TONES.warmBeige);
  const hairColor = new THREE.Color(options.hairColor ?? HAIR_COLORS.darkBrown);
  const eyeColor = new THREE.Color(options.eyeColor ?? EYE_COLORS.brown);

  // Clothing Palettes based on Outfit
  const outfit = options.outfitType || 'casual';
  let shirtColor = new THREE.Color(options.primaryColor ?? (isFemale ? 0x0284c7 : 0x0369a1));
  let pantsColor = new THREE.Color(options.pantsColor ?? 0x1e293b);
  let shoesColor = new THREE.Color(options.shoesColor ?? 0x0f172a);

  if (outfit === 'formal_blazer') {
    shirtColor = new THREE.Color(0x0f172a); // Navy/charcoal blazer
    pantsColor = new THREE.Color(0x1e293b);
    shoesColor = new THREE.Color(0x18181b); // Oxford shoes
  } else if (outfit === 'jacket') {
    shirtColor = new THREE.Color(0x3b2318); // Rich leather bomber jacket
    pantsColor = new THREE.Color(0x1e293b); // Dark denim
    shoesColor = new THREE.Color(0x271c19); // Chelsea boots
  } else if (outfit === 'traditional' || outfit === 'rural_villager') {
    shirtColor = new THREE.Color(0xd97706); // Natural linen tunic
    pantsColor = new THREE.Color(0x57534e);
    shoesColor = new THREE.Color(0x44403c);
  }

  // 2. High-Fidelity Materials with PBR Properties
  const skinTex = ProceduralTextureCache.getSkinTexture(skinColor);
  const skinMat = new THREE.MeshStandardMaterial({
    map: skinTex,
    color: skinColor,
    roughness: 0.58, // Organic skin matte roughness (no shiny plastic)
    metalness: 0.0,
  });

  const hairMat = new THREE.MeshStandardMaterial({
    color: hairColor,
    roughness: 0.42,
    metalness: 0.12,
  });

  const fabricType = outfit === 'formal_blazer' ? 'wool' : outfit === 'traditional' ? 'linen' : 'cotton';
  const shirtTex = ProceduralTextureCache.getFabricTexture(fabricType, shirtColor.getHexString());
  const shirtMat = new THREE.MeshStandardMaterial({
    map: shirtTex,
    color: shirtColor,
    roughness: 0.72,
    metalness: outfit === 'cyber' ? 0.35 : 0.02,
  });

  const denimTex = ProceduralTextureCache.getFabricTexture('denim', pantsColor.getHexString());
  const pantsMat = new THREE.MeshStandardMaterial({
    map: denimTex,
    color: pantsColor,
    roughness: 0.76,
    metalness: 0.02,
  });

  const shoesMat = new THREE.MeshStandardMaterial({
    color: shoesColor,
    roughness: 0.45,
    metalness: 0.08,
  });

  const soleMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.35,
  });

  const eyeTex = ProceduralTextureCache.getEyeTexture(eyeColor);
  const eyeMat = new THREE.MeshStandardMaterial({
    map: eyeTex,
    roughness: 0.1,
    metalness: 0.0,
  });

  const browMat = new THREE.MeshStandardMaterial({
    color: hairColor.clone().multiplyScalar(0.75),
    roughness: 0.8,
  });

  const lipsMat = new THREE.MeshStandardMaterial({
    color: skinColor.clone().lerp(new THREE.Color(0xa21caf), 0.22),
    roughness: 0.45,
  });

  // Anatomical Dimensions
  const shoulderSpan = isChild ? 0.28 : isFemale ? 0.36 : 0.44;
  const chestDepth = isChild ? 0.18 : isFemale ? 0.22 : 0.24;
  const waistWidth = isChild ? 0.22 : isFemale ? 0.24 : 0.28;
  const hipWidth = isChild ? 0.24 : isFemale ? 0.32 : 0.29;
  const legHeight = isChild ? 0.52 : 0.86;
  const torsoHeight = isChild ? 0.38 : 0.54;
  const headRadius = isChild ? 0.11 : 0.105;

  const hipElevation = legHeight + 0.08;

  // ---------------------------------------------------------------------------
  // 4. PELVIS & LOWER TRUNK (Root pivot)
  // ---------------------------------------------------------------------------
  const pelvis = new THREE.Group();
  pelvis.name = 'Pelvis';
  pelvis.position.y = hipElevation;

  const pelvisMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(waistWidth * 0.48, hipWidth * 0.5, 0.15, 14),
    pantsMat
  );
  pelvisMesh.scale.set(1, 1, chestDepth / (waistWidth * 0.48));
  pelvisMesh.castShadow = castShadow;
  pelvis.add(pelvisMesh);
  root.add(pelvis);

  // ---------------------------------------------------------------------------
  // 5. TORSO & SPINE (Hierarchical Group for Spine Flexion & Breathing)
  // ---------------------------------------------------------------------------
  const torsoGroup = new THREE.Group();
  torsoGroup.name = 'TorsoGroup';
  torsoGroup.position.y = hipElevation + 0.07;
  root.add(torsoGroup);

  // Waist & Belt
  const waistMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(waistWidth * 0.5, waistWidth * 0.48, 0.12, 14),
    pantsMat
  );
  waistMesh.position.y = 0.06;
  waistMesh.scale.set(1, 1, 0.85);
  waistMesh.castShadow = castShadow;
  torsoGroup.add(waistMesh);

  // Belt with subtle metallic buckle
  const beltMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(waistWidth * 0.51, waistWidth * 0.51, 0.04, 14),
    new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.6 })
  );
  beltMesh.position.y = 0.03;
  beltMesh.scale.set(1, 1, 0.86);
  torsoGroup.add(beltMesh);

  const buckle = new THREE.Mesh(
    new THREE.BoxGeometry(0.065, 0.045, 0.02),
    new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.25 })
  );
  buckle.position.set(0, 0.03, (waistWidth * 0.51 * 0.86) + 0.005);
  torsoGroup.add(buckle);

  // Chest / Ribcage (Anatomical taper: broader shoulders, sculpted chest)
  const chestGeo = new THREE.CylinderGeometry(shoulderSpan * 0.48, waistWidth * 0.48, torsoHeight * 0.72, 16);
  chestGeo.scale(1, 1, (chestDepth * 1.1) / (shoulderSpan * 0.48));
  const chestMesh = new THREE.Mesh(chestGeo, shirtMat);
  chestMesh.position.y = 0.12 + (torsoHeight * 0.72) / 2;
  chestMesh.castShadow = castShadow;
  chestMesh.receiveShadow = true;
  torsoGroup.add(chestMesh);

  // Upper Clavicle Ridge & Neck Base
  const clavicleMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(shoulderSpan * 0.38, shoulderSpan * 0.46, 0.08, 14),
    shirtMat
  );
  clavicleMesh.position.y = 0.12 + torsoHeight * 0.72 + 0.02;
  clavicleMesh.scale.set(1, 1, 0.75);
  torsoGroup.add(clavicleMesh);

  // Anatomical Neck (Contoured cylinder with slight forward pitch)
  const neckGeo = new THREE.CylinderGeometry(0.062, 0.072, 0.13, 12);
  const neckMesh = new THREE.Mesh(neckGeo, skinMat);
  neckMesh.position.set(0, clavicleMesh.position.y + 0.07, 0.015);
  neckMesh.rotation.x = 0.08;
  neckMesh.castShadow = castShadow;
  torsoGroup.add(neckMesh);

  // ---------------------------------------------------------------------------
  // 6. SCULPTED REALISTIC HEAD & FACIAL FEATURES
  // ---------------------------------------------------------------------------
  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  headGroup.position.set(0, neckMesh.position.y + 0.13, 0.025);
  torsoGroup.add(headGroup);

  // Cranium: Anatomical Human Head Profile
  const craniumGeo = new THREE.SphereGeometry(headRadius, 18, 16);
  craniumGeo.scale(0.88, 1.12, 0.98); // Taller than wide, natural oval depth
  const headMesh = new THREE.Mesh(craniumGeo, skinMat);
  headMesh.castShadow = castShadow;
  headGroup.add(headMesh);

  // Sculpted Jawline & Chin
  const jawGeo = new THREE.CylinderGeometry(headRadius * 0.42, headRadius * 0.28, headRadius * 0.52, 10);
  const jawMesh = new THREE.Mesh(jawGeo, skinMat);
  jawMesh.position.set(0, -headRadius * 0.62, headRadius * 0.42);
  jawMesh.rotation.x = 0.32;
  headGroup.add(jawMesh);

  // Sculpted Nose Bridge & Nostril Wings
  const noseBridge = new THREE.Mesh(
    new THREE.CylinderGeometry(0.015, 0.022, 0.065, 8),
    skinMat
  );
  noseBridge.position.set(0, -0.01, headRadius * 0.94);
  noseBridge.rotation.x = -0.22;
  headGroup.add(noseBridge);

  const noseTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.016, 8, 8),
    skinMat
  );
  noseTip.position.set(0, -0.038, headRadius * 0.98);
  headGroup.add(noseTip);

  // Left & Right Anatomical Eyes (recessed with eyelids, limbal ring & iris)
  let leftEyeMesh: THREE.Mesh | undefined;
  let rightEyeMesh: THREE.Mesh | undefined;

  [-1, 1].forEach((side) => {
    const eyeSocket = new THREE.Group();
    eyeSocket.position.set(side * 0.046, 0.018, headRadius * 0.86);

    // Eye sphere with custom iris texture
    const eyeGeo = new THREE.SphereGeometry(0.021, 12, 12);
    eyeGeo.rotateY(Math.PI / 2); // Orient texture forward
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eyeSocket.add(eye);
    if (side < 0) leftEyeMesh = eye;
    else rightEyeMesh = eye;

    // Upper Eyelid Crease
    const upperLid = new THREE.Mesh(
      new THREE.CylinderGeometry(0.023, 0.023, 0.008, 10, 1, false, 0, Math.PI),
      skinMat
    );
    upperLid.rotation.z = Math.PI / 2;
    upperLid.position.set(0, 0.012, 0.006);
    eyeSocket.add(upperLid);

    // Sculpted Eyebrow with natural arch
    const brow = new THREE.Mesh(
      new THREE.BoxGeometry(0.052, 0.012, 0.018),
      browMat
    );
    brow.position.set(side * 0.048, 0.052, headRadius * 0.88);
    brow.rotation.z = side * -0.08;
    headGroup.add(brow);

    // Sculpted Ear (Helix & Lobe)
    const ear = new THREE.Mesh(
      new THREE.SphereGeometry(0.036, 8, 8),
      skinMat
    );
    ear.scale.set(0.3, 1.15, 0.7);
    ear.position.set(side * (headRadius * 0.88), -0.01, -0.02);
    ear.rotation.y = side * 0.15;
    headGroup.add(ear);

    headGroup.add(eyeSocket);
  });

  // Sculpted Lips (Cupid's bow upper lip and contoured lower lip)
  const upperLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.044, 0.012, 0.014),
    lipsMat
  );
  upperLip.position.set(0, -0.068, headRadius * 0.90);
  headGroup.add(upperLip);

  const lowerLip = new THREE.Mesh(
    new THREE.BoxGeometry(0.038, 0.012, 0.014),
    lipsMat
  );
  lowerLip.position.set(0, -0.082, headRadius * 0.88);
  headGroup.add(lowerLip);

  // ---------------------------------------------------------------------------
  // 7. VOLUMETRIC LAYERED HAIRSTYLE (Realistic locks with depth & texture)
  // ---------------------------------------------------------------------------
  const hairStyle = options.hairStyle || (isFemale ? 'long_flowing' : 'short_crop');

  if (hairStyle === 'short_crop') {
    // Textured Modern Fade / Crop
    const scalpCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.03, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.58),
      hairMat
    );
    scalpCap.position.y = 0.01;
    headGroup.add(scalpCap);

    // Overlapping textured hair locks on crown
    for (let i = 0; i < 5; i++) {
      const lock = new THREE.Mesh(
        new THREE.CylinderGeometry(0.022, 0.012, 0.08, 6),
        hairMat
      );
      lock.position.set((i - 2) * 0.022, headRadius * 0.82, headRadius * 0.42);
      lock.rotation.x = -0.35 + Math.random() * 0.1;
      headGroup.add(lock);
    }
  } else if (hairStyle === 'pompadour') {
    // Classic Modern Quiff / Pompadour with swooping side locks
    const scalpCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.03, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.62),
      hairMat
    );
    headGroup.add(scalpCap);

    const quiffCrown = new THREE.Mesh(
      new THREE.CylinderGeometry(headRadius * 0.55, headRadius * 0.65, 0.14, 10),
      hairMat
    );
    quiffCrown.position.set(0, headRadius * 0.94, headRadius * 0.32);
    quiffCrown.rotation.x = -0.35;
    headGroup.add(quiffCrown);
  } else if (hairStyle === 'long_flowing') {
    // Shoulder-length layered feminine tresses
    const scalpCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.03, 16, 14),
      hairMat
    );
    headGroup.add(scalpCap);

    // Left and right flowing tresses draping over shoulders
    [-1, 1].forEach((side) => {
      const tress = new THREE.Mesh(
        new THREE.CylinderGeometry(0.038, 0.018, 0.36, 8),
        hairMat
      );
      tress.position.set(side * (headRadius * 0.82), -0.14, 0.02);
      tress.rotation.z = side * -0.1;
      headGroup.add(tress);
    });

    // Back cascade
    const backTress = new THREE.Mesh(
      new THREE.BoxGeometry(headRadius * 1.25, 0.34, 0.08),
      hairMat
    );
    backTress.position.set(0, -0.15, -headRadius * 0.75);
    headGroup.add(backTress);
  } else if (hairStyle === 'bun') {
    // High chic topknot bun
    const scalpCap = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 1.02, 16, 14, 0, Math.PI * 2, 0, Math.PI * 0.65),
      hairMat
    );
    headGroup.add(scalpCap);

    const bun = new THREE.Mesh(
      new THREE.SphereGeometry(headRadius * 0.42, 12, 12),
      hairMat
    );
    bun.position.set(0, headRadius * 1.02, -0.04);
    headGroup.add(bun);
  } else if (hairStyle === 'beanie') {
    // Urban knit cuff beanie
    const beanie = new THREE.Mesh(
      new THREE.CylinderGeometry(headRadius * 1.08, headRadius * 1.14, 0.16, 16),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8 })
    );
    beanie.position.y = headRadius * 0.58;
    headGroup.add(beanie);
  } else if (hairStyle === 'explorer_hat') {
    const brim = new THREE.Mesh(
      new THREE.CylinderGeometry(headRadius * 1.9, headRadius * 1.9, 0.025, 16),
      new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.8 })
    );
    brim.position.y = headRadius * 0.65;
    headGroup.add(brim);

    const crown = new THREE.Mesh(
      new THREE.CylinderGeometry(headRadius * 0.95, headRadius * 1.05, 0.12, 16),
      new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.8 })
    );
    crown.position.y = headRadius * 0.73;
    headGroup.add(crown);
  }

  // ---------------------------------------------------------------------------
  // 8. ARTICULATED UPPER LIMBS (Shoulders, Biceps, Elbows, Forearms, Hands)
  // ---------------------------------------------------------------------------
  const armLen = isChild ? 0.44 : 0.64;
  const upperArmLen = armLen * 0.52;
  const forearmLen = armLen * 0.48;

  function buildArm(side: number): {
    shoulderGroup: THREE.Group;
    forearmGroup: THREE.Group;
  } {
    const shoulderGroup = new THREE.Group();
    shoulderGroup.name = side < 0 ? 'LeftShoulder' : 'RightShoulder';
    shoulderGroup.position.set(side * (shoulderSpan * 0.52), clavicleMesh.position.y - 0.03, 0);

    // Anatomical Deltoid Cap (Smooth shoulder transition)
    const deltoid = new THREE.Mesh(
      new THREE.SphereGeometry(0.062, 10, 10),
      shirtMat
    );
    deltoid.scale.set(1.1, 1.25, 1.0);
    shoulderGroup.add(deltoid);

    // Upper Arm (Bicep/Tricep taper)
    const upperArmGeo = new THREE.CylinderGeometry(0.048, 0.042, upperArmLen, 10);
    upperArmGeo.translate(0, -upperArmLen / 2, 0);
    const upperArmMesh = new THREE.Mesh(upperArmGeo, shirtMat);
    upperArmMesh.castShadow = castShadow;
    shoulderGroup.add(upperArmMesh);

    // Elbow Pivot Joint
    const forearmGroup = new THREE.Group();
    forearmGroup.name = side < 0 ? 'LeftElbow' : 'RightElbow';
    forearmGroup.position.set(0, -upperArmLen, 0);
    shoulderGroup.add(forearmGroup);

    const elbowMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.038, 8, 8),
      skinMat
    );
    forearmGroup.add(elbowMesh);

    // Forearm (Brachioradialis taper to wrist)
    const forearmGeo = new THREE.CylinderGeometry(0.040, 0.032, forearmLen, 10);
    forearmGeo.translate(0, -forearmLen / 2, 0);
    const forearmMesh = new THREE.Mesh(forearmGeo, skinMat);
    forearmMesh.castShadow = castShadow;
    forearmGroup.add(forearmMesh);

    // Hand with palm and thumb
    const handGroup = new THREE.Group();
    handGroup.position.set(0, -forearmLen, 0);
    forearmGroup.add(handGroup);

    const palmGeo = new THREE.BoxGeometry(0.036, 0.062, 0.024);
    palmGeo.translate(0, -0.031, 0);
    const palm = new THREE.Mesh(palmGeo, skinMat);
    handGroup.add(palm);

    const thumbGeo = new THREE.CylinderGeometry(0.010, 0.008, 0.028, 6);
    const thumb = new THREE.Mesh(thumbGeo, skinMat);
    thumb.position.set(side * 0.018, -0.02, 0.01);
    thumb.rotation.z = side * -0.4;
    handGroup.add(thumb);

    torsoGroup.add(shoulderGroup);
    return { shoulderGroup, forearmGroup };
  }

  const leftArm = buildArm(-1);
  const rightArm = buildArm(1);

  // ---------------------------------------------------------------------------
  // 9. ARTICULATED LOWER LIMBS (Hips, Thighs, Knees, Calves, Feet)
  // ---------------------------------------------------------------------------
  const thighLen = legHeight * 0.52;
  const calfLen = legHeight * 0.48;

  function buildLeg(side: number): {
    hipGroup: THREE.Group;
    kneeGroup: THREE.Group;
  } {
    const hipGroup = new THREE.Group();
    hipGroup.name = side < 0 ? 'LeftHip' : 'RightHip';
    hipGroup.position.set(side * (hipWidth * 0.38), hipElevation, 0);

    // Hip Joint
    const hipJoint = new THREE.Mesh(
      new THREE.SphereGeometry(0.060, 8, 8),
      pantsMat
    );
    hipGroup.add(hipJoint);

    // Thigh (Quadricep curve)
    const thighGeo = new THREE.CylinderGeometry(0.072, 0.058, thighLen, 12);
    thighGeo.translate(0, -thighLen / 2, 0);
    const thighMesh = new THREE.Mesh(thighGeo, pantsMat);
    thighMesh.castShadow = castShadow;
    hipGroup.add(thighMesh);

    // Articulated Patella Knee Joint
    const kneeGroup = new THREE.Group();
    kneeGroup.name = side < 0 ? 'LeftKnee' : 'RightKnee';
    kneeGroup.position.set(0, -thighLen, 0);
    hipGroup.add(kneeGroup);

    const patella = new THREE.Mesh(
      new THREE.SphereGeometry(0.048, 8, 8),
      pantsMat
    );
    kneeGroup.add(patella);

    // Calf (Gastrocnemius taper to ankle)
    const calfGeo = new THREE.CylinderGeometry(0.054, 0.042, calfLen, 12);
    calfGeo.translate(0, -calfLen / 2, 0);
    const calfMesh = new THREE.Mesh(calfGeo, pantsMat);
    calfMesh.castShadow = castShadow;
    kneeGroup.add(calfMesh);

    // Modern Lifestyle Footwear
    const footGroup = new THREE.Group();
    footGroup.position.set(0, -calfLen, 0);
    kneeGroup.add(footGroup);

    // Shoe Body Upper
    const shoeBodyGeo = new THREE.BoxGeometry(0.078, 0.060, 0.165);
    shoeBodyGeo.translate(0, 0.030, 0.032);
    const shoeBody = new THREE.Mesh(shoeBodyGeo, shoesMat);
    shoeBody.castShadow = castShadow;
    footGroup.add(shoeBody);

    // Sneaker Cushioned Midsole / Outsole
    const soleGeo = new THREE.BoxGeometry(0.084, 0.024, 0.175);
    soleGeo.translate(0, 0.012, 0.032);
    const sole = new THREE.Mesh(soleGeo, soleMat);
    footGroup.add(sole);

    root.add(hipGroup);
    return { hipGroup, kneeGroup };
  }

  const leftLeg = buildLeg(-1);
  const rightLeg = buildLeg(1);

  // Apply root scaling
  if (scale !== 1.0) {
    root.scale.set(scale, scale, scale);
  }

  // ---------------------------------------------------------------------------
  // 10. REALISTIC KINEMATICS & GAIT ANIMATION (Physics-Matched Cadence)
  // ---------------------------------------------------------------------------
  let idleTime = Math.random() * 10;
  let landingCompression = 0;

  const updateAnimation = (
    walkTime: number,
    isMoving: boolean,
    isSprinting: boolean,
    isJumping: boolean,
    verticalVelocity: number,
    dt: number,
    movementSpeed: number = 2.0,
    gesture: HumanoidGesture = 'none'
  ) => {
    idleTime += dt;

    if (isJumping) {
      // In-air airborne kinematics (leg tuck & balance arms)
      const tuckAngle = -0.38;
      leftLeg.hipGroup.rotation.x = tuckAngle;
      rightLeg.hipGroup.rotation.x = tuckAngle * 0.85;
      leftLeg.kneeGroup.rotation.x = 0.55;
      rightLeg.kneeGroup.rotation.x = 0.45;

      leftArm.shoulderGroup.rotation.x = 0.42;
      rightArm.shoulderGroup.rotation.x = 0.42;
      leftArm.forearmGroup.rotation.x = -0.55;
      rightArm.forearmGroup.rotation.x = -0.55;

      torsoGroup.rotation.x = 0.06;
      landingCompression = 0.20;
    } else if (gesture === 'sit') {
      // Realistic seated posture on bench or chair
      const sitLerp = Math.min(1, dt * 8);
      leftLeg.hipGroup.rotation.x += (-1.48 - leftLeg.hipGroup.rotation.x) * sitLerp;
      rightLeg.hipGroup.rotation.x += (-1.48 - rightLeg.hipGroup.rotation.x) * sitLerp;
      leftLeg.kneeGroup.rotation.x += (1.48 - leftLeg.kneeGroup.rotation.x) * sitLerp;
      rightLeg.kneeGroup.rotation.x += (1.48 - rightLeg.kneeGroup.rotation.x) * sitLerp;

      // Lower torso to seat elevation
      torsoGroup.position.y += (hipElevation - 0.28 - torsoGroup.position.y) * sitLerp;
      leftLeg.hipGroup.position.y = torsoGroup.position.y - 0.07;
      rightLeg.hipGroup.position.y = torsoGroup.position.y - 0.07;

      // Hands resting gently on lap/knees
      leftArm.shoulderGroup.rotation.x += (-0.45 - leftArm.shoulderGroup.rotation.x) * sitLerp;
      rightArm.shoulderGroup.rotation.x += (-0.45 - rightArm.shoulderGroup.rotation.x) * sitLerp;
      leftArm.shoulderGroup.rotation.z += (0.05 - leftArm.shoulderGroup.rotation.z) * sitLerp;
      rightArm.shoulderGroup.rotation.z += (-0.05 - rightArm.shoulderGroup.rotation.z) * sitLerp;
      leftArm.forearmGroup.rotation.x += (-0.72 - leftArm.forearmGroup.rotation.x) * sitLerp;
      rightArm.forearmGroup.rotation.x += (-0.72 - rightArm.forearmGroup.rotation.x) * sitLerp;
      leftArm.forearmGroup.rotation.z = 0;
      rightArm.forearmGroup.rotation.z = 0;

      torsoGroup.rotation.x += (0.08 - torsoGroup.rotation.x) * sitLerp;
      torsoGroup.rotation.y = 0;
      torsoGroup.rotation.z = 0;
    } else if (isMoving) {
      // Natural walking / running gait matching ground speed
      const speedRatio = Math.max(0.5, Math.min(2.8, movementSpeed / 2.0));
      const legAmplitude = Math.min(0.72, 0.44 * speedRatio);
      const armAmplitude = Math.min(0.78, 0.48 * speedRatio);

      const legSwing = Math.sin(walkTime) * legAmplitude;
      const armSwing = Math.sin(walkTime) * armAmplitude;

      // Legs swing in opposition
      leftLeg.hipGroup.rotation.x = legSwing;
      rightLeg.hipGroup.rotation.x = -legSwing;

      // Anatomical backward knee bend only
      const kneeFlexMult = isSprinting ? 1.15 : 0.88;
      leftLeg.kneeGroup.rotation.x = Math.max(0, -legSwing) * kneeFlexMult;
      rightLeg.kneeGroup.rotation.x = Math.max(0, legSwing) * kneeFlexMult;

      // Arms swing opposite legs with natural elbow flexion
      leftArm.shoulderGroup.rotation.x = -armSwing;
      rightArm.shoulderGroup.rotation.x = armSwing;
      leftArm.shoulderGroup.rotation.z = 0;
      rightArm.shoulderGroup.rotation.z = 0;

      const elbowBend = -0.22 - Math.abs(armSwing) * (gesture === 'jog' ? 0.72 : 0.42);
      leftArm.forearmGroup.rotation.x = elbowBend;
      rightArm.forearmGroup.rotation.x = elbowBend;
      leftArm.forearmGroup.rotation.z = 0;
      rightArm.forearmGroup.rotation.z = 0;

      // Torso counter-rotation & subtle forward lean proportional to speed
      torsoGroup.rotation.y = -legSwing * 0.10;
      torsoGroup.rotation.x = Math.min(0.18, 0.04 + (movementSpeed / 5.5) * 0.12);
      torsoGroup.rotation.z = 0;

      // Pelvic vertical displacement (double frequency bounce)
      const bounce = Math.cos(walkTime * 2) * (isSprinting ? 0.028 : 0.016);
      torsoGroup.position.y = hipElevation + 0.07 + bounce;
      leftLeg.hipGroup.position.y = hipElevation + bounce * 0.5;
      rightLeg.hipGroup.position.y = hipElevation + bounce * 0.5;
    } else {
      // Idle or Gesturing while standing
      const breath = Math.sin(idleTime * 2.0) * 0.02;
      const weightShift = Math.sin(idleTime * 0.75) * 0.025;
      const restLerp = Math.min(1, dt * 7);

      leftLeg.hipGroup.rotation.x += (0 - leftLeg.hipGroup.rotation.x) * restLerp;
      rightLeg.hipGroup.rotation.x += (0 - rightLeg.hipGroup.rotation.x) * restLerp;
      leftLeg.kneeGroup.rotation.x += (0 - leftLeg.kneeGroup.rotation.x) * restLerp;
      rightLeg.kneeGroup.rotation.x += (0 - rightLeg.kneeGroup.rotation.x) * restLerp;
      leftLeg.hipGroup.position.y = hipElevation;
      rightLeg.hipGroup.position.y = hipElevation;

      if (gesture === 'wave') {
        // Friendly wave gesture
        leftArm.shoulderGroup.rotation.x += (0 - leftArm.shoulderGroup.rotation.x) * restLerp;
        leftArm.shoulderGroup.rotation.z += (0 - leftArm.shoulderGroup.rotation.z) * restLerp;
        leftArm.forearmGroup.rotation.x += (-0.14 - leftArm.forearmGroup.rotation.x) * restLerp;

        rightArm.shoulderGroup.rotation.x += (0.28 - rightArm.shoulderGroup.rotation.x) * restLerp;
        rightArm.shoulderGroup.rotation.z += (2.28 - rightArm.shoulderGroup.rotation.z) * restLerp;
        rightArm.forearmGroup.rotation.x += (-0.65 - rightArm.forearmGroup.rotation.x) * restLerp;
        rightArm.forearmGroup.rotation.z = Math.sin(idleTime * 7.5) * 0.40;

        torsoGroup.rotation.x += (0 - torsoGroup.rotation.x) * restLerp;
        torsoGroup.rotation.y += (0.05 - torsoGroup.rotation.y) * restLerp;
        torsoGroup.rotation.z = weightShift * 0.5;
      } else if (gesture === 'cheer') {
        // High celebratory cheer
        leftArm.shoulderGroup.rotation.x += (0.18 - leftArm.shoulderGroup.rotation.x) * restLerp;
        rightArm.shoulderGroup.rotation.x += (0.18 - rightArm.shoulderGroup.rotation.x) * restLerp;
        leftArm.shoulderGroup.rotation.z += (-2.05 - leftArm.shoulderGroup.rotation.z) * restLerp;
        rightArm.shoulderGroup.rotation.z += (2.05 - rightArm.shoulderGroup.rotation.z) * restLerp;

        const cheerBounce = Math.sin(idleTime * 6.0) * 0.22;
        leftArm.forearmGroup.rotation.x = -0.55 + cheerBounce;
        rightArm.forearmGroup.rotation.x = -0.55 + cheerBounce;

        torsoGroup.rotation.x += (-0.08 - torsoGroup.rotation.x) * restLerp;
        torsoGroup.rotation.y = 0;
        torsoGroup.rotation.z = 0;
      } else if (gesture === 'work') {
        // Farming / Crafting working animation: bending slightly over crops/bench
        torsoGroup.rotation.x += (0.32 - torsoGroup.rotation.x) * restLerp;
        torsoGroup.rotation.y = Math.sin(idleTime * 1.5) * 0.08;
        torsoGroup.rotation.z = 0;

        leftLeg.kneeGroup.rotation.x += (0.18 - leftLeg.kneeGroup.rotation.x) * restLerp;
        rightLeg.kneeGroup.rotation.x += (0.18 - rightLeg.kneeGroup.rotation.x) * restLerp;

        leftArm.shoulderGroup.rotation.x = -0.55 + Math.sin(idleTime * 2.8) * 0.22;
        rightArm.shoulderGroup.rotation.x = -0.68 + Math.cos(idleTime * 2.8) * 0.28;
        leftArm.shoulderGroup.rotation.z = 0.12;
        rightArm.shoulderGroup.rotation.z = -0.12;
        leftArm.forearmGroup.rotation.x = -0.75;
        rightArm.forearmGroup.rotation.x = -0.85;
      } else if (gesture === 'dance') {
        // Rhythmic music groove
        const groove = Math.sin(idleTime * 3.5);
        torsoGroup.rotation.y = groove * 0.25;
        torsoGroup.rotation.z = Math.cos(idleTime * 3.5) * 0.12;
        torsoGroup.rotation.x = Math.sin(idleTime * 7.0) * 0.04;

        leftArm.shoulderGroup.rotation.x = groove * 0.35;
        rightArm.shoulderGroup.rotation.x = -groove * 0.35;
        leftArm.shoulderGroup.rotation.z = -0.3 + Math.abs(groove) * 0.2;
        rightArm.shoulderGroup.rotation.z = 0.3 - Math.abs(groove) * 0.2;
        leftArm.forearmGroup.rotation.x = -0.8;
        rightArm.forearmGroup.rotation.x = -0.8;
      } else {
        // Standard Idle
        leftArm.shoulderGroup.rotation.x += (0 - leftArm.shoulderGroup.rotation.x) * restLerp;
        rightArm.shoulderGroup.rotation.x += (0 - rightArm.shoulderGroup.rotation.x) * restLerp;
        leftArm.shoulderGroup.rotation.z += (0 - leftArm.shoulderGroup.rotation.z) * restLerp;
        rightArm.shoulderGroup.rotation.z += (0 - rightArm.shoulderGroup.rotation.z) * restLerp;
        leftArm.forearmGroup.rotation.x += (-0.14 - leftArm.forearmGroup.rotation.x) * restLerp;
        rightArm.forearmGroup.rotation.x += (-0.14 - rightArm.forearmGroup.rotation.x) * restLerp;
        leftArm.forearmGroup.rotation.z = 0;
        rightArm.forearmGroup.rotation.z = 0;

        torsoGroup.rotation.x += (0 - torsoGroup.rotation.x) * restLerp;
        torsoGroup.rotation.y += (0 - torsoGroup.rotation.y) * restLerp;
        torsoGroup.rotation.z = weightShift;
      }

      // Natural chest breathing scale
      chestMesh.scale.set(1 + breath * 0.4, 1, 1 + breath);

      // Smooth landing absorption
      if (landingCompression > 0) {
        landingCompression -= dt * 2.2;
        torsoGroup.position.y = hipElevation + 0.07 - landingCompression * 0.05;
      } else {
        torsoGroup.position.y = hipElevation + 0.07;
      }
    }
  };

  const dispose = () => {
    skinMat.dispose();
    hairMat.dispose();
    shirtMat.dispose();
    pantsMat.dispose();
    shoesMat.dispose();
    soleMat.dispose();
    eyeMat.dispose();
    browMat.dispose();
    lipsMat.dispose();
  };

  return {
    root,
    torsoGroup,
    chestMesh,
    neckMesh,
    headGroup,
    headMesh,
    leftEyeMesh,
    rightEyeMesh,
    leftShoulder: leftArm.shoulderGroup,
    leftForearmGroup: leftArm.forearmGroup,
    rightShoulder: rightArm.shoulderGroup,
    rightForearmGroup: rightArm.forearmGroup,
    leftHip: leftLeg.hipGroup,
    leftKneeGroup: leftLeg.kneeGroup,
    rightHip: rightLeg.hipGroup,
    rightKneeGroup: rightLeg.kneeGroup,
    updateAnimation,
    dispose,
  };
}
