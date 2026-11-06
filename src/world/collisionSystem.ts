/**
 * 3DWorld Collision & Navigation System
 * Authoritative geometric collision boundaries, road networks, and obstacle detection:
 * - Town Center & Central Park fountains
 * - Town Center pedestrian plaza & alfresco dining
 * - Roundabout center island & landscaping
 * - All village civic, commercial, school, and residential buildings
 * - Trees, street furniture, and static parked cars
 * - Lake District water basin
 * - Drivable road surface corridors and designated parking lots
 * - Swept substepping collision engine for vehicle physics
 * - Multi-radius safe vehicle exit position solver
 */

import { isPointInAuthoritativeDriveableArea, classifySurface } from './roadNetwork';

export interface CircleObstacle {
  id: string;
  name: string;
  x: number;
  z: number;
  radius: number;
}

export interface BoxObstacle {
  id: string;
  name: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

// -----------------------------------------------------------------------------
// 1. STATIC VILLAGE & CAPITAL OBSTACLES (All 3 Districts)
// -----------------------------------------------------------------------------

export const CIRCLE_OBSTACLES: CircleObstacle[] = [
  // --- DISTRICT 1: RURAL VILLAGE ---
  { id: 'rural-well', name: 'Village Stone Well', x: -100.0, z: -16.0, radius: 2.2 },
  { id: 'rural-silo', name: 'Farmstead Grain Silo', x: -137.0, z: 35.0, radius: 2.6 },
  { id: 'rural-banyan-tree', name: 'Ancient Banyan Village Tree', x: -126.0, z: -18.0, radius: 2.5 },
  { id: 'rural-tree-1', name: 'Rural Roadside Tree', x: -130.0, z: 5.5, radius: 0.8 },
  { id: 'rural-tree-2', name: 'Rural Roadside Tree', x: -90.0, z: 5.5, radius: 0.8 },
  { id: 'rural-tree-3', name: 'Rural Roadside Tree', x: -130.0, z: -5.5, radius: 0.8 },
  { id: 'rural-tree-4', name: 'Rural Roadside Tree', x: -90.0, z: -5.5, radius: 0.8 },

  { id: 'central-park-fountain', name: 'Central Park Grand Fountain', x: 20.0, z: -14.0, radius: 5.2 },
  { id: 'roundabout-island', name: 'Central Roundabout Island', x: -5.0, z: 0.0, radius: 4.4 },
  { id: 'park-gazebo', name: 'Central Park Gazebo Pavilion', x: 13.0, z: -14.0, radius: 3.6 },

  // Modern Boulevard Verge Trees
  { id: 'tree-v1', name: 'Boulevard Verge Tree', x: -38, z: 7.2, radius: 0.75 },
  { id: 'tree-v2', name: 'Boulevard Verge Tree', x: -38, z: -7.2, radius: 0.75 },
  { id: 'tree-v3', name: 'Boulevard Verge Tree', x: -29, z: 7.2, radius: 0.75 },
  { id: 'tree-v4', name: 'Boulevard Verge Tree', x: -29, z: -7.2, radius: 0.75 },
  { id: 'tree-v5', name: 'Boulevard Verge Tree', x: -20, z: 7.2, radius: 0.75 },
  { id: 'tree-v6', name: 'Boulevard Verge Tree', x: -20, z: -7.2, radius: 0.75 },
  { id: 'tree-v7', name: 'Boulevard Verge Tree', x: 10, z: 7.2, radius: 0.75 },
  { id: 'tree-v8', name: 'Boulevard Verge Tree', x: 10, z: -7.2, radius: 0.75 },
  { id: 'tree-v9', name: 'Boulevard Verge Tree', x: 19, z: 7.2, radius: 0.75 },
  { id: 'tree-v10', name: 'Boulevard Verge Tree', x: 19, z: -7.2, radius: 0.75 },
  { id: 'tree-v11', name: 'Boulevard Verge Tree', x: 28, z: 7.2, radius: 0.75 },
  { id: 'tree-v12', name: 'Boulevard Verge Tree', x: 28, z: -7.2, radius: 0.75 },
  { id: 'tree-v13', name: 'Boulevard Verge Tree', x: 37, z: 7.2, radius: 0.75 },
  { id: 'tree-v14', name: 'Boulevard Verge Tree', x: 37, z: -7.2, radius: 0.75 },

  // Modern Residential Trees
  { id: 'tree-r1', name: 'Residential Street Tree', x: -12.4, z: 18, radius: 0.75 },
  { id: 'tree-r2', name: 'Residential Street Tree', x: -12.4, z: 28, radius: 0.75 },
  { id: 'tree-r3', name: 'Residential Street Tree', x: -12.4, z: 38, radius: 0.75 },
  { id: 'tree-r4', name: 'Residential Street Tree', x: -12.4, z: 48, radius: 0.75 },
  { id: 'tree-r5', name: 'Residential Street Tree', x: -12.4, z: 58, radius: 0.75 },

  // --- DISTRICT 3: CAPITAL TOWN ---
  { id: 'capital-roundabout-obelisk', name: 'Capital Roundabout Civic Obelisk', x: 105.0, z: 0.0, radius: 5.6 },
  { id: 'capital-plaza-fountain', name: 'Capital Civic Plaza Fountain', x: 118.0, z: 15.0, radius: 4.8 },
  { id: 'capital-tree-1', name: 'Capital Boulevard Tree', x: 78.0, z: 7.4, radius: 0.8 },
  { id: 'capital-tree-2', name: 'Capital Boulevard Tree', x: 92.0, z: 7.4, radius: 0.8 },
  { id: 'capital-tree-3', name: 'Capital Boulevard Tree', x: 120.0, z: 7.4, radius: 0.8 },
  { id: 'capital-tree-4', name: 'Capital Boulevard Tree', x: 135.0, z: 7.4, radius: 0.8 },
  { id: 'capital-tree-5', name: 'Capital Boulevard Tree', x: 150.0, z: 7.4, radius: 0.8 },
  { id: 'capital-tree-6', name: 'Capital Boulevard Tree', x: 78.0, z: -7.4, radius: 0.8 },
  { id: 'capital-tree-7', name: 'Capital Boulevard Tree', x: 92.0, z: -7.4, radius: 0.8 },
  { id: 'capital-tree-8', name: 'Capital Boulevard Tree', x: 120.0, z: -7.4, radius: 0.8 },
  { id: 'capital-tree-9', name: 'Capital Boulevard Tree', x: 135.0, z: -7.4, radius: 0.8 },
  { id: 'capital-tree-10', name: 'Capital Boulevard Tree', x: 150.0, z: -7.4, radius: 0.8 },
];

export const BOX_OBSTACLES: BoxObstacle[] = [
  // =========================================================================
  // DISTRICT 1: RURAL VILLAGE
  // =========================================================================
  { id: 'rural-cottage-1', name: 'Rustic Thatched Cottage 1', minX: -136.0, maxX: -124.0, minZ: 15.0, maxZ: 25.0 },
  { id: 'rural-cottage-2', name: 'Rustic Thatched Cottage 2', minX: -101.5, maxX: -92.5, minZ: 21.0, maxZ: 29.0 },
  { id: 'rural-cottage-3', name: 'Clay Brick Village Home', minX: -131.0, maxX: -119.0, minZ: 57.0, maxZ: 67.0 },
  { id: 'rural-cottage-4', name: 'Timber Gable Cottage', minX: -96.0, maxX: -84.0, minZ: 57.0, maxZ: 67.0 },
  { id: 'rural-grain-barn', name: 'Village Community Grain Barn', minX: -152.0, maxX: -138.0, minZ: 30.0, maxZ: 40.0 },
  { id: 'rural-tea-stall', name: 'Village Tea Stall & Canopy', minX: -125.0, maxX: -115.0, minZ: -19.0, maxZ: -11.0 },
  { id: 'rural-school', name: 'Rural Primary Schoolhouse', minX: -133.0, maxX: -117.0, minZ: -38.0, maxZ: -26.0 },
  { id: 'rural-clinic', name: 'Rural Health Dispensary', minX: -102.0, maxX: -88.0, minZ: -38.0, maxZ: -26.0 },
  { id: 'rural-pond-water', name: 'Rural Village Pond Basin', minX: -103.0, maxX: -81.0, minZ: -41.0, maxZ: -27.0 },

  // =========================================================================
  // DISTRICT 2: MODERN VILLAGE
  // =========================================================================
  { id: 'plaza-fountain', name: 'Plaza Fountain Basin', minX: -22.6, maxX: -17.4, minZ: 5.2, maxZ: 10.4 },
  { id: 'civic-library', name: 'Civic Library & Atrium', minX: -24.0, maxX: -12.0, minZ: -14.6, maxZ: -6.4 },
  { id: 'village-cafe', name: 'Village Café & Bakery', minX: 6.8, maxX: 17.2, minZ: -13.0, maxZ: -5.0 },
  { id: 'retail-arcade', name: 'Village Boutique Arcade', minX: -20.8, maxX: -11.2, minZ: 12.2, maxZ: 19.8 },
  { id: 'health-clinic', name: 'Village Health Clinic', minX: -34.5, maxX: -21.5, minZ: 11.5, maxZ: 20.5 },
  { id: 'village-school', name: 'Valley Elementary School', minX: -51.8, maxX: -36.2, minZ: 11.2, maxZ: 20.8 },
  { id: 'community-center', name: 'Community Cultural Center', minX: -42.2, maxX: -29.8, minZ: -14.6, maxZ: -6.4 },
  { id: 'villa-cedar', name: 'Cedar Horizon Villa', minX: -42.5, maxX: -33.5, minZ: 43.0, maxZ: 51.0 },
  { id: 'villa-slate', name: 'Dark Slate Contemporary Villa', minX: -30.5, maxX: -21.5, minZ: 43.0, maxZ: 51.0 },
  { id: 'villa-terracotta', name: 'Terracotta Gable Villa', minX: -19.5, maxX: -10.5, minZ: 43.0, maxZ: 51.0 },
  { id: 'modern-apartments', name: 'Corner Modern Residences', minX: -49.8, maxX: -38.2, minZ: 68.6, maxZ: 77.4 },
  { id: 'townhouse-row', name: 'Boulevard Garden Townhouses', minX: -37.8, maxX: -22.2, minZ: 67.2, maxZ: 74.8 },
  { id: 'creator-pavilion', name: 'Creator Glass Studio Pavilion', minX: 23.0, maxX: 32.0, minZ: 11.0, maxZ: 19.0 },
  { id: 'botanical-conservatory', name: 'Botanical Glass Conservatory', minX: 20.5, maxX: 35.5, minZ: 25.5, maxZ: 34.5 },
  { id: 'sports-court', name: 'Central Park Sports Court', minX: 24.5, maxX: 39.5, minZ: -20.0, maxZ: -8.0 },
  { id: 'lake-boathouse', name: 'Lakeside Boathouse Pavilion', minX: -24.8, maxX: -15.2, minZ: -41.2, maxZ: -33.8 },
  { id: 'lake-marina-deck', name: 'Lake Marina Promenade Deck', minX: -12.0, maxX: 22.0, minZ: -37.2, maxZ: -32.4 },
  { id: 'lake-water-basin', name: 'Lake District Water Basin', minX: -25.0, maxX: 36.0, minZ: -68.0, maxZ: -35.0 },

  // Static Parked Vehicles in Ground-Level Parking Stalls (Facing Lake Scenic Road, clear of library)
  { id: 'static-car-1', name: 'Parked Sedan 1', minX: -28.5, maxX: -25.5, minZ: -22.0, maxZ: -18.0 },
  { id: 'static-car-2', name: 'Parked Sedan 2', minX: -25.0, maxX: -22.0, minZ: -22.0, maxZ: -18.0 },
  { id: 'static-car-4', name: 'Parked Sedan 4', minX: -18.5, maxX: -15.5, minZ: -22.0, maxZ: -18.0 },
  { id: 'static-car-driveway-1', name: 'Driveway Parked Sedan', minX: -39.5, maxX: -36.5, minZ: 38.0, maxZ: 41.0 },
  { id: 'static-car-driveway-2', name: 'Driveway Parked Sedan', minX: -27.5, maxX: -24.5, minZ: 38.0, maxZ: 41.0 },

  // =========================================================
  // DISTRICT 3: CAPITAL TOWN
  // =========================================================
  { id: 'capital-city-hall', name: 'Capital Municipal City Hall', minX: 123.0, maxX: 141.0, minZ: 12.0, maxZ: 24.0 },
  { id: 'capital-financial-tower', name: 'Capital Financial Tower', minX: 123.5, maxX: 136.5, minZ: -19.2, maxZ: -9.8 },
  { id: 'capital-banking-exchange', name: 'Capital Banking & Exchange', minX: 112.0, maxX: 122.8, minZ: -19.2, maxZ: -9.8 },
  { id: 'capital-department-store', name: 'Capital Grand Galleria', minX: 137.0, maxX: 151.0, minZ: -19.2, maxZ: -9.8 },
  { id: 'capital-hospital', name: 'Capital General Hospital & ER', minX: 79.0, maxX: 93.0, minZ: 13.0, maxZ: 23.0 },
  { id: 'capital-university', name: 'Capital University Main Hall', minX: 112.5, maxX: 127.5, minZ: 44.8, maxZ: 55.2 },
  { id: 'capital-library', name: 'Capital Central Public Library', minX: 79.2, maxX: 92.8, minZ: 45.0, maxZ: 55.0 },
  { id: 'capital-hotel', name: 'Grand Capital Plaza Hotel', minX: 134.5, maxX: 149.5, minZ: 45.0, maxZ: 55.0 },
  { id: 'capital-residential-tower-1', name: 'Capital Skyrise Residences 1', minX: 82.0, maxX: 98.0, minZ: 66.0, maxZ: 78.0 },
  { id: 'capital-residential-tower-2', name: 'Capital Skyrise Residences 2', minX: 122.0, maxX: 138.0, minZ: 66.0, maxZ: 78.0 },
  { id: 'capital-bus-terminal-building', name: 'Capital Transit Terminal', minX: 73.0, maxX: 83.0, minZ: -19.8, maxZ: -12.2 },
  { id: 'capital-ev-charging-hub', name: 'Capital EV Fast-Charging Hub', minX: 60.0, maxX: 70.0, minZ: -19.8, maxZ: -12.2 },

  // =========================================================================
  // CONTINUOUS RIVER SYSTEM (Water zones outside bridge corridors)
  // =========================================================================
  // Main River (divides Modern Village and Capital Town at X: [40, 60])
  { id: 'river-main-north', name: 'Main River North Corridor', minX: 40.0, maxX: 60.0, minZ: 5.5, maxZ: 180.0 },
  { id: 'river-main-south', name: 'Main River South Corridor', minX: 40.0, maxX: 60.0, minZ: -180.0, maxZ: -5.5 },

  // West River Creek (divides Rural Village and Modern Village at X: [-62, -44])
  { id: 'river-west-north', name: 'West River Creek North', minX: -62.0, maxX: -44.0, minZ: 4.5, maxZ: 180.0 },
  { id: 'river-west-south', name: 'West River Creek South', minX: -62.0, maxX: -44.0, minZ: -180.0, maxZ: -4.5 },

  // =========================================================================
  // LIVING NATURE & RECREATION FACILITIES
  // =========================================================================
  { id: 'nature-cable-bridge-pylon', name: 'Modern Cable-Stayed Bridge Pylon', minX: 49.2, maxX: 50.8, minZ: 34.2, maxZ: 37.8 },
  { id: 'nature-sports-pitch', name: 'Capital East Football Pitch & Gym', minX: 165.0, maxX: 196.0, minZ: 10.0, maxZ: 26.0 },
  { id: 'nature-riverside-playground', name: 'Capital Riverside Play Complex', minX: 80.0, maxX: 90.0, minZ: -48.0, maxZ: -40.0 },
  { id: 'nature-rural-playground', name: 'Rural Village Sandpit & Swing Set', minX: -130.0, maxX: -122.0, minZ: 9.0, maxZ: 15.0 },
];

export const MAP_BOUNDS = {
  minX: -175.0,
  maxX: 175.0,
  minZ: -175.0,
  maxZ: 175.0,
};

// -----------------------------------------------------------------------------
// 2. DRIVABLE ROAD SURFACE CORRIDORS
// -----------------------------------------------------------------------------

/**
 * Checks if coordinate (x, z) lies within an authorized road corridor,
 * bridge, roundabout, or designated parking lot.
 */
export function isPointInDriveableArea(x: number, z: number, margin: number = 0): boolean {
  return isPointInAuthoritativeDriveableArea(x, z, margin);
}

// -----------------------------------------------------------------------------
// 3. COLLISION DETECTION HELPER FUNCTIONS
// -----------------------------------------------------------------------------

/**
 * Checks if a 2D circle footprint at (x, z) with given radius collides with any static obstacle
 */
export function checkObstacleCollision(
  x: number,
  z: number,
  radius: number = 0.5
): { collided: boolean; obstacleName?: string } {
  // 1. Map Perimeter check
  if (
    x - radius < MAP_BOUNDS.minX ||
    x + radius > MAP_BOUNDS.maxX ||
    z - radius < MAP_BOUNDS.minZ ||
    z + radius > MAP_BOUNDS.maxZ
  ) {
    return { collided: true, obstacleName: 'Perimeter Boundary' };
  }

  // 2. Circle Obstacles (Fountains, Roundabout island, Gazebo, Trees)
  for (let i = 0; i < CIRCLE_OBSTACLES.length; i++) {
    const obs = CIRCLE_OBSTACLES[i];
    const dx = x - obs.x;
    const dz = z - obs.z;
    const distSq = dx * dx + dz * dz;
    const minD = radius + obs.radius;
    if (distSq < minD * minD) {
      return { collided: true, obstacleName: obs.name };
    }
  }

  // 3. Box Obstacles (Plaza, Buildings, Lake Basin, Parked Cars)
  for (let i = 0; i < BOX_OBSTACLES.length; i++) {
    const box = BOX_OBSTACLES[i];
    if (
      x + radius > box.minX &&
      x - radius < box.maxX &&
      z + radius > box.minZ &&
      z - radius < box.maxZ
    ) {
      return { collided: true, obstacleName: box.name };
    }
  }

  return { collided: false };
}

/**
 * Validates the full rectangular footprint of the vehicle at (x, z, yaw)
 * against drivable roads, static obstacles, and AI traffic.
 */
export function isVehicleFootprintValid(
  x: number,
  z: number,
  yaw: number,
  trafficObstacles?: { x: number; z: number; radius: number }[],
  enforceRoads: boolean = true
): boolean {
  const sinY = Math.sin(yaw);
  const cosY = Math.cos(yaw);

  // Unit vectors: forward = (sin, cos), left = (-cos, sin)
  const fwdX = sinY;
  const fwdZ = cosY;
  const leftX = -cosY;
  const leftZ = sinY;

  // 1. Road corridor check: vehicle core and axles must remain within the road network with shoulder buffer
  if (enforceRoads) {
    const centerValid = isPointInDriveableArea(x, z, 1.2);
    const frontAxleValid = isPointInDriveableArea(x + fwdX * 1.3, z + fwdZ * 1.3, 1.5);
    const rearAxleValid = isPointInDriveableArea(x - fwdX * 1.3, z - fwdZ * 1.3, 1.5);
    if (!centerValid || (!frontAxleValid && !rearAxleValid)) {
      return false;
    }
  }

  // 2. Solid obstacle & traffic checks across 9 sample points spanning the vehicle footprint
  const sampleOffsets = [
    { f: 2.1, s: 0.0, r: 0.45 },   // Front Bumper Center
    { f: 2.0, s: 0.95, r: 0.35 },  // Front Left Corner
    { f: 2.0, s: -0.95, r: 0.35 }, // Front Right Corner
    { f: 0.0, s: 0.0, r: 0.95 },   // Vehicle Center
    { f: 0.0, s: 1.0, r: 0.35 },   // Left Side Flank
    { f: 0.0, s: -1.0, r: 0.35 },  // Right Side Flank
    { f: -2.1, s: 0.0, r: 0.45 },  // Rear Bumper Center
    { f: -2.0, s: 0.95, r: 0.35 }, // Rear Left Corner
    { f: -2.0, s: -0.95, r: 0.35 } // Rear Right Corner
  ];

  for (let i = 0; i < sampleOffsets.length; i++) {
    const so = sampleOffsets[i];
    const px = x + fwdX * so.f + leftX * so.s;
    const pz = z + fwdZ * so.f + leftZ * so.s;

    // Must not collide with any solid building, fountain, island, tree, or lake
    if (checkObstacleCollision(px, pz, so.r).collided) {
      return false;
    }

    // Must not collide with AI traffic vehicles
    if (trafficObstacles && trafficObstacles.length > 0) {
      for (let j = 0; j < trafficObstacles.length; j++) {
        const obs = trafficObstacles[j];
        const dx = px - obs.x;
        const dz = pz - obs.z;
        const minD = so.r + obs.radius;
        if (dx * dx + dz * dz < minD * minD) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Continuous swept-volume movement check with fine substepping (<= 0.15m per step).
 * Prevents tunneling through thin obstacles, fountains, or curbs.
 * Includes slide physics along unobstructed tangents.
 */
export function sweptMoveVehicle(
  currentX: number,
  currentZ: number,
  yaw: number,
  targetX: number,
  targetZ: number,
  trafficObstacles?: { x: number; z: number; radius: number }[],
  enforceRoads: boolean = true
): { x: number; z: number; collided: boolean } {
  const totalDx = targetX - currentX;
  const totalDz = targetZ - currentZ;
  const totalDist = Math.hypot(totalDx, totalDz);

  if (totalDist < 0.0001) {
    return { x: currentX, z: currentZ, collided: false };
  }

  // Maximum step size: 0.15m ensures zero tunneling even at maximum speed
  const maxStepSize = 0.15;
  const numSteps = Math.max(1, Math.ceil(totalDist / maxStepSize));
  const stepDx = totalDx / numSteps;
  const stepDz = totalDz / numSteps;

  let currX = currentX;
  let currZ = currentZ;
  let hasCollided = false;

  for (let s = 0; s < numSteps; s++) {
    const nextX = currX + stepDx;
    const nextZ = currZ + stepDz;

    // 1. Test full proposed substep
    if (isVehicleFootprintValid(nextX, nextZ, yaw, trafficObstacles, enforceRoads)) {
      currX = nextX;
      currZ = nextZ;
      continue;
    }

    // 2. Full move blocked: Attempt slide along X axis
    hasCollided = true;
    if (Math.abs(stepDx) > 0.001 && isVehicleFootprintValid(nextX, currZ, yaw, trafficObstacles, enforceRoads)) {
      currX = nextX;
      continue;
    }

    // 3. Attempt slide along Z axis
    if (Math.abs(stepDz) > 0.001 && isVehicleFootprintValid(currX, nextZ, yaw, trafficObstacles, enforceRoads)) {
      currZ = nextZ;
      continue;
    }

    // 4. Blocked in both directions: Stop safely at last validated position
    break;
  }

  return { x: currX, z: currZ, collided: hasCollided };
}

// -----------------------------------------------------------------------------
// 4. SAFE VEHICLE EXIT POSITION SOLVER
// -----------------------------------------------------------------------------

/**
 * Checks if a candidate position is on a paved sidewalk, plaza paver, or parking lot
 */
function isSidewalkOrParking(x: number, z: number): boolean {
  const surface = classifySurface(x, z);
  return surface === 'sidewalk' || surface === 'pedestrian_plaza' || surface === 'parking_area';
}

/**
 * Finds a verified safe walkable position immediately beside the parked EV.
 * Evaluates candidates around the vehicle (driver side, passenger side,
 * multi-radius spiral from 2.0m to 5.0m in 16 radial directions).
 * Verifies the avatar's complete footprint is clear of the car, buildings, fountains,
 * trees, and river/lake water.
 * If no safe location is found, returns success: false so the player stays safely inside.
 * Never teleports the player to spawn.
 */
export function findSafeWalkableExit(
  carX: number,
  carZ: number,
  carYaw: number
): { success: boolean; x: number; z: number } {
  const cosY = Math.cos(carYaw);
  const sinY = Math.sin(carYaw);

  // Unit vectors: forward = (sin, cos), left = (-cos, sin)
  const leftX = -cosY;
  const leftZ = sinY;
  const fwdX = sinY;
  const fwdZ = cosY;

  // Candidate generation list
  interface ExitCandidate {
    x: number;
    z: number;
    score: number;
  }
  const validCandidates: ExitCandidate[] = [];

  // Helper to validate and score a candidate position
  function testCandidate(candX: number, candZ: number, baseScore: number) {
    // 1. Distance from vehicle center must be outside car's physical hull
    const relFwd = (candX - carX) * fwdX + (candZ - carZ) * fwdZ;
    const relSide = (candX - carX) * leftX + (candZ - carZ) * leftZ;
    if (Math.abs(relFwd) < 2.5 && Math.abs(relSide) < 1.35) {
      return; // Inside car body!
    }

    // 2. Must not collide with any solid obstacle (pedestrian collision radius 0.45m)
    if (checkObstacleCollision(candX, candZ, 0.45).collided) {
      return;
    }

    // 3. Must not be inside river or lake water surface
    const surface = classifySurface(candX, candZ);
    if (surface === 'river_water' || surface === 'building_footprint') {
      return;
    }

    // 4. Must be inside world boundaries
    if (
      candX < MAP_BOUNDS.minX + 2 ||
      candX > MAP_BOUNDS.maxX - 2 ||
      candZ < MAP_BOUNDS.minZ + 2 ||
      candZ > MAP_BOUNDS.maxZ - 2
    ) {
      return;
    }

    // 5. Score candidate: bonus if on sidewalk, plaza, or designated parking
    let score = baseScore;
    if (isSidewalkOrParking(candX, candZ)) {
      score += 25;
    }

    validCandidates.push({ x: candX, z: candZ, score });
  }

  // Tier 1: Immediate vehicle flanks (driver side left, passenger side right)
  testCandidate(carX + leftX * 2.1, carZ + leftZ * 2.1, 50); // Driver side
  testCandidate(carX - leftX * 2.1, carZ - leftZ * 2.1, 45); // Passenger side
  testCandidate(carX + leftX * 1.8 + fwdX * 2.5, carZ + leftZ * 1.8 + fwdZ * 2.5, 40); // Front left
  testCandidate(carX - leftX * 1.8 + fwdX * 2.5, carZ - leftZ * 1.8 + fwdZ * 2.5, 38); // Front right
  testCandidate(carX + leftX * 1.8 - fwdX * 2.5, carZ + leftZ * 1.8 - fwdZ * 2.5, 40); // Rear left
  testCandidate(carX - leftX * 1.8 - fwdX * 2.5, carZ - leftZ * 1.8 - fwdZ * 2.5, 38); // Rear right

  // Tier 2: Radial spiral expansion from 2.4m out to 5.2m in 16 angular increments
  const radii = [2.4, 3.0, 3.6, 4.2, 4.8, 5.2];
  for (let r = 0; r < radii.length; r++) {
    const rad = radii[r];
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const rx = Math.cos(ang) * rad;
      const rz = Math.sin(ang) * rad;
      testCandidate(carX + rx, carZ + rz, 30 - rad * 2);
    }
  }

  if (validCandidates.length > 0) {
    // Sort descending by score
    validCandidates.sort((a, b) => b.score - a.score);
    const best = validCandidates[0];
    return {
      success: true,
      x: Math.round(best.x * 100) / 100,
      z: Math.round(best.z * 100) / 100,
    };
  }

  // Phase D Rule 6: If no safe location is found, keep the player in the vehicle
  return {
    success: false,
    x: Math.round(carX * 100) / 100,
    z: Math.round(carZ * 100) / 100,
  };
}
