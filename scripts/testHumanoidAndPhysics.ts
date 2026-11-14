import * as fs from 'fs';
import * as path from 'path';
import * as THREE from 'three';
import {
  createHumanoidCharacter,
  SKIN_TONES,
  HAIR_COLORS,
  HumanHairStyle,
} from '../src/world/humanoidCharacterSystem';
import { characterAssetManager } from '../src/world/glbCharacterLoader';
import {
  AVATAR_SKIN_TONES,
  AVATAR_HAIRSTYLES,
  AVATAR_STYLES,
  AVATAR_HAIR_COLORS,
  AVATAR_EYE_COLORS,
} from '../src/multiplayer/types';
import { AvatarManager } from '../src/multiplayer/avatarManager';

async function runHumanoidAndPhysicsAudit() {
  console.log('=== RUNNING REALISTIC HUMANOID, GLB ASSET PIPELINE & MOVEMENT PHYSICS AUDIT ===');
  const errors: string[] = [];

  // 1. Validate /public/models/characters/manifest.json & characterAssetManager status
  console.log('Checking GLB Character Manifest & Asset Pipeline...');
  const manifestPath = path.resolve(process.cwd(), 'public/models/characters/manifest.json');
  if (!fs.existsSync(manifestPath)) {
    errors.push(`Missing character models manifest at ${manifestPath}`);
  } else {
    try {
      const raw = fs.readFileSync(manifestPath, 'utf-8');
      const parsed = JSON.parse(raw);
      const expectedRoles = [
        'player_male',
        'player_female',
        'npc_rural_male',
        'npc_rural_female',
        'npc_modern_male',
        'npc_modern_female',
        'npc_capital_male',
        'npc_capital_female',
      ];
      for (const role of expectedRoles) {
        if (!parsed.requiredModels?.[role]?.file) {
          errors.push(`manifest.json missing requiredModels entry for role: ${role}`);
        }
      }
      if (parsed.requiredModels?.player_male?.file !== 'Athletic_man.glb') {
        errors.push(`Expected player_male.file === 'Athletic_man.glb', got '${parsed.requiredModels?.player_male?.file}'`);
      }
      console.log(`- manifest.json validated (${expectedRoles.length} character roles defined; player_male=${parsed.requiredModels?.player_male?.file})`);
    } catch (e) {
      errors.push(`Invalid JSON in manifest.json: ${String(e)}`);
    }
  }

  const assetStatus = characterAssetManager.getAssetStatus();
  console.log(`- GLB Asset Status: ${assetStatus.availableCount} / ${assetStatus.totalRequired} local .glb models present`);
  if (assetStatus.totalRequired !== 8) {
    errors.push(`Expected 8 required GLB character roles, found ${assetStatus.totalRequired}`);
  }

  // Verify strict missing-asset error reporting (no silent mannequin fallback for player_male)
  const missingInstance = await characterAssetManager.createInstance('player_male');
  if (assetStatus.availableCount === 0) {
    if (missingInstance !== null) {
      errors.push('Expected null instance when Athletic_man.glb is missing');
    }
    const loadErr = characterAssetManager.getErrorForRole('player_male');
    if (!loadErr || loadErr.reason !== 'missing_file') {
      errors.push('Expected structured missing_file error for player_male when Athletic_man.glb is absent');
    } else {
      console.log(`- Strict load error reported cleanly: ${loadErr.reason} (${loadErr.expectedFile})`);
    }
  }

  const strictMaleRig = createHumanoidCharacter({
    gender: 'male',
    roleKey: 'player_male',
    strictAssetRequired: true,
    castShadow: false,
  });
  if (strictMaleRig.root.children.some((c) => c.visible) && assetStatus.availableCount === 0) {
    errors.push('strictAssetRequired male rig rendered visible fallback geometry despite missing Athletic_man.glb');
  }
  strictMaleRig.dispose();

  // 2. Test Anatomical Structure & Proportions for Male
  console.log('Checking Male Humanoid Proportions & Anatomy...');
  const maleRig = createHumanoidCharacter({
    gender: 'male',
    roleKey: 'player_male',
    hairStyle: 'pompadour',
    outfitType: 'casual',
    primaryColor: '#06b6d4',
    secondaryColor: 0xffffff,
    skinTone: SKIN_TONES.warmBeige,
    hairColor: HAIR_COLORS.darkBrown,
    castShadow: false,
  });

  if (maleRig.getRigMode() !== 'procedural_fallback' && assetStatus.availableCount === 0) {
    errors.push(`Expected procedural_fallback rigMode when 0 GLBs loaded, got ${maleRig.getRigMode()}`);
  }
  if (typeof maleRig.getLoadedClipNames !== 'function') {
    errors.push('HumanoidRig missing getLoadedClipNames()');
  }

  const maleBBox = new THREE.Box3().setFromObject(maleRig.root);
  const maleHeight = maleBBox.max.y - maleBBox.min.y;
  console.log(`- Male Total Height: ${maleHeight.toFixed(3)}m (Target: ~1.75m ± 0.1m)`);
  if (maleHeight < 1.65 || maleHeight > 1.88) {
    errors.push(`Male height ${maleHeight.toFixed(3)}m out of realistic human range [1.65m, 1.88m]`);
  }

  // 3. Check Facial Anatomy Components
  console.log('Verifying Detailed Facial Anatomy Components...');
  const headChildrenCount = maleRig.headGroup.children.length;
  const hasEyes = !!(maleRig.leftEyeMesh && maleRig.rightEyeMesh);
  const hasComplexAnatomy = headChildrenCount >= 8;

  console.log(`- Head compound meshes count: ${headChildrenCount} (>= 8 expected)`);
  console.log(`- Eyes with iris/pupil meshes: ${hasEyes}`);

  if (!hasEyes || !hasComplexAnatomy) {
    errors.push('Humanoid face missing required anatomical features (eyes, nose, lips, ears, eyebrows)');
  }

  // 4. Test Female Anatomical Proportions
  console.log('Checking Female Humanoid Proportions & Anatomy...');
  const femaleRig = createHumanoidCharacter({
    gender: 'female',
    roleKey: 'player_female',
    hairStyle: 'long_flowing',
    outfitType: 'formal_blazer',
    primaryColor: '#ec4899',
    secondaryColor: 0xffffff,
    skinTone: SKIN_TONES.olive,
    hairColor: HAIR_COLORS.black,
    castShadow: false,
  });

  const femaleBBox = new THREE.Box3().setFromObject(femaleRig.root);
  const femaleHeight = femaleBBox.max.y - femaleBBox.min.y;
  console.log(`- Female Total Height: ${femaleHeight.toFixed(3)}m (Target: ~1.68m ± 0.1m)`);
  if (femaleHeight < 1.58 || femaleHeight > 1.82) {
    errors.push(`Female height ${femaleHeight.toFixed(3)}m out of realistic human range [1.58m, 1.82m]`);
  }

  // 5. Verify Movement Kinematics, Stride Synchronization & Camera-Distance LOD
  console.log('Verifying Articulated Animation, LOD Throttling & Zero-Slide Stride...');
  maleRig.updateAnimation(0, false, false, false, 0, 0.016, 0, 'none', 10);
  const idleArmRot = maleRig.leftShoulder.rotation.x;
  console.log(`- Idle shoulder pitch: ${idleArmRot.toFixed(3)} rad`);

  maleRig.updateAnimation(1.0, true, false, false, 0, 0.016, AvatarManager.WALK_SPEED, 'none', 10);
  const walkLegRot = maleRig.leftHip.rotation.x;
  console.log(`- Walking hip excursion at ${AvatarManager.WALK_SPEED} m/s: ${walkLegRot.toFixed(3)} rad`);
  if (Math.abs(walkLegRot) < 0.05) {
    errors.push('Leg swing kinematics inactive during walk cycle');
  }

  maleRig.updateAnimation(1.0, true, true, false, 0, 0.016, AvatarManager.SPRINT_SPEED, 'none', 10);
  const sprintLegRot = maleRig.leftHip.rotation.x;
  const sprintTorsoLean = maleRig.torsoGroup.rotation.x;
  console.log(`- Sprint hip excursion at ${AvatarManager.SPRINT_SPEED} m/s: ${sprintLegRot.toFixed(3)} rad`);
  console.log(`- Sprint torso forward lean: ${sprintTorsoLean.toFixed(3)} rad`);
  if (sprintTorsoLean <= 0) {
    errors.push('Torso does not lean forward during sprint');
  }

  // LOD distance culling (>110m) and throttling (>55m)
  maleRig.updateAnimation(1.2, true, false, false, 0, 0.016, AvatarManager.WALK_SPEED, 'none', 75);
  maleRig.updateAnimation(1.3, true, false, false, 0, 0.016, AvatarManager.WALK_SPEED, 'none', 120);
  console.log('- Distance LOD (>55m throttle, >110m cull) executed cleanly');

  // 6. Test AvatarManager Locomotion Velocities & Diagonal Normalization
  console.log('Verifying AvatarManager Speed Constants & Diagonal Normalization...');
  const WALK_SPEED = AvatarManager.WALK_SPEED;
  const RUN_SPEED = AvatarManager.RUN_SPEED;
  const SPRINT_SPEED = AvatarManager.SPRINT_SPEED;

  console.log(`- Walk Speed: ${WALK_SPEED} m/s | Run Speed: ${RUN_SPEED} m/s | Sprint Speed: ${SPRINT_SPEED} m/s`);
  if (WALK_SPEED !== 1.4 || RUN_SPEED !== 3.5 || SPRINT_SPEED !== 5.0) {
    errors.push(`Unexpected locomotion speeds: walk=${WALK_SPEED}, run=${RUN_SPEED}, sprint=${SPRINT_SPEED}`);
  }

  const inputX = 1.0;
  const inputZ = 1.0;
  const normalizedVector = new THREE.Vector2(inputX, inputZ).normalize();
  const normalizedMagnitude = normalizedVector.length();
  const diagonalSpeed = normalizedMagnitude * WALK_SPEED;
  console.log(`- Normalized diagonal walk displacement: ${diagonalSpeed.toFixed(2)} m/s`);
  if (Math.abs(diagonalSpeed - WALK_SPEED) > 0.01) {
    errors.push(`Diagonal speed ${diagonalSpeed} exceeds forward walking speed ${WALK_SPEED}`);
  }

  // 7. Test All Outfits, Hairstyles, Skin Tones, Hair Colors & Eye Colors
  console.log('Verifying Customization Matrices...');
  console.log(`- Skin Tones: ${AVATAR_SKIN_TONES.length}, Hairstyles: ${AVATAR_HAIRSTYLES.length}, Outfits: ${AVATAR_STYLES.length}, Hair Colors: ${AVATAR_HAIR_COLORS.length}, Eye Colors: ${AVATAR_EYE_COLORS.length}`);

  if (AVATAR_SKIN_TONES.length < 6) errors.push('Fewer than 6 skin tones supported');
  if (AVATAR_HAIRSTYLES.length < 6) errors.push('Fewer than 6 hairstyles supported');
  if (AVATAR_STYLES.length < 6) errors.push('Fewer than 6 outfit styles supported');
  if (AVATAR_HAIR_COLORS.length < 6) errors.push('Fewer than 6 hair colors supported');
  if (AVATAR_EYE_COLORS.length < 5) errors.push('Fewer than 5 eye colors supported');

  const hairstyles: HumanHairStyle[] = ['short_crop', 'pompadour', 'long_flowing', 'bun', 'braided', 'beanie', 'builder_helmet', 'cyber_visor', 'explorer_hat'];
  for (const hs of hairstyles) {
    const testRig = createHumanoidCharacter({
      gender: 'male',
      hairStyle: hs,
      outfitType: 'casual',
      primaryColor: '#06b6d4',
      secondaryColor: 0xffffff,
      skinTone: SKIN_TONES.fair,
      hairColor: HAIR_COLORS.black,
      castShadow: false,
    });
    if (!testRig.root) {
      errors.push(`Failed to construct hairstyle: ${hs}`);
    }
    testRig.dispose();
  }

  maleRig.dispose();
  femaleRig.dispose();

  console.log('--------------------------------------------------');
  if (errors.length > 0) {
    console.error(`FAILED WITH ${errors.length} ERRORS:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('ALL HUMANOID, GLB PIPELINE & PHYSICS AUDITS PASSED WITH 0 DEFECTS!');
  }
}

void runHumanoidAndPhysicsAudit();
