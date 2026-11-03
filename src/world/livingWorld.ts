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
  yieldDuration?: number; // seconds to pause / yield safely at intersection, station, or crosswalk
}

interface TurnSignalPair {
  front: THREE.Mesh;
  rear: THREE.Mesh;
}

interface VehicleEntity {
  group: THREE.Group;
  wheels: THREE.Mesh[];
  headlights: THREE.Mesh[];
  taillights: THREE.Mesh[];
  leftSignals: TurnSignalPair | null;
  rightSignals: TurnSignalPair | null;
  emergencyBeacons?: { red: THREE.Mesh; blue: THREE.Mesh };
  path: Waypoint[];
  currentSegment: number;
  segmentProgress: number; // 0 to 1
  baseSpeed: number; // units per second
  heading: number;
  wheelRadius: number;
  yieldTimer: number;
  isYielding: boolean;
  actualSpeed: number;
  type: 'sedan' | 'bus' | 'hatchback' | 'van' | 'suv' | 'ambulance' | 'hybrid';
  isBrakingForVehicle: boolean;
}

interface PedestrianEntity {
  group: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  torso: THREE.Mesh;
  head: THREE.Mesh;
  path: Waypoint[];
  currentSegment: number;
  segmentProgress: number;
  speed: number;
  walkCycle: number;
  pauseTimer: number;
  isPausing: boolean;
}

export class LivingWorldManager {
  public group = new THREE.Group();
  private vehicleGroup = new THREE.Group();
  private pedestrianGroup = new THREE.Group();
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;

  // Simulation State & Controls
  private isActive: boolean = true;
  private isTrafficActive: boolean = true;
  private isPedestriansActive: boolean = true;
  private isEnvAnimationActive: boolean = true;
  private simSpeedMultiplier: number = 1.0;
  private isEcoMode: boolean = false;
  private isNight: boolean = false;
  private qualityLevel: 'low' | 'medium' | 'high' = 'medium';

  private vehicles: VehicleEntity[] = [];
  private pedestrians: PedestrianEntity[] = [];
  private lakeMesh: THREE.Mesh | null = null;
  private streetPointLights: THREE.PointLight[] = [];

  constructor(options: LivingWorldOptions) {
    this.materials = options.materials;
    this.isSoftwareGl = !!options.isSoftwareGl;
    this.group.name = 'LivingWorldSimulation';

    this.group.add(this.vehicleGroup);
    this.group.add(this.pedestrianGroup);

    this.initVehicles();
    this.initPedestrians();
    this.initStreetlights();
  }

  public setLakeMesh(mesh: THREE.Mesh) {
    this.lakeMesh = mesh;
  }

