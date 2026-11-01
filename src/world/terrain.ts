import * as THREE from 'three';
import { MaterialLibrary } from './materials';

/**
 * Creates rich procedural terrain:
 * - Multi-tiered grassy plateau with natural ridges, hollows, and elevated bluffs
 * - Stratified rock cliff faces with jagged overhangs and natural erosion shelves
 * - Undercut bottom with tapered rock roots, stalactites, and floating tethered anchor stones
 * - Arched footbridges with handrails crossing gorges
 * - Multi-tier cascading waterfalls with mist pools
 * - Satellite floating isles and distant layered mountain silhouettes
 */
export function createFloatingIsland(materials: MaterialLibrary): THREE.Group {
  const islandGroup = new THREE.Group();
  islandGroup.name = 'FloatingIsland';

  const topRadius = 28;
  const segments = 64;

  // 1. Detailed Procedural Top Terrain Mesh
  const topGeo = new THREE.CylinderGeometry(topRadius, topRadius * 0.94, 3.2, segments, 16);
  const pos = topGeo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);

    if (y > 0) {
      const dist = Math.sqrt(x * x + z * z);
      const angle = Math.atan2(z, x);

      // Multi-frequency natural procedural terrain heightmap
      // 1. East Sky Temple highlands
      const eastHighlands = Math.max(0, (x - 4) / topRadius) * 4.2;
      // 2. Northwest Crystal Valley depression / canyon
      const nwValley = (x < 0 && z < 0) ? -Math.min(2.2, Math.sqrt(x * x + z * z) * 0.14) : 0;
      // 3. South Aurora knolls
      const southHills = Math.max(0, z / topRadius) * Math.sin(x * 0.3) * 1.8;
      // 4. Central plaza plateau flattening around portal (r < 7)
      const centralFlat = dist < 7 ? 0.3 : 1.0;
      // 5. Organic perlin-like multi-octave noise
      const noise1 = Math.sin(x * 0.22) * Math.cos(z * 0.22) * 1.5;
      const noise2 = Math.sin(x * 0.6 + angle * 3) * Math.cos(z * 0.6) * 0.6;
      const noise3 = Math.cos(angle * 7) * 0.3;

      // Soft edge falloff
      const edgeDrop = Math.pow(dist / topRadius, 3.5) * 2.0;

      const finalY = y + (eastHighlands + nwValley + southHills + noise1 + noise2 + noise3) * centralFlat - edgeDrop;
      pos.setY(i, finalY);

      // Slight edge perimeter radial variation
      if (dist > topRadius * 0.8) {
        const edgeNoise = (Math.sin(angle * 9) + Math.cos(angle * 13) * 0.5) * 1.4;
        pos.setX(i, x + (x / dist) * edgeNoise);
        pos.setZ(i, z + (z / dist) * edgeNoise);
      }
    }
  }
  topGeo.computeVertexNormals();

  const topMesh = new THREE.Mesh(topGeo, materials.grassMaterial);
  topMesh.position.y = 0.8;
  topMesh.receiveShadow = true;
  topMesh.castShadow = true;
  islandGroup.add(topMesh);

  // 2. Layered Cliff Strata (3 distinct stepped rock layers below the grass)
  // Layer A: Upper cliff overhangs
  const cliff1Geo = new THREE.CylinderGeometry(topRadius * 0.95, topRadius * 0.84, 5.5, segments);
  deformCliffGeometry(cliff1Geo, 1.8);
  const cliff1Mesh = new THREE.Mesh(cliff1Geo, materials.rockCliffMaterial);
  cliff1Mesh.position.y = -2.8;
  cliff1Mesh.receiveShadow = true;
  cliff1Mesh.castShadow = true;
  islandGroup.add(cliff1Mesh);

  // Layer B: Mid-cliff jagged rock shelf
  const cliff2Geo = new THREE.CylinderGeometry(topRadius * 0.85, topRadius * 0.68, 8, 48);
  deformCliffGeometry(cliff2Geo, 2.4);
  const cliff2Mesh = new THREE.Mesh(cliff2Geo, materials.rockMaterial);
  cliff2Mesh.position.y = -9.2;
  cliff2Mesh.receiveShadow = true;
  cliff2Mesh.castShadow = true;
  islandGroup.add(cliff2Mesh);

  // Layer C: Deep underside conical core tapering into stalactite roots
  const underGeo = new THREE.ConeGeometry(topRadius * 0.7, 16, 32);
  underGeo.rotateX(Math.PI);
  deformUndersideGeometry(underGeo);
  const underMesh = new THREE.Mesh(underGeo, materials.rockCliffMaterial);
  underMesh.position.y = -19;
  underMesh.receiveShadow = true;
  underMesh.castShadow = true;
  islandGroup.add(underMesh);

  // Layer D: Hanging Stalactite Clusters and Floating Anchor Stones
  const stalactiteClusters = [
    { x: 0, y: -27, z: 0, r: 2.8, h: 9 },
    { x: -8, y: -20, z: 6, r: 2.0, h: 8 },
    { x: 7, y: -21, z: -7, r: 2.2, h: 7.5 },
    { x: -6, y: -18, z: -9, r: 1.8, h: 6.5 },
    { x: 9, y: -19, z: 8, r: 2.1, h: 8 },
  ];
  stalactiteClusters.forEach((st) => {
    const sGeo = new THREE.ConeGeometry(st.r, st.h, 7);
    sGeo.rotateX(Math.PI);
    const sMesh = new THREE.Mesh(sGeo, materials.rockMaterial);
    sMesh.position.set(st.x, st.y, st.z);
    islandGroup.add(sMesh);
  });

  // Floating Anchor Stones tethered by celestial beams/energy below the island
  const tetherConfigs = [
    { pos: [0, -38, 0], scale: 1.4 },
    { pos: [-12, -32, 10], scale: 0.9 },
    { pos: [14, -34, -8], scale: 1.1 },
    { pos: [-10, -30, -14], scale: 0.8 },
  ];
  tetherConfigs.forEach((tc) => {
    const anchorGroup = createFloatingAnchorStone(materials, tc.scale);
    anchorGroup.position.set(tc.pos[0], tc.pos[1], tc.pos[2]);
    islandGroup.add(anchorGroup);
  });

  // 3. Natural Outcrop Boulders along ridge edges
  const boulderGeo = new THREE.DodecahedronGeometry(1.8, 1);
  const boulderGroup = new THREE.Group();
  for (let i = 0; i < 36; i++) {
    const angle = (i / 36) * Math.PI * 2;
    const r = topRadius * (0.8 + Math.random() * 0.16);
    const rock = new THREE.Mesh(boulderGeo, materials.rockCliffMaterial);
    const rx = Math.cos(angle) * r;
    const rz = Math.sin(angle) * r;
    const ry = (Math.random() - 0.5) * 2.2 + 1.2;
    const s = 0.9 + Math.random() * 1.8;
    rock.scale.set(s, s * (0.7 + Math.random() * 0.8), s);
    rock.position.set(rx, ry, rz);
    rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    rock.castShadow = true;
    rock.receiveShadow = true;
    boulderGroup.add(rock);
  }
  islandGroup.add(boulderGroup);

  // 4. Winding Cobbled Stone Paths with Border Stones & Lantern Posts
  const pathGroup = createDetailedPaths(materials);
  islandGroup.add(pathGroup);

  // 5. Arched Wooden / Stone Footbridge crossing south gorge
  const footbridge = createFootbridge(materials);
  footbridge.position.set(4, 2.2, 8);
  footbridge.rotation.y = 0.45;
  islandGroup.add(footbridge);

  // 6. Cascading Waterfalls (Two Scenic Locations)
  // Main Waterfall (Southern cliff gorge)
  const mainWaterfall = createCascadingWaterfall(materials, 1.4);
  mainWaterfall.position.set(-6, 1.0, 25);
  mainWaterfall.rotation.y = Math.PI * 0.65;
  islandGroup.add(mainWaterfall);

  // Secondary Waterfall (North cliff crystal stream)
  const northWaterfall = createCascadingWaterfall(materials, 0.9);
  northWaterfall.position.set(-18, 0.2, -18);
  northWaterfall.rotation.y = -Math.PI * 0.75;
  islandGroup.add(northWaterfall);

  // 7. Satellite Miniature Floating Isles (6 surrounding atolls)
  const satelliteConfigs = [
    { pos: [-38, 5, -20], scale: 0.42, rot: 0.4, type: 'crystal' },
    { pos: [40, 9, -26], scale: 0.48, rot: -0.6, type: 'shrine' },
    { pos: [36, -1, 30], scale: 0.38, rot: 1.1, type: 'tree' },
    { pos: [-34, 3, 34], scale: 0.45, rot: -1.2, type: 'crystal' },
    { pos: [0, -4, -45], scale: 0.35, rot: 0.2, type: 'ruins' },
    { pos: [22, -6, -42], scale: 0.32, rot: 0.8, type: 'shrine' },
  ];

  satelliteConfigs.forEach((cfg) => {
    const sat = createMiniSatelliteIsland(materials, cfg.scale, cfg.type);
    sat.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
    sat.rotation.y = cfg.rot;
    islandGroup.add(sat);
  });

  // 8. Distant Layered Mountains & Horizon Spires
  const horizonGroup = createLayeredHorizonMountains();
  islandGroup.add(horizonGroup);

  return islandGroup;
}

