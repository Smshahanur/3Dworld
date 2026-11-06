import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { ROAD_SEGMENTS, ROUNDABOUT_NODES, BRIDGES } from './roadNetwork';
import { isPointInDriveableArea } from './collisionSystem';

/**
 * Creates the expanded continuous 3-district landscape:
 * - District 1: Rural Village & Farmlands (West)
 * - District 2: Modern Village & Lake District (Center)
 * - District 3: Capital Town & Central Business District (East)
 * - Continuous North-South River System & West River Creek
 * - Elevated Bridges connecting the districts
 * - Systematic road meshes, curbs, markings, sidewalks, and crosswalks
 */
export function createModernVillageLandscape(materials: MaterialLibrary): THREE.Group {
  const landscapeGroup = new THREE.Group();
  landscapeGroup.name = 'ThreeDistrictsLandscape';

  // 1. Continuous Main Ground Terrain (380x380 units, 120x120 segments)
  const terrainSize = 380;
  const terrainSegments = 120;
  const terrainGeo = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
  terrainGeo.rotateX(-Math.PI / 2);

  const pos = terrainGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    let height = 0;

    // 1. Modern Village Lake Depression centered at (5, -45)
    const distToLake = Math.hypot((x - 5) / 1.5, z - -45);
    // 2. Rural Village Pond Depression centered at (-95, -35)
    const distToRuralPond = Math.hypot((x - -95) / 1.3, z - -35);

    // 3. Main River Depression (running North-South along X: [44, 56])
    const distToMainRiver = Math.abs(x - 50.0);
    // 4. West River Creek Depression (running North-South along X: [-58, -48])
    const distToWestCreek = Math.abs(x - -53.0);

    if (distToLake < 24) {
      // Smooth bowl for lake
      height = -Math.cos((distToLake / 24) * Math.PI * 0.5) * 2.2;
    } else if (distToRuralPond < 16) {
      // Rural village pond depression
      height = -Math.cos((distToRuralPond / 16) * Math.PI * 0.5) * 1.8;
    } else if (distToMainRiver < 8.5) {
      // Main Riverbed (smooth channel depression)
      height = -Math.cos((distToMainRiver / 8.5) * Math.PI * 0.5) * 1.85;
    } else if (distToWestCreek < 7.0) {
      // West Creek riverbed
      height = -Math.cos((distToWestCreek / 7.0) * Math.PI * 0.5) * 1.6;
    } else {
      // Park interior berms in Modern Village Central Park
      const distToPark = Math.hypot(x - 22, z - -6);
      if (distToPark < 14 && Math.abs(z) > 4 && Math.abs(x - 22) > 3) {
        height = Math.sin((distToPark / 14) * Math.PI) * 0.22;
      } else {
        // Farmland subtle gentle furrows in Rural Village
        if (x >= -155 && x <= -75 && z >= 10 && z <= 60 && Math.abs(x - -110) > 4) {
          height = Math.sin(z * 0.8) * 0.08;
        } else {
          // Distant rolling hills beyond the active 3 districts (> 155m radius)
          const distFromCenter = Math.hypot(x, z);
          if (distFromCenter > 145) {
            const hillNoise = Math.sin(x * 0.035) * Math.cos(z * 0.035) * 4.5;
            const outerRise = Math.pow((distFromCenter - 145) / 45, 1.8) * 9.0;
            height = Math.max(0, hillNoise + outerRise);
          } else {
            // All district road, building, and pedestrian zones: strictly flat at 0.0
            height = 0;
          }
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

  // 2. Shoreline Sand & Gravel Rings
  // Lake Beach Collar
  const beachRingGeo = new THREE.RingGeometry(21, 26, 36);
  beachRingGeo.rotateX(-Math.PI / 2);
  const beachMesh = new THREE.Mesh(beachRingGeo, materials.riverBankMaterial);
  beachMesh.position.set(5, -0.25, -45);
  beachMesh.scale.set(1.4, 1.0, 1.0);
  beachMesh.receiveShadow = true;
  landscapeGroup.add(beachMesh);

  // Rural Pond Sand & Pebble Rim
  const pondRingGeo = new THREE.RingGeometry(11, 14, 28);
  pondRingGeo.rotateX(-Math.PI / 2);
  const pondRing = new THREE.Mesh(pondRingGeo, materials.riverBankMaterial);
  pondRing.position.set(-92, -0.22, -34);
  pondRing.scale.set(1.2, 1.0, 1.0);
  pondRing.receiveShadow = true;
  landscapeGroup.add(pondRing);

  // 3. Water Surfaces
  // 3a. Modern Village Lake Water Surface (South of Lake Scenic Road)
  const lakeWaterGeo = new THREE.PlaneGeometry(58, 32, 24, 24);
  lakeWaterGeo.rotateX(-Math.PI / 2);
  const lakeMesh = new THREE.Mesh(lakeWaterGeo, materials.lakeWaterMaterial);
  lakeMesh.position.set(5, -0.18, -52);
  lakeMesh.receiveShadow = true;
  landscapeGroup.add(lakeMesh);

  // 3b. Rural Village Pond Water Surface (East of South Pond Byway)
  const pondWaterGeo = new THREE.PlaneGeometry(22, 14, 16, 16);
  pondWaterGeo.rotateX(-Math.PI / 2);
  const pondMesh = new THREE.Mesh(pondWaterGeo, materials.lakeWaterMaterial);
  pondMesh.position.set(-92, -0.18, -34);
  pondMesh.receiveShadow = true;
  landscapeGroup.add(pondMesh);

  // 3c. Main River Water Surface (North-South continuous water ribbon)
  const mainRiverWaterGeo = new THREE.PlaneGeometry(13.0, 340.0, 12, 64);
  mainRiverWaterGeo.rotateX(-Math.PI / 2);
  const mainRiverMesh = new THREE.Mesh(mainRiverWaterGeo, materials.riverWaterMaterial);
  mainRiverMesh.position.set(50.0, -0.18, 0.0);
  mainRiverMesh.receiveShadow = true;
  landscapeGroup.add(mainRiverMesh);

  // 3d. West River Creek Water Surface (connecting between Rural and Modern Village)
  const westRiverWaterGeo = new THREE.PlaneGeometry(11.0, 340.0, 10, 64);
  westRiverWaterGeo.rotateX(-Math.PI / 2);
  const westRiverMesh = new THREE.Mesh(westRiverWaterGeo, materials.riverWaterMaterial);
  westRiverMesh.position.set(-53.0, -0.18, 0.0);
  westRiverMesh.receiveShadow = true;
  landscapeGroup.add(westRiverMesh);

  // Shoreline Rock Boulders along Lake & Riverbanks
  const rockLocations = [
    { x: -16, z: -35, s: 1.4 },
    { x: -19, z: -48, s: 1.8 },
    { x: -8, z: -58, s: 1.5 },
    { x: 18, z: -57, s: 2.0 },
    { x: 26, z: -46, s: 1.6 },
    { x: 22, z: -37, s: 1.3 },
    { x: -2, z: -30, s: 1.1 },
    { x: 12, z: -31, s: 1.2 },
    // Main River rocks
    { x: 43, z: 25, s: 1.6 },
    { x: 57, z: 45, s: 1.9 },
    { x: 44, z: -35, s: 1.5 },
    { x: 56, z: -55, s: 1.8 },
    // West River Creek rocks
    { x: -60, z: 20, s: 1.5 },
    { x: -47, z: 40, s: 1.7 },
    { x: -59, z: -25, s: 1.4 },
    // Rural Pond rocks
    { x: -108, z: -30, s: 1.4 },
    { x: -82, z: -38, s: 1.6 },
  ];
  rockLocations.forEach((rock) => {
    if (isPointInDriveableArea(rock.x, rock.z, 0.9)) return;
    const geo = new THREE.DodecahedronGeometry(rock.s, 1);
    const m = new THREE.Mesh(geo, materials.rockStoneMaterial);
    m.position.set(rock.x, -0.35, rock.z);
    m.scale.set(1.2, 0.7, 1.1);
    m.rotation.set(Math.random(), Math.random(), Math.random());
    m.castShadow = true;
    m.receiveShadow = true;
    landscapeGroup.add(m);
  });

  // 4. Distant Horizon Mountain Silhouettes (28 peaks around perimeter)
  const mountainRings = 28;
  for (let i = 0; i < mountainRings; i++) {
    const ang = (i / mountainRings) * Math.PI * 2;
    const rad = 175 + Math.sin(i * 3) * 16;
    const mx = Math.cos(ang) * rad;
    const mz = Math.sin(ang) * rad;
    const mHeight = 22 + (i % 4) * 8 + Math.random() * 8;
    const mBase = 35 + Math.random() * 15;

    const mGeo = new THREE.ConeGeometry(mBase, mHeight, 6);
    const mMesh = new THREE.Mesh(mGeo, materials.rockStoneMaterial);
    mMesh.name = 'distant-mountain-perimeter';
    mMesh.userData = { isScenery: true };
    mMesh.position.set(mx, mHeight * 0.45, mz);
    mMesh.rotation.y = ang + Math.random() * 0.5;
    landscapeGroup.add(mMesh);
  }

  // 5. Build Road Network, Curbs, Markings, Roundabouts, and Sidewalks across all 3 districts
  createAllRoadNetworks(landscapeGroup, materials);

  // 6. Build Trans-District Bridges over River System
  createRiverBridges(landscapeGroup, materials);

  // 7. Lake Promenade & Arched Pedestrian Footbridge
  createLakePromenade(landscapeGroup, materials);

  return landscapeGroup;
}

/**
 * Builds the comprehensive road network across all three districts.
 */
function createAllRoadNetworks(group: THREE.Group, materials: MaterialLibrary) {
  const roadY = 0.08;
  const curbY = 0.16;
  const walkY = 0.18;

  // 1. Generate Rectangular Road Segments from Authoritative Road Data
  for (let s = 0; s < ROAD_SEGMENTS.length; s++) {
    const seg = ROAD_SEGMENTS[s];
    const w = seg.maxX - seg.minX;
    const d = seg.maxZ - seg.minZ;
    const cx = (seg.minX + seg.maxX) * 0.5;
    const cz = (seg.minZ + seg.maxZ) * 0.5;

    const mat = seg.surface === 'dirt' ? materials.dirtRoadMaterial : materials.asphaltMaterial;

    const planeGeo = new THREE.PlaneGeometry(w, d);
    planeGeo.rotateX(-Math.PI / 2);
    const roadMesh = new THREE.Mesh(planeGeo, mat);
    roadMesh.position.set(cx, roadY, cz);
    roadMesh.receiveShadow = true;
    group.add(roadMesh);

    // Helper: Carves out intersecting cross-streets and roundabouts from curb lines
    function buildCurbIntervals(
      start: number,
      end: number,
      cuts: [number, number][]
    ): [number, number][] {
      let intervals: [number, number][] = [[start, end]];
      cuts.forEach(([cMin, cMax]) => {
        const next: [number, number][] = [];
        intervals.forEach(([iStart, iEnd]) => {
          if (cMax <= iStart || cMin >= iEnd) {
            next.push([iStart, iEnd]);
          } else {
            if (iStart < cMin - 0.15) {
              next.push([iStart, cMin - 0.15]);
            }
            if (cMax + 0.15 < iEnd) {
              next.push([cMax + 0.15, iEnd]);
            }
          }
        });
        intervals = next;
      });
      return intervals.filter(([a, b]) => b - a >= 0.5);
    }

    // Concrete Curbs & Fog Lines for paved roads (Carved at all intersections & roundabouts)
    if (seg.hasCurbs) {
      const isEastWest = w >= d;
      const curbWidth = 0.18;
      const curbHeight = 0.22;

      if (isEastWest) {
        // Continuous White Fog Lines on shoulders
        const edgeLineWidth = 0.16;
        for (const offset of [-d * 0.5 + 0.2, d * 0.5 - 0.2]) {
          const edgeGeo = new THREE.PlaneGeometry(w, edgeLineWidth);
          edgeGeo.rotateX(-Math.PI / 2);
          const edgeLine = new THREE.Mesh(edgeGeo, materials.roadMarkingWhite);
          edgeLine.position.set(cx, roadY + 0.015, cz + offset);
          group.add(edgeLine);
        }

        // Calculate cuts along X axis for North curb and South curb
        const findCuts = (curbZ: number): [number, number][] => {
          const cuts: [number, number][] = [];
          // 1. Roundabout cuts
          if (Math.abs(curbZ) <= 9.2) {
            // Modern Roundabout at (-5, 0), outer radius 8.8
            cuts.push([-14.2, 4.2]);
          }
          if (Math.abs(curbZ) <= 12.0) {
            // Capital Roundabout at (105, 0), outer radius 11.5
            cuts.push([93.2, 116.8]);
          }
          // 2. Intersecting cross-streets (North-South roads)
          ROAD_SEGMENTS.forEach((other) => {
            if (other.id === seg.id) return;
            const otherIsNS = (other.maxZ - other.minZ) > (other.maxX - other.minX);
            if (otherIsNS) {
              if (curbZ >= other.minZ - 0.3 && curbZ <= other.maxZ + 0.3) {
                cuts.push([other.minX - 0.2, other.maxX + 0.2]);
              }
            }
          });
          return cuts;
        };

        const northCurbZ = cz + (d * 0.5 - curbWidth * 0.5);
        const southCurbZ = cz - (d * 0.5 - curbWidth * 0.5);

        const northIntervals = buildCurbIntervals(seg.minX, seg.maxX, findCuts(northCurbZ));
        northIntervals.forEach(([kStart, kEnd]) => {
          const kw = kEnd - kStart;
          const kcx = (kStart + kEnd) * 0.5;
          const curbNorth = new THREE.Mesh(new THREE.BoxGeometry(kw, curbHeight, curbWidth), materials.concreteCurbs);
          curbNorth.position.set(kcx, curbY, northCurbZ);
          curbNorth.receiveShadow = true;
          group.add(curbNorth);
        });

        const southIntervals = buildCurbIntervals(seg.minX, seg.maxX, findCuts(southCurbZ));
        southIntervals.forEach(([kStart, kEnd]) => {
          const kw = kEnd - kStart;
          const kcx = (kStart + kEnd) * 0.5;
          const curbSouth = new THREE.Mesh(new THREE.BoxGeometry(kw, curbHeight, curbWidth), materials.concreteCurbs);
          curbSouth.position.set(kcx, curbY, southCurbZ);
          curbSouth.receiveShadow = true;
          group.add(curbSouth);
        });
      } else {
        // North-South Road
        const edgeLineWidth = 0.16;
        for (const offset of [-w * 0.5 + 0.2, w * 0.5 - 0.2]) {
          const edgeGeo = new THREE.PlaneGeometry(edgeLineWidth, d);
          edgeGeo.rotateX(-Math.PI / 2);
          const edgeLine = new THREE.Mesh(edgeGeo, materials.roadMarkingWhite);
          edgeLine.position.set(cx + offset, roadY + 0.015, cz);
          group.add(edgeLine);
        }

        const findCutsNS = (curbX: number): [number, number][] => {
          const cuts: [number, number][] = [];
          // 1. Roundabouts
          if (Math.abs(curbX - -5) <= 9.2) {
            cuts.push([-9.2, 9.2]);
          }
          if (Math.abs(curbX - 105) <= 12.0) {
            cuts.push([-12.0, 12.0]);
          }
          // 2. Intersecting cross-streets (East-West roads)
          ROAD_SEGMENTS.forEach((other) => {
            if (other.id === seg.id) return;
            const otherIsEW = (other.maxX - other.minX) >= (other.maxZ - other.minZ);
            if (otherIsEW) {
              if (curbX >= other.minX - 0.3 && curbX <= other.maxX + 0.3) {
                cuts.push([other.minZ - 0.2, other.maxZ + 0.2]);
              }
            }
          });
          return cuts;
        };

        const westCurbX = cx - (w * 0.5 - curbWidth * 0.5);
        const eastCurbX = cx + (w * 0.5 - curbWidth * 0.5);

        const westIntervals = buildCurbIntervals(seg.minZ, seg.maxZ, findCutsNS(westCurbX));
        westIntervals.forEach(([kStart, kEnd]) => {
          const kd = kEnd - kStart;
          const kcz = (kStart + kEnd) * 0.5;
          const curbWest = new THREE.Mesh(new THREE.BoxGeometry(curbWidth, curbHeight, kd), materials.concreteCurbs);
          curbWest.position.set(westCurbX, curbY, kcz);
          curbWest.receiveShadow = true;
          group.add(curbWest);
        });

        const eastIntervals = buildCurbIntervals(seg.minZ, seg.maxZ, findCutsNS(eastCurbX));
        eastIntervals.forEach(([kStart, kEnd]) => {
          const kd = kEnd - kStart;
          const kcz = (kStart + kEnd) * 0.5;
          const curbEast = new THREE.Mesh(new THREE.BoxGeometry(curbWidth, curbHeight, kd), materials.concreteCurbs);
          curbEast.position.set(eastCurbX, curbY, kcz);
          curbEast.receiveShadow = true;
          group.add(curbEast);
        });
      }
    }

    // Yellow Dashed Centerlines
    if (seg.hasCenterlines) {
      const isEastWest = w >= d;
      if (isEastWest) {
        for (let xPos = seg.minX + 3.0; xPos <= seg.maxX - 3.0; xPos += 4.5) {
          // Skip drawing across roundabouts
          if (Math.abs(xPos - -5) > 9.5 && Math.abs(xPos - 105) > 12.0) {
            const dashGeo = new THREE.PlaneGeometry(2.4, 0.22);
            dashGeo.rotateX(-Math.PI / 2);
            const dash = new THREE.Mesh(dashGeo, materials.roadMarkingYellow);
            dash.position.set(xPos, roadY + 0.02, cz);
            group.add(dash);
          }
        }
      } else {
        for (let zPos = seg.minZ + 3.0; zPos <= seg.maxZ - 3.0; zPos += 4.5) {
          if (Math.abs(zPos) > 9.5) {
            const dashGeo = new THREE.PlaneGeometry(0.22, 2.4);
            dashGeo.rotateX(-Math.PI / 2);
            const dash = new THREE.Mesh(dashGeo, materials.roadMarkingYellow);
            dash.position.set(cx, roadY + 0.02, zPos);
            group.add(dash);
          }
        }
      }
    }
  }

  // 2. Sidewalks along Primary Corridors (Segmented Lot-Fronts - Strictly NO Road Overlap)
  function addSidewalk(x: number, z: number, w: number, d: number) {
    const walkGeo = new THREE.BoxGeometry(w, 0.16, d);
    const walkMesh = new THREE.Mesh(walkGeo, materials.sidewalkMaterial);
    walkMesh.position.set(x, walkY, z);
    walkMesh.receiveShadow = true;
    group.add(walkMesh);
  }

  // Modern Village Main West Boulevard Sidewalks (Clear of commercial lane, clinic bay & roundabout)
  addSidewalk(-36.5, 5.3, 11.0, 1.6); // North west lot [-42, -31]
  addSidewalk(-21.5, 5.3, 7.0, 1.6);  // North east lot [-25, -18]
  addSidewalk(-32.0, -5.3, 20.0, 1.6); // South: Elementary School & Clinic frontage [-42, -22]
  addSidewalk(-17.0, -5.3, 6.0, 1.6); // South: Arcade frontage [-20, -14]

  // Modern Village Main East Boulevard Sidewalks (Clear of Roundabout, botanical drive & approach)
  addSidewalk(7.8, 5.3, 5.6, 1.6);   // North: West of botanical drive [5, 10.6]
  addSidewalk(26.8, 5.3, 18.4, 1.6); // North: Central Park South Promenade [17.6, 36]
  addSidewalk(7.5, -5.3, 5.0, 1.6); // South: Village Cafe frontage [5, 10]
  addSidewalk(27.0, -5.3, 18.0, 1.6); // South: East approach to Bridge 2 [18, 36]

  // Modern Village North-South Boulevard Sidewalks (Clear of East-West Boulevard & Res Lanes)
  addSidewalk(-10.4, -16.5, 1.6, 14.0); // West: South approach [-23.5, -9.5]
  addSidewalk(-10.4, 18.5, 1.6, 18.0); // West: Mid block [9.5, 27.5]
  addSidewalk(-10.4, 47.0, 1.6, 21.0); // West: Upper block [36.5, 57.5]
  addSidewalk(0.4, -16.5, 1.6, 14.0); // East: South approach [-23.5, -9.5]
  addSidewalk(0.4, 35.75, 1.6, 52.5); // East: North side [9.5, 62.0]

  // Capital Town Gateway Highway Sidewalks (Clear of Bridge 2, Transit Loop & Roundabout)
  addSidewalk(78.5, 5.8, 29.0, 1.8); // North frontage [64, 93]
  addSidewalk(68.0, -5.8, 8.0, 1.8); // South west [64, 72]
  addSidewalk(95.5, -5.8, 5.0, 1.8); // South east clear of transit loop [93, 98]

  // Capital Town Grand Boulevard Sidewalks (East of Roundabout to East Connector)
  addSidewalk(135.0, 5.8, 36.0, 1.8); // North [117, 153]
  addSidewalk(135.0, -5.8, 36.0, 1.8); // South [117, 153]

  // Capital Town Civic North/South Connectors (Clear of Roundabout, Campus Pkwy, Res Blvd, Financial Ave & Riverside Drive)
  addSidewalk(99.8, 21.5, 1.8, 19.0); // North West lower [12, 31]
  addSidewalk(99.8, 48.0, 1.8, 14.0); // North West upper [41, 55] (stops before Res Blvd Z: 56)
  addSidewalk(110.2, 21.5, 1.8, 19.0); // North East lower [12, 31]
  addSidewalk(110.2, 48.0, 1.8, 14.0); // North East upper [41, 55] (stops before Res Blvd Z: 56)
  addSidewalk(99.8, -17.5, 1.8, 11.0); // South West upper [-23, -12]
  addSidewalk(99.8, -43.0, 1.8, 20.0); // South West lower [-53, -33] (stops before Riverside Drive Z: -54)
  addSidewalk(110.2, -17.5, 1.8, 11.0); // South East upper [-23, -12]
  addSidewalk(110.2, -43.0, 1.8, 20.0); // South East lower [-53, -33] (stops before Riverside Drive Z: -54)

  // 3. Central Roundabout in Modern Village ([-5, 0])
  const roundOuterGeo = new THREE.RingGeometry(4.2, 8.8, 40);
  roundOuterGeo.rotateX(-Math.PI / 2);
  const roundMesh = new THREE.Mesh(roundOuterGeo, materials.asphaltMaterial);
  roundMesh.position.set(-5, roadY + 0.01, 0);
  roundMesh.receiveShadow = true;
  group.add(roundMesh);

  const roundCurbGeo = new THREE.RingGeometry(3.9, 4.3, 40);
  roundCurbGeo.rotateX(-Math.PI / 2);
  const roundCurb = new THREE.Mesh(roundCurbGeo, materials.concreteCurbs);
  roundCurb.position.set(-5, roadY + 0.02, 0);
  group.add(roundCurb);

  const roundIslandGeo = new THREE.CylinderGeometry(3.9, 4.1, 0.45, 36);
  const roundIsland = new THREE.Mesh(roundIslandGeo, materials.parkLawnMaterial);
  roundIsland.position.set(-5, 0.22, 0);
  roundIsland.receiveShadow = true;
  group.add(roundIsland);

  // Modern abstract sculpture in Modern roundabout
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

  // 4. Civic Roundabout in Capital Town ([105, 0])
  const capRoundOuterGeo = new THREE.RingGeometry(5.5, 11.5, 48);
  capRoundOuterGeo.rotateX(-Math.PI / 2);
  const capRoundMesh = new THREE.Mesh(capRoundOuterGeo, materials.asphaltMaterial);
  capRoundMesh.position.set(105, roadY + 0.01, 0);
  capRoundMesh.receiveShadow = true;
  group.add(capRoundMesh);

  const capRoundCurbGeo = new THREE.RingGeometry(5.2, 5.6, 48);
  capRoundCurbGeo.rotateX(-Math.PI / 2);
  const capRoundCurb = new THREE.Mesh(capRoundCurbGeo, materials.capitalGranite);
  capRoundCurb.position.set(105, roadY + 0.02, 0);
  group.add(capRoundCurb);

  const capIslandGeo = new THREE.CylinderGeometry(5.2, 5.4, 0.5, 40);
  const capIsland = new THREE.Mesh(capIslandGeo, materials.parkLawnMaterial);
  capIsland.position.set(105, 0.25, 0);
  capIsland.receiveShadow = true;
  group.add(capIsland);

  // Capital Grand Civic Obelisk in Capital Roundabout Center
  const obeliskBaseGeo = new THREE.BoxGeometry(2.4, 1.2, 2.4);
  const obeliskBase = new THREE.Mesh(obeliskBaseGeo, materials.capitalGranite);
  obeliskBase.position.set(105, 0.95, 0);
  obeliskBase.castShadow = true;
  group.add(obeliskBase);

  const obeliskGeo = new THREE.CylinderGeometry(0.35, 0.85, 8.5, 4);
  obeliskGeo.rotateY(Math.PI / 4);
  const obelisk = new THREE.Mesh(obeliskGeo, materials.capitalGranite);
  obelisk.position.set(105, 5.6, 0);
  obelisk.castShadow = true;
  group.add(obelisk);

  const obeliskGoldTip = new THREE.ConeGeometry(0.38, 0.8, 4);
  obeliskGoldTip.rotateY(Math.PI / 4);
  const goldTip = new THREE.Mesh(obeliskGoldTip, materials.capitalGoldTrim);
  goldTip.position.set(105, 10.2, 0);
  goldTip.castShadow = true;
  group.add(goldTip);

  // 5. Town Center Ground-Level Parking Plaza (Modern Village)
  // Positioned north of Civic Library along Lake Scenic Road with zero building overlap
  const parkingGeo = new THREE.PlaneGeometry(14.0, 8.0);
  parkingGeo.rotateX(-Math.PI / 2);
  const parkingMesh = new THREE.Mesh(parkingGeo, materials.asphaltMaterial);
  parkingMesh.position.set(-22.0, roadY + 0.01, -20.5);
  parkingMesh.receiveShadow = true;
  group.add(parkingMesh);

  // Parking stall divider stripes (4 dedicated perpendicular stalls)
  for (const lineX of [-27.25, -24.25, -21.25, -18.25, -15.25]) {
    const lineGeo = new THREE.PlaneGeometry(0.16, 4.8);
    lineGeo.rotateX(-Math.PI / 2);
    const line = new THREE.Mesh(lineGeo, materials.roadMarkingWhite);
    line.position.set(lineX, roadY + 0.025, -20.5);
    group.add(line);
  }

  // 6. Capital Transit Bus Terminal Interchange Bays (Capital Town)
  // Dedicated transit bay apron clear of all commercial tower footprints
  const transitPlazaGeo = new THREE.PlaneGeometry(22.0, 9.0);
  transitPlazaGeo.rotateX(-Math.PI / 2);
  const transitPlaza = new THREE.Mesh(transitPlazaGeo, materials.asphaltMaterial);
  transitPlaza.position.set(75.0, roadY + 0.01, -16.0);
  transitPlaza.receiveShadow = true;
  group.add(transitPlaza);

  for (let bay = -8.0; bay <= 8.0; bay += 4.0) {
    const bayStripeGeo = new THREE.PlaneGeometry(0.25, 7.0);
    bayStripeGeo.rotateX(-Math.PI / 2);
    const bayStripe = new THREE.Mesh(bayStripeGeo, materials.roadMarkingYellow);
    bayStripe.position.set(75.0 + bay, roadY + 0.025, -16.0);
    group.add(bayStripe);
  }

  // 7. Pedestrian Crosswalks across all districts
  const crosswalks = [
    // Modern Village crosswalks
    { x: -16, z: 0, rot: 0 },
    { x: 8, z: 0, rot: 0 },
    { x: -5, z: 12, rot: Math.PI / 2 },
    { x: -5, z: -12, rot: Math.PI / 2 },
    // Capital Town crosswalks
    { x: 74, z: 0, rot: 0 },
    { x: 126, z: 0, rot: 0 },
    { x: 105, z: 14, rot: Math.PI / 2 },
    { x: 105, z: -14, rot: Math.PI / 2 },
    { x: 105, z: 36, rot: Math.PI / 2 },
    { x: 105, z: -28, rot: Math.PI / 2 },
  ];

  crosswalks.forEach((cw) => {
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
  });

  // 8. Solid White Stop Lines before Crosswalks and Roundabouts
  const stopLines: { x: number; z: number; w: number; d: number; rot?: number }[] = [
    // Crosswalk approaches (Modern Village)
    { x: -18.2, z: -2.0, w: 0.38, d: 3.8 },
    { x: -13.8, z: 2.0, w: 0.38, d: 3.8 },
    { x: 5.8, z: -2.0, w: 0.38, d: 3.8 },
    { x: 10.2, z: 2.0, w: 0.38, d: 3.8 },
    // Crosswalk approaches (Capital Town)
    { x: 71.5, z: -2.2, w: 0.42, d: 4.2 },
    { x: 76.5, z: 2.2, w: 0.42, d: 4.2 },
    { x: 123.5, z: -2.2, w: 0.42, d: 4.2 },
    { x: 128.5, z: 2.2, w: 0.42, d: 4.2 },
    // Roundabout approaches
    { x: -13.5, z: -2.0, w: 0.38, d: 3.8 },
    { x: 3.5, z: 2.0, w: 0.38, d: 3.8 },
    { x: 94.0, z: -2.4, w: 0.42, d: 4.4 },
    { x: 116.0, z: 2.4, w: 0.42, d: 4.4 },
  ];

  stopLines.forEach((sl) => {
    const slGeo = new THREE.PlaneGeometry(sl.w, sl.d);
    slGeo.rotateX(-Math.PI / 2);
    const slMesh = new THREE.Mesh(slGeo, materials.roadMarkingWhite);
    slMesh.position.set(sl.x, roadY + 0.026, sl.z);
    group.add(slMesh);
  });

  // 9. 3D Mast-Arm Traffic Signal Poles at Major Crossings
  const trafficLightMats = {
    casing: materials.capitalDarkSteel,
    red: new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0xef4444,
      emissiveIntensity: 0.6,
      roughness: 0.2,
    }),
    yellow: new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.3,
      roughness: 0.2,
    }),
    green: new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 0.7,
      roughness: 0.2,
    }),
  };

  const signalLocations: { x: number; z: number; rotY: number; armDirection: 1 | -1 }[] = [
    { x: -16.0, z: 4.9, rotY: 0, armDirection: -1 },
    { x: -16.0, z: -4.9, rotY: Math.PI, armDirection: 1 },
    { x: 8.0, z: 4.9, rotY: 0, armDirection: -1 },
    { x: 8.0, z: -4.9, rotY: Math.PI, armDirection: 1 },
    { x: 74.0, z: 5.4, rotY: 0, armDirection: -1 },
    { x: 74.0, z: -5.4, rotY: Math.PI, armDirection: 1 },
    { x: 126.0, z: 5.4, rotY: 0, armDirection: -1 },
    { x: 126.0, z: -5.4, rotY: Math.PI, armDirection: 1 },
    { x: 109.8, z: 14.0, rotY: -Math.PI / 2, armDirection: -1 },
    { x: 100.2, z: -14.0, rotY: Math.PI / 2, armDirection: 1 },
  ];

  signalLocations.forEach((loc) => {
    const tlGroup = new THREE.Group();
    tlGroup.position.set(loc.x, 0, loc.z);
    tlGroup.rotation.y = loc.rotY;

    // Vertical steel pole (5.0m high)
    const poleGeo = new THREE.CylinderGeometry(0.1, 0.13, 5.0, 10);
    const poleMesh = new THREE.Mesh(poleGeo, trafficLightMats.casing);
    poleMesh.position.y = 2.5;
    poleMesh.castShadow = true;
    tlGroup.add(poleMesh);

    // Cantilever horizontal mast arm extending 2.8m out toward the lane center (at 4.75m elevation)
    const armGeo = new THREE.CylinderGeometry(0.06, 0.08, 2.8, 8);
    armGeo.rotateZ(Math.PI / 2);
    const armMesh = new THREE.Mesh(armGeo, trafficLightMats.casing);
    armMesh.position.set(0, 4.75, loc.armDirection * 1.4);
    armMesh.castShadow = true;
    tlGroup.add(armMesh);

    // Suspended 3-light signal head box (minY = 3.76m, providing >1.2m overhead clearance above vehicles)
    const boxGeo = new THREE.BoxGeometry(0.32, 0.88, 0.28);
    const boxMesh = new THREE.Mesh(boxGeo, trafficLightMats.casing);
    boxMesh.position.set(0, 4.2, loc.armDirection * 2.1);
    boxMesh.castShadow = true;
    tlGroup.add(boxMesh);

    // Red, Yellow, Green Circular Lenses
    const lensGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.05, 12);
    lensGeo.rotateX(Math.PI / 2);

    const redLens = new THREE.Mesh(lensGeo, trafficLightMats.red);
    redLens.position.set(0, 4.48, loc.armDirection * 2.1 - (loc.armDirection > 0 ? 0.15 : -0.15));
    tlGroup.add(redLens);

    const yellowLens = new THREE.Mesh(lensGeo, trafficLightMats.yellow);
    yellowLens.position.set(0, 4.2, loc.armDirection * 2.1 - (loc.armDirection > 0 ? 0.15 : -0.15));
    tlGroup.add(yellowLens);

    const greenLens = new THREE.Mesh(lensGeo, trafficLightMats.green);
    greenLens.position.set(0, 3.92, loc.armDirection * 2.1 - (loc.armDirection > 0 ? 0.15 : -0.15));
    tlGroup.add(greenLens);

    group.add(tlGroup);
  });

  // 10. Highway and District Wayfinding Signage Boards
  const signMats = {
    post: materials.capitalDarkSteel,
    boardGreen: new THREE.MeshStandardMaterial({
      color: 0x065f46,
      roughness: 0.45,
      metalness: 0.1,
    }),
    borderWhite: materials.roadMarkingWhite,
    speedRingRed: materials.carPaintRed,
  };

  const highwaySigns: {
    x: number;
    z: number;
    rotY: number;
    title: string;
    speed: number;
  }[] = [
    { x: -68.0, z: 4.8, rotY: 0, title: 'EAST HIGHWAY -> MODERN VILLAGE / CAPITAL', speed: 40 },
    { x: -41.0, z: -4.8, rotY: Math.PI, title: '<- WEST RURAL VILLAGE & FARMS', speed: 30 },
    { x: 35.0, z: 5.6, rotY: 0, title: 'GRAND HIGHWAY -> CAPITAL TOWN CBD', speed: 50 },
    { x: 65.0, z: -5.6, rotY: Math.PI, title: '<- MODERN VILLAGE / LAKE PROMENADE', speed: 40 },
    { x: 111.4, z: 22.0, rotY: -Math.PI / 2, title: 'CIVIC CENTER / CITY HALL PLAZA', speed: 30 },
    { x: -116.2, z: 5.8, rotY: 0, title: 'RURAL VILLAGE COMMUNE & CROPLANDS', speed: 30 },
  ];

  highwaySigns.forEach((s) => {
    const signGroup = new THREE.Group();
    signGroup.position.set(s.x, 0, s.z);
    signGroup.rotation.y = s.rotY;

    // Dual steel support posts
    for (const px of [-1.1, 1.1]) {
      const pGeo = new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8);
      const post = new THREE.Mesh(pGeo, signMats.post);
      post.position.set(px, 1.6, 0);
      post.castShadow = true;
      signGroup.add(post);
    }

    // Directional sign backing plate
    const signBackGeo = new THREE.BoxGeometry(2.6, 1.1, 0.08);
    const signBack = new THREE.Mesh(signBackGeo, signMats.boardGreen);
    signBack.position.set(0, 2.5, 0.04);
    signBack.castShadow = true;
    signGroup.add(signBack);

    // Reflective white border trim
    const borderGeo = new THREE.BoxGeometry(2.5, 1.0, 0.09);
    const border = new THREE.Mesh(borderGeo, signMats.borderWhite);
    border.position.set(0, 2.5, 0.042);
    border.scale.set(0.96, 0.92, 1.0);
    signGroup.add(border);

    // Inner green face
    const innerGeo = new THREE.BoxGeometry(2.32, 0.84, 0.095);
    const inner = new THREE.Mesh(innerGeo, signMats.boardGreen);
    inner.position.set(0, 2.5, 0.045);
    signGroup.add(inner);

    // Circular Speed Limit Medallion mounted on the side
    const speedPlateGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.06, 16);
    speedPlateGeo.rotateX(Math.PI / 2);
    const speedOuter = new THREE.Mesh(speedPlateGeo, signMats.speedRingRed);
    speedOuter.position.set(1.6, 2.5, 0.05);
    signGroup.add(speedOuter);

    const speedInnerGeo = new THREE.CylinderGeometry(0.28, 0.28, 0.07, 16);
    speedInnerGeo.rotateX(Math.PI / 2);
    const speedInner = new THREE.Mesh(speedInnerGeo, signMats.borderWhite);
    speedInner.position.set(1.6, 2.5, 0.052);
    signGroup.add(speedInner);

    group.add(signGroup);
  });
}

