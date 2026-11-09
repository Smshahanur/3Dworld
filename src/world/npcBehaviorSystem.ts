import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import {
  createHumanoidCharacter,
  HumanoidRig,
  HumanoidOptions,
  HumanoidGesture,
  SKIN_TONES,
  HAIR_COLORS,
} from './humanoidCharacterSystem';
import { isPointInDriveableArea } from './collisionSystem';

export interface NPCDialogue {
  greeting: string;
  lore: string;
  scheduleDescription: string;
  advice: string;
}

export interface NPCScheduleSlot {
  startHour: number;
  endHour: number;
  activity: string;
  locationName: string;
  gesture: HumanoidGesture;
  targetPos: { x: number; z: number };
  isSitting?: boolean;
}

export interface NPCProfile {
  id: string;
  name: string;
  district: 'rural' | 'modern' | 'capital';
  role: string;
  bio: string;
  avatarOptions: HumanoidOptions;
  schedule: NPCScheduleSlot[];
  dialogue: NPCDialogue;
  path: { x: number; z: number; yieldDuration?: number }[];
  baseSpeed: number;
  walkSpeed: number;
  chairPosition?: { x: number; y: number; z: number; rotationY: number };
}

export interface ActiveNPCEntity {
  profile: NPCProfile;
  group: THREE.Group;
  rig: HumanoidRig;
  currentSegment: number;
  segmentProgress: number;
  isPausing: boolean;
  pauseTimer: number;
  walkCycle: number;
  heading: number;
  currentGesture: HumanoidGesture;
  currentActivity: string;
  currentLocationName: string;
  isInteractingWithPlayer: boolean;
  interactionCooldown: number;
}

export interface WorldInteractionSpot {
  id: string;
  title: string;
  district: 'rural' | 'modern' | 'capital';
  category: 'cafe' | 'shop' | 'fountain' | 'bench' | 'transit' | 'park' | 'landmark' | 'playground';
  position: { x: number; y: number; z: number };
  radius: number;
  actionLabel: string;
  description: string;
  details: string[];
  options: { label: string; actionId: string; soundType?: string }[];
}

