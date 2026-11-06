/**
 * 3DWorld Central Authoritative Road & Navigation Network
 * Defines all road segments, intersections, bridges, and drivable surfaces across:
 * - District 1: Rural Village (Dirt roads, farm lanes, village pond byways)
 * - District 2: Modern Village (Main Boulevard, Roundabout, Cul-de-sacs, Lake drive)
 * - District 3: Capital Town (Grand Boulevard, CBD grid, University pkwy, Bus Terminal)
 * - Trans-District Bridges over the river system
 */

export type SurfaceType =
  | 'drivable_road'
  | 'parking_area'
  | 'bridge_surface'
  | 'sidewalk'
  | 'pedestrian_plaza'
  | 'park_lawn'
  | 'rural_farmland'
  | 'river_water'
  | 'riverbank'
  | 'building_footprint'
  | 'restricted_terrain';

export type RoadType =
  | 'highway'
  | 'arterial_boulevard'
  | 'residential_street'
  | 'rural_dirt_road'
  | 'service_lane'
  | 'bridge_corridor';

export interface AllowedTurn {
  toRoadId: string;
  turnType: 'straight' | 'left' | 'right' | 'roundabout' | 'u_turn';
}

export interface RestrictedZone {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  reason: string;
}

export interface RoadLane {
  offset: number; // lateral offset from road centerline (meters)
  direction: 1 | -1; // 1 = forward (start to end), -1 = reverse
  speedLimit: number; // units/sec
}

export interface RoadSegment {
  id: string;
  name: string;
  district: 'rural-village' | 'modern-village' | 'capital-town' | 'inter-district';
  surface: 'asphalt' | 'concrete' | 'dirt' | 'cobblestone';
  roadType?: RoadType;
  startX?: number;
  endX?: number;
  startZ?: number;
  endZ?: number;
  width: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  speedLimit: number;
  laneCount?: number;
  hasCurbs: boolean;
  hasCenterlines: boolean;
  lanes: RoadLane[];
  connections: string[];
  allowedTurns?: AllowedTurn[];
  driveableBounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  restrictedZones?: RestrictedZone[];
}

export interface IntersectionJunction {
  id: string;
  name: string;
  district: 'rural-village' | 'modern-village' | 'capital-town' | 'inter-district';
  x: number;
  z: number;
  hasTrafficLight: boolean;
  hasStopLine: boolean;
  hasCrosswalk: boolean;
  connectedRoadIds: string[];
}

export interface RoundaboutNode {
  id: string;
  name: string;
  district: 'modern-village' | 'capital-town';
  centerX: number;
  centerZ: number;
  innerRadius: number; // island radius (blocked for vehicles)
  outerRadius: number; // outer edge of road
  speedLimit: number;
}

export interface BridgeStructure {
  id: string;
  name: string;
  startX: number;
  endX: number;
  startZ: number;
  endZ: number;
  width: number;
  deckY: number;
  surface: 'concrete' | 'timber';
  hasTrusses: boolean;
}

// -----------------------------------------------------------------------------
// 0. INTERSECTION JUNCTIONS
// -----------------------------------------------------------------------------

