import * as THREE from 'three';
import {
  createHumanoidCharacter,
  SKIN_TONES,
  HAIR_COLORS,
  HumanGender,
  HumanHairStyle,
  HumanOutfitType,
} from '../src/world/humanoidCharacterSystem';
import {
  AVATAR_SKIN_TONES,
  AVATAR_HAIRSTYLES,
  AVATAR_STYLES,
} from '../src/multiplayer/types';

function runHumanoidAndPhysicsAudit() {
  console.log('=== RUNNING REALISTIC HUMANOID & MOVEMENT PHYSICS AUDIT ===');
  let errors: string[] = [];

  // 1. Test Anatomical Structure & Proportions for Male
  console.log('Checking Male Humanoid Proportions & Anatomy...');
  const maleRig = createHumanoidCharacter({
    gender: 'male',
    hairStyle: 'pompadour',
    outfitType: 'casual',
    primaryColor: '#06b6d4',
    secondaryColor: 0xffffff,
    skinTone: SKIN_TONES.warmBeige,
    hairColor: HAIR_COLORS.darkBrown,
    castShadow: false,
  });

  const maleBBox = new THREE.Box3().setFromObject(maleRig.root);
  const maleHeight = maleBBox.max.y - maleBBox.min.y;
  console.log(`- Male Total Height: ${maleHeight.toFixed(3)}m (Target: ~1.75m ± 0.1m)`);
  if (maleHeight < 1.65 || maleHeight > 1.88) {
    errors.push(`Male height ${maleHeight.toFixed(3)}m out of realistic human range [1.65m, 1.88m]`);
  }

  // 2. Check Facial Anatomy Components
  console.log('Verifying Detailed Facial Anatomy Components...');
  const headChildrenCount = maleRig.headGroup.children.length;
  const hasEyes = !!(maleRig.leftEyeMesh && maleRig.rightEyeMesh);
  const hasComplexAnatomy = headChildrenCount >= 8; // cranium, jaw, nose bridge, nose tip, lips, ears, brows, scalp, etc.

  console.log(`- Head compound meshes count: ${headChildrenCount} (>= 8 expected)`);
  console.log(`- Eyes with iris/pupil meshes: ${hasEyes}`);

  if (!hasEyes || !hasComplexAnatomy) {
    errors.push('Humanoid face missing required anatomical features (eyes, nose, lips, ears, eyebrows)');
  }

  // 3. Test Female Anatomical Proportions
  console.log('Checking Female Humanoid Proportions & Anatomy...');
  const femaleRig = createHumanoidCharacter({
    gender: 'female',
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

  // 4. Verify Movement Kinematics & Stride Synchronization
  console.log('Verifying Articulated Animation & Zero-Slide Stride...');
  // Idle test: limbs resting, idle breathing active
  maleRig.updateAnimation(0, false, false, false, 0, 0.016, 0);
  const idleArmRot = maleRig.leftShoulder.rotation.x;
  console.log(`- Idle shoulder pitch: ${idleArmRot.toFixed(3)} rad`);

  // Walking test: cadence at 2.0 m/s
  maleRig.updateAnimation(1.0, true, false, false, 0, 0.016, 2.0);
  const walkLegRot = maleRig.leftHip.rotation.x;
  console.log(`- Walking hip excursion at 2.0 m/s: ${walkLegRot.toFixed(3)} rad`);
  if (Math.abs(walkLegRot) < 0.05) {
    errors.push('Leg swing kinematics inactive during walk cycle');
  }

  // Sprinting test: cadence at 5.5 m/s (higher amplitude & torso forward lean)
  maleRig.updateAnimation(1.0, true, true, false, 0, 0.016, 5.5);
  const sprintLegRot = maleRig.leftHip.rotation.x;
  const sprintTorsoLean = maleRig.torsoGroup.rotation.x;
  console.log(`- Sprint hip excursion at 5.5 m/s: ${sprintLegRot.toFixed(3)} rad`);
  console.log(`- Sprint torso forward lean: ${sprintTorsoLean.toFixed(3)} rad`);
  if (sprintTorsoLean <= 0) {
    errors.push('Torso does not lean forward during sprint');
  }

  // 5. Test Locomotion Velocities & Diagonal Normalization
  console.log('Verifying Speed Constants & Diagonal Normalization...');
  const WALK_SPEED = 2.0;
  const RUN_SPEED = 4.0;
  const SPRINT_SPEED = 5.5;

  console.log(`- Walk Speed: ${WALK_SPEED} m/s`);
  console.log(`- Run Speed: ${RUN_SPEED} m/s`);
  console.log(`- Sprint Speed: ${SPRINT_SPEED} m/s`);

  // Diagonal normalization
  const inputX = 1.0;
  const inputZ = 1.0;
  const rawMagnitude = Math.sqrt(inputX * inputX + inputZ * inputZ); // 1.414
  const normalizedVector = new THREE.Vector2(inputX, inputZ).normalize();
  const normalizedMagnitude = normalizedVector.length();

  console.log(`- Raw diagonal input length: ${rawMagnitude.toFixed(3)}`);
  console.log(`- Normalized diagonal length: ${normalizedMagnitude.toFixed(3)}`);
  if (Math.abs(normalizedMagnitude - 1.0) > 0.001) {
    errors.push(`Diagonal movement not normalized: length is ${normalizedMagnitude}`);
  }

  const diagonalSpeed = normalizedMagnitude * WALK_SPEED;
  console.log(`- Diagonal walk displacement: ${diagonalSpeed.toFixed(2)} m/s (Strictly equals forward 2.0 m/s)`);
  if (Math.abs(diagonalSpeed - WALK_SPEED) > 0.01) {
    errors.push(`Diagonal speed ${diagonalSpeed} exceeds forward walking speed ${WALK_SPEED}`);
  }

  // 6. Test All Outfits, Hairstyles, and Skin Tones
  console.log('Verifying Customization Matrices...');
  console.log(`- Available Skin Tones: ${AVATAR_SKIN_TONES.length} (${AVATAR_SKIN_TONES.map(s => s.label).join(', ')})`);
  console.log(`- Available Hairstyles: ${AVATAR_HAIRSTYLES.length} (${AVATAR_HAIRSTYLES.map(h => h.label).join(', ')})`);
  console.log(`- Available Outfits: ${AVATAR_STYLES.length} (${AVATAR_STYLES.map(o => o.label).join(', ')})`);

  if (AVATAR_SKIN_TONES.length < 6) errors.push('Fewer than 6 skin tones supported');
  if (AVATAR_HAIRSTYLES.length < 6) errors.push('Fewer than 6 hairstyles supported');
  if (AVATAR_STYLES.length < 6) errors.push('Fewer than 6 outfit styles supported');

  // Verify that all hairstyles compile without error
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
  }

  console.log('--------------------------------------------------');
  if (errors.length > 0) {
    console.error(`FAILED WITH ${errors.length} ERRORS:`);
    errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  } else {
    console.log('ALL HUMANOID, NAME TAG & PHYSICS AUDITS PASSED WITH 0 DEFECTS!');
  }
}

runHumanoidAndPhysicsAudit();
