/**
 * 3DWorld Creator Pavilion — Fully Explorable Interior Architecture
 * Features:
 * 1. Automatic sliding double glass doors with proximity sensor
 * 2. Central reception area with 3DWorld branding & visitor terminal
 * 3. Creator workstation with multi-screen displays & futuristic lighting
 * 4. Interactive 3DWorld showcase projecting the virtual universe
 * 5. Digital development journey gallery with illuminated kiosks
 * 6. Beautiful museum portrait display of Shahanur Mollah
 * 7. Relaxation lounge with designer sofa, indoor plants & glass views
 * 8. Rooftop viewing area with panoramic village binoculars & glass balustrades
 */

import * as THREE from 'three';
import { MaterialLibrary } from './materials';

export interface PavilionInteractionPoint {
  id: 'reception' | 'workstation' | 'showcase' | 'gallery' | 'portrait' | 'lounge' | 'rooftop' | 'exit';
  title: string;
  subtitle: string;
  category: 'Reception' | 'Workstation' | 'Showcase' | 'Gallery' | 'Creator' | 'Lounge' | 'Rooftop' | 'Exit';
  position: [number, number, number]; // World coordinate
  interactionRadius: number;
  description: string;
  details: string[];
  metrics?: { label: string; value: string }[];
  actionLabel?: string;
  actionUrl?: string;
}

export const PAVILION_INTERACTION_POINTS: PavilionInteractionPoint[] = [
  {
    id: 'reception',
    title: '3DWorld Creator Studio Reception',
    subtitle: 'Visitor Welcome & Universe Directory',
    category: 'Reception',
    position: [26.5, 1.2, 15.0],
    interactionRadius: 2.5,
    description: 'The welcoming entrance atrium of the 3DWorld Creator Studio, designed to orient visitors exploring the virtual universe.',
    details: [
      'Central concierge console displaying live 3DWorld branding and district status.',
      'Access hub leading to the Creator Workstation, Universe Showcase, Development Gallery, and Rooftop Terrace.',
      'Designed with sustainable architectural finishes: polished terrazzo, brushed titanium, and warm cyan ambient illumination.',
    ],
    metrics: [
      { label: 'Studio Hours', value: 'Open 24/7 Virtual' },
      { label: 'Location', value: 'Modern Village Gardens' },
      { label: 'Elevation', value: '10m Garden Level' },
    ],
  },
  {
    id: 'workstation',
    title: 'Creator Engineering Workstation',
    subtitle: 'Three.js Engine, Physics & Procedural World Algorithms',
    category: 'Workstation',
    position: [30.2, 1.2, 17.2],
    interactionRadius: 2.6,
    description: 'The primary development rig where Shahanur Mollah engineers 3DWorld’s procedural world generation, swept collision physics, and real-time graphics pipeline.',
    details: [
      'Triple curved ultra-wide monitors displaying active Three.js shader code, EV vehicle telemetry, and spatial collision graphs.',
      'Substepping swept collision detection ensuring zero vehicle-building overlap and smooth lane navigation across all 3 districts.',
      'Real-time PBR material shaders with procedural asphalt, granite, water ripples, and diurnal sky dome lighting.',
      'Futuristic cyan and turquoise bias lighting matching the virtual universe aesthetic.',
    ],
    metrics: [
      { label: 'Core Engine', value: 'Three.js r187' },
      { label: 'Physics Model', value: 'Kinematic Substepping' },
      { label: 'Road Protection', value: 'Authoritative Corridor Audit' },
      { label: 'Target Performance', value: '60 FPS Ultra-Smooth' },
    ],
  },
  {
    id: 'showcase',
    title: 'Interactive 3DWorld Showcase',
    subtitle: 'Holographic Connected Universe Model',
    category: 'Showcase',
    position: [28.6, 1.2, 13.0],
    interactionRadius: 2.6,
    description: 'An elevated illuminated pedestal projecting a dynamic, rotating 3D holographic model of the entire connected universe.',
    details: [
      'District 1: Pastoral Rural Village featuring clay cottages, tilled croplands, community stone well, and village pond.',
      'District 2: Contemporary Modern Village with Town Center plaza, Central Park grand fountain, Botanical Gardens, and Lake District.',
      'District 3: Metropolitan Capital Town with high-density commercial CBD, City Hall, and Grand Obelisk.',
      'Trans-district continuity across Bridge 1 (West River Bridge) and Bridge 2 (Capital Grand Highway Bridge).',
    ],
    metrics: [
      { label: 'Connected Districts', value: '3 Districts' },
      { label: 'Procedural Meshes', value: '2,240+ Meshes' },
      { label: 'Active Traffic', value: '8 Autonomous Vehicles' },
      { label: 'Traversability', value: '100% Unbroken' },
    ],
  },
  {
    id: 'gallery',
    title: 'Digital Development Gallery',
    subtitle: 'Milestones & Architectural Evolution',
    category: 'Gallery',
    position: [27.5, 1.2, 11.8],
    interactionRadius: 2.6,
    description: 'A dedicated exhibition wall chronicling the iterative development journey of 3DWorld from initial proof-of-concept to a living virtual universe.',
    details: [
      'Phase 1: Procedural Foundation — Initial Town Center layout, electric roadster physics, and day/night cycle.',
      'Phase 2: Three Connected Districts — Expansion into Rural Village and Capital Town CBD with protected road corridors.',
      'Phase 3: Living Nature & River System — Dynamic water shaders, riverbanks, suspension bridges, and flocking birds.',
      'Phase 4: Creator Experience & Living World — Fully explorable Creator Pavilion, real-time multiplayer, and interactive build mode.',
    ],
    metrics: [
      { label: 'Development Milestones', value: '4 Major Releases' },
      { label: 'Zero Asset Loss', value: '100% Procedural' },
      { label: 'Multiplayer Sync', value: 'Live Firebase' },
    ],
  },
  {
    id: 'portrait',
    title: 'Shahanur Mollah',
    subtitle: 'Creator & Developer of 3DWorld',
    category: 'Creator',
    position: [31.2, 1.4, 15.0],
    interactionRadius: 2.6,
    description: '“3DWorld is created to bring an interactive virtual universe to life, where people can explore, build and experience a connected digital world.”',
    details: [
      'Creator, architect, and software engineer behind 3DWorld — Virtual Universe.',
      'Specializing in real-time WebGL, Three.js spatial simulations, interactive physics, and modern web applications.',
      'Connect on Instagram for project updates, behind-the-scenes architecture, and new virtual universe features.',
    ],
    metrics: [
      { label: 'Role', value: 'Creator & Developer' },
      { label: 'Platform', value: '3DWorld' },
      { label: 'Handle', value: '@shahanurmollah__' },
    ],
    actionLabel: 'Visit Instagram Profile',
    actionUrl: 'https://www.instagram.com/shahanurmollah__?mdxt=MTl6cTdzMmwyYWx3dA==',
  },
  {
    id: 'lounge',
    title: 'Creator Studio Relaxation Lounge',
    subtitle: 'Hospitality & Botanical Garden Overlook',
    category: 'Lounge',
    position: [25.4, 1.0, 17.5],
    interactionRadius: 2.5,
    description: 'A comfortable hospitality seating area with designer furniture and indoor tropical plants, framed by floor-to-ceiling glass windows looking out into the botanical gardens.',
    details: [
      'Designer L-shaped sectional sofa in contemporary slate fabric with turquoise accent cushions.',
      'Smoked glass coffee table with 3DWorld concept art book and designer coffee service.',
      'Indoor architectural plants: Fiddle-Leaf Fig, Monstera Deliciosa, and Snake Plant in matte ceramic pots.',
      'Natural daylight streaming through unobstructed panoramic glass curtain walls.',
    ],
  },
  {
    id: 'rooftop',
    title: 'Rooftop Sky Viewing Terrace',
    subtitle: '360° Panoramic Village & Bridge Observation',
    category: 'Rooftop',
    position: [27.5, 4.3, 15.0],
    interactionRadius: 2.8,
    description: 'An open-air observation deck on the roof of the pavilion, complete with high-magnification binoculars, teak decking, and structural glass balustrades.',
    details: [
      'High-power observation telescope overlooking Modern Village Town Center, East Boulevard traffic, and the Grand River Bridge.',
      'Teak hardwood decking with recessed solar step lights and modern outdoor sun loungers.',
      'Panoramic 360-degree viewpoint for watching day/night atmospheric sunsets and living bird flocks.',
    ],
    metrics: [
      { label: 'Viewing Height', value: '14.5m Above Ground' },
      { label: 'Sightlines', value: 'All 3 Districts' },
      { label: 'Features', value: 'Observation Telescope' },
    ],
    actionLabel: 'Teleport to Rooftop / Ground Floor',
  },
  {
    id: 'exit',
    title: 'Pavilion Entrance & Exit Portal',
    subtitle: 'Automatic Sliding Glass Doors',
    category: 'Exit',
    position: [23.2, 1.0, 15.0],
    interactionRadius: 2.5,
    description: 'Automatic double sliding glass doors connecting the indoor Creator Studio with the outdoor landscaped garden terrace and Botanical Drive walkway.',
    details: [
      'Proximity-activated automatic sliding glass doors with smooth pneumatic dampening.',
      'Direct walking path connecting west to the Botanical Gardens promenade and Town Center boulevard.',
    ],
    actionLabel: 'Step Outside to Village Grounds',
  },
];