function deformCliffGeometry(geo: THREE.CylinderGeometry, magnitude: number) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const ang = Math.atan2(z, x);
    const noise = Math.sin(ang * 6 + y * 0.5) * Math.cos(ang * 11) * magnitude;
    p.setX(i, x + (x !== 0 ? (x / Math.abs(x)) : 1) * noise * 0.6);
    p.setZ(i, z + (z !== 0 ? (z / Math.abs(z)) : 1) * noise * 0.6);
  }
  geo.computeVertexNormals();
}

function deformUndersideGeometry(geo: THREE.ConeGeometry) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const noise = Math.sin(y * 0.4) * Math.cos(x * 0.3 + z * 0.3) * 2.0;
    p.setX(i, x + noise * 0.5);
    p.setZ(i, z + noise * 0.5);
  }
  geo.computeVertexNormals();
}

function createFloatingAnchorStone(materials: MaterialLibrary, scale: number): THREE.Group {
  const group = new THREE.Group();
  group.scale.setScalar(scale);

  // Inverted fractured crystal anchor rock
  const rockGeo = new THREE.OctahedronGeometry(3.5, 1);
  const rock = new THREE.Mesh(rockGeo, materials.rockCliffMaterial);
  rock.scale.set(1.2, 2.2, 1.2);
  rock.castShadow = true;
  group.add(rock);

  // Inlaid glowing crystal core
  const coreGeo = new THREE.OctahedronGeometry(1.4, 0);
  const core = new THREE.Mesh(coreGeo, materials.crystalCyan);
  group.add(core);

  // Upward energy beam connecting rock to island bottom
  const beamGeo = new THREE.CylinderGeometry(0.08, 0.08, 12, 6);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.4,
  });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.y = 7;
  group.add(beam);

  return group;
}