/**
 * Builds the bridges spanning the river system.
 */
function createRiverBridges(group: THREE.Group, materials: MaterialLibrary) {
  // 1. Bridge 1: Rural Stone & Timber River Bridge (West Creek, X: -64 to -42)
  const ruralBridgeGroup = new THREE.Group();
  ruralBridgeGroup.position.set(-53, 0, 0);

  // Timber Road Deck
  const rDeckGeo = new THREE.BoxGeometry(22, 0.35, 8.2);
  const rDeck = new THREE.Mesh(rDeckGeo, materials.modernWoodSiding);
  rDeck.position.y = 0.22;
  rDeck.receiveShadow = true;
  rDeck.castShadow = true;
  ruralBridgeGroup.add(rDeck);

  // Stone Abutments supporting deck from underneath riverbanks
  const rAbutGeo = new THREE.BoxGeometry(2.8, 1.6, 9.2);
  const rAbutWest = new THREE.Mesh(rAbutGeo, materials.rockStoneMaterial);
  rAbutWest.position.set(-11, -0.9, 0);
  rAbutWest.castShadow = true;
  ruralBridgeGroup.add(rAbutWest);

  const rAbutEast = new THREE.Mesh(rAbutGeo, materials.rockStoneMaterial);
  rAbutEast.position.set(11, -0.9, 0);
  rAbutEast.castShadow = true;
  ruralBridgeGroup.add(rAbutEast);

  // Timber Guardrails along both bridge edges
  for (const side of [-4.0, 4.0]) {
    const railGeo = new THREE.BoxGeometry(22, 0.14, 0.14);
    const rail = new THREE.Mesh(railGeo, materials.doorWood);
    rail.position.set(0, 0.85, side);
    rail.castShadow = true;
    ruralBridgeGroup.add(rail);

    for (let rx = -9.0; rx <= 9.0; rx += 2.0) {
      const postGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.75, 8);
      const post = new THREE.Mesh(postGeo, materials.doorWood);
      post.position.set(rx, 0.5, side);
      post.castShadow = true;
      ruralBridgeGroup.add(post);
    }
  }
  group.add(ruralBridgeGroup);

  // 2. Bridge 2: Capital Grand Highway Bridge (Main River, X: 37 to 63)
  const capBridgeGroup = new THREE.Group();
  capBridgeGroup.position.set(50, 0, 0);

  // Concrete Road Deck
  const cDeckGeo = new THREE.BoxGeometry(26, 0.45, 10.4);
  const cDeck = new THREE.Mesh(cDeckGeo, materials.asphaltMaterial);
  cDeck.position.y = 0.28;
  cDeck.receiveShadow = true;
  cDeck.castShadow = true;
  capBridgeGroup.add(cDeck);

  // Precast Concrete Girder Underbelly
  const girderGeo = new THREE.BoxGeometry(26, 0.65, 9.8);
  const girder = new THREE.Mesh(girderGeo, materials.capitalGranite);
  girder.position.y = -0.15;
  girder.castShadow = true;
  capBridgeGroup.add(girder);

  // Concrete River Piers resting in riverbed
  const pierGeo = new THREE.CylinderGeometry(0.75, 0.85, 2.2, 12);
  for (const px of [-6.5, 6.5]) {
    for (const pz of [-3.5, 3.5]) {
      const pier = new THREE.Mesh(pierGeo, materials.capitalGranite);
      pier.position.set(px, -0.65, pz);
      pier.castShadow = true;
      capBridgeGroup.add(pier);
    }
  }

  // Steel Truss Safety Barriers & Lighting
  for (const side of [-5.05, 5.05]) {
    const bRailGeo = new THREE.BoxGeometry(26, 0.16, 0.16);
    const bRail = new THREE.Mesh(bRailGeo, materials.capitalDarkSteel);
    bRail.position.set(0, 1.15, side);
    bRail.castShadow = true;
    capBridgeGroup.add(bRail);

    for (let bx = -11.0; bx <= 11.0; bx += 2.2) {
      const bPostGeo = new THREE.BoxGeometry(0.12, 0.95, 0.12);
      const bPost = new THREE.Mesh(bPostGeo, materials.capitalDarkSteel);
      bPost.position.set(bx, 0.72, side);
      bPost.castShadow = true;
      capBridgeGroup.add(bPost);
    }
  }
  group.add(capBridgeGroup);
}

