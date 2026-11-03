export interface LocationData {
  id: 'town-center' | 'residential' | 'central-park' | 'botanical-garden' | 'lake-district';
  name: string;
  subtitle: string;
  description: string;
  lore: string;
  target: [number, number, number]; // Look-at point
  cameraPos: [number, number, number]; // Camera eye position
  ambientColor: string;
  tag: string;
  altitude: string;
  biomeType: string;
  features: string[];
}

export interface BuildingInfo {
  id: string;
  name: string;
  type: string;
  district: string;
  districtId: 'town-center' | 'residential' | 'central-park' | 'botanical-garden' | 'lake-district';
  category: 'civic' | 'commercial' | 'residential' | 'park' | 'nature';
  description: string;
  features: string[];
  highlightPosition: [number, number, number];
  highlightRadius?: number;
  cameraPos: [number, number, number];
  target: [number, number, number];
}

export type LightingMode = 'day' | 'twilight' | 'cyber-night' | 'dawn';
export type ViewMode = 'aerial' | 'street';
export type GraphicsQuality = 'low' | 'medium' | 'high';
export type SimulationSpeed = 0.5 | 1 | 2;

export interface WorldState {
  activeLocationId: string | null;
  lightingMode: LightingMode;
  viewMode: ViewMode;
  autoRotate: boolean;
  soundEnabled: boolean;
  cinemaMode: boolean;
  isInspecting: boolean;
  simulationActive: boolean;
  trafficActive: boolean;
  pedestriansActive: boolean;
  envAnimationActive: boolean;
  simulationSpeed: SimulationSpeed;
  graphicsQuality: GraphicsQuality;
  ecoMode: boolean;
  selectedLandmark: LocationData | null;
  selectedBuilding: BuildingInfo | null;
}

export const LOCATIONS: LocationData[] = [
  {
    id: 'town-center',
    name: 'Town Center',
    subtitle: 'Civic Plaza & Commercial Promenade',
    description: 'The vibrant heart of 3DWorld featuring cafés, outdoor dining terraces, boutique shops, modern civic architecture, and a tree-lined pedestrian plaza.',
    lore: 'Designed as a walkable modern village hub, the Town Center unites contemporary civic architecture with pedestrian streets, alfresco dining patios, grocery shops, and bicycle greenways.',
    target: [-14, 1.8, 0],
    cameraPos: [-22, 9, 22],
    ambientColor: '#38bdf8',
    tag: 'Civic & Commercial Hub',
    altitude: 'Street Level • 12m Elevation',
    biomeType: 'Urban Pedestrian Zone',
    features: ['Pedestrian Brick Plaza', 'Alfresco Café Terraces', 'Civic Atrium & Clock Tower', 'Boutique Shopping Promenade'],
  },
  {
    id: 'residential',
    name: 'Residential District',
    subtitle: 'Modern Neighborhoods & Villas',
    description: 'Contemporary two-story villas and multi-unit residences with landscaped front gardens, driveways, balconies, and quiet tree-lined avenues.',
    lore: 'A peaceful, sustainably designed community of modern homes featuring warm natural cedar siding, rooftop sundecks, glass balconies, private driveways, and native garden hedges.',
    target: [-32, 2.0, 42],
    cameraPos: [-42, 10, 58],
    ambientColor: '#22c55e',
    tag: 'Living Neighborhood',
    altitude: 'Street Level • 14m Elevation',
    biomeType: 'Modern Architecture',
    features: ['Modern Contemporary Villas', 'Glass-Railing Balconies', 'Landscaped Front Lawns', 'Quiet Cul-de-Sac Avenues'],
  },
  {
    id: 'central-park',
    name: 'Central Park',
    subtitle: 'Public Lawns & Fountain Plaza',
    description: 'A spacious green sanctuary featuring mature trees, winding walking paths, park benches, a classic gazebo pavilion, playground, and an ornamental water fountain.',
    lore: 'The green lung of 3DWorld, Central Park spans expansive sunlit lawns, shaded perimeter trails, an ornamental stone fountain, a timber gazebo, and an open recreation area.',
    target: [20, 1.5, -6],
    cameraPos: [8, 12, 18],
    ambientColor: '#10b981',
    tag: 'Public Sanctuary',
    altitude: 'Parkland • 10m Elevation',
    biomeType: 'Lush Botanical Park',
    features: ['Tiered Grand Fountain', 'Garden Gazebo Pavilion', "Children's Adventure Playground", 'Shaded Promenade Paths'],
  },
  {
    id: 'botanical-garden',
    name: 'Botanical Garden',
    subtitle: 'Floral Conservatories & Greenhouse',
    description: 'A curated horticultural haven with a modern glass greenhouse, geometric flowerbeds, ornamental topiary hedges, lily ponds, and vine-covered pergolas.',
    lore: 'Dedicated to living biodiversity, the Botanical Garden showcases geometric parterre flower displays, aromatic lavender beds, sculpted boxwood hedges, and a steel-framed conservatory greenhouse.',
    target: [28, 2.0, 36],
    cameraPos: [16, 10, 52],
    ambientColor: '#ec4899',
    tag: 'Floral Sanctuary',
    altitude: 'Conservatory Grounds • 11m Elevation',
    biomeType: 'Horticultural Haven',
    features: ['Glass-Paned Greenhouse', 'Vibrant Floral Parterres', 'Geometric Topiary Hedges', 'Water Lily Reflection Pond'],
  },
  {
    id: 'lake-district',
    name: 'Lake District',
    subtitle: 'Waterfront Promenade & Recreation',
    description: 'A scenic freshwater lake bordered by wooden promenades, an arched footbridge, waterfront picnic spots, weeping willows, and panoramic vista hills.',
    lore: 'Reflecting the changing sky from dawn to cyber-night, the Lake District offers a tranquil escape with scenic timber boardwalks, an arched pedestrian bridge, and shoreline willow canopies.',
    target: [5, 1.0, -42],
    cameraPos: [-12, 9, -20],
    ambientColor: '#06b6d4',
    tag: 'Recreational Waters',
    altitude: 'Waterfront • 6m Elevation',
    biomeType: 'Freshwater Shoreline',
    features: ['Reflective Waterfront Shoreline', 'Arched Pedestrian Bridge', 'Timber Marina Promenade', 'Lakeside Picnic Glade'],
  },
];

