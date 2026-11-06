import * as THREE from 'three';
import { MaterialLibrary } from '../world/materials';
import { PlayerData, AvatarColor, AvatarType, AVATAR_COLORS } from './types';
import { multiplayerService, DEFAULT_SPAWN_POSITION } from './multiplayerService';
import { checkObstacleCollision, MAP_BOUNDS } from '../world/collisionSystem';

interface RemoteAvatarEntry {
  data: PlayerData;
  group: THREE.Group;
  nameSprite: THREE.Sprite;
  leftLeg: THREE.Object3D;
  rightLeg: THREE.Object3D;
  leftArm: THREE.Object3D;
  rightArm: THREE.Object3D;
  targetPosition: THREE.Vector3;
  targetRotation: number;
  walkTime: number;
}

export class AvatarManager {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;

  // Root group for all multiplayer avatar meshes
  public group: THREE.Group;

  // Local player avatar
  private localAvatarGroup: THREE.Group | null = null;
  private localLeftLeg: THREE.Object3D | null = null;
  private localRightLeg: THREE.Object3D | null = null;
  private localLeftArm: THREE.Object3D | null = null;
  private localRightArm: THREE.Object3D | null = null;
  private localNameSprite: THREE.Sprite | null = null;
  private localPosition: THREE.Vector3 = new THREE.Vector3(...DEFAULT_SPAWN_POSITION);
  private localRotation: number = 0;
  private localWalkTime: number = 0;
  private isLocalMoving: boolean = false;
  private isSprinting: boolean = false;

