import * as THREE from 'three';
import { BOX_OBSTACLES, BoxObstacle } from './collisionSystem';
import { ROAD_SEGMENTS, BRIDGES, INTERSECTION_JUNCTIONS, ROUNDABOUT_NODES, RoadSegment, BridgeStructure } from './roadNetwork';

export interface SpatialEntity {
  id: string;
  name: string;
  type: 'building' | 'road' | 'parking' | 'vehicle' | 'bridge';
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  elevationY: number;
  heightY: number;
  district?: string;
  isEncroaching?: boolean;
}

export interface SpatialOverlap {
  entityA: SpatialEntity;
  entityB: SpatialEntity;
  intersection: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  description: string;
}

export interface RoadCorridorAudit {
  id: string;
  name: string;
  district: string;
  driveableWidth: number;
  protectedWidth: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  isBlocked: boolean;
  hasInsufficientClearance: boolean;
  isDisconnected: boolean;
  encroachingObstacleIds: string[];
  connections: string[];
}

export interface ConnectivityAuditReport {
  isAllConnected: boolean;
  districtsConnected: {
    ruralVillage: boolean;
    modernVillage: boolean;
    capitalTown: boolean;
    bridge1Traversable: boolean;
    bridge2Traversable: boolean;
  };
  disconnectedRoads: string[];
  totalVehicularNodes: number;
  reachableVehicularNodes: number;
}

export interface SpatialAuditReport {
  isValid: boolean;
  overlapCount: number;
  roadObstructionCount: number;
  insufficientClearanceCount: number;
  disconnectedRoadCount: number;
  overlaps: SpatialOverlap[];
  roadCorridors: RoadCorridorAudit[];
  connectivity: ConnectivityAuditReport;
  totalBuildings: number;
  totalRoadsAndParking: number;
  totalVehicles: number;
  checkedAt: string;
}

/**
 * Diagnostic Color Palette as requested by specification:
 * - Green (0x10b981): valid road corridor
 * - Red (0xef4444): blocked road corridor
 * - Yellow (0xeab308): insufficient vehicle clearance (< 3.0m)
 * - Blue (0x3b82f6): valid building footprint
 * - Orange (0xf97316): invalid building or foundation placement
 * - Purple (0xa855f7): disconnected road segment
 */
export const DIAGNOSTIC_COLORS = {
  VALID_ROAD: 0x10b981,
  BLOCKED_ROAD: 0xef4444,
  INSUFFICIENT_CLEARANCE: 0xeab308,
  VALID_BUILDING: 0x3b82f6,
  INVALID_BUILDING: 0xf97316,
  DISCONNECTED_ROAD: 0xa855f7,
  PARKING_LOT: 0x06b6d4,
  VEHICLE: 0xffaa00,
};

/**
 * Authoritative Spatial Audit & Road-First Clearance Engine
 * Continuously validates road connectivity, clearance corridors, and building placement.
 */
