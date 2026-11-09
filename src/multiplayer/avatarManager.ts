import * as THREE from 'three';
import { MaterialLibrary } from '../world/materials';
import { PlayerData, AvatarColor, AvatarType, AVATAR_COLORS } from './types';
import { multiplayerService, DEFAULT_SPAWN_POSITION } from './multiplayerService';
import { checkObstacleCollision, MAP_BOUNDS } from '../world/collisionSystem';
import {
  createHumanoidCharacter,
  HumanoidRig,
  HumanHairStyle,
  HumanOutfitType,
  HumanGender,
  SKIN_TONES,
  HAIR_COLORS,
  HumanoidGesture,
} from '../world/humanoidCharacterSystem';

interface RemoteAvatarEntry {
  data: PlayerData;
  group: THREE.Group;
  rig: HumanoidRig;
  nameSprite: THREE.Sprite;
  targetPosition: THREE.Vector3;
  targetRotation: number;
  walkTime: number;
  isMoving: boolean;
  actualSpeed: number;
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
  private localRig: HumanoidRig | null = null;
  private localNameSprite: THREE.Sprite | null = null;
  private localPosition: THREE.Vector3 = new THREE.Vector3(...DEFAULT_SPAWN_POSITION);
  private localRotation: number = 0;
  private localWalkTime: number = 0;
  private isLocalMoving: boolean = false;

  // Realistic Movement Physics State
  // Default values based on human locomotion specifications:
  // Walking: 2.0 m/s | Running: 4.0 m/s | Sprinting: 5.5 m/s
  public static readonly WALK_SPEED = 2.0;
  public static readonly RUN_SPEED = 4.0;
  public static readonly SPRINT_SPEED = 5.5;

  private currentVelocity: THREE.Vector3 = new THREE.Vector3();
  private isRunning: boolean = false;
  private isSprinting: boolean = false;
  private moveSpeedMultiplier: number = 1.0;
  private lookSensitivityMultiplier: number = 1.0;

  // Acceleration & Deceleration Physics
  private readonly accelRate: number = 8.5; // m/s² gradual ramp-up
  private readonly frictionRate: number = 12.0; // m/s² smooth deceleration
  private readonly turnRate: number = 9.0; // rad/s natural turning speed

  // Jump physics
  private isJumping: boolean = false;
  private velocityY: number = 0;
  private readonly gravity: number = -22.0;
  private readonly jumpForce: number = 6.8;
  private readonly groundY: number = 0.08;

  // Decoupled Third-Person Orbit Follow Camera
  private followCamera: boolean = true;
  private cameraYaw: number = 0; // horizontal orbit angle around player
  private cameraPitch: number = 0.32; // vertical elevation angle (radians)
  private cameraDistance: number = 5.0; // distance from player
  private readonly minPitch: number = -0.15;
  private readonly maxPitch: number = 1.25;
  private readonly minDistance: number = 2.2;
  private readonly maxDistance: number = 13.0;
  private dampedCamPos: THREE.Vector3 = new THREE.Vector3();
  private dampedLookTarget: THREE.Vector3 = new THREE.Vector3();

  // Mouse drag orbit controls on canvas
  private isPointerDown: boolean = false;
  private lastPointerX: number = 0;
  private lastPointerY: number = 0;

  // Remote avatars map: uid -> RemoteAvatarEntry
  private remoteAvatars: Map<string, RemoteAvatarEntry> = new Map();

  // Movement input state (Keyboard + Mobile Joystick)
  private inputMove: { forward: number; strafe: number } = { forward: 0, strafe: 0 };

  // Unsubscribe listener
  private remotePlayersUnsub: (() => void) | null = null;

  // Callback on player click/tap
  public onSelectPlayer?: (player: PlayerData) => void;

  // Active state flag
  private isEnabled: boolean = true;

  // Current customization options
  private currentGender: HumanGender = 'male';
  private currentHairStyle: HumanHairStyle = 'short_crop';
  private currentSkinTone: string = 'warmBeige';
  private currentGesture: HumanoidGesture = 'none';