export const WORLD_INTERACTION_SPOTS: WorldInteractionSpot[] = [
  // 1. Rural General Store & Farm Stand
  {
    id: 'spot_rural_farm_stand',
    title: 'Rural General Store & Organic Farm Stand',
    district: 'rural',
    category: 'shop',
    position: { x: -110, y: 0.1, z: -10 },
    radius: 3.8,
    actionLabel: 'Inspect Farm Goods',
    description: 'Freshly harvested crops, local wild honeycomb, and artisanal hand-milled sourdough flour from the western fields.',
    details: [
      '• Fresh Golden Wheat Bushels: Harvested this morning from Rural Village fields.',
      '• Meadow Wildflower Honey: Gathered from nearby sunflower pastures.',
      '• Handcrafted Clay Pottery: Made by local artisans at the Millpond kiln.',
    ],
    options: [
      { label: 'Taste Wildflower Honey', actionId: 'taste_honey', soundType: 'chime' },
      { label: 'Ask About Next Harvest', actionId: 'ask_harvest', soundType: 'npc' },
    ],
  },

  // 2. Village Spring Well & Grain Mill
  {
    id: 'spot_rural_well',
    title: 'Historic Village Spring Well & Windmill',
    district: 'rural',
    category: 'landmark',
    position: { x: -98, y: 0.1, z: -24 },
    radius: 3.5,
    actionLabel: 'Draw Spring Water',
    description: 'A stone well fed by pristine alpine aquifers, standing beside the iconic timber windmill powering the village millstones.',
    details: [
      '• Water Source: High-elevation glacier runoff filtering through limestone bedrock.',
      '• Windmill Rotation: Wind-harnessed mechanical power grinding grain for the entire district.',
    ],
    options: [
      { label: 'Drink Fresh Spring Water', actionId: 'drink_water', soundType: 'water' },
      { label: 'Inspect Millstones', actionId: 'inspect_mill', soundType: 'chime' },
    ],
  },

  // 3. Modern Village Plaza Cafe
  {
    id: 'spot_modern_cafe',
    title: 'Modern Village Plaza Bistro & Cafe',
    district: 'modern',
    category: 'cafe',
    position: { x: -18, y: 0.1, z: 2 },
    radius: 3.6,
    actionLabel: 'Order Coffee & Pastries',
    description: 'A vibrant outdoor espresso bar and community gathering spot overlooking the central fountain and tree-lined avenues.',
    details: [
      '• Signature Espresso: Locally roasted organic fair-trade Ethiopian blend.',
      '• Matcha Blossom Latte: Japanese ceremonial green tea with oat foam.',
      '• Fresh Bakery: Warm butter croissants and pistachio swirls.',
    ],
    options: [
      { label: 'Order Double Espresso', actionId: 'order_espresso', soundType: 'chime' },
      { label: 'Order Matcha Blossom Latte', actionId: 'order_matcha', soundType: 'chime' },
      { label: 'Sit at Patio Table', actionId: 'sit_patio', soundType: 'sit' },
    ],
  },

  // 4. Central Park Wishing Fountain
  {
    id: 'spot_central_fountain',
    title: 'Central Park Crystal Fountain',
    district: 'modern',
    category: 'fountain',
    position: { x: 20, y: 0.1, z: -6 },
    radius: 4.2,
    actionLabel: 'Make a Wish',
    description: 'A grand multi-tiered stone fountain with illuminated water jets surrounded by flowering lavender beds and park benches.',
    details: [
      '• Tradition: Residents toss copper coins into the central tier for good fortune and clear skies.',
      '• Ambient Aeration: Purifies and circulates water feeding the park duck ponds.',
    ],
    options: [
      { label: 'Toss a Lucky Coin', actionId: 'toss_coin', soundType: 'water' },
      { label: 'Sit on Fountain Rim', actionId: 'sit_fountain', soundType: 'sit' },
    ],
  },

  // 5. Children\'s Playground
  {
    id: 'spot_modern_playground',
    title: 'Central Park Children\'s Adventure Playground',
    district: 'modern',
    category: 'playground',
    position: { x: 22, y: 0.1, z: 12 },
    radius: 3.8,
    actionLabel: 'Play on Swings',
    description: 'A family playground featuring timber swings, a see-saw, sandbox, and safety-surfaced climbing mound.',
    details: [
      '• Active Equipment: Twin pendulum swings, wooden balance seesaw, and play cabin.',
      '• Community Vibe: Children and families gather here throughout the sunny afternoon.',
    ],
    options: [
      { label: 'Swing on Timber Swing', actionId: 'use_swing', soundType: 'chime' },
      { label: 'Rest on Shaded Bench', actionId: 'sit_bench_park', soundType: 'sit' },
    ],
  },

  // 6. Botanical Conservatory
  {
    id: 'spot_modern_conservatory',
    title: 'Glass Conservatory & Butterfly Sanctuary',
    district: 'modern',
    category: 'park',
    position: { x: 28, y: 0.1, z: 32 },
    radius: 4.0,
    actionLabel: 'Explore Exotic Flora',
    description: 'A geodesic glass pavilion housing rare subtropical orchids, ferns, and fluttering native swallowtail butterflies.',
    details: [
      '• Butterfly Species: Blue Morphos, Emerald Swallowtails, and Monarchs.',
      '• Climate Control: Solar-heated passive geothermal misting system.',
    ],
    options: [
      { label: 'Watch Fluttering Butterflies', actionId: 'watch_butterflies', soundType: 'bird' },
      { label: 'Study Orchid Specimens', actionId: 'study_orchids', soundType: 'chime' },
    ],
  },

  // 7. Riverfront Fishing Jetty & Promenade
  {
    id: 'spot_river_jetty',
    title: 'Lake District Boardwalk & Fishing Jetty',
    district: 'modern',
    category: 'landmark',
    position: { x: 43.5, y: 0.1, z: 20 },
    radius: 3.8,
    actionLabel: 'Enjoy Water View',
    description: 'A wooden timber pier extending into the clear river currents between Modern Village and the Grand Highway Bridge.',
    details: [
      '• Panorama: Uninterrupted views of the river rapids, suspension bridge, and distant Capital skyline.',
      '• River Life: Clear waters with visible river trout and floating water lilies.',
    ],
    options: [
      { label: 'Look Through Scenic Point', actionId: 'view_panorama', soundType: 'water' },
      { label: 'Sit on Pier Bench', actionId: 'sit_pier', soundType: 'sit' },
    ],
  },

  // 7b. Lakeside Promenade Resting Benches
  {
    id: 'spot_lakeside_bench',
    title: 'Lakeside Promenade Resting Benches',
    district: 'modern',
    category: 'bench',
    position: { x: -8, y: 0.1, z: -23 },
    radius: 3.5,
    actionLabel: 'Sit and Relax',
    description: 'Quiet teakwood park benches overlooking the tranquil blue waters of the village lake and distant hills.',
    details: [
      '• Scenic View: Direct sightline across the calm lake waters and water lily pads.',
      '• Rest Spot: Perfect for catching your breath, watching dragonflies, and relaxing.',
    ],
    options: [
      { label: 'Sit on Lakeside Bench', actionId: 'sit_bench_lake', soundType: 'sit' },
      { label: 'Listen to Gentle Waves', actionId: 'listen_waves', soundType: 'water' },
    ],
  },

  // 8. Modern Village Boulevard Bus Stop
  {
    id: 'spot_modern_bus_stop',
    title: 'Rapid Electric Transit Bus Stop Shelter',
    district: 'modern',
    category: 'transit',
    position: { x: -8, y: 0.1, z: 5.5 },
    radius: 3.2,
    actionLabel: 'Check Transit Timetable',
    description: 'A modern illuminated glass shelter serving the Cyan City Eco Bus connecting Modern Village to Capital Town.',
    details: [
      '• Frequency: Electric buses depart every 20 in-world minutes across Bridge 2.',
      '• Fleet: Zero-emission autonomous electric transit shuttles.',
    ],
    options: [
      { label: 'View District Transit Map', actionId: 'view_transit_map', soundType: 'chime' },
      { label: 'Wait for Next Bus', actionId: 'wait_bus', soundType: 'sit' },
    ],
  },

  // 9. Capital Grand Transit Terminal
  {
    id: 'spot_capital_terminal',
    title: 'Capital Town Grand Inter-District Transit Terminal',
    district: 'capital',
    category: 'transit',
    position: { x: 88, y: 0.1, z: -10 },
    radius: 4.5,
    actionLabel: 'Enter Terminal Concourse',
    description: 'The monumental central station linking inter-district express lines, autonomous shuttles, and commercial hyper-corridors.',
    details: [
      '• Connected Lines: Line 1 (Modern Village Express), Line 2 (Capital Ringway).',
      '• Facilities: Ticket concourse, real-time departure boards, and skyway walkways.',
    ],
    options: [
      { label: 'Inspect High-Speed Rail Timetable', actionId: 'inspect_trains', soundType: 'chime' },
      { label: 'Consult Station Attendant', actionId: 'talk_attendant', soundType: 'npc' },
    ],
  },

  // 10. Capital City Hall & Civic Plaza
  {
    id: 'spot_capital_city_hall',
    title: 'Capital City Hall & Municipal Governance Centre',
    district: 'capital',
    category: 'landmark',
    position: { x: 114, y: 0.1, z: -24 },
    radius: 4.2,
    actionLabel: 'Read Civic Council Board',
    description: 'The neoclassical stone edifice housing the governance chambers, public archives, and community virtual universe forums.',
    details: [
      '• Public Notices: Upcoming 3DWorld urban expansion votes and clean energy grants.',
      '• Civic Architecture: Marble colonnades, bronze double doors, and soaring dome.',
    ],
    options: [
      { label: 'Read Public Bulletin Board', actionId: 'read_bulletin', soundType: 'chime' },
      { label: 'Admire Civic Architecture', actionId: 'admire_civic', soundType: 'chime' },
    ],
  },

  // 11. Capital Grand Obelisk & Reflecting Pool
  {
    id: 'spot_capital_obelisk',
    title: 'Grand Monumental Obelisk & Cascading Fountains',
    district: 'capital',
    category: 'landmark',
    position: { x: 134, y: 0.1, z: 20 },
    radius: 4.5,
    actionLabel: 'Inspect Monument',
    description: 'A 24-meter monolithic titanium-granite obelisk rising from an illuminated turquoise reflecting pool in eastern Capital Town.',
    details: [
      '• Dedication: Commemorating the creators and digital explorers who built 3DWorld.',
      '• Night Illumination: Synchronized vertical LED uplights and dancing fountains.',
    ],
    options: [
      { label: 'Read Founder\'s Plaque', actionId: 'read_plaque', soundType: 'chime' },
      { label: 'Sit by Reflecting Pool', actionId: 'sit_obelisk', soundType: 'sit' },
    ],
  },
];

