import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { sweptMoveVehicle, findSafeWalkableExit, isVehicleFootprintValid, checkObstacleCollision } from './collisionSystem';
import { classifySurface } from './roadNetwork';

export interface VehicleDiagnosticData {
  isDriving: boolean;
  x: number;
  y: number;
  z: number;
  yaw: number;
  yawDeg: number;
  speedKmh: number;
  actualSpeed: number;
  throttle: number;
  steer: number;
  isBraking: boolean;
  gear: 'D' | 'R' | 'P';
  surfaceType: string;
  hasCollided: boolean;
  lastObstacle: string;
  camX: number;
  camY: number;
  camZ: number;
}

export class DrivableVehicle {
  public group: THREE.Group;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private materials: MaterialLibrary;

  // Car Meshes
  private bodyMesh!: THREE.Mesh;
  private frontLeftWheel!: THREE.Group;
  private frontRightWheel!: THREE.Group;
  private rearLeftWheel!: THREE.Group;
  private rearRightWheel!: THREE.Group;
  private leftBrakeLight!: THREE.Mesh;
  private rightBrakeLight!: THREE.Mesh;
  private headlightSpot!: THREE.SpotLight;

  // State
  private isDriving: boolean = false;
  // Parked on Modern Village West Boulevard eastbound lane facing East toward Roundabout
  private readonly defaultSpawnPos = new THREE.Vector3(-22.0, 0.12, -2.0);
  private position = new THREE.Vector3(-22.0, 0.12, -2.0);
  private yaw: number = Math.PI * 0.5; // facing East (+x) along clear open boulevard
  private speed: number = 0; // units/sec
  private steerAngle: number = 0; // radians

  // Diagnostic tracking
  private lastCollided: boolean = false;
  private lastObstacleName: string = 'None (Clear Road)';

  // Physics constants
  private maxSpeed = 22.0; // ~80 km/h
  private maxReverseSpeed = -8.0;
  private acceleration = 16.0;
  private braking = 28.0;
  private drag = 4.0;
  private maxSteer = 0.52; // ~30 deg
  private steerSpeed = 4.5;

  // Input state
  private inputThrottle = 0;
  private inputSteer = 0;
  private inputBrake = false;

  // Chase Camera
  private camOffset = new THREE.Vector3(0, 3.8, 8.5);
  private camLookTarget = new THREE.Vector3();

  // Traffic Obstacles Cache for vehicle-to-vehicle collision
  public trafficObstacles?: { x: number; z: number; radius: number }[];