function createDetailedPaths(materials: MaterialLibrary): THREE.Group {
  const pathGroup = new THREE.Group();
  const paverGeo = new THREE.BoxGeometry(1.6, 0.22, 1.3);
  const borderStoneGeo = new THREE.DodecahedronGeometry(0.35, 0);

  // Helper to lay a path sequence with border stones
  function buildPathSegment(startX: number, startZ: number, endX: number, endZ: number, startY: number, endY: number, count: number) {
    for (let i = 0; i <= count; i++) {
      const t = i / count;
      const x = THREE.MathUtils.lerp(startX, endX, t) + Math.sin(t * Math.PI) * 1.5;
      const z = THREE.MathUtils.lerp(startZ, endZ, t);
      const y = THREE.MathUtils.lerp(startY, endY, t);

      const paver = new THREE.Mesh(paverGeo, materials.pathStoneMaterial);
      paver.position.set(x, y + 0.1, z);
      paver.rotation.y = Math.atan2(endZ - startZ, endX - startX) + (Math.random() - 0.5) * 0.15;
      paver.scale.set(0.9 + Math.random() * 0.3, 1, 0.9 + Math.random() * 0.3);
      paver.receiveShadow = true;
      pathGroup.add(paver);

      // Border rock pebbles
      if (i % 2 === 0) {
        const perpX = -Math.sin(paver.rotation.y);
        const perpZ = Math.cos(paver.rotation.y);
        const bL = new THREE.Mesh(borderStoneGeo, materials.rockMaterial);
        bL.position.set(x + perpX * 1.1, y + 0.15, z + perpZ * 1.1);
        pathGroup.add(bL);

        const bR = new THREE.Mesh(borderStoneGeo, materials.rockMaterial);
        bR.position.set(x - perpX * 1.1, y + 0.15, z - perpZ * 1.1);
        pathGroup.add(bR);
      }
    }
  }

  // Paths radiating from Central Portal (0, 0)
  buildPathSegment(0, 0, -14, -10, 2.0, 1.4, 14); // to Crystal Valley
  buildPathSegment(0, 0, 14, -8, 2.0, 4.2, 16);   // to Sky Temple
  buildPathSegment(0, 0, 10, 13, 2.0, 2.2, 14);   // to Aurora Forest
  buildPathSegment(0, 0, -12, 11, 2.0, 2.8, 14);  // to Cloud City

  return pathGroup;
}