  // ---------------------------------------------------------------------------
  // 1. VEHICLE SIMULATION FLEET (7 Distinct Procedural Vehicles)
  // ---------------------------------------------------------------------------
  private initVehicles() {
    // 1. Silver Electric Sedan (Main East-West Boulevard Loop)
    const sedanPath: Waypoint[] = [
      { x: -36, z: 2.0, speed: 7.2 },
      { x: -16, z: 2.0, speed: 4.8, yieldDuration: 1.2 }, // stops safely at Town Center zebra crosswalk
      { x: -5, z: 2.0, speed: 5.0 },
      { x: 18, z: 2.0, speed: 7.2 },
      { x: 38, z: 2.0, speed: 4.2, yieldDuration: 0.8 }, // brief turn yield at East End
      // Turnaround loop at East End
      { x: 40, z: 0.0, speed: 3.8 },
      { x: 38, z: -2.0, speed: 4.5 },
      // Westbound lane
      { x: 18, z: -2.0, speed: 7.2 },
      { x: -5, z: -2.0, speed: 5.0 },
      { x: -16, z: -2.0, speed: 4.8, yieldDuration: 1.0 }, // stops at westbound crosswalk
      { x: -36, z: -2.0, speed: 7.2 },
      // Turnaround loop at West End
      { x: -38, z: 0.0, speed: 3.8 },
    ];
    this.createVehicle(sedanPath, this.materials.carPaintWhite, 'sedan', 0.85);

    // 2. Cyan City Eco Bus (North-South Boulevard Transit Loop)
    const busPath: Waypoint[] = [
      { x: -3.2, z: -24, speed: 5.0 },
      { x: -3.2, z: -4, speed: 3.6, yieldDuration: 2.2 }, // transit passenger stop near civic plaza
      { x: -3.2, z: 8, speed: 5.2 },
      { x: -3.2, z: 32, speed: 5.2 },
      { x: -3.2, z: 52, speed: 3.5, yieldDuration: 2.0 }, // residential north neighborhood passenger terminus
      // Turn loop
      { x: -5.0, z: 54, speed: 2.8 },
      { x: -6.8, z: 52, speed: 3.5 },
      // Southbound lane
      { x: -6.8, z: 32, speed: 5.2 },
      { x: -6.8, z: 8, speed: 5.2 },
      { x: -6.8, z: -4, speed: 3.6, yieldDuration: 2.0 }, // southbound civic stop
      { x: -6.8, z: -24, speed: 5.0 },
      // South loop
      { x: -5.0, z: -26, speed: 2.8 },
    ];
    this.createVehicle(busPath, this.materials.carPaintBlue, 'bus', 1.15);

    // 3. Crimson Compact Hatchback (Residential Cul-de-sac & Roundabout loop)
    const hatchPath: Waypoint[] = [
      { x: -48, z: 38.5, speed: 5.8 },
      { x: -28, z: 38.5, speed: 5.8 },
      { x: -12, z: 38.5, speed: 4.2 },
      // Curve south along neighborhood connector
      { x: -6.8, z: 26, speed: 4.8 },
      { x: -6.8, z: 10, speed: 4.5 },
      { x: -10, z: 3.0, speed: 3.5, yieldDuration: 1.2 }, // yield at roundabout entry stop line
      // Curve through roundabout perimeter
      { x: -12, z: -1.8, speed: 4.2 },
      { x: -6.8, z: -2.0, speed: 4.8 },
      // Return northbound
      { x: -3.2, z: 10, speed: 4.8 },
      { x: -3.2, z: 26, speed: 4.8 },
      { x: -10, z: 41.5, speed: 4.2 },
      { x: -28, z: 41.5, speed: 5.8 },
      { x: -48, z: 41.5, speed: 3.8 },
      { x: -50, z: 40.0, speed: 2.8 },
    ];
    this.createVehicle(hatchPath, this.materials.carPaintRed, 'hatchback', 0.78);

    // 4. Amber Delivery Van (Town Center Commercial Delivery Route)
    const vanPath: Waypoint[] = [
      { x: -26, z: -2.0, speed: 5.2 },
      { x: -18, z: -2.0, speed: 3.8 },
      { x: -14, z: 4.0, speed: 3.0, yieldDuration: 2.6 }, // curbside delivery loading stop outside shops
      { x: -14, z: 12.0, speed: 4.5 },
      { x: -22, z: 12.0, speed: 4.8 },
      { x: -32, z: 12.0, speed: 4.8 },
      { x: -34, z: 4.0, speed: 3.8 },
      { x: -34, z: -2.0, speed: 3.8 },
    ];
    this.createVehicle(vanPath, this.materials.sportCourtOrange, 'van', 0.95);

    // 5. Dark Slate Modern Crossover SUV (Lake Shore Scenic Drive)
    const suvPath: Waypoint[] = [
      { x: -22, z: -26.5, speed: 6.2 },
      { x: -6, z: -26.5, speed: 6.2 },
      { x: 10, z: -26.5, speed: 6.2 },
      { x: 22, z: -26.5, speed: 3.8, yieldDuration: 1.5 }, // lakeside scenic pullover stop
      // Turn loop
      { x: 24, z: -28.0, speed: 3.2 },
      { x: 22, z: -29.5, speed: 3.8 },
      { x: 10, z: -29.5, speed: 6.2 },
      { x: -6, z: -29.5, speed: 6.2 },
      { x: -22, z: -29.5, speed: 3.8 },
      { x: -24, z: -28.0, speed: 3.2 },
    ];
    this.createVehicle(suvPath, this.materials.modernDarkSlate, 'suv', 0.9);

    // 6. Emergency Healthcare Ambulance (Medical Clinic Route with Flashing Beacons)
    const ambulancePath: Waypoint[] = [
      { x: -26, z: 16.0, speed: 3.5, yieldDuration: 2.0 }, // Clinic emergency bay drop-off
      { x: -18, z: 16.0, speed: 5.5 },
      { x: -6.8, z: 12.0, speed: 6.5 },
      { x: -6.8, z: 2.0, speed: 5.0 },
      { x: -2.0, z: 2.0, speed: 6.5 },
      { x: 20.0, z: 2.0, speed: 7.5 },
      { x: 34.0, z: 2.0, speed: 4.5, yieldDuration: 1.0 }, // Central Park east junction check
      { x: 34.0, z: -2.0, speed: 4.5 },
      { x: 20.0, z: -2.0, speed: 7.5 },
      { x: -2.0, z: -2.0, speed: 6.5 },
      { x: -6.8, z: -2.0, speed: 5.0 },
      { x: -16.0, z: 2.0, speed: 5.5 },
      { x: -26.0, z: 10.0, speed: 4.5 },
    ];
    this.createVehicle(ambulancePath, this.materials.carPaintWhite, 'ambulance', 0.92);

    // 7. Emerald Compact Hybrid (Residential North Avenue & Civic Loop)
    const hybridPath: Waypoint[] = [
      { x: -42, z: 58.0, speed: 5.5 },
      { x: -20, z: 58.0, speed: 5.5 },
      { x: -3.2, z: 50.0, speed: 4.2 },
      { x: -3.2, z: 20.0, speed: 5.5 },
      { x: -3.2, z: 2.0, speed: 4.5 },
      { x: -12.0, z: 2.0, speed: 4.5 },
      { x: -28.0, z: 2.0, speed: 5.5 },
      { x: -36.0, z: 2.0, speed: 4.0 },
      { x: -36.0, z: 14.0, speed: 4.5 },
      { x: -36.0, z: 38.0, speed: 5.0 },
      { x: -42, z: 54.0, speed: 4.0 },
    ];
    this.createVehicle(hybridPath, this.materials.carPaintEmerald, 'hybrid', 0.82);
  }