  // Callbacks
  public onExit?: () => void;
  public onExitSafePosition?: (pos: { x: number; z: number }) => void;
  public onStateChange?: (driving: boolean) => void;
  public onSpeedChange?: (speedKmh: number, gear: 'D' | 'R' | 'P') => void;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, materials: MaterialLibrary) {
    this.scene = scene;
    this.camera = camera;
    this.materials = materials;

    this.group = new THREE.Group();
    this.group.name = 'DrivableElectricVehicle';

    this.createCarModel();
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    this.scene.add(this.group);
  }

  private createCarModel() {
    // 1. Sleek Modern Aerodynamic Car Body (Electric Papaya Orange)
    const carMat = new THREE.MeshStandardMaterial({
      color: 0xf97316, // Electric Orange metallic
      roughness: 0.22,
      metalness: 0.8,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x1e293b,
      metalness: 0.1,
      roughness: 0.1,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });

    // Lower chassis
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.65, 4.4);
    this.bodyMesh = new THREE.Mesh(bodyGeo, carMat);
    this.bodyMesh.position.y = 0.55;
    this.bodyMesh.castShadow = true;
    this.bodyMesh.receiveShadow = true;
    this.group.add(this.bodyMesh);

    // Aerodynamic Cabin / Roof
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.58, 2.3);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.position.set(0, 1.08, -0.2);
    cabin.castShadow = true;
    this.group.add(cabin);

    // Front Windshield slope
    const hoodGeo = new THREE.BoxGeometry(1.9, 0.12, 1.3);
    const hood = new THREE.Mesh(hoodGeo, carMat);
    hood.position.set(0, 0.85, 1.3);
    this.group.add(hood);

    // 2. Wheels
    this.frontLeftWheel = this.createWheel(darkMat);
    this.frontLeftWheel.position.set(-1.15, 0.38, 1.3);
    this.group.add(this.frontLeftWheel);

    this.frontRightWheel = this.createWheel(darkMat);
    this.frontRightWheel.position.set(1.15, 0.38, 1.3);
    this.group.add(this.frontRightWheel);

    this.rearLeftWheel = this.createWheel(darkMat);
    this.rearLeftWheel.position.set(-1.15, 0.38, -1.3);
    this.group.add(this.rearLeftWheel);

    this.rearRightWheel = this.createWheel(darkMat);
    this.rearRightWheel.position.set(1.15, 0.38, -1.3);
    this.group.add(this.rearRightWheel);

    // 3. Headlights & Brake Lights
    const headGeo = new THREE.BoxGeometry(0.35, 0.14, 0.1);
    const headMat = new THREE.MeshBasicMaterial({ color: 0xe0f2fe });
    const leftHead = new THREE.Mesh(headGeo, headMat);
    leftHead.position.set(-0.75, 0.62, 2.21);
    this.group.add(leftHead);

    const rightHead = new THREE.Mesh(headGeo, headMat);
    rightHead.position.set(0.75, 0.62, 2.21);
    this.group.add(rightHead);

    // Spotlight projection forward
    this.headlightSpot = new THREE.SpotLight(0xffffff, 2.5, 35, Math.PI / 4, 0.4);
    this.headlightSpot.position.set(0, 0.8, 2.2);
    this.headlightSpot.target.position.set(0, 0.5, 15);
    this.group.add(this.headlightSpot);
    this.group.add(this.headlightSpot.target);

    // Brake Lights (glowing red when braking)
    const brakeGeo = new THREE.BoxGeometry(0.38, 0.12, 0.1);
    const brakeMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
    this.leftBrakeLight = new THREE.Mesh(brakeGeo, brakeMat);
    this.leftBrakeLight.position.set(-0.75, 0.65, -2.21);
    this.group.add(this.leftBrakeLight);

    this.rightBrakeLight = new THREE.Mesh(brakeGeo, brakeMat);
    this.rightBrakeLight.position.set(0.75, 0.65, -2.21);
    this.group.add(this.rightBrakeLight);

    // Overhead Interaction Beacon
    const beaconGeo = new THREE.OctahedronGeometry(0.35, 0);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4, wireframe: true });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.y = 2.4;
    beacon.name = 'VehicleBeacon';
    this.group.add(beacon);

    // Make interactive for raycasting
    this.group.traverse((child) => {
      child.userData = { isDrivableVehicle: true };
    });
  }

  private createWheel(tireMat: THREE.Material): THREE.Group {
    const wheelGroup = new THREE.Group();
    const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 16);
    tireGeo.rotateZ(Math.PI / 2);
    const tire = new THREE.Mesh(tireGeo, tireMat);
    tire.castShadow = true;
    wheelGroup.add(tire);

    // Alloy Hubcap
    const rimGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.3, 8);
    rimGeo.rotateZ(Math.PI / 2);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.2 });
    const rim = new THREE.Mesh(rimGeo, rimMat);
    wheelGroup.add(rim);

    return wheelGroup;
  }

  // ---------------------------------------------------------------------------
  // INPUTS & STATE
  // ---------------------------------------------------------------------------
  public setThrottle(val: number) {
    this.inputThrottle = Math.max(-1, Math.min(1, val));
  }

  public setSteer(val: number) {
    this.inputSteer = Math.max(-1, Math.min(1, val));
  }

  public setBraking(val: boolean) {
    this.inputBrake = val;
  }

  public setBrake(val: boolean) {
    this.inputBrake = val;
  }

  public setHandbrake(val: boolean) {
    this.inputBrake = val;
  }

  public enter() {
    this.isDriving = true;
    this.speed = 0;
    this.snapCameraBehind();
    this.onStateChange?.(true);
  }

  public exit(): boolean {
    if (!this.isDriving) return false;

    // 1. Capture last valid position & heading and solve safe walkable exit
    const exitResult = findSafeWalkableExit(this.position.x, this.position.z, this.yaw);
    if (!exitResult.success) {
      console.warn('[DrivableVehicle] Exit blocked: all candidate positions obstructed. Remaining in vehicle.');
      return false;
    }

    this.isDriving = false;
    this.speed = 0;
    this.inputThrottle = 0;
    this.inputSteer = 0;
    this.inputBrake = false;

    // Deliver safe position to avatar manager & scene manager
    this.onExitSafePosition?.({ x: exitResult.x, z: exitResult.z });

    // 2. Notify state change & exit callbacks after position is synchronized
    this.onStateChange?.(false);
    this.onExit?.();
    return true;
  }

  public getSafeExitPosition(): { x: number; z: number } {
    const res = findSafeWalkableExit(this.position.x, this.position.z, this.yaw);
    return { x: res.x, z: res.z };
  }

  public enterVehicle() {
    this.enter();
  }

  public exitVehicle() {
    this.exit();
  }

  public getIsDriving(): boolean {
    return this.isDriving;
  }

  public getPosition(): THREE.Vector3 {
    return this.position.clone();
  }

  public getYaw(): number {
    return this.yaw;
  }

  public getGroup(): THREE.Group {
    return this.group;
  }

  // ---------------------------------------------------------------------------
  // UPDATE LOOP
  // ---------------------------------------------------------------------------
  public update(delta: number, elapsed: number) {
    // Pulse beacon when parked
    const beacon = this.group.getObjectByName('VehicleBeacon');
    if (beacon) {
      beacon.visible = !this.isDriving;
      if (!this.isDriving) {
        beacon.rotation.y = elapsed * 1.5;
        beacon.position.y = 2.4 + Math.sin(elapsed * 2.5) * 0.15;
      }
    }

    if (!this.isDriving) return;

    const dt = Math.min(0.08, Math.max(0.001, delta));

    // 1. Acceleration & Drag Physics
    if (this.inputThrottle > 0) {
      this.speed += this.acceleration * this.inputThrottle * dt;
    } else if (this.inputThrottle < 0) {
      this.speed += this.acceleration * this.inputThrottle * dt;
    } else {
      // Natural rolling friction drag
      if (this.speed > 0) {
        this.speed = Math.max(0, this.speed - this.drag * dt);
      } else if (this.speed < 0) {
        this.speed = Math.min(0, this.speed + this.drag * dt);
      }
    }

    // Handbrake
    if (this.inputBrake) {
      const brakeForce = this.braking * dt;
      if (this.speed > 0) this.speed = Math.max(0, this.speed - brakeForce);
      else if (this.speed < 0) this.speed = Math.min(0, this.speed + brakeForce);
    }

    // Clamp speed
    this.speed = Math.max(this.maxReverseSpeed, Math.min(this.maxSpeed, this.speed));

    // 2. Steering angle
    const targetSteer = -this.inputSteer * this.maxSteer;
    this.steerAngle += (targetSteer - this.steerAngle) * Math.min(1, dt * this.steerSpeed);

    // Front wheels turn visually
    this.frontLeftWheel.rotation.y = this.steerAngle;
    this.frontRightWheel.rotation.y = this.steerAngle;

    // Spin all wheels according to forward movement
    const wheelSpin = (this.speed / 0.38) * dt;
    this.frontLeftWheel.rotation.x += wheelSpin;
    this.frontRightWheel.rotation.x += wheelSpin;
    this.rearLeftWheel.rotation.x += wheelSpin;
    this.rearRightWheel.rotation.x += wheelSpin;

    // 3. Apply Steering rotation to Vehicle Heading with kinematic bicycle model
    if (Math.abs(this.speed) > 0.02) {
      // Bicycle model: dYaw/dt = (v / L) * tan(steerAngle)
      // Provide responsive low-speed turning so car maneuvers easily at parking/starting speeds
      const effectiveSpeed = Math.sign(this.speed) * Math.max(Math.abs(this.speed), 3.5);
      const wheelbase = 2.6;
      const turnRate = (effectiveSpeed / wheelbase) * Math.tan(this.steerAngle);
      const targetYaw = this.yaw + turnRate * dt;
      // Ensure rotated vehicle footprint remains valid
      if (isVehicleFootprintValid(this.position.x, this.position.z, targetYaw, this.trafficObstacles, true)) {
        this.yaw = targetYaw;
      }
    }

    // 4. Compute next position with swept substepping and authoritative road & obstacle check
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const nextX = this.position.x + forward.x * this.speed * dt;
    const nextZ = this.position.z + forward.z * this.speed * dt;

    const swept = sweptMoveVehicle(
      this.position.x,
      this.position.z,
      this.yaw,
      nextX,
      nextZ,
      this.trafficObstacles,
      true
    );

    this.position.x = swept.x;
    this.position.z = swept.z;
    this.lastCollided = swept.collided;

    if (swept.collided) {
      const obstacleCheck = checkObstacleCollision(nextX, nextZ, 1.2);
      this.lastObstacleName = obstacleCheck.collided && obstacleCheck.obstacleName ? obstacleCheck.obstacleName : 'Road Perimeter / Boundary';
      // Rebound gently & cancel speed into obstacle
      this.speed = -this.speed * 0.15;
      if (Math.abs(this.speed) < 0.2) {
        this.speed = 0;
      }
    } else {
      this.lastObstacleName = 'None (Clear Road)';
    }

    // Update group transform
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;

    // Brake light glow
    const isBraking = this.inputBrake || (this.speed > 0.5 && this.inputThrottle < 0);
    const bColor = isBraking ? 0xff0000 : 0x7f1d1d;
    (this.leftBrakeLight.material as THREE.MeshBasicMaterial).color.setHex(bColor);
    (this.rightBrakeLight.material as THREE.MeshBasicMaterial).color.setHex(bColor);

    // 5. Update Chase Camera with Obstacle & Roof Occlusion Prevention
    this.updateChaseCamera(dt);

    // 6. Notify Speedometer
    const speedKmh = Math.round(Math.abs(this.speed) * 3.6);
    const gear: 'D' | 'R' | 'P' = Math.abs(this.speed) < 0.2 ? 'P' : this.speed < 0 ? 'R' : 'D';
    this.onSpeedChange?.(speedKmh, gear);
  }

  private updateChaseCamera(dt: number) {
    const desiredDist = this.camOffset.z + (Math.abs(this.speed) / this.maxSpeed) * 1.5;
    let actualDist = desiredDist;
    let heightOffset = this.camOffset.y;

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);

    // Test reverse ray for building obstacle collision to prevent camera clipping inside walls
    for (let d = desiredDist; d >= 3.2; d -= 0.6) {
      const testX = this.position.x - sinY * d;
      const testZ = this.position.z - cosY * d;
      const collision = checkObstacleCollision(testX, testZ, 0.6);
      if (collision.collided) {
        actualDist = Math.max(3.2, d - 0.5);
        heightOffset = this.camOffset.y + (desiredDist - actualDist) * 0.35;
      }
    }

    const targetCamX = this.position.x - sinY * actualDist;
    const targetCamY = this.position.y + heightOffset;
    const targetCamZ = this.position.z - cosY * actualDist;

    const smooth = Math.min(1, dt * 6.5);
    this.camera.position.x += (targetCamX - this.camera.position.x) * smooth;
    this.camera.position.y += (targetCamY - this.camera.position.y) * smooth;
    this.camera.position.z += (targetCamZ - this.camera.position.z) * smooth;

    this.camLookTarget.set(this.position.x, this.position.y + 1.2, this.position.z);
    this.camera.lookAt(this.camLookTarget);
  }

  public snapCameraBehind() {
    const desiredDist = this.camOffset.z;
    let actualDist = desiredDist;
    let heightOffset = this.camOffset.y;

    const sinY = Math.sin(this.yaw);
    const cosY = Math.cos(this.yaw);

    for (let d = desiredDist; d >= 3.2; d -= 0.6) {
      const testX = this.position.x - sinY * d;
      const testZ = this.position.z - cosY * d;
      const collision = checkObstacleCollision(testX, testZ, 0.6);
      if (collision.collided) {
        actualDist = Math.max(3.2, d - 0.5);
        heightOffset = this.camOffset.y + (desiredDist - actualDist) * 0.35;
      }
    }

    this.camera.position.set(
      this.position.x - sinY * actualDist,
      this.position.y + heightOffset,
      this.position.z - cosY * actualDist
    );
    this.camLookTarget.set(this.position.x, this.position.y + 1.2, this.position.z);
    this.camera.lookAt(this.camLookTarget);
  }

  public resetToSpawn() {
    this.position.copy(this.defaultSpawnPos);
    this.yaw = Math.PI * 0.5; // facing East
    this.speed = 0;
    this.steerAngle = 0;
    this.inputThrottle = 0;
    this.inputSteer = 0;
    this.inputBrake = false;
    this.group.position.copy(this.position);
    this.group.rotation.y = this.yaw;
    this.snapCameraBehind();
  }

  public getDiagnostics(): VehicleDiagnosticData {
    const speedKmh = Math.round(Math.abs(this.speed) * 3.6);
    const gear: 'D' | 'R' | 'P' = Math.abs(this.speed) < 0.2 ? 'P' : this.speed < 0 ? 'R' : 'D';
    const surfaceType = classifySurface(this.position.x, this.position.z);
    const yawDeg = Math.round(((this.yaw * 180) / Math.PI) % 360);

    return {
      isDriving: this.isDriving,
      x: Number(this.position.x.toFixed(2)),
      y: Number(this.position.y.toFixed(2)),
      z: Number(this.position.z.toFixed(2)),
      yaw: Number(this.yaw.toFixed(2)),
      yawDeg,
      speedKmh,
      actualSpeed: Number(this.speed.toFixed(2)),
      throttle: Number(this.inputThrottle.toFixed(2)),
      steer: Number(this.inputSteer.toFixed(2)),
      isBraking: this.inputBrake,
      gear,
      surfaceType,
      hasCollided: this.lastCollided,
      lastObstacle: this.lastObstacleName,
      camX: Number(this.camera.position.x.toFixed(2)),
      camY: Number(this.camera.position.y.toFixed(2)),
      camZ: Number(this.camera.position.z.toFixed(2)),
    };
  }

  public dispose() {
    this.scene.remove(this.group);
  }
}