export interface CreatorPavilionInteriorResult {
  interiorGroup: THREE.Group;
  slidingDoors: {
    leftDoor: THREE.Mesh;
    rightDoor: THREE.Mesh;
    update: (playerOrCamPos: THREE.Vector3, delta: number) => void;
  };
  clickableObjects: THREE.Mesh[];
  hologramMesh: THREE.Object3D;
  updateAnimation: (delta: number, elapsed: number) => void;
  checkNearInteraction: (pos: THREE.Vector3) => PavilionInteractionPoint | null;
}

/**
 * Builds the complete explorable interior of the Creator Pavilion
 */
export function createCreatorPavilionInterior(
  materials: MaterialLibrary,
  clickableBuildings: THREE.Mesh[]
): CreatorPavilionInteriorResult {
  const interiorGroup = new THREE.Group();
  interiorGroup.name = 'creator-pavilion-interior';

  // Base coordinates: Pavilion center is at world (27.5, 0, 15.0)
  // Local origin (0, 0, 0) corresponds to world (27.5, 0, 15.0)
  const bWidth = 8.0;   // X from -4.0 to +4.0 (world X 23.5 to 31.5)
  const bDepth = 7.0;   // Z from -3.5 to +3.5 (world Z 11.5 to 18.5)
  const floorY = 0.34;  // Ground floor finished surface
  const ceilingY = 3.95; // Underside of roof slab

  // Specialized PBR & Glow Materials
  const turquoiseGlow = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.95,
  });

  const cyanGlow = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.9,
  });

  const warmGold = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.25,
    metalness: 0.85,
  });

  const sofaFabric = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.05,
  });

  const sofaCushionTeal = new THREE.MeshStandardMaterial({
    color: 0x0d9488,
    roughness: 0.75,
    metalness: 0.1,
  });

  const interiorFloorMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.2,
    metalness: 0.1,
  });

  const glassRailingMat = new THREE.MeshStandardMaterial({
    color: 0xe0f2fe,
    transparent: true,
    opacity: 0.45,
    roughness: 0.05,
    metalness: 0.1,
    depthWrite: false,
  });

  // 1. Polished Interior Terrazzo Flooring (Ground Floor)
  const floorGeo = new THREE.BoxGeometry(bWidth - 0.2, 0.08, bDepth - 0.2);
  const floorMesh = new THREE.Mesh(floorGeo, interiorFloorMat);
  floorMesh.position.set(0, floorY + 0.04, 0);
  floorMesh.receiveShadow = true;
  interiorGroup.add(floorMesh);

  // Inset turquoise decorative perimeter floor trim
  const floorBorderGeoX = new THREE.BoxGeometry(bWidth - 0.6, 0.01, 0.06);
  const fbN = new THREE.Mesh(floorBorderGeoX, turquoiseGlow);
  fbN.position.set(0, floorY + 0.085, -bDepth / 2 + 0.4);
  interiorGroup.add(fbN);

  const fbS = new THREE.Mesh(floorBorderGeoX, turquoiseGlow);
  fbS.position.set(0, floorY + 0.085, bDepth / 2 - 0.4);
  interiorGroup.add(fbS);

  // ===========================================================================
  // 1. MAIN ENTRANCE WITH AUTOMATIC SLIDING GLASS DOORS
  // ===========================================================================
  const doorGroup = new THREE.Group();
  doorGroup.position.set(-bWidth / 2 + 0.05, floorY + 0.08, 0);

  const doorWidth = 1.15;
  const doorHeight = 3.3;
  const doorThickness = 0.04;
  const doorGeo = new THREE.BoxGeometry(doorThickness, doorHeight, doorWidth);

  // Left sliding door (slides north towards Z = -1.6)
  const leftDoor = new THREE.Mesh(doorGeo, glassRailingMat);
  leftDoor.position.set(0, doorHeight / 2, -doorWidth / 2);
  leftDoor.castShadow = true;
  leftDoor.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'exit' };
  clickableBuildings.push(leftDoor);
  doorGroup.add(leftDoor);

  // Right sliding door (slides south towards Z = +1.6)
  const rightDoor = new THREE.Mesh(doorGeo, glassRailingMat);
  rightDoor.position.set(0, doorHeight / 2, doorWidth / 2);
  rightDoor.castShadow = true;
  rightDoor.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'exit' };
  clickableBuildings.push(rightDoor);
  doorGroup.add(rightDoor);

  // Stainless steel vertical handles
  const handleGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.2, 8);
  const handleL = new THREE.Mesh(handleGeo, materials.metalSteel);
  handleL.position.set(-0.04, doorHeight / 2 - 0.2, -0.1);
  leftDoor.add(handleL);

  const handleR = new THREE.Mesh(handleGeo, materials.metalSteel);
  handleR.position.set(-0.04, doorHeight / 2 - 0.2, 0.1);
  rightDoor.add(handleR);

  // Overhead door sensor & glowing activation beam
  const sensorGeo = new THREE.BoxGeometry(0.12, 0.1, 2.5);
  const sensor = new THREE.Mesh(sensorGeo, materials.modernDarkSlate);
  sensor.position.set(0, doorHeight + 0.06, 0);
  doorGroup.add(sensor);

  const sensorLight = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.02, 2.3), turquoiseGlow);
  sensorLight.position.set(-0.06, doorHeight + 0.06, 0);
  doorGroup.add(sensorLight);

  interiorGroup.add(doorGroup);

  // ===========================================================================
  // 2. CENTRAL RECEPTION AREA DISPLAYING 3DWORLD BRANDING
  // ===========================================================================
  const receptionGroup = new THREE.Group();
  receptionGroup.position.set(-1.0, floorY + 0.08, 0);

  // Curved reception counter base in white stucco
  const counterGeo = new THREE.CylinderGeometry(1.3, 1.4, 1.05, 16, 1, false, Math.PI * 0.25, Math.PI * 1.5);
  const counter = new THREE.Mesh(counterGeo, materials.modernWhiteStucco);
  counter.position.y = 1.05 / 2;
  counter.rotation.y = Math.PI / 2;
  counter.castShadow = true;
  counter.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'reception' };
  clickableBuildings.push(counter);
  receptionGroup.add(counter);

  // Polished black granite counter top
  const counterTopGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.08, 16, 1, false, Math.PI * 0.25, Math.PI * 1.5);
  const counterTop = new THREE.Mesh(counterTopGeo, materials.modernDarkSlate);
  counterTop.position.y = 1.05 + 0.04;
  counterTop.rotation.y = Math.PI / 2;
  receptionGroup.add(counterTop);

  // Glowing 3DWorld Logo on front of reception desk
  const logoGeo = new THREE.PlaneGeometry(0.9, 0.35);
  logoGeo.rotateY(-Math.PI / 2);
  const logoCanvas = document.createElement('canvas');
  logoCanvas.width = 256;
  logoCanvas.height = 128;
  const lctx = logoCanvas.getContext('2d');
  if (lctx) {
    lctx.fillStyle = '#090e1a';
    lctx.fillRect(0, 0, 256, 128);
    lctx.strokeStyle = '#2dd4bf';
    lctx.lineWidth = 4;
    lctx.strokeRect(4, 4, 248, 120);
    lctx.fillStyle = '#f0fdfa';
    lctx.font = 'bold 36px sans-serif';
    lctx.textAlign = 'center';
    lctx.fillText('3DWorld', 128, 54);
    lctx.fillStyle = '#2dd4bf';
    lctx.font = 'bold 18px monospace';
    lctx.fillText('STUDIO RECEPTION', 128, 92);
  }
  const logoTex = new THREE.CanvasTexture(logoCanvas);
  logoTex.colorSpace = THREE.SRGBColorSpace;
  const logoMesh = new THREE.Mesh(logoGeo, new THREE.MeshBasicMaterial({ map: logoTex }));
  logoMesh.position.set(-1.42, 0.6, 0);
  receptionGroup.add(logoMesh);

  // Interactive visitor touchscreen terminal on reception counter
  const terminalBase = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.22, 0.3), materials.metalSteel);
  terminalBase.position.set(-0.6, 1.15, 0);
  receptionGroup.add(terminalBase);

  const terminalScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.22), cyanGlow);
  terminalScreen.position.set(-0.6, 1.28, 0);
  terminalScreen.rotation.y = -Math.PI / 2;
  terminalScreen.rotation.x = -0.3;
  terminalScreen.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'reception' };
  clickableBuildings.push(terminalScreen);
  receptionGroup.add(terminalScreen);

  // Receptionist ergonomic stool
  const stool = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.75, 12), materials.metalBlack);
  stool.position.set(0.4, 0.375, 0);
  receptionGroup.add(stool);

  interiorGroup.add(receptionGroup);

  // ===========================================================================
  // 3. CREATOR WORKSTATION WITH MULTI-SCREENS & FUTURISTIC LIGHTING
  // ===========================================================================
  const workGroup = new THREE.Group();
  workGroup.position.set(2.7, floorY + 0.08, 2.2);

  // Executive walnut & black titanium desk
  const wDeskGeo = new THREE.BoxGeometry(1.1, 0.78, 2.6);
  const wDesk = new THREE.Mesh(wDeskGeo, materials.modernWoodSiding);
  wDesk.position.y = 0.78 / 2;
  wDesk.castShadow = true;
  wDesk.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'workstation' };
  clickableBuildings.push(wDesk);
  workGroup.add(wDesk);

  // Triple ultra-wide curved screens
  const screenPositions = [
    { z: -0.85, rot: 0.22, text: 'THREE.JS CORE' },
    { z: 0.0, rot: 0.0, text: 'SPATIAL TELEMETRY' },
    { z: 0.85, rot: -0.22, text: 'PHYSICS ENGINE' },
  ];

  screenPositions.forEach((sp) => {
    // Monitor casing
    const casing = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.55, 0.82), materials.capitalDarkSteel);
    casing.position.set(0.1, 0.78 + 0.38, sp.z);
    casing.rotation.y = sp.rot;
    casing.castShadow = true;
    workGroup.add(casing);

    // Screen display (procedural code/telemetry)
    const scrCanvas = document.createElement('canvas');
    scrCanvas.width = 256;
    scrCanvas.height = 160;
    const sctx = scrCanvas.getContext('2d');
    if (sctx) {
      sctx.fillStyle = '#050c18';
      sctx.fillRect(0, 0, 256, 160);
      sctx.strokeStyle = '#06b6d4';
      sctx.strokeRect(2, 2, 252, 156);
      sctx.fillStyle = '#2dd4bf';
      sctx.font = 'bold 18px monospace';
      sctx.fillText(sp.text, 14, 28);
      sctx.fillStyle = '#94a3b8';
      sctx.font = '12px monospace';
      sctx.fillText('render(scene, camera)', 14, 54);
      sctx.fillText('dt: 0.016s  fps: 60', 14, 76);
      sctx.fillText('obstacles: 0 overlaps', 14, 98);
      sctx.fillText('corridors: protected', 14, 120);
      sctx.fillStyle = '#38bdf8';
      sctx.fillRect(14, 134, 180, 8);
    }
    const scrTex = new THREE.CanvasTexture(scrCanvas);
    scrTex.colorSpace = THREE.SRGBColorSpace;

    const displayGeo = new THREE.PlaneGeometry(0.8, 0.52);
    displayGeo.rotateY(-Math.PI / 2);
    const display = new THREE.Mesh(displayGeo, new THREE.MeshBasicMaterial({ map: scrTex }));
    display.position.set(0.065, 0.78 + 0.38, sp.z);
    display.rotation.y = sp.rot;
    display.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'workstation' };
    clickableBuildings.push(display);
    workGroup.add(display);
  });

  // Mechanical backlit keyboard & gaming mouse
  const kbGeo = new THREE.BoxGeometry(0.2, 0.02, 0.55);
  const kb = new THREE.Mesh(kbGeo, turquoiseGlow);
  kb.position.set(-0.25, 0.79, 0);
  workGroup.add(kb);

  const mouse = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.02, 0.06), materials.metalBlack);
  mouse.position.set(-0.25, 0.79, 0.4);
  workGroup.add(mouse);

  // Futuristic task lamp with cyan glow beam
  const lampPole = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8), materials.metalSteel);
  lampPole.position.set(0.35, 0.78 + 0.4, -1.05);
  workGroup.add(lampPole);

  const lampBar = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.03, 0.7), turquoiseGlow);
  lampBar.position.set(0.15, 0.78 + 0.8, -0.8);
  workGroup.add(lampBar);

  // High-tech ergonomic studio mesh chair
  const chairGroup = new THREE.Group();
  chairGroup.position.set(-0.7, 0, 0);

  const seatMesh = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), materials.capitalDarkSteel);
  seatMesh.position.y = 0.5;
  chairGroup.add(seatMesh);

  const backMesh = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.65, 0.52), materials.capitalDarkSteel);
  backMesh.position.set(-0.25, 0.85, 0);
  chairGroup.add(backMesh);

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), materials.metalSteel);
  stem.position.y = 0.25;
  chairGroup.add(stem);

  workGroup.add(chairGroup);
  interiorGroup.add(workGroup);

  // ===========================================================================
  // 4. INTERACTIVE 3DWORLD SHOWCASE DISPLAYING THE VIRTUAL UNIVERSE
  // ===========================================================================
  const showcaseGroup = new THREE.Group();
  showcaseGroup.position.set(1.1, floorY + 0.08, -2.0);

  // Circular tiered presentation dais
  const daisBase = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.3, 0.35, 24), materials.capitalGranite);
  daisBase.position.y = 0.175;
  daisBase.castShadow = true;
  showcaseGroup.add(daisBase);

  // Glowing turquoise concentric rings
  const daisRing1 = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.025, 8, 32), turquoiseGlow);
  daisRing1.rotation.x = Math.PI / 2;
  daisRing1.position.y = 0.35;
  showcaseGroup.add(daisRing1);

  const daisRing2 = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.02, 8, 32), cyanGlow);
  daisRing2.rotation.x = Math.PI / 2;
  daisRing2.position.y = 0.36;
  showcaseGroup.add(daisRing2);

  // Floating rotating holographic projection of 3DWorld
  const holoRig = new THREE.Group();
  holoRig.position.y = 1.35;

  // Mini holographic globe / island core
  const holoCore = new THREE.Mesh(
    new THREE.SphereGeometry(0.48, 18, 14),
    new THREE.MeshBasicMaterial({ color: 0x2dd4bf, wireframe: true, transparent: true, opacity: 0.85 })
  );
  holoRig.add(holoCore);

  // Outer orbital rings
  const orbit1 = new THREE.Mesh(new THREE.RingGeometry(0.68, 0.72, 32), cyanGlow);
  orbit1.rotation.x = Math.PI / 3;
  holoRig.add(orbit1);

  const orbit2 = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.84, 32), turquoiseGlow);
  orbit2.rotation.y = Math.PI / 4;
  holoRig.add(orbit2);

  // Hologram emitter base cylinder
  const emitter = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.45, 0.55, 16), materials.metalSteel);
  emitter.position.y = 0.625;
  showcaseGroup.add(emitter);

  // Interactive showcase podium panel
  const showcasePodium = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.9, 0.3), materials.modernDarkSlate);
  showcasePodium.position.set(-1.0, 0.45, 0.8);
  showcasePodium.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'showcase' };
  clickableBuildings.push(showcasePodium);
  showcaseGroup.add(showcasePodium);

  const podiumScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.2), turquoiseGlow);
  podiumScreen.position.set(-1.0, 0.92, 0.8);
  podiumScreen.rotation.x = -Math.PI / 4;
  podiumScreen.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'showcase' };
  clickableBuildings.push(podiumScreen);
  showcaseGroup.add(podiumScreen);

  showcaseGroup.add(holoRig);
  interiorGroup.add(showcaseGroup);

  // ===========================================================================
  // 5. DIGITAL GALLERY SHOWING THE DEVELOPMENT JOURNEY OF 3DWORLD
  // ===========================================================================
  const galleryGroup = new THREE.Group();
  galleryGroup.position.set(0, floorY + 0.08, -bDepth / 2 + 0.3);

  const galleryPhases = [
    { title: 'Phase 1: Procedural EV Physics', color: '#38bdf8', x: -2.4 },
    { title: 'Phase 2: Three Connected Districts', color: '#10b981', x: -0.8 },
    { title: 'Phase 3: Living Nature & Rivers', color: '#06b6d4', x: 0.8 },
    { title: 'Phase 4: Creator Studio & Social', color: '#a855f7', x: 2.4 },
  ];

  galleryPhases.forEach((gp) => {
    const kGroup = new THREE.Group();
    kGroup.position.set(gp.x, 0, 0);

    // Kiosk upright frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 2.2, 0.12), materials.capitalDarkSteel);
    frame.position.y = 1.1;
    frame.castShadow = true;
    kGroup.add(frame);

    // Illuminated digital screen
    const gCanvas = document.createElement('canvas');
    gCanvas.width = 256;
    gCanvas.height = 340;
    const gctx = gCanvas.getContext('2d');
    if (gctx) {
      gctx.fillStyle = '#060d1b';
      gctx.fillRect(0, 0, 256, 340);
      gctx.strokeStyle = gp.color;
      gctx.lineWidth = 6;
      gctx.strokeRect(6, 6, 244, 328);

      gctx.fillStyle = gp.color;
      gctx.font = 'bold 20px sans-serif';
      gctx.textAlign = 'center';
      gctx.fillText(gp.title.split(':')[0], 128, 44);

      gctx.fillStyle = '#f8fafc';
      gctx.font = 'bold 15px sans-serif';
      gctx.fillText(gp.title.split(':')[1]?.trim() || '', 128, 72);

      gctx.fillStyle = '#94a3b8';
      gctx.font = '12px monospace';
      gctx.fillText('• Milestone Architecture', 128, 120);
      gctx.fillText('• Verified Geometry', 128, 150);
      gctx.fillText('• 0 Protected Road Clashes', 128, 180);
      gctx.fillText('• High Performance PBR', 128, 210);

      gctx.fillStyle = gp.color;
      gctx.fillRect(24, 250, 208, 4);

      gctx.fillStyle = '#e2e8f0';
      gctx.font = 'bold 13px sans-serif';
      gctx.fillText('[Tap to Inspect]', 128, 290);
    }
    const gTex = new THREE.CanvasTexture(gCanvas);
    gTex.colorSpace = THREE.SRGBColorSpace;

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 2.05), new THREE.MeshBasicMaterial({ map: gTex }));
    screen.position.set(0, 1.1, 0.07);
    screen.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'gallery' };
    clickableBuildings.push(screen);
    kGroup.add(screen);

    galleryGroup.add(kGroup);
  });

  interiorGroup.add(galleryGroup);

  // ===========================================================================
  // 6. BEAUTIFUL PORTRAIT DISPLAY OF SHAHANUR MOLLAH USING REAL PHOTOGRAPH
  // ===========================================================================
  const portraitGroup = new THREE.Group();
  portraitGroup.position.set(bWidth / 2 - 0.25, floorY + 0.08, 0);

  // Museum display back-panel in charcoal slate
  const panelBack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.6, 2.0), materials.modernDarkSlate);
  panelBack.position.y = 1.5;
  panelBack.castShadow = true;
  portraitGroup.add(panelBack);

  // Polished brushed gold / brass frame
  const frameBorder = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.3, 1.7), warmGold);
  frameBorder.position.y = 1.6;
  portraitGroup.add(frameBorder);

  // Texture Loader for real authentic creator portrait
  let portraitTexture: THREE.Texture | null = null;
  if (typeof document !== 'undefined' && typeof (document as unknown as { createElementNS?: unknown }).createElementNS === 'function') {
    try {
      const texLoader = new THREE.TextureLoader();
      portraitTexture = texLoader.load('/assets/aistudio/20261104_090030_5aeb97d7.jpg');
      portraitTexture.colorSpace = THREE.SRGBColorSpace;
    } catch {
      portraitTexture = null;
    }
  }

  const portraitMat = portraitTexture
    ? new THREE.MeshStandardMaterial({
        map: portraitTexture,
        roughness: 0.25,
        metalness: 0.1,
      })
    : materials.modernWarmBeige;

  const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.1), portraitMat);
  photoMesh.position.set(-0.08, 1.6, 0);
  photoMesh.rotation.y = -Math.PI / 2;
  photoMesh.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'portrait' };
  clickableBuildings.push(photoMesh);
  portraitGroup.add(photoMesh);

  // Museum warm spotlight above portrait
  const spotMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.2, 12), warmGold);
  spotMesh.position.set(-0.35, 2.8, 0);
  spotMesh.rotation.z = -Math.PI / 4;
  portraitGroup.add(spotMesh);

  const spotGlow = new THREE.Mesh(new THREE.ConeGeometry(0.15, 0.4, 12), turquoiseGlow);
  spotGlow.position.set(-0.48, 2.65, 0);
  spotGlow.rotation.z = -Math.PI / 4;
  portraitGroup.add(spotGlow);

  // Engraved creator brass dedication plaque beneath
  const plaqueCanvas = document.createElement('canvas');
  plaqueCanvas.width = 512;
  plaqueCanvas.height = 160;
  const pctx = plaqueCanvas.getContext('2d');
  if (pctx) {
    pctx.fillStyle = '#06161b';
    pctx.fillRect(0, 0, 512, 160);
    pctx.strokeStyle = '#d4af37';
    pctx.lineWidth = 4;
    pctx.strokeRect(6, 6, 500, 148);

    pctx.fillStyle = '#f8fafc';
    pctx.font = 'bold 32px sans-serif';
    pctx.textAlign = 'center';
    pctx.fillText('SHAHANUR MOLLAH', 256, 48);

    pctx.fillStyle = '#2dd4bf';
    pctx.font = 'bold 20px monospace';
    pctx.fillText('Creator & Developer of 3DWorld', 256, 88);

    pctx.fillStyle = '#d4af37';
    pctx.font = '16px sans-serif';
    pctx.fillText('@shahanurmollah__ · Virtual Universe', 256, 124);
  }
  const plaqueTex = new THREE.CanvasTexture(plaqueCanvas);
  plaqueTex.colorSpace = THREE.SRGBColorSpace;

  const plaqueMesh = new THREE.Mesh(
    new THREE.PlaneGeometry(1.4, 0.45),
    new THREE.MeshBasicMaterial({ map: plaqueTex })
  );
  plaqueMesh.position.set(-0.08, 0.35, 0);
  plaqueMesh.rotation.y = -Math.PI / 2;
  plaqueMesh.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'portrait' };
  clickableBuildings.push(plaqueMesh);
  portraitGroup.add(plaqueMesh);

  interiorGroup.add(portraitGroup);

  // ===========================================================================
  // 7. RELAXATION LOUNGE WITH SOFAS, INDOOR PLANTS & GLASS WINDOWS
  // ===========================================================================
  const loungeGroup = new THREE.Group();
  loungeGroup.position.set(-1.8, floorY + 0.08, 2.2);

  // Modern L-shaped sectional sofa
  const sofaMain = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.42, 0.85), sofaFabric);
  sofaMain.position.set(0, 0.21, 0);
  sofaMain.castShadow = true;
  sofaMain.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'lounge' };
  clickableBuildings.push(sofaMain);
  loungeGroup.add(sofaMain);

  const sofaBack = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.2), sofaFabric);
  sofaBack.position.set(0, 0.55, 0.32);
  sofaBack.castShadow = true;
  loungeGroup.add(sofaBack);

  const sofaL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.42, 1.2), sofaFabric);
  sofaL.position.set(-0.9, 0.21, 0.6);
  sofaL.castShadow = true;
  loungeGroup.add(sofaL);

  // Turquoise designer cushions
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.12), sofaCushionTeal);
  c1.position.set(-0.4, 0.45, 0.2);
  loungeGroup.add(c1);

  const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.12), sofaCushionTeal);
  c2.position.set(0.4, 0.45, 0.2);
  loungeGroup.add(c2);

  // Low-profile smoked glass coffee table
  const tableBase = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.28, 0.6), materials.metalBlack);
  tableBase.position.set(0.1, 0.14, -0.6);
  loungeGroup.add(tableBase);

  const tableGlass = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.04, 0.75), glassRailingMat);
  tableGlass.position.set(0.1, 0.29, -0.6);
  loungeGroup.add(tableGlass);

  // Virtual universe art book on table
  const book = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.03, 0.35), materials.carPaintBlue);
  book.position.set(0.1, 0.32, -0.6);
  book.rotation.y = 0.2;
  loungeGroup.add(book);

  // Indoor architectural planters (Fiddle-Leaf Fig & Snake Plants)
  const potGeo = new THREE.CylinderGeometry(0.22, 0.16, 0.55, 16);
  const pot1 = new THREE.Mesh(potGeo, materials.modernWhiteStucco);
  pot1.position.set(-1.5, 0.275, -0.5);
  pot1.castShadow = true;
  loungeGroup.add(pot1);

  const figTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 1.2, 8), materials.treeTrunkBark);
  figTrunk.position.set(-1.5, 0.85, -0.5);
  loungeGroup.add(figTrunk);

  for (let l = 0; l < 5; l++) {
    const leaf = new THREE.Mesh(new THREE.DodecahedronGeometry(0.22, 0), materials.treeFoliageDarkGreen);
    leaf.position.set(-1.5 + (Math.random() - 0.5) * 0.3, 1.1 + l * 0.15, -0.5 + (Math.random() - 0.5) * 0.3);
    loungeGroup.add(leaf);
  }

  interiorGroup.add(loungeGroup);

  // ===========================================================================
  // 8. ROOFTOP VIEWING AREA OVERLOOKING THE VIRTUAL VILLAGE & STAIRCASE
  // ===========================================================================
  const rooftopGroup = new THREE.Group();
  rooftopGroup.position.set(0, ceilingY, 0);

  // Teak decking over rooftop
  const roofDeckGeo = new THREE.BoxGeometry(bWidth + 0.8, 0.08, bDepth + 0.8);
  const roofDeck = new THREE.Mesh(roofDeckGeo, materials.timberBench);
  roofDeck.position.y = 0.04;
  roofDeck.receiveShadow = true;
  rooftopGroup.add(roofDeck);

  // Perimeter glass balustrades with polished steel top handrails
  const rWidth = bWidth + 0.8;
  const rDepth = bDepth + 0.8;
  const railHeight = 1.1;

  // North balustrade
  const railN = new THREE.Mesh(new THREE.BoxGeometry(rWidth, railHeight, 0.06), glassRailingMat);
  railN.position.set(0, railHeight / 2 + 0.08, -rDepth / 2);
  rooftopGroup.add(railN);

  // South balustrade
  const railS = new THREE.Mesh(new THREE.BoxGeometry(rWidth, railHeight, 0.06), glassRailingMat);
  railS.position.set(0, railHeight / 2 + 0.08, rDepth / 2);
  rooftopGroup.add(railS);

  // East balustrade
  const railE = new THREE.Mesh(new THREE.BoxGeometry(0.06, railHeight, rDepth), glassRailingMat);
  railE.position.set(rWidth / 2, railHeight / 2 + 0.08, 0);
  rooftopGroup.add(railE);

  // West balustrade (front overlook facing village)
  const railW = new THREE.Mesh(new THREE.BoxGeometry(0.06, railHeight, rDepth), glassRailingMat);
  railW.position.set(-rWidth / 2, railHeight / 2 + 0.08, 0);
  rooftopGroup.add(railW);

  // Polished steel top rail caps
  const capGeoX = new THREE.BoxGeometry(rWidth + 0.04, 0.05, 0.1);
  const capN = new THREE.Mesh(capGeoX, materials.metalSteel);
  capN.position.set(0, railHeight + 0.08, -rDepth / 2);
  rooftopGroup.add(capN);

  const capS = new THREE.Mesh(capGeoX, materials.metalSteel);
  capS.position.set(0, railHeight + 0.08, rDepth / 2);
  rooftopGroup.add(capS);

  // High-magnification observation binoculars / telescope overlooking village
  const telescopeGroup = new THREE.Group();
  telescopeGroup.position.set(-rWidth / 2 + 0.7, 0.08, 0);

  const telePedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.14, 1.25, 12), materials.metalSteel);
  telePedestal.position.y = 0.625;
  telescopeGroup.add(telePedestal);

  const teleBody = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.35), materials.capitalDarkSteel);
  teleBody.position.y = 1.32;
  telescopeGroup.add(teleBody);

  const teleBarrelL = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 12), materials.metalSteel);
  teleBarrelL.rotation.z = Math.PI / 2;
  teleBarrelL.position.set(-0.25, 1.34, -0.07);
  telescopeGroup.add(teleBarrelL);

  const teleBarrelR = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.6, 12), materials.metalSteel);
  teleBarrelR.rotation.z = Math.PI / 2;
  teleBarrelR.position.set(-0.25, 1.34, 0.07);
  telescopeGroup.add(teleBarrelR);

  telescopeGroup.userData = { isBuilding: true, isPavilionInteractable: true, pointId: 'rooftop' };
  clickableBuildings.push(teleBody);
  rooftopGroup.add(telescopeGroup);

  // Outdoor rooftop lounge deck chairs
  const loungerGeo = new THREE.BoxGeometry(0.7, 0.35, 1.8);
  const lounger1 = new THREE.Mesh(loungerGeo, sofaCushionTeal);
  lounger1.position.set(1.5, 0.25, 1.8);
  lounger1.rotation.y = -0.3;
  rooftopGroup.add(lounger1);

  const lounger2 = new THREE.Mesh(loungerGeo, sofaCushionTeal);
  lounger2.position.set(1.5, 0.25, -1.8);
  lounger2.rotation.y = 0.3;
  rooftopGroup.add(lounger2);

  // Modern architectural floating stairs connecting Ground Floor to Rooftop
  const stairGroup = new THREE.Group();
  stairGroup.position.set(-2.5, floorY + 0.08, -2.4);

  const stepCount = 14;
  const totalRise = ceilingY - (floorY + 0.08);
  const stepRise = totalRise / stepCount;

  for (let s = 0; s < stepCount; s++) {
    const sMesh = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.06, 0.3), materials.modernWhiteStucco);
    sMesh.position.set(0, s * stepRise + stepRise / 2, s * 0.24);
    sMesh.castShadow = true;
    stairGroup.add(sMesh);

    // Tread cyan under-light
    const sLight = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.04), cyanGlow);
    sLight.position.set(0, s * stepRise + 0.01, s * 0.24 + 0.12);
    stairGroup.add(sLight);
  }

  // Stair glass balustrade
  const stairRail = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, stepCount * 0.24), glassRailingMat);
  stairRail.position.set(0.45, totalRise / 2 + 0.5, (stepCount * 0.24) / 2);
  stairGroup.add(stairRail);

  interiorGroup.add(stairGroup);
  interiorGroup.add(rooftopGroup);

  // Floating interaction beacons for visual cueing
  const interactPointsGroup = new THREE.Group();
  PAVILION_INTERACTION_POINTS.forEach((pt) => {
    const pGroup = new THREE.Group();
    // Convert world position back to local pavilion position
    pGroup.position.set(pt.position[0] - 27.5, pt.position[1], pt.position[2] - 15.0);

    const ring = new THREE.Mesh(new THREE.RingGeometry(0.35, 0.42, 16), turquoiseGlow);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = 0.02;
    pGroup.add(ring);

    const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), cyanGlow);
    diamond.position.y = 0.45;
    pGroup.add(diamond);

    interactPointsGroup.add(pGroup);
  });
  interiorGroup.add(interactPointsGroup);

  // Door animation state
  let currentDoorOpen = 0.0;
  const targetDoorDist = 3.6;

  function updateDoors(playerOrCamPos: THREE.Vector3, delta: number) {
    // Entrance world position is (23.5, 0, 15.0)
    const entranceWorldPos = new THREE.Vector3(23.5, 1.2, 15.0);
    const dist = playerOrCamPos.distanceTo(entranceWorldPos);

    const targetOpen = dist < targetDoorDist ? 1.0 : 0.0;
    currentDoorOpen = THREE.MathUtils.damp(currentDoorOpen, targetOpen, 6.0, delta);

    // Left door slides north (-Z), right door slides south (+Z)
    leftDoor.position.z = -doorWidth / 2 - currentDoorOpen * 1.05;
    rightDoor.position.z = doorWidth / 2 + currentDoorOpen * 1.05;
  }

  function updateAnimation(delta: number, elapsed: number) {
    // Rotate 3D hologram in showcase
    holoRig.rotation.y = elapsed * 0.75;
    orbit1.rotation.z = elapsed * 0.45;
    orbit2.rotation.x = -elapsed * 0.6;
  }

  function checkNearInteraction(worldPos: THREE.Vector3): PavilionInteractionPoint | null {
    for (let i = 0; i < PAVILION_INTERACTION_POINTS.length; i++) {
      const pt = PAVILION_INTERACTION_POINTS[i];
      const pWorld = new THREE.Vector3(pt.position[0], pt.position[1], pt.position[2]);
      if (worldPos.distanceTo(pWorld) <= pt.interactionRadius) {
        return pt;
      }
    }
    return null;
  }

  return {
    interiorGroup,
    slidingDoors: {
      leftDoor,
      rightDoor,
      update: updateDoors,
    },
    clickableObjects: clickableBuildings,
    hologramMesh: holoRig,
    updateAnimation,
    checkNearInteraction,
  };
}