export const INTERSECTION_JUNCTIONS: IntersectionJunction[] = [
  {
    id: 'junc-rural-square',
    name: 'Rural Village Square Junction',
    district: 'rural-village',
    x: -110.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: false,
    connectedRoadIds: ['rd-rural-main', 'rd-rural-farm-n', 'rd-rural-pond-s'],
  },
  {
    id: 'junc-bridge-west-rural',
    name: 'Rural West Creek Bridge Approach',
    district: 'inter-district',
    x: -66.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: false,
    connectedRoadIds: ['rd-rural-main', 'bridge-rural-river'],
  },
  {
    id: 'junc-bridge-west-modern',
    name: 'Modern West Creek Bridge Gateway',
    district: 'inter-district',
    x: -42.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: false,
    connectedRoadIds: ['bridge-rural-river', 'rd-mod-boulevard-w'],
  },
  {
    id: 'junc-mod-town-center',
    name: 'Town Center Civic Promenade Crossing',
    district: 'modern-village',
    x: -16.0,
    z: 0.0,
    hasTrafficLight: true,
    hasStopLine: true,
    hasCrosswalk: true,
    connectedRoadIds: ['rd-mod-boulevard-w', 'rd-mod-commercial-lane'],
  },
  {
    id: 'junc-mod-roundabout',
    name: 'Modern Village Central Roundabout Junction',
    district: 'modern-village',
    x: -5.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: true,
    connectedRoadIds: ['rd-mod-boulevard-w', 'rd-mod-boulevard-e', 'rd-mod-boulevard-ns'],
  },
  {
    id: 'junc-mod-central-park',
    name: 'Central Park South Promenade Crossing',
    district: 'modern-village',
    x: 8.0,
    z: 0.0,
    hasTrafficLight: true,
    hasStopLine: true,
    hasCrosswalk: true,
    connectedRoadIds: ['rd-mod-boulevard-e', 'rd-mod-botanical-drive'],
  },
  {
    id: 'junc-bridge-east-modern',
    name: 'Modern Grand Highway Bridge Gateway',
    district: 'inter-district',
    x: 37.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: false,
    connectedRoadIds: ['rd-mod-boulevard-e', 'bridge-capital-highway'],
  },
  {
    id: 'junc-bridge-east-capital',
    name: 'Capital Grand Highway Bridge Gateway',
    district: 'inter-district',
    x: 63.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: false,
    connectedRoadIds: ['bridge-capital-highway', 'rd-cap-highway-entry'],
  },
  {
    id: 'junc-cap-gateway',
    name: 'Capital Gateway Boulevard Crossing',
    district: 'capital-town',
    x: 74.0,
    z: 0.0,
    hasTrafficLight: true,
    hasStopLine: true,
    hasCrosswalk: true,
    connectedRoadIds: ['rd-cap-highway-entry', 'rd-cap-transit-loop'],
  },
  {
    id: 'junc-cap-roundabout',
    name: 'Capital Civic Roundabout Junction',
    district: 'capital-town',
    x: 105.0,
    z: 0.0,
    hasTrafficLight: false,
    hasStopLine: true,
    hasCrosswalk: true,
    connectedRoadIds: ['rd-cap-highway-entry', 'rd-cap-grand-boulevard', 'rd-cap-south-connector-c', 'rd-cap-north-connector-c'],
  },
  {
    id: 'junc-cap-civic-plaza',
    name: 'Capital Civic Plaza & City Hall Crossing',
    district: 'capital-town',
    x: 126.0,
    z: 0.0,
    hasTrafficLight: true,
    hasStopLine: true,
    hasCrosswalk: true,
    connectedRoadIds: ['rd-cap-grand-boulevard'],
  },
];

// -----------------------------------------------------------------------------
// 1. ROUNDABOUT NODES
// -----------------------------------------------------------------------------

export const ROUNDABOUT_NODES: RoundaboutNode[] = [
  // District 2: Modern Village Central Roundabout
  {
    id: 'roundabout-modern',
    name: 'Modern Village Central Roundabout',
    district: 'modern-village',
    centerX: -5.0,
    centerZ: 0.0,
    innerRadius: 4.2,
    outerRadius: 9.2,
    speedLimit: 5.0,
  },
  // District 3: Capital Town Civic Roundabout
  {
    id: 'roundabout-capital',
    name: 'Capital Town Civic Roundabout',
    district: 'capital-town',
    centerX: 105.0,
    centerZ: 0.0,
    innerRadius: 5.5,
    outerRadius: 11.8,
    speedLimit: 6.0,
  },
];

// -----------------------------------------------------------------------------
// 2. BRIDGES OVER RIVER
// -----------------------------------------------------------------------------

