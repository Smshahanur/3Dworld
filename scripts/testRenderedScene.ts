import * as THREE from 'three';
import { createMaterialLibrary } from '../src/world/materials';
import { createModernVillageLandscape } from '../src/world/terrain';
import { createModernVillage } from '../src/world/landmarks';
import { createLivingNatureSystem } from '../src/world/natureSystem';
import { ROAD_SEGMENTS, ROUNDABOUT_NODES, BRIDGES } from '../src/world/roadNetwork';

// Lightweight headless mock for Canvas / DOM
if (typeof document === 'undefined') {
  (global as any).document = {
    createElement: () => ({
      getContext: () => ({
        fillStyle: '',
        strokeStyle: '',
        fillRect: () => {},
        strokeRect: () => {},
        beginPath: () => {},
        arc: () => {},
        fill: () => {},
        stroke: () => {},
        moveTo: () => {},
        lineTo: () => {},
        measureText: () => ({ width: 10 }),
        fillText: () => {},
        createImageData: (w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        getImageData: (x: number, y: number, w: number, h: number) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData: () => {},
      }),
      width: 256,
      height: 256,
    }),
  };
}

console.log('Building 3D Scene Graph...');
const scene = new THREE.Scene();
const materials = createMaterialLibrary(false);

const landscape = createModernVillageLandscape(materials);
scene.add(landscape);

const village = createModernVillage(materials);
scene.add(village.villageGroup);

const nature = createLivingNatureSystem(materials);
scene.add(nature.natureGroup);

console.log('Updating Scene World Matrices...');
scene.updateMatrixWorld(true);

const roadBoxes = ROAD_SEGMENTS.map((r) => ({
  id: r.id,
  name: r.name,
  minX: r.minX + 0.2,
  maxX: r.maxX - 0.2,
  minZ: r.minZ + 0.2,
  maxZ: r.maxZ - 0.2,
  width: r.width,
}));

console.log(`Checking meshes against ${roadBoxes.length} protected road corridors...`);

interface MeshConflict {
  name: string;
  uuid: string;
  parent: string;
  roadId: string;
  roadName: string;
  meshAABB: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
}

const conflicts: MeshConflict[] = [];
let totalMeshes = 0;

const box = new THREE.Box3();

scene.traverse((obj) => {
  if (!(obj as THREE.Mesh).isMesh) return;
  const mesh = obj as THREE.Mesh;
  totalMeshes++;

  // Ignore terrain base ground planes (Y <= 0.05)
  // Ignore road surface asphalt planes and marking planes (which sit at Y: 0.08 - 0.105)
  box.setFromObject(mesh);

  // If the mesh is purely road surface or markings (Y <= 0.11), it's part of the drivable road
  if (box.max.y <= 0.11) {
    return;
  }

  // If mesh is a car in static parking or drivable car, ignore
  if (
    mesh.userData?.isVehicle ||
    mesh.userData?.isBird ||
    mesh.name.includes('car') ||
    mesh.parent?.name?.includes('car') ||
    mesh.name.includes('bird') ||
    mesh.parent?.name?.includes('bird')
  ) {
    return;
  }

  // Ignore main 380m terrain base ground plane
  if (mesh.geometry.type === 'PlaneGeometry' && box.max.x - box.min.x > 300) {
    return;
  }

  // Ignore distant perimeter mountain cones (radius 175)
  if (
    mesh.name.includes('mountain') ||
    mesh.userData?.isScenery ||
    (mesh.geometry.type === 'ConeGeometry' && box.max.y > 18 && (Math.abs(box.min.x) > 100 || Math.abs(box.min.z) > 100))
  ) {
    return;
  }

  // Ignore central roundabout island monuments (sculpture and obelisk inside circular island)
  const center = box.getCenter(new THREE.Vector3());
  const inRoundaboutIsland = ROUNDABOUT_NODES.some((rb) => {
    return Math.hypot(center.x - rb.centerX, center.z - rb.centerZ) < rb.innerRadius + 0.3;
  });
  if (inRoundaboutIsland) {
    return;
  }

  // Ignore elevated drivable bridge deck surface meshes
  const isBridgeDeck = BRIDGES.some((b) => {
    const minX = Math.min(b.startX, b.endX) - 2.0;
    const maxX = Math.max(b.startX, b.endX) + 2.0;
    const minZ = Math.min(b.startZ, b.endZ) - b.width;
    const maxZ = Math.max(b.startZ, b.endZ) + b.width;
    return box.min.x >= minX && box.max.x <= maxX && box.min.z >= minZ && box.max.z <= maxZ;
  });
  if (isBridgeDeck && box.max.y <= 0.6) {
    return;
  }

  // Check overlap with protected road corridors
  for (const road of roadBoxes) {
    const overlapX = box.min.x < road.maxX && box.max.x > road.minX;
    const overlapZ = box.min.z < road.maxZ && box.max.z > road.minZ;

    if (overlapX && overlapZ) {
      // Elevated above road surface (Y > 0.11) and below overhead clearance (Y < 3.5)
      if (box.max.y > 0.11 && box.min.y < 3.5) {
        conflicts.push({
          name: mesh.name || (mesh.geometry ? mesh.geometry.type : 'unnamed-mesh'),
          uuid: mesh.uuid,
          parent: mesh.parent?.name || 'root',
          roadId: road.id,
          roadName: road.name,
          meshAABB: {
            minX: parseFloat(box.min.x.toFixed(2)),
            maxX: parseFloat(box.max.x.toFixed(2)),
            minY: parseFloat(box.min.y.toFixed(2)),
            maxY: parseFloat(box.max.y.toFixed(2)),
            minZ: parseFloat(box.min.z.toFixed(2)),
            maxZ: parseFloat(box.max.z.toFixed(2)),
          },
        });
        break;
      }
    }
  }
});

console.log(`Total Meshes Analyzed: ${totalMeshes}`);
console.log(`Rendered Mesh Conflicts Found: ${conflicts.length}`);

const grouped = new Map<string, MeshConflict[]>();
conflicts.forEach((c) => {
  const key = `${c.roadId} (${c.roadName}) -> ${c.parent} (${c.name})`;
  if (!grouped.has(key)) grouped.set(key, []);
  grouped.get(key)!.push(c);
});

console.log('Grouped Conflicts:');
grouped.forEach((list, key) => {
  console.log(`- ${key}: ${list.length} instances. Sample bounds:`, list[0].meshAABB);
});