function createFootbridge(materials: MaterialLibrary): THREE.Group {
  const bridge = new THREE.Group();

  // Arched wooden/stone deck
  const deckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.2, 0, 0),
    new THREE.Vector3(0, 0.6, 0),
    new THREE.Vector3(3.2, 0, 0),
  ]);
  const deckGeo = new THREE.TubeGeometry(deckCurve, 16, 0.65, 6, false);
  const deckMesh = new THREE.Mesh(deckGeo, materials.woodMaterial);
  deckMesh.scale.set(1, 0.35, 2.2);
  deckMesh.castShadow = true;
  bridge.add(deckMesh);

  // Bridge Stone Piers / Abutments
  const pierGeo = new THREE.BoxGeometry(0.8, 2.2, 1.8);
  const pierL = new THREE.Mesh(pierGeo, materials.rockMaterial);
  pierL.position.set(-3.2, -0.6, 0);
  bridge.add(pierL);

  const pierR = new THREE.Mesh(pierGeo, materials.rockMaterial);
  pierR.position.set(3.2, -0.6, 0);
  bridge.add(pierR);

  // Railing Posts & Top Rail
  const postGeo = new THREE.CylinderGeometry(0.06, 0.08, 1.0, 6);
  const postOffsets = [-2.8, -1.4, 0, 1.4, 2.8];
  postOffsets.forEach((px) => {
    const py = 0.5 + Math.cos(px * 0.45) * 0.3;
    const postFront = new THREE.Mesh(postGeo, materials.templeGold);
    postFront.position.set(px, py, 0.9);
    bridge.add(postFront);

    const postBack = new THREE.Mesh(postGeo, materials.templeGold);
    postBack.position.set(px, py, -0.9);
    bridge.add(postBack);
  });

  return bridge;
}

function createCascadingWaterfall(materials: MaterialLibrary, widthScale: number): THREE.Group {
  const waterfall = new THREE.Group();

  // Multi-tier tiered waterfall stream
  const mainCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.2, 0),
    new THREE.Vector3(0.3, -0.2, 1.2),
    new THREE.Vector3(0.5, -2.5, 2.0),
    new THREE.Vector3(0.7, -6.5, 2.8),
    new THREE.Vector3(0.9, -14.0, 3.6),
    new THREE.Vector3(1.1, -24.0, 4.4),
  ]);

  const tubeGeo = new THREE.TubeGeometry(mainCurve, 36, 1.1 * widthScale, 10, false);
  const waterMesh = new THREE.Mesh(tubeGeo, materials.waterfallMat);
  waterfall.add(waterMesh);

  // Secondary foaming stream
  const sideCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-1.0, 0.1, 0.3),
    new THREE.Vector3(-0.7, -2.8, 1.6),
    new THREE.Vector3(-0.5, -8.0, 2.4),
    new THREE.Vector3(-0.3, -18.0, 3.2),
  ]);
  const tube2Geo = new THREE.TubeGeometry(sideCurve, 24, 0.6 * widthScale, 8, false);
  const waterMesh2 = new THREE.Mesh(tube2Geo, materials.waterfallMat);
  waterfall.add(waterMesh2);

  // Splash Mist Pool at bottom
  const mistPoolGeo = new THREE.CylinderGeometry(3.5 * widthScale, 4.8 * widthScale, 0.8, 16);
  const mistPoolMat = new THREE.MeshStandardMaterial({
    color: 0xbae6fd,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.5,
  });
  const mistPool = new THREE.Mesh(mistPoolGeo, mistPoolMat);
  mistPool.position.set(1.1, -24.5, 4.4);
  waterfall.add(mistPool);

  return waterfall;
}