  private createVehicle(
    path: Waypoint[],
    paintMaterial: THREE.Material,
    type: 'sedan' | 'bus' | 'hatchback' | 'van' | 'suv' | 'ambulance' | 'hybrid',
    scale: number
  ) {
    const vGroup = new THREE.Group();
    vGroup.position.set(path[0].x, 0.08, path[0].z);

    const wheels: THREE.Mesh[] = [];
    const headlights: THREE.Mesh[] = [];
    const taillights: THREE.Mesh[] = [];
    let leftSignals: TurnSignalPair | null = null;
    let rightSignals: TurnSignalPair | null = null;
    let emergencyBeacons: { red: THREE.Mesh; blue: THREE.Mesh } | undefined;

    const isBus = type === 'bus';
    const isVan = type === 'van';
    const isAmbulance = type === 'ambulance';

    const length = isBus ? 7.6 : isVan || isAmbulance ? 5.0 : 4.2;
    const width = isBus ? 2.4 : isVan || isAmbulance ? 2.1 : 1.95;
    const height = isBus ? 2.3 : isVan || isAmbulance ? 2.0 : 1.35;
    const wheelRadius = isBus ? 0.44 : 0.35;

    // 1. Lower Chassis / Main Body
    const bodyGeo = new THREE.BoxGeometry(width, height * 0.48, length);
    const body = new THREE.Mesh(bodyGeo, paintMaterial);
    body.position.y = wheelRadius + height * 0.24;
    body.castShadow = !this.isSoftwareGl;
    body.receiveShadow = true;
    vGroup.add(body);

    // Ambulance Red Stripe / Decal
    if (isAmbulance) {
      const stripeGeo = new THREE.BoxGeometry(width * 1.01, height * 0.14, length * 0.85);
      const stripe = new THREE.Mesh(stripeGeo, this.materials.medicalCrossRed);
      stripe.position.set(0, body.position.y, 0);
      vGroup.add(stripe);

      // Medical cross emblem on side
      const crossVertGeo = new THREE.BoxGeometry(width * 1.02, 0.38, 0.12);
      const crossVert = new THREE.Mesh(crossVertGeo, this.materials.medicalCrossRed);
      crossVert.position.set(0, body.position.y + 0.1, -0.4);
      vGroup.add(crossVert);

      const crossHorizGeo = new THREE.BoxGeometry(width * 1.02, 0.12, 0.38);
      const crossHoriz = new THREE.Mesh(crossHorizGeo, this.materials.medicalCrossRed);
      crossHoriz.position.set(0, body.position.y + 0.1, -0.4);
      vGroup.add(crossHoriz);
    }

    // 2. Cabin / Glass Enclosure
    const cabinLength = isBus ? length * 0.92 : isVan || isAmbulance ? length * 0.6 : length * 0.62;
    const cabinWidth = width * 0.92;
    const cabinHeight = height * 0.52;
    const cabinGeo = new THREE.BoxGeometry(cabinWidth, cabinHeight, cabinLength);
    const cabin = new THREE.Mesh(cabinGeo, this.materials.carGlass);
    const cabinZOffset = isBus ? 0 : isVan || isAmbulance ? 0.55 : -0.2;
    cabin.position.set(0, wheelRadius + height * 0.48 + cabinHeight * 0.5, cabinZOffset);
    cabin.castShadow = !this.isSoftwareGl;
    vGroup.add(cabin);

    // 3. Roof Cap
    const roofGeo = new THREE.BoxGeometry(cabinWidth * 0.98, 0.08, cabinLength * 0.98);
    const roof = new THREE.Mesh(roofGeo, paintMaterial);
    roof.position.set(0, cabin.position.y + cabinHeight * 0.5 + 0.04, cabinZOffset);
    vGroup.add(roof);

    // Emergency Flashing Beacon Bar (Ambulance only)
    if (isAmbulance) {
      const barBaseGeo = new THREE.BoxGeometry(width * 0.7, 0.1, 0.3);
      const barBase = new THREE.Mesh(barBaseGeo, this.materials.metalSteel);
      barBase.position.set(0, roof.position.y + 0.08, cabinZOffset);
      vGroup.add(barBase);

      const redBeaconGeo = new THREE.BoxGeometry(width * 0.28, 0.14, 0.24);
      const redBeacon = new THREE.Mesh(redBeaconGeo, this.materials.emergencyRedGlow);
      redBeacon.position.set(-width * 0.2, roof.position.y + 0.18, cabinZOffset);
      vGroup.add(redBeacon);

      const blueBeaconGeo = new THREE.BoxGeometry(width * 0.28, 0.14, 0.24);
      const blueBeacon = new THREE.Mesh(blueBeaconGeo, this.materials.emergencyBlueGlow);
      blueBeacon.position.set(width * 0.2, roof.position.y + 0.18, cabinZOffset);
      vGroup.add(blueBeacon);

      emergencyBeacons = { red: redBeacon, blue: blueBeacon };
    }

    // 4. Wheels with Rims & Tires
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
    const hlX = width * 0.34;
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
      const tlGeo = new THREE.BoxGeometry(0.34, 0.12, 0.05);
      const tl = new THREE.Mesh(tlGeo, this.materials.taillightGlow);
      tl.position.set(tx, hlY, tlZ);
      vGroup.add(tl);
      taillights.push(tl);
    }

