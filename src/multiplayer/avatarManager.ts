import * as THREE from 'three';
import { MaterialLibrary } from '../world/materials';
import { PlayerData, AvatarColor, AvatarType, AVATAR_COLORS } from './types';
import { multiplayerService, DEFAULT_SPAWN_POSITION } from './multiplayerService';

interface RemoteAvatarEntry {
  data: PlayerData;
  group: THREE.Group;
  nameSprite: THREE.Sprite;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
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
  private localLeftLeg: THREE.Mesh | null = null;
  private localRightLeg: THREE.Mesh | null = null;
  private localLeftArm: THREE.Mesh | null = null;
  private localRightArm: THREE.Mesh | null = null;
  private localNameSprite: THREE.Sprite | null = null;
  private localPosition: THREE.Vector3 = new THREE.Vector3(...DEFAULT_SPAWN_POSITION);
  private localRotation: number = 0;
  private localWalkTime: number = 0;
  private isLocalMoving: boolean = false;

  // Third-person camera tracking
  private followCamera: boolean = true;
  private cameraOffset: THREE.Vector3 = new THREE.Vector3(0, 5.5, 9.5);
  private cameraLookTarget: THREE.Vector3 = new THREE.Vector3();

  // Remote avatars map: uid -> RemoteAvatarEntry
  private remoteAvatars: Map<string, RemoteAvatarEntry> = new Map();