export class SpatialAuditSystem {
  private scene: THREE.Scene;
  private debugGroup: THREE.Group;
  private isVisible: boolean = false;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.debugGroup = new THREE.Group();
    this.debugGroup.name = 'SpatialAuditDebugVisualizer';
    this.debugGroup.visible = false;
    this.scene.add(this.debugGroup);
  }

  /**
   * Collects all authoritative spatial entities in the universe.
   */
  public collectAllEntities(): {
    buildings: SpatialEntity[];
    roadsAndParking: SpatialEntity[];
    vehicles: SpatialEntity[];
  } {
    const buildings: SpatialEntity[] = [];
    const roadsAndParking: SpatialEntity[] = [];
    const vehicles: SpatialEntity[] = [];

    // 1. Buildings & Structures from Box Obstacles (excluding vehicles and water bodies)
    BOX_OBSTACLES.forEach((obs) => {
      if (obs.id.startsWith('static-car')) {
        vehicles.push({
          id: obs.id,
          name: obs.name,
          type: 'vehicle',
          minX: obs.minX,
          maxX: obs.maxX,
          minZ: obs.minZ,
          maxZ: obs.maxZ,
          elevationY: 0.0,
          heightY: 1.5,
        });
      } else if (obs.id.includes('river') || obs.id.includes('water')) {
        // Natural water bodies
      } else {
        buildings.push({
          id: obs.id,
          name: obs.name,
          type: 'building',
          minX: obs.minX,
          maxX: obs.maxX,
          minZ: obs.minZ,
          maxZ: obs.maxZ,
          elevationY: 0.15,
          heightY: 6.0,
        });
      }
    });

    // 2. Roads and Parking Lots from Authoritative Road Segments
    ROAD_SEGMENTS.forEach((seg) => {
      const isParking = seg.id.includes('commercial-lane') || seg.id.includes('parking');
      roadsAndParking.push({
        id: seg.id,
        name: seg.name,
        type: isParking ? 'parking' : 'road',
        minX: seg.minX,
        maxX: seg.maxX,
        minZ: seg.minZ,
        maxZ: seg.maxZ,
        elevationY: 0.08,
        heightY: 0.2,
        district: seg.district,
      });
    });

    // 3. Bridges
    BRIDGES.forEach((b) => {
      const minX = Math.min(b.startX, b.endX);
      const maxX = Math.max(b.startX, b.endX);
      const minZ = Math.min(b.startZ, b.endZ) - b.width * 0.5;
      const maxZ = Math.max(b.startZ, b.endZ) + b.width * 0.5;
      roadsAndParking.push({
        id: b.id,
        name: b.name,
        type: 'bridge',
        minX,
        maxX,
        minZ,
        maxZ,
        elevationY: b.deckY,
        heightY: 0.35,
        district: 'inter-district',
      });
    });

    // 4. Player EV Car footprint
    vehicles.push({
      id: 'player-ev-car',
      name: 'Player Electric Roadster',
      type: 'vehicle',
      minX: -24.2,
      maxX: -19.8,
      minZ: -3.8,
      maxZ: -0.2,
      elevationY: 0.12,
      heightY: 1.4,
    });

    return { buildings, roadsAndParking, vehicles };
  }

  /**
   * Tests multi-district road-to-road connectivity graph.
   */
  public auditConnectivity(): ConnectivityAuditReport {
    const adj = new Map<string, Set<string>>();
    const allVehicularIds = new Set<string>();

    function addEdge(u: string, v: string) {
      if (!adj.has(u)) adj.set(u, new Set());
      if (!adj.has(v)) adj.set(v, new Set());
      adj.get(u)!.add(v);
      adj.get(v)!.add(u);
    }

    ROAD_SEGMENTS.forEach((seg) => {
      allVehicularIds.add(seg.id);
      seg.connections.forEach((conn) => {
        addEdge(seg.id, conn);
      });
    });

    BRIDGES.forEach((b) => {
      if (b.id !== 'bridge-lake-footbridge') {
        allVehicularIds.add(b.id);
      }
    });

    // BFS from Rural Village Main Road
    const startNode = 'rd-rural-main';
    const visited = new Set<string>();
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      const neighbors = adj.get(curr) || new Set();
      neighbors.forEach((n) => {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      });
    }

    const disconnectedRoads: string[] = [];
    allVehicularIds.forEach((id) => {
      if (!visited.has(id)) {
        disconnectedRoads.push(id);
      }
    });

    const bridge1Traversable = visited.has('bridge-rural-river');
    const bridge2Traversable = visited.has('bridge-capital-highway');
    const modernConnected = visited.has('rd-mod-boulevard-w') && visited.has('rd-mod-boulevard-e');
    const capitalConnected = visited.has('rd-cap-highway-entry') && visited.has('rd-cap-grand-boulevard');

    return {
      isAllConnected: disconnectedRoads.length === 0,
      districtsConnected: {
        ruralVillage: visited.has('rd-rural-main'),
        modernVillage: modernConnected,
        capitalTown: capitalConnected,
        bridge1Traversable,
        bridge2Traversable,
      },
      disconnectedRoads,
      totalVehicularNodes: allVehicularIds.size,
      reachableVehicularNodes: allVehicularIds.size - disconnectedRoads.length,
    };
  }

  /**
   * Runs the complete road-clearance and spatial layout audit.
   */
  public runAudit(): SpatialAuditReport {
    const { buildings, roadsAndParking, vehicles } = this.collectAllEntities();
    const overlaps: SpatialOverlap[] = [];
    const roadCorridors: RoadCorridorAudit[] = [];
    const connectivity = this.auditConnectivity();

    function testOverlap(minX1: number, maxX1: number, minZ1: number, maxZ1: number,
                         minX2: number, maxX2: number, minZ2: number, maxZ2: number): boolean {
      return minX1 < maxX2 && maxX1 > minX2 && minZ1 < maxZ2 && maxZ1 > minZ2;
    }

    function computeIntersection(e1: { minX: number; maxX: number; minZ: number; maxZ: number },
                                 e2: { minX: number; maxX: number; minZ: number; maxZ: number }) {
      return {
        minX: Math.max(e1.minX, e2.minX),
        maxX: Math.min(e1.maxX, e2.maxX),
        minZ: Math.max(e1.minZ, e2.minZ),
        maxZ: Math.min(e1.maxZ, e2.maxZ),
      };
    }

    const encroachingBuildingIds = new Set<string>();

    // 1. Authoritative Road Corridor Clearance Audit
    // Every road segment has a protected corridor with lane widths + curbs + safety margin
    ROAD_SEGMENTS.forEach((seg) => {
      const driveableWidth = seg.width;
      const protectedBuffer = 0.4; // 0.4m lateral safety cushion on each side
      const pMinX = seg.minX - protectedBuffer;
      const pMaxX = seg.maxX + protectedBuffer;
      const pMinZ = seg.minZ - protectedBuffer;
      const pMaxZ = seg.maxZ + protectedBuffer;

      const encroachingIds: string[] = [];

      buildings.forEach((b) => {
        if (testOverlap(pMinX, pMaxX, pMinZ, pMaxZ, b.minX, b.maxX, b.minZ, b.maxZ)) {
          encroachingIds.push(b.id);
          encroachingBuildingIds.add(b.id);
          overlaps.push({
            entityA: {
              id: seg.id,
              name: seg.name,
              type: 'road',
              minX: seg.minX,
              maxX: seg.maxX,
              minZ: seg.minZ,
              maxZ: seg.maxZ,
              elevationY: 0.08,
              heightY: 0.2,
            },
            entityB: b,
            intersection: computeIntersection(
              { minX: pMinX, maxX: pMaxX, minZ: pMinZ, maxZ: pMaxZ },
              b
            ),
            description: `Building "${b.name}" (${b.id}) encroaches on protected road corridor "${seg.name}" (${seg.id})`,
          });
        }
      });

      // Vehicle-sized swept path clearance: requires at least 3.0m driveable width
      const hasInsufficientClearance = driveableWidth < 3.0;

      // Disconnected road check
      const isDisconnected = connectivity.disconnectedRoads.includes(seg.id);

      roadCorridors.push({
        id: seg.id,
        name: seg.name,
        district: seg.district,
        driveableWidth,
        protectedWidth: driveableWidth + protectedBuffer * 2,
        minX: seg.minX,
        maxX: seg.maxX,
        minZ: seg.minZ,
        maxZ: seg.maxZ,
        isBlocked: encroachingIds.length > 0,
        hasInsufficientClearance,
        isDisconnected,
        encroachingObstacleIds: encroachingIds,
        connections: seg.connections,
      });
    });

    // 2. Bridges Clearance Audit
    BRIDGES.forEach((b) => {
      if (b.id === 'bridge-lake-footbridge') return;
      const minX = Math.min(b.startX, b.endX);
      const maxX = Math.max(b.startX, b.endX);
      const minZ = Math.min(b.startZ, b.endZ) - b.width * 0.5;
      const maxZ = Math.max(b.startZ, b.endZ) + b.width * 0.5;

      const encroachingIds: string[] = [];
      buildings.forEach((bld) => {
        if (testOverlap(minX, maxX, minZ, maxZ, bld.minX, bld.maxX, bld.minZ, bld.maxZ)) {
          encroachingIds.push(bld.id);
          encroachingBuildingIds.add(bld.id);
          overlaps.push({
            entityA: {
              id: b.id,
              name: b.name,
              type: 'bridge',
              minX,
              maxX,
              minZ,
              maxZ,
              elevationY: b.deckY,
              heightY: 0.35,
            },
            entityB: bld,
            intersection: computeIntersection({ minX, maxX, minZ, maxZ }, bld),
            description: `Building "${bld.name}" (${bld.id}) encroaches on bridge corridor "${b.name}" (${b.id})`,
          });
        }
      });

      const isDisconnected = connectivity.disconnectedRoads.includes(b.id);
      roadCorridors.push({
        id: b.id,
        name: b.name,
        district: 'inter-district',
        driveableWidth: b.width,
        protectedWidth: b.width + 0.8,
        minX,
        maxX,
        minZ,
        maxZ,
        isBlocked: encroachingIds.length > 0,
        hasInsufficientClearance: b.width < 3.0,
        isDisconnected,
        encroachingObstacleIds: encroachingIds,
        connections: [],
      });
    });

    // 3. Vehicles vs Buildings
    vehicles.forEach((v) => {
      buildings.forEach((b) => {
        if (testOverlap(v.minX, v.maxX, v.minZ, v.maxZ, b.minX, b.maxX, b.minZ, b.maxZ)) {
          overlaps.push({
            entityA: v,
            entityB: b,
            intersection: computeIntersection(v, b),
            description: `Vehicle "${v.name}" (${v.id}) penetrates building "${b.name}" (${b.id})`,
          });
        }
      });
    });

    // 4. Solid Buildings vs Solid Buildings
    for (let i = 0; i < buildings.length; i++) {
      for (let j = i + 1; j < buildings.length; j++) {
        const b1 = buildings[i];
        const b2 = buildings[j];
        if (testOverlap(b1.minX, b1.maxX, b1.minZ, b1.maxZ, b2.minX, b2.maxX, b2.minZ, b2.maxZ)) {
          overlaps.push({
            entityA: b1,
            entityB: b2,
            intersection: computeIntersection(b1, b2),
            description: `Building "${b1.name}" (${b1.id}) overlaps building "${b2.name}" (${b2.id})`,
          });
        }
      }
    }

    const roadObstructionCount = roadCorridors.filter((r) => r.isBlocked).length;
    const insufficientClearanceCount = roadCorridors.filter((r) => r.hasInsufficientClearance).length;
    const disconnectedRoadCount = roadCorridors.filter((r) => r.isDisconnected).length;

    return {
      isValid: overlaps.length === 0 && connectivity.isAllConnected && insufficientClearanceCount === 0,
      overlapCount: overlaps.length,
      roadObstructionCount,
      insufficientClearanceCount,
      disconnectedRoadCount,
      overlaps,
      roadCorridors,
      connectivity,
      totalBuildings: buildings.length,
      totalRoadsAndParking: roadsAndParking.length,
      totalVehicles: vehicles.length,
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Rebuilds the 3D diagnostic visualizer adhering to the exact requested color scheme:
   * - Green: valid road corridor
   * - Red: blocked road corridor
   * - Yellow: insufficient vehicle clearance
   * - Blue: valid building footprint
   * - Orange: invalid building/foundation placement
   * - Purple: disconnected road segment
   */
  public rebuildVisualizer() {
    // Clear old visualizer objects
    while (this.debugGroup.children.length > 0) {
      const child = this.debugGroup.children[0];
      this.debugGroup.remove(child);
      if ((child as THREE.Mesh).geometry) {
        (child as THREE.Mesh).geometry.dispose();
      }
    }

    const { buildings, vehicles } = this.collectAllEntities();
    const report = this.runAudit();

    // Map encroaching buildings
    const encroachingSet = new Set<string>();
    report.overlaps.forEach((ov) => {
      if (ov.entityB.type === 'building') encroachingSet.add(ov.entityB.id);
      if (ov.entityA.type === 'building') encroachingSet.add(ov.entityA.id);
    });

    const createWireBox = (minX: number, maxX: number, minZ: number, maxZ: number,
                           elevationY: number, heightY: number, colorHex: number, opacity: number = 0.16) => {
      const w = Math.max(0.5, maxX - minX);
      const d = Math.max(0.5, maxZ - minZ);
      const cx = (minX + maxX) * 0.5;
      const cz = (minZ + maxZ) * 0.5;
      const cy = elevationY + heightY * 0.5;

      const geo = new THREE.BoxGeometry(w, heightY, d);
      const edges = new THREE.EdgesGeometry(geo);
      const line = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: colorHex, linewidth: 2 })
      );
      line.position.set(cx, cy, cz);
      this.debugGroup.add(line);

      const footGeo = new THREE.PlaneGeometry(w, d);
      footGeo.rotateX(-Math.PI / 2);
      const footMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      const foot = new THREE.Mesh(footGeo, footMat);
      foot.position.set(cx, elevationY + 0.05, cz);
      this.debugGroup.add(foot);
    };

    // 1. Render Road Corridors
    report.roadCorridors.forEach((rc) => {
      let color = DIAGNOSTIC_COLORS.VALID_ROAD; // Green
      if (rc.isBlocked) {
        color = DIAGNOSTIC_COLORS.BLOCKED_ROAD; // Red
      } else if (rc.hasInsufficientClearance) {
        color = DIAGNOSTIC_COLORS.INSUFFICIENT_CLEARANCE; // Yellow
      } else if (rc.isDisconnected) {
        color = DIAGNOSTIC_COLORS.DISCONNECTED_ROAD; // Purple
      }

      createWireBox(rc.minX, rc.maxX, rc.minZ, rc.maxZ, 0.08, 0.35, color, 0.25);
    });

    // 2. Render Buildings
    buildings.forEach((b) => {
      const isInvalid = encroachingSet.has(b.id);
      const color = isInvalid ? DIAGNOSTIC_COLORS.INVALID_BUILDING : DIAGNOSTIC_COLORS.VALID_BUILDING;
      createWireBox(b.minX, b.maxX, b.minZ, b.maxZ, b.elevationY, b.heightY, color, isInvalid ? 0.45 : 0.12);
    });

    // 3. Render Vehicles
    vehicles.forEach((v) => {
      createWireBox(v.minX, v.maxX, v.minZ, v.maxZ, v.elevationY, v.heightY, DIAGNOSTIC_COLORS.VEHICLE, 0.3);
    });

    // 4. Render Obstruction Markers for any overlaps with exact IDs
    report.overlaps.forEach((ov) => {
      const w = Math.max(1.0, ov.intersection.maxX - ov.intersection.minX);
      const d = Math.max(1.0, ov.intersection.maxZ - ov.intersection.minZ);
      const cx = (ov.intersection.minX + ov.intersection.maxX) * 0.5;
      const cz = (ov.intersection.minZ + ov.intersection.maxZ) * 0.5;

      const warnGeo = new THREE.BoxGeometry(w, 4.0, d);
      const warnMat = new THREE.MeshBasicMaterial({
        color: DIAGNOSTIC_COLORS.BLOCKED_ROAD,
        wireframe: true,
      });
      const warnMesh = new THREE.Mesh(warnGeo, warnMat);
      warnMesh.position.set(cx, 2.0, cz);
      this.debugGroup.add(warnMesh);
    });
  }

  /**
   * Toggles visibility of the 3D spatial debug visualizer.
   */
  public setVisible(visible: boolean) {
    this.isVisible = visible;
    this.debugGroup.visible = visible;
    if (visible) {
      this.rebuildVisualizer();
    }
  }

  public toggle(): boolean {
    this.setVisible(!this.isVisible);
    return this.isVisible;
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }

  public dispose() {
    this.setVisible(false);
    this.scene.remove(this.debugGroup);
  }
}

/**
 * Headless helper for CLI tests or UI diagnostics without requiring a Three.js scene.
 */
export function auditSpatialLayout(): SpatialAuditReport {
  const dummyScene = new THREE.Scene();
  const auditor = new SpatialAuditSystem(dummyScene);
  const report = auditor.runAudit();
  auditor.dispose();
  return report;
}