    // 7. Amber Turn Signal Indicators (Corner blinkers)
    const sigX = width * 0.46;
    const sigY = hlY;
    const sigFrontZ = length * 0.495;
    const sigRearZ = -length * 0.495;
    const sigGeo = new THREE.BoxGeometry(0.12, 0.09, 0.06);

    const lf = new THREE.Mesh(sigGeo, this.materials.turnSignalGlow);
    lf.position.set(-sigX, sigY, sigFrontZ);
    lf.visible = false;
    vGroup.add(lf);

    const lr = new THREE.Mesh(sigGeo, this.materials.turnSignalGlow);
    lr.position.set(-sigX, sigY, sigRearZ);
    lr.visible = false;
    vGroup.add(lr);

    const rf = new THREE.Mesh(sigGeo, this.materials.turnSignalGlow);
    rf.position.set(sigX, sigY, sigFrontZ);
    rf.visible = false;
    vGroup.add(rf);

    const rr = new THREE.Mesh(sigGeo, this.materials.turnSignalGlow);
    rr.position.set(sigX, sigY, sigRearZ);
    rr.visible = false;
    vGroup.add(rr);

    leftSignals = { front: lf, rear: lr };
    rightSignals = { front: rf, rear: rr };

    vGroup.scale.set(scale, scale, scale);
    this.vehicleGroup.add(vGroup);

