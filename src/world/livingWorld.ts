import * as THREE from 'three';
import { MaterialLibrary } from './materials';

export interface LivingWorldOptions {
  materials: MaterialLibrary;
  isSoftwareGl?: boolean;
}

interface Waypoint {
  x: number;
  z: number;
  speed?: number;
}

interface VehicleEntity {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  path: Waypoint[];
  currentSegment: number;
  segmentProgress: number; // 0 to 1
  baseSpeed: number; // units per second
  heading: number;
  wheelRadius: number;
}

interface PedestrianEntity {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
  path: Waypoint[];
  currentSegment: number;
  segmentProgress: number;
  speed: number;
  walkCycle: number;
}

export class LivingWorldManager {
  public group = new THREE.Group();
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;
  private isActive: boolean = true;
  private isEcoMode: boolean = false;
  private isNight: boolean = false;

  private vehicles: VehicleEntity[] = [];
  private pedestrians: PedestrianEntity[] = [];
  private lakeMesh: THREE.Mesh | null = null;
  private streetPointLights: THREE.PointLight[] = [];

  constructor(options: LivingWorldOptions) {
    this.materials = options.materials;
    this.isSoftwareGl = !!options.isSoftwareGl;
    this.group.name = 'LivingWorldSimulation';

    this.initVehicles();
    this.initPedestrians();
    this.initStreetlights();
  }

  public setLakeMesh(mesh: THREE.Mesh) {
    this.lakeMesh = mesh;
  }

  // ---------------------------------------------------------------------------
  // 1. VEHICLE SIMULATION
  // ---------------------------------------------------------------------------
  private initVehicles() {
    // 1. Silver Electric Sedan (Main East-West Boulevard Loop)
    const sedanPath: Waypoint[] = [
      { x: -36, z: 2.0, speed: 7.5 },
      { x: -16, z: 2.0, speed: 5.5 }, // slow near roundabout
      { x: -5, z: 2.0, speed: 5.0 },
      { x: 18, z: 2.0, speed: 7.5 },
      { x: 38, z: 2.0, speed: 4.5 },
      // Turnaround loop at East End
      { x: 40, z: 0.0, speed: 4.0 },
      { x: 38, z: -2.0, speed: 4.5 },
      // Westbound lane
      { x: 18, z: -2.0, speed: 7.5 },
      { x: -5, z: -2.0, speed: 5.0 },
      { x: -16, z: -2.0, speed: 5.5 },
      { x: -36, z: -2.0, speed: 7.5 },
      // Turnaround loop at West End
      { x: -38, z: 0.0, speed: 4.0 },
    ];
    this.createVehicle(sedanPath, this.materials.carPaintWhite, 'sedan', 0.85);

    // 2. Cyan City Eco Bus (North-South Boulevard Transit Loop)
    const busPath: Waypoint[] = [
      { x: -3.2, z: -24, speed: 5.0 },
      { x: -3.2, z: -4, speed: 4.0 }, // near intersection
      { x: -3.2, z: 8, speed: 5.5 },
      { x: -3.2, z: 32, speed: 5.5 },
      { x: -3.2, z: 52, speed: 3.5 }, // residential north terminus
      // Turn loop
      { x: -5.0, z: 54, speed: 3.0 },
      { x: -6.8, z: 52, speed: 3.5 },
      // Southbound lane
      { x: -6.8, z: 32, speed: 5.5 },
      { x: -6.8, z: 8, speed: 5.5 },
      { x: -6.8, z: -4, speed: 4.0 },
      { x: -6.8, z: -24, speed: 5.0 },
      // South loop
      { x: -5.0, z: -26, speed: 3.0 },
    ];
    this.createVehicle(busPath, this.materials.carPaintBlue, 'bus', 1.15);

    // 3. Crimson Compact Hatchback (Residential Cul-de-sac & Roundabout loop)
    const hatchPath: Waypoint[] = [
      { x: -48, z: 38.5, speed: 6.0 },
      { x: -28, z: 38.5, speed: 6.0 },
      { x: -12, z: 38.5, speed: 4.5 },
      // Curve south along neighborhood connector
      { x: -6.8, z: 26, speed: 5.0 },
      { x: -6.8, z: 10, speed: 4.5 },
      { x: -10, z: 3.0, speed: 4.0 },
      // Curve through roundabout perimeter
      { x: -12, z: -1.8, speed: 4.5 },
      { x: -6.8, z: -2.0, speed: 5.0 },
      // Return northbound
      { x: -3.2, z: 10, speed: 5.0 },
      { x: -3.2, z: 26, speed: 5.0 },
      { x: -10, z: 41.5, speed: 4.5 },
      { x: -28, z: 41.5, speed: 6.0 },
      { x: -48, z: 41.5, speed: 4.0 },
      { x: -50, z: 40.0, speed: 3.0 },
    ];
    this.createVehicle(hatchPath, this.materials.carPaintRed, 'hatchback', 0.78);

    // 4. Amber Delivery Van (Town Center Commercial Delivery Route)
    const vanPath: Waypoint[] = [
      { x: -26, z: -2.0, speed: 5.5 },
      { x: -18, z: -2.0, speed: 4.0 },
      { x: -14, z: 4.0, speed: 3.5 }, // curbside delivery zone
      { x: -14, z: 12.0, speed: 4.5 },
      { x: -22, z: 12.0, speed: 5.0 },
      { x: -32, z: 12.0, speed: 5.0 },
      { x: -34, z: 4.0, speed: 4.0 },
      { x: -34, z: -2.0, speed: 4.0 },
    ];
    this.createVehicle(vanPath, this.materials.sportCourtOrange, 'van', 0.95);

    // 5. Dark Slate Modern Crossover SUV (Lake Shore Scenic Drive)
    const suvPath: Waypoint[] = [
      { x: -22, z: -26.5, speed: 6.5 },
      { x: -6, z: -26.5, speed: 6.5 },
      { x: 10, z: -26.5, speed: 6.5 },
      { x: 22, z: -26.5, speed: 4.0 },
      // Turn loop
      { x: 24, z: -28.0, speed: 3.5 },
      { x: 22, z: -29.5, speed: 4.0 },
      { x: 10, z: -29.5, speed: 6.5 },
      { x: -6, z: -29.5, speed: 6.5 },
      { x: -22, z: -29.5, speed: 4.0 },
      { x: -24, z: -28.0, speed: 3.5 },
    ];
    this.createVehicle(suvPath, this.materials.modernDarkSlate, 'suv', 0.9);
  }

