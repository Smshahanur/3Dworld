import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { checkObstacleCollision, isPointInDriveableArea } from './collisionSystem';

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
  type: 'sedan' | 'bus' | 'hatchback' | 'van' | 'suv' | 'ambulance' | 'hybrid' | 'truck';
  isBrakingForVehicle: boolean;
  halfLength: number;
  halfWidth: number;
  collisionRadius: number;
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
  private playerVehiclePosition: { x: number; z: number; radius: number } | null = null;

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
  private initVehicles() {
    // 1. Silver Electric Sedan (Inter-District Highway: Modern Village <-> Capital Town)
    const sedanPath: Waypoint[] = [
      { x: -5.0, z: -6.2, speed: 4.5 },
      { x: -1.5, z: -4.5, speed: 4.5 },
      { x: 1.0, z: -2.0, speed: 6.0 },
      { x: 20.0, z: -2.0, speed: 7.5 },
      { x: 34.0, z: -2.0, speed: 7.5 },
      // Cross Bridge 2 (Capital Grand Bridge)
      { x: 45.0, z: -2.0, speed: 7.0 },
      { x: 55.0, z: -2.0, speed: 7.0 },
      // Enter Capital Gateway Highway
      { x: 75.0, z: -2.2, speed: 8.0 },
      { x: 95.0, z: -2.2, speed: 6.5 },
      // Circulate Capital Civic Roundabout (South to East)
      { x: 102.0, z: -7.5, speed: 4.8 },
      { x: 105.0, z: -9.0, speed: 4.8 },
      { x: 112.0, z: -7.0, speed: 4.8 },
      { x: 118.0, z: -2.2, speed: 5.5 },
      // Capital Grand Boulevard East
      { x: 135.0, z: -2.2, speed: 7.5 },
      { x: 155.0, z: -2.2, speed: 4.5, yieldDuration: 1.2 }, // Capital East terminus yield
      // Turnaround loop
      { x: 158.0, z: 0.0, speed: 3.5 },
      { x: 155.0, z: 2.2, speed: 4.5 },
      // Westbound on Capital Grand Boulevard
      { x: 135.0, z: 2.2, speed: 7.5 },
      { x: 118.0, z: 2.2, speed: 5.5 },
      // Circulate Capital Roundabout (North to West)
      { x: 112.0, z: 7.0, speed: 4.8 },
      { x: 105.0, z: 9.0, speed: 4.8 },
      { x: 98.0, z: 5.0, speed: 4.8 },
      { x: 95.0, z: 2.2, speed: 6.5 },
      // Capital Gateway Highway Westbound
      { x: 75.0, z: 2.2, speed: 8.0 },
      { x: 60.0, z: 2.2, speed: 7.0 },
      // Cross Bridge 2 Westbound
      { x: 50.0, z: 2.0, speed: 7.0 },
      { x: 38.0, z: 2.0, speed: 7.0 },
      // Modern Village East Boulevard Westbound
      { x: 20.0, z: 2.0, speed: 7.5 },
      { x: 1.0, z: 2.0, speed: 5.5 },
      // Modern Roundabout North to South arc
      { x: -1.5, z: 4.5, speed: 4.2 },
      { x: -5.0, z: 6.2, speed: 4.2 },
      { x: -8.5, z: 4.5, speed: 4.2 },
      { x: -11.0, z: 2.0, speed: 4.5 },
      { x: -11.0, z: -2.0, speed: 4.5 },
      { x: -8.5, z: -4.5, speed: 4.2 },
    ];
    this.createVehicle(sedanPath, this.materials.carPaintWhite, 'sedan', 0.85);

    // 2. Cyan City Eco Bus (Inter-District Transit Line: Capital Bus Terminal <-> Modern Village)
    const busPath: Waypoint[] = [
      { x: 88.0, z: -16.0, speed: 3.5, yieldDuration: 2.5 }, // Capital Transit Terminal Bay 1
      { x: 88.0, z: -28.0, speed: 4.5 },
      { x: 98.0, z: -28.0, speed: 5.0 },
      { x: 105.0, z: -28.0, speed: 4.5 },
      { x: 105.0, z: -14.0, speed: 5.0 },
      // Capital Roundabout to Highway
      { x: 102.0, z: -7.5, speed: 4.2 },
      { x: 95.0, z: -2.2, speed: 5.5 },
      { x: 75.0, z: -2.2, speed: 6.5 },
      // Bridge 2 Westbound
      { x: 55.0, z: -2.0, speed: 6.0 },
      { x: 45.0, z: -2.0, speed: 6.0 },
      // Modern Boulevard Westbound
      { x: 20.0, z: -2.0, speed: 6.5 },
      { x: 1.0, z: -2.0, speed: 5.0 },
      // Modern Roundabout to North Boulevard
      { x: -1.5, z: -4.5, speed: 4.0 },
      { x: -5.0, z: -6.2, speed: 4.0 },
      { x: -8.5, z: -4.5, speed: 4.0 },
      { x: -11.0, z: 0.0, speed: 4.0 },
      // Northbound on Modern Boulevard
      { x: -6.8, z: 10.0, speed: 5.0 },
      { x: -6.8, z: 30.0, speed: 5.2 },
      { x: -6.8, z: 52.0, speed: 3.5, yieldDuration: 2.0 }, // Modern Residential passenger stop
      // Turn loop at North end
      { x: -5.0, z: 54.0, speed: 2.8 },
      { x: -3.2, z: 52.0, speed: 3.5 },
      // Southbound on Modern Boulevard
      { x: -3.2, z: 30.0, speed: 5.2 },
      { x: -3.2, z: 10.0, speed: 5.0 },
      // Modern Roundabout to East Boulevard
      { x: -1.5, z: 4.5, speed: 4.0 },
      { x: 1.0, z: 2.0, speed: 5.0 },
      { x: 20.0, z: 2.0, speed: 6.5 },
      { x: 38.0, z: 2.0, speed: 6.5 },
      // Bridge 2 Eastbound
      { x: 50.0, z: 2.2, speed: 6.0 },
      { x: 60.0, z: 2.2, speed: 6.0 },
      // Capital Gateway Highway
      { x: 75.0, z: 2.2, speed: 6.5 },
      { x: 95.0, z: 2.2, speed: 5.5 },
      // Capital Roundabout North arc to South Connector
      { x: 105.0, z: 9.0, speed: 4.2 },
      { x: 112.0, z: 7.0, speed: 4.2 },
      { x: 114.0, z: 0.0, speed: 4.2 },
      { x: 105.0, z: -14.0, speed: 5.0 },
      { x: 105.0, z: -28.0, speed: 4.5 },
      { x: 98.0, z: -28.0, speed: 4.5 },
      { x: 88.0, z: -28.0, speed: 4.0 },
      { x: 88.0, z: -16.0, speed: 3.5 },
    ];
    this.createVehicle(busPath, this.materials.carPaintBlue, 'bus', 1.15);

    // 3. Crimson Compact Hatchback (Modern Residential District Loop)
    const hatchPath: Waypoint[] = [
      { x: -50.0, z: 32.0, speed: 4.0 },
      { x: -28.0, z: 32.0, speed: 5.5 },
      { x: -10.0, z: 32.0, speed: 4.2 },
      { x: -6.8, z: 26.0, speed: 4.8 },
      { x: -6.8, z: 10.0, speed: 4.5 },
      { x: -8.5, z: 4.5, speed: 3.5, yieldDuration: 1.0 },
      { x: -11.2, z: 0.0, speed: 4.0 },
      { x: -8.5, z: -4.5, speed: 4.2 },
      { x: -5.0, z: -6.2, speed: 4.2 },
      { x: -1.5, z: -4.5, speed: 4.2 },
      { x: 1.2, z: 0.0, speed: 4.0 },
      { x: -1.5, z: 4.5, speed: 4.2 },
      { x: -3.2, z: 10.0, speed: 4.8 },
      { x: -3.2, z: 30.0, speed: 4.8 },
      { x: -3.2, z: 58.0, speed: 4.8 },
      { x: -10.0, z: 62.0, speed: 4.2 },
      { x: -28.0, z: 62.0, speed: 5.5 },
      { x: -50.0, z: 62.0, speed: 4.0 },
      { x: -50.0, z: 47.0, speed: 4.5 },
    ];
    this.createVehicle(hatchPath, this.materials.carPaintRed, 'hatchback', 0.78);

    // 4. Amber Delivery Van (Town Center Lake Parking Dock <-> Capital Logistics)
    const vanPath: Waypoint[] = [
      { x: -21.5, z: -20.5, speed: 3.0, yieldDuration: 2.0 }, // Modern Town Center delivery dock
      { x: -21.5, z: -26.0, speed: 3.5 },
      { x: -10.0, z: -26.0, speed: 4.5 },
      { x: -5.0, z: -26.0, speed: 5.0 },
      { x: -5.0, z: -15.0, speed: 5.0 },
      { x: -5.0, z: -7.0, speed: 4.5 },
      { x: -1.5, z: -4.5, speed: 4.0 },
      { x: 1.2, z: 0.0, speed: 4.0 },
      { x: 20.0, z: 2.0, speed: 6.0 },
      // Cross Bridge 2 to Capital
      { x: 50.0, z: 2.2, speed: 6.0 },
      { x: 75.0, z: 2.2, speed: 6.5 },
      { x: 95.0, z: 2.2, speed: 5.5 },
      // Capital Roundabout South to Terminal bay
      { x: 105.0, z: 9.0, speed: 4.0 },
      { x: 112.0, z: 7.0, speed: 4.0 },
      { x: 105.0, z: -14.0, speed: 4.5 },
      { x: 105.0, z: -28.0, speed: 4.5 },
      { x: 88.0, z: -28.0, speed: 4.0 },
      { x: 88.0, z: -16.0, speed: 3.5, yieldDuration: 2.0 }, // Capital logistics bay
      { x: 88.0, z: -28.0, speed: 4.0 },
      { x: 98.0, z: -28.0, speed: 4.5 },
      { x: 105.0, z: -28.0, speed: 4.5 },
      { x: 105.0, z: -14.0, speed: 5.0 },
      { x: 95.0, z: -2.2, speed: 5.5 },
      // Return across Bridge 2
      { x: 55.0, z: -2.0, speed: 6.0 },
      { x: 20.0, z: -2.0, speed: 6.0 },
      { x: 1.0, z: -2.0, speed: 5.0 },
      { x: -1.5, z: -4.5, speed: 4.0 },
      { x: -5.0, z: -6.2, speed: 4.0 },
      { x: -5.0, z: -15.0, speed: 5.0 },
      { x: -5.0, z: -26.0, speed: 5.0 },
      { x: -10.0, z: -26.0, speed: 4.5 },
      { x: -21.5, z: -26.0, speed: 3.5 },
    ];
    this.createVehicle(vanPath, this.materials.sportCourtOrange, 'van', 0.95);

    // 5. Dark Slate Modern Crossover SUV (Lake Shore Scenic Drive)
    const suvPath: Waypoint[] = [
      { x: -22.0, z: -27.5, speed: 6.0 },
      { x: -6.0, z: -27.5, speed: 6.0 },
      { x: 10.0, z: -27.5, speed: 6.0 },
      { x: 22.0, z: -27.5, speed: 3.8, yieldDuration: 1.5 },
      { x: 24.0, z: -29.0, speed: 3.2 },
      { x: 22.0, z: -30.5, speed: 3.8 },
      { x: 10.0, z: -30.5, speed: 6.0 },
      { x: -6.0, z: -30.5, speed: 6.0 },
      { x: -22.0, z: -30.5, speed: 3.8 },
      { x: -24.0, z: -29.0, speed: 3.2 },
    ];
    this.createVehicle(suvPath, this.materials.modernDarkSlate, 'suv', 0.9);

    // 6. Emergency Healthcare Ambulance (Regional Hospital <-> Modern Clinic <-> Rural Dispensary)
    const ambulancePath: Waypoint[] = [
      { x: 88.0, z: 20.0, speed: 3.5, yieldDuration: 2.0 }, // Capital General Hospital ER bay
      { x: 88.0, z: 34.0, speed: 5.5 },
      { x: 102.0, z: 34.0, speed: 5.5 },
      { x: 105.0, z: 25.0, speed: 6.0 },
      { x: 105.0, z: 12.0, speed: 6.0 },
      { x: 98.0, z: 5.0, speed: 5.5 },
      { x: 95.0, z: 2.2, speed: 6.5 },
      // Cross Bridge 2 Westbound
      { x: 50.0, z: 2.0, speed: 7.0 },
      { x: 38.0, z: 2.0, speed: 7.0 },
      { x: 18.0, z: 2.0, speed: 7.0 },
      { x: 1.0, z: 2.0, speed: 5.5 },
      // Modern Village Roundabout
      { x: -5.0, z: 6.2, speed: 4.5 },
      { x: -8.5, z: 4.5, speed: 4.5 },
      // Modern Clinic Emergency Bay Drop-off (Clear roadway corridor, outside building)
      { x: -6.8, z: 2.0, speed: 5.5 },
      { x: -20.0, z: 2.0, speed: 5.0 },
      { x: -26.0, z: 2.0, speed: 3.5, yieldDuration: 2.0 }, // Modern clinic boulevard stop
      { x: -36.0, z: 2.0, speed: 6.0 },
      // West River Bridge 1
      { x: -44.0, z: 2.0, speed: 6.0 },
      { x: -54.0, z: 1.8, speed: 6.0 },
      { x: -64.0, z: 1.8, speed: 6.0 },
      // Rural Village Main Road
      { x: -85.0, z: 1.8, speed: 6.5 },
      { x: -110.0, z: 1.8, speed: 5.5 },
      { x: -110.0, z: -25.0, speed: 5.0 },
      { x: -110.0, z: -46.0, speed: 4.0 },
      { x: -95.0, z: -46.0, speed: 3.2, yieldDuration: 2.0 }, // Rural Dispensary drop-off
      { x: -95.0, z: -48.0, speed: 3.5 },
      { x: -110.0, z: -48.0, speed: 4.0 },
      { x: -110.0, z: 0.0, speed: 5.0 },
      // Return East on Rural Main Road
      { x: -85.0, z: -1.8, speed: 6.5 },
      // Bridge 1 Eastbound
      { x: -64.0, z: -1.8, speed: 6.0 },
      { x: -54.0, z: -1.8, speed: 6.0 },
      { x: -44.0, z: -2.0, speed: 6.0 },
      // Modern Village Westbound
      { x: -36.0, z: -2.0, speed: 6.5 },
      { x: -16.0, z: -2.0, speed: 5.5 },
      { x: -11.0, z: -2.0, speed: 5.0 },
      { x: -5.0, z: -6.2, speed: 4.5 },
      { x: -1.5, z: -4.5, speed: 4.5 },
      { x: 1.0, z: -2.0, speed: 6.0 },
      { x: 20.0, z: -2.0, speed: 7.0 },
      { x: 38.0, z: -2.0, speed: 7.0 },
      // Bridge 2 Eastbound to Capital Hospital
      { x: 50.0, z: -2.2, speed: 7.0 },
      { x: 75.0, z: -2.2, speed: 7.5 },
      { x: 95.0, z: -2.2, speed: 6.0 },
      { x: 102.0, z: -7.5, speed: 4.5 },
      { x: 105.0, z: -9.0, speed: 4.5 },
      { x: 114.0, z: 0.0, speed: 4.5 },
      { x: 105.0, z: 12.0, speed: 5.5 },
      { x: 105.0, z: 34.0, speed: 5.5 },
      { x: 88.0, z: 34.0, speed: 5.0 },
    ];
    this.createVehicle(ambulancePath, this.materials.carPaintWhite, 'ambulance', 0.92);

    // 7. Emerald Compact Hybrid (Capital North University & High-Rise Loop)
    const hybridPath: Waypoint[] = [
      { x: 88.0, z: 34.0, speed: 5.5 },
      { x: 115.0, z: 34.0, speed: 5.5 },
      { x: 145.0, z: 34.0, speed: 5.5 },
      { x: 156.0, z: 34.0, speed: 4.2 },
      { x: 156.0, z: 10.0, speed: 5.0 },
      { x: 156.0, z: -2.2, speed: 4.5 },
      { x: 135.0, z: -2.2, speed: 6.0 },
      { x: 118.0, z: -2.2, speed: 5.5 },
      { x: 112.0, z: 7.0, speed: 4.5 },
      { x: 105.0, z: 9.0, speed: 4.5 },
      { x: 105.0, z: 25.0, speed: 5.5 },
      { x: 105.0, z: 34.0, speed: 5.5 },
      { x: 88.0, z: 34.0, speed: 5.0 },
    ];
    this.createVehicle(hybridPath, this.materials.carPaintEmerald, 'hybrid', 0.82);

    // 8. Rural Farm Utility Truck (District 1: Rural Village Main Road & Farmsteads)
    const truckPath: Waypoint[] = [
      { x: -140.0, z: 50.0, speed: 4.2, yieldDuration: 2.0 }, // Farmstead Barn loading point
      { x: -120.0, z: 50.0, speed: 4.8 },
      { x: -110.0, z: 50.0, speed: 4.5 },
      { x: -110.0, z: 30.0, speed: 5.0 },
      { x: -110.0, z: 10.0, speed: 4.5 },
      // Merge onto Rural Main Dirt Road Westbound
      { x: -115.0, z: 1.8, speed: 5.5 },
      { x: -135.0, z: 1.8, speed: 5.5 },
      { x: -155.0, z: 1.8, speed: 4.0, yieldDuration: 1.5 }, // West turnabout stop
      { x: -158.0, z: 0.0, speed: 3.2 },
      { x: -155.0, z: -1.8, speed: 4.0 },
      // Eastbound on Main Dirt Road
      { x: -135.0, z: -1.8, speed: 5.5 },
      { x: -115.0, z: -1.8, speed: 5.0 },
      // Turn South by the Tea Stall & Village Well
      { x: -110.0, z: -10.0, speed: 4.5 },
      { x: -110.0, z: -30.0, speed: 4.5 },
      { x: -110.0, z: -46.0, speed: 3.8 },
      { x: -125.0, z: -46.0, speed: 3.2, yieldDuration: 2.0 }, // Rural School turnaround
      { x: -135.0, z: -46.0, speed: 3.5 },
      { x: -110.0, z: -46.0, speed: 4.0 },
      { x: -110.0, z: 0.0, speed: 4.5 },
      { x: -110.0, z: 20.0, speed: 5.0 },
      { x: -110.0, z: 50.0, speed: 4.5 },
      { x: -125.0, z: 50.0, speed: 4.5 },
    ];
    this.createVehicle(truckPath, this.materials.timberBench, 'truck', 1.0);

    // Startup Route & Spawn Validation: Ensure all routes avoid static obstacles and stay in driveable areas
    for (let idx = 0; idx < this.vehicles.length; idx++) {
      const v = this.vehicles[idx];
      for (let wpIdx = 0; wpIdx < v.path.length; wpIdx++) {
        const wp = v.path[wpIdx];
        if (!isPointInDriveableArea(wp.x, wp.z)) {
          console.warn(`[LivingWorld] Vehicle ${idx} (${v.type}) WP#${wpIdx} (${wp.x}, ${wp.z}) is outside drivable area`);
        }
        if (checkObstacleCollision(wp.x, wp.z, v.collisionRadius).collided) {
          console.warn(`[LivingWorld] Vehicle ${idx} (${v.type}) WP#${wpIdx} (${wp.x}, ${wp.z}) overlaps obstacle`);
        }
      }
    }
  }

  private createVehicle(
    path: Waypoint[],
    paintMaterial: THREE.Material,
    type: 'sedan' | 'bus' | 'hatchback' | 'van' | 'suv' | 'ambulance' | 'hybrid' | 'truck',
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
    const isTruck = type === 'truck';

    const length = isBus ? 7.6 : isTruck ? 5.4 : isVan || isAmbulance ? 5.0 : 4.2;
    const width = isBus ? 2.4 : isTruck || isVan || isAmbulance ? 2.1 : 1.95;
    const height = isBus ? 2.3 : isTruck ? 2.1 : isVan || isAmbulance ? 2.0 : 1.35;
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

    const halfLength = (length * scale) * 0.5;
    const halfWidth = (width * scale) * 0.5;
    const collisionRadius = Math.max(halfLength, halfWidth);

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
      halfLength,
      halfWidth,
      collisionRadius,
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

      // Collision Avoidance / Safe Dynamic Bumper-to-Bumper Distance Check
      let tooClose = false;
      let shouldSlowDown = false;
      let slowTargetSpeed = 0;
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

        // Dynamic bumper-to-bumper distance based on vehicle dimensions
        const safeStopDist = v.halfLength + other.halfLength + 2.5;
        const safeSlowDist = safeStopDist + 4.5;
        const lateralClearance = v.collisionRadius + other.collisionRadius + 1.2;

        if (dist < safeSlowDist) {
          const dot = (ox * forwardX + oz * forwardZ) / Math.max(0.001, dist);
          if (dot > 0.50) {
            // Forward obstacle in driving lane
            if (dist < safeStopDist) {
              tooClose = true;
              break;
            } else {
              shouldSlowDown = true;
              slowTargetSpeed = Math.min(v.actualSpeed, other.actualSpeed * 0.85);
            }
          } else if (dist < lateralClearance) {
            // Lateral convergence or intersection approach:
            // The vehicle with higher index or lower current speed yields safely
            if (i > j || v.actualSpeed < other.actualSpeed) {
              tooClose = true;
              break;
            } else {
              shouldSlowDown = true;
              slowTargetSpeed = Math.min(v.actualSpeed, 1.8);
            }
          }
        }
      }

      // Also check against player-controlled EV
      if (!tooClose && this.playerVehiclePosition) {
        const ox = this.playerVehiclePosition.x - myX;
        const oz = this.playerVehiclePosition.z - myZ;
        const dist = Math.hypot(ox, oz);
        const safeStopDist = v.halfLength + this.playerVehiclePosition.radius + 2.6;
        const safeSlowDist = safeStopDist + 4.5;
        const playerLateralClearance = v.collisionRadius + this.playerVehiclePosition.radius + 1.0;

        if (dist < safeSlowDist) {
          const dot = (ox * forwardX + oz * forwardZ) / Math.max(0.001, dist);
          if (dot > 0.50) {
            if (dist < safeStopDist) {
              tooClose = true;
            } else {
              shouldSlowDown = true;
              slowTargetSpeed = Math.min(v.actualSpeed, 2.0);
            }
          } else if (dist < playerLateralClearance) {
            // Player EV is crossing path or immediately adjacent
            tooClose = true;
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
        let targetSpeed = pA.speed || v.baseSpeed;
        if (shouldSlowDown) {
          targetSpeed = Math.min(targetSpeed, slowTargetSpeed);
        }
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

  public setPlayerVehicle(pos: THREE.Vector3 | null, radius: number = 1.35) {
    if (!pos) {
      this.playerVehiclePosition = null;
    } else {
      this.playerVehiclePosition = { x: pos.x, z: pos.z, radius };
    }
  }

  public getTrafficObstacles(): { x: number; z: number; radius: number }[] {
    return this.vehicles.map((v) => ({
      x: v.group.position.x,
      z: v.group.position.z,
      radius: v.collisionRadius,
    }));
  }

  public dispose() {
    this.vehicles = [];
    this.pedestrians = [];
    this.streetPointLights = [];
    this.playerVehiclePosition = null;
  }
}