export const BRIDGES: BridgeStructure[] = [
  // Bridge 1: Rural Stone & Timber Bridge (connecting Rural Village to Modern Village)
  {
    id: 'bridge-rural-river',
    name: 'West Rural River Bridge',
    startX: -66.0,
    endX: -42.0,
    startZ: 0.0,
    endZ: 0.0,
    width: 8.2,
    deckY: 0.22,
    surface: 'timber',
    hasTrusses: false,
  },
  // Bridge 2: Capital Grand Highway Bridge (connecting Modern Village to Capital Town)
  {
    id: 'bridge-capital-highway',
    name: 'Grand Capital Highway Bridge',
    startX: 37.0,
    endX: 63.0,
    startZ: 0.0,
    endZ: 0.0,
    width: 10.4,
    deckY: 0.28,
    surface: 'concrete',
    hasTrusses: true,
  },
  // Bridge 3: North Scenic Inlet Footbridge (Botanical-to-North Park connector)
  {
    id: 'bridge-lake-footbridge',
    name: 'Lake Promenade Arched Footbridge',
    startX: 17.0,
    endX: 31.0,
    startZ: -42.0,
    endZ: -42.0,
    width: 2.8,
    deckY: 0.85,
    surface: 'timber',
    hasTrusses: false,
  },
];

// -----------------------------------------------------------------------------
// 3. AUTHORITATIVE ROAD SEGMENTS
// -----------------------------------------------------------------------------

