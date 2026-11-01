import * as THREE from 'three';
import { MaterialLibrary } from './materials';

/**
 * Creates the vast continuous modern village landscape:
 * - 240x240m continuous terrain with gentle perimeter hills, landscaped park berms, and lake basin
 * - Completely flat, flush foundation in building and road zones (zero clipping, zero floating)
 * - Perimeter mountain ridges for scenic horizon depth
 * - Realistic asphalt road network with 3D raised concrete curbs, white edge lines, yellow center dashes, crosswalks, and parking stalls
 * - Reflective lake recreation basin with wooden promenade, shoreline beach ring, and arched bridge
 */
export function createModernVillageLandscape(materials: MaterialLibrary): THREE.Group {
  const landscapeGroup = new THREE.Group();
  landscapeGroup.name = 'ModernVillageLandscape';

  // 1. Continuous Main Ground Terrain (240x240 units)
  const terrainSize = 240;
  const terrainSegments = 100;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    // Lake Basin Depression in south quadrant: centered around (5, -45)
    const lakeCenterX = 5;
    const lakeCenterZ = -45;
    const distToLake = Math.hypot((x - lakeCenterX) / 1.5, z - lakeCenterZ);

    let height = 0;

    if (distToLake < 24) {
      // Smooth bowl depression for lake
      const lakeDepth = Math.cos((distToLake / 24) * Math.PI * 0.5) * 2.2;
      height -= lakeDepth;
    } else {
      // Park interior berms: strictly within Central Park lawn (between paths, away from roads)
      const distToPark = Math.hypot(x - 22, z - -6);
      if (distToPark < 14 && Math.abs(z) > 4 && Math.abs(x - 22) > 3) {
        // Soft rolling park mounds (up to 0.22m)
        height = Math.sin((distToPark / 14) * Math.PI) * 0.22;
      } else {
        // Distant rolling hills rising smoothly beyond the village perimeter (> 52m)
        const distFromCenter = Math.hypot(x, z);
        if (distFromCenter > 52) {
          const hillNoise = Math.sin(x * 0.045) * Math.cos(z * 0.045) * 3.6;
          const outerRise = Math.pow((distFromCenter - 52) / 68, 1.85) * 7.5;
          height = Math.max(0, hillNoise + outerRise);
        } else {
          // Village core: strictly flat at 0.0 so roads, curbs, sidewalks, and buildings sit flush
          height = 0;
        }
      }
    }

    pos.setY(i, height);
  }
  terrainGeo.computeVertexNormals();

  const terrainMesh = new THREE.Mesh(terrainGeo, materials.grassMaterial);
  terrainMesh.position.y = 0;
  terrainMesh.receiveShadow = true;
  landscapeGroup.add(terrainMesh);

  // Shoreline Sand & Gravel Beach Collar Ring around the lake
  const beachRingGeo = new THREE.RingGeometry(21, 26, 36);
  beachRingGeo.rotateX(-Math.PI / 2);
  const beachMesh = new THREE.Mesh(beachRingGeo, materials.riverBankMaterial);
  beachMesh.position.set(5, -0.25, -45);
  beachMesh.scale.set(1.4, 1.0, 1.0);
  beachMesh.receiveShadow = true;
  landscapeGroup.add(beachMesh);

  // 2. Lake Water Surface & Shoreline
  const lakeWaterGeo = new THREE.PlaneGeometry(58, 40, 28, 28);
  lakeWaterGeo.rotateX(-Math.PI / 2);
  const lakeMesh = new THREE.Mesh(lakeWaterGeo, materials.lakeWaterMaterial);
  lakeMesh.position.set(5, -0.18, -45);
  lakeMesh.receiveShadow = true;
  landscapeGroup.add(lakeMesh);

  // Decorative shoreline rock boulders along the lake edge
  const lakeRocks = [
    { x: -16, z: -35, s: 1.4 },
    { x: -19, z: -48, s: 1.8 },
    { x: -8, z: -58, s: 1.5 },
    { x: 18, z: -57, s: 2.0 },
    { x: 26, z: -46, s: 1.6 },
    { x: 22, z: -33, s: 1.3 },
    { x: -2, z: -30, s: 1.1 },
    { x: 12, z: -31, s: 1.2 },
    { x: -12, z: -56, s: 1.6 },
  ];
  lakeRocks.forEach((rock) => {
    const geo = new THREE.DodecahedronGeometry(rock.s, 1);
    const m = new THREE.Mesh(geo, materials.rockStoneMaterial);
    m.position.set(rock.x, -0.4, rock.z);
    m.scale.set(1.2, 0.7, 1.1);
    m.rotation.set(Math.random(), Math.random(), Math.random());
    m.castShadow = true;
    m.receiveShadow = true;
    landscapeGroup.add(m);
  });

  // 3. Distant Mountain Silhouettes on Horizon
  const mountainRings = 24;
  for (let i = 0; i < mountainRings; i++) {
    const ang = (i / mountainRings) * Math.PI * 2;
    const rad = 145 + Math.sin(i * 3) * 16;
    const mx = Math.cos(ang) * rad;
    const mz = Math.sin(ang) * rad;
    const mHeight = 18 + (i % 3) * 10 + Math.random() * 8;
    const mBase = 30 + Math.random() * 15;

    const mGeo = new THREE.ConeGeometry(mBase, mHeight, 6);
    const mMesh = new THREE.Mesh(mGeo, materials.rockStoneMaterial);
    mMesh.position.set(mx, mHeight * 0.45, mz);
    mMesh.rotation.y = ang + Math.random() * 0.5;
    landscapeGroup.add(mMesh);
  }

  // 4. Connected Road Network with Curbs, Markings, Crosswalks and Sidewalks
  createRoadNetwork(landscapeGroup, materials);

  // 5. Lake Promenade & Arched Pedestrian Footbridge
  createLakePromenade(landscapeGroup, materials);

  return landscapeGroup;
}

