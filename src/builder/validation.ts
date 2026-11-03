import { BUILDINGS } from '../types';
import { CatalogItem, CustomPlacedObject, PlacementValidationResult } from './types';

// Spatial bounding box helper
interface BoundingBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

function getFootprintBounds(
  x: number,
  z: number,
  width: number,
  depth: number,
  rotation: number
): BoundingBox2D {
  // If rotation is roughly 90 or 270 deg (Math.PI/2 or 3*Math.PI/2), swap width and depth
  const isPerpendicular = Math.abs(Math.sin(rotation)) > 0.707;
  const w = isPerpendicular ? depth : width;
  const d = isPerpendicular ? width : depth;

  const halfW = w * 0.48; // slightly forgiving 4% margin
  const halfD = d * 0.48;

  return {
    minX: x - halfW,
    maxX: x + halfW,
    minZ: z - halfD,
    maxZ: z + halfD,
  };
}

function boxesOverlap(a: BoundingBox2D, b: BoundingBox2D): boolean {
  return !(a.maxX < b.minX || a.minX > b.maxX || a.maxZ < b.minZ || a.minZ > b.maxZ);
}

// Protected Road Network Exclusion Zones (Buildings cannot block vehicle traffic)
const ROAD_EXCLUSIONS: BoundingBox2D[] = [
  // Main East-West Boulevard
  { minX: -42, maxX: 42, minZ: -4.2, maxZ: 4.2 },
  // North-South Boulevard
  { minX: -9.2, maxX: -0.8, minZ: -28, maxZ: 56 },
  // Residential Cul-de-Sac Avenue
  { minX: -54, maxX: -8, minZ: 36.5, maxZ: 43.5 },
];

// Lake Basin Exclusion Zone (Freshwater basin)
const LAKE_EXCLUSION: BoundingBox2D = {
  minX: -24,
  maxX: 36,
  minZ: -52,
  maxZ: -20,
};

export function validatePlacement(
  item: CatalogItem,
  position: [number, number, number],
  rotation: number,
  existingCustomObjects: CustomPlacedObject[],
  ignoreObjectId?: string
): PlacementValidationResult {
  const [x, , z] = position;

  // 1. Map boundary checks
  if (x < -105 || x > 105 || z < -105 || z > 105) {
    return {
      isValid: false,
      reason: 'Outside construction boundary (max 105m from center).',
    };
  }

  const bounds = getFootprintBounds(x, z, item.footprint.width, item.footprint.depth, rotation);

  // 2. Lake Water Exclusion (Only allow ponds/landscaping outside main water)
  if (boxesOverlap(bounds, LAKE_EXCLUSION)) {
    return {
      isValid: false,
      reason: 'Cannot build inside the natural freshwater lake basin.',
    };
  }

  // 3. Roundabout Exclusion
  const distToRoundabout = Math.hypot(x - (-5), z - 0);
  if (distToRoundabout < 7.5 && item.category !== 'landscape') {
    return {
      isValid: false,
      reason: 'Cannot block the central village roundabout intersection.',
    };
  }

  // 4. Road Network Protection (Buildings cannot be placed on roads)
  if (item.category === 'residential' || item.category === 'commercial' || item.category === 'civic') {
    for (const road of ROAD_EXCLUSIONS) {
      if (boxesOverlap(bounds, road)) {
        return {
          isValid: false,
          reason: 'Cannot place buildings on active roadway traffic lanes.',
        };
      }
    }
  }

  // 5. Protected Original Landmarks (Town Center, Schools, Clinic, etc.)
  for (const b of BUILDINGS) {
    const lRad = b.highlightRadius || 5.0;
    const lBounds: BoundingBox2D = {
      minX: b.highlightPosition[0] - lRad * 0.9,
      maxX: b.highlightPosition[0] + lRad * 0.9,
      minZ: b.highlightPosition[2] - lRad * 0.9,
      maxZ: b.highlightPosition[2] + lRad * 0.9,
    };
    if (boxesOverlap(bounds, lBounds)) {
      return {
        isValid: false,
        reason: `Overlaps protected landmark: ${b.name}`,
      };
    }
  }

  // 6. Overlap with Existing Custom Objects
  const isLandscapeDecor = item.category === 'landscape';

  for (const obj of existingCustomObjects) {
    if (ignoreObjectId && obj.id === ignoreObjectId) continue;

    // Approximate size lookup or standard 4m if unknown
    const existingWidth = 4.0;
    const existingDepth = 4.0;

    const existingBounds = getFootprintBounds(
      obj.position[0],
      obj.position[2],
      existingWidth,
      existingDepth,
      obj.rotation
    );

    if (boxesOverlap(bounds, existingBounds)) {
      // Landscape items like small trees and flowers can be placed near fences or paths
      if (!isLandscapeDecor) {
        return {
          isValid: false,
          reason: 'Overlaps another placed building or structure.',
        };
      }
    }
  }

  return { isValid: true };
}