// Rich Cast of 18 Intelligent NPCs Across All 3 Districts
export const NPC_PROFILES: NPCProfile[] = [
  // -------------------------------------------------------------------------
  // DISTRICT 1: RURAL VILLAGE
  // -------------------------------------------------------------------------
  {
    id: 'npc_rural_liam',
    name: 'Farmer Liam',
    district: 'rural',
    role: 'Organic Crop Specialist',
    bio: 'Dedicated heirloom wheat and vegetable farmer who knows every acre of the western pastures.',
    baseSpeed: 1.15,
    walkSpeed: 1.15,
    avatarOptions: {
      gender: 'male',
      hairStyle: 'explorer_hat',
      outfitType: 'rural_villager',
      primaryColor: 0xd97706,
      pantsColor: 0x57534e,
      skinTone: SKIN_TONES.bronze,
      hairColor: HAIR_COLORS.silver,
    },
    path: [
      { x: -112, z: -16, yieldDuration: 2.5 },
      { x: -104, z: -16 },
      { x: -104, z: -24, yieldDuration: 3.0 },
      { x: -116, z: -24 },
      { x: -116, z: -16 },
    ],
    schedule: [
      {
        startHour: 5.5,
        endHour: 10.0,
        activity: 'Tending Sunflower & Wheat Fields',
        locationName: 'Western Wheat Croplands',
        gesture: 'work',
        targetPos: { x: -112, z: -16 },
      },
      {
        startHour: 10.0,
        endHour: 14.5,
        activity: 'Harvesting Grain & Milling at Windmill',
        locationName: 'Historic Village Mill',
        gesture: 'work',
        targetPos: { x: -104, z: -24 },
      },
      {
        startHour: 14.5,
        endHour: 18.0,
        activity: 'Delivering Fresh Produce to General Store',
        locationName: 'Rural Farm Stand',
        gesture: 'walk',
        targetPos: { x: -116, z: -16 },
      },
      {
        startHour: 18.0,
        endHour: 22.0,
        activity: 'Resting on Wooden Porch Bench',
        locationName: 'Rustic Homestead Porch',
        gesture: 'sit',
        targetPos: { x: -120, z: -20 },
        isSitting: true,
      },
      {
        startHour: 22.0,
        endHour: 5.5,
        activity: 'Resting Indoors',
        locationName: 'Homestead Bedroom',
        gesture: 'idle',
        targetPos: { x: -122, z: -22 },
      },
    ],
    dialogue: {
      greeting: 'Good day, traveler! Welcome to our quiet corner of 3DWorld.',
      lore: 'Our soil here is fed by natural mountain spring runoff. That’s why our heirloom wheat grows tall and golden.',
      scheduleDescription: 'I start in the fields at dawn, mill wheat by midday, and sit out here on the porch when the sun dips behind the hills.',
      advice: 'If you are heading east toward Modern Village, cross Bridge 1 carefully—the river current is strong today!',
    },
  },

  {
    id: 'npc_rural_nora',
    name: 'Farmer Nora',
    district: 'rural',
    role: 'Orchard & Apiary Keeper',
    bio: 'Caretaker of the village cherry and apple orchards, and producer of wildflower honey.',
    baseSpeed: 1.18,
    walkSpeed: 1.18,
    avatarOptions: {
      gender: 'female',
      hairStyle: 'bun',
      outfitType: 'rural_villager',
      primaryColor: 0x059669,
      pantsColor: 0x334155,
      skinTone: SKIN_TONES.warmBeige,
      hairColor: HAIR_COLORS.chestnut,
    },
    path: [
      { x: -94, z: -32, yieldDuration: 2.0 },
      { x: -88, z: -32 },
      { x: -88, z: -20, yieldDuration: 2.0 },
      { x: -94, z: -20 },
    ],
    schedule: [
      {
        startHour: 6.0,
        endHour: 11.0,
        activity: 'Tending Orchard & Beehives',
        locationName: 'Apple & Honey Orchard',
        gesture: 'work',
        targetPos: { x: -94, z: -32 },
      },
      {
        startHour: 11.0,
        endHour: 16.0,
        activity: 'Packing Honeycomb Jars',
        locationName: 'Farm Stand Prep Table',
        gesture: 'work',
        targetPos: { x: -88, z: -20 },
      },
      {
        startHour: 16.0,
        endHour: 20.0,
        activity: 'Strolling through Orchard Trails',
        locationName: 'Orchard Garden Path',
        gesture: 'walk',
        targetPos: { x: -94, z: -20 },
      },
      {
        startHour: 20.0,
        endHour: 6.0,
        activity: 'Resting by Hearthfire',
        locationName: 'Orchard Cottage',
        gesture: 'sit',
        targetPos: { x: -96, z: -34 },
      },
    ],
    dialogue: {
      greeting: 'Hello there! Smell the apple blossoms in the breeze?',
      lore: 'The bees have been especially busy this season. We supplied fresh honeycomb to the Plaza Cafe across the bridge.',
      scheduleDescription: 'Mornings are best for checking the hives before the afternoon heat sets in.',
      advice: 'The western windmill viewpoint offers the best sunset view over the mountains.',
    },
  },

  {
    id: 'npc_rural_elder',
    name: 'Grandpa Alistair',
    district: 'rural',
    role: 'Village Elder & Woodcrafter',
    bio: 'The longest-standing resident of the Rural Village, revered for his master carpentry and folklore.',
    baseSpeed: 0.9,
    walkSpeed: 0.9,
    chairPosition: { x: -124, y: 0.22, z: 12, rotationY: 0 },
    avatarOptions: {
      gender: 'male',
      hairStyle: 'short_crop',
      outfitType: 'traditional',
      primaryColor: 0x78716c,
      pantsColor: 0x292524,
      skinTone: SKIN_TONES.warmBeige,
      hairColor: HAIR_COLORS.silver,
    },
    path: [
      { x: -124, z: 12, yieldDuration: 5.0 },
      { x: -118, z: 12 },
      { x: -118, z: 8 },
      { x: -124, z: 8 },
    ],
    schedule: [
      {
        startHour: 6.5,
        endHour: 12.0,
        activity: 'Sitting on Front Porch Bench',
        locationName: 'Homestead Carved Bench',
        gesture: 'sit',
        targetPos: { x: -124, z: 12 },
        isSitting: true,
      },
      {
        startHour: 12.0,
        endHour: 15.0,
        activity: 'Hand-Whittling Wooden Toys',
        locationName: 'Porch Workshop Table',
        gesture: 'work',
        targetPos: { x: -124, z: 10 },
      },
      {
        startHour: 15.0,
        endHour: 19.5,
        activity: 'Greeting Passing Neighbors',
        locationName: 'Garden Path Gate',
        gesture: 'wave',
        targetPos: { x: -118, z: 12 },
      },
      {
        startHour: 19.5,
        endHour: 6.5,
        activity: 'Resting Indoors',
        locationName: 'Homestead Hearth',
        gesture: 'idle',
        targetPos: { x: -124, z: 14 },
      },
    ],
    dialogue: {
      greeting: 'Sit down for a spell, young traveler. Rest your weary boots.',
      lore: 'I helped lay the foundations of the very first bridge across the western river. Back then, it was all timber and rope.',
      scheduleDescription: 'At my age, I take my mornings slow on this bench, whittle cedar, and watch the clouds roll past.',
      advice: 'The world grows faster every day, but peace is always waiting right here in the village.',
    },
  },

  {
    id: 'npc_rural_child_maya',
    name: 'Young Maya',
    district: 'rural',
    role: 'Village Explorer & Runner',
    bio: 'Energetic village child who loves chasing butterflies and racing along the Millpond trails.',
    baseSpeed: 1.45,
    walkSpeed: 1.45,
    avatarOptions: {
      gender: 'female',
      isChild: true,
      heightScale: 0.68,
      hairStyle: 'braided',
      outfitType: 'casual',
      primaryColor: 0xec4899,
      pantsColor: 0x1e293b,
      skinTone: SKIN_TONES.fair,
      hairColor: HAIR_COLORS.auburn,
    },
    path: [
      { x: -128, z: 14 },
      { x: -116, z: 14, yieldDuration: 1.5 },
      { x: -116, z: 24 },
      { x: -128, z: 24, yieldDuration: 1.5 },
    ],
    schedule: [
      {
        startHour: 7.0,
        endHour: 12.0,
        activity: 'Playing Tag by Millpond',
        locationName: 'Millpond Willow Trail',
        gesture: 'jog',
        targetPos: { x: -124, z: 18 },
      },
      {
        startHour: 12.0,
        endHour: 15.0,
        activity: 'Skipping Stones in Stream',
        locationName: 'Stream Shallows',
        gesture: 'work',
        targetPos: { x: -118, z: 22 },
      },
      {
        startHour: 15.0,
        endHour: 18.5,
        activity: 'Cheering on Returning Farmers',
        locationName: 'Village Crossroads',
        gesture: 'cheer',
        targetPos: { x: -116, z: 14 },
      },
      {
        startHour: 18.5,
        endHour: 7.0,
        activity: 'Asleep in Farmhouse',
        locationName: 'Home Bedroom',
        gesture: 'idle',
        targetPos: { x: -126, z: 16 },
      },
    ],
    dialogue: {
      greeting: 'Tag, you\'re it! Can you run as fast as the river wind?',
      lore: 'I found a secret spot under the willow tree where the swallows build their mud nests every spring!',
      scheduleDescription: 'School is out early, so I play until mama calls for supper when the lanterns turn on.',
      advice: 'If you wave at the swans by the reeds, they bob their heads right back!',
    },
  },

  // -------------------------------------------------------------------------
  // DISTRICT 2: MODERN VILLAGE
  // -------------------------------------------------------------------------
  {
    id: 'npc_modern_chloe',
    name: 'Barista Chloe',
    district: 'modern',
    role: 'Plaza Cafe Head Barista',
    bio: 'Artisan coffee roaster and friendly host of the Modern Village Plaza Cafe.',
    baseSpeed: 1.2,
    walkSpeed: 1.2,
    avatarOptions: {
      gender: 'female',
      hairStyle: 'short_crop',
      outfitType: 'jacket',
      primaryColor: 0x06b6d4,
      pantsColor: 0x0f172a,
      skinTone: SKIN_TONES.fair,
      hairColor: HAIR_COLORS.darkBrown,
    },
    path: [
      { x: -18, z: 0 },
      { x: -18, z: 4, yieldDuration: 2.0 },
      { x: -14, z: 4 },
      { x: -14, z: 0, yieldDuration: 2.0 },
    ],
    schedule: [
      {
        startHour: 6.0,
        endHour: 11.5,
        activity: 'Brewing Morning Espresso & Pour-Overs',
        locationName: 'Plaza Cafe Counter',
        gesture: 'work',
        targetPos: { x: -18, z: 2 },
      },
      {
        startHour: 11.5,
        endHour: 15.0,
        activity: 'Serving Patio Tables & Greeting Guests',
        locationName: 'Cafe Sun Patio',
        gesture: 'wave',
        targetPos: { x: -16, z: 3 },
      },
      {
        startHour: 15.0,
        endHour: 18.5,
        activity: 'Wiping Tables & Prepping Cold Brew',
        locationName: 'Plaza Bistro Deck',
        gesture: 'work',
        targetPos: { x: -18, z: 1 },
      },
      {
        startHour: 18.5,
        endHour: 22.0,
        activity: 'Sitting with Evening Tea',
        locationName: 'Plaza Fountain Bench',
        gesture: 'sit',
        targetPos: { x: -14, z: 2 },
        isSitting: true,
      },
      {
        startHour: 22.0,
        endHour: 6.0,
        activity: 'Resting in Town Center Loft',
        locationName: 'Town Center Apartment',
        gesture: 'idle',
        targetPos: { x: -20, z: -2 },
      },
    ],
    dialogue: {
      greeting: 'Welcome to the Plaza Cafe! Fresh roasted single-origin espresso is ready.',
      lore: 'The plaza is the heartbeat of Modern Village. People stop here on their commute between the rural farms and Capital Town.',
      scheduleDescription: 'I open the cafe at 6:00 sharp. In the afternoon, I love watching the children play across the lawn.',
      advice: 'Try the Matcha Blossom Latte—it’s infused with lavender from Central Park!',
    },
  },

  {
    id: 'npc_modern_alex',
    name: 'Alex Turner',
    district: 'modern',
    role: 'Digital Nomad & Metaverse Engineer',
    bio: 'Software engineer building real-time 3D interactive experiences while enjoying outdoor cafe life.',
    baseSpeed: 1.15,
    walkSpeed: 1.15,
    chairPosition: { x: -15, y: 0.18, z: 4, rotationY: Math.PI / 2 },
    avatarOptions: {
      gender: 'male',
      hairStyle: 'pompadour',
      outfitType: 'casual',
      primaryColor: 0x3b82f6,
      pantsColor: 0x1e293b,
      skinTone: SKIN_TONES.olive,
      hairColor: HAIR_COLORS.black,
    },
    path: [
      { x: -15, z: 4, yieldDuration: 4.0 },
      { x: -11, z: 4 },
      { x: -11, z: -2 },
      { x: -15, z: -2 },
    ],
    schedule: [
      {
        startHour: 8.0,
        endHour: 13.0,
        activity: 'Coding at Outdoor Cafe Bistro Table',
        locationName: 'Plaza Cafe Worktable',
        gesture: 'sit',
        targetPos: { x: -15, z: 4 },
        isSitting: true,
      },
      {
        startHour: 13.0,
        endHour: 14.5,
        activity: 'Walking Lunch Break through Park',
        locationName: 'Central Park North Walkway',
        gesture: 'walk',
        targetPos: { x: 12, z: -8 },
      },
      {
        startHour: 14.5,
        endHour: 18.0,
        activity: 'Virtual World Architecture Review',
        locationName: 'Plaza Sun Table',
        gesture: 'sit',
        targetPos: { x: -15, z: 4 },
        isSitting: true,
      },
      {
        startHour: 18.0,
        endHour: 21.5,
        activity: 'Evening Jog around Town Plaza',
        locationName: 'Town Plaza Perimeter',
        gesture: 'jog',
        targetPos: { x: -18, z: 6 },
      },
      {
        startHour: 21.5,
        endHour: 8.0,
        activity: 'Resting Indoors',
        locationName: 'Modern Eco-Loft',
        gesture: 'idle',
        targetPos: { x: -22, z: 4 },
      },
    ],
    dialogue: {
      greeting: 'Hey! Just deploying a fresh shader pass to the virtual universe.',
      lore: 'The network latency across 3DWorld is incredible—our multiplayer avatars sync at 60 frames per second.',
      scheduleDescription: 'I work remotely here by the fountain until sundown, then go for a run around the lake.',
      advice: 'The Creator Pavilion just south of here showcases the full architecture of 3DWorld. Definitely step inside!',
    },
  },

  {
    id: 'npc_modern_marcus',
    name: 'Marcus Green',
    district: 'modern',
    role: 'Central Park Fitness Coach',
    bio: 'Passionate marathon runner and fitness coach leading daily group runs through Central Park.',
    baseSpeed: 2.1,
    walkSpeed: 2.1,
    avatarOptions: {
      gender: 'male',
      hairStyle: 'short_crop',
      outfitType: 'casual',
      primaryColor: 0x10b981,
      pantsColor: 0x0f172a,
      skinTone: SKIN_TONES.bronze,
      hairColor: HAIR_COLORS.black,
    },
    path: [
      { x: 14, z: 8 },
      { x: 26, z: 8, yieldDuration: 1.0 },
      { x: 26, z: -8 },
      { x: 14, z: -8, yieldDuration: 1.0 },
    ],
    schedule: [
      {
        startHour: 6.0,
        endHour: 10.0,
        activity: 'Morning Interval Jogging',
        locationName: 'Central Park Track',
        gesture: 'jog',
        targetPos: { x: 20, z: 0 },
      },
      {
        startHour: 10.0,
        endHour: 14.0,
        activity: 'Hydration & Stretching by Fountain',
        locationName: 'Crystal Fountain Lawn',
        gesture: 'cheer',
        targetPos: { x: 20, z: -6 },
      },
      {
        startHour: 14.0,
        endHour: 18.5,
        activity: 'Afternoon Tempo Run to Lake Boardwalk',
        locationName: 'Lake District Promenade',
        gesture: 'jog',
        targetPos: { x: 38, z: 12 },
      },
      {
        startHour: 18.5,
        endHour: 22.0,
        activity: 'Cool-Down Walk with Friends',
        locationName: 'Central Park South Path',
        gesture: 'walk',
        targetPos: { x: 18, z: 6 },
      },
      {
        startHour: 22.0,
        endHour: 6.0,
        activity: 'Resting for Next Marathon',
        locationName: 'Athlete Residence',
        gesture: 'idle',
        targetPos: { x: 10, z: 14 },
      },
    ],
    dialogue: {
      greeting: 'Keep moving! Beautiful morning for a brisk circuit through the park!',
      lore: 'The air quality in Modern Village is phenomenal thanks to the 10,000 planted oak and pine trees.',
      scheduleDescription: 'Ten kilometers at dawn, stretching at noon, and tempo strides when the afternoon cools down.',
      advice: 'Remember to normalize your diagonal movements—saves energy on long uphill stretches!',
    },
  },

  {
    id: 'npc_modern_dr_aris',
    name: 'Dr. Aris Vance',
    district: 'modern',
    role: 'Botanical Sanctuary Curator',
    bio: 'Respected horticulturist preserving native wetlands and managing the Butterfly Conservatory.',
    baseSpeed: 1.22,
    walkSpeed: 1.22,
    avatarOptions: {
      gender: 'male',
      hairStyle: 'explorer_hat',
      outfitType: 'explorer',
      primaryColor: 0x059669,
      pantsColor: 0x475569,
      skinTone: SKIN_TONES.olive,
      hairColor: HAIR_COLORS.darkBrown,
    },
    path: [
      { x: 26, z: 28, yieldDuration: 2.5 },
      { x: 32, z: 28 },
      { x: 32, z: 38, yieldDuration: 2.5 },
      { x: 26, z: 38 },
    ],
    schedule: [
      {
        startHour: 7.0,
        endHour: 12.0,
        activity: 'Inspecting Subtropical Ferns & Misting',
        locationName: 'Glass Conservatory Dome',
        gesture: 'work',
        targetPos: { x: 28, z: 32 },
      },
      {
        startHour: 12.0,
        endHour: 16.0,
        activity: 'Monitoring Butterfly Emergence',
        locationName: 'Butterfly Habitat Walkway',
        gesture: 'work',
        targetPos: { x: 30, z: 34 },
      },
      {
        startHour: 16.0,
        endHour: 19.5,
        activity: 'Cataloguing Riverbank Wetland Reeds',
        locationName: 'Riverbank Wetland Zone',
        gesture: 'walk',
        targetPos: { x: 34, z: 22 },
      },
      {
        startHour: 19.5,
        endHour: 7.0,
        activity: 'Botanical Research in Laboratory',
        locationName: 'Conservatory Research Annex',
        gesture: 'sit',
        targetPos: { x: 26, z: 30 },
      },
    ],
    dialogue: {
      greeting: 'Welcome to the Conservatory! Tread lightly near the nectar feeders.',
      lore: 'The blue morpho butterflies you see fluttering here were hatched right in our solar incubator.',
      scheduleDescription: 'I tend the humidity controls in the morning and observe butterfly flight patterns in the midday sun.',
      advice: 'The water lilies along the riverbank bloom brightest right around four in the afternoon.',
    },
  },

  {
    id: 'npc_modern_sophie',
    name: 'Sophie Lin',
    district: 'modern',
    role: 'Smart Transit Commuter',
    bio: 'Clean tech analyst commuting between Modern Village and the Capital Financial District.',
    baseSpeed: 1.24,
    walkSpeed: 1.24,
    chairPosition: { x: -8, y: 0.22, z: 6.2, rotationY: Math.PI },
    avatarOptions: {
      gender: 'female',
      hairStyle: 'long_flowing',
      outfitType: 'jacket',
      primaryColor: 0x8b5cf6,
      pantsColor: 0x1e293b,
      skinTone: SKIN_TONES.fair,
      hairColor: HAIR_COLORS.black,
    },
    path: [
      { x: -8, z: 5.5, yieldDuration: 3.5 },
      { x: -14, z: 5.5 },
      { x: -14, z: 1.5, yieldDuration: 1.5 },
      { x: -8, z: 1.5 },
    ],
    schedule: [
      {
        startHour: 7.5,
        endHour: 9.5,
        activity: 'Waiting for Cyan City Transit Bus',
        locationName: 'Boulevard Bus Stop Shelter',
        gesture: 'sit',
        targetPos: { x: -8, z: 5.5 },
        isSitting: true,
      },
      {
        startHour: 9.5,
        endHour: 17.0,
        activity: 'Working at Capital Tech Complex',
        locationName: 'Capital Financial Office',
        gesture: 'work',
        targetPos: { x: 104, z: -16 },
      },
      {
        startHour: 17.0,
        endHour: 19.0,
        activity: 'Evening Return Bus & Plaza Walk',
        locationName: 'Town Plaza Promenade',
        gesture: 'walk',
        targetPos: { x: -12, z: 4 },
      },
      {
        startHour: 19.0,
        endHour: 22.0,
        activity: 'Dining on Cafe Patio',
        locationName: 'Plaza Cafe Patio',
        gesture: 'sit',
        targetPos: { x: -16, z: 2 },
      },
      {
        startHour: 22.0,
        endHour: 7.5,
        activity: 'Resting in Boulevard Condominium',
        locationName: 'Modern Boulevard Apartment',
        gesture: 'idle',
        targetPos: { x: -6, z: 8 },
      },
    ],
    dialogue: {
      greeting: 'Hi! Just catching the next electric bus to Capital Town.',
      lore: 'The autonomous transit system runs smoothly over Bridge 2 without causing any traffic congestion.',
      scheduleDescription: 'I commute across the river every morning and return here to enjoy the quiet evenings.',
      advice: 'The pedestrian crosswalks have automated yield sensors—cars will always stop if you step up to the curb.',
    },
  },

  {
    id: 'npc_modern_david',
    name: 'David Ross',
    district: 'modern',
    role: 'Boardwalk Resident & Angler',
    bio: 'Retired teacher who spends afternoons fly-fishing and watching boats along the riverbank pier.',
    baseSpeed: 1.12,
    walkSpeed: 1.12,
    chairPosition: { x: 43.5, y: 0.22, z: 20, rotationY: -Math.PI / 2 },
    avatarOptions: {
      gender: 'male',
      hairStyle: 'short_crop',
      outfitType: 'casual',
      primaryColor: 0x0284c7,
      pantsColor: 0x334155,
      skinTone: SKIN_TONES.warmBeige,
      hairColor: HAIR_COLORS.silver,
    },
    path: [
      { x: 43.5, z: 20, yieldDuration: 4.0 },
      { x: 38, z: 20 },
      { x: 38, z: 14 },
      { x: 43.5, z: 14 },
    ],
    schedule: [
      {
        startHour: 7.0,
        endHour: 11.5,
        activity: 'Morning Fishing on Timber Pier',
        locationName: 'Riverfront Fishing Pier',
        gesture: 'work',
        targetPos: { x: 43.5, z: 20 },
      },
      {
        startHour: 11.5,
        endHour: 15.5,
        activity: 'Resting on Pier Bench & Watching Bridge',
        locationName: 'Wooden Pier Bench',
        gesture: 'sit',
        targetPos: { x: 43.5, z: 20 },
        isSitting: true,
      },
      {
        startHour: 15.5,
        endHour: 19.5,
        activity: 'Strolling along River Boardwalk',
        locationName: 'Boardwalk Waterfront Trail',
        gesture: 'walk',
        targetPos: { x: 40, z: 16 },
      },
      {
        startHour: 19.5,
        endHour: 7.0,
        activity: 'Relaxing in Waterfront Villa',
        locationName: 'Riverside Villa',
        gesture: 'idle',
        targetPos: { x: 36, z: 24 },
      },
    ],
    dialogue: {
      greeting: 'Ah, look at that water sparkle today! Best spot in the entire universe.',
      lore: 'Underneath Bridge 2, the river forms deep tranquil pools where river trout love to gather.',
      scheduleDescription: 'I cast my line in the morning, read a book in the afternoon, and walk home at dusk.',
      advice: 'Take time to pause on the pier—the view of the grand suspension cables is breathtaking at golden hour.',
    },
  },

  // -------------------------------------------------------------------------
  // DISTRICT 3: CAPITAL TOWN
  // -------------------------------------------------------------------------
  {
    id: 'npc_capital_sterling',
    name: 'Director Sterling Cole',
    district: 'capital',
    role: 'Enterprise Tech Director',
    bio: 'Chief Technology Director at Capital Quantum Tower, advancing virtual world infrastructure.',
    baseSpeed: 1.3,
    walkSpeed: 1.3,
    avatarOptions: {
      gender: 'male',
      hairStyle: 'short_crop',
      outfitType: 'formal_blazer',
      primaryColor: 0x0f172a,
      pantsColor: 0x1e293b,
      skinTone: SKIN_TONES.warmBeige,
      hairColor: HAIR_COLORS.black,
    },
    path: [
      { x: 92, z: -16 },
      { x: 108, z: -16, yieldDuration: 2.0 },
      { x: 108, z: -26 },
      { x: 92, z: -26, yieldDuration: 2.0 },
    ],
    schedule: [
      {
        startHour: 7.5,
        endHour: 9.0,
        activity: 'Commuting from Grand Terminal to Tech Complex',
        locationName: 'Capital Gateway Boulevard',
        gesture: 'walk',
        targetPos: { x: 98, z: -16 },
      },
      {
        startHour: 9.0,
        endHour: 13.0,
        activity: 'Executive Strategy Session in Tech Tower',
        locationName: 'Quantum Tower Executive Suite',
        gesture: 'work',
        targetPos: { x: 108, z: -18 },
      },
      {
        startHour: 13.0,
        endHour: 14.5,
        activity: 'Lunch Stroll through Civic Plaza',
        locationName: 'Capital Civic Plaza',
        gesture: 'walk',
        targetPos: { x: 114, z: -18 },
      },
      {
        startHour: 14.5,
        endHour: 18.5,
        activity: 'Municipal Digital Infrastructure Briefing',
        locationName: 'City Hall Annex',
        gesture: 'work',
        targetPos: { x: 116, z: -22 },
      },
      {
        startHour: 18.5,
        endHour: 22.0,
        activity: 'Dinner at Grand Galleria Terrace',
        locationName: 'Grand Galleria Restaurant',
        gesture: 'sit',
        targetPos: { x: 136, z: -16 },
      },
      {
        startHour: 22.0,
        endHour: 7.5,
        activity: 'Resting in Penthouse Suite',
        locationName: 'Capital Tower Penthouse',
        gesture: 'idle',
        targetPos: { x: 110, z: -24 },
      },
    ],
    dialogue: {
      greeting: 'Good day. Welcome to the administrative core of 3DWorld.',
      lore: 'Capital Town is built on high-density clean energy systems. Every glass panel in our skyscrapers generates solar power.',
      scheduleDescription: 'Full schedule today—reviewing cloud database synchronization and traffic coordination algorithms.',
      advice: 'The Grand Galleria to the east has exceptional rooftop viewpoints overlooking the entire valley.',
    },
  },

  {
    id: 'npc_capital_zaha',
    name: 'Architect Zaha Chen',
    district: 'capital',
    role: 'Principal City Planner',
    bio: 'Visionary architect responsible for the curvilinear civic plazas, obelisk court, and skybridges.',
    baseSpeed: 1.25,
    walkSpeed: 1.25,
    avatarOptions: {
      gender: 'female',
      hairStyle: 'bun',
      outfitType: 'formal_blazer',
      primaryColor: 0x4f46e5,
      pantsColor: 0x1e1b4b,
      skinTone: SKIN_TONES.bronze,
      hairColor: HAIR_COLORS.darkBrown,
    },
    path: [
      { x: 116, z: -20, yieldDuration: 2.0 },
      { x: 128, z: -20 },
      { x: 128, z: -8, yieldDuration: 1.5 },
      { x: 116, z: -8 },
    ],
    schedule: [
      {
        startHour: 8.0,
        endHour: 12.0,
        activity: 'Reviewing Civic Blueprint Proposals',
        locationName: 'City Hall Architecture Bureau',
        gesture: 'work',
        targetPos: { x: 118, z: -24 },
      },
      {
        startHour: 12.0,
        endHour: 15.5,
        activity: 'Inspecting Obelisk Fountain Construction',
        locationName: 'Grand Obelisk Court',
        gesture: 'walk',
        targetPos: { x: 134, z: 18 },
      },
      {
        startHour: 15.5,
        endHour: 19.0,
        activity: 'Walking the Grand Boulevard Sidewalks',
        locationName: 'Capital Grand Boulevard Walkway',
        gesture: 'walk',
        targetPos: { x: 124, z: -12 },
      },
      {
        startHour: 19.0,
        endHour: 22.5,
        activity: 'Evening Tea by Reflecting Pool',
        locationName: 'Obelisk Plaza Terrace',
        gesture: 'sit',
        targetPos: { x: 132, z: 20 },
        isSitting: true,
      },
      {
        startHour: 22.5,
        endHour: 8.0,
        activity: 'Resting in Modern High-Rise',
        locationName: 'Civic Plaza Residence',
        gesture: 'idle',
        targetPos: { x: 120, z: -28 },
      },
    ],
    dialogue: {
      greeting: 'Welcome! Notice how the boulevard sightlines draw your eye directly to the Grand Obelisk?',
      lore: 'We designed the city layout with strict pedestrian priority—every road has grade-separated sidewalks and buffered crosswalks.',
      scheduleDescription: 'I spend my mornings designing in City Hall and my afternoons inspecting the public monuments.',
      advice: 'Stand at the center of Obelisk Court at night; the lighting reflections on the granite are magical.',
    },
  },

  {
    id: 'npc_capital_arthur',
    name: 'Arthur Bell',
    district: 'capital',
    role: 'Landscape Photographer & Traveler',
    bio: 'Globe-trotting virtual photographer documenting monumental architecture and natural lighting.',
    baseSpeed: 1.2,
    walkSpeed: 1.2,
    avatarOptions: {
      gender: 'male',
      hairStyle: 'pompadour',
      outfitType: 'explorer',
      primaryColor: 0xd97706,
      pantsColor: 0x1c1917,
      skinTone: SKIN_TONES.fair,
      hairColor: HAIR_COLORS.auburn,
    },
    path: [
      { x: 130, z: 14, yieldDuration: 3.0 },
      { x: 142, z: 14 },
      { x: 142, z: 26, yieldDuration: 3.0 },
      { x: 130, z: 26 },
    ],
    schedule: [
      {
        startHour: 6.5,
        endHour: 9.5,
        activity: 'Capturing Golden Sunrise Over Bridge 2',
        locationName: 'Grand Bridge West Viewpoint',
        gesture: 'work',
        targetPos: { x: 70, z: 4 },
      },
      {
        startHour: 9.5,
        endHour: 14.0,
        activity: 'Photographing Obelisk Fountains & Reflection',
        locationName: 'Grand Obelisk Reflecting Pool',
        gesture: 'cheer',
        targetPos: { x: 134, z: 20 },
      },
      {
        startHour: 14.0,
        endHour: 18.5,
        activity: 'Editing Prints on Plaza Stone Bench',
        locationName: 'Obelisk Court Granite Bench',
        gesture: 'sit',
        targetPos: { x: 136, z: 24 },
        isSitting: true,
      },
      {
        startHour: 18.5,
        endHour: 21.0,
        activity: 'Night Sky Long-Exposure Photography',
        locationName: 'Capital East Promenade',
        gesture: 'work',
        targetPos: { x: 140, z: 22 },
      },
      {
        startHour: 21.0,
        endHour: 6.5,
        activity: 'Resting in Traveler\'s Inn',
        locationName: 'Capital Boutique Hotel',
        gesture: 'idle',
        targetPos: { x: 126, z: 12 },
      },
    ],
    dialogue: {
      greeting: 'Hold still for a moment—the sunlight bouncing off the obelisk is breathtaking!',
      lore: 'I have traveled across all three districts, and the contrast between the rustic wooden barns and the titanium towers is poetry.',
      scheduleDescription: 'I chase the light—golden hour at dawn by the bridge, midday reflections at the obelisk, and blue hour at dusk.',
      advice: 'Switch the lighting mode to Golden Hour in the bottom dock to see the obelisk glow like burnished gold!',
    },
  },

  {
    id: 'npc_capital_victor',
    name: 'Victor Moreau',
    district: 'capital',
    role: 'Grand Transit Hub Station Master',
    bio: 'Dedicated public transit officer ensuring passenger safety and smooth autonomous vehicle operations.',
    baseSpeed: 1.18,
    walkSpeed: 1.18,
    chairPosition: { x: 88, y: 0.22, z: -10, rotationY: Math.PI / 2 },
    avatarOptions: {
      gender: 'male',
      hairStyle: 'short_crop',
      outfitType: 'builder',
      primaryColor: 0x0284c7,
      pantsColor: 0x0f172a,
      skinTone: SKIN_TONES.warmBeige,
      hairColor: HAIR_COLORS.black,
    },
    path: [
      { x: 86, z: -8, yieldDuration: 2.5 },
      { x: 92, z: -8 },
      { x: 92, z: -14, yieldDuration: 2.5 },
      { x: 86, z: -14 },
    ],
    schedule: [
      {
        startHour: 6.0,
        endHour: 12.0,
        activity: 'Directing Arriving Passenger Shuttles',
        locationName: 'Grand Terminal Platform 1',
        gesture: 'wave',
        targetPos: { x: 88, z: -10 },
      },
      {
        startHour: 12.0,
        endHour: 16.0,
        activity: 'Assisting Commuters & Route Maps',
        locationName: 'Station Information Kiosk',
        gesture: 'work',
        targetPos: { x: 90, z: -12 },
      },
      {
        startHour: 16.0,
        endHour: 20.0,
        activity: 'Supervising Evening Rush Hour',
        locationName: 'Grand Terminal Concourse',
        gesture: 'idle',
        targetPos: { x: 88, z: -8 },
      },
      {
        startHour: 20.0,
        endHour: 23.0,
        activity: 'Sitting on Terminal Bench',
        locationName: 'Platform Rest Bench',
        gesture: 'sit',
        targetPos: { x: 86, z: -10 },
        isSitting: true,
      },
      {
        startHour: 23.0,
        endHour: 6.0,
        activity: 'Resting in Station Quarters',
        locationName: 'Station Master Quarters',
        gesture: 'idle',
        targetPos: { x: 84, z: -14 },
      },
    ],
    dialogue: {
      greeting: 'Welcome to Capital Grand Terminal! All lines operating on schedule.',
      lore: 'Our terminal handles over 5,000 virtual passenger journeys every day between the districts without a single delay.',
      scheduleDescription: 'I manage platform arrivals from morning until evening, then inspect the charging bays before lockup.',
      advice: 'If you want to drive across all three districts yourself, take the highway east across Bridge 2 into Capital Grand Boulevard!',
    },
  },
];