/**
 * Builds the comprehensive village road infrastructure:
 * - High-grip dark asphalt surface
 * - 3D raised concrete curbs
 * - Continuous white edge lines (fog lines)
 * - Yellow dashed centerlines
 * - Pedestrian zebra crosswalks
 * - Paved sidewalks
 * - Roundabout & parking stalls
 */
function createRoadNetwork(group: THREE.Group, materials: MaterialLibrary) {
  const roadY = 0.08;
  const curbY = 0.16;
  const walkY = 0.18;

  // Helper for asphalt road segments with edge lines
  function addRoadSegment(
    x: number,
    z: number,
    w: number,
    d: number,
    isEastWest: boolean = true
  ) {
    // Asphalt plane
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geo, materials.asphaltMaterial);
    mesh.position.set(x, roadY, z);
    mesh.receiveShadow = true;
    group.add(mesh);

    // Continuous White Edge Lines (Fog lines) along both road shoulders
    const edgeLineWidth = 0.16;
    if (isEastWest) {
      const halfD = d * 0.5 - 0.2;
      for (const offset of [-halfD, halfD]) {
        const edgeGeo = new THREE.PlaneGeometry(w, edgeLineWidth);
        edgeGeo.rotateX(-Math.PI / 2);
        const edgeLine = new THREE.Mesh(edgeGeo, materials.roadMarkingWhite);
        edgeLine.position.set(x, roadY + 0.015, z + offset);
        group.add(edgeLine);
      }
    } else {
      const halfW = w * 0.5 - 0.2;
      for (const offset of [-halfW, halfW]) {
        const edgeGeo = new THREE.PlaneGeometry(edgeLineWidth, d);
        edgeGeo.rotateX(-Math.PI / 2);
        const edgeLine = new THREE.Mesh(edgeGeo, materials.roadMarkingWhite);
        edgeLine.position.set(x + offset, roadY + 0.015, z);
        group.add(edgeLine);
      }
    }

    return mesh;
  }

  // Helper for 3D raised concrete curb & sidewalk running alongside roads
  function addSidewalkWithCurb(
    x: number,
    z: number,
    w: number,
    d: number,
    curbSide: 'north' | 'south' | 'east' | 'west'
  ) {
    // Main sidewalk body
    const walkGeo = new THREE.BoxGeometry(w, 0.18, d);
    const walkMesh = new THREE.Mesh(walkGeo, materials.sidewalkMaterial);
    walkMesh.position.set(x, walkY, z);
    walkMesh.receiveShadow = true;
    group.add(walkMesh);

    // Raised concrete curb bevel facing the asphalt
    const curbWidth = 0.18;
    const curbHeight = 0.22;
    let curbGeo: THREE.BoxGeometry;
    let cx = x;
    let cz = z;

    if (curbSide === 'north') {
      curbGeo = new THREE.BoxGeometry(w, curbHeight, curbWidth);
      cz = z + (d * 0.5 - curbWidth * 0.5);
    } else if (curbSide === 'south') {
      curbGeo = new THREE.BoxGeometry(w, curbHeight, curbWidth);
      cz = z - (d * 0.5 - curbWidth * 0.5);
    } else if (curbSide === 'east') {
      curbGeo = new THREE.BoxGeometry(curbWidth, curbHeight, d);
      cx = x + (w * 0.5 - curbWidth * 0.5);
    } else {
      curbGeo = new THREE.BoxGeometry(curbWidth, curbHeight, d);
      cx = x - (w * 0.5 - curbWidth * 0.5);
    }

    const curbMesh = new THREE.Mesh(curbGeo, materials.concreteCurbs);
    curbMesh.position.set(cx, curbY, cz);
    curbMesh.receiveShadow = true;
    curbMesh.castShadow = true;
    group.add(curbMesh);
  }

  // Road 1: Main East-West Boulevard (from Town Center [-42] through Central Roundabout [-5] to Central Park [45])
  addRoadSegment(2, 0, 84, 8, true);
  // Sidewalks along Main Boulevard with concrete curbs
  addSidewalkWithCurb(2, 5.0, 84, 1.8, 'south');
  addSidewalkWithCurb(2, -5.0, 84, 1.8, 'north');

  // Road 2: North-South Boulevard (from Lake Promenade [z: -30] up to Residential District [z: 55])
  addRoadSegment(-5, 12, 8, 86, false);
  // Sidewalks along North-South Boulevard
  addSidewalkWithCurb(-10.0, 12, 1.8, 86, 'east');
  addSidewalkWithCurb(0.0, 12, 1.8, 86, 'west');

  // Road 3: Residential Cul-de-sac & Inner Lane
  addRoadSegment(-32, 40, 46, 7, true);
  addSidewalkWithCurb(-32, 44.4, 46, 1.6, 'south');
  addSidewalkWithCurb(-32, 35.6, 46, 1.6, 'north');

  // Residential North Avenue
  addRoadSegment(-32, 60, 40, 6.5, true);
  addSidewalkWithCurb(-32, 64.2, 40, 1.6, 'south');
  addSidewalkWithCurb(-32, 55.8, 40, 1.6, 'north');

  // Road 4: Botanical Gardens Access Drive
  addRoadSegment(30, 22, 6, 36, false);
  addSidewalkWithCurb(34.0, 22, 1.8, 36, 'west');
  addSidewalkWithCurb(26.0, 22, 1.8, 36, 'east');

  // Road 5: Lake Scenic Promenade Road
  addRoadSegment(0, -28, 54, 7, true);
  addSidewalkWithCurb(0, -23.8, 54, 1.8, 'south');
  addSidewalkWithCurb(0, -32.2, 54, 1.8, 'north');

  // Central Roundabout at intersection (-5, 0)
  const roundOuterGeo = new THREE.RingGeometry(4.2, 8.8, 40);
  roundOuterGeo.rotateX(-Math.PI / 2);
  const roundMesh = new THREE.Mesh(roundOuterGeo, materials.asphaltMaterial);
  roundMesh.position.set(-5, roadY + 0.01, 0);
  roundMesh.receiveShadow = true;
  group.add(roundMesh);

  // Roundabout Raised Stone Curb Rim
  const roundCurbGeo = new THREE.RingGeometry(3.9, 4.3, 40);
  roundCurbGeo.rotateX(-Math.PI / 2);
  const roundCurb = new THREE.Mesh(roundCurbGeo, materials.concreteCurbs);
  roundCurb.position.set(-5, roadY + 0.02, 0);
  group.add(roundCurb);

  // Roundabout Center Island (Landscaped green circle with decorative flowers and sculpture)
  const roundIslandGeo = new THREE.CylinderGeometry(3.9, 4.1, 0.45, 36);
  const roundIsland = new THREE.Mesh(roundIslandGeo, materials.parkLawnMaterial);
  roundIsland.position.set(-5, 0.22, 0);
  roundIsland.receiveShadow = true;
  group.add(roundIsland);

  // Roundabout Flower Border Ring
  for (let i = 0; i < 16; i++) {
    const ang = (i / 16) * Math.PI * 2;
    const fx = -5 + Math.cos(ang) * 3.2;
    const fz = Math.sin(ang) * 3.2;
    const flwGeo = new THREE.DodecahedronGeometry(0.22, 0);
    const flw = new THREE.Mesh(flwGeo, i % 2 === 0 ? materials.flowerYellow : materials.flowerRed);
    flw.position.set(fx, 0.5, fz);
    flw.castShadow = true;
    group.add(flw);
  }

  // Modern abstract sculpture in roundabout center
  const sculpBaseGeo = new THREE.CylinderGeometry(1.2, 1.4, 0.6, 16);
  const sculpBase = new THREE.Mesh(sculpBaseGeo, materials.modernDarkSlate);
  sculpBase.position.set(-5, 0.65, 0);
  group.add(sculpBase);

  const ringGeo1 = new THREE.TorusGeometry(1.4, 0.16, 16, 32);
  const ringMesh1 = new THREE.Mesh(ringGeo1, materials.metalSteel);
  ringMesh1.position.set(-5, 2.2, 0);
  ringMesh1.rotation.y = Math.PI / 4;
  ringMesh1.castShadow = true;
  group.add(ringMesh1);

  const ringGeo2 = new THREE.TorusGeometry(1.0, 0.14, 16, 32);
  const ringMesh2 = new THREE.Mesh(ringGeo2, materials.metalBronze);
  ringMesh2.position.set(-5, 2.2, 0);
  ringMesh2.rotation.x = Math.PI / 3;
  ringMesh2.castShadow = true;
  group.add(ringMesh2);

  // Road Striping: Center Dashed Lines on Main Boulevard
  for (let x = -36; x <= 42; x += 4.5) {
    if (Math.abs(x - -5) > 9.5) { // Don't draw across roundabout
      const dashGeo = new THREE.PlaneGeometry(2.4, 0.22);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, materials.roadMarkingYellow);
      dash.position.set(x, roadY + 0.02, 0);
      group.add(dash);
    }
  }

  // Center Dashed Lines on North-South Boulevard
  for (let z = -24; z <= 50; z += 4.5) {
    if (Math.abs(z) > 9.5) {
      const dashGeo = new THREE.PlaneGeometry(0.22, 2.4);
      dashGeo.rotateX(-Math.PI / 2);
      const dash = new THREE.Mesh(dashGeo, materials.roadMarkingYellow);
      dash.position.set(-5, roadY + 0.02, z);
      group.add(dash);
    }
  }

  // Pedestrian Crosswalks (Zebra Stripes) with Stop Bars
  const crosswalkPositions = [
    { x: -16, z: 0, rot: 0 },
    { x: 8, z: 0, rot: 0 },
    { x: -5, z: 12, rot: Math.PI / 2 },
    { x: -5, z: -12, rot: Math.PI / 2 },
    { x: -26, z: 40, rot: Math.PI / 2 },
    { x: 30, z: 6, rot: 0 },
  ];

  crosswalkPositions.forEach((cw) => {
    // Zebra stripes
    for (let stripe = -3; stripe <= 3; stripe += 0.85) {
      const stripeGeo = new THREE.PlaneGeometry(0.48, 3.2);
      stripeGeo.rotateX(-Math.PI / 2);
      const sMesh = new THREE.Mesh(stripeGeo, materials.roadMarkingWhite);
      if (cw.rot === 0) {
        sMesh.position.set(cw.x + stripe * 0.42, roadY + 0.025, cw.z);
      } else {
        sMesh.position.set(cw.x, roadY + 0.025, cw.z + stripe * 0.42);
        sMesh.rotation.y = Math.PI / 2;
      }
      group.add(sMesh);
    }

    // Stop line bar before zebra crossing
    const stopBarGeo = new THREE.PlaneGeometry(0.35, 6.5);
    stopBarGeo.rotateX(-Math.PI / 2);
    const stopBar = new THREE.Mesh(stopBarGeo, materials.roadMarkingWhite);
    if (cw.rot === 0) {
      stopBar.position.set(cw.x - 2.4, roadY + 0.025, cw.z);
    } else {
      stopBar.position.set(cw.x, roadY + 0.025, cw.z - 2.4);
      stopBar.rotation.y = Math.PI / 2;
    }
    group.add(stopBar);
  });

  // Town Center Parking Lot with marked stalls
  const parkingGeo = new THREE.PlaneGeometry(24, 15);
  parkingGeo.rotateX(-Math.PI / 2);
  const parkingMesh = new THREE.Mesh(parkingGeo, materials.asphaltMaterial);
  parkingMesh.position.set(-24, roadY + 0.01, -12);
  parkingMesh.receiveShadow = true;
  group.add(parkingMesh);

  // Concrete curb surrounding the parking lot
  const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 0.2), materials.concreteCurbs);
  curbNorth.position.set(-24, curbY, -19.5);
  group.add(curbNorth);

  const curbSouth = new THREE.Mesh(new THREE.BoxGeometry(24, 0.2, 0.2), materials.concreteCurbs);
  curbSouth.position.set(-24, curbY, -4.5);
  group.add(curbSouth);

  // Parking stall lines
  for (let stall = -10; stall <= 10; stall += 2.6) {
    const lineGeo = new THREE.PlaneGeometry(0.18, 5.4);
    lineGeo.rotateX(-Math.PI / 2);
    const line = new THREE.Mesh(lineGeo, materials.roadMarkingWhite);
    line.position.set(-24 + stall, roadY + 0.025, -12);
    group.add(line);
  }
}

