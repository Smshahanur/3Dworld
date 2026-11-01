export interface LocationData {
  id: 'portal' | 'crystal-valley' | 'sky-temple' | 'aurora-forest' | 'cloud-city';
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

export type LightingMode = 'day' | 'twilight' | 'cyber-night' | 'dawn';

export interface WorldState {
  activeLocationId: string | null;
  lightingMode: LightingMode;
  autoRotate: boolean;
  soundEnabled: boolean;
  cinemaMode: boolean;
  isInspecting: boolean;
  selectedLandmark: LocationData | null;
}

export const LOCATIONS: LocationData[] = [
  {
    id: 'crystal-valley',
    name: 'Crystal Valley',
    subtitle: 'Prismatic Resonance Canyon',
    description: 'A glowing crystal landscape with beautiful blue and violet lighting. Giant faceted geode spires channel terrestrial harmonic energies.',
    lore: 'Discovered during the first celestial realignment, Crystal Valley is formed from hyper-dense photonic minerals that resonate with planetary vibrations, projecting shimmering cyan and violet auroras across the northern cliffs.',
    target: [-14, 3.2, -10],
    cameraPos: [-23, 10, -1],
    ambientColor: '#38bdf8',
    tag: 'Resonant Biome',
    altitude: '2,480m Above Abyss',
    biomeType: 'Prismatic Minerals',
    features: ['Harmonic Crystal Spires', 'Subterranean Geode Glow', 'Luminous Shard Formations', 'Ionized Vapor Streams'],
  },
  {
    id: 'sky-temple',
    name: 'Sky Temple',
    subtitle: 'Ancient Celestial Sanctuary',
    description: 'A majestic floating temple with bridges and tall architectural structures. Elevated ziggurats honor celestial alignments in eternal tranquility.',
    lore: 'Constructed millennia ago by the Island Architects, the Sky Temple balances upon anti-gravitational leylines. Its marble pavilions and gilded colonnades house the eternal celestial flame.',
    target: [14, 7.5, -8],
    cameraPos: [25, 16, 5],
    ambientColor: '#f59e0b',
    tag: 'Architectural Wonder',
    altitude: '3,100m Above Abyss',
    biomeType: 'Sanctuary Highlands',
    features: ['Grand Arched Skybridge', 'Hovering Keystone Altar', 'Runic Sun Pavilions', 'Gilded Observation Spires'],
  },
  {
    id: 'aurora-forest',
    name: 'Aurora Forest',
    subtitle: 'Bioluminescent Canopy',
    description: 'A magical forest with glowing vegetation and floating particles. Ancient spiral trees glow with living phosphorescence under the starry firmament.',
    lore: 'The flora of Aurora Forest absorbs stellar radiation and converts it into living neon light. Gentle spores rise into the night sky, creating an enchanting perpetual snowfall of light.',
    target: [10, 3.2, 13],
    cameraPos: [19, 9, 23],
    ambientColor: '#a855f7',
    tag: 'Bioluminescent Biome',
    altitude: '2,150m Above Abyss',
    biomeType: 'Luminous Flora',
    features: ['Phosphorescent Canopy Trees', 'Pulsing Biolum Mushrooms', 'Floating Spore Motes', 'Carved Moss Pathway'],
  },
  {
    id: 'cloud-city',
    name: 'Cloud City',
    subtitle: 'High-Altitude Utopia',
    description: 'A futuristic settlement floating among clouds. Sleek hexagonal towers, interconnected transit skyways, and aerial docking platforms.',
    lore: 'Perched along the southwestern cloudbanks, Cloud City represents the technological peak of 3DWorld. Zero-emission aerodynamic architecture lets residents live harmoniously above the mist.',
    target: [-12, 6.0, 11],
    cameraPos: [-22, 13, 20],
    ambientColor: '#06b6d4',
    tag: 'Futuristic Citadel',
    altitude: '2,900m Above Abyss',
    biomeType: 'Aerodynamic Urbanism',
    features: ['Hexagonal Tower Clusters', 'Interconnected Skywalks', 'Aerial Docking Arches', 'Atmospheric Vapor Scrubbers'],
  },
  {
    id: 'portal',
    name: 'The Central Portal',
    subtitle: 'Dimensional Gateway',
    description: 'A large glowing portal structure standing as the island’s centerpiece. Rotating cosmic rings harness the rift between virtual dimensions.',
    lore: 'At the exact geometric heart of 3DWorld stands the Infinity Gateway. Concentric rings of forged celestial obsidian and polished gold spin continuously, channeling the primary rift.',
    target: [0, 3.6, 0],
    cameraPos: [0, 9, 18],
    ambientColor: '#6366f1',
    tag: 'Central Landmark',
    altitude: '2,600m Above Abyss',
    biomeType: 'Dimensional Rift',
    features: ['Dual Counter-Rotating Rings', 'Vortex Singularity Core', 'Runic Stone Dais', 'Ascendant Light Pillar'],
  },
];