function createMiniSatelliteIsland(materials: MaterialLibrary, scale: number, type: string): THREE.Group {
  const sat = new THREE.Group();
  sat.scale.setScalar(scale);

  // Layered top grass
  const topGeo = new THREE.CylinderGeometry(11, 9.5, 2.2, 20);
  const topMesh = new THREE.Mesh(topGeo, materials.grassMaterial);
  topMesh.castShadow = true;
  sat.add(topMesh);

  // Rocky inverted cone
  const underGeo = new THREE.ConeGeometry(9.5, 16, 18);
  underGeo.rotateX(Math.PI);
  const underMesh = new THREE.Mesh(underGeo, materials.rockCliffMaterial);
  underMesh.position.y = -8.5;
  underMesh.castShadow = true;
  sat.add(underMesh);

  // Feature based on island type
  if (type === 'crystal') {
    const spireGeo = new THREE.CylinderGeometry(0.1, 1.4, 7, 6);
    const spire = new THREE.Mesh(spireGeo, materials.crystalCyan);
    spire.position.y = 4.2;
    sat.add(spire);

    const spire2 = new THREE.Mesh(spireGeo, materials.crystalViolet);
    spire2.position.set(2, 3.2, 1);
    spire2.scale.set(0.7, 0.7, 0.7);
    sat.add(spire2);
  } else if (type === 'shrine') {
    const archGeo = new THREE.TorusGeometry(2.4, 0.28, 8, 16, Math.PI);
    const arch = new THREE.Mesh(archGeo, materials.templeGold);
    arch.position.y = 1.2;
    sat.add(arch);

    const orbGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const orb = new THREE.Mesh(orbGeo, materials.portalCore);
    orb.position.y = 3.6;
    sat.add(orb);
  } else if (type === 'tree') {
    const trunkGeo = new THREE.CylinderGeometry(0.3, 0.5, 4, 8);
    const trunk = new THREE.Mesh(trunkGeo, materials.treeBark);
    trunk.position.y = 2.0;
    sat.add(trunk);

    const canopyGeo = new THREE.IcosahedronGeometry(2.2, 2);
    const canopy = new THREE.Mesh(canopyGeo, materials.treeFoliageTeal);
    canopy.position.y = 4.8;
    sat.add(canopy);
  } else {
    // Ancient ruins
    const pillarGeo = new THREE.BoxGeometry(0.8, 4.5, 0.8);
    const p1 = new THREE.Mesh(pillarGeo, materials.templeWhite);
    p1.position.set(-2, 2.2, -1);
    sat.add(p1);

    const p2 = new THREE.Mesh(pillarGeo, materials.templeWhite);
    p2.position.set(2, 2.2, 1);
    sat.add(p2);

    const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.6, 1.2), materials.templeWhite);
    lintel.position.set(0, 4.6, 0);
    sat.add(lintel);
  }

  return sat;
}

function createLayeredHorizonMountains(): THREE.Group {
  const group = new THREE.Group();

  // Multi-tier layered mountain silhouettes for atmospheric depth
  // Tier 1: Mid-distance craggy peaks (R = 140)
  const midGeo = new THREE.ConeGeometry(16, 50, 7);
  const midMat = new THREE.MeshStandardMaterial({
    color: 0x1a2639,
    roughness: 0.9,
    metalness: 0.1,
  });

  const angles1 = [0.4, 1.2, 2.2, 3.4, 4.5, 5.6];
  angles1.forEach((ang) => {
    const r = 135 + Math.random() * 25;
    const mesh = new THREE.Mesh(midGeo, midMat);
    mesh.position.set(Math.cos(ang) * r, -18 + Math.random() * 12, Math.sin(ang) * r);
    const s = 1.2 + Math.random() * 1.4;
    mesh.scale.set(s, s * (1.1 + Math.random() * 0.4), s);
    group.add(mesh);
  });

  // Tier 2: Deep background giant mountain spires (R = 220)
  const deepGeo = new THREE.ConeGeometry(28, 85, 6);
  const deepMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.95,
    metalness: 0.05,
  });

  const angles2 = [0.1, 0.8, 1.8, 2.9, 3.9, 5.0];
  angles2.forEach((ang) => {
    const r = 210 + Math.random() * 35;
    const mesh = new THREE.Mesh(deepGeo, deepMat);
    mesh.position.set(Math.cos(ang) * r, -26 + Math.random() * 15, Math.sin(ang) * r);
    const s = 1.4 + Math.random() * 1.6;
    mesh.scale.set(s, s * (1.2 + Math.random() * 0.5), s);
    group.add(mesh);
  });

  return group;
}