  private createVehicle(
    path: Waypoint[],
    paintMaterial: THREE.Material,
    type: 'sedan' | 'bus' | 'hatchback' | 'van' | 'suv',
    scale: number
  ) {
    const vGroup = new THREE.Group();
    vGroup.position.set(path[0].x, 0.08, path[0].z);

    const wheels: THREE.Mesh[] = [];
    const headlights: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];

    const isBus = type === 'bus';
    const isVan = type === 'van';

    const length = isBus ? 7.6 : isVan ? 4.8 : 4.2;
    const width = isBus ? 2.4 : 2.0;
    const height = isBus ? 2.3 : isVan ? 1.9 : 1.35;
    const wheelRadius = isBus ? 0.44 : 0.35;

    // 1. Lower Chassis / Body
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.48, length);
    const body = new THREE.Mesh(bodyGeo, paintMaterial);
    body.position.y = wheelRadius + height * 0.24;
    body.castShadow = !this.isSoftwareGl;
    body.receiveShadow = true;
    vGroup.add(body);

    // 2. Cabin / Glass
    const cabinLength = isBus ? length * 0.92 : isVan ? length * 0.55 : length * 0.62;
    const cabinWidth = width * 0.92;
    const cabinHeight = height * 0.52;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, this.materials.carGlass);
    const cabinZOffset = isBus ? 0 : isVan ? 0.6 : -0.2;
    cabin.position.set(0, wheelRadius + height * 0.48 + cabinHeight * 0.5, cabinZOffset);
    cabin.castShadow = !this.isSoftwareGl;
    vGroup.add(cabin);

    // 3. Roof Cap
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.98, 0.08, cabinLength * 0.98);
    const roof = new THREE.Mesh(roofGeo, paintMaterial);
    roof.position.set(0, cabin.position.y + cabinHeight * 0.5 + 0.04, cabinZOffset);
    vGroup.add(roof);

    // 4. Wheels with Rims
    const halfW = width * 0.5 + 0.04;
    const wheelZ1 = length * 0.32;
    const wheelZ2 = -length * 0.32;
    const wheelPositions = [
      { x: -halfW, z: wheelZ1 },
      { x: halfW, z: wheelZ1 },
      { x: -halfW, z: wheelZ2 },
      { x: halfW, z: wheelZ2 },
    ];
    wheelPositions.forEach((wp) => {
      const tireGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, 0.24, 12);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, this.materials.carTireRubber);
      tire.position.set(wp.x, wheelRadius, wp.z);
      tire.castShadow = !this.isSoftwareGl;
      vGroup.add(tire);
      wheels.push(tire);

      // Hubcap
      const hubGeo = new THREE.CylinderGeometry(wheelRadius * 0.5, wheelRadius * 0.5, 0.26, 8);
      hubGeo.rotateZ(Math.PI / 2);
      const hub = new THREE.Mesh(hubGeo, this.materials.metalSteel);
      hub.position.copy(tire.position);
      vGroup.add(hub);
    });

    // 5. Headlights (Facing +Z direction of vehicle)
    const hlX = width * 0.36;
    const hlY = wheelRadius + height * 0.22;
    const hlZ = length * 0.505;
    for (const hx of [-hlX, hlX]) {
      const hlGeo = new THREE.BoxGeometry(0.32, 0.14, 0.05);
      const hl = new THREE.Mesh(hlGeo, this.materials.headlightGlow);
      hl.position.set(hx, hlY, hlZ);
      vGroup.add(hl);
      headlights.push(hl);
    }

    // 6. Taillights (Facing -Z direction)
    const tlZ = -length * 0.505;
    for (const tx of [-hlX, hlX]) {
      const tlGeo = new THREE.BoxGeometry(0.36, 0.12, 0.05);
      const tl = new THREE.Mesh(tlGeo, this.materials.taillightGlow);
      tl.position.set(tx, hlY, tlZ);
      vGroup.add(tl);
      taillights.push(tl);
    }

    vGroup.scale.set(scale, scale, scale);
    this.group.add(vGroup);

    this.vehicles.push({
      group: vGroup,
      wheels,
      headlights,
      taillights,
      path,
      currentSegment: 0,
      segmentProgress: 0,
      baseSpeed: path[0].speed || 6.0,
      heading: 0,
      wheelRadius,
    });
  }

  // ---------------------------------------------------------------------------
  // 2. PEDESTRIAN SIMULATION
  // ---------------------------------------------------------------------------
  private initPedestrians() {
    // 1 & 2: Strolling around Town Center Plaza Pavers
    const p1Path: Waypoint[] = [
      { x: -22, z: -4 },
      { x: -14, z: -4 },
      { x: -10, z: -2 },
      { x: -10, z: 6 },
      { x: -18, z: 6 },
      { x: -24, z: 2 },
    ];
    this.createPedestrian(p1Path, this.materials.pedestrianShirt1, 1.35, 0.0);

    const p2Path: Waypoint[] = [
      { x: -12, z: 4 },
      { x: -20, z: 4 },
      { x: -24, z: -6 },
      { x: -16, z: -6 },
    ];
    this.createPedestrian(p2Path, this.materials.pedestrianShirt2, 1.25, 1.5);

    // 3 & 4: Central Park Walking Paths
    const p3Path: Waypoint[] = [
      { x: 12, z: -10 },
      { x: 22, z: -14 },
      { x: 28, z: -6 },
      { x: 24, z: 6 },
      { x: 14, z: 4 },
    ];
    this.createPedestrian(p3Path, this.materials.pedestrianShirt3, 1.4, 0.8);

    const p4Path: Waypoint[] = [
      { x: 16, z: 8 },
      { x: 26, z: 8 },
      { x: 22, z: -2 },
      { x: 14, z: -2 },
    ];
    this.createPedestrian(p4Path, this.materials.pedestrianShirt1, 1.3, 2.2);

    // 5 & 6: Boulevard Pedestrian Crossings (stopping to look before crossing)
    const p5Path: Waypoint[] = [
      { x: -14, z: -5.5 },
      { x: -14, z: 5.5 },
      { x: -12, z: 5.5 },
      { x: -12, z: -5.5 },
    ];
    this.createPedestrian(p5Path, this.materials.pedestrianShirt2, 1.2, 0.4);

    const p6Path: Waypoint[] = [
      { x: 2, z: 5.5 },
      { x: 2, z: -5.5 },
      { x: 0, z: -5.5 },
      { x: 0, z: 5.5 },
    ];
    this.createPedestrian(p6Path, this.materials.pedestrianShirt3, 1.15, 1.9);

    // 7: Botanical Garden Perimeter Path
    const p7Path: Waypoint[] = [
      { x: 24, z: 28 },
      { x: 32, z: 28 },
      { x: 32, z: 40 },
      { x: 24, z: 40 },
    ];
    this.createPedestrian(p7Path, this.materials.pedestrianShirt1, 1.2, 3.0);

    // 8: Lake District Promenade Boardwalk
    const p8Path: Waypoint[] = [
      { x: -16, z: -24 },
      { x: -2, z: -24 },
      { x: 14, z: -24 },
      { x: -2, z: -24 },
    ];
    this.createPedestrian(p8Path, this.materials.pedestrianShirt2, 1.3, 0.6);
  }

  private createPedestrian(
    path: Waypoint[],
    shirtMat: THREE.Material,
    speed: number,
    startOffset: number
  ) {
    const pedGroup = new THREE.Group();
    pedGroup.position.set(path[0].x, 0.22, path[0].z);

    // 1. Torso / Shirt
    const torsoGeo = new THREE.BoxGeometry(0.38, 0.52, 0.24);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 0.95;
    torso.castShadow = !this.isSoftwareGl;
    pedGroup.add(torso);

    // 2. Head & Hair
    const headGeo = new THREE.SphereGeometry(0.16, 8, 8);
    const head = new THREE.Mesh(headGeo, this.materials.pedestrianSkin);
    head.position.y = 1.34;
    pedGroup.add(head);

    const hairGeo = new THREE.BoxGeometry(0.33, 0.1, 0.33);
    const hair = new THREE.Mesh(hairGeo, this.materials.metalBlack);
    hair.position.y = 1.45;
    pedGroup.add(hair);

    // 3. Articulated Legs (Left & Right)
    const legGeo = new THREE.BoxGeometry(0.14, 0.62, 0.16);
    legGeo.translate(0, -0.31, 0); // Pivot at hip joint

    const leftLeg = new THREE.Group();
    leftLeg.position.set(-0.1, 0.68, 0);
    const leftLegMesh = new THREE.Mesh(legGeo, this.materials.pedestrianPants);
    leftLeg.add(leftLegMesh);
    pedGroup.add(leftLeg);

    const rightLeg = new THREE.Group();
    rightLeg.position.set(0.1, 0.68, 0);
    const rightLegMesh = new THREE.Mesh(legGeo, this.materials.pedestrianPants);
    rightLeg.add(rightLegMesh);
    pedGroup.add(rightLeg);

    // 4. Articulated Arms (Left & Right)
    const armGeo = new THREE.BoxGeometry(0.1, 0.44, 0.12);
    armGeo.translate(0, -0.22, 0); // Pivot at shoulder joint

    const leftArm = new THREE.Group();
    leftArm.position.set(-0.25, 1.15, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, shirtMat);
    leftArm.add(leftArmMesh);
    pedGroup.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.25, 1.15, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, shirtMat);
    rightArm.add(rightArmMesh);
    pedGroup.add(rightArm);

    this.group.add(pedGroup);

    this.pedestrians.push({
      group: pedGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      torso,
      path,
      currentSegment: 0,
      segmentProgress: startOffset % 1,
      speed,
      walkCycle: startOffset * 4,
    });
  }

  // ---------------------------------------------------------------------------
  // 3. STREETLIGHT GLOW & WARM POINT LIGHTS
  // ---------------------------------------------------------------------------
  private initStreetlights() {
    // Add warm localized point lights for night mode along key intersections
    const keyLamps = [
      { x: -14, y: 4.2, z: 0 },   // Town Center plaza
      { x: 14, y: 4.2, z: 0 },    // Central Park entry
      { x: -5, y: 4.2, z: 20 },   // Residential road
      { x: 5, y: 4.2, z: -25 },   // Lake promenade
    ];

    keyLamps.forEach((kl) => {
      const ptLight = new THREE.PointLight(0xfef08a, 0, 24, 1.8);
      ptLight.position.set(kl.x, kl.y, kl.z);
      this.group.add(ptLight);
      this.streetPointLights.push(ptLight);
    });
  }

  // ---------------------------------------------------------------------------
  // 4. CONTROLS: PAUSE, ECO MODE, NIGHT CYCLE
  // ---------------------------------------------------------------------------
  public setActive(active: boolean) {
    this.isActive = active;
  }

  public setEcoMode(eco: boolean) {
    this.isEcoMode = eco;
  }

  public setNightMode(isNight: boolean | number) {
    const factor = typeof isNight === 'number' ? Math.max(0, Math.min(1, isNight)) : isNight ? 1 : 0;
    this.isNight = factor > 0.4;
    const targetIntensity = factor * 1.8;
    this.streetPointLights.forEach((light) => {
      light.intensity = targetIntensity;
    });
  }

  // ---------------------------------------------------------------------------
  // 5. UPDATE LOOP (Zero GC Allocations)
  // ---------------------------------------------------------------------------
  public update(delta: number, elapsed: number) {
    if (!this.isActive) return;

    // Eco mode skips every other frame simulation or uses smaller step
    const dt = Math.min(delta, 0.08);

    // 1. Update Vehicles
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      const path = v.path;
      const count = path.length;

      const pA = path[v.currentSegment];
      const nextIdx = (v.currentSegment + 1) % count;
      const pB = path[nextIdx];

      const dx = pB.x - pA.x;
      const dz = pB.z - pA.z;
      const segLen = Math.hypot(dx, dz);

      if (segLen > 0.001) {
        const segSpeed = pA.speed || v.baseSpeed;
        const progressDelta = (segSpeed * dt) / segLen;
        v.segmentProgress += progressDelta;

        if (v.segmentProgress >= 1.0) {
          v.segmentProgress -= 1.0;
          v.currentSegment = nextIdx;
        }

        // Interpolate position along segment
        const curX = pA.x + dx * v.segmentProgress;
        const curZ = pA.z + dz * v.segmentProgress;
        v.group.position.x = curX;
        v.group.position.z = curZ;

        // Calculate heading tangent (vehicle forward direction is +Z)
        const targetHeading = Math.atan2(dx, dz);
        // Smoothly rotate heading towards target direction
        let diff = targetHeading - v.heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        v.heading += diff * Math.min(1.0, dt * 6.0);
        v.group.rotation.y = v.heading;

        // Spin wheels based on travel velocity (w = v / r)
        const wheelRot = (segSpeed * dt) / v.wheelRadius;
        for (let w = 0; w < v.wheels.length; w++) {
          v.wheels[w].rotation.x += wheelRot;
        }
      }
    }

    // 2. Update Pedestrians
    for (let j = 0; j < this.pedestrians.length; j++) {
      const p = this.pedestrians[j];
      const path = p.path;
      const count = path.length;

      const pA = path[p.currentSegment];
      const nextIdx = (p.currentSegment + 1) % count;
      const pB = path[nextIdx];

      const dx = pB.x - pA.x;
      const dz = pB.z - pA.z;
      const segLen = Math.hypot(dx, dz);

      if (segLen > 0.001) {
        const progressDelta = (p.speed * dt) / segLen;
        p.segmentProgress += progressDelta;

        if (p.segmentProgress >= 1.0) {
          p.segmentProgress -= 1.0;
          p.currentSegment = nextIdx;
        }

        // Interpolate position
        p.group.position.x = pA.x + dx * p.segmentProgress;
        p.group.position.z = pA.z + dz * p.segmentProgress;

        // Facing direction
        const heading = Math.atan2(dx, dz);
        p.group.rotation.y = heading;

        // Articulated Walk Cycle
        p.walkCycle += dt * p.speed * 4.2;
        const swingAngle = Math.sin(p.walkCycle) * 0.42;

        p.leftLeg.rotation.x = swingAngle;
        p.rightLeg.rotation.x = -swingAngle;

        p.leftArm.rotation.x = -swingAngle * 0.75;
        p.rightArm.rotation.x = swingAngle * 0.75;

        // Subtle vertical hip bounce
        p.torso.position.y = 0.95 + Math.abs(Math.sin(p.walkCycle)) * 0.035;
      }
    }

    // 3. Lake Water Movement (subtle gentle surface wave displacement)
    if (this.lakeMesh && !this.isEcoMode) {
      this.lakeMesh.position.y = -0.18 + Math.sin(elapsed * 1.8) * 0.02;
    }
  }

  public dispose() {
    this.vehicles = [];
    this.pedestrians = [];
    this.streetPointLights = [];
  }
}