/**
 * Builds the picturesque Lake District recreation promenade and arched bridge.
 */
function createLakePromenade(group: THREE.Group, materials: MaterialLibrary) {
  // 1. Wooden Marina Deck / Promenade along north lake shoreline (South of Scenic Road)
  const deckGeo = new THREE.BoxGeometry(34, 0.35, 4.8);
  const deckMesh = new THREE.Mesh(deckGeo, materials.modernWoodSiding);
  deckMesh.position.set(5, 0.1, -34.8);
  deckMesh.receiveShadow = true;
  deckMesh.castShadow = true;
  group.add(deckMesh);

  // Mooring Posts / Pilings along deck
  for (let x = -11; x <= 21; x += 3.6) {
    const postGeo = new THREE.CylinderGeometry(0.14, 0.14, 1.2, 10);
    const post = new THREE.Mesh(postGeo, materials.doorWood);
    post.position.set(x, 0.45, -37.0);
    post.castShadow = true;
    group.add(post);

    const cleatGeo = new THREE.BoxGeometry(0.3, 0.06, 0.08);
    const cleat = new THREE.Mesh(cleatGeo, materials.metalSteel);
    cleat.position.set(x, 0.95, -37.0);
    group.add(cleat);
  }

  // Lifebuoy Station on Promenade
  const buoyPostGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.8, 8);
  const buoyPost = new THREE.Mesh(buoyPostGeo, materials.metalSteel);
  buoyPost.position.set(-9, 0.9, -34.2);
  buoyPost.castShadow = true;
  group.add(buoyPost);

  const buoyGeo = new THREE.TorusGeometry(0.35, 0.09, 12, 24);
  const buoy = new THREE.Mesh(buoyGeo, materials.carPaintRed);
  buoy.position.set(-9, 1.4, -34.2);
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

  const abutGeo = new THREE.BoxGeometry(2.4, 1.4, 3.2);
  const abut1 = new THREE.Mesh(abutGeo, materials.rockStoneMaterial);
  abut1.position.set(-archSpan / 2, 0.4, 0);
  abut1.castShadow = true;
  bridgeGroup.add(abut1);

  const abut2 = new THREE.Mesh(abutGeo, materials.rockStoneMaterial);
  abut2.position.set(archSpan / 2, 0.4, 0);
  abut2.castShadow = true;
  bridgeGroup.add(abut2);

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