export const BUILDINGS: BuildingInfo[] = [
  {
    id: 'civic-library',
    name: 'Civic Library & Atrium',
    type: 'Public Community Facility',
    district: 'Town Center',
    districtId: 'town-center',
    category: 'civic',
    description: 'A public library and community gathering hall with a double-height glass atrium, rooftop solar clock tower, and sunlit reading galleries.',
    features: ['Double-Height Reading Atrium', 'Rooftop Solar Clock Tower', 'Community Meeting Room', 'Public WiFi Terrace'],
    highlightPosition: [-26, 3.5, -8],
    highlightRadius: 7.5,
    cameraPos: [-18, 5.5, 2],
    target: [-26, 3, -8],
  },
  {
    id: 'village-cafe',
    name: 'Corner Village Café',
    type: 'Dining & Hospitality',
    district: 'Town Center',
    districtId: 'town-center',
    category: 'commercial',
    description: 'A pedestrian café with shaded striped awnings, an outdoor timber dining terrace, and an artisan bakery storefront.',
    features: ['Artisan Espresso Bar', 'Alfresco Shaded Patio', 'Fresh Bakery Counter', 'Bicycle Parking Racks'],
    highlightPosition: [-10, 2.6, -8],
    highlightRadius: 5.5,
    cameraPos: [-6, 4.2, 0],
    target: [-10, 2.3, -8],
  },
  {
    id: 'retail-arcade',
    name: 'Village Market & Boutique Arcade',
    type: 'Retail & Commerce',
    district: 'Town Center',
    districtId: 'town-center',
    category: 'commercial',
    description: 'A modern commercial storefront housing organic groceries, a neighborhood bookstore, and local artisan design boutiques.',
    features: ['Organic Groceries & Produce', 'Neighborhood Bookstore', 'Artisan Design Boutiques', 'Curbside Loading Bays'],
    highlightPosition: [-12, 2.8, 9],
    highlightRadius: 6.8,
    cameraPos: [-12, 5.0, -2],
    target: [-12, 2.5, 9],
  },
  {
    id: 'health-clinic',
    name: 'Village Health Clinic & Urgent Care',
    type: 'Civic Healthcare Center',
    district: 'Town Center',
    districtId: 'town-center',
    category: 'civic',
    description: 'A state-of-the-art modern clinic providing 24/7 urgent care, diagnostic suites, and pediatric healthcare with a glazed solar canopy and emergency vehicle bay.',
    features: ['24/7 Urgent Care Station', 'Glazed Solar Entrance Canopy', 'Emergency Vehicle Drop-off', 'Pediatric & Family Practice'],
    highlightPosition: [-26, 3.8, 16],
    highlightRadius: 7.0,
    cameraPos: [-16, 6.0, 26],
    target: [-26, 3.2, 16],
  },
  {
    id: 'village-school',
    name: 'Valley Elementary School & Academy',
    type: 'Civic Educational Institute',
    district: 'Town Center',
    districtId: 'town-center',
    category: 'civic',
    description: 'A modern two-story school and academy featuring dedicated science and art wings, a rooftop solar array, paved courtyard playground, and student bicycle hubs.',
    features: ['Interactive Science Laboratories', 'Paved Courtyard & Recreation', 'Rooftop Solar Array', 'Student Bicycle Stations'],
    highlightPosition: [-44, 4.2, 16],
    highlightRadius: 8.5,
    cameraPos: [-32, 6.8, 28],
    target: [-44, 3.6, 16],
  },
  {
    id: 'community-center',
    name: 'Community Cultural Center & Council Hall',
    type: 'Civic Gathering & Culture',
    district: 'Town Center',
    districtId: 'town-center',
    category: 'civic',
    description: 'An architectural municipal center with curved glulam timber beams, a public amphitheater plaza, civic assembly hall, and rotating gallery exhibitions.',
    features: ['Glulam Timber Hall', 'Civic Council Chambers', 'Outdoor Amphitheater Steps', 'Local Artist Exhibition Gallery'],
    highlightPosition: [-38, 3.8, -16],
    highlightRadius: 7.8,
    cameraPos: [-28, 6.5, -4],
    target: [-38, 3.2, -16],
  },
  {
    id: 'villa-cedar',
    name: 'Cedar Horizon Villa',
    type: 'Single-Family Residence',
    district: 'Residential District',
    districtId: 'residential',
    category: 'residential',
    description: 'A contemporary two-story home featuring horizontal cedar cladding, a cantilevered sundeck, glass balustrades, and native shrub gardens.',
    features: ['Horizontal Cedar Cladding', 'Cantilevered Sundeck', 'Glass Balustrades', 'Private Paver Driveway'],
    highlightPosition: [-40, 3.5, 50],
    highlightRadius: 5.0,
    cameraPos: [-32, 5.5, 58],
    target: [-40, 3.0, 50],
  },
  {
    id: 'villa-slate',
    name: 'Dark Slate Contemporary Villa',
    type: 'Single-Family Residence',
    district: 'Residential District',
    districtId: 'residential',
    category: 'residential',
    description: 'An architect-designed residence featuring dark slate masonry accents, floor-to-ceiling panoramic glass, and a private driveway.',
    features: ['Dark Slate Masonry', 'Panoramic Glass Windows', 'Private Garage Driveway', 'Manicured Lawn & Garden'],
    highlightPosition: [-24, 3.5, 50],
    highlightRadius: 5.0,
    cameraPos: [-16, 5.5, 58],
    target: [-24, 3.0, 50],
  },
  {
    id: 'villa-terracotta',
    name: 'Terracotta Gable Villa',
    type: 'Single-Family Residence',
    district: 'Residential District',
    districtId: 'residential',
    category: 'residential',
    description: 'A warm family residence designed with pitched clay tile gables, a masonry chimney, a boxwood hedge perimeter, and a garden patio.',
    features: ['Pitched Clay Tile Gables', 'Stone Masonry Chimney', 'Boxwood Hedge Perimeter', 'Rear Dining Garden Patio'],
    highlightPosition: [-10, 4.0, 50],
    highlightRadius: 5.0,
    cameraPos: [-2, 6.0, 58],
    target: [-10, 3.5, 50],
  },
  {
    id: 'modern-apartments',
    name: 'Corner Modern Residences',
    type: 'Multi-Family Residential',
    district: 'Residential District',
    districtId: 'residential',
    category: 'residential',
    description: 'A three-story modern apartment building with staggered timber balconies, a glazed ground-floor entrance lobby, and a rooftop terrace.',
    features: ['Staggered Timber Balconies', 'Glazed Ground-Floor Lobby', 'Panoramic Rooftop Sundeck', 'Covered Bicycle Enclosure'],
    highlightPosition: [-54, 5.0, 42],
    highlightRadius: 6.8,
    cameraPos: [-42, 7.5, 30],
    target: [-54, 4.5, 42],
  },
  {
    id: 'townhouse-row',
    name: 'Boulevard Garden Townhouses',
    type: 'Contemporary Terraced Homes',
    district: 'Residential District',
    districtId: 'residential',
    category: 'residential',
    description: 'A row of 3 contemporary terraced townhouses with private stoop entries, cedar accent paneling, rooftop garden pergolas, and ornamental shrub borders.',
    features: ['Triplex Modern Design', 'Private Stoop Entrances', 'Rooftop Cedar Pergolas', 'Ornamental Shrub Borders'],
    highlightPosition: [-50, 4.5, 60],
    highlightRadius: 7.2,
    cameraPos: [-40, 7.0, 68],
    target: [-50, 3.8, 60],
  },
  {
    id: 'botanical-conservatory',
    name: 'Botanical Glass Conservatory',
    type: 'Horticultural Sanctuary',
    district: 'Botanical Garden',
    districtId: 'botanical-garden',
    category: 'nature',
    description: 'A climate-controlled glass greenhouse framed with architectural steel ribs, sheltering mature palms, ferns, and exotic botanical collections.',
    features: ['Climate-Controlled Microclimate', 'Exotic Palm & Fern Haven', 'Architectural Steel Framework', 'Automated Misting System'],
    highlightPosition: [28, 3.4, 30],
    highlightRadius: 7.2,
    cameraPos: [20, 5.5, 42],
    target: [28, 3.0, 30],
  },
  {
    id: 'park-gazebo',
    name: 'Central Park Gazebo Pavilion',
    type: 'Public Park Pavilion',
    district: 'Central Park',
    districtId: 'central-park',
    category: 'park',
    description: 'An octagonal wooden gathering pavilion with classical white columns and a cupola roof, overlooking the park lawns and grand fountain.',
    features: ['Octagonal Timber Pavilion', 'Classical Fluted Columns', 'Cupola Weather-Vane Roof', '360° Park Panorama Benches'],
    highlightPosition: [11, 2.4, 3],
    highlightRadius: 4.2,
    cameraPos: [16, 4.2, 10],
    target: [11, 2.0, 3],
  },
  {
    id: 'sports-court',
    name: 'Central Park Multi-Sport & Basketball Court',
    type: 'Public Athletic Grounds',
    district: 'Central Park',
    districtId: 'central-park',
    category: 'park',
    description: 'An all-weather multi-sport half-court featuring blue and terracotta shock-absorbing polymer paving, regulation basketball hoops, safety chain-link netting, and courtside spectator bleachers.',
    features: ['All-Weather Polymer Court', 'Regulation Basketball Hoops', 'Perimeter Safety Enclosure', 'Courtside Spectator Bleachers'],
    highlightPosition: [32, 1.8, -6],
    highlightRadius: 6.2,
    cameraPos: [24, 4.8, 4],
    target: [32, 1.4, -6],
  },
  {
    id: 'lake-marina',
    name: 'Lake District Marina Promenade',
    type: 'Waterfront Recreation',
    district: 'Lake District',
    districtId: 'lake-district',
    category: 'nature',
    description: 'A scenic waterfront boardwalk with mooring pilings, a lifebuoy station, picnic tables, and an arched footbridge connecting the nature trails.',
    features: ['Timber Boardwalk Marina', 'Mooring Pilings & Lifebuoy', 'Waterfront Picnic Benches', 'Arched Footbridge Trailhead'],
    highlightPosition: [10, 1.4, -33],
    highlightRadius: 8.5,
    cameraPos: [10, 3.8, -22],
    target: [10, 0.6, -35],
  },
  {
    id: 'lake-boathouse',
    name: 'Lakeside Boathouse & Picnic Pavilion',
    type: 'Waterfront Shelter & Storage',
    district: 'Lake District',
    districtId: 'lake-district',
    category: 'nature',
    description: 'A heavy timber pavilion shelter featuring covered kayak and paddleboard storage racks, a stone barbecue hearth, and a viewing deck over the lake.',
    features: ['Covered Kayak & Paddleboard Racks', 'Fieldstone Barbecue Hearth', 'Panoramic Water Overlook Deck', 'Rustic Pine Picnic Tables'],
    highlightPosition: [-12, 1.8, -35],
    highlightRadius: 6.5,
    cameraPos: [-4, 4.5, -24],
    target: [-12, 1.2, -35],
  },
];