export class NPCBehaviorManager {
  public group = new THREE.Group();
  private npcs: ActiveNPCEntity[] = [];
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;
  private activeNearbyNPC: ActiveNPCEntity | null = null;
  private activeNearbySpot: WorldInteractionSpot | null = null;

  constructor(materials: MaterialLibrary, isSoftwareGl: boolean = false) {
    this.materials = materials;
    this.isSoftwareGl = isSoftwareGl;
    this.group.name = 'NPCBehaviorSystem';

    this.initNPCs();
  }

  private initNPCs() {
    NPC_PROFILES.forEach((profile) => {
      const npcGroup = new THREE.Group();
      npcGroup.name = `NPC_${profile.id}`;

      const startPos = profile.path[0];
      npcGroup.position.set(startPos.x, 0.08, startPos.z);

      const rig = createHumanoidCharacter({
        ...profile.avatarOptions,
        castShadow: !this.isSoftwareGl,
      });
      npcGroup.add(rig.root);

      // Subtle contact shadow
      const shadowGeo = new THREE.RingGeometry(0.14, 0.38, 12);
      shadowGeo.rotateX(-Math.PI / 2);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x000000,
        transparent: true,
        opacity: 0.28,
        depthWrite: false,
      });
      const shadowRing = new THREE.Mesh(shadowGeo, shadowMat);
      shadowRing.position.y = 0.01;
      npcGroup.add(shadowRing);

      // Small compact name tag overhead
      const nameTag = this.createCompactNPCNameTag(profile.name, profile.role, profile.district);
      nameTag.position.set(0, 1.95, 0);
      npcGroup.add(nameTag);

      this.group.add(npcGroup);

      this.npcs.push({
        profile,
        group: npcGroup,
        rig,
        currentSegment: 0,
        segmentProgress: 0,
        isPausing: false,
        pauseTimer: 0,
        walkCycle: Math.random() * 10,
        heading: 0,
        currentGesture: 'none',
        currentActivity: profile.schedule[0].activity,
        currentLocationName: profile.schedule[0].locationName,
        isInteractingWithPlayer: false,
        interactionCooldown: 0,
      });
    });
  }

  private createCompactNPCNameTag(name: string, role: string, district: string): THREE.Sprite {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, 256, 72);

      // Rounded pill background
      ctx.fillStyle = 'rgba(8, 13, 26, 0.82)';
      ctx.strokeStyle = district === 'rural' ? '#f59e0b' : district === 'modern' ? '#06b6d4' : '#6366f1';
      ctx.lineWidth = 2.5;

      const r = 16;
      ctx.beginPath();
      ctx.roundRect(4, 4, 248, 64, r);
      ctx.fill();
      ctx.stroke();

      // Citizen Name
      ctx.font = 'bold 20px "Inter", "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, 128, 25);

      // Role subtitle
      ctx.font = '13px "Inter", system-ui, sans-serif';
      ctx.fillStyle = district === 'rural' ? '#fde68a' : district === 'modern' ? '#a5f3fc' : '#c7d2fe';
      ctx.fillText(role, 128, 48);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.minFilter = THREE.LinearFilter;

    const spriteMat = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
    });

    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.72, 0.20, 1.0);
    return sprite;
  }

  public update(
    dt: number,
    timeOfDayHour: number,
    playerPos: { x: number; y: number; z: number } | null,
    cameraPos: THREE.Vector3
  ) {
    const activeHour = ((timeOfDayHour % 24) + 24) % 24;
    this.activeNearbyNPC = null;
    let closestNPCDist = 3.6;

    for (let i = 0; i < this.npcs.length; i++) {
      const npc = this.npcs[i];

      // Distance to camera for Level-of-Detail & CPU optimization
      const distToCamera = npc.group.position.distanceTo(cameraPos);
      const isCloseToPlayer = distToCamera < 85.0;

      // 1. Resolve Daily Schedule Routine based on current hour
      const matchingSlot = npc.profile.schedule.find(
        (slot) => activeHour >= slot.startHour && activeHour < slot.endHour
      ) || npc.profile.schedule[0];

      npc.currentActivity = matchingSlot.activity;
      npc.currentLocationName = matchingSlot.locationName;

      // Check proximity to player for interaction prompt
      if (playerPos) {
        const pDist = Math.hypot(
          npc.group.position.x - playerPos.x,
          npc.group.position.z - playerPos.z
        );
        if (pDist < closestNPCDist) {
          closestNPCDist = pDist;
          this.activeNearbyNPC = npc;
        }
      }

      // If currently engaged in conversation with the player, turn to face player and pause
      if (npc.isInteractingWithPlayer && playerPos) {
        const faceAngle = Math.atan2(
          playerPos.x - npc.group.position.x,
          playerPos.z - npc.group.position.z
        );
        npc.group.rotation.y += (faceAngle - npc.group.rotation.y) * Math.min(1.0, dt * 6.0);
        npc.rig.updateAnimation(0, false, false, false, 0, dt, 0, 'wave');
        continue;
      }

      // 2. Scheduled Stationary / Seated Activity
      if (matchingSlot.isSitting) {
        if (npc.profile.chairPosition) {
          npc.group.position.set(
            npc.profile.chairPosition.x,
            npc.profile.chairPosition.y,
            npc.profile.chairPosition.z
          );
          npc.group.rotation.y = npc.profile.chairPosition.rotationY;
        }
        npc.currentGesture = 'sit';
        npc.rig.updateAnimation(0, false, false, false, 0, dt, 0, 'sit');
        continue;
      } else if (matchingSlot.gesture === 'work' && matchingSlot.targetPos) {
        // Stationary work (tending crops, whittling, lab research)
        npc.group.position.x += (matchingSlot.targetPos.x - npc.group.position.x) * Math.min(1.0, dt * 2.0);
        npc.group.position.z += (matchingSlot.targetPos.z - npc.group.position.z) * Math.min(1.0, dt * 2.0);
        npc.currentGesture = 'work';
        npc.rig.updateAnimation(0, false, false, false, 0, dt, 0, 'work');
        continue;
      }

      // 3. Dynamic Path Movement & Walkway Navigation
      const path = npc.profile.path;
      const count = path.length;
      if (count < 2) continue;

      const pA = path[npc.currentSegment];
      const nextIdx = (npc.currentSegment + 1) % count;
      const pB = path[nextIdx];

      // Yield / pause timer
      if (npc.isPausing) {
        npc.pauseTimer -= dt;
        npc.currentGesture = matchingSlot.gesture === 'jog' ? 'idle' : matchingSlot.gesture;
        npc.rig.updateAnimation(0, false, false, false, 0, dt, 0, npc.currentGesture);

        if (npc.pauseTimer <= 0) {
          npc.isPausing = false;
          npc.pauseTimer = 0;
        }
        continue;
      }

      const dx = pB.x - pA.x;
      const dz = pB.z - pA.z;
      const segLen = Math.hypot(dx, dz);

      if (segLen > 0.001) {
        const speed = matchingSlot.gesture === 'jog' ? 2.1 : npc.profile.walkSpeed;
        const progressDelta = (speed * dt) / segLen;
        npc.segmentProgress += progressDelta;

        if (npc.segmentProgress >= 1.0) {
          npc.segmentProgress -= 1.0;
          npc.currentSegment = nextIdx;

          if (pB.yieldDuration && pB.yieldDuration > 0) {
            npc.isPausing = true;
            npc.pauseTimer = pB.yieldDuration;
          }
        }

        // Interpolate along path
        npc.group.position.x = pA.x + dx * npc.segmentProgress;
        npc.group.position.z = pA.z + dz * npc.segmentProgress;

        // Turn heading
        const targetHeading = Math.atan2(dx, dz);
        let diff = targetHeading - npc.group.rotation.y;
        while (diff < -Math.PI) diff += Math.PI * 2;
        while (diff > Math.PI) diff -= Math.PI * 2;
        npc.group.rotation.y += diff * Math.min(1.0, dt * 7.0);

        // Articulated animation with speed-synchronized cadence
        if (isCloseToPlayer) {
          npc.walkCycle += dt * speed * 2.6;
          npc.currentGesture = matchingSlot.gesture;
          npc.rig.updateAnimation(
            npc.walkCycle,
            true,
            matchingSlot.gesture === 'jog',
            false,
            0,
            dt,
            speed,
            matchingSlot.gesture === 'jog' ? 'jog' : 'none'
          );
        }
      }
    }

    // 4. Check Proximity to World Interaction Spots
    this.activeNearbySpot = null;
    if (playerPos) {
      let closestSpotDist = 4.0;
      for (const spot of WORLD_INTERACTION_SPOTS) {
        const sDist = Math.hypot(spot.position.x - playerPos.x, spot.position.z - playerPos.z);
        if (sDist < spot.radius && sDist < closestSpotDist) {
          closestSpotDist = sDist;
          this.activeNearbySpot = spot;
        }
      }
    }
  }

  public getActiveNearbyNPC(): ActiveNPCEntity | null {
    return this.activeNearbyNPC;
  }

  public getActiveNearbySpot(): WorldInteractionSpot | null {
    return this.activeNearbySpot;
  }

  public setNPCTalkingState(npcId: string, isTalking: boolean) {
    const npc = this.npcs.find((n) => n.profile.id === npcId);
    if (npc) {
      npc.isInteractingWithPlayer = isTalking;
    }
  }

  public getNPCPositions(): { x: number; z: number; radius: number }[] {
    return this.npcs.map((n) => ({
      x: n.group.position.x,
      z: n.group.position.z,
      radius: 0.65,
    }));
  }

  public dispose() {
    this.npcs.forEach((n) => n.rig.dispose());
    this.npcs = [];
  }
}