export const ROAD_SEGMENTS: RoadSegment[] = [
  // =========================================================================
  // DISTRICT 1: RURAL VILLAGE
  // =========================================================================

  // Rural Main Dirt Road (West entrance through village square to Rural River Bridge)
  {
    id: 'rd-rural-main',
    name: 'Rural Village Main Road',
    district: 'rural-village',
    surface: 'dirt',
    width: 7.8,
    minX: -155.0,
    maxX: -66.0,
    minZ: -4.0,
    maxZ: 4.0,
    speedLimit: 6.5,
    hasCurbs: false,
    hasCenterlines: false,
    lanes: [
      { offset: 1.8, direction: 1, speedLimit: 6.5 },
      { offset: -1.8, direction: -1, speedLimit: 6.5 },
    ],
    connections: ['rd-rural-turnabout', 'rd-rural-farm-n', 'rd-rural-pond-s', 'bridge-rural-river'],
  },

  // Rural Western Turnaround Loop
  {
    id: 'rd-rural-turnabout',
    name: 'Rural West Cul-de-sac Turnabout',
    district: 'rural-village',
    surface: 'dirt',
    width: 9.0,
    minX: -162.0,
    maxX: -152.0,
    minZ: -6.0,
    maxZ: 6.0,
    speedLimit: 4.0,
    hasCurbs: false,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 4.0 }],
    connections: ['rd-rural-main'],
  },

  // Rural North Farmstead Byway (connecting fields and cottages)
  {
    id: 'rd-rural-farm-n',
    name: 'Rural North Farmstead Lane',
    district: 'rural-village',
    surface: 'dirt',
    width: 6.4,
    minX: -114.0,
    maxX: -106.0,
    minZ: 0.0,
    maxZ: 52.0,
    speedLimit: 5.5,
    hasCurbs: false,
    hasCenterlines: false,
    lanes: [
      { offset: 1.4, direction: 1, speedLimit: 5.5 },
      { offset: -1.4, direction: -1, speedLimit: 5.5 },
    ],
    connections: ['rd-rural-main', 'rd-rural-farm-connector'],
  },

  // Rural North Farm Connector (East-West lane in front of farmhouses)
  {
    id: 'rd-rural-farm-connector',
    name: 'Rural Farmsteads East-West Lane',
    district: 'rural-village',
    surface: 'dirt',
    width: 6.0,
    minX: -142.0,
    maxX: -80.0,
    minZ: 48.0,
    maxZ: 55.0,
    speedLimit: 5.0,
    hasCurbs: false,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 5.0 }],
    connections: ['rd-rural-farm-n'],
  },

  // Rural South Pond Byway (past village well, primary school & tea stall)
  {
    id: 'rd-rural-pond-s',
    name: 'Rural South Pond Byway',
    district: 'rural-village',
    surface: 'dirt',
    width: 6.4,
    minX: -114.0,
    maxX: -106.0,
    minZ: -48.0,
    maxZ: 0.0,
    speedLimit: 5.0,
    hasCurbs: false,
    hasCenterlines: false,
    lanes: [
      { offset: 1.4, direction: 1, speedLimit: 5.0 },
      { offset: -1.4, direction: -1, speedLimit: 5.0 },
    ],
    connections: ['rd-rural-main', 'rd-rural-school-lane'],
  },

  // Rural School & Dispensary Access Lane
  {
    id: 'rd-rural-school-lane',
    name: 'Rural School & Clinic Access Lane',
    district: 'rural-village',
    surface: 'dirt',
    width: 6.0,
    minX: -138.0,
    maxX: -82.0,
    minZ: -52.0,
    maxZ: -44.0,
    speedLimit: 4.5,
    hasCurbs: false,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 4.5 }],
    connections: ['rd-rural-pond-s'],
  },

  // =========================================================================
  // DISTRICT 2: MODERN VILLAGE
  // =========================================================================

  // Modern Main East-West Boulevard (From West Bridge into Modern Roundabout)
  {
    id: 'rd-mod-boulevard-w',
    name: 'Modern Village West Boulevard',
    district: 'modern-village',
    surface: 'asphalt',
    width: 8.8,
    minX: -42.0,
    maxX: -5.0,
    minZ: -4.4,
    maxZ: 4.4,
    speedLimit: 7.5,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.5 },
      { offset: -2.0, direction: -1, speedLimit: 7.5 },
    ],
    connections: ['bridge-rural-river', 'roundabout-modern', 'rd-mod-commercial-lane'],
  },

  // Modern Main East-West Boulevard (From Modern Roundabout to Capital Bridge)
  {
    id: 'rd-mod-boulevard-e',
    name: 'Modern Village East Boulevard',
    district: 'modern-village',
    surface: 'asphalt',
    width: 8.8,
    minX: -5.0,
    maxX: 38.0,
    minZ: -4.4,
    maxZ: 4.4,
    speedLimit: 7.5,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.5 },
      { offset: -2.0, direction: -1, speedLimit: 7.5 },
    ],
    connections: ['roundabout-modern', 'bridge-capital-highway', 'rd-mod-botanical-drive'],
  },

  // Modern North-South Boulevard (From Lake Promenade up to Residential District)
  {
    id: 'rd-mod-boulevard-ns',
    name: 'Modern Village North-South Boulevard',
    district: 'modern-village',
    surface: 'asphalt',
    width: 8.8,
    minX: -9.4,
    maxX: -0.6,
    minZ: -32.0,
    maxZ: 64.0,
    speedLimit: 7.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.0 },
      { offset: -2.0, direction: -1, speedLimit: 7.0 },
    ],
    connections: ['roundabout-modern', 'rd-mod-res-culdesac', 'rd-mod-res-north', 'rd-mod-lake-promenade'],
  },

  // Modern Residential South Lane (Access to Villas, Cul-de-sac & Apartments)
  {
    id: 'rd-mod-res-culdesac',
    name: 'Modern Residential South Lane',
    district: 'modern-village',
    surface: 'asphalt',
    width: 7.6,
    minX: -54.0,
    maxX: -9.4,
    minZ: 28.2,
    maxZ: 35.8,
    speedLimit: 5.5,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 1.8, direction: 1, speedLimit: 5.5 },
      { offset: -1.8, direction: -1, speedLimit: 5.5 },
    ],
    connections: ['rd-mod-boulevard-ns', 'rd-mod-res-west-conn'],
  },

  // Modern Residential North Lane (Access to Villas & Townhouses)
  {
    id: 'rd-mod-res-north',
    name: 'Modern Residential North Lane',
    district: 'modern-village',
    surface: 'asphalt',
    width: 7.6,
    minX: -54.0,
    maxX: -9.4,
    minZ: 58.2,
    maxZ: 65.8,
    speedLimit: 5.5,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 1.8, direction: 1, speedLimit: 5.5 },
      { offset: -1.8, direction: -1, speedLimit: 5.5 },
    ],
    connections: ['rd-mod-boulevard-ns', 'rd-mod-res-west-conn'],
  },

  // Modern Residential Western Connector (Completes the residential loop)
  {
    id: 'rd-mod-res-west-conn',
    name: 'Residential Western Loop Connector',
    district: 'modern-village',
    surface: 'asphalt',
    width: 7.6,
    minX: -53.8,
    maxX: -46.2,
    minZ: 28.2,
    maxZ: 65.8,
    speedLimit: 5.0,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 5.0 }],
    connections: ['rd-mod-res-culdesac', 'rd-mod-res-north'],
  },

  // Modern Botanical Gardens Access Drive (Connecting East Boulevard to Garden Entrance)
  {
    id: 'rd-mod-botanical-drive',
    name: 'Botanical Gardens Access Drive',
    district: 'modern-village',
    surface: 'asphalt',
    width: 6.4,
    minX: 10.8,
    maxX: 17.2,
    minZ: 4.4,
    maxZ: 22.0,
    speedLimit: 5.0,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 5.0 }],
    connections: ['rd-mod-boulevard-e'],
  },

  // Modern Lake Scenic Promenade Road
  {
    id: 'rd-mod-lake-promenade',
    name: 'Lake District Scenic Road',
    district: 'modern-village',
    surface: 'asphalt',
    width: 8.0,
    minX: -30.0,
    maxX: 28.5,
    minZ: -32.0,
    maxZ: -24.0,
    speedLimit: 6.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 1.8, direction: 1, speedLimit: 6.0 },
      { offset: -1.8, direction: -1, speedLimit: 6.0 },
    ],
    connections: ['rd-mod-boulevard-ns', 'rd-mod-commercial-lane'],
  },

  // Modern Town Center Ground-Level Parking Plaza & Scenic Lake Access
  {
    id: 'rd-mod-commercial-lane',
    name: 'Town Center Lake Parking Plaza',
    district: 'modern-village',
    surface: 'asphalt',
    width: 8.0,
    minX: -29.0,
    maxX: -15.0,
    minZ: -24.0,
    maxZ: -16.0,
    speedLimit: 4.5,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 4.5 }],
    connections: ['rd-mod-lake-promenade'],
  },

  // Modern Clinic Emergency Drop-off Bay (Dedicated roadside apron, clear of building)
  {
    id: 'rd-mod-clinic-bay',
    name: 'Clinic Emergency Drop-off Bay',
    district: 'modern-village',
    surface: 'asphalt',
    width: 6.0,
    minX: -31.0,
    maxX: -25.0,
    minZ: 4.4,
    maxZ: 9.0,
    speedLimit: 4.5,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 4.5 }],
    connections: ['rd-mod-boulevard-w'],
  },


  // =========================================================================
  // DISTRICT 3: CAPITAL TOWN
  // =========================================================================

  // Capital Main Arterial Highway (From Bridge 2 to Capital Roundabout)
  {
    id: 'rd-cap-highway-entry',
    name: 'Capital Gateway Highway',
    district: 'capital-town',
    surface: 'asphalt',
    width: 9.6,
    minX: 62.0,
    maxX: 105.0,
    minZ: -4.8,
    maxZ: 4.8,
    speedLimit: 8.5,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.2, direction: 1, speedLimit: 8.5 },
      { offset: -2.2, direction: -1, speedLimit: 8.5 },
    ],
    connections: ['bridge-capital-highway', 'roundabout-capital', 'rd-cap-transit-loop'],
  },

  // Capital Grand Boulevard (East from Capital Roundabout through Commercial CBD)
  {
    id: 'rd-cap-grand-boulevard',
    name: 'Capital Grand Boulevard',
    district: 'capital-town',
    surface: 'asphalt',
    width: 9.6,
    minX: 105.0,
    maxX: 165.0,
    minZ: -4.8,
    maxZ: 4.8,
    speedLimit: 8.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.2, direction: 1, speedLimit: 8.0 },
      { offset: -2.2, direction: -1, speedLimit: 8.0 },
    ],
    connections: ['roundabout-capital', 'rd-cap-financial-connector-e', 'rd-cap-campus-connector-e'],
  },

  // Capital South Financial Avenue (Bank towers, stock exchange, luxury shopping)
  {
    id: 'rd-cap-financial-ave',
    name: 'Capital Financial Avenue',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.4,
    minX: 72.0,
    maxX: 162.0,
    minZ: -32.0,
    maxZ: -24.0,
    speedLimit: 7.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.0 },
      { offset: -2.0, direction: -1, speedLimit: 7.0 },
    ],
    connections: ['rd-cap-south-connector-c', 'rd-cap-transit-loop', 'rd-cap-financial-connector-e'],
  },

  // Capital Central South Connector (Connecting Roundabout to Financial Ave and Riverside)
  {
    id: 'rd-cap-south-connector-c',
    name: 'Capital Civic South Avenue',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.4,
    minX: 100.8,
    maxX: 109.2,
    minZ: -62.0,
    maxZ: 0.0,
    speedLimit: 7.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.0 },
      { offset: -2.0, direction: -1, speedLimit: 7.0 },
    ],
    connections: ['roundabout-capital', 'rd-cap-financial-ave', 'rd-cap-riverside-drive'],
  },

  // Capital East Financial Connector
  {
    id: 'rd-cap-financial-connector-e',
    name: 'Capital East Commercial Connector',
    district: 'capital-town',
    surface: 'asphalt',
    width: 7.6,
    minX: 154.0,
    maxX: 162.0,
    minZ: -32.0,
    maxZ: 4.8,
    speedLimit: 6.0,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 6.0 }],
    connections: ['rd-cap-grand-boulevard', 'rd-cap-financial-ave'],
  },

  // Capital North University & Hospital Parkway
  {
    id: 'rd-cap-campus-pkwy',
    name: 'Capital Campus & Hospital Parkway',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.4,
    minX: 72.0,
    maxX: 162.0,
    minZ: 32.0,
    maxZ: 40.0,
    speedLimit: 7.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.0 },
      { offset: -2.0, direction: -1, speedLimit: 7.0 },
    ],
    connections: ['rd-cap-north-connector-c', 'rd-cap-campus-connector-e', 'rd-cap-res-connector-w'],
  },

  // Capital Central North Connector (Connecting Roundabout to Campus Parkway and High-Rise district)
  {
    id: 'rd-cap-north-connector-c',
    name: 'Capital Civic North Avenue',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.4,
    minX: 100.8,
    maxX: 109.2,
    minZ: 0.0,
    maxZ: 64.0,
    speedLimit: 7.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 2.0, direction: 1, speedLimit: 7.0 },
      { offset: -2.0, direction: -1, speedLimit: 7.0 },
    ],
    connections: ['roundabout-capital', 'rd-cap-campus-pkwy', 'rd-cap-res-blvd'],
  },

  // Capital East Campus Connector
  {
    id: 'rd-cap-campus-connector-e',
    name: 'Capital East University Connector',
    district: 'capital-town',
    surface: 'asphalt',
    width: 7.6,
    minX: 154.0,
    maxX: 162.0,
    minZ: -4.8,
    maxZ: 40.0,
    speedLimit: 6.0,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 6.0 }],
    connections: ['rd-cap-grand-boulevard', 'rd-cap-campus-pkwy'],
  },

  // Capital Bus Terminal & Transport Interchange Loop
  {
    id: 'rd-cap-transit-loop',
    name: 'Capital Transit Interchange Loop',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.0,
    minX: 84.0,
    maxX: 92.0,
    minZ: -24.0,
    maxZ: -4.8,
    speedLimit: 4.5,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 4.5 }],
    connections: ['rd-cap-highway-entry', 'rd-cap-financial-ave'],
  },

  // Capital South Harbor / Riverside Promenade Road
  {
    id: 'rd-cap-riverside-drive',
    name: 'Capital Riverside Promenade Drive',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.0,
    minX: 65.0,
    maxX: 148.0,
    minZ: -62.0,
    maxZ: -54.0,
    speedLimit: 6.5,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 1.8, direction: 1, speedLimit: 6.5 },
      { offset: -1.8, direction: -1, speedLimit: 6.5 },
    ],
    connections: ['rd-cap-south-connector-c'],
  },

  // Capital North High-Rise Residential Boulevard
  {
    id: 'rd-cap-res-blvd',
    name: 'Capital North High-Rise Avenue',
    district: 'capital-town',
    surface: 'asphalt',
    width: 8.0,
    minX: 75.0,
    maxX: 158.0,
    minZ: 56.0,
    maxZ: 64.0,
    speedLimit: 6.0,
    hasCurbs: true,
    hasCenterlines: true,
    lanes: [
      { offset: 1.8, direction: 1, speedLimit: 6.0 },
      { offset: -1.8, direction: -1, speedLimit: 6.0 },
    ],
    connections: ['rd-cap-north-connector-c', 'rd-cap-res-connector-w'],
  },

  // Capital West Residential Connector
  {
    id: 'rd-cap-res-connector-w',
    name: 'Capital West Residential Connector',
    district: 'capital-town',
    surface: 'asphalt',
    width: 7.6,
    minX: 70.0,
    maxX: 77.6,
    minZ: 32.0,
    maxZ: 64.0,
    speedLimit: 5.5,
    hasCurbs: true,
    hasCenterlines: false,
    lanes: [{ offset: 0, direction: 1, speedLimit: 5.5 }],
    connections: ['rd-cap-campus-pkwy', 'rd-cap-res-blvd'],
  },
];

