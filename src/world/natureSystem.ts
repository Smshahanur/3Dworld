import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { isPointInDriveableArea } from './collisionSystem';

export interface NatureSystemAnimatedComponents {
  birdsGroup: THREE.Group;
  swingGroup?: THREE.Group;
  seesawGroup?: THREE.Group;
  koiFountainSpout?: THREE.Mesh;
  reedsGroup?: THREE.Group;
}

export interface NatureSystemResult {
  natureGroup: THREE.Group;
  animatedComponents: NatureSystemAnimatedComponents;
  updateAnimation: (elapsed: number, delta: number) => void;
}

/**
 * Living Nature, Continuous River System, Multi-District Parks and Recreation
 * Crafted with zero road intrusions and high-fidelity Three.js procedural assets.
 */
export function createLivingNatureSystem(materials: MaterialLibrary): NatureSystemResult {
  const natureGroup = new THREE.Group();
  natureGroup.name = 'LivingNatureSystem';

  const foliageWindGroup = new THREE.Group();
  natureGroup.add(foliageWindGroup);

  const reedsGroup = new THREE.Group();
  natureGroup.add(reedsGroup);

  let swingGroup: THREE.Group | undefined;
  let seesawGroup: THREE.Group | undefined;
  let koiFountainSpout: THREE.Mesh | undefined;

  // =========================================================================
  // 1. CONTINUOUS RIVERBANKS & RECREATION ALONG WATERWAYS
  // =========================================================================

  // Helper for placing rocks & boulders safely on riverbanks
  function addRiverbankBoulders() {
    const rockLocations = [
      // Main River West Bank (Modern Village side)
      { x: 42.5, z: -15, s: 1.3 },
      { x: 43.0, z: -25, s: 1.6 },
      { x: 42.0, z: -45, s: 1.8 },
      { x: 43.2, z: 12, s: 1.4 },
      { x: 42.8, z: 22, s: 1.7 },
      { x: 43.0, z: 48, s: 1.5 },
      // Main River East Bank (Capital Town side)
      { x: 57.2, z: -12, s: 1.5 },
      { x: 57.8, z: -35, s: 1.7 },
      { x: 57.0, z: 14, s: 1.4 },
      { x: 57.5, z: 26, s: 1.8 },
      { x: 57.2, z: 42, s: 1.6 },
      // West River Creek Banks (Rural-Modern frontier)
      { x: -59.5, z: -12, s: 1.3 },
      { x: -60.0, z: -32, s: 1.6 },
      { x: -46.5, z: -20, s: 1.4 },
      { x: -47.0, z: 18, s: 1.7 },
      { x: -59.8, z: 28, s: 1.5 },
    ];

    rockLocations.forEach((r) => {
      if (isPointInDriveableArea(r.x, r.z, 0.6)) return;
      const rockGeo = new THREE.DodecahedronGeometry(r.s, 1);
      const rock = new THREE.Mesh(rockGeo, materials.rockStoneMaterial);
      rock.position.set(r.x, -0.3, r.z);
      rock.scale.set(1.2, 0.7, 1.1);
      rock.rotation.set(Math.random(), Math.random(), Math.random());
      rock.castShadow = true;
      rock.receiveShadow = true;
      natureGroup.add(rock);
    });
  }
  addRiverbankBoulders();

  // Natural River Reeds & Cattails in shallow river margins
  function addRiverReeds() {
    const reedLocations = [
      { x: 43.8, z: -18 }, { x: 44.0, z: -22 }, { x: 43.6, z: -30 },
      { x: 43.9, z: 16 }, { x: 44.2, z: 24 }, { x: 43.7, z: 50 },
      { x: 56.2, z: -16 }, { x: 56.0, z: 18 }, { x: 56.4, z: 32 },
      { x: -58.2, z: -15 }, { x: -58.0, z: 22 }, { x: -48.2, z: -14 },
    ];

    const reedGeo = new THREE.CylinderGeometry(0.025, 0.035, 1.4, 6);
    const catHeadGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.28, 6);
    const reedMat = materials.bambooGreen;
    const catMat = materials.treeTrunkBark;

    reedLocations.forEach((loc) => {
      if (isPointInDriveableArea(loc.x, loc.z, 0.5)) return;
      const clump = new THREE.Group();
      clump.position.set(loc.x, -0.25, loc.z);

      for (let j = 0; j < 5; j++) {
        const ox = (Math.random() - 0.5) * 0.6;
        const oz = (Math.random() - 0.5) * 0.6;
        const stem = new THREE.Mesh(reedGeo, reedMat);
        stem.position.set(ox, 0.7, oz);
        stem.rotation.set((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15);
        clump.add(stem);

        const head = new THREE.Mesh(catHeadGeo, catMat);
        head.position.set(ox, 1.25, oz);
        clump.add(head);
      }
      reedsGroup.add(clump);
    });
  }
  addRiverReeds();

  // Riverside Wooden Fishing Jetties & Observation Lookouts
  function addRiversideJetties() {
    // 1. Main River Fishing Pier (Modern Village side at X: 42, Z: 20)
    const pier1 = new THREE.Group();
    pier1.position.set(43.5, 0.05, 20);

    const deck1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.18, 2.4), materials.modernWoodSiding);
    deck1.position.set(0, 0, 0);
    deck1.castShadow = true;
    pier1.add(deck1);

    // Pilings into water
    for (const px of [-1.8, 1.8]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.4, 8), materials.treeTrunkBark);
      post.position.set(px, -0.5, 0);
      pier1.add(post);
    }

    // Rustic bench on pier
    const bench1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.5), materials.modernWoodSiding);
    bench1.position.set(0, 0.25, -0.7);
    pier1.add(bench1);

    // Angled fishing rod resting on railing
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.025, 2.6, 6), materials.metalSteel);
    rod.rotation.z = Math.PI / 4;
    rod.rotation.y = -Math.PI / 3;
    rod.position.set(1.4, 0.8, 0.4);
    pier1.add(rod);

    natureGroup.add(pier1);

    // 2. West Creek Timber Fishing Deck (Rural side at X: -47, Z: -20)
    const pier2 = new THREE.Group();
    pier2.position.set(-47.0, 0.05, -20);

    const deck2 = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.18, 2.2), materials.modernWoodSiding);
    deck2.position.set(0, 0, 0);
    deck2.castShadow = true;
    pier2.add(deck2);

    for (const px of [-1.5, 1.5]) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.2, 8), materials.treeTrunkBark);
      post.position.set(px, -0.45, 0);
      pier2.add(post);
    }
    natureGroup.add(pier2);
  }
  addRiversideJetties();

  // =========================================================================
  // 2. MODERN ARCHITECTURAL CABLE-STAYED PEDESTRIAN BRIDGE
  // =========================================================================
  // Spanning the Main River at Z = 36 between X: 39 and X: 61 (completely clear of roads)
  function addModernCableStayedBridge() {
    const bridge = new THREE.Group();
    bridge.position.set(50.0, 0, 36.0);

    // Arched Aerodynamic Deck
    const span = 22.0;
    const deckWidth = 3.4;
    const deckGeo = new THREE.BoxGeometry(span, 0.35, deckWidth);
    const deckMesh = new THREE.Mesh(deckGeo, materials.asphaltMaterial);
    deckMesh.position.y = 1.1;
    deckMesh.castShadow = true;
    deckMesh.receiveShadow = true;
    bridge.add(deckMesh);

    // Approach Steps / Ramps on riverbanks
    const rampGeo = new THREE.BoxGeometry(2.8, 0.45, deckWidth);
    const rampW = new THREE.Mesh(rampGeo, materials.concreteCurbs);
    rampW.position.set(-span * 0.5 - 1.2, 0.55, 0);
    rampW.rotation.z = -0.22;
    bridge.add(rampW);

    const rampE = new THREE.Mesh(rampGeo, materials.concreteCurbs);
    rampE.position.set(span * 0.5 + 1.2, 0.55, 0);
    rampE.rotation.z = 0.22;
    bridge.add(rampE);

    // Soaring Central Inverted A-Frame Pylon (Height: 11.5m)
    const pylonGroup = new THREE.Group();
    pylonGroup.position.set(0, 1.1, 0);

    const pylonGeo = new THREE.CylinderGeometry(0.18, 0.32, 11.5, 12);
    // North leg
    const pylonN = new THREE.Mesh(pylonGeo, materials.modernWhiteStucco);
    pylonN.position.set(0, 5.75, 1.6);
    pylonN.rotation.x = -0.14;
    pylonN.castShadow = true;
    pylonGroup.add(pylonN);

    // South leg
    const pylonS = new THREE.Mesh(pylonGeo, materials.modernWhiteStucco);
    pylonS.position.set(0, 5.75, -1.6);
    pylonS.rotation.x = 0.14;
    pylonS.castShadow = true;
    pylonGroup.add(pylonS);

    // Pylon Crown Finial
    const crown = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.2, 8), materials.capitalGoldTrim);
    crown.position.set(0, 11.6, 0);
    crown.castShadow = true;
    pylonGroup.add(crown);

    // Stay Cables fanning down from pylon apex to deck perimeter
    const cableMat = materials.metalSteel;
    const cableOffsets = [-8.5, -5.5, -2.5, 2.5, 5.5, 8.5];
    cableOffsets.forEach((ox) => {
      for (const side of [-1.55, 1.55]) {
        const start = new THREE.Vector3(0, 11.0, 0);
        const end = new THREE.Vector3(ox, 0.2, side);
        const length = start.distanceTo(end);
        const cableGeo = new THREE.CylinderGeometry(0.018, 0.018, length, 6);
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.position.copy(start.clone().add(end).multiplyScalar(0.5));
        cable.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
        pylonGroup.add(cable);
      }
    });

    bridge.add(pylonGroup);

    // Glass Balustrades with Stainless Steel Handrail along deck sides
    for (const side of [-deckWidth * 0.5 + 0.1, deckWidth * 0.5 - 0.1]) {
      const glassGeo = new THREE.BoxGeometry(span, 0.95, 0.08);
      const glass = new THREE.Mesh(glassGeo, materials.capitalGlassTower);
      glass.position.set(0, 1.7, side);
      bridge.add(glass);

      const railGeo = new THREE.BoxGeometry(span, 0.08, 0.12);
      const rail = new THREE.Mesh(railGeo, materials.metalSteel);
      rail.position.set(0, 2.2, side);
      bridge.add(rail);

      // Warm linear LED under-rail glow
      const ledGeo = new THREE.PlaneGeometry(span, 0.04);
      ledGeo.rotateX(Math.PI / 2);
      const led = new THREE.Mesh(ledGeo, materials.lampGlow);
      led.position.set(0, 2.15, side);
      bridge.add(led);
    }

    // Mid-span Observation Belvederes with Teak Benches
    const belvedereGeo = new THREE.CylinderGeometry(1.4, 1.4, 0.35, 16, 1, false, 0, Math.PI);
    const belvN = new THREE.Mesh(belvedereGeo, materials.modernWhiteStucco);
    belvN.position.set(0, 1.1, deckWidth * 0.5);
    bridge.add(belvN);

    const belvBench = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.45, 0.5), materials.modernWoodSiding);
    belvBench.position.set(0, 1.5, deckWidth * 0.5 + 0.6);
    bridge.add(belvBench);

    natureGroup.add(bridge);
  }
  addModernCableStayedBridge();

  // =========================================================================
  // 3. CHILDREN'S PARKS & PLAYGROUNDS
  // =========================================================================

  // Modern Village Central Park Playground (Inside Central Park at X: 27, Z: -14)
  function addCentralParkPlayground() {
    const play = new THREE.Group();
    play.position.set(26.0, 0.15, -14.0);

    // 1. Shock-absorbing colorful rubber tile safety surfacing
    const tileFloor = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.08, 10.0), materials.sportCourtBlue);
    tileFloor.position.set(0, 0.04, 0);
    tileFloor.receiveShadow = true;
    play.add(tileFloor);

    // Cheerful contrasting center pad
    const centerPad = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.09, 5.0), materials.sportCourtOrange);
    centerPad.position.set(0, 0.045, 0);
    play.add(centerPad);

    // 2. Slide Play Tower with Tubular Spiral Slide
    const tower = new THREE.Group();
    tower.position.set(-3.5, 0, 2.5);

    // Timber corner posts
    for (const px of [-1.0, 1.0]) {
      for (const pz of [-1.0, 1.0]) {
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.2, 8), materials.modernWoodSiding);
        post.position.set(px, 1.6, pz);
        post.castShadow = true;
        tower.add(post);
      }
    }
    // Elevated deck platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.12, 2.1), materials.modernWoodSiding);
    platform.position.y = 1.8;
    tower.add(platform);

    // Slanted Pyramid Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.2, 4), materials.carPaintEmerald);
    roof.rotation.y = Math.PI / 4;
    roof.position.y = 3.6;
    tower.add(roof);

    // Slanted Yellow Slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.1, 3.4), materials.carPaintYellow);
    slide.position.set(0, 0.9, -1.8);
    slide.rotation.x = -0.55;
    slide.castShadow = true;
    tower.add(slide);

    play.add(tower);

    // 3. Dual Swing Set with Animated Pendulum Swing
    const swingSet = new THREE.Group();
    swingSet.position.set(2.8, 0, 2.2);

    // A-frame steel uprights
    const uprightGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8);
    for (const sx of [-1.8, 1.8]) {
      const leg1 = new THREE.Mesh(uprightGeo, materials.carPaintBlue);
      leg1.position.set(sx, 1.4, 0.45);
      leg1.rotation.x = -0.22;
      swingSet.add(leg1);

      const leg2 = new THREE.Mesh(uprightGeo, materials.carPaintBlue);
      leg2.position.set(sx, 1.4, -0.45);
      leg2.rotation.x = 0.22;
      swingSet.add(leg2);
    }

    // Top Crossbar
    const crossbar = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.12, 0.12), materials.metalSteel);
    crossbar.position.set(0, 2.7, 0);
    swingSet.add(crossbar);

    // Animated swing group
    swingGroup = new THREE.Group();
    swingGroup.position.set(0, 2.7, 0);

    for (const sx of [-0.8, 0.8]) {
      const seatGroup = new THREE.Group();
      seatGroup.position.set(sx, 0, 0);

      // Chains
      for (const cx of [-0.25, 0.25]) {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 2.1, 6), materials.metalSteel);
        chain.position.set(cx, -1.05, 0);
        seatGroup.add(chain);
      }
      // Rubber seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.06, 0.28), materials.carTireRubber);
      seat.position.set(0, -2.1, 0);
      seat.castShadow = true;
      seatGroup.add(seat);

      swingGroup.add(seatGroup);
    }
    swingSet.add(swingGroup);
    play.add(swingSet);

    // 4. Animated Seesaw
    const seesawSet = new THREE.Group();
    seesawSet.position.set(-2.0, 0, -2.2);

    // Pivot Fulcrum
    const pivot = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.7, 8), materials.metalSteel);
    pivot.position.y = 0.35;
    seesawSet.add(pivot);

    // Animated tilting plank
    seesawGroup = new THREE.Group();
    seesawGroup.position.set(0, 0.7, 0);

    const plank = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 0.32), materials.modernWoodSiding);
    plank.castShadow = true;
    seesawGroup.add(plank);

    // Seats and Handles on ends
    for (const ex of [-1.6, 1.6]) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), materials.carPaintRed);
      handle.position.set(ex * 0.85, 0.2, 0);
      seesawGroup.add(handle);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 0.28), materials.carPaintBlue);
      seat.position.set(ex, 0.05, 0);
      seesawGroup.add(seat);
    }

    seesawSet.add(seesawGroup);
    play.add(seesawSet);

    // 5. Geodesic Climbing Dome
    const dome = new THREE.Mesh(new THREE.IcosahedronGeometry(1.6, 1), materials.carPaintEmerald);
    dome.position.set(2.6, 1.2, -2.2);
    dome.castShadow = true;
    play.add(dome);

    natureGroup.add(play);
  }
  addCentralParkPlayground();

  // Rural Village Community Playground (West District at X: -128, Z: 12)
  function addRuralVillagePlayground() {
    const rPlay = new THREE.Group();
    rPlay.position.set(-126.0, 0.05, 12.0);

    // Rustic Sandpit with Timber Log Border
    const sandBorder = new THREE.Mesh(new THREE.BoxGeometry(8.2, 0.24, 6.2), materials.modernWoodSiding);
    sandBorder.position.y = 0.12;
    rPlay.add(sandBorder);

    const sand = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.12, 5.6), materials.gravelPathMaterial);
    sand.position.y = 0.1;
    sand.receiveShadow = true;
    rPlay.add(sand);

    // Timber Log Swing Frame
    const swingFrame = new THREE.Group();
    swingFrame.position.set(-2.2, 0, 0);

    const logGeo = new THREE.CylinderGeometry(0.09, 0.11, 2.6, 8);
    for (const lx of [-1.4, 1.4]) {
      const l1 = new THREE.Mesh(logGeo, materials.treeTrunkBark);
      l1.position.set(lx, 1.3, 0.35);
      l1.rotation.x = -0.25;
      swingFrame.add(l1);

      const l2 = new THREE.Mesh(logGeo, materials.treeTrunkBark);
      l2.position.set(lx, 1.3, -0.35);
      l2.rotation.x = 0.25;
      swingFrame.add(l2);
    }
    const logBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.2, 8), materials.treeTrunkBark);
    logBeam.rotation.z = Math.PI / 2;
    logBeam.position.set(0, 2.5, 0);
    swingFrame.add(logBeam);

    // Tire Swing suspended from beam
    const tire = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.12, 8, 16), materials.carTireRubber);
    tire.position.set(0, 0.65, 0);
    tire.rotation.x = Math.PI / 2;
    swingFrame.add(tire);

    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.8, 6), materials.thatchedRoofMaterial);
    rope.position.set(0, 1.6, 0);
    swingFrame.add(rope);

    rPlay.add(swingFrame);

    // Stepping Log Balance Course
    const logSteps = [-1.8, -1.0, -0.2, 0.6, 1.4, 2.2];
    logSteps.forEach((sx, idx) => {
      const step = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.35 + (idx % 3) * 0.1, 8), materials.treeTrunkBark);
      step.position.set(sx, 0.2, -1.8);
      step.castShadow = true;
      rPlay.add(step);
    });

    natureGroup.add(rPlay);
  }
  addRuralVillagePlayground();

  // =========================================================================
  // 4. BOTANICAL GARDENS THEMED ZONES (Modern Village South: X in [20, 40], Z in [25, 48])
  // =========================================================================
  function addExpandedBotanicalGardens() {
    const bg = new THREE.Group();
    bg.position.set(30.0, 0.15, 37.0);

    // 1. Classical Rose Parterre (Geometric hedge & flower embroidery)
    const roseZone = new THREE.Group();
    roseZone.position.set(-6.5, 0, 6.0);

    // Low Boxwood Topiary Borders
    const boxHedgeGeo = new THREE.BoxGeometry(4.8, 0.35, 0.35);
    for (const hz of [-2.0, 2.0]) {
      const h = new THREE.Mesh(boxHedgeGeo, materials.hedgeBoxwood);
      h.position.set(0, 0.18, hz);
      roseZone.add(h);
    }
    const boxHedgeGeoSide = new THREE.BoxGeometry(0.35, 0.35, 4.0);
    for (const hx of [-2.4, 2.4]) {
      const h = new THREE.Mesh(boxHedgeGeoSide, materials.hedgeBoxwood);
      h.position.set(hx, 0.18, 0);
      roseZone.add(h);
    }

    // Blooming Rose Bushes
    const roseColors = [materials.flowerRed, materials.treeFoliageFloweringPink, materials.flowerYellow];
    for (let rx = -1.6; rx <= 1.6; rx += 0.8) {
      for (let rz = -1.2; rz <= 1.2; rz += 0.8) {
        const rMat = roseColors[Math.floor(Math.random() * roseColors.length)];
        const bush = new THREE.Mesh(new THREE.DodecahedronGeometry(0.26, 1), materials.hedgeBoxwood);
        bush.position.set(rx, 0.26, rz);
        roseZone.add(bush);

        const bloom = new THREE.Mesh(new THREE.DodecahedronGeometry(0.12, 0), rMat);
        bloom.position.set(rx, 0.44, rz);
        roseZone.add(bloom);
      }
    }
    bg.add(roseZone);

    // 2. Ornamental Koi Pond with Stepping Stones & Lotus Blossoms
    const koiPond = new THREE.Group();
    koiPond.position.set(-6.5, 0, -6.0);

    // Stone Coping Rim
    const stoneRim = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.35, 10, 24), materials.rockStoneMaterial);
    stoneRim.rotation.x = Math.PI / 2;
    stoneRim.position.y = 0.15;
    koiPond.add(stoneRim);

    // Reflective Pond Water
    const pondWater = new THREE.Mesh(new THREE.CircleGeometry(3.0, 24), materials.lakeWaterMaterial);
    pondWater.rotation.x = -Math.PI / 2;
    pondWater.position.y = 0.14;
    koiPond.add(pondWater);

    // Stepping Stones across pond
    const stepOffsets = [-1.5, -0.5, 0.5, 1.5];
    stepOffsets.forEach((so) => {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.42, 0.16, 10), materials.capitalGranite);
      stone.position.set(so, 0.18, so * 0.4);
      koiPond.add(stone);
    });

    // Floating Lotus Pads & Pink Blossoms
    for (let lp = 0; lp < 6; lp++) {
      const ang = (lp / 6) * Math.PI * 2;
      const rad = 1.2 + (lp % 3) * 0.5;
      const pad = new THREE.Mesh(new THREE.CircleGeometry(0.28, 10), materials.waterLilyMaterial);
      pad.rotation.x = -Math.PI / 2;
      pad.position.set(Math.cos(ang) * rad, 0.15, Math.sin(ang) * rad);
      koiPond.add(pad);

      if (lp % 2 === 0) {
        const lotus = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.22, 6), materials.lotusBlossomMaterial);
        lotus.position.set(Math.cos(ang) * rad, 0.25, Math.sin(ang) * rad);
        koiPond.add(lotus);
      }
    }

    // Japanese Stone Garden Lantern (Tōrō) on pond bank
    const toro = new THREE.Group();
    toro.position.set(2.4, 0.15, 2.2);

    const toroBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.2, 0.55), materials.rockStoneMaterial);
    toroBase.position.y = 0.1;
    toro.add(toroBase);

    const toroShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 0.8, 8), materials.rockStoneMaterial);
    toroShaft.position.y = 0.55;
    toro.add(toroShaft);

    const toroLight = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.35, 0.42), materials.lampGlow);
    toroLight.position.y = 1.05;
    toro.add(toroLight);

    const toroRoof = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.25, 4), materials.rockStoneMaterial);
    toroRoof.rotation.y = Math.PI / 4;
    toroRoof.position.y = 1.35;
    toro.add(toroRoof);

    koiPond.add(toro);
    bg.add(koiPond);

    // 3. Palm Trees & Bamboo Grove (Tropical Pavilion Zone)
    const palmLocations = [
      { x: 6.5, z: 6.0 },
      { x: 8.5, z: 3.0 },
      { x: 6.0, z: -5.5 },
    ];
    palmLocations.forEach((pl) => {
      const palm = new THREE.Group();
      palm.position.set(pl.x, 0, pl.z);

      // Curved segmented palm trunk
      const pTrunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 5.2, 10), materials.treeTrunkBark);
      pTrunk.position.set(0, 2.6, 0);
      pTrunk.rotation.z = -0.08;
      pTrunk.castShadow = true;
      palm.add(pTrunk);

      // Crown of arched palm fronds
      for (let f = 0; f < 8; f++) {
        const ang = (f / 8) * Math.PI * 2;
        const frond = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.04, 0.4), materials.cropGreen);
        frond.position.set(Math.cos(ang) * 1.0, 5.2, Math.sin(ang) * 1.0);
        frond.rotation.y = ang;
        frond.rotation.z = -0.35;
        frond.castShadow = true;
        palm.add(frond);
      }
      bg.add(palm);
    });

    // 4. Botanical Plant Info Plaques on Bronze Stanchions
    const plaqueLocations = [
      { x: -4.5, z: 4.0, text: 'Rosa gallica - French Rose' },
      { x: -4.5, z: -4.0, text: 'Nelumbo nucifera - Sacred Lotus' },
      { x: 5.0, z: 4.5, text: 'Phoenix dactylifera - Date Palm' },
    ];
    plaqueLocations.forEach((plq) => {
      const plaque = new THREE.Group();
      plaque.position.set(plq.x, 0, plq.z);

      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), materials.metalBronze);
      post.position.y = 0.45;
      plaque.add(post);

      const plate = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.25, 0.04), materials.capitalGoldTrim);
      plate.position.set(0, 0.95, 0);
      plate.rotation.x = -0.35;
      plaque.add(plate);

      bg.add(plaque);
    });

    natureGroup.add(bg);
  }
  addExpandedBotanicalGardens();

  // Capital Riverside Modern Play Complex (South-west of Capital Town: X: 85, Z: -44, clear of all roads)
  function addCapitalRiversidePlayground() {
    const crPlay = new THREE.Group();
    crPlay.position.set(85.0, 0.15, -44.0);

    // Sky-blue impact safety flooring pad
    const padGeo = new THREE.BoxGeometry(10.0, 0.08, 8.0);
    const pad = new THREE.Mesh(padGeo, materials.sportCourtBlue);
    pad.position.y = 0.04;
    pad.receiveShadow = true;
    crPlay.add(pad);

    // Modern Curved Climbing Structure with Stainless Steel Slide
    const climb = new THREE.Group();
    climb.position.set(-1.8, 0, 0);

    const archPoles = [-1.5, 1.5];
    archPoles.forEach((ap) => {
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), materials.capitalDarkSteel);
      pole.position.set(ap, 1.4, 0);
      climb.add(pole);
    });

    const bridgeDeck = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.1, 1.2), materials.modernWoodSiding);
    bridgeDeck.position.y = 1.6;
    climb.add(bridgeDeck);

    // Curved spiral slide
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.08, 2.8), materials.carPaintYellow);
    slide.position.set(0, 0.8, 1.6);
    slide.rotation.x = 0.55;
    climb.add(slide);

    crPlay.add(climb);

    // Spring riders (duck / motorbike for toddlers)
    for (const sx of [1.6, 2.8]) {
      const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.45, 6), materials.metalSteel);
      spring.position.set(sx, 0.22, -1.5);
      crPlay.add(spring);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.2), materials.carPaintRed);
      seat.position.set(sx, 0.55, -1.5);
      crPlay.add(seat);
    }

    // Riverside Park Bench & Shade Tree
    const bench = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.45, 0.5), materials.modernWoodSiding);
    bench.position.set(0, 0.25, -3.2);
    crPlay.add(bench);

    natureGroup.add(crPlay);
  }
  addCapitalRiversidePlayground();

  // =========================================================================
  // 5. PUBLIC SPORTS & RECREATION COMPLEX (Capital East Athletics Park: X: 178, Z: 18)
  // Outside all road corridors with >3.5m clearance to the west, >5m to north and south
  // =========================================================================
  function addSportsAndFitnessComplex() {
    const sports = new THREE.Group();
    sports.position.set(178.0, 0.15, 18.0);

    // 1. Full Football Field (24m x 15m) with Turf Striping
    const pitch = new THREE.Group();
    pitch.position.set(0, 0, 0);

    const pitchBed = new THREE.Mesh(new THREE.BoxGeometry(25.0, 0.1, 16.0), materials.grassMaterial);
    pitchBed.position.y = 0.05;
    pitchBed.receiveShadow = true;
    pitch.add(pitchBed);

    // Turf alternating mow stripes
    for (let st = -10.0; st <= 10.0; st += 4.0) {
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.105, 15.6), materials.parkLawnMaterial);
      stripe.position.set(st, 0.052, 0);
      pitch.add(stripe);
    }

    // White pitch boundary lines
    const lineMat = materials.roadMarkingWhite;
    // Perimeter Touchlines
    const touchGeoEW = new THREE.BoxGeometry(23.6, 0.11, 0.14);
    for (const tz of [-7.2, 7.2]) {
      const touch = new THREE.Mesh(touchGeoEW, lineMat);
      touch.position.set(0, 0.055, tz);
      pitch.add(touch);
    }
    const touchGeoNS = new THREE.BoxGeometry(0.14, 0.11, 14.4);
    for (const tx of [-11.8, 11.8]) {
      const touch = new THREE.Mesh(touchGeoNS, lineMat);
      touch.position.set(tx, 0.055, 0);
      pitch.add(touch);
    }
    // Halfway line & Center Circle
    const halfLine = new THREE.Mesh(touchGeoNS, lineMat);
    halfLine.position.set(0, 0.055, 0);
    pitch.add(halfLine);

    const circle = new THREE.Mesh(new THREE.RingGeometry(2.1, 2.22, 24), lineMat);
    circle.rotation.x = -Math.PI / 2;
    circle.position.set(0, 0.112, 0);
    pitch.add(circle);

    // Goalposts on West and East ends
    const goalGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.2, 8);
    for (const gx of [-11.8, 11.8]) {
      const goal = new THREE.Group();
      goal.position.set(gx, 0, 0);

      // Posts
      for (const gz of [-1.8, 1.8]) {
        const post = new THREE.Mesh(goalGeo, materials.metalSteel);
        post.position.set(0, 1.1, gz);
        post.castShadow = true;
        goal.add(post);
      }
      // Crossbar
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 3.6), materials.metalSteel);
      bar.position.set(0, 2.2, 0);
      goal.add(bar);

      pitch.add(goal);
    }

    sports.add(pitch);

    // 2. Outdoor Calisthenics & Fitness Station (Positioned East of Football pitch)
    const gym = new THREE.Group();
    gym.position.set(16.5, 0, 0);

    const gymMat = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.08, 5.0), materials.sportCourtOrange);
    gymMat.position.y = 0.04;
    gym.add(gymMat);

    // Pull-up Bar Tower
    const barPostGeo = new THREE.CylinderGeometry(0.05, 0.05, 2.5, 8);
    const p1 = new THREE.Mesh(barPostGeo, materials.metalSteel);
    p1.position.set(-1.8, 1.25, 0);
    gym.add(p1);

    const p2 = new THREE.Mesh(barPostGeo, materials.metalSteel);
    p2.position.set(-0.5, 1.25, 0);
    gym.add(p2);

    const chinBar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.3, 8), materials.metalSteel);
    chinBar.rotation.z = Math.PI / 2;
    chinBar.position.set(-1.15, 2.4, 0);
    gym.add(chinBar);

    // Parallel Dip Bars
    for (const dz of [-0.4, 0.4]) {
      const d1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), materials.capitalDarkSteel);
      d1.position.set(0.8, 0.6, dz);
      gym.add(d1);

      const d2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 8), materials.capitalDarkSteel);
      d2.position.set(2.2, 0.6, dz);
      gym.add(d2);

      const dBar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 8), materials.metalSteel);
      dBar.rotation.z = Math.PI / 2;
      dBar.position.set(1.5, 1.2, dz);
      gym.add(dBar);
    }

    sports.add(gym);

    natureGroup.add(sports);
  }
  addSportsAndFitnessComplex();

  // =========================================================================
  // 6. SOARING FLOCK OF PROCEDURAL BIRDS
  // =========================================================================
  const birdsGroup = new THREE.Group();
  birdsGroup.name = 'SoaringBirdsFlock';

  const birdWingMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.5,
    metalness: 0.1,
    side: THREE.DoubleSide,
  });

  const birdCount = 6;
  const birdMeshes: { group: THREE.Group; wingL: THREE.Mesh; wingR: THREE.Mesh; phase: number; radius: number; speed: number; alt: number }[] = [];

  for (let b = 0; b < birdCount; b++) {
    const bGroup = new THREE.Group();
    bGroup.name = `flock-bird-${b}`;

    // Body
    const body = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.85, 6), birdWingMat);
    body.name = `bird-body-${b}`;
    body.userData = { isBird: true };
    body.rotation.x = Math.PI / 2;
    bGroup.add(body);

    // Left Wing
    const wingGeo = new THREE.PlaneGeometry(0.75, 0.24);
    const wingL = new THREE.Mesh(wingGeo, birdWingMat);
    wingL.name = `bird-wing-l-${b}`;
    wingL.userData = { isBird: true };
    wingL.position.set(-0.4, 0, 0);
    bGroup.add(wingL);

    // Right Wing
    const wingR = new THREE.Mesh(wingGeo, birdWingMat);
    wingR.name = `bird-wing-r-${b}`;
    wingR.userData = { isBird: true };
    wingR.position.set(0.4, 0, 0);
    bGroup.add(wingR);

    // Position bird at sky flight altitude immediately
    bGroup.position.set(0, 32.0, 0);
    birdsGroup.add(bGroup);

    birdMeshes.push({
      group: bGroup,
      wingL,
      wingR,
      phase: b * 1.2,
      radius: 45.0 + b * 6.0,
      speed: 0.25 + (b % 3) * 0.05,
      alt: 28.0 + (b % 4) * 3.5,
    });
  }
  natureGroup.add(birdsGroup);

  // =========================================================================
  // 7. ANIMATION TICK LOOP HOOK
  // =========================================================================
  function updateAnimation(elapsed: number, delta: number) {
    // 1. Flapping and gliding birds along looping curved paths over river & lake
    birdMeshes.forEach((bird) => {
      const angle = elapsed * bird.speed + bird.phase;
      // Figure-eight / elliptical flight path across the lake and river
      const bx = Math.sin(angle) * bird.radius + 15;
      const bz = Math.cos(angle * 0.7) * (bird.radius * 0.7) - 20;
      const by = bird.alt + Math.sin(angle * 2) * 2.5;

      bird.group.position.set(bx, by, bz);

      // Facing flight direction
      const nextX = Math.sin(angle + 0.02) * bird.radius + 15;
      const nextZ = Math.cos((angle + 0.02) * 0.7) * (bird.radius * 0.7) - 20;
      bird.group.rotation.y = Math.atan2(nextX - bx, nextZ - bz);

      // Flapping wings
      const flap = Math.sin(elapsed * 6.5 + bird.phase) * 0.45;
      bird.wingL.rotation.z = flap;
      bird.wingR.rotation.z = -flap;
    });

    // 2. Gentle sway on reeds in river breezes
    reedsGroup.children.forEach((clump, idx) => {
      clump.rotation.z = Math.sin(elapsed * 1.6 + idx) * 0.06;
      clump.rotation.x = Math.cos(elapsed * 1.4 + idx * 0.7) * 0.05;
    });

    // 3. Playground swings idle pendulum sway
    if (swingGroup) {
      swingGroup.rotation.x = Math.sin(elapsed * 1.7) * 0.22;
    }

    // 4. Playground seesaw idle rocking
    if (seesawGroup) {
      seesawGroup.rotation.z = Math.sin(elapsed * 1.4) * 0.15;
    }
  }

  // Pre-seed bird animation at t=0 so initial coordinates are in the sky
  updateAnimation(0, 0.016);

  return {
    natureGroup,
    animatedComponents: {
      birdsGroup,
      swingGroup,
      seesawGroup,
      koiFountainSpout,
      reedsGroup,
    },
    updateAnimation,
  };
}