  // Event handlers for clean disposal
  private onKeyDownHandler: ((e: KeyboardEvent) => void) | null = null;
  private onKeyUpHandler: ((e: KeyboardEvent) => void) | null = null;
  private onBlurHandler: (() => void) | null = null;
  private onCanvasPointerDown: ((e: PointerEvent) => void) | null = null;
  private onCanvasPointerMove: ((e: PointerEvent) => void) | null = null;
  private onCanvasPointerUp: ((e: PointerEvent) => void) | null = null;
  private onCanvasWheel: ((e: WheelEvent) => void) | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, materials: MaterialLibrary, isSoftwareGl: boolean) {
    this.scene = scene;
    this.camera = camera;
    this.materials = materials;
    this.isSoftwareGl = isSoftwareGl;

    this.group = new THREE.Group();
    this.group.name = 'MultiplayerAvatars';
    this.scene.add(this.group);

    // Initial camera position & look target damping values
    this.dampedCamPos.copy(this.camera.position);
    this.dampedLookTarget.set(this.localPosition.x, this.localPosition.y + 1.35, this.localPosition.z);

    this.initKeyboardListeners();
    this.initPointerOrbitControls();
    this.initRemoteSubscription();
  }

  // ---------------------------------------------------------------------------
  // 1. LOCAL AVATAR CREATION & SPAWN
  // ---------------------------------------------------------------------------
  public spawnLocalAvatar(
    displayName: string,
    color: AvatarColor,
    style: AvatarType,
    spawnPos: [number, number, number] = DEFAULT_SPAWN_POSITION,
    customOptions?: { gender?: HumanGender; hairStyle?: HumanHairStyle; skinTone?: string }
  ) {
    this.removeLocalAvatar();

    this.localPosition.set(spawnPos[0], spawnPos[1], spawnPos[2]);
    this.localRotation = 0;
    this.currentVelocity.set(0, 0, 0);
    this.velocityY = 0;
    this.isJumping = false;

    if (customOptions?.gender) this.currentGender = customOptions.gender;
    if (customOptions?.hairStyle) this.currentHairStyle = customOptions.hairStyle;
    if (customOptions?.skinTone) this.currentSkinTone = customOptions.skinTone;

    const { group, rig, nameSprite } = this.createHumanoidAvatarMesh(
      displayName,
      color,
      style,
      true,
      this.currentGender,
      this.currentHairStyle,
      this.currentSkinTone
    );

    this.localAvatarGroup = group;
    this.localRig = rig;
    this.localNameSprite = nameSprite;

    this.localAvatarGroup.position.copy(this.localPosition);
    this.group.add(this.localAvatarGroup);

    // Initialize orbit camera behind local player
    this.cameraYaw = this.localRotation;
    this.cameraPitch = 0.32;
    this.snapCameraToLocalAvatar();
  }

  public removeLocalAvatar() {
    if (this.localAvatarGroup) {
      this.group.remove(this.localAvatarGroup);
      this.localRig?.dispose();
      this.localAvatarGroup = null;
      this.localRig = null;
      this.localNameSprite = null;
    }
  }

  public updateLocalAvatarAppearance(
    displayName: string,
    color: AvatarColor,
    style: AvatarType,
    customOptions?: { gender?: HumanGender; hairStyle?: HumanHairStyle; skinTone?: string }
  ) {
    if (!this.localAvatarGroup) return;
    const currentPos: [number, number, number] = [this.localPosition.x, this.localPosition.y, this.localPosition.z];
    const currentRot = this.localRotation;
    this.spawnLocalAvatar(displayName, color, style, currentPos, customOptions);
    this.localRotation = currentRot;
    if (this.localAvatarGroup) {
      this.localAvatarGroup.rotation.y = currentRot;
    }
  }

  public setLocalPosition(x: number, y: number, z: number, rotation: number = 0) {
    this.localPosition.set(x, y, z);
    this.localRotation = rotation;
    this.currentVelocity.set(0, 0, 0);
    if (this.localAvatarGroup) {
      this.localAvatarGroup.position.copy(this.localPosition);
      this.localAvatarGroup.rotation.y = this.localRotation;
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

  // ---------------------------------------------------------------------------
  // 2. PROCEDURAL HUMANOID MESH GENERATOR
  // ---------------------------------------------------------------------------
  private createHumanoidAvatarMesh(
    name: string,
    color: AvatarColor,
    style: AvatarType,
    isLocal: boolean,
    gender: HumanGender = 'male',
    hairStyleParam?: HumanHairStyle,
    skinToneKey?: string
  ): {
    group: THREE.Group;
    rig: HumanoidRig;
    nameSprite: THREE.Sprite;
  } {
    const root = new THREE.Group();

    // Map avatar style to outfit type
    let outfitType: HumanOutfitType = 'casual';
    let hairStyle: HumanHairStyle = hairStyleParam || 'short_crop';

    if (style === 'formal') {
      outfitType = 'formal_blazer';
      hairStyle = hairStyleParam || (gender === 'female' ? 'bun' : 'short_crop');
    } else if (style === 'traditional') {
      outfitType = 'traditional';
      hairStyle = hairStyleParam || (gender === 'female' ? 'long_flowing' : 'short_crop');
    } else if (style === 'builder') {
      outfitType = 'builder';
      hairStyle = 'builder_helmet';
    } else if (style === 'cyber') {
      outfitType = 'cyber';
      hairStyle = 'cyber_visor';
    } else if (style === 'explorer') {
      outfitType = 'explorer';
      hairStyle = 'explorer_hat';
    } else {
      outfitType = 'casual';
      hairStyle = hairStyleParam || (gender === 'female' ? 'long_flowing' : 'pompadour');
    }

    const colorHex = AVATAR_COLORS.find((c) => c.id === color)?.hex || '#06b6d4';
    const skinToneVal =
      skinToneKey && (SKIN_TONES as Record<string, number>)[skinToneKey]
        ? (SKIN_TONES as Record<string, number>)[skinToneKey]
        : SKIN_TONES.warmBeige;

    // Build procedural articulated humanoid rig
    const rig = createHumanoidCharacter({
      gender,
      hairStyle,
      outfitType,
      primaryColor: colorHex,
      secondaryColor: 0xffffff,
      skinTone: skinToneVal,
      hairColor: HAIR_COLORS.darkBrown,
      pantsColor: 0x1e293b,
      shoesColor: 0x0f172a,
      castShadow: !this.isSoftwareGl,
    });

    root.add(rig.root);

    // Subtle contact ground shadow
    const shadowGeo = new THREE.RingGeometry(0.16, 0.44, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.30,
      depthWrite: false,
    });
    const shadowRing = new THREE.Mesh(shadowGeo, shadowMat);
    shadowRing.position.y = 0.015;
    root.add(shadowRing);

    // 3. Compact Clean Floating Name Tag Billboard (Fixed Size: ~120-140px on screen, NOT giant 2.4m)
    const nameSprite = this.createCompactNameBillboard(name, colorHex, isLocal);
    // Positioned neatly at y = 1.95m (~20cm above the head, never covering the face or screen)
    nameSprite.position.set(0, 1.95, 0);
    root.add(nameSprite);

    // User data for raycasting
    root.traverse((child) => {
      child.userData = {
        isAvatar: true,
        isLocal,
        playerName: name,
        colorHex,
      };
    });

    return { group: root, rig, nameSprite };
  }

  /**
   * Compact, clean floating name tag.
   * Rendered at 0.72m x 0.18m in 3D world space (approx 125-140 CSS pixels on desktop).
   * Features clean sans-serif typography, subtle dark translucent pill background, and miniature [YOU] badge.
   */
  private createCompactNameBillboard(name: string, colorHex: string, isLocal: boolean): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Compact rounded pill container
      const w = 240;
      const h = 48;
      const x = 8;
      const y = 8;
      const r = 24;

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

      // Subtle dark translucent background (never opaque solid block)
      ctx.fillStyle = 'rgba(10, 16, 28, 0.78)';
      ctx.fill();

      // Hairline 1.5px subtle border
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = colorHex;
      ctx.stroke();

      // Player status color dot
      ctx.beginPath();
      ctx.arc(x + 22, y + h / 2, 6, 0, Math.PI * 2);
      ctx.fillStyle = colorHex;
      ctx.fill();

      // Clean, readable player name
      ctx.font = '600 17px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      const safeName = typeof name === 'string' && name.trim() ? name.trim() : 'Resident';
      const truncated = safeName.length > 13 ? safeName.slice(0, 12) + '…' : safeName;
      ctx.fillText(truncated, x + 36, y + h / 2);

      // Small subtle [YOU] badge for local player (not oversized loud text)
      if (isLocal) {
        const textWidth = ctx.measureText(truncated).width;
        const badgeX = x + 42 + textWidth;
        const badgeY = y + h / 2 - 8;
        const badgeW = 34;
        const badgeH = 16;
        const badgeR = 8;

        ctx.beginPath();
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, badgeR);
        ctx.fillStyle = colorHex;
        ctx.fill();

        ctx.font = 'bold 10px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#060913';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', badgeX + badgeW / 2, y + h / 2);
      }
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: false,
    });
    const sprite = new THREE.Sprite(spriteMat);
    // Scaled to 0.72m x 0.18m (fits neatly in screen without obscuring scene)
    sprite.scale.set(0.72, 0.18, 1);
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
          const { group, rig, nameSprite } = this.createHumanoidAvatarMesh(
            p.displayName,
            p.avatarColor,
            p.avatarType,
            false,
            p.gender || 'male',
            p.hairStyle as HumanHairStyle,
            p.skinTone
          );

          group.position.set(p.position[0], p.position[1], p.position[2]);
          group.rotation.y = p.rotation;
          this.group.add(group);

          entry = {
            data: p,
            group,
            rig,
            nameSprite,
            targetPosition: new THREE.Vector3(...p.position),
            targetRotation: p.rotation,
            walkTime: 0,
            isMoving: false,
            actualSpeed: 0,
          };
          this.remoteAvatars.set(p.uid, entry);
        } else {
          entry.targetPosition.set(p.position[0], p.position[1], p.position[2]);
          entry.targetRotation = p.rotation;
          entry.data = p;
        }
      }

      for (const [uid, entry] of this.remoteAvatars) {
        if (!activeUids.has(uid)) {
          this.group.remove(entry.group);
          entry.rig.dispose();
          this.remoteAvatars.delete(uid);
        }
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 4. MOUSE & POINTER ORBIT CAMERA CONTROLS
  // ---------------------------------------------------------------------------
  private initPointerOrbitControls() {
    if (typeof window === 'undefined') return;

    this.onCanvasPointerDown = (e: PointerEvent) => {
      if (!this.isEnabled || !this.followCamera || !this.localAvatarGroup) return;

      const target = e.target as HTMLElement;
      if (target && target.tagName === 'CANVAS') {
        this.isPointerDown = true;
        this.lastPointerX = e.clientX;
        this.lastPointerY = e.clientY;
      }
    };

    this.onCanvasPointerMove = (e: PointerEvent) => {
      if (!this.isPointerDown || !this.isEnabled || !this.followCamera) return;

      const deltaX = e.clientX - this.lastPointerX;
      const deltaY = e.clientY - this.lastPointerY;

      this.lastPointerX = e.clientX;
      this.lastPointerY = e.clientY;

      const sensitivity = 0.0032 * this.lookSensitivityMultiplier;
      this.cameraYaw -= deltaX * sensitivity;
      this.cameraPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.cameraPitch + deltaY * sensitivity));
    };

    this.onCanvasPointerUp = () => {
      this.isPointerDown = false;
    };

    this.onCanvasWheel = (e: WheelEvent) => {
      if (!this.isEnabled || !this.followCamera || !this.localAvatarGroup) return;
      const target = e.target as HTMLElement;
      if (target && target.tagName === 'CANVAS') {
        const zoomDelta = e.deltaY * 0.0035;
        this.cameraDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.cameraDistance + zoomDelta));
      }
    };

    window.addEventListener('pointerdown', this.onCanvasPointerDown);
    window.addEventListener('pointermove', this.onCanvasPointerMove);
    window.addEventListener('pointerup', this.onCanvasPointerUp);
    window.addEventListener('wheel', this.onCanvasWheel, { passive: true });
  }

  // Mobile Touch Look Swipe Delta
  public setTouchLookDelta(dx: number, dy: number) {
    if (!this.isEnabled || !this.followCamera) return;
    const sensitivity = 0.0055 * this.lookSensitivityMultiplier;
    this.cameraYaw -= dx * sensitivity;
    this.cameraPitch = Math.max(this.minPitch, Math.min(this.maxPitch, this.cameraPitch + dy * sensitivity));
  }

  // Smoothly center the camera behind the player's back
  public centerCamera() {
    this.cameraYaw = this.localRotation;
    this.cameraPitch = 0.32;
  }

  // Mobile Jump Trigger
  public triggerJump() {
    if (!this.isEnabled || !this.localAvatarGroup) return;
    if (!this.isJumping) {
      this.isJumping = true;
      this.velocityY = this.jumpForce;
    }
  }

  // Toggle Running / Sprinting modes
  public toggleRun() {
    this.isRunning = !this.isRunning;
  }

  public toggleSprint() {
    this.isSprinting = !this.isSprinting;
  }

  public setMovementSettings(speedMult: number, sensitivityMult: number) {
    this.moveSpeedMultiplier = Math.max(0.6, Math.min(1.5, speedMult));
    this.lookSensitivityMultiplier = Math.max(0.5, Math.min(2.0, sensitivityMult));
  }

  public setGesture(gesture: HumanoidGesture) {
    this.currentGesture = gesture;
  }

  public getGesture(): HumanoidGesture {
    return this.currentGesture;
  }

  // ---------------------------------------------------------------------------
  // 5. KEYBOARD INPUT LISTENERS
  // ---------------------------------------------------------------------------
  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (!enabled) {
      this.inputMove.forward = 0;
      this.inputMove.strafe = 0;
      this.isLocalMoving = false;
      this.isPointerDown = false;
      this.currentVelocity.set(0, 0, 0);
    }
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public isFollowCameraActive(): boolean {
    return this.isEnabled && this.followCamera && this.localAvatarGroup !== null;
  }

  private initKeyboardListeners() {
    if (typeof window === 'undefined') return;

    const keys: Record<string, boolean> = {};

    this.onKeyDownHandler = (e: KeyboardEvent) => {
      if (!this.isEnabled) return;
      if (!e || typeof e.key !== 'string') return;

      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
        return;
      }

      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        this.triggerJump();
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
      this.isPointerDown = false;
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
      this.isRunning = false;
      this.isSprinting = false;
      return;
    }

    let f = 0;
    let s = 0;

    if (keys['w'] || keys['arrowup']) f += 1;
    if (keys['s'] || keys['arrowdown']) f -= 1;
    if (keys['a'] || keys['arrowleft']) s -= 1;
    if (keys['d'] || keys['arrowright']) s += 1;

    // Normalizing diagonal inputs so diagonal travel is not faster
    const mag = Math.hypot(f, s);
    if (mag > 1) {
      f /= mag;
      s /= mag;
    }

    // Shift: Running (4.0 m/s); Shift + double-input/sprint: Sprint (5.5 m/s)
    this.isRunning = !!keys['shift'];
    this.inputMove.forward = f;
    this.inputMove.strafe = s;
  }

  public setTouchJoystickInput(forward: number, strafe: number) {
    if (!this.isEnabled) {
      this.inputMove.forward = 0;
      this.inputMove.strafe = 0;
      return;
    }

    // Deadzone and clamp
    const mag = Math.hypot(forward, strafe);
    if (mag < 0.10) {
      this.inputMove.forward = 0;
      this.inputMove.strafe = 0;
      this.isRunning = false;
      return;
    }

    // Normalized directional vectors (never faster diagonally)
    const normMag = Math.min(1.0, mag);
    this.inputMove.forward = (forward / mag) * normMag;
    this.inputMove.strafe = (strafe / mag) * normMag;

    // If pushed beyond 65%, transition to running; beyond 90%, sprinting
    this.isRunning = normMag > 0.65;
    this.isSprinting = normMag > 0.92;
  }

  // ---------------------------------------------------------------------------
  // 6. UPDATE LOOP (CALLED IN SCENE ANIMATION LOOP)
  // ---------------------------------------------------------------------------
  public update(delta: number) {
    const dt = Math.min(0.08, Math.max(0.001, delta));

    // 1. Update Local Avatar Movement Physics (2.0 m/s walk, 4.0 m/s run, 5.5 m/s sprint)
    this.updateLocalMovement(dt);

    // 2. Update Remote Avatars Smooth Interpolation & Gait
    this.updateRemoteAvatars(dt);

    // 3. Update Decoupled Third-Person Follow Camera
    if (this.isEnabled && this.followCamera && this.localAvatarGroup) {
      this.updateCameraFollow(dt);
    }

    // 4. Distance Attenuation for Floating Name Tags
    this.updateNameTagVisibility();
  }

  public getLocalAvatarGroup(): THREE.Group | null {
    return this.localAvatarGroup;
  }

  public getCurrentSpeed(): number {
    return this.currentVelocity.length();
  }

  private updateLocalMovement(dt: number) {
    if (!this.isEnabled || !this.localAvatarGroup) return;

    // Handle Vertical Jump & Gravity Physics
    if (this.isJumping) {
      this.velocityY += this.gravity * dt;
      this.localPosition.y += this.velocityY * dt;

      if (this.localPosition.y <= this.groundY) {
        this.localPosition.y = this.groundY;
        this.velocityY = 0;
        this.isJumping = false;
      }
    }

    const f = this.inputMove.forward;
    const s = this.inputMove.strafe;
    const inputMagnitude = Math.hypot(f, s);
    const hasInput = inputMagnitude > 0.05;

    // 1. Resolve Target Velocity (Accurate Human Speeds: Walk 2.0m/s, Run 4.0m/s, Sprint 5.5m/s)
    let targetSpeed = 0;
    if (hasInput) {
      if (this.isSprinting) {
        targetSpeed = AvatarManager.SPRINT_SPEED * this.moveSpeedMultiplier;
      } else if (this.isRunning) {
        targetSpeed = AvatarManager.RUN_SPEED * this.moveSpeedMultiplier;
      } else {
        targetSpeed = AvatarManager.WALK_SPEED * this.moveSpeedMultiplier;
      }
    }

    // Movement vector relative to camera horizontal yaw
    const forwardVec = new THREE.Vector3(-Math.sin(this.cameraYaw), 0, -Math.cos(this.cameraYaw));
    const rightVec = new THREE.Vector3(Math.cos(this.cameraYaw), 0, -Math.sin(this.cameraYaw));

    const moveDir = new THREE.Vector3()
      .addScaledVector(forwardVec, f)
      .addScaledVector(rightVec, s);

    if (moveDir.lengthSq() > 0.0001) {
      moveDir.normalize();
    }

    const targetVelocity = moveDir.clone().multiplyScalar(targetSpeed);

    // 2. Gradual Acceleration & Smooth Friction Deceleration
    if (hasInput) {
      this.currentVelocity.lerp(targetVelocity, Math.min(1.0, dt * this.accelRate));
    } else {
      this.currentVelocity.lerp(new THREE.Vector3(0, 0, 0), Math.min(1.0, dt * this.frictionRate));
    }

    const actualHorizontalSpeed = this.currentVelocity.length();
    this.isLocalMoving = actualHorizontalSpeed > 0.08;

    if (this.isLocalMoving) {
      const stepX = this.currentVelocity.x * dt;
      const stepZ = this.currentVelocity.z * dt;
      const nextX = this.localPosition.x + stepX;
      const nextZ = this.localPosition.z + stepZ;

      // Authoritative boundary & obstacle collision check
      const isWithinBounds =
        nextX >= MAP_BOUNDS.minX + 2.0 &&
        nextX <= MAP_BOUNDS.maxX - 2.0 &&
        nextZ >= MAP_BOUNDS.minZ + 2.0 &&
        nextZ <= MAP_BOUNDS.maxZ - 2.0;

      if (isWithinBounds) {
        const colDirect = checkObstacleCollision(nextX, nextZ, 0.40);
        if (!colDirect.collided) {
          this.localPosition.x = nextX;
          this.localPosition.z = nextZ;
        } else {
          // Slide along unobstructed axis
          const colX = checkObstacleCollision(nextX, this.localPosition.z, 0.40);
          if (!colX.collided) {
            this.localPosition.x = nextX;
          } else {
            const colZ = checkObstacleCollision(this.localPosition.x, nextZ, 0.40);
            if (!colZ.collided) {
              this.localPosition.z = nextZ;
            }
          }
        }
      }

      // Smooth, natural turning towards movement direction (no snapping)
      const targetAngle = Math.atan2(this.currentVelocity.x, this.currentVelocity.z);
      const angleDiff = Math.atan2(
        Math.sin(targetAngle - this.localRotation),
        Math.cos(targetAngle - this.localRotation)
      );
      this.localRotation += angleDiff * Math.min(1.0, dt * this.turnRate);

      // Stride cadence strictly tied to actual horizontal displacement speed
      // At 2.0m/s walk, cadence advances ~5.2 rad/s (approx 1.7 steps/sec, standard human cadence)
      const strideRatio = 2.6;
      this.localWalkTime += dt * actualHorizontalSpeed * strideRatio;
    }

    this.localAvatarGroup.position.copy(this.localPosition);
    this.localAvatarGroup.rotation.y = this.localRotation;

    // If player starts walking, naturally exit seated or waving gesture
    if (this.isLocalMoving && this.currentGesture !== 'none' && this.currentGesture !== 'jog') {
      this.currentGesture = 'none';
    }

    // Animate articulated humanoid rig with natural gait and physics
    if (this.localRig) {
      this.localRig.updateAnimation(
        this.localWalkTime,
        this.isLocalMoving,
        this.isSprinting || (this.isRunning && actualHorizontalSpeed > 3.6),
        this.isJumping,
        this.velocityY,
        dt,
        actualHorizontalSpeed,
        this.currentGesture
      );
    }
  }

  private updateRemoteAvatars(dt: number) {
    for (const entry of this.remoteAvatars.values()) {
      const dist = entry.group.position.distanceTo(entry.targetPosition);
      const isMoving = dist > 0.06;
      entry.isMoving = isMoving;

      if (isMoving) {
        // Smooth interpolation towards network position
        const lerpFactor = Math.min(1.0, dt * 10.0);
        entry.group.position.lerp(entry.targetPosition, lerpFactor);

        // Smooth rotation interpolation
        const rotDiff = Math.atan2(
          Math.sin(entry.targetRotation - entry.group.rotation.y),
          Math.cos(entry.targetRotation - entry.group.rotation.y)
        );
        entry.group.rotation.y += rotDiff * Math.min(1.0, dt * 10.0);

        // Calculate approximate speed for gait synchronization
        entry.actualSpeed = Math.min(5.5, dist / Math.max(0.001, dt));
        entry.walkTime += dt * Math.max(1.8, entry.actualSpeed) * 2.6;
      } else {
        entry.actualSpeed = 0;
      }

      entry.rig.updateAnimation(
        entry.walkTime,
        isMoving,
        entry.actualSpeed > 4.2,
        false,
        0,
        dt,
        entry.actualSpeed
      );
    }
  }

  private updateCameraFollow(dt: number) {
    if (!this.localAvatarGroup) return;

    // Calculate spherical camera offset around player position
    const hDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const vDist = this.cameraDistance * Math.sin(this.cameraPitch);

    const targetCamX = this.localPosition.x + Math.sin(this.cameraYaw) * hDist;
    const targetCamY = Math.max(1.15, this.localPosition.y + 1.35 + vDist);
    const targetCamZ = this.localPosition.z + Math.cos(this.cameraYaw) * hDist;

    // Exponential smoothing for silky-smooth follow without vibration
    const dampPos = 1 - Math.exp(-12 * dt);
    this.dampedCamPos.x += (targetCamX - this.dampedCamPos.x) * dampPos;
    this.dampedCamPos.y += (targetCamY - this.dampedCamPos.y) * dampPos;
    this.dampedCamPos.z += (targetCamZ - this.dampedCamPos.z) * dampPos;

    this.camera.position.copy(this.dampedCamPos);

    // Look target smoothly tracks player upper chest
    const targetLookX = this.localPosition.x;
    const targetLookY = this.localPosition.y + 1.35;
    const targetLookZ = this.localPosition.z;

    const dampLook = 1 - Math.exp(-14 * dt);
    this.dampedLookTarget.x += (targetLookX - this.dampedLookTarget.x) * dampLook;
    this.dampedLookTarget.y += (targetLookY - this.dampedLookTarget.y) * dampLook;
    this.dampedLookTarget.z += (targetLookZ - this.dampedLookTarget.z) * dampLook;

    this.camera.lookAt(this.dampedLookTarget);
  }

  // Distance-based name tag attenuation & culling (Hides distant tags beyond 38m)
  private updateNameTagVisibility() {
    const camPos = this.camera.position;

    if (this.localNameSprite) {
      const dist = camPos.distanceTo(this.localPosition);
      this.localNameSprite.visible = dist < 38.0;
    }

    for (const entry of this.remoteAvatars.values()) {
      const dist = camPos.distanceTo(entry.group.position);
      entry.nameSprite.visible = dist < 38.0;
    }
  }

  public snapCameraToLocalAvatar() {
    if (!this.localAvatarGroup) return;

    const hDist = this.cameraDistance * Math.cos(this.cameraPitch);
    const vDist = this.cameraDistance * Math.sin(this.cameraPitch);

    this.dampedCamPos.set(
      this.localPosition.x + Math.sin(this.cameraYaw) * hDist,
      Math.max(1.15, this.localPosition.y + 1.35 + vDist),
      this.localPosition.z + Math.cos(this.cameraYaw) * hDist
    );
    this.camera.position.copy(this.dampedCamPos);

    this.dampedLookTarget.set(this.localPosition.x, this.localPosition.y + 1.35, this.localPosition.z);
    this.camera.lookAt(this.dampedLookTarget);
  }

  // ---------------------------------------------------------------------------
  // 7. CAMERA FOLLOW TOGGLE & RAYCASTING
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

  public dispose() {
    this.remotePlayersUnsub?.();

    if (typeof window !== 'undefined') {
      if (this.onKeyDownHandler) window.removeEventListener('keydown', this.onKeyDownHandler);
      if (this.onKeyUpHandler) window.removeEventListener('keyup', this.onKeyUpHandler);
      if (this.onBlurHandler) window.removeEventListener('blur', this.onBlurHandler);
      if (this.onCanvasPointerDown) window.removeEventListener('pointerdown', this.onCanvasPointerDown);
      if (this.onCanvasPointerMove) window.removeEventListener('pointermove', this.onCanvasPointerMove);
      if (this.onCanvasPointerUp) window.removeEventListener('pointerup', this.onCanvasPointerUp);
      if (this.onCanvasWheel) window.removeEventListener('wheel', this.onCanvasWheel);
    }

    this.removeLocalAvatar();

    for (const entry of this.remoteAvatars.values()) {
      this.group.remove(entry.group);
      entry.rig.dispose();
    }
    this.remoteAvatars.clear();

    this.scene.remove(this.group);
  }
}