// -----------------------------------------------------------------------------
// 4. AUTHORITATIVE DRIVABLE AREA & SURFACE CLASSIFICATION
// -----------------------------------------------------------------------------

/**
 * Checks whether (x, z) lies strictly within an authorized drivable road corridor,
 * roundabout, bridge deck, or designated vehicle parking area.
 */
export function isPointInAuthoritativeDriveableArea(x: number, z: number, margin: number = 0): boolean {
  // 1. Bridges over river
  for (let b = 0; b < BRIDGES.length; b++) {
    const br = BRIDGES[b];
    if (br.id === 'bridge-lake-footbridge') continue; // Pedestrian footbridge only
    const minBx = Math.min(br.startX, br.endX) - margin;
    const maxBx = Math.max(br.startX, br.endX) + margin;
    const minBz = Math.min(br.startZ, br.endZ) - br.width * 0.5 - margin;
    const maxBz = Math.max(br.startZ, br.endZ) + br.width * 0.5 + margin;
    if (x >= minBx && x <= maxBx && z >= minBz && z <= maxBz) {
      return true;
    }
  }

  // 2. Roundabouts
  for (let r = 0; r < ROUNDABOUT_NODES.length; r++) {
    const rb = ROUNDABOUT_NODES[r];
    const distSq = (x - rb.centerX) * (x - rb.centerX) + (z - rb.centerZ) * (z - rb.centerZ);
    const outerWithMargin = rb.outerRadius + margin;
    if (distSq <= outerWithMargin * outerWithMargin) {
      // Must not be on the landscaped center island
      return distSq >= rb.innerRadius * rb.innerRadius;
    }
  }

  // 3. Road segments
  for (let s = 0; s < ROAD_SEGMENTS.length; s++) {
    const seg = ROAD_SEGMENTS[s];
    if (x >= seg.minX - margin && x <= seg.maxX + margin && z >= seg.minZ - margin && z <= seg.maxZ + margin) {
      // Check if inside any restricted zone of this segment
      if (seg.restrictedZones && seg.restrictedZones.length > 0) {
        for (let rz = 0; rz < seg.restrictedZones.length; rz++) {
          const zone = seg.restrictedZones[rz];
          if (x >= zone.minX && x <= zone.maxX && z >= zone.minZ && z <= zone.maxZ) {
            return false;
          }
        }
      }
      return true;
    }
  }

  return false;
}