    this.vehicles.push({
      group: vGroup,
      wheels,
      headlights,
      taillights,
      leftSignals,
      rightSignals,
      emergencyBeacons,
      path,
      currentSegment: 0,
      segmentProgress: 0,
      baseSpeed: path[0].speed || 6.0,
      heading: 0,
      wheelRadius,
      yieldTimer: 0,
      isYielding: false,
      actualSpeed: path[0].speed || 6.0,
      type,
      isBrakingForVehicle: false,
    });
  }

  // ---------------------------------------------------------------------------
  // 2. PEDESTRIAN SIMULATION (10 Articulated Humanoids across 5 Districts)
  // ---------------------------------------------------------------------------
  private initPedestrians() {
    // 1 & 2: Strolling around Town Center Plaza Pavers & Café
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

    // 3 & 4: Central Park Walking Paths & Fountain
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
      { x: -14, z: -2.0, yieldDuration: 1.5 }, // look left/right before stepping onto road
      { x: -14, z: 5.5 },
      { x: -12, z: 5.5 },
      { x: -12, z: 2.0, yieldDuration: 1.5 },
      { x: -12, z: -5.5 },
    ];
    this.createPedestrian(p5Path, this.materials.pedestrianShirt2, 1.2, 0.4);

    const p6Path: Waypoint[] = [
      { x: 2, z: 5.5 },
      { x: 2, z: 2.0, yieldDuration: 1.2 },
      { x: 2, z: -5.5 },
      { x: 0, z: -5.5 },
      { x: 0, z: -2.0, yieldDuration: 1.2 },
      { x: 0, z: 5.5 },
    ];
    this.createPedestrian(p6Path, this.materials.pedestrianShirt3, 1.15, 1.9);

    // 7 & 8: Botanical Garden Conservatory & Floral Parterres
    const p7Path: Waypoint[] = [
      { x: 24, z: 28 },
      { x: 32, z: 28 },
      { x: 32, z: 40 },
      { x: 24, z: 40 },
    ];
    this.createPedestrian(p7Path, this.materials.pedestrianShirt1, 1.2, 3.0);

    const p8Path: Waypoint[] = [
      { x: 26, z: 32 },
      { x: 34, z: 32 },
      { x: 34, z: 36 },
      { x: 26, z: 36 },
    ];
    this.createPedestrian(p8Path, this.materials.pedestrianShirt3, 1.22, 1.1);

    // 9: Lake District Promenade Boardwalk
    const p9Path: Waypoint[] = [
      { x: -16, z: -24 },
      { x: -2, z: -24 },
      { x: 14, z: -24 },
      { x: -2, z: -24 },
    ];
    this.createPedestrian(p9Path, this.materials.pedestrianShirt2, 1.3, 0.6);

    // 10: Residential District Sidewalk
    const p10Path: Waypoint[] = [
      { x: -44, z: 44 },
      { x: -26, z: 44 },
      { x: -14, z: 44 },
      { x: -26, z: 44 },
    ];
    this.createPedestrian(p10Path, this.materials.pedestrianShirt1, 1.28, 2.5);
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

    this.pedestrianGroup.add(pedGroup);

    this.pedestrians.push({
      group: pedGroup,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      torso,
      head,
      path,
      currentSegment: 0,
      segmentProgress: startOffset % 1,
      speed,
      walkCycle: startOffset * 4,
      pauseTimer: 0,
      isPausing: false,
    });
  }

  // ---------------------------------------------------------------------------
  // 3. STREETLIGHT GLOW & WARM POINT LIGHTS
  // ---------------------------------------------------------------------------
  private initStreetlights() {
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
  // 4. SIMULATION CONTROLS & TOGGLES
  // ---------------------------------------------------------------------------
  public setActive(active: boolean) {
    this.isActive = active;
  }

  public getActive(): boolean {
    return this.isActive;
  }

  public setTrafficActive(active: boolean) {
    this.isTrafficActive = active;
    this.vehicleGroup.visible = active;
  }

  public getTrafficActive(): boolean {
    return this.isTrafficActive;
  }

  public setPedestriansActive(active: boolean) {
    this.isPedestriansActive = active;
    this.pedestrianGroup.visible = active;
  }

  public getPedestriansActive(): boolean {
    return this.isPedestriansActive;
  }

  public setEnvironmentAnimationActive(active: boolean) {
    this.isEnvAnimationActive = active;
  }

  public getEnvironmentAnimationActive(): boolean {
    return this.isEnvAnimationActive;
  }

  public setSimulationSpeed(speed: number) {
    this.simSpeedMultiplier = Math.max(0.1, Math.min(3.0, speed));
  }

  public getSimulationSpeed(): number {
    return this.simSpeedMultiplier;
  }

  public setEcoMode(eco: boolean) {
    this.isEcoMode = eco;
  }

  public setQuality(quality: 'low' | 'medium' | 'high') {
    this.qualityLevel = quality;
    const isLow = quality === 'low';
    this.streetPointLights.forEach((light) => {
      light.visible = !isLow;
    });
  }

  public resetSimulation() {
    // Reset all vehicles to origin of their paths
    for (let i = 0; i < this.vehicles.length; i++) {
      const v = this.vehicles[i];
      v.currentSegment = 0;
      v.segmentProgress = 0;
      v.yieldTimer = 0;
      v.isYielding = false;
      v.actualSpeed = v.baseSpeed;
      v.isBrakingForVehicle = false;
      v.heading = 0;
      v.group.position.set(v.path[0].x, 0.08, v.path[0].z);
      v.group.rotation.y = 0;
      if (v.leftSignals) {
        v.leftSignals.front.visible = false;
        v.leftSignals.rear.visible = false;
      }
      if (v.rightSignals) {
        v.rightSignals.front.visible = false;
        v.rightSignals.rear.visible = false;
      }
    }

    // Reset pedestrians
    for (let j = 0; j < this.pedestrians.length; j++) {
      const p = this.pedestrians[j];
      p.currentSegment = 0;
      p.segmentProgress = 0;
      p.pauseTimer = 0;
      p.isPausing = false;
      p.walkCycle = 0;
      p.group.position.set(p.path[0].x, 0.22, p.path[0].z);
      p.leftLeg.rotation.x = 0;
      p.rightLeg.rotation.x = 0;
      p.leftArm.rotation.x = 0;
      p.rightArm.rotation.x = 0;
      p.head.rotation.y = 0;
    }
  }

  public setNightMode(isNight: boolean | number) {
    const factor = typeof isNight === 'number' ? Math.max(0, Math.min(1, isNight)) : isNight ? 1 : 0;
    this.isNight = factor > 0.4;
    const targetIntensity = this.qualityLevel === 'low' ? 0 : factor * 1.8;
    this.streetPointLights.forEach((light) => {
      light.intensity = targetIntensity;
    });

    // Make headlights brighter at night
    const hlScale = this.isNight ? 1.4 : 1.0;
    for (const v of this.vehicles) {
      for (const hl of v.headlights) {
        hl.scale.set(hlScale, hlScale, hlScale);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 5. UPDATE LOOP (Zero Per-Frame Allocations)
  // ---------------------------------------------------------------------------
  public update(delta: number, elapsed: number) {
    if (!this.isActive) return;

    const effectiveDt = Math.min(delta, 0.08) * this.simSpeedMultiplier;

    // 1. Update Vehicles (with collision avoidance, yields, turn blinkers & emergency beacons)
    if (this.isTrafficActive) {
      this.updateVehicles(effectiveDt, elapsed);
    }

    // 2. Update Pedestrians (with crosswalk stops & walk cycles)
    if (this.isPedestriansActive) {
      this.updatePedestrians(effectiveDt);
    }

    // 3. Lake Water Movement
    if (this.lakeMesh && this.isEnvAnimationActive && !this.isEcoMode) {
      this.lakeMesh.position.y = -0.18 + Math.sin(elapsed * 1.8) * 0.02;
    }
  }

  private updateVehicles(dt: number, elapsed: number) {
    const vCount = this.vehicles.length;

    for (let i = 0; i < vCount; i++) {
      const v = this.vehicles[i];
      const path = v.path;
      const count = path.length;

      const pA = path[v.currentSegment];
      const nextIdx = (v.currentSegment + 1) % count;
      const pB = path[nextIdx];

      // Emergency Ambulance Flashing Roof Light Bar (Alternating red & blue)
      if (v.emergencyBeacons) {
        const flashPhase = Math.floor(elapsed * 5.0) % 2;
        v.emergencyBeacons.red.visible = flashPhase === 0;
        v.emergencyBeacons.blue.visible = flashPhase === 1;
      }

      // Safe stop / yield at crosswalks, stop lines, or transit stops
      if (v.isYielding) {
        v.yieldTimer -= dt;
        v.actualSpeed = Math.max(0, v.actualSpeed - dt * 8.0); // smooth braking deceleration
        // Taillight brake glow flare
        for (let t = 0; t < v.taillights.length; t++) {
          v.taillights[t].scale.set(1.3, 1.3, 1.3);
        }
        if (v.yieldTimer <= 0) {
          v.isYielding = false;
          v.yieldTimer = 0;
          for (let t = 0; t < v.taillights.length; t++) {
            v.taillights[t].scale.set(1.0, 1.0, 1.0);
          }
        }
        continue;
      }

      // Collision Avoidance / Safe Following Distance Check
      let tooClose = false;
      const myX = v.group.position.x;
      const myZ = v.group.position.z;
      const forwardX = Math.sin(v.heading);
      const forwardZ = Math.cos(v.heading);

      for (let j = 0; j < vCount; j++) {
        if (i === j) continue;
        const other = this.vehicles[j];
        const ox = other.group.position.x - myX;
        const oz = other.group.position.z - myZ;
        const dist = Math.hypot(ox, oz);

        // Check if other vehicle is directly ahead within 6.5m and in the forward cone
        if (dist < 6.5) {
          const dot = (ox * forwardX + oz * forwardZ) / Math.max(0.001, dist);
          if (dot > 0.65) {
            tooClose = true;
            break;
          }
        }
      }

      if (tooClose) {
        v.isBrakingForVehicle = true;
        v.actualSpeed = Math.max(0, v.actualSpeed - dt * 10.0);
        for (let t = 0; t < v.taillights.length; t++) {
          v.taillights[t].scale.set(1.3, 1.3, 1.3);
        }
        continue;
      } else if (v.isBrakingForVehicle) {
        v.isBrakingForVehicle = false;
        for (let t = 0; t < v.taillights.length; t++) {
          v.taillights[t].scale.set(1.0, 1.0, 1.0);
        }
      }

      const dx = pB.x - pA.x;
      const dz = pB.z - pA.z;
      const segLen = Math.hypot(dx, dz);

      if (segLen > 0.001) {
        const targetSpeed = pA.speed || v.baseSpeed;
        // Smooth progressive acceleration up to cruising speed
        v.actualSpeed += (targetSpeed - v.actualSpeed) * Math.min(1.0, dt * 3.2);

        const progressDelta = (v.actualSpeed * dt) / segLen;
        v.segmentProgress += progressDelta;

        if (v.segmentProgress >= 1.0) {
          v.segmentProgress -= 1.0;
          v.currentSegment = nextIdx;

          // Check if reached waypoint has a stop / yield duration
          if (pB.yieldDuration && pB.yieldDuration > 0) {
            v.isYielding = true;
            v.yieldTimer = pB.yieldDuration;
          }
        }

        // Interpolate position along segment
        const curX = pA.x + dx * v.segmentProgress;
        const curZ = pA.z + dz * v.segmentProgress;
        v.group.position.x = curX;
        v.group.position.z = curZ;

        // Calculate heading tangent (vehicle forward direction is +Z)
        const targetHeading = Math.atan2(dx, dz);
        let diff = targetHeading - v.heading;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        v.heading += diff * Math.min(1.0, dt * 6.0);
        v.group.rotation.y = v.heading;

        // Turn Indicator Signal Blinking (Amber corner indicators)
        // If nearing turn (progress > 0.65) or currently turning into a significantly different angle
        const nextSegmentIdx = (v.currentSegment + 1) % count;
        const pC = path[(nextSegmentIdx + 1) % count];
        const nextDx = pC.x - path[nextSegmentIdx].x;
        const nextDz = pC.z - path[nextSegmentIdx].z;
        const nextHeading = Math.atan2(nextDx, nextDz);
        let upcomingTurnAngle = nextHeading - targetHeading;
        while (upcomingTurnAngle < -Math.PI) upcomingTurnAngle += Math.PI * 2;
        while (upcomingTurnAngle > Math.PI) upcomingTurnAngle -= Math.PI * 2;

        const isBlinkingState = Math.floor(elapsed * 3.2) % 2 === 0;

        if (v.leftSignals && v.rightSignals) {
          if (upcomingTurnAngle < -0.35 && v.segmentProgress > 0.65) {
            // Turning Left
            v.leftSignals.front.visible = isBlinkingState;
            v.leftSignals.rear.visible = isBlinkingState;
            v.rightSignals.front.visible = false;
            v.rightSignals.rear.visible = false;
          } else if (upcomingTurnAngle > 0.35 && v.segmentProgress > 0.65) {
            // Turning Right
            v.rightSignals.front.visible = isBlinkingState;
            v.rightSignals.rear.visible = isBlinkingState;
            v.leftSignals.front.visible = false;
            v.leftSignals.rear.visible = false;
          } else {
            v.leftSignals.front.visible = false;
            v.leftSignals.rear.visible = false;
            v.rightSignals.front.visible = false;
            v.rightSignals.rear.visible = false;
          }
        }

        // Spin wheels based on actual travel velocity (w = v / r)
        const wheelRot = (v.actualSpeed * dt) / v.wheelRadius;
        for (let w = 0; w < v.wheels.length; w++) {
          v.wheels[w].rotation.x += wheelRot;
        }
      }
    }
  }

  private updatePedestrians(dt: number) {
    const pCount = this.pedestrians.length;

    for (let j = 0; j < pCount; j++) {
      const p = this.pedestrians[j];
      const path = p.path;
      const count = path.length;

      const pA = path[p.currentSegment];
      const nextIdx = (p.currentSegment + 1) % count;
      const pB = path[nextIdx];

      // Pedestrian pausing at crosswalk or viewpoint
      if (p.isPausing) {
        p.pauseTimer -= dt;
        // Subtle looking around (head yaw sway)
        p.head.rotation.y = Math.sin(p.pauseTimer * 3.0) * 0.45;
        // Stand still
        p.leftLeg.rotation.x = 0;
        p.rightLeg.rotation.x = 0;
        p.leftArm.rotation.x = 0;
        p.rightArm.rotation.x = 0;

        if (p.pauseTimer <= 0) {
          p.isPausing = false;
          p.pauseTimer = 0;
          p.head.rotation.y = 0;
        }
        continue;
      }

      const dx = pB.x - pA.x;
      const dz = pB.z - pA.z;
      const segLen = Math.hypot(dx, dz);

      if (segLen > 0.001) {
        const progressDelta = (p.speed * dt) / segLen;
        p.segmentProgress += progressDelta;

        if (p.segmentProgress >= 1.0) {
          p.segmentProgress -= 1.0;
          p.currentSegment = nextIdx;

          // Check for yield/pause duration at reached waypoint
          if (pB.yieldDuration && pB.yieldDuration > 0) {
            p.isPausing = true;
            p.pauseTimer = pB.yieldDuration;
          }
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
  }

  public dispose() {
    this.vehicles = [];
    this.pedestrians = [];
    this.streetPointLights = [];
  }
}