  // Movement input state (Keyboard + Mobile Joystick)
  private inputMove: { forward: number; strafe: number } = { forward: 0, strafe: 0 };
  private moveSpeed: number = 9.0; // units per second

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
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
    nameSprite: THREE.Sprite;
  } {
    const root = new THREE.Group();

    // Material colors
    const colorHex = AVATAR_COLORS.find((c) => c.id === color)?.hex || '#06b6d4';
    const jacketMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colorHex),
      roughness: 0.45,
      metalness: style === 'cyber' ? 0.35 : 0.05,
    });
    const skinMat = new THREE.MeshStandardMaterial({
      color: 0xffdfc4,
      roughness: 0.7,
    });
    const pantsMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.6,
    });
    const shoesMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.8,
    });

    // 1. Torso
    const torsoGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
    const torso = new THREE.Mesh(torsoGeo, jacketMat);
    torso.position.y = 1.35;
    torso.castShadow = true;
    torso.receiveShadow = true;
    root.add(torso);

    // 2. Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.52, 0.5);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 2.05;
    head.castShadow = true;
    root.add(head);

    // 3. Hair / Hat / Visor based on AvatarType
    if (style === 'builder') {
      // Safety yellow helmet
      const helmetGeo = new THREE.BoxGeometry(0.56, 0.22, 0.56);
      const helmetMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.3 });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.y = 2.34;
      root.add(helmet);
    } else if (style === 'cyber') {
      // Glowing neon visor
      const visorGeo = new THREE.BoxGeometry(0.48, 0.12, 0.16);
      const visorMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 2.06, -0.22);
      root.add(visor);
    } else if (style === 'explorer') {
      // Adventure safari hat & backpack
      const hatBrim = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.05, 16), new THREE.MeshStandardMaterial({ color: 0x78716c }));
      hatBrim.position.y = 2.32;
      root.add(hatBrim);

      const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.25), new THREE.MeshStandardMaterial({ color: 0x44403c }));
      backpack.position.set(0, 1.4, 0.32);
      root.add(backpack);
    } else {
      // Modern casual haircut
      const hairGeo = new THREE.BoxGeometry(0.54, 0.18, 0.54);
      const hairMat = new THREE.MeshStandardMaterial({ color: 0x332211, roughness: 0.8 });
      const hair = new THREE.Mesh(hairGeo, hairMat);
      hair.position.y = 2.32;
      root.add(hair);
    }

    // 4. Arms (Pivoting at shoulders)
    const armGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    armGeo.translate(0, -0.35, 0); // pivot at shoulder

    const leftArm = new THREE.Mesh(armGeo, jacketMat);
    leftArm.position.set(-0.48, 1.7, 0);
    leftArm.castShadow = true;
    root.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, jacketMat);
    rightArm.position.set(0.48, 1.7, 0);
    rightArm.castShadow = true;
    root.add(rightArm);

    // 5. Legs (Pivoting at hips)
    const legGeo = new THREE.BoxGeometry(0.24, 0.85, 0.26);
    legGeo.translate(0, -0.4, 0); // pivot at hip

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.2, 0.85, 0);
    leftLeg.castShadow = true;
    root.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.2, 0.85, 0);
    rightLeg.castShadow = true;
    root.add(rightLeg);

    // 6. Shoes
    const shoeGeo = new THREE.BoxGeometry(0.25, 0.14, 0.34);
    const leftShoe = new THREE.Mesh(shoeGeo, shoesMat);
    leftShoe.position.set(-0.2, 0.08, -0.04);
    root.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeo, shoesMat);
    rightShoe.position.set(0.2, 0.08, -0.04);
    root.add(rightShoe);

    // 7. Ground shadow decal / ring
    const shadowGeo = new THREE.RingGeometry(0.2, 0.55, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const shadowRing = new THREE.Mesh(shadowGeo, shadowMat);
    shadowRing.position.y = 0.03;
    root.add(shadowRing);

    // 8. 3D Floating Name Tag Billboard
    const nameSprite = this.createNameBillboard(name, colorHex, isLocal);
    nameSprite.position.set(0, 2.75, 0);
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
      ctx.textBaseline = 'middle';
      const truncated = name.length > 15 ? name.slice(0, 14) + '…' : name;
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
  private initKeyboardListeners() {
    if (typeof window === 'undefined') return;

    const keys: Record<string, boolean> = {};

    window.addEventListener('keydown', (e) => {
      // Skip if typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      keys[e.key.toLowerCase()] = true;
      this.computeMovement(keys);
    });

    window.addEventListener('keyup', (e) => {
      keys[e.key.toLowerCase()] = false;
      this.computeMovement(keys);
    });
  }

  private computeMovement(keys: Record<string, boolean>) {
    let f = 0;
    let s = 0;

    if (keys['w'] || keys['arrowup']) f += 1;
    if (keys['s'] || keys['arrowdown']) f -= 1;
    if (keys['a'] || keys['arrowleft']) s -= 1;
    if (keys['d'] || keys['arrowright']) s += 1;

    this.inputMove.forward = f;
    this.inputMove.strafe = s;
  }

  public setTouchJoystickInput(forward: number, strafe: number) {
    this.inputMove.forward = Math.max(-1, Math.min(1, forward));
    this.inputMove.strafe = Math.max(-1, Math.min(1, strafe));
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

    // 3. Update Third-Person Follow Camera
    if (this.followCamera && this.localAvatarGroup) {
      this.updateCameraFollow(dt);
    }
  }

  private updateLocalMovement(dt: number) {
    if (!this.localAvatarGroup) return;

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

      const speed = this.moveSpeed * dt;
      const nextX = this.localPosition.x + moveDir.x * speed;
      const nextZ = this.localPosition.z + moveDir.z * speed;

      // Real world-space collision boundaries:
      // 1. World map boundaries: [-100, 100]
      // 2. Lake District basin exclusion: x: [-23, 35], z: [-51, -21]
      const isInLake = nextX >= -23 && nextX <= 35 && nextZ >= -51 && nextZ <= -21;
      const isWithinMap = Math.abs(nextX) <= 100 && Math.abs(nextZ) <= 100;

      if (isWithinMap && !isInLake) {
        this.localPosition.x = nextX;
        this.localPosition.z = nextZ;
      }

      // Rotate avatar towards movement direction
      const targetAngle = Math.atan2(moveDir.x, moveDir.z) + Math.PI;
      // Smooth angle turn
      const angleDiff = Math.atan2(Math.sin(targetAngle - this.localRotation), Math.cos(targetAngle - this.localRotation));
      this.localRotation += angleDiff * Math.min(1, dt * 14);

      this.localAvatarGroup.position.copy(this.localPosition);
      this.localAvatarGroup.rotation.y = this.localRotation;

      this.isLocalMoving = true;
      this.localWalkTime += dt * 10;
    } else {
      this.isLocalMoving = false;
      this.localWalkTime = 0;
    }

    // Animate walking limbs
    if (this.localLeftLeg && this.localRightLeg && this.localLeftArm && this.localRightArm) {
      if (this.isLocalMoving) {
        const legSwing = Math.sin(this.localWalkTime) * 0.55;
        this.localLeftLeg.rotation.x = legSwing;
        this.localRightLeg.rotation.x = -legSwing;
        this.localLeftArm.rotation.x = -legSwing * 0.65;
        this.localRightArm.rotation.x = legSwing * 0.65;
      } else {
        // Return to rest
        this.localLeftLeg.rotation.x *= 0.8;
        this.localRightLeg.rotation.x *= 0.8;
        this.localLeftArm.rotation.x *= 0.8;
        this.localRightArm.rotation.x *= 0.8;
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

      // Limb walk animation
      const isActuallyMoving = dist > 0.05 || entry.data.isMoving;
      if (isActuallyMoving) {
        entry.walkTime += dt * 10;
        const legSwing = Math.sin(entry.walkTime) * 0.55;
        entry.leftLeg.rotation.x = legSwing;
        entry.rightLeg.rotation.x = -legSwing;
        entry.leftArm.rotation.x = -legSwing * 0.65;
        entry.rightArm.rotation.x = legSwing * 0.65;
      } else {
        entry.leftLeg.rotation.x *= 0.85;
        entry.rightLeg.rotation.x *= 0.85;
        entry.leftArm.rotation.x *= 0.85;
        entry.rightArm.rotation.x *= 0.85;
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

  public dispose() {
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