/**
 * Returns a road segment by its unique identifier.
 */
export function getRoadSegmentById(id: string): RoadSegment | undefined {
  return ROAD_SEGMENTS.find((r) => r.id === id);
}

/**
 * Returns all road segments connected to the specified road ID.
 */
export function getConnectedRoads(roadId: string): RoadSegment[] {
  const seg = getRoadSegmentById(roadId);
  if (!seg || !seg.connections) return [];
  return seg.connections
    .map((connId) => getRoadSegmentById(connId))
    .filter((r): r is RoadSegment => r !== undefined);
}

/**
 * Finds the road segment containing the specified world coordinate (x, z).
 */
export function findRoadAtPoint(x: number, z: number): RoadSegment | undefined {
  return ROAD_SEGMENTS.find(
    (seg) => x >= seg.minX && x <= seg.maxX && z >= seg.minZ && z <= seg.maxZ
  );
}

/**
 * Resolves the primary district category for any world coordinate.
 */
export function getDistrictForPoint(
  x: number,
  _z: number
): 'rural-village' | 'modern-village' | 'capital-town' | 'inter-district' {
  if (x < -66.0) return 'rural-village';
  if (x >= -66.0 && x < -43.0) return 'inter-district'; // West Creek Bridge corridor
  if (x >= -43.0 && x <= 37.0) return 'modern-village';
  if (x > 37.0 && x < 63.0) return 'inter-district'; // Capital Highway Bridge corridor
  return 'capital-town';
}