/**
 * Builds the picturesque Lake District recreation promenade and arched bridge:
 */
function createLakePromenade(group: THREE.Group, materials: MaterialLibrary) {
  // 1. Wooden Marina Deck / Promenade along north lake shoreline
  const deckGeo = new THREE.BoxGeometry(34, 0.35, 4.8);
  const deckMesh = new THREE.Mesh(deckGeo, materials.modernWoodSiding);
  deckMesh.position.set(5, 0.1, -33);
  deckMesh.receiveShadow = true;
  deckMesh.castShadow = true;
  group.add(deckMesh);

  // Mooring Posts / Pilings along deck
  for (let x = -11; x <= 21; x += 3.6) {
    const postGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.2, 10);
    const post = new THREE.Mesh(postGeo, materials.doorWood);
    post.position.set(x, 0.45, -35.3);
    post.castShadow = true;
    group.add(post);

    // Cleat / Rope tie
    const cleatGeo = new THREE.BoxGeometry(0.3, 0.06, 0.08);
    const cleat = new THREE.Mesh(cleatGeo, materials.metalSteel);
    cleat.position.set(x, 0.95, -35.3);
    group.add(cleat);
  }

  // Lifebuoy Station on Promenade
  const buoyPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
  const buoyPost = new THREE.Mesh(buoyPostGeo, materials.metalSteel);
  buoyPost.position.set(-9, 0.9, -32.5);
  buoyPost.castShadow = true;
  group.add(buoyPost);

  const buoyGeo = new THREE.TorusGeometry(0.35, 0.09, 12, 24);
  const buoy = new THREE.Mesh(buoyGeo, materials.carPaintRed);
  buoy.position.set(-9, 1.4, -32.5);
  group.add(buoy);

  // 2. Arched Pedestrian Footbridge across scenic lake inlet
  const bridgeGroup = new THREE.Group();
  bridgeGroup.position.set(24, 0.2, -42);
  bridgeGroup.rotation.y = -Math.PI / 5;

  const archSpan = 14;

  const bridgeGeo = new THREE.BoxGeometry(archSpan, 0.32, 2.6);
  const bridgeMesh = new THREE.Mesh(bridgeGeo, materials.modernWoodSiding);
  bridgeMesh.position.y = 0.85;
  bridgeMesh.castShadow = true;
  bridgeMesh.receiveShadow = true;
  bridgeGroup.add(bridgeMesh);

  // Bridge Stone Abutments
  const abutGeo = new THREE.BoxGeometry(2.4, 1.4, 3.2);
  const abut1 = new THREE.Mesh(abutGeo, materials.rockStoneMaterial);
  abut1.position.set(-archSpan / 2, 0.4, 0);
  abut1.castShadow = true;
  bridgeGroup.add(abut1);

  const abut2 = new THREE.Mesh(abutGeo, materials.rockStoneMaterial);
  abut2.position.set(archSpan / 2, 0.4, 0);
  abut2.castShadow = true;
  bridgeGroup.add(abut2);

  // Bridge Handrails & Balusters
  for (const side of [-1.22, 1.22]) {
    const railGeo = new THREE.BoxGeometry(archSpan, 0.09, 0.09);
    const rail = new THREE.Mesh(railGeo, materials.metalSteel);
    rail.position.set(0, 1.7, side);
    rail.castShadow = true;
    bridgeGroup.add(rail);

    for (let rx = -5.8; rx <= 5.8; rx += 1.4) {
      const balusterGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.85, 8);
      const baluster = new THREE.Mesh(balusterGeo, materials.metalSteel);
      baluster.position.set(rx, 1.3, side);
      bridgeGroup.add(baluster);
    }
  }

  group.add(bridgeGroup);
}