  // Third-person camera tracking with smooth zoom
  private followCamera: boolean = true;
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 4.2, 7.2);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();
  private readonly minCameraDist = 3.2;
  private readonly maxCameraDist = 16.0;
  private onWheelHandler: ((e: WheelEvent) => void) | null = null;

  // Remote avatars map: uid -> RemoteAvatarEntry
  private remoteAvatars: Map<string, RemoteAvatarEntry> = new Map();

  // Movement input state (Keyboard + Mobile Joystick)
  private inputMove: { forward: number; strafe: number } = { forward: 0, strafe: 0 };
  private moveSpeed: number = 8.0; // base walking units per second

  // Unsubscribe listener
  private remotePlayersUnsub: (() => void) | null = null;

  // Callback on player click/tap
  public onSelectPlayer?: (player: PlayerData) => void;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, materials: MaterialLibrary, isSoftwareGl: boolean) {
    this.scene = scene;
    this.camera = camera;
    this.materials = materials;
    this.isSoftwareGl = isSoftwareGl;

    this.group = new THREE.Group();
    this.group.name = 'MultiplayerAvatars';
    this.scene.add(this.group);

    this.initKeyboardListeners();
    this.initRemoteSubscription();
  }

  // ---------------------------------------------------------------------------
  // 1. LOCAL AVATAR CREATION & SPAWN
  // ---------------------------------------------------------------------------
  public spawnLocalAvatar(
    displayName: string,
    color: AvatarColor,
    style: AvatarType,
    spawnPos: [number, number, number] = DEFAULT_SPAWN_POSITION
  ) {
    this.removeLocalAvatar();

    this.localPosition.set(spawnPos[0], spawnPos[1], spawnPos[2]);
    this.localRotation = 0;

    const { group, leftLeg, rightLeg, leftArm, rightArm, nameSprite } = this.createAvatarMesh(
      displayName,
      color,
      style,
      true
    );

    this.localAvatarGroup = group;
    this.localLeftLeg = leftLeg;
    this.localRightLeg = rightLeg;
    this.localLeftArm = leftArm;
    this.localRightArm = rightArm;
    this.localNameSprite = nameSprite;

    this.localAvatarGroup.position.copy(this.localPosition);
    this.group.add(this.localAvatarGroup);

    // Initial camera alignment behind avatar
    if (this.followCamera) {
      this.snapCameraToLocalAvatar();
    }
  }

  public removeLocalAvatar() {
    if (this.localAvatarGroup) {
      this.group.remove(this.localAvatarGroup);
      this.localAvatarGroup = null;
      this.localLeftLeg = null;
      this.localRightLeg = null;
      this.localLeftArm = null;
      this.localRightArm = null;
      this.localNameSprite = null;
    }
  }

  public updateLocalAvatarAppearance(displayName: string, color: AvatarColor, style: AvatarType) {
    if (!this.localAvatarGroup) return;
    const currentPos: [number, number, number] = [this.localPosition.x, this.localPosition.y, this.localPosition.z];
    const currentRot = this.localRotation;
    this.spawnLocalAvatar(displayName, color, style, currentPos);
    this.localRotation = currentRot;
    if (this.localAvatarGroup) {
      this.localAvatarGroup.rotation.y = currentRot;
    }
  }

  // ---------------------------------------------------------------------------
  // 2. AVATAR 3D PROCEDURAL RIG GENERATOR
  // ---------------------------------------------------------------------------
  private createAvatarMesh(
    name: string,
    color: AvatarColor,
    style: AvatarType,
    isLocal: boolean
  ): {
    group: THREE.Group;
    leftLeg: THREE.Object3D;
    rightLeg: THREE.Object3D;
    leftArm: THREE.Object3D;
    rightArm: THREE.Object3D;
    nameSprite: THREE.Sprite;
  } {
    const root = new THREE.Group();

    // 1. High Quality Materials
    const colorHex = AVATAR_COLORS.find((c) => c.id === color)?.hex || '#06b6d4';
    const jacketMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.45,
      metalness: style === 'cyber' ? 0.35 : 0.08,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4,
      roughness: 0.65,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
    });
    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.5,
    });
    const soleMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      roughness: 0.3,
    });
    const beltMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      roughness: 0.5,
    });
    const buckleMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.8,
      roughness: 0.2,
    });
    const zipperMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.7,
      roughness: 0.3,
    });
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });

    // 2. Articulated Torso (Hips, Belt, Chest Jacket, Collar & Neck)
    const torso = new THREE.Group();
    torso.name = 'AvatarTorso';

    // Pelvis / Hips
    const pelvisGeo = new THREE.BoxGeometry(0.52, 0.24, 0.34);
    const pelvis = new THREE.Mesh(pelvisGeo, pantsMat);
    pelvis.position.y = 0.98;
    pelvis.castShadow = true;
    torso.add(pelvis);

    // Leather belt & metallic buckle
    const beltGeo = new THREE.BoxGeometry(0.54, 0.07, 0.35);
    const belt = new THREE.Mesh(beltGeo, beltMat);
    belt.position.y = 1.09;
    torso.add(belt);

    const buckleGeo = new THREE.BoxGeometry(0.12, 0.08, 0.03);
    const buckle = new THREE.Mesh(buckleGeo, buckleMat);
    buckle.position.set(0, 1.09, -0.18);
    torso.add(buckle);

    // Chest / Jacket
    const chestGeo = new THREE.BoxGeometry(0.60, 0.56, 0.40);
    const chest = new THREE.Mesh(chestGeo, jacketMat);
    chest.position.y = 1.40;
    chest.castShadow = true;
    chest.receiveShadow = true;
    torso.add(chest);

    // Jacket Zipper / Placket
    const zipperGeo = new THREE.BoxGeometry(0.04, 0.54, 0.02);
    const zipper = new THREE.Mesh(zipperGeo, zipperMat);
    zipper.position.set(0, 1.40, -0.205);
    torso.add(zipper);

    // Jacket Collar
    const collarGeo = new THREE.BoxGeometry(0.36, 0.10, 0.32);
    const collar = new THREE.Mesh(collarGeo, jacketMat);
    collar.position.y = 1.70;
    torso.add(collar);

    // Anatomical Neck
    const neckGeo = new THREE.CylinderGeometry(0.11, 0.12, 0.14, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = 1.78;
    torso.add(neck);

    root.add(torso);

    // 3. Proportional Head with Facial Features
    const headGroup = new THREE.Group();
    headGroup.name = 'AvatarHead';
    headGroup.position.y = 2.04;

    const headGeo = new THREE.BoxGeometry(0.44, 0.44, 0.42);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Expressive Eyes
    const eyeWhiteGeo = new THREE.BoxGeometry(0.08, 0.05, 0.02);
    const eyePupilGeo = new THREE.BoxGeometry(0.04, 0.04, 0.025);

    const leftEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    leftEyeWhite.position.set(-0.10, 0.03, -0.212);
    headGroup.add(leftEyeWhite);

    const leftPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    leftPupil.position.set(-0.10, 0.03, -0.215);
    headGroup.add(leftPupil);

    const rightEyeWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    rightEyeWhite.position.set(0.10, 0.03, -0.212);
    headGroup.add(rightEyeWhite);

    const rightPupil = new THREE.Mesh(eyePupilGeo, eyePupilMat);
    rightPupil.position.set(0.10, 0.03, -0.215);
    headGroup.add(rightPupil);

    // Eyebrows
    const browGeo = new THREE.BoxGeometry(0.09, 0.025, 0.02);
    const browMat = new THREE.MeshBasicMaterial({ color: 0x1f2937 });
    const leftBrow = new THREE.Mesh(browGeo, browMat);
    leftBrow.position.set(-0.10, 0.08, -0.214);
    headGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(browGeo, browMat);
    rightBrow.position.set(0.10, 0.08, -0.214);
    headGroup.add(rightBrow);

    // Ears
    const earGeo = new THREE.BoxGeometry(0.04, 0.09, 0.07);
    const leftEar = new THREE.Mesh(earGeo, skinMat);
    leftEar.position.set(-0.23, 0.0, -0.02);
    headGroup.add(leftEar);

    const rightEar = new THREE.Mesh(earGeo, skinMat);
    rightEar.position.set(0.23, 0.0, -0.02);
    headGroup.add(rightEar);

    // Distinct Style Headgear
    if (style === 'builder') {
      const helmetCap = new THREE.Mesh(
        new THREE.CylinderGeometry(0.26, 0.28, 0.16, 16),
        new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 })
      );
      helmetCap.position.y = 0.26;
      headGroup.add(helmetCap);

      const helmetBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.4 })
      );
      helmetBrim.position.y = 0.19;
      headGroup.add(helmetBrim);
    } else if (style === 'cyber') {
      const visorGeo = new THREE.BoxGeometry(0.48, 0.12, 0.16);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 0.03, -0.16);
      headGroup.add(visor);

      const headset = new THREE.Mesh(
        new THREE.BoxGeometry(0.50, 0.08, 0.08),
        new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3 })
      );
      headset.position.set(0, 0.0, -0.02);
      headGroup.add(headset);
    } else if (style === 'explorer') {
      const hatBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.38, 0.38, 0.04, 16),
        new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 })
      );
      hatBrim.position.y = 0.20;
      headGroup.add(hatBrim);

      const hatCrown = new THREE.Mesh(
        new THREE.CylinderGeometry(0.24, 0.26, 0.14, 16),
        new THREE.MeshStandardMaterial({ color: 0x57534e, roughness: 0.8 })
      );
      hatCrown.position.y = 0.28;
      headGroup.add(hatCrown);

      const backpack = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.52, 0.22),
        new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.7 })
      );
      backpack.position.set(0, 1.40, 0.28);
      torso.add(backpack);
    } else {
      const hairCrown = new THREE.Mesh(
        new THREE.BoxGeometry(0.46, 0.16, 0.44),
        new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.8 })
      );
      hairCrown.position.y = 0.24;
      headGroup.add(hairCrown);

      const hairBangs = new THREE.Mesh(
        new THREE.BoxGeometry(0.44, 0.09, 0.10),
        new THREE.MeshStandardMaterial({ color: 0x271c19, roughness: 0.8 })
      );
      hairBangs.position.set(0, 0.17, -0.19);
      headGroup.add(hairBangs);
    }

    root.add(headGroup);

    // 4. Articulated Arms (Pivoting at shoulders)
    // Left Arm
    const leftArm = new THREE.Group();
    leftArm.name = 'LeftArm';
    leftArm.position.set(-0.38, 1.62, 0);

    const shoulderGeo = new THREE.SphereGeometry(0.10, 8, 8);
    const leftShoulder = new THREE.Mesh(shoulderGeo, jacketMat);
    leftArm.add(leftShoulder);

    const upperArmGeo = new THREE.BoxGeometry(0.17, 0.32, 0.17);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    leftUpperArm.position.y = -0.16;
    leftUpperArm.castShadow = true;
    leftArm.add(leftUpperArm);

    const elbowGeo = new THREE.SphereGeometry(0.08, 8, 8);
    const leftElbow = new THREE.Mesh(elbowGeo, jacketMat);
    leftElbow.position.y = -0.32;
    leftArm.add(leftElbow);

    const forearmGeo = new THREE.BoxGeometry(0.15, 0.28, 0.15);
    const leftForearm = new THREE.Mesh(forearmGeo, jacketMat);
    leftForearm.position.y = -0.47;
    leftForearm.castShadow = true;
    leftArm.add(leftForearm);

    const leftHandGeo = new THREE.BoxGeometry(0.12, 0.13, 0.10);
    const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
    leftHand.position.y = -0.66;
    leftArm.add(leftHand);

    root.add(leftArm);

    // Right Arm
    const rightArm = new THREE.Group();
    rightArm.name = 'RightArm';
    rightArm.position.set(0.38, 1.62, 0);

    const rightShoulder = new THREE.Mesh(shoulderGeo, jacketMat);
    rightArm.add(rightShoulder);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, jacketMat);
    rightUpperArm.position.y = -0.16;
    rightUpperArm.castShadow = true;
    rightArm.add(rightUpperArm);

    const rightElbow = new THREE.Mesh(elbowGeo, jacketMat);
    rightElbow.position.y = -0.32;
    rightArm.add(rightElbow);

    const rightForearm = new THREE.Mesh(forearmGeo, jacketMat);
    rightForearm.position.y = -0.47;
    rightForearm.castShadow = true;
    rightArm.add(rightForearm);

    const rightHand = new THREE.Mesh(leftHandGeo, skinMat);
    rightHand.position.y = -0.66;
    rightArm.add(rightHand);

    root.add(rightArm);

    // 5. Articulated Legs (Pivoting at hips with articulated knees and sneakers attached to legs)
    // Left Leg
    const leftLeg = new THREE.Group();
    leftLeg.name = 'LeftLeg';
    leftLeg.position.set(-0.16, 0.88, 0);

    const hipJointGeo = new THREE.SphereGeometry(0.11, 8, 8);
    const leftHipJoint = new THREE.Mesh(hipJointGeo, pantsMat);
    leftLeg.add(leftHipJoint);

    const thighGeo = new THREE.BoxGeometry(0.20, 0.36, 0.22);
    const leftThigh = new THREE.Mesh(thighGeo, pantsMat);
    leftThigh.position.y = -0.18;
    leftThigh.castShadow = true;
    leftLeg.add(leftThigh);

    const kneeGeo = new THREE.SphereGeometry(0.09, 8, 8);
    const leftKnee = new THREE.Mesh(kneeGeo, pantsMat);
    leftKnee.position.y = -0.36;
    leftLeg.add(leftKnee);

    const leftCalfGroup = new THREE.Group();
    leftCalfGroup.name = 'LeftCalf';
    leftCalfGroup.position.set(0, -0.36, 0);

    const shinGeo = new THREE.BoxGeometry(0.18, 0.34, 0.20);
    const leftShin = new THREE.Mesh(shinGeo, pantsMat);
    leftShin.position.y = -0.17;
    leftShin.castShadow = true;
    leftCalfGroup.add(leftShin);

    const shoeUpperGeo = new THREE.BoxGeometry(0.20, 0.11, 0.28);
    const leftShoeUpper = new THREE.Mesh(shoeUpperGeo, shoesMat);
    leftShoeUpper.position.set(0, -0.38, -0.04);
    leftShoeUpper.castShadow = true;
    leftCalfGroup.add(leftShoeUpper);

    const shoeSoleGeo = new THREE.BoxGeometry(0.21, 0.04, 0.30);
    const leftShoeSole = new THREE.Mesh(shoeSoleGeo, soleMat);
    leftShoeSole.position.set(0, -0.45, -0.04);
    leftCalfGroup.add(leftShoeSole);

    leftLeg.add(leftCalfGroup);
    root.add(leftLeg);

    // Right Leg
    const rightLeg = new THREE.Group();
    rightLeg.name = 'RightLeg';
    rightLeg.position.set(0.16, 0.88, 0);

    const rightHipJoint = new THREE.Mesh(hipJointGeo, pantsMat);
    rightLeg.add(rightHipJoint);

    const rightThigh = new THREE.Mesh(thighGeo, pantsMat);
    rightThigh.position.y = -0.18;
    rightThigh.castShadow = true;
    rightLeg.add(rightThigh);

    const rightKnee = new THREE.Mesh(kneeGeo, pantsMat);
    rightKnee.position.y = -0.36;
    rightLeg.add(rightKnee);

    const rightCalfGroup = new THREE.Group();
    rightCalfGroup.name = 'RightCalf';
    rightCalfGroup.position.set(0, -0.36, 0);

    const rightShin = new THREE.Mesh(shinGeo, pantsMat);
    rightShin.position.y = -0.17;
    rightShin.castShadow = true;
    rightCalfGroup.add(rightShin);

    const rightShoeUpper = new THREE.Mesh(shoeUpperGeo, shoesMat);
    rightShoeUpper.position.set(0, -0.38, -0.04);
    rightShoeUpper.castShadow = true;
    rightCalfGroup.add(rightShoeUpper);

    const rightShoeSole = new THREE.Mesh(shoeSoleGeo, soleMat);
    rightShoeSole.position.set(0, -0.45, -0.04);
    rightCalfGroup.add(rightShoeSole);

    rightLeg.add(rightCalfGroup);
    root.add(rightLeg);

    // 6. Ground shadow decal / ring
    const shadowGeo = new THREE.RingGeometry(0.2, 0.55, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const shadowRing = new THREE.Mesh(shadowGeo, shadowMat);
    shadowRing.position.y = 0.02;
    root.add(shadowRing);

    // 7. 3D Floating Name Tag Billboard
    const nameSprite = this.createNameBillboard(name, colorHex, isLocal);
    nameSprite.position.set(0, 2.65, 0);
    root.add(nameSprite);

    // Metadata for raycasting
    root.traverse((child) => {
      child.userData = {
        isAvatar: true,
        isLocal,
        playerName: name,
        colorHex,
      };
    });

    return { group: root, leftLeg, rightLeg, leftArm, rightArm, nameSprite };
  }

  private createNameBillboard(name: string, colorHex: string, isLocal: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 96;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Pill background
      const w = 360;
      const h = 72;
      const x = 12;
      const y = 12;
      const r = 36;

      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + w - r, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + r);
      ctx.lineTo(x + w, y + h - r);
      ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
      ctx.lineTo(x + r, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - r);
      ctx.lineTo(x, y + r);
      ctx.quadraticCurveTo(x, y, x + r, y);
      ctx.closePath();

      ctx.fillStyle = 'rgba(10, 16, 28, 0.85)';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = colorHex;
      ctx.stroke();

      // Dot badge
      ctx.beginPath();
      ctx.arc(x + 36, y + h / 2, 12, 0, Math.PI * 2);
      ctx.fillStyle = colorHex;
      ctx.fill();

      // Text
      ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      const safeName = typeof name === 'string' && name.trim() ? name.trim() : 'Resident';
      const truncated = safeName.length > 15 ? safeName.slice(0, 14) + '…' : safeName;
      ctx.fillText(truncated + (isLocal ? ' (You)' : ''), x + 58, y + h / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2.4, 0.6, 1);
    return sprite;
  }

  // ---------------------------------------------------------------------------
  // 3. REMOTE PLAYERS SYNCHRONIZATION
  // ---------------------------------------------------------------------------
  private initRemoteSubscription() {
    this.remotePlayersUnsub = multiplayerService.onRemotePlayersUpdate((players) => {
      const activeUids = new Set<string>();

      for (const p of players) {
        activeUids.add(p.uid);

        let entry = this.remoteAvatars.get(p.uid);
        if (!entry) {
          // New remote player joined
          const { group, leftLeg, rightLeg, leftArm, rightArm, nameSprite } = this.createAvatarMesh(
            p.displayName,
            p.avatarColor,
            p.avatarType,
            false
          );

          group.position.set(p.position[0], p.position[1], p.position[2]);
          group.rotation.y = p.rotation;
          this.group.add(group);

          entry = {
            data: p,
            group,
            nameSprite,
            leftLeg,
            rightLeg,
            leftArm,
            rightArm,
            targetPosition: new THREE.Vector3(...p.position),
            targetRotation: p.rotation,
            walkTime: 0,
          };
          this.remoteAvatars.set(p.uid, entry);
        } else {
          // Update target coordinates and appearance
          entry.targetPosition.set(p.position[0], p.position[1], p.position[2]);
          entry.targetRotation = p.rotation;
          entry.data = p;
        }
      }

      // Remove players who left or timed out
      for (const [uid, entry] of this.remoteAvatars) {
        if (!activeUids.has(uid)) {
          this.group.remove(entry.group);
          this.remoteAvatars.delete(uid);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. INPUT CONTROLS & MOVEMENT
  // ---------------------------------------------------------------------------
  private isEnabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.inputMove.forward = 0;
      this.inputMove.strafe = 0;
      this.isLocalMoving = false;
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  private onKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private onKeyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private onBlurHandler: (() => void) | null = null;

  private initKeyboardListeners() {
    if (typeof window === 'undefined') return;

    const keys: Record<string, boolean> = {};

    this.onKeyDownHandler = (e: KeyboardEvent) => {
      if (!this.isEnabled) return;
      // Guard against undefined e.key (e.g. mobile virtual keyboard, IME, or synthetic events)
      if (!e || typeof e.key !== 'string') return;

      // Skip if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      keys[e.key.toLowerCase()] = true;
      this.computeMovement(keys);
    };

    this.onKeyUpHandler = (e: KeyboardEvent) => {
      if (!this.isEnabled) {
        for (const k in keys) keys[k] = false;
        return;
      }
      if (!e || typeof e.key !== 'string') return;
      keys[e.key.toLowerCase()] = false;
      this.computeMovement(keys);
    };

    this.onBlurHandler = () => {
      for (const k in keys) keys[k] = false;
      this.computeMovement(keys);
    };

    window.addEventListener('keydown', this.onKeyDownHandler);
    window.addEventListener('keyup', this.onKeyUpHandler);
    window.addEventListener('blur', this.onBlurHandler);
  }

  private computeMovement(keys: Record<string, boolean>) {
    if (!this.isEnabled) {
      this.inputMove.forward = 0;
      this.inputMove.strafe = 0;
      this.isSprinting = false;
      return;
    }

    let f = 0;
    let s = 0;

    if (keys['w'] || keys['arrowup']) f += 1;
    if (keys['s'] || keys['arrowdown']) f -= 1;
    if (keys['a'] || keys['arrowleft']) s -= 1;
    if (keys['d'] || keys['arrowright']) s += 1;

    this.isSprinting = !!keys['shift'];
    this.inputMove.forward = f;
    this.inputMove.strafe = s;
  }

  public setTouchJoystickInput(forward: number, strafe: number) {
    if (!this.isEnabled) {
      this.inputMove.forward = 0;
      this.inputMove.strafe = 0;
      return;
    }
    this.inputMove.forward = Math.max(-1, Math.min(1, forward));
    this.inputMove.strafe = Math.max(-1, Math.min(1, strafe));
    // Auto-sprint when joystick pushed beyond 85%
    this.isSprinting = Math.hypot(forward, strafe) > 0.85;
  }

  public zoomCamera(deltaY: number) {
    const factor = deltaY > 0 ? 1.12 : 0.89;
    const currentDist = this.cameraOffset.z;
    const nextDist = Math.max(this.minCameraDist, Math.min(this.maxCameraDist, currentDist * factor));
    this.cameraOffset.z = nextDist;
    this.cameraOffset.y = nextDist * 0.58;
  }

  // ---------------------------------------------------------------------------
  // 5. UPDATE LOOP (CALLED IN SCENE ANIMATION LOOP)
  // ---------------------------------------------------------------------------
  public update(delta: number) {
    const dt = Math.min(0.1, Math.max(0.001, delta));

    // 1. Update Local Avatar Movement
    this.updateLocalMovement(dt);

    // 2. Update Remote Avatars Smooth Interpolation
    this.updateRemoteAvatars(dt);

    // 3. Update Third-Person Follow Camera (only when walking/enabled)
    if (this.isEnabled && this.followCamera && this.localAvatarGroup) {
      this.updateCameraFollow(dt);
    }
  }

  public getLocalAvatarGroup(): THREE.Group | null {
    return this.localAvatarGroup;
  }

  private updateLocalMovement(dt: number) {
    if (!this.isEnabled || !this.localAvatarGroup) return;

    const f = this.inputMove.forward;
    const s = this.inputMove.strafe;
    const hasInput = Math.abs(f) > 0.05 || Math.abs(s) > 0.05;

    if (hasInput) {
      // Calculate move direction relative to camera angle or world
      let cameraAngle = 0;
      if (this.camera) {
        const camDir = new THREE.Vector3();
        this.camera.getWorldDirection(camDir);
        camDir.y = 0;
        camDir.normalize();
        cameraAngle = Math.atan2(camDir.x, camDir.z);
      }

      // Forward vector & right vector
      const forwardVec = new THREE.Vector3(Math.sin(cameraAngle), 0, Math.cos(cameraAngle));
      const rightVec = new THREE.Vector3(Math.cos(cameraAngle), 0, -Math.sin(cameraAngle));

      const moveDir = new THREE.Vector3()
        .addScaledVector(forwardVec, f)
        .addScaledVector(rightVec, s)
        .normalize();

      const currentSpeed = this.isSprinting ? 14.0 : 8.0;
      const speed = currentSpeed * dt;
      const nextX = this.localPosition.x + moveDir.x * speed;
      const nextZ = this.localPosition.z + moveDir.z * speed;

      // Authoritative world boundary & solid obstacle collision check
      const isWithinBounds =
        nextX >= MAP_BOUNDS.minX + 2.0 &&
        nextX <= MAP_BOUNDS.maxX - 2.0 &&
        nextZ >= MAP_BOUNDS.minZ + 2.0 &&
        nextZ <= MAP_BOUNDS.maxZ - 2.0;

      if (isWithinBounds) {
        const colDirect = checkObstacleCollision(nextX, nextZ, 0.45);
        if (!colDirect.collided) {
          this.localPosition.x = nextX;
          this.localPosition.z = nextZ;
        } else {
          // Slide along unobstructed X or Z axis if direct diagonal movement is blocked
          const colX = checkObstacleCollision(nextX, this.localPosition.z, 0.45);
          if (!colX.collided) {
            this.localPosition.x = nextX;
          } else {
            const colZ = checkObstacleCollision(this.localPosition.x, nextZ, 0.45);
            if (!colZ.collided) {
              this.localPosition.z = nextZ;
            }
          }
        }
      }

      // Rotate avatar towards movement direction with smooth interpolation
      const targetAngle = Math.atan2(moveDir.x, moveDir.z) + Math.PI;
      const angleDiff = Math.atan2(Math.sin(targetAngle - this.localRotation), Math.cos(targetAngle - this.localRotation));
      this.localRotation += angleDiff * Math.min(1, dt * 14);

      this.localAvatarGroup.position.copy(this.localPosition);
      this.localAvatarGroup.rotation.y = this.localRotation;

      this.isLocalMoving = true;
      this.localWalkTime += dt * (this.isSprinting ? 16 : 10);
    } else {
      this.isLocalMoving = false;
      this.localWalkTime = 0;
    }

    // Animate articulated humanoid limbs with sprint lean and breathing
    if (this.localLeftLeg && this.localRightLeg && this.localLeftArm && this.localRightArm) {
      const torso = this.localAvatarGroup.getObjectByName('AvatarTorso');

      if (this.isLocalMoving) {
        const legAmplitude = this.isSprinting ? 0.72 : 0.52;
        const armAmplitude = this.isSprinting ? 0.78 : 0.58;
        const legSwing = Math.sin(this.localWalkTime) * legAmplitude;
        this.localLeftLeg.rotation.x = legSwing;
        this.localRightLeg.rotation.x = -legSwing;
        this.localLeftArm.rotation.x = -legSwing * armAmplitude;
        this.localRightArm.rotation.x = legSwing * armAmplitude;

        // Realistic knee bending when swinging leg backward
        const leftKneeBend = Math.max(0, -legSwing) * (this.isSprinting ? 0.85 : 0.65);
        const rightKneeBend = Math.max(0, legSwing) * (this.isSprinting ? 0.85 : 0.65);
        this.localLeftLeg.getObjectByName('LeftCalf')?.rotation.set(leftKneeBend, 0, 0);
        this.localRightLeg.getObjectByName('RightCalf')?.rotation.set(rightKneeBend, 0, 0);

        if (torso) {
          torso.rotation.x = this.isSprinting ? 0.14 : 0.04;
          torso.position.y = 0;
        }
      } else {
        // Natural idle breathing & resting stance
        const idleSway = Math.sin(Date.now() * 0.0025) * 0.035;
        this.localLeftLeg.rotation.x *= 0.82;
        this.localRightLeg.rotation.x *= 0.82;
        this.localLeftArm.rotation.x = idleSway;
        this.localRightArm.rotation.x = -idleSway;
        this.localLeftLeg.getObjectByName('LeftCalf')?.rotation.set(0, 0, 0);
        this.localRightLeg.getObjectByName('RightCalf')?.rotation.set(0, 0, 0);

        if (torso) {
          torso.rotation.x *= 0.82;
          torso.position.y = Math.sin(Date.now() * 0.003) * 0.015; // Natural breathing rise & fall
        }
      }
    }

    // Push throttled position update to multiplayer backend
    multiplayerService.queuePositionUpdate(
      [this.localPosition.x, this.localPosition.y, this.localPosition.z],
      this.localRotation,
      this.isLocalMoving
    );
  }

  private updateRemoteAvatars(dt: number) {
    const lerpFactor = Math.min(1, dt * 10);

    for (const entry of this.remoteAvatars.values()) {
      // Exponential position smoothing
      const dist = entry.group.position.distanceTo(entry.targetPosition);
      if (dist > 15) {
        // Teleport if too far
        entry.group.position.copy(entry.targetPosition);
      } else {
        entry.group.position.lerp(entry.targetPosition, lerpFactor);
      }

      // Rotation smoothing
      const angleDiff = Math.atan2(
        Math.sin(entry.targetRotation - entry.group.rotation.y),
        Math.cos(entry.targetRotation - entry.group.rotation.y)
      );
      entry.group.rotation.y += angleDiff * lerpFactor;

      // Limb walk animation with articulated knee flexion
      const isActuallyMoving = dist > 0.05 || entry.data.isMoving;
      if (isActuallyMoving) {
        entry.walkTime += dt * 10;
        const legSwing = Math.sin(entry.walkTime) * 0.55;
        entry.leftLeg.rotation.x = legSwing;
        entry.rightLeg.rotation.x = -legSwing;
        entry.leftArm.rotation.x = -legSwing * 0.65;
        entry.rightArm.rotation.x = legSwing * 0.65;

        const leftKneeBend = Math.max(0, -legSwing) * 0.65;
        const rightKneeBend = Math.max(0, legSwing) * 0.65;
        entry.leftLeg.getObjectByName('LeftCalf')?.rotation.set(leftKneeBend, 0, 0);
        entry.rightLeg.getObjectByName('RightCalf')?.rotation.set(rightKneeBend, 0, 0);
      } else {
        entry.leftLeg.rotation.x *= 0.85;
        entry.rightLeg.rotation.x *= 0.85;
        entry.leftArm.rotation.x *= 0.85;
        entry.rightArm.rotation.x *= 0.85;
        entry.leftLeg.getObjectByName('LeftCalf')?.rotation.set(0, 0, 0);
        entry.rightLeg.getObjectByName('RightCalf')?.rotation.set(0, 0, 0);
      }
    }
  }

  private updateCameraFollow(dt: number) {
    if (!this.localAvatarGroup) return;

    // Follow camera offset behind avatar orientation
    const angle = this.localRotation;
    const targetCamX = this.localPosition.x + Math.sin(angle) * this.cameraOffset.z;
    const targetCamY = this.localPosition.y + this.cameraOffset.y;
    const targetCamZ = this.localPosition.z + Math.cos(angle) * this.cameraOffset.z;

    const smoothFactor = Math.min(1, dt * 5.0);
    this.camera.position.x += (targetCamX - this.camera.position.x) * smoothFactor;
    this.camera.position.y += (targetCamY - this.camera.position.y) * smoothFactor;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * smoothFactor;

    this.cameraLookTarget.set(this.localPosition.x, this.localPosition.y + 1.4, this.localPosition.z);
    this.camera.lookAt(this.cameraLookTarget);
  }

  public snapCameraToLocalAvatar() {
    if (!this.localAvatarGroup) return;
    const angle = this.localRotation;
    this.camera.position.set(
      this.localPosition.x + Math.sin(angle) * this.cameraOffset.z,
      this.localPosition.y + this.cameraOffset.y,
      this.localPosition.z + Math.cos(angle) * this.cameraOffset.z
    );
    this.cameraLookTarget.set(this.localPosition.x, this.localPosition.y + 1.4, this.localPosition.z);
    this.camera.lookAt(this.cameraLookTarget);
  }

  // ---------------------------------------------------------------------------
  // 6. CAMERA FOLLOW TOGGLE & RAYCASTING
  // ---------------------------------------------------------------------------
  public setFollowCamera(enabled: boolean) {
    this.followCamera = enabled;
    if (enabled && this.localAvatarGroup) {
      this.snapCameraToLocalAvatar();
    }
  }

  public isFollowCameraEnabled(): boolean {
    return this.followCamera;
  }

  public raycastAvatar(raycaster: THREE.Raycaster): PlayerData | null {
    const intersects = raycaster.intersectObjects(this.group.children, true);
    for (const hit of intersects) {
      if (hit.object.userData?.isAvatar && !hit.object.userData.isLocal) {
        for (const entry of this.remoteAvatars.values()) {
          if (entry.group.children.includes(hit.object) || entry.group === hit.object.parent) {
            return entry.data;
          }
        }
      }
    }
    return null;
  }

  public getLocalPosition(): [number, number, number] {
    return [this.localPosition.x, this.localPosition.y, this.localPosition.z];
  }

  public setLocalPosition(x: number, y: number, z: number, rotationY?: number) {
    this.localPosition.set(x, y, z);
    if (typeof rotationY === 'number') {
      this.localRotation = rotationY;
    }
    if (this.localAvatarGroup) {
      this.localAvatarGroup.position.copy(this.localPosition);
      if (typeof rotationY === 'number') {
        this.localAvatarGroup.rotation.y = rotationY;
      }
    }
    multiplayerService.queuePositionUpdate(
      [this.localPosition.x, this.localPosition.y, this.localPosition.z],
      this.localRotation,
      false
    );
    if (this.followCamera && this.localAvatarGroup) {
      this.snapCameraToLocalAvatar();
    }
  }

  public getLocalAvatarPosition(): { x: number; y: number; z: number; rotation: number } | null {
    if (!this.localAvatarGroup) return null;
    return {
      x: this.localPosition.x,
      y: this.localPosition.y,
      z: this.localPosition.z,
      rotation: this.localRotation,
    };
  }

  public dispose() {
    if (this.onKeyDownHandler) {
      window.removeEventListener('keydown', this.onKeyDownHandler);
      this.onKeyDownHandler = null;
    }
    if (this.onKeyUpHandler) {
      window.removeEventListener('keyup', this.onKeyUpHandler);
      this.onKeyUpHandler = null;
    }
    if (this.onBlurHandler) {
      window.removeEventListener('blur', this.onBlurHandler);
      this.onBlurHandler = null;
    }
    if (this.remotePlayersUnsub) {
      this.remotePlayersUnsub();
      this.remotePlayersUnsub = null;
    }
    this.removeLocalAvatar();
    for (const entry of this.remoteAvatars.values()) {
      this.group.remove(entry.group);
    }
    this.remoteAvatars.clear();
    this.scene.remove(this.group);
  }
}