/**
 * Classifies any world point into its authoritative surface category.
 */
export function classifySurface(x: number, z: number): SurfaceType {
  // 1. River Water & Riverbanks (Strictly no vehicles or walking in deep water)
  // Main North-to-South River flowing between Modern Village and Capital Town
  if (x >= 40.0 && x <= 60.0 && (z < -4.8 || z > 4.8)) {
    // Bridges cross at z [-4.8, 4.8]
    return 'river_water';
  }
  // West River Creek flowing between Rural Village and Modern Village
  if (x >= -62.0 && x <= -46.0 && (z < -4.0 || z > 4.0)) {
    return 'river_water';
  }
  // Modern Village Lake Basin (South of Lake Scenic Road)
  if (x >= -24.0 && x <= 35.0 && z >= -68.0 && z <= -34.0) {
    return 'river_water';
  }
  // Rural Village Pond (East of South Pond Byway)
  if (x >= -103.0 && x <= -81.0 && z >= -41.0 && z <= -27.0) {
    return 'river_water';
  }

  // 2. Bridges
  for (let b = 0; b < BRIDGES.length; b++) {
    const br = BRIDGES[b];
    const minBx = Math.min(br.startX, br.endX);
    const maxBx = Math.max(br.startX, br.endX);
    const minBz = Math.min(br.startZ, br.endZ) - br.width * 0.5;
    const maxBz = Math.max(br.startZ, br.endZ) + br.width * 0.5;
    if (x >= minBx && x <= maxBx && z >= minBz && z <= maxBz) {
      return br.id === 'bridge-lake-footbridge' ? 'pedestrian_plaza' : 'bridge_surface';
    }
  }

  // 3. Drivable Roads & Parking
  if (isPointInAuthoritativeDriveableArea(x, z)) {
    if (
      (x >= -32.0 && x <= -15.0 && z >= -24.0 && z <= -16.0) ||
      (x >= 64.0 && x <= 84.0 && z >= -20.5 && z <= -11.5)
    ) {
      return 'parking_area';
    }
    return 'drivable_road';
  }

  // 4. Sidewalks & Pedestrian Corridors
  // Main Boulevard sidewalks
  if (x >= -43.0 && x <= 38.0 && ((z >= 4.4 && z <= 6.8) || (z >= -6.8 && z <= -4.4))) {
    return 'sidewalk';
  }
  // Capital Boulevard sidewalks
  if (x >= 62.0 && x <= 165.0 && ((z >= 4.8 && z <= 7.4) || (z >= -7.4 && z <= -4.8))) {
    return 'sidewalk';
  }
  // North-South Boulevard sidewalks
  if (z >= -32.5 && z <= 64.0 && ((x >= -11.8 && x <= -9.4) || (x >= -0.6 && x <= 1.8))) {
    return 'sidewalk';
  }
  // Capital North-South connectors sidewalks
  if (
    (z >= -62.0 && z <= 64.0 && ((x >= 98.4 && x <= 100.8) || (x >= 109.2 && x <= 111.6)))
  ) {
    return 'sidewalk';
  }
  // Town Center Pedestrian Plaza
  if (x >= -31.5 && x <= -1.0 && z >= 4.2 && z <= 13.5) {
    return 'pedestrian_plaza';
  }
  // Capital Civic Plaza
  if (x >= 95.0 && x <= 140.0 && z >= 5.0 && z <= 24.0) {
    return 'pedestrian_plaza';
  }

  // 5. Farmland in District 1
  if (x >= -160.0 && x <= -70.0 && z >= 10.0 && z <= 65.0) {
    return 'rural_farmland';
  }

  // 6. Parks & Lawns
  if (x >= 5.0 && x <= 38.0 && z >= -22.0 && z <= 2.0) {
    return 'park_lawn';
  }
  if (x >= 120.0 && x <= 160.0 && z >= -22.0 && z <= 2.0) {
    return 'park_lawn';
  }

  return 'restricted_terrain';
}
