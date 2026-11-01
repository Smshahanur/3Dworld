import * as THREE from 'three';
import { MaterialLibrary } from './materials';

export interface AnimatedLandmarkComponents {
  portalOuterRing: THREE.Mesh;
  portalInnerRing: THREE.Mesh;
  portalGyroscopicRing: THREE.Mesh;
  portalCore: THREE.Mesh;
  portalShards: THREE.Group;
  portalLightColumn: THREE.Mesh;
  crystalValleyGroup: THREE.Group;
  templeOrb: THREE.Mesh;
  templeAltarRings: THREE.Group;
  cityBeaconRings: THREE.Group;
  floatingBeaconMarkers: THREE.Group;
  forestWindGroup: THREE.Group;
}

export function createLandmarks(materials: MaterialLibrary): {
  landmarksGroup: THREE.Group;
  animatedComponents: AnimatedLandmarkComponents;
  beaconMeshes: THREE.Mesh[];
} {
  const landmarksGroup = new THREE.Group();
  landmarksGroup.name = 'Landmarks';
  const beaconMeshes: THREE.Mesh[] = [];
  const floatingBeaconMarkers = new THREE.Group();
  landmarksGroup.add(floatingBeaconMarkers);

  // Helper to create an interactive 3D landmark beacon diamond
  function createBeaconMarker(id: string, name: string, x: number, y: number, z: number, colorHex: number) {
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(x, y, z);

    // Glowing diamond/octahedron
    const diamondGeo = new THREE.OctahedronGeometry(0.85, 0);
    const beaconMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const diamond = new THREE.Mesh(diamondGeo, beaconMat);
    diamond.userData = { isLandmarkBeacon: true, landmarkId: id, landmarkName: name };
    beaconMeshes.push(diamond);
    beaconGroup.add(diamond);

    // Inner solid core
    const coreGeo = new THREE.OctahedronGeometry(0.4, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { isLandmarkBeacon: true, landmarkId: id, landmarkName: name };
    beaconMeshes.push(core);
    beaconGroup.add(core);

    // Hovering pulse ring
    const ringGeo = new THREE.RingGeometry(1.2, 1.45, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2;
    beaconGroup.add(ring);

    floatingBeaconMarkers.add(beaconGroup);
  }

  // ========================================================
  // 1. THE CENTRAL PORTAL (Refined & Proportionate Landmark)
  // ========================================================
  const portalGroup = new THREE.Group();
  portalGroup.position.set(0, 1.8, 0);

  // Plaza Base Tier 1: Circular Runic Plaza (Proportionate to island)
  const plazaGeo1 = new THREE.CylinderGeometry(5.2, 5.8, 0.45, 36);
  const plaza1 = new THREE.Mesh(plazaGeo1, materials.portalObsidian);
  plaza1.receiveShadow = true;
  portalGroup.add(plaza1);

  // Plaza Base Tier 2: Inlaid Gold Stepped Ring
  const plazaGeo2 = new THREE.CylinderGeometry(4.0, 4.4, 0.35, 36);
  const plaza2 = new THREE.Mesh(plazaGeo2, materials.portalGold);
  plaza2.position.y = 0.4;
  plaza2.receiveShadow = true;
  portalGroup.add(plaza2);

  // Plaza Base Tier 3: Core Obsidian Dais
  const plazaGeo3 = new THREE.CylinderGeometry(3.0, 3.4, 0.28, 36);
  const plaza3 = new THREE.Mesh(plazaGeo3, materials.portalObsidian);
  plaza3.position.y = 0.7;
  plaza3.receiveShadow = true;
  portalGroup.add(plaza3);

  // Radial Gold Channel Inlays on Plaza
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const ribGeo = new THREE.BoxGeometry(0.18, 0.06, 2.4);
    const rib = new THREE.Mesh(ribGeo, materials.portalGold);
    rib.position.set(Math.cos(ang) * 1.8, 0.86, Math.sin(ang) * 1.8);
    rib.rotation.y = -ang;
    portalGroup.add(rib);
  }

  // Ring 1: Layered Outer Obsidian Ring with Golden Spikes
  const outerRingGeo = new THREE.TorusGeometry(2.9, 0.24, 16, 48);
  const portalOuterRing = new THREE.Mesh(outerRingGeo, materials.portalObsidian);
  portalOuterRing.position.y = 3.6;
  portalOuterRing.castShadow = true;
  portalGroup.add(portalOuterRing);

  // Outer Golden Solar Spikes & Focus Crystals
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const clampGeo = new THREE.BoxGeometry(0.35, 0.75, 0.4);
    const clamp = new THREE.Mesh(clampGeo, materials.portalGold);
    clamp.position.set(Math.cos(angle) * 2.9, 3.6 + Math.sin(angle) * 2.9, 0);
    clamp.rotation.z = angle;
    portalGroup.add(clamp);

    // Micro crystal focal tip on clamp
    const microCrystalGeo = new THREE.ConeGeometry(0.12, 0.45, 6);
    const microCrystal = new THREE.Mesh(microCrystalGeo, materials.crystalCyan);
    microCrystal.position.set(Math.cos(angle) * 3.35, 3.6 + Math.sin(angle) * 3.35, 0);
    microCrystal.rotation.z = angle - Math.PI / 2;
    portalGroup.add(microCrystal);
  }

  // Ring 2: Middle Runic Counter-Rotating Ring
  const innerRingGeo = new THREE.TorusGeometry(2.2, 0.16, 16, 48);
  const portalInnerRing = new THREE.Mesh(innerRingGeo, materials.runicRing);
  portalInnerRing.position.y = 3.6;
  portalGroup.add(portalInnerRing);

  // Ring 3: Third Gyroscopic Diagonal Ring
  const gyroRingGeo = new THREE.TorusGeometry(1.6, 0.09, 12, 36);
  const portalGyroscopicRing = new THREE.Mesh(gyroRingGeo, materials.portalGold);
  portalGyroscopicRing.position.y = 3.6;
  portalGroup.add(portalGyroscopicRing);

  // Central Hyper-Luminous Portal Core
  const coreGroup = new THREE.Group();
  coreGroup.position.y = 3.6;

  const coreGeo1 = new THREE.OctahedronGeometry(1.05, 1);
  const portalCore = new THREE.Mesh(coreGeo1, materials.portalCore);
  coreGroup.add(portalCore);

  const coreInnerGeo = new THREE.SphereGeometry(0.65, 20, 20);
  const coreInner = new THREE.Mesh(coreInnerGeo, materials.crystalCyan);
  coreGroup.add(coreInner);
  portalGroup.add(coreGroup);

  // Orbiting Floating Crystal Fragments
  const portalShards = new THREE.Group();
  portalShards.position.y = 3.6;
  for (let i = 0; i < 8; i++) {
    const shardGeo = new THREE.ConeGeometry(0.16, 0.8, 6);
    const shard = new THREE.Mesh(shardGeo, i % 2 === 0 ? materials.crystalCyan : materials.crystalViolet);
    const ang = (i / 8) * Math.PI * 2;
    const r = 1.6 + (i % 2) * 0.3;
    shard.position.set(Math.cos(ang) * r, Math.sin(ang * 2) * 0.5, Math.sin(ang) * r);
    shard.rotation.set(ang, ang * 1.5, Math.PI / 4);
    portalShards.add(shard);
  }
  portalGroup.add(portalShards);

  // Flanking Monumental Pylon Towers with Carved Glyphs & Levitating Capstones
  const createMonumentPylon = (x: number) => {
    const pylon = new THREE.Group();
    pylon.position.set(x, 0, 0);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 1.2), materials.portalObsidian);
    plinth.position.y = 1.0;
    pylon.add(plinth);

    const colGeo = new THREE.BoxGeometry(0.8, 5.5, 0.8);
    const col = new THREE.Mesh(colGeo, materials.portalObsidian);
    col.position.y = 4.0;
    col.castShadow = true;
    pylon.add(col);

    const energyStripe = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5.0, 0.84), materials.cityGlowCyan);
    energyStripe.position.y = 4.0;
    pylon.add(energyStripe);

    const collar = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.3, 1.0), materials.portalGold);
    collar.position.y = 6.9;
    pylon.add(collar);

    const capstoneGeo = new THREE.ConeGeometry(0.65, 1.5, 4);
    capstoneGeo.rotateY(Math.PI / 4);
    const capstone = new THREE.Mesh(capstoneGeo, materials.portalGold);
    capstone.position.y = 8.1;
    pylon.add(capstone);

    return pylon;
  };

  portalGroup.add(createMonumentPylon(-3.8));
  portalGroup.add(createMonumentPylon(3.8));

  // Ascending Celestial Light Column with soft pulsing bands
  const beamGeo = new THREE.CylinderGeometry(0.6, 1.2, 32, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.25,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const portalLightColumn = new THREE.Mesh(beamGeo, beamMat);
  portalLightColumn.position.y = 16;
  portalGroup.add(portalLightColumn);

  // Portal Local Point Light
  const portalPointLight = new THREE.PointLight(0x38bdf8, 2.6, 18);
  portalPointLight.position.set(0, 3.6, 0);
  portalGroup.add(portalPointLight);

  landmarksGroup.add(portalGroup);
  createBeaconMarker('portal', 'The Central Portal', 0, 8.8, 0, 0x6366f1);

  // ========================================================
  // 2. CRYSTAL VALLEY (Location A: High-Detail Prismatic Habits)
  // ========================================================
  const crystalValleyGroup = new THREE.Group();
  crystalValleyGroup.position.set(-14, 1.2, -10);

  // Helper to build a natural quartz habit: hexagonal prism with beveled pyramidal terminations
  function createQuartzHabit(radius: number, height: number, material: THREE.Material): THREE.Group {
    const habit = new THREE.Group();

    // Hexagonal body prism
    const bodyHeight = height * 0.72;
    const bodyGeo = new THREE.CylinderGeometry(radius, radius, bodyHeight, 6);
    const body = new THREE.Mesh(bodyGeo, material);
    body.position.y = bodyHeight / 2;
    body.castShadow = true;
    habit.add(body);

    // Beveled pyramidal termination cap
    const capHeight = height * 0.28;
    const capGeo = new THREE.ConeGeometry(radius, capHeight, 6);
    const cap = new THREE.Mesh(capGeo, material);
    cap.position.y = bodyHeight + capHeight / 2;
    cap.castShadow = true;
    habit.add(cap);

    return habit;
  }

  // Major Crystal Formations with clustered satellite crystals and natural lean angles
  const crystalClusters = [
    { pos: [0, 0, 0], r: 1.4, h: 7.8, mat: materials.crystalCyan, rotZ: 0.1, rotX: 0.05 },
    { pos: [2.6, 0, 1.8], r: 1.1, h: 6.2, mat: materials.crystalViolet, rotZ: -0.16, rotX: 0.12 },
    { pos: [-2.4, 0, 2.2], r: 1.2, h: 6.8, mat: materials.crystalCyan, rotZ: 0.2, rotX: -0.1 },
    { pos: [1.8, 0, -2.6], r: 0.95, h: 5.4, mat: materials.crystalViolet, rotZ: -0.14, rotX: -0.18 },
    { pos: [-3.4, 0, -1.8], r: 1.05, h: 5.8, mat: materials.crystalGold, rotZ: 0.22, rotX: 0.15 },
    { pos: [4.2, 0, -0.6], r: 0.85, h: 4.8, mat: materials.crystalCyan, rotZ: -0.25, rotX: 0.05 },
    { pos: [-1.4, 0, -3.8], r: 0.8, h: 4.4, mat: materials.crystalViolet, rotZ: 0.12, rotX: -0.22 },
    { pos: [0.8, 0, 3.8], r: 0.9, h: 5.0, mat: materials.crystalCyan, rotZ: -0.08, rotX: 0.24 },
  ];

  crystalClusters.forEach((cfg) => {
    const habit = createQuartzHabit(cfg.r, cfg.h, cfg.mat);
    habit.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    habit.rotation.set(cfg.rotX, Math.random() * Math.PI, cfg.rotZ);
    crystalValleyGroup.add(habit);

    // 2-3 mini satellite needles clustered at base
    for (let s = 0; s < 3; s++) {
      const sAng = s * 2.1;
      const sHabit = createQuartzHabit(cfg.r * 0.35, cfg.h * 0.4, cfg.mat);
      sHabit.position.set(
        cfg.pos[0] + Math.cos(sAng) * cfg.r * 1.5,
        cfg.pos[1],
        cfg.pos[2] + Math.sin(sAng) * cfg.r * 1.5
      );
      sHabit.rotation.set((Math.random() - 0.5) * 0.4, Math.random() * Math.PI, (Math.random() - 0.5) * 0.4);
      crystalValleyGroup.add(sHabit);
    }
  });

  // Valley Geode Bed & Glowing Rock Fissures
  const cragGeo = new THREE.DodecahedronGeometry(4.2, 1);
  const valleyCrag = new THREE.Mesh(cragGeo, materials.rockCliffMaterial);
  valleyCrag.position.set(0, -0.6, 0);
  valleyCrag.scale.set(1.8, 0.65, 1.6);
  crystalValleyGroup.add(valleyCrag);

  // Glowing Crystal Veins along ground
  for (let i = 0; i < 4; i++) {
    const veinAng = (i / 4) * Math.PI * 2;
    const veinGeo = new THREE.BoxGeometry(0.3, 0.1, 4.5);
    const vein = new THREE.Mesh(veinGeo, materials.cityGlowCyan);
    vein.position.set(Math.cos(veinAng) * 2.2, 0.35, Math.sin(veinAng) * 2.2);
    vein.rotation.y = -veinAng;
    crystalValleyGroup.add(vein);
  }

  // Dual Coordinated Ambient Lights (Cyan & Violet radiance)
  const cLight1 = new THREE.PointLight(0x38bdf8, 2.8, 16);
  cLight1.position.set(-1, 3.5, -1);
  crystalValleyGroup.add(cLight1);

  const cLight2 = new THREE.PointLight(0xc084fc, 2.2, 14);
  cLight2.position.set(2, 3.0, 2);
  crystalValleyGroup.add(cLight2);

  landmarksGroup.add(crystalValleyGroup);
  createBeaconMarker('crystal-valley', 'Crystal Valley', -14, 10.5, -10, 0x38bdf8);

  // ========================================================
  // 3. SKY TEMPLE (Location B: Classical Sanctuary Architecture)
  // ========================================================
  const skyTempleGroup = new THREE.Group();
  skyTempleGroup.position.set(14, 3.8, -8);

  // Grand Stepped Marble Podium with Balustrades
  const tBaseGeo1 = new THREE.BoxGeometry(12, 1.2, 12);
  const tBase1 = new THREE.Mesh(tBaseGeo1, materials.templeWhite);
  tBase1.position.y = 0.6;
  tBase1.receiveShadow = true;
  skyTempleGroup.add(tBase1);

  const tBaseGeo2 = new THREE.BoxGeometry(9.6, 0.8, 9.6);
  const tBase2 = new THREE.Mesh(tBaseGeo2, materials.templeWhite);
  tBase2.position.y = 1.6;
  tBase2.receiveShadow = true;
  skyTempleGroup.add(tBase2);

  // Balustrade Railings around podium perimeter
  const railGeo = new THREE.BoxGeometry(11.4, 0.4, 0.2);
  const railNorth = new THREE.Mesh(railGeo, materials.templeGold);
  railNorth.position.set(0, 1.4, -5.7);
  skyTempleGroup.add(railNorth);

  const railSouth = new THREE.Mesh(railGeo, materials.templeGold);
  railSouth.position.set(0, 1.4, 5.7);
  skyTempleGroup.add(railSouth);

  // Fluted Quartz Columns (16 classical sanctuary columns)
  const colGeo = new THREE.CylinderGeometry(0.38, 0.44, 4.8, 16);
  const colBaseGeo = new THREE.CylinderGeometry(0.55, 0.6, 0.35, 12);
  const colCapGeo = new THREE.CylinderGeometry(0.62, 0.45, 0.4, 12);

  const colGrid = [
    [-3.8, -3.8], [-1.3, -3.8], [1.3, -3.8], [3.8, -3.8],
    [-3.8, 3.8], [-1.3, 3.8], [1.3, 3.8], [3.8, 3.8],
    [-3.8, -1.3], [-3.8, 1.3], [3.8, -1.3], [3.8, 1.3],
    [-2.2, -2.2], [2.2, -2.2], [-2.2, 2.2], [2.2, 2.2],
  ];

  colGrid.forEach(([cx, cz]) => {
    // Column shaft
    const col = new THREE.Mesh(colGeo, materials.templeWhite);
    col.position.set(cx, 4.4, cz);
    col.castShadow = true;
    skyTempleGroup.add(col);

    // Column base
    const cBase = new THREE.Mesh(colBaseGeo, materials.templeGold);
    cBase.position.set(cx, 2.15, cz);
    skyTempleGroup.add(cBase);

    // Column capital
    const cCap = new THREE.Mesh(colCapGeo, materials.templeGold);
    cCap.position.set(cx, 6.7, cz);
    skyTempleGroup.add(cCap);
  });

  // Temple Entablature Architrave
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(10.2, 0.65, 10.2), materials.templeWhite);
  architrave.position.y = 7.15;
  architrave.castShadow = true;
  skyTempleGroup.add(architrave);

  // Multi-Tiered Pagoda Roof with Curved Eave Overhangs
  // Tier 1 Roof
  const roof1 = new THREE.Mesh(new THREE.ConeGeometry(7.8, 2.4, 4), materials.templeTiles);
  roof1.rotateY(Math.PI / 4);
  roof1.position.y = 8.6;
  roof1.castShadow = true;
  skyTempleGroup.add(roof1);

  // Gold Trim Eave Rim Tier 1
  const rim1 = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.3, 8.2), materials.templeGold);
  rim1.position.y = 7.7;
  skyTempleGroup.add(rim1);

  // Tier 2 Clerestory Wall
  const clerestory = new THREE.Mesh(new THREE.BoxGeometry(4.8, 1.4, 4.8), materials.templeWhite);
  clerestory.position.y = 9.8;
  skyTempleGroup.add(clerestory);

  // Tier 2 Upper Roof
  const roof2 = new THREE.Mesh(new THREE.ConeGeometry(5.2, 2.0, 4), materials.templeTiles);
  roof2.rotateY(Math.PI / 4);
  roof2.position.y = 11.2;
  roof2.castShadow = true;
  skyTempleGroup.add(roof2);

  // Gilded Pinnacle Spire
  const pinnacle = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.35, 3.2, 8), materials.templeGold);
  pinnacle.position.y = 13.4;
  skyTempleGroup.add(pinnacle);

  // Central Levitating Sacred Celestial Altar Orb & Armillary Rings
  const templeOrb = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 32), materials.portalCore);
  templeOrb.position.set(0, 4.4, 0);
  skyTempleGroup.add(templeOrb);

  const templeAltarRings = new THREE.Group();
  templeAltarRings.position.set(0, 4.4, 0);
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(1.9, 0.09, 12, 36), materials.templeGold);
  templeAltarRings.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.07, 12, 36), materials.templeGold);
  ring2.rotation.x = Math.PI / 2;
  templeAltarRings.add(ring2);
  skyTempleGroup.add(templeAltarRings);

  // Arched Celestial Skybridge connecting temple to western bluff
  const bridgeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.8, 1.6, 0),
    new THREE.Vector3(-7.8, 2.4, 0),
    new THREE.Vector3(-11.0, 1.5, 0),
  ]);
  const bridgeGeo = new THREE.TubeGeometry(bridgeCurve, 20, 1.0, 8, false);
  const skyBridge = new THREE.Mesh(bridgeGeo, materials.templeWhite);
  skyBridge.scale.set(1, 0.45, 1.8);
  skyBridge.castShadow = true;
  skyTempleGroup.add(skyBridge);

  // Four Guardian Obelisks with Runic Flame Braziers
  const obeliskPositions = [
    [-5.6, 5.6], [5.6, 5.6], [-5.6, -5.6], [5.6, -5.6],
  ];
  obeliskPositions.forEach(([ox, oz]) => {
    const obeliskGeo = new THREE.BoxGeometry(0.7, 4.2, 0.7);
    const ob = new THREE.Mesh(obeliskGeo, materials.templeWhite);
    ob.position.set(ox, 3.2, oz);
    ob.castShadow = true;
    skyTempleGroup.add(ob);

    const brazierGeo = new THREE.CylinderGeometry(0.6, 0.3, 0.6, 8);
    const brazier = new THREE.Mesh(brazierGeo, materials.templeGold);
    brazier.position.set(ox, 5.4, oz);
    skyTempleGroup.add(brazier);

    const flameGeo = new THREE.OctahedronGeometry(0.4, 0);
    const flame = new THREE.Mesh(flameGeo, materials.crystalGold);
    flame.position.set(ox, 6.0, oz);
    skyTempleGroup.add(flame);
  });

  // Temple Warm Golden Ambient Light
  const templeLight = new THREE.PointLight(0xfbbf24, 2.6, 22);
  templeLight.position.set(0, 5.5, 0);
  skyTempleGroup.add(templeLight);

  landmarksGroup.add(skyTempleGroup);
  createBeaconMarker('sky-temple', 'Sky Temple', 14, 15.0, -8, 0xf59e0b);

  // ========================================================
  // 4. AURORA FOREST (Location C: Natural Branching Trees & Plants)
  // ========================================================
  const auroraForestGroup = new THREE.Group();
  auroraForestGroup.position.set(10, 1.2, 13);
  const forestWindGroup = new THREE.Group();
  auroraForestGroup.add(forestWindGroup);

  // Procedural Natural Tree with twisted trunk, branches, and multi-layered foliage
  function createNaturalTree(trunkHeight: number, hue: 'teal' | 'violet', scale: number): THREE.Group {
    const tree = new THREE.Group();
    tree.scale.setScalar(scale);

    // Twisted trunk with CatmullRom spline
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3((Math.random() - 0.5) * 0.5, trunkHeight * 0.35, (Math.random() - 0.5) * 0.5),
      new THREE.Vector3((Math.random() - 0.5) * 0.8, trunkHeight * 0.7, (Math.random() - 0.5) * 0.8),
      new THREE.Vector3(0, trunkHeight, 0),
    ]);
    const trunkGeo = new THREE.TubeGeometry(curve, 14, 0.42, 8, false);
    const trunk = new THREE.Mesh(trunkGeo, materials.treeBark);
    trunk.castShadow = true;
    tree.add(trunk);

    // 3 Natural Side Branches
    for (let b = 0; b < 3; b++) {
      const bAng = b * 2.1 + Math.random() * 0.3;
      const bCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, trunkHeight * 0.65, 0),
        new THREE.Vector3(Math.cos(bAng) * 1.2, trunkHeight * 0.8, Math.sin(bAng) * 1.2),
        new THREE.Vector3(Math.cos(bAng) * 2.0, trunkHeight * 0.95, Math.sin(bAng) * 2.0),
      ]);
      const branchGeo = new THREE.TubeGeometry(bCurve, 8, 0.2, 6, false);
      const branch = new THREE.Mesh(branchGeo, materials.treeBark);
      tree.add(branch);

      // Branch foliage puff
      const bLeafGeo = new THREE.IcosahedronGeometry(1.2, 2);
      const bLeaf = new THREE.Mesh(bLeafGeo, hue === 'teal' ? materials.treeFoliageTeal : materials.treeFoliageViolet);
      bLeaf.position.set(Math.cos(bAng) * 2.1, trunkHeight * 1.0, Math.sin(bAng) * 2.1);
      bLeaf.scale.set(1.1, 0.8, 1.1);
      tree.add(bLeaf);
    }

    // Top Multi-Tier Canopy Clusters
    const folMat = hue === 'teal' ? materials.treeFoliageTeal : materials.treeFoliageViolet;
    const topLeaf1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.8, 2), folMat);
    topLeaf1.position.set(0, trunkHeight + 0.6, 0);
    topLeaf1.scale.set(1.4, 0.9, 1.3);
    topLeaf1.castShadow = true;
    tree.add(topLeaf1);

    const topLeaf2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.3, 2), folMat);
    topLeaf2.position.set(0.3, trunkHeight + 1.8, -0.2);
    topLeaf2.scale.set(1.2, 0.8, 1.1);
    tree.add(topLeaf2);

    const topLeaf3 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8, 1), folMat);
    topLeaf3.position.set(-0.2, trunkHeight + 2.7, 0.2);
    tree.add(topLeaf3);

    return tree;
  }

  // Plant a lush forest of 9 natural trees
  const forestLayout = [
    { x: 0, z: 0, h: 4.8, hue: 'teal' as const, s: 1.2 },
    { x: -3.8, z: 2.2, h: 4.2, hue: 'violet' as const, s: 1.05 },
    { x: 3.5, z: -2.8, h: 5.2, hue: 'teal' as const, s: 1.25 },
    { x: 2.8, z: 3.6, h: 3.8, hue: 'teal' as const, s: 0.95 },
    { x: -4.5, z: -3.2, h: 4.5, hue: 'violet' as const, s: 1.1 },
    { x: -1.2, z: 5.2, h: 3.6, hue: 'teal' as const, s: 0.9 },
    { x: 4.8, z: 1.4, h: 4.4, hue: 'violet' as const, s: 1.0 },
    { x: -2.6, z: -5.0, h: 4.0, hue: 'teal' as const, s: 0.95 },
    { x: 1.4, z: -5.2, h: 4.6, hue: 'violet' as const, s: 1.15 },
  ];

  forestLayout.forEach((cfg) => {
    const tree = createNaturalTree(cfg.h, cfg.hue, cfg.s);
    tree.position.set(cfg.x, 0, cfg.z);
    forestWindGroup.add(tree);
  });

  // Understory Flowering Plants and Bioluminescent Blossom Clusters
  for (let f = 0; f < 20; f++) {
    const flowerGroup = new THREE.Group();
    const fx = (Math.random() - 0.5) * 11;
    const fz = (Math.random() - 0.5) * 11;
    flowerGroup.position.set(fx, 0.2, fz);

    // Stem
    const fStem = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.8, 6), materials.grassMaterial);
    fStem.position.y = 0.4;
    flowerGroup.add(fStem);

    // Blossom Petals
    const blossom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), materials.flowerPetalMat);
    blossom.position.y = 0.85;
    flowerGroup.add(blossom);

    auroraForestGroup.add(flowerGroup);
  }

  // Bioluminescent Fantasy Mushrooms with glowing gills
  for (let m = 0; m < 18; m++) {
    const mGroup = new THREE.Group();
    const mx = (Math.random() - 0.5) * 10;
    const mz = (Math.random() - 0.5) * 10;
    mGroup.position.set(mx, 0.2, mz);
    const mScale = 0.5 + Math.random() * 0.7;
    mGroup.scale.setScalar(mScale);

    // Curved stem
    const stemGeo = new THREE.CylinderGeometry(0.08, 0.16, 0.9, 8);
    const stem = new THREE.Mesh(stemGeo, materials.templeWhite);
    stem.position.y = 0.45;
    mGroup.add(stem);

    // Mushroom Cap
    const capGeo = new THREE.SphereGeometry(0.42, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const cap = new THREE.Mesh(capGeo, materials.mushroomCap);
    cap.position.y = 0.9;
    mGroup.add(cap);

    auroraForestGroup.add(mGroup);
  }

  // Violet/Teal Forest Ambient Light
  const forestLight = new THREE.PointLight(0xa855f7, 2.5, 20);
  forestLight.position.set(0, 4.0, 0);
  auroraForestGroup.add(forestLight);

  landmarksGroup.add(auroraForestGroup);
  createBeaconMarker('aurora-forest', 'Aurora Forest', 10, 11.5, 13, 0xa855f7);

  // ========================================================
  // 5. CLOUD CITY (Location D: Aerodynamic Futuristic Metropolis)
  // ========================================================
  const cloudCityGroup = new THREE.Group();
  cloudCityGroup.position.set(-12, 2.6, 11);

  // Floating Foundation Platform (Proportionate footprint)
  const cityPlazaGeo = new THREE.CylinderGeometry(5.4, 4.6, 1.2, 6);
  const cityPlaza = new THREE.Mesh(cityPlazaGeo, materials.cityCeramic);
  cityPlaza.position.y = 0.6;
  cityPlaza.receiveShadow = true;
  cloudCityGroup.add(cityPlaza);

  // Cantilevered Hexagonal Skywalk Terraces
  const terraceGeo = new THREE.CylinderGeometry(6.2, 5.4, 0.3, 6);
  const terrace = new THREE.Mesh(terraceGeo, materials.cityCeramic);
  terrace.position.y = 1.35;
  cloudCityGroup.add(terrace);

  // Central Metropolis Skyscraper (Tiered aerodynamic setbacks)
  // Tier 1 Base Skyscraper
  const t1Geo = new THREE.CylinderGeometry(1.6, 2.0, 5.0, 6);
  const spireT1 = new THREE.Mesh(t1Geo, materials.cityFacade);
  spireT1.position.y = 3.8;
  spireT1.castShadow = true;
  cloudCityGroup.add(spireT1);

  // Tier 2 Mid Tower with Glass Sky-Lounge
  const t2Geo = new THREE.CylinderGeometry(1.2, 1.5, 4.5, 6);
  const spireT2 = new THREE.Mesh(t2Geo, materials.cityFacade);
  spireT2.position.y = 8.4;
  spireT2.castShadow = true;
  cloudCityGroup.add(spireT2);

  // Cantilevered Observation Balcony Ring
  const obsRingGeo = new THREE.TorusGeometry(1.8, 0.15, 8, 32);
  const obsRing = new THREE.Mesh(obsRingGeo, materials.cityCeramic);
  obsRing.rotation.x = Math.PI / 2;
  obsRing.position.y = 7.8;
  cloudCityGroup.add(obsRing);

  // Tier 3 Spire Crown & Needle Mast
  const t3Geo = new THREE.CylinderGeometry(0.8, 1.1, 3.2, 6);
  const spireT3 = new THREE.Mesh(t3Geo, materials.cityCeramic);
  spireT3.position.y = 12.1;
  cloudCityGroup.add(spireT3);

  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.14, 3.0, 8), materials.templeGold);
  needle.position.y = 15.0;
  cloudCityGroup.add(needle);

  // Three Satellite Residential & Research Towers with Glass Skybridges
  const satTowerLayout = [
    { x: -2.8, z: 2.2, h: 6.8, r: 0.9 },
    { x: 2.8, z: 2.4, h: 6.0, r: 0.8 },
    { x: 0.1, z: -3.0, h: 7.4, r: 0.95 },
  ];

  satTowerLayout.forEach((st) => {
    // Tower body with window facade
    const tMesh = new THREE.Mesh(new THREE.CylinderGeometry(st.r * 0.85, st.r, st.h, 6), materials.cityFacade);
    tMesh.position.set(st.x, 1.35 + st.h / 2, st.z);
    tMesh.castShadow = true;
    cloudCityGroup.add(tMesh);

    // Glowing architectural conduit collar
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(st.r * 1.1, st.r * 1.1, 0.28, 6), materials.cityGlowCyan);
    collar.position.set(st.x, 1.35 + st.h * 0.72, st.z);
    cloudCityGroup.add(collar);

    // Glass Skyway Tube linking satellite to central tower
    const tubePath = new THREE.LineCurve3(
      new THREE.Vector3(st.x, 1.35 + st.h * 0.6, st.z),
      new THREE.Vector3(0, 1.35 + st.h * 0.6, 0)
    );
    const skyway = new THREE.Mesh(new THREE.TubeGeometry(tubePath, 8, 0.2, 8, false), materials.cityGlass);
    cloudCityGroup.add(skyway);
  });

  // Aerial Docking Pads & Parked Aerodynamic Sky Skiffs
  const padGeo = new THREE.CylinderGeometry(1.3, 1.1, 0.25, 16);
  const padMat = materials.cityCeramic;
  const pad1 = new THREE.Mesh(padGeo, padMat);
  pad1.position.set(-3.8, 1.5, -0.8);
  cloudCityGroup.add(pad1);

  // Holographic landing ring
  const padRing = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.05, 24), materials.cityGlowCyan);
  padRing.rotation.x = -Math.PI / 2;
  padRing.position.set(-3.8, 1.63, -0.8);
  cloudCityGroup.add(padRing);

  // Aerodynamic Sky Skiff (Vessel docked)
  const skiffGroup = new THREE.Group();
  skiffGroup.position.set(-3.8, 1.85, -0.8);
  const skiffHull = new THREE.Mesh(new THREE.ConeGeometry(0.32, 1.1, 4), materials.templeWhite);
  skiffHull.rotateZ(Math.PI / 2);
  skiffHull.scale.set(0.6, 1.4, 0.6);
  skiffGroup.add(skiffHull);

  const skiffCanopy = new THREE.Mesh(new THREE.SphereGeometry(0.18, 8, 8), materials.cityGlass);
  skiffCanopy.position.y = 0.15;
  skiffGroup.add(skiffCanopy);
  cloudCityGroup.add(skiffGroup);

  // Kinetic Rotating Solar Collector Beacon Rings
  const cityBeaconRings = new THREE.Group();
  cityBeaconRings.position.set(0, 13.5, 0);
  const bRing1 = new THREE.Mesh(new THREE.TorusGeometry(2.4, 0.09, 8, 36), materials.cityGlowCyan);
  bRing1.rotation.x = Math.PI / 2;
  cityBeaconRings.add(bRing1);
  cloudCityGroup.add(cityBeaconRings);

  // Cloud City Point Light
  const cityLight = new THREE.PointLight(0x06b6d4, 2.2, 18);
  cityLight.position.set(0, 7.5, 0);
  cloudCityGroup.add(cityLight);

  landmarksGroup.add(cloudCityGroup);
  createBeaconMarker('cloud-city', 'Cloud City', -12, 15.0, 11, 0x06b6d4);

  return {
    landmarksGroup,
    animatedComponents: {
      portalOuterRing,
      portalInnerRing,
      portalGyroscopicRing,
      portalCore,
      portalShards,
      portalLightColumn,
      crystalValleyGroup,
      templeOrb,
      templeAltarRings,
      cityBeaconRings,
      floatingBeaconMarkers,
      forestWindGroup,
    },
    beaconMeshes,
  };
}
