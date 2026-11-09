import * as THREE from 'three';
import { MaterialLibrary } from './materials';
import { isPointInDriveableArea } from './collisionSystem';
import { createCreatorPavilionInterior, CreatorPavilionInteriorResult } from './creatorPavilionInterior';

export interface AnimatedLandmarkComponents {
  fountainWater: THREE.Mesh;
  fountainSpout: THREE.Mesh;
  playgroundSwing: THREE.Group;
  foliageWindGroup: THREE.Group;
  floatingBeaconMarkers: THREE.Group;
  mooredRowboat?: THREE.Group;
  playgroundSeesaw?: THREE.Group;
  creatorPavilion?: CreatorPavilionInteriorResult;
}

export function createModernVillage(materials: MaterialLibrary): {
  villageGroup: THREE.Group;
  animatedComponents: AnimatedLandmarkComponents;
  beaconMeshes: THREE.Mesh[];
  clickableBuildingMeshes: THREE.Mesh[];
} {
  const villageGroup = new THREE.Group();
  villageGroup.name = 'ModernVillage';
  const beaconMeshes: THREE.Mesh[] = [];
  const clickableBuildingMeshes: THREE.Mesh[] = [];

  const floatingBeaconMarkers = new THREE.Group();
  villageGroup.add(floatingBeaconMarkers);

  const foliageWindGroup = new THREE.Group();
  villageGroup.add(foliageWindGroup);

  // Helper: Interactive 3D Beacon Marker for destination raycasting
  function createBeaconMarker(id: string, name: string, x: number, y: number, z: number, colorHex: number) {
    const beaconGroup = new THREE.Group();
    beaconGroup.position.set(x, y, z);

    // Glowing diamond / octahedron
    const diamondGeo = new THREE.OctahedronGeometry(0.75, 0);
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

    // Solid inner core
    const coreGeo = new THREE.OctahedronGeometry(0.35, 0);
    const coreMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.userData = { isLandmarkBeacon: true, landmarkId: id, landmarkName: name };
    beaconMeshes.push(core);
    beaconGroup.add(core);

    // Hovering pulse ring
    const ringGeo = new THREE.RingGeometry(1.0, 1.25, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colorHex,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    beaconGroup.add(ring);

    floatingBeaconMarkers.add(beaconGroup);
  }

  // ========================================================
  // 1. TOWN CENTER & CIVIC PROMENADE
  // ========================================================
  createTownCenter(villageGroup, clickableBuildingMeshes, materials);
  createBeaconMarker('town-center', 'Town Center', -14, 5.0, 0, 0x38bdf8);

  // ========================================================
  // 2. MODERN RESIDENTIAL NEIGHBORHOODS
  // ========================================================
  createResidentialNeighborhood(villageGroup, clickableBuildingMeshes, materials);
  createBeaconMarker('residential', 'Residential District', -32, 5.5, 42, 0x22c55e);

  // ========================================================
  // 3. BEAUTIFUL CENTRAL PARK & FOUNTAIN
  // ========================================================
  const parkAnim = createCentralPark(villageGroup, clickableBuildingMeshes, materials);
  createBeaconMarker('central-park', 'Central Park', 20, 4.5, -6, 0x10b981);

  // ========================================================
  // 4. BOTANICAL GARDENS & GREENHOUSE
  // ========================================================
  createBotanicalGardens(villageGroup, clickableBuildingMeshes, materials);
  createBeaconMarker('botanical-garden', 'Botanical Garden', 28, 4.5, 36, 0xec4899);

  // ========================================================
  // 4b. 3D CREATOR PAVILION (STUDIO OF SHAHANUR MOLLAH)
  // ========================================================
  const pavilionInterior = createCreatorPavilion(villageGroup, clickableBuildingMeshes, materials, foliageWindGroup);
  createBeaconMarker('creator-pavilion', 'Creator Pavilion', 27.5, 4.5, 15.0, 0x14b8a6);

  // ========================================================
  // 5. LAKE DISTRICT RECREATION & PICNIC GROUNDS
  // ========================================================
  const lakeAnim = createLakeRecreation(villageGroup, clickableBuildingMeshes, materials);
  createBeaconMarker('lake-district', 'Lake District', 5, 3.8, -42, 0x06b6d4);

  // ========================================================
  // 6. DISTRICT 1: RURAL VILLAGE & FARMLANDS
  // ========================================================
  createRuralVillage(villageGroup, clickableBuildingMeshes, materials, foliageWindGroup);
  createBeaconMarker('rural-village', 'Rural Village', -110, 5.0, 0, 0xf59e0b);

  // ========================================================
  // 7. DISTRICT 3: CAPITAL TOWN & CENTRAL BUSINESS DISTRICT
  // ========================================================
  createCapitalTown(villageGroup, clickableBuildingMeshes, materials, foliageWindGroup);
  createBeaconMarker('capital-town', 'Capital Town CBD', 105, 6.0, 0, 0x6366f1);
  createBeaconMarker('capital-plaza', 'Capital Civic Plaza', 125, 5.0, 15, 0x8b5cf6);

  // ========================================================
  // 8. STREET FURNITURE, MODERN CARS & WAYFINDING
  // ========================================================
  createStreetInfrastructureAndCars(villageGroup, foliageWindGroup, materials);

  return {
    villageGroup,
    animatedComponents: {
      fountainWater: parkAnim.fountainWater,
      fountainSpout: parkAnim.fountainSpout,
      playgroundSwing: parkAnim.playgroundSwing,
      foliageWindGroup,
      floatingBeaconMarkers,
      mooredRowboat: lakeAnim.rowboatGroup,
      playgroundSeesaw: parkAnim.playgroundSeesaw,
      creatorPavilion: pavilionInterior,
    },
    beaconMeshes,
    clickableBuildingMeshes,
  };
}

// -----------------------------------------------------------------------------
// 1. TOWN CENTER BUILDINGS & CIVIC PLAZA
// -----------------------------------------------------------------------------
function createTownCenter(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary
) {
  const centerGroup = new THREE.Group();
  centerGroup.position.set(-20, 0, 0);

  // Pedestrian Plaza Pavers (South of Main Boulevard, strictly west of North-South Boulevard)
  // centerGroup at (-20, 0, 0) + pos (-3, 0.10, 9.5) -> World X in [-31, -15], World Z in [5, 14]
  const plazaGeo = new THREE.PlaneGeometry(16, 9);
  plazaGeo.rotateX(-Math.PI / 2);
  const plazaMesh = new THREE.Mesh(plazaGeo, materials.plazaPaverMaterial);
  plazaMesh.position.set(-3, 0.10, 9.5);
  plazaMesh.receiveShadow = true;
  centerGroup.add(plazaMesh);

    // Decorative protective bollards separating plaza from main street (ending safely west of boulevard)
    for (let bx = -4.0; bx <= 6.8; bx += 2.8) {
      const bollardGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.85, 10);
      const bollard = new THREE.Mesh(bollardGeo, materials.metalBlack);
      bollard.position.set(bx, 0.42, 5.0);
      bollard.castShadow = true;
      centerGroup.add(bollard);

      // Reflective top ring on bollard
      const bRingGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.08, 10);
      const bRing = new THREE.Mesh(bRingGeo, materials.roadMarkingWhite);
      bRing.position.set(bx, 0.72, 5.0);
      centerGroup.add(bRing);
    }

  // Building A: Civic Center / Library with Modern Glass Atrium & Clock Tower
  // World pos: (-18, 0, -10.5) -> centerGroup relative (2, 0, -10.5)
  const civicGroup = new THREE.Group();
  civicGroup.position.set(2, 0, -10.5);

  // Ground plinth foundation (prevents clipping or floating)
  const civicPlinth = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.3, 8.0), materials.concreteCurbs);
  civicPlinth.position.y = 0.15;
  civicPlinth.receiveShadow = true;
  civicGroup.add(civicPlinth);

  // Main civic hall block - CLICKABLE
  const civicMainGeo = new THREE.BoxGeometry(11.0, 5.5, 7.5);
  const civicMain = new THREE.Mesh(civicMainGeo, materials.modernWhiteStucco);
  civicMain.position.y = 2.75 + 0.15;
  civicMain.castShadow = true;
  civicMain.receiveShadow = true;
  civicMain.userData = { isBuilding: true, buildingId: 'civic-library' };
  clickableBuildings.push(civicMain);
  civicGroup.add(civicMain);

  // Architectural Parapet Cap
  const civicParapet = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.35, 8.4), materials.modernDarkSlate);
  civicParapet.position.y = 5.8;
  civicParapet.castShadow = true;
  civicGroup.add(civicParapet);

  // Glass Atrium Facade with Mullions
  const atriumGeo = new THREE.BoxGeometry(9, 4.5, 0.3);
  const atrium = new THREE.Mesh(atriumGeo, materials.glassWindowDay);
  atrium.position.set(0, 2.65, 4.1);
  atrium.userData = { isBuilding: true, buildingId: 'civic-library' };
  clickableBuildings.push(atrium);
  civicGroup.add(atrium);

  // Vertical Mullions
  for (let mx = -4; mx <= 4; mx += 2) {
    const mullion = new THREE.Mesh(new THREE.BoxGeometry(0.1, 4.5, 0.35), materials.metalBlack);
    mullion.position.set(mx, 2.65, 4.1);
    civicGroup.add(mullion);
  }

  // Modern Clock Tower Spire
  const towerGeo = new THREE.BoxGeometry(3.2, 11, 3.2);
  const tower = new THREE.Mesh(towerGeo, materials.modernDarkSlate);
  tower.position.set(5.5, 5.65, 2);
  tower.castShadow = true;
  civicGroup.add(tower);

  // Tower Copper Pyramid Spire Roof
  const spireGeo = new THREE.ConeGeometry(2.4, 3.0, 4);
  spireGeo.rotateY(Math.PI / 4);
  const spire = new THREE.Mesh(spireGeo, materials.metalBronze);
  spire.position.set(5.5, 12.65, 2);
  spire.castShadow = true;
  civicGroup.add(spire);

  // Clock Faces with Glowing Dials
  for (const side of [0, Math.PI / 2]) {
    const clockGeo = new THREE.CylinderGeometry(0.85, 0.85, 0.1, 24);
    clockGeo.rotateX(Math.PI / 2);
    const clock = new THREE.Mesh(clockGeo, materials.modernWhiteStucco);
    if (side === 0) {
      clock.position.set(5.5, 9.35, 3.65);
    } else {
      clock.position.set(7.15, 9.35, 2);
      clock.rotation.y = Math.PI / 2;
    }
    civicGroup.add(clock);

    // Glowing Clock Center
    const dialCenter = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.14, 16), materials.lampGlow);
    dialCenter.rotation.x = Math.PI / 2;
    if (side === 0) {
      dialCenter.position.set(5.5, 9.35, 3.68);
    } else {
      dialCenter.position.set(7.18, 9.35, 2);
      dialCenter.rotation.y = Math.PI / 2;
    }
    civicGroup.add(dialCenter);
  }

  // Bicycle Racks outside Library
  const bikeRackGeo = new THREE.TorusGeometry(0.4, 0.04, 8, 16, Math.PI);
  for (let bk = -2.5; bk <= 2.5; bk += 1.2) {
    const bikeRack = new THREE.Mesh(bikeRackGeo, materials.metalSteel);
    bikeRack.position.set(bk, 0.45, 5.2);
    bikeRack.castShadow = true;
    civicGroup.add(bikeRack);
  }

  centerGroup.add(civicGroup);

  // Building B: Corner Café with Striped Awnings, Mullioned Windows & Central Park Terrace
  // World pos: (12, 0, -11) -> centerGroup relative (32, 0, -11)
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(32, 0, -11);

  // Foundation Plinth
  const cafePlinth = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.25, 8.0), materials.concreteCurbs);
  cafePlinth.position.y = 0.125;
  cafeGroup.add(cafePlinth);

  // Main Café Body - CLICKABLE
  const cafeGeo = new THREE.BoxGeometry(10, 4.6, 7.5);
  const cafe = new THREE.Mesh(cafeGeo, materials.modernWarmBeige);
  cafe.position.y = 2.425;
  cafe.castShadow = true;
  cafe.receiveShadow = true;
  cafe.userData = { isBuilding: true, buildingId: 'village-cafe' };
  clickableBuildings.push(cafe);
  cafeGroup.add(cafe);

  // Overhang Pitched Roof
  const cafeRoofGeo = new THREE.BoxGeometry(10.6, 0.4, 8.2);
  const cafeRoof = new THREE.Mesh(cafeRoofGeo, materials.roofTileDark);
  cafeRoof.position.set(0, 4.9, 0);
  cafeRoof.castShadow = true;
  cafeGroup.add(cafeRoof);

  // Wood slat façade trim
  const trimGeo = new THREE.BoxGeometry(10.2, 1.2, 0.2);
  const trim = new THREE.Mesh(trimGeo, materials.modernWoodSiding);
  trim.position.set(0, 3.9, 3.8);
  cafeGroup.add(trim);

  // Café Storefront Display Windows with warm interior glow
  const windowGeo = new THREE.BoxGeometry(7.5, 2.2, 0.2);
  const storeWin = new THREE.Mesh(windowGeo, materials.glassWindowGlow);
  storeWin.position.set(0, 1.7, 3.8);
  cafeGroup.add(storeWin);

  // Storefront Mullions
  for (const mx of [-2.5, 0, 2.5]) {
    const wm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.24), materials.metalBlack);
    wm.position.set(mx, 1.7, 3.8);
    cafeGroup.add(wm);
  }

  // Striped Fabric Awning
  const awningGeo = new THREE.BoxGeometry(8.2, 0.2, 1.8);
  const awning = new THREE.Mesh(awningGeo, materials.awningStriped);
  awning.position.set(0, 3.1, 4.5);
  awning.rotation.x = 0.22;
  awning.castShadow = true;
  cafeGroup.add(awning);

  // Outdoor Terrace: Tables, Parasols & Chairs overlooking Central Park
  const tablePositions = [
    { x: 6.5, z: -1.0 },
    { x: 6.5, z: 2.0 },
    { x: 8.5, z: 0.5 },
  ];
  tablePositions.forEach((tp) => {
    // Table Top
    const tableTopGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.06, 16);
    const tableTop = new THREE.Mesh(tableTopGeo, materials.modernWoodSiding);
    tableTop.position.set(tp.x, 0.75, tp.z);
    tableTop.castShadow = true;
    cafeGroup.add(tableTop);

    const legGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.75, 8);
    const leg = new THREE.Mesh(legGeo, materials.metalBlack);
    leg.position.set(tp.x, 0.38, tp.z);
    cafeGroup.add(leg);

    // Parasol Umbrella
    const umbrellaGeo = new THREE.ConeGeometry(1.35, 0.55, 12);
    const umbrella = new THREE.Mesh(umbrellaGeo, materials.awningStriped);
    umbrella.position.set(tp.x, 2.15, tp.z);
    umbrella.castShadow = true;
    cafeGroup.add(umbrella);

    const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 2.15, 8);
    const pole = new THREE.Mesh(poleGeo, materials.metalSteel);
    pole.position.set(tp.x, 1.08, tp.z);
    cafeGroup.add(pole);

    // Chairs around table
    for (let ci = 0; ci < 3; ci++) {
      const cang = (ci / 3) * Math.PI * 2;
      const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 0.4), materials.timberBench);
      chairSeat.position.set(tp.x + Math.cos(cang) * 0.95, 0.45, tp.z + Math.sin(cang) * 0.95);
      chairSeat.castShadow = true;
      cafeGroup.add(chairSeat);

      const chairLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.45, 6), materials.metalBlack);
      chairLeg.position.set(tp.x + Math.cos(cang) * 0.95, 0.225, tp.z + Math.sin(cang) * 0.95);
      cafeGroup.add(chairLeg);
    }
  });

  centerGroup.add(cafeGroup);

  // Building C: Modern Grocery & Boutique Shops - CLICKABLE
  // World pos: (-16, 0, 16) -> centerGroup relative (4, 0, 16)
  const shopGroup = new THREE.Group();
  shopGroup.position.set(4, 0, 16);

  // Foundation Plinth (Clear of North-South Boulevard X: [-9.4, -0.6])
  const shopPlinth = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.25, 7.5), materials.concreteCurbs);
  shopPlinth.position.y = 0.125;
  shopGroup.add(shopPlinth);

  const shopGeo = new THREE.BoxGeometry(9.0, 5.0, 7.0);
  const shop = new THREE.Mesh(shopGeo, materials.modernDarkSlate);
  shop.position.y = 2.625;
  shop.castShadow = true;
  shop.receiveShadow = true;
  shop.userData = { isBuilding: true, buildingId: 'retail-arcade' };
  clickableBuildings.push(shop);
  shopGroup.add(shop);

  // Glazed storefront with mullions
  const shopWinGeo = new THREE.BoxGeometry(7.5, 2.6, 0.2);
  const shopWin = new THREE.Mesh(shopWinGeo, materials.glassWindowDay);
  shopWin.position.set(0, 1.8, -3.55);
  shopGroup.add(shopWin);

  for (let sx = -3; sx <= 3; sx += 2) {
    const sm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.7, 0.24), materials.metalSteel);
    sm.position.set(sx, 1.8, -3.55);
    shopGroup.add(sm);
  }

  // Wood entrance canopy
  const canopyGeo = new THREE.BoxGeometry(5.4, 0.2, 1.8);
  const canopy = new THREE.Mesh(canopyGeo, materials.modernWoodSiding);
  canopy.position.set(0, 3.3, -4.2);
  canopy.castShadow = true;
  shopGroup.add(canopy);

  // Potted Topiary Shrubs flanking shop entrance
  for (const px of [-3.2, 3.2]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.6, 12), materials.concreteCurbs);
    pot.position.set(px, 0.3, -4.2);
    shopGroup.add(pot);

    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), materials.hedgeBoxwood);
    shrub.position.set(px, 0.8, -4.2);
    shrub.castShadow = true;
    shopGroup.add(shrub);
  }

  centerGroup.add(shopGroup);

  // Modern Plaza Monument / Fountain Basin (Located centrally inside pedestrian plaza, clear of roadway and shops)
  const plazaFountainGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.5, 24);
  const plazaFountain = new THREE.Mesh(plazaFountainGeo, materials.modernDarkSlate);
  plazaFountain.position.set(0, 0.35, 7.8);
  plazaFountain.castShadow = true;
  centerGroup.add(plazaFountain);

  const waterDiscGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.1, 24);
  const waterDisc = new THREE.Mesh(waterDiscGeo, materials.lakeWaterMaterial);
  waterDisc.position.set(0, 0.55, 7.8);
  centerGroup.add(waterDisc);

  // Center bronze water jet ring
  const bronzeJetGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.6, 16);
  const bronzeJet = new THREE.Mesh(bronzeJetGeo, materials.metalBronze);
  bronzeJet.position.set(0, 0.65, 7.8);
  centerGroup.add(bronzeJet);

  // ========================================================
  // Civic Building D: Village Health Clinic & Urgent Care - CLICKABLE
  // World pos: (-28, 0, 16) -> centerGroup relative (-8, 0, 16)
  // ========================================================
  const clinicGroup = new THREE.Group();
  clinicGroup.position.set(-8, 0, 16);

  const clinicPlinth = new THREE.Mesh(new THREE.BoxGeometry(13.0, 0.3, 9.0), materials.concreteCurbs);
  clinicPlinth.position.y = 0.15;
  clinicPlinth.receiveShadow = true;
  clinicGroup.add(clinicPlinth);

  // Main 2-story clinic building
  const clinicMainGeo = new THREE.BoxGeometry(12.5, 5.2, 8.5);
  const clinicMain = new THREE.Mesh(clinicMainGeo, materials.modernWhiteStucco);
  clinicMain.position.y = 2.75;
  clinicMain.castShadow = true;
  clinicMain.receiveShadow = true;
  clinicMain.userData = { isBuilding: true, buildingId: 'health-clinic' };
  clickableBuildings.push(clinicMain);
  clinicGroup.add(clinicMain);

  // Parapet Trim
  const clinicTrim = new THREE.Mesh(new THREE.BoxGeometry(12.8, 0.3, 8.8), materials.modernDarkSlate);
  clinicTrim.position.y = 5.4;
  clinicGroup.add(clinicTrim);

  // Glazed emergency & entrance canopy
  const canopyBox = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.2, 2.6), materials.metalSteel);
  canopyBox.position.set(0, 3.2, -4.5);
  canopyBox.castShadow = true;
  clinicGroup.add(canopyBox);

  // Red Medical Cross Emblem on Entrance Facade
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.1), materials.medicalCrossRed);
  crossV.position.set(0, 4.2, -4.3);
  clinicGroup.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.1), materials.medicalCrossRed);
  crossH.position.set(0, 4.2, -4.3);
  clinicGroup.add(crossH);

  // Glass Frontage & Emergency Drop-off
  const clinicGlass = new THREE.Mesh(new THREE.BoxGeometry(8.5, 2.4, 0.2), materials.glassWindowDay);
  clinicGlass.position.set(0, 1.6, -4.3);
  clinicGlass.userData = { isBuilding: true, buildingId: 'health-clinic' };
  clickableBuildings.push(clinicGlass);
  clinicGroup.add(clinicGlass);

  centerGroup.add(clinicGroup);

  // ========================================================
  // Civic Building E: Valley Elementary School & Academy - CLICKABLE
  // World pos: (-44, 0, 16) -> centerGroup relative (-24, 0, 16)
  // ========================================================
  const schoolGroup = new THREE.Group();
  schoolGroup.position.set(-24, 0, 16);

  const schoolPlinth = new THREE.Mesh(new THREE.BoxGeometry(15.5, 0.3, 9.5), materials.concreteCurbs);
  schoolPlinth.position.y = 0.15;
  schoolPlinth.receiveShadow = true;
  schoolGroup.add(schoolPlinth);

  // Main School Body
  const schoolMain = new THREE.Mesh(new THREE.BoxGeometry(15.0, 5.8, 9.0), materials.modernWarmBeige);
  schoolMain.position.y = 3.05;
  schoolMain.castShadow = true;
  schoolMain.receiveShadow = true;
  schoolMain.userData = { isBuilding: true, buildingId: 'village-school' };
  clickableBuildings.push(schoolMain);
  schoolGroup.add(schoolMain);

  // Pitched Gable Centerpiece
  const schoolRoof = new THREE.Mesh(new THREE.ConeGeometry(5.8, 2.2, 4), materials.roofTileDark);
  schoolRoof.position.set(0, 6.9, 0);
  schoolRoof.rotation.y = Math.PI / 4;
  schoolRoof.castShadow = true;
  schoolRoof.userData = { isBuilding: true, buildingId: 'village-school' };
  clickableBuildings.push(schoolRoof);
  schoolGroup.add(schoolRoof);

  // Classroom Windows Rows
  for (let wy = 2.0; wy <= 4.2; wy += 2.2) {
    for (let wx = -6; wx <= 6; wx += 3.0) {
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.2, 0.15), materials.glassWindowDay);
      win.position.set(wx, wy, -5.05);
      schoolGroup.add(win);
    }
  }

  // School Flagpole & Plaza Steps
  const poleGeo = new THREE.CylinderGeometry(0.06, 0.08, 6.5, 8);
  const pole = new THREE.Mesh(poleGeo, materials.metalSteel);
  pole.position.set(0, 3.25, -6.5);
  pole.castShadow = true;
  schoolGroup.add(pole);

  centerGroup.add(schoolGroup);

  // ========================================================
  // Civic Building F: Community Cultural Center & Council Hall - CLICKABLE
  // World pos: (-36, 0, -10.5) -> centerGroup relative (-16, 0, -10.5)
  // ========================================================
  const commGroup = new THREE.Group();
  commGroup.position.set(-16, 0, -10.5);

  const commPlinth = new THREE.Mesh(new THREE.BoxGeometry(12.0, 0.3, 8.0), materials.concreteCurbs);
  commPlinth.position.y = 0.15;
  commPlinth.receiveShadow = true;
  commGroup.add(commPlinth);

  // Curved Glulam Timber Hall Structure
  const commMain = new THREE.Mesh(new THREE.BoxGeometry(11.5, 5.0, 7.5), materials.modernWoodSiding);
  commMain.position.y = 2.65;
  commMain.castShadow = true;
  commMain.receiveShadow = true;
  commMain.userData = { isBuilding: true, buildingId: 'community-center' };
  clickableBuildings.push(commMain);
  commGroup.add(commMain);

  // Curved Arched Canopy Roof
  const roofArc = new THREE.Mesh(new THREE.CylinderGeometry(8.0, 8.0, 14.2, 24, 1, false, 0, Math.PI), materials.modernDarkSlate);
  roofArc.rotation.z = Math.PI / 2;
  roofArc.rotation.y = Math.PI / 2;
  roofArc.position.set(0, 5.2, 0);
  roofArc.scale.set(0.28, 1.0, 1.0);
  roofArc.castShadow = true;
  roofArc.userData = { isBuilding: true, buildingId: 'community-center' };
  clickableBuildings.push(roofArc);
  commGroup.add(roofArc);

  // Glazed Exhibition Front
  const commGlass = new THREE.Mesh(new THREE.BoxGeometry(10.0, 3.4, 0.2), materials.glassWindowDay);
  commGlass.position.set(0, 2.0, 5.05);
  commGlass.userData = { isBuilding: true, buildingId: 'community-center' };
  clickableBuildings.push(commGlass);
  commGroup.add(commGlass);

  centerGroup.add(commGroup);

  group.add(centerGroup);
}

// -----------------------------------------------------------------------------
// 2. MODERN RESIDENTIAL NEIGHBORHOODS & VILLAS
// -----------------------------------------------------------------------------
function createResidentialNeighborhood(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary
) {
  const resGroup = new THREE.Group();
  resGroup.position.set(0, 0, 0);

  // Helper: Modern 2-Story Villa with Wood Accent, Distinct Roofs, Mullions, and Front Garden
  function buildModernVilla(
    x: number,
    z: number,
    rotY: number = 0,
    style: 'white-wood' | 'dark-slate' | 'terracotta' = 'white-wood',
    buildingId?: string
  ) {
    const villa = new THREE.Group();
    villa.position.set(x, 0, z);
    villa.rotation.y = rotY;

    // Concrete Plinth Foundation (Prevents any floating or clipping)
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(8.9, 0.25, 7.9), materials.concreteCurbs);
    plinth.position.y = 0.125;
    plinth.receiveShadow = true;
    villa.add(plinth);

    // Ground Floor Block - CLICKABLE
    const groundGeo = new THREE.BoxGeometry(8.5, 3.2, 7.5);
    const groundMat = style === 'dark-slate' ? materials.modernDarkSlate : materials.modernWhiteStucco;
    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.position.y = 1.725;
    groundMesh.castShadow = true;
    groundMesh.receiveShadow = true;
    if (buildingId) {
      groundMesh.userData = { isBuilding: true, buildingId };
      clickableBuildings.push(groundMesh);
    }
    villa.add(groundMesh);

    // Second Floor Cantilevered Block
    const upperGeo = new THREE.BoxGeometry(7.2, 3.0, 6.8);
    const upperMat = style === 'white-wood' ? materials.modernWoodSiding : materials.modernWhiteStucco;
    const upperMesh = new THREE.Mesh(upperGeo, upperMat);
    upperMesh.position.set(-0.4, 4.725, 0.2);
    upperMesh.castShadow = true;
    upperMesh.receiveShadow = true;
    if (buildingId) {
      upperMesh.userData = { isBuilding: true, buildingId };
      clickableBuildings.push(upperMesh);
    }
    villa.add(upperMesh);

    // Roof: Gable Roof for Terracotta, Modern Parapet Deck with Solar Panels for others
    if (style === 'terracotta') {
      const roofGeo = new THREE.ConeGeometry(5.8, 2.0, 4);
      roofGeo.rotateY(Math.PI / 4);
      const roof = new THREE.Mesh(roofGeo, materials.roofTileTerracotta);
      roof.position.set(-0.4, 7.15, 0.2);
      roof.castShadow = true;
      villa.add(roof);

      // Chimney Stack
      const chim = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.8, 0.7), materials.modernDarkSlate);
      chim.position.set(1.6, 7.4, -0.6);
      chim.castShadow = true;
      villa.add(chim);
    } else {
      // Modern parapet roof with dark coping
      const roofTrimGeo = new THREE.BoxGeometry(7.6, 0.35, 7.2);
      const roofTrim = new THREE.Mesh(roofTrimGeo, materials.roofTileDark);
      roofTrim.position.set(-0.4, 6.35, 0.2);
      roofTrim.castShadow = true;
      villa.add(roofTrim);

      // Rooftop Skylight / Solar Panel Detail
      const solarGeo = new THREE.BoxGeometry(3.0, 0.1, 2.2);
      const solar = new THREE.Mesh(solarGeo, materials.glassWindowDay);
      solar.position.set(-0.4, 6.55, 0.2);
      villa.add(solar);
    }

    // Glass Balcony with Metal Railing
    const balconyGeo = new THREE.BoxGeometry(4.2, 0.15, 1.8);
    const balcony = new THREE.Mesh(balconyGeo, materials.sidewalkMaterial);
    balcony.position.set(-0.4, 3.3, 4.4);
    balcony.castShadow = true;
    villa.add(balcony);

    const railGeo = new THREE.BoxGeometry(4.2, 0.85, 0.1);
    const rail = new THREE.Mesh(railGeo, materials.glassWindowDay);
    rail.position.set(-0.4, 3.8, 5.25);
    villa.add(rail);

    // Balcony Handrail Top Bar
    const topBar = new THREE.Mesh(new THREE.BoxGeometry(4.25, 0.06, 0.12), materials.metalBlack);
    topBar.position.set(-0.4, 4.25, 5.25);
    villa.add(topBar);

    // Ground Floor Picture Window with Frame
    const win1Geo = new THREE.BoxGeometry(2.4, 1.8, 0.15);
    const win1 = new THREE.Mesh(win1Geo, materials.glassWindowGlow);
    win1.position.set(1.8, 1.8, 3.8);
    villa.add(win1);

    const frame1 = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.0, 0.18), materials.metalBlack);
    frame1.position.set(1.8, 1.8, 3.75);
    villa.add(frame1);

    // Upper Floor Master Window
    const win2Geo = new THREE.BoxGeometry(2.8, 1.6, 0.15);
    const win2 = new THREE.Mesh(win2Geo, materials.glassWindowDay);
    win2.position.set(-0.4, 4.9, 3.65);
    villa.add(win2);

    const frame2 = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.8, 0.18), materials.metalBlack);
    frame2.position.set(-0.4, 4.9, 3.6);
    villa.add(frame2);

    // Front Entrance Door & Porch Canopy with Sconce Light
    const doorGeo = new THREE.BoxGeometry(1.2, 2.2, 0.1);
    const door = new THREE.Mesh(doorGeo, materials.doorWood);
    door.position.set(-2.0, 1.2, 3.8);
    villa.add(door);

    const porchGeo = new THREE.BoxGeometry(2.4, 0.15, 1.4);
    const porch = new THREE.Mesh(porchGeo, materials.modernDarkSlate);
    porch.position.set(-2.0, 2.4, 4.3);
    villa.add(porch);

    // Front Entry Step
    const step = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.12, 0.8), materials.concreteCurbs);
    step.position.set(-2.0, 0.06, 4.1);
    villa.add(step);

    // Outdoor Wall Sconce Lamp
    const sconce = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.15), materials.lampGlow);
    sconce.position.set(-1.1, 1.9, 3.85);
    villa.add(sconce);

    // Private Driveway with Stone Pavers
    const driveGeo = new THREE.PlaneGeometry(3.6, 8.5);
    driveGeo.rotateX(-Math.PI / 2);
    const drive = new THREE.Mesh(driveGeo, materials.plazaPaverMaterial);
    drive.position.set(4.2, 0.09, 4.5);
    drive.receiveShadow = true;
    villa.add(drive);

    // Front Lawn Boxwood Hedges & Flower Beds
    const hedgeGeo = new THREE.BoxGeometry(4.5, 0.85, 0.6);
    const hedge = new THREE.Mesh(hedgeGeo, materials.hedgeBoxwood);
    hedge.position.set(-1.8, 0.45, 6.2);
    hedge.castShadow = true;
    villa.add(hedge);

    // Stepping stones across the lawn
    for (let st = 4.8; st <= 6.8; st += 0.8) {
      const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.32, 0.06, 8), materials.rockStoneMaterial);
      stone.position.set(-2.0, 0.04, st);
      stone.receiveShadow = true;
      villa.add(stone);
    }

    // Modern Horizontal Slat Privacy Fence
    const fenceGeo = new THREE.BoxGeometry(0.1, 1.4, 7.0);
    const fence = new THREE.Mesh(fenceGeo, materials.modernWoodSiding);
    fence.position.set(-4.4, 0.7, 0.5);
    fence.castShadow = true;
    villa.add(fence);

    // Mailbox
    const mbPostGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8);
    const mbPost = new THREE.Mesh(mbPostGeo, materials.metalBlack);
    mbPost.position.set(-3.8, 0.5, 7.8);
    villa.add(mbPost);

    const mbBoxGeo = new THREE.BoxGeometry(0.35, 0.25, 0.5);
    const mbBox = new THREE.Mesh(mbBoxGeo, materials.metalSteel);
    mbBox.position.set(-3.8, 1.05, 7.8);
    villa.add(mbBox);

    resGroup.add(villa);
  }

  // Villa 1: Cedar Horizon Villa (World: -38, 47) - CLICKABLE
  buildModernVilla(-38, 47, 0, 'white-wood', 'villa-cedar');
  // Villa 2: Dark Slate Contemporary Villa (World: -26, 47) - CLICKABLE
  buildModernVilla(-26, 47, 0, 'dark-slate', 'villa-slate');
  // Villa 3: Terracotta Gable Residence (World: -15, 47) - CLICKABLE
  buildModernVilla(-15, 47, 0, 'terracotta', 'villa-terracotta');

  // Multi-Story Contemporary Apartment Building (Residential District North of North Lane, World: -44, 73) - CLICKABLE
  const aptGroup = new THREE.Group();
  aptGroup.position.set(-44, 0, 73);

  // Plinth foundation
  const aptPlinth = new THREE.Mesh(new THREE.BoxGeometry(11.0, 0.3, 8.5), materials.concreteCurbs);
  aptPlinth.position.y = 0.15;
  aptGroup.add(aptPlinth);

  const aptGeo = new THREE.BoxGeometry(11, 8.5, 9);
  const apt = new THREE.Mesh(aptGeo, materials.modernWhiteStucco);
  apt.position.y = 4.4;
  apt.castShadow = true;
  apt.receiveShadow = true;
  apt.userData = { isBuilding: true, buildingId: 'modern-apartments' };
  clickableBuildings.push(apt);
  aptGroup.add(apt);

  // Staggered Wood Balcony Insets with Glass Balustrades
  for (let floor = 0; floor < 2; floor++) {
    const balGeo = new THREE.BoxGeometry(4.0, 0.15, 1.4);
    const bal = new THREE.Mesh(balGeo, materials.modernWoodSiding);
    bal.position.set(-2.0, 2.9 + floor * 2.8, 4.8);
    bal.castShadow = true;
    aptGroup.add(bal);

    const balRailGeo = new THREE.BoxGeometry(4.0, 0.8, 0.1);
    const balRail = new THREE.Mesh(balRailGeo, materials.glassWindowDay);
    balRail.position.set(-2.0, 3.35 + floor * 2.8, 5.45);
    aptGroup.add(balRail);
  }

  // Apartment Glazed Lobby Entrance
  const lobbyGeo = new THREE.BoxGeometry(3.6, 2.4, 0.2);
  const lobby = new THREE.Mesh(lobbyGeo, materials.glassWindowDay);
  lobby.position.set(2.0, 1.35, 4.55);
  aptGroup.add(lobby);

  // Penthouse Top Accent with Rooftop Garden
  const pentGeo = new THREE.BoxGeometry(7, 2.2, 6);
  const pent = new THREE.Mesh(pentGeo, materials.modernDarkSlate);
  pent.position.set(0, 9.65, 0);
  pent.castShadow = true;
  aptGroup.add(pent);

  resGroup.add(aptGroup);

  // ========================================================
  // Contemporary Terraced Townhouses Row - CLICKABLE
  // Placed North of North Lane (World: -30, 71)
  // ========================================================
  const thGroup = new THREE.Group();
  thGroup.position.set(-30, 0, 71);

  const thPlinth = new THREE.Mesh(new THREE.BoxGeometry(15.6, 0.3, 7.6), materials.concreteCurbs);
  thPlinth.position.y = 0.15;
  thPlinth.receiveShadow = true;
  thGroup.add(thPlinth);

  // 3 Staggered Townhouse Units
  for (let u = 0; u < 3; u++) {
    const ux = (u - 1) * 4.8;
    const isCenter = u === 1;
    const bodyMat = isCenter ? materials.modernWoodSiding : materials.modernDarkSlate;

    const unitGeo = new THREE.BoxGeometry(4.4, 6.2, 7.0);
    const unitMesh = new THREE.Mesh(unitGeo, bodyMat);
    unitMesh.position.set(ux, 3.25, 0);
    unitMesh.castShadow = true;
    unitMesh.receiveShadow = true;
    unitMesh.userData = { isBuilding: true, buildingId: 'townhouse-row' };
    clickableBuildings.push(unitMesh);
    thGroup.add(unitMesh);

    // Front Stoop Steps
    const stoop = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 1.2), materials.concreteCurbs);
    stoop.position.set(ux - 1.0, 0.2, 3.8);
    thGroup.add(stoop);

    // Front Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.0, 0.1), materials.doorWood);
    door.position.set(ux - 1.0, 1.4, 3.52);
    thGroup.add(door);

    // Second Floor Picture Window
    const win = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.15), materials.glassWindowDay);
    win.position.set(ux, 4.4, 3.52);
    thGroup.add(win);

    // Rooftop Timber Pergola
    const pergola = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.15, 3.0), materials.modernWoodSiding);
    pergola.position.set(ux, 6.6, 0.5);
    thGroup.add(pergola);
  }

  resGroup.add(thGroup);

  group.add(resGroup);
}

// -----------------------------------------------------------------------------
// 3. BEAUTIFUL CENTRAL PARK & GRAND FOUNTAIN
// -----------------------------------------------------------------------------
function createCentralPark(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary
) {
  const parkGroup = new THREE.Group();
  parkGroup.position.set(20, 0, -14);

  // Expansive Park Lawn with Sculpted Perimeter (strictly north of East Boulevard [Z >= -4.4])
  // parkGroup at (20, 0, -14) + lawn (26 x 15) -> World X in [7, 33], World Z in [-21.5, -6.5]
  const lawnGeo = new THREE.BoxGeometry(26, 0.15, 15);
  const lawn = new THREE.Mesh(lawnGeo, materials.parkLawnMaterial);
  lawn.position.y = 0.08;
  lawn.receiveShadow = true;
  parkGroup.add(lawn);

  // Winding Gravel Walking Paths across the park
  const path1Geo = new THREE.PlaneGeometry(24, 2.4);
  path1Geo.rotateX(-Math.PI / 2);
  const path1 = new THREE.Mesh(path1Geo, materials.gravelPathMaterial);
  path1.position.set(0, 0.16, 0);
  path1.receiveShadow = true;
  parkGroup.add(path1);

  const path2Geo = new THREE.PlaneGeometry(2.4, 13);
  path2Geo.rotateX(-Math.PI / 2);
  const path2 = new THREE.Mesh(path2Geo, materials.gravelPathMaterial);
  path2.position.set(0, 0.16, 0);
  path2.receiveShadow = true;
  parkGroup.add(path2);

  // 1. Grand Multi-Tiered Central Water Fountain
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0.15, 0);

  // Outer Stone Basin
  const basin1Geo = new THREE.CylinderGeometry(4.2, 4.5, 0.6, 32);
  const basin1 = new THREE.Mesh(basin1Geo, materials.modernDarkSlate);
  basin1.position.y = 0.3;
  basin1.castShadow = true;
  basin1.receiveShadow = true;
  fountainGroup.add(basin1);

  // Outer Basin Water
  const waterGeo = new THREE.CylinderGeometry(3.9, 3.9, 0.1, 32);
  const fountainWater = new THREE.Mesh(waterGeo, materials.lakeWaterMaterial);
  fountainWater.position.y = 0.55;
  fountainGroup.add(fountainWater);

  // Tier 2 Center Pedestal
  const pedGeo = new THREE.CylinderGeometry(1.2, 1.5, 1.4, 20);
  const ped = new THREE.Mesh(pedGeo, materials.modernDarkSlate);
  ped.position.y = 1.0;
  ped.castShadow = true;
  fountainGroup.add(ped);

  // Tier 2 Upper Basin
  const basin2Geo = new THREE.CylinderGeometry(2.2, 2.5, 0.4, 28);
  const basin2 = new THREE.Mesh(basin2Geo, materials.modernWhiteStucco);
  basin2.position.y = 1.8;
  basin2.castShadow = true;
  fountainGroup.add(basin2);

  // Fountain Jet Spout (Animated)
  const spoutGeo = new THREE.ConeGeometry(0.3, 1.4, 16);
  const fountainSpout = new THREE.Mesh(spoutGeo, materials.lakeWaterMaterial);
  fountainSpout.position.y = 2.5;
  fountainGroup.add(fountainSpout);

  parkGroup.add(fountainGroup);

  // 2. Classic Gazebo Pavilion with Columns & Copper Roof - CLICKABLE
  const gazeboGroup = new THREE.Group();
  gazeboGroup.position.set(-7, 0.15, 0);

  // Gazebo Base Dais
  const gBaseGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.35, 8);
  const gBase = new THREE.Mesh(gBaseGeo, materials.modernWhiteStucco);
  gBase.position.y = 0.18;
  gBase.castShadow = true;
  gBase.userData = { isBuilding: true, buildingId: 'park-gazebo' };
  clickableBuildings.push(gBase);
  gazeboGroup.add(gBase);

  // 8 Perimeter Columns
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const colGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.6, 12);
    const col = new THREE.Mesh(colGeo, materials.modernWhiteStucco);
    col.position.set(Math.cos(ang) * 2.7, 1.5, Math.sin(ang) * 2.7);
    col.castShadow = true;
    gazeboGroup.add(col);
  }

  // Gazebo Octagonal Roof - CLICKABLE
  const gRoofGeo = new THREE.ConeGeometry(3.6, 2.0, 8);
  const gRoof = new THREE.Mesh(gRoofGeo, materials.roofTileTerracotta);
  gRoof.position.y = 3.6;
  gRoof.castShadow = true;
  gRoof.userData = { isBuilding: true, buildingId: 'park-gazebo' };
  clickableBuildings.push(gRoof);
  gazeboGroup.add(gRoof);

  parkGroup.add(gazeboGroup);

  // 3. Children's Adventure Playground
  const playGroup = new THREE.Group();
  playGroup.position.set(7, 0.15, 0);

  // Playground Sandpit with Timber Edge
  const sandGeo = new THREE.BoxGeometry(6.5, 0.2, 5.5);
  const sand = new THREE.Mesh(sandGeo, materials.gravelPathMaterial);
  sand.position.y = 0.1;
  playGroup.add(sand);

  const sandBorder = new THREE.Mesh(new THREE.BoxGeometry(6.7, 0.28, 5.7), materials.modernWoodSiding);
  sandBorder.position.y = 0.12;
  playGroup.add(sandBorder);

  // Playground Slide Tower
  const towerGeo = new THREE.BoxGeometry(1.6, 2.8, 1.6);
  const playTower = new THREE.Mesh(towerGeo, materials.modernWoodSiding);
  playTower.position.set(-1.8, 1.4, 0);
  playTower.castShadow = true;
  playGroup.add(playTower);

  // Slide Chute
  const slideGeo = new THREE.BoxGeometry(1.0, 0.1, 3.2);
  const slide = new THREE.Mesh(slideGeo, materials.carPaintBlue);
  slide.position.set(-1.8, 1.1, 1.8);
  slide.rotation.x = 0.55;
  slide.castShadow = true;
  playGroup.add(slide);

  // Swing Set Frame with animated swing
  const swingFrameGeo = new THREE.BoxGeometry(0.12, 2.4, 0.12);
  const leg1 = new THREE.Mesh(swingFrameGeo, materials.carPaintRed);
  leg1.position.set(1.5, 1.2, -1.2);
  leg1.rotation.z = -0.18;
  playGroup.add(leg1);

  const leg2 = new THREE.Mesh(swingFrameGeo, materials.carPaintRed);
  leg2.position.set(3.2, 1.2, -1.2);
  leg2.rotation.z = 0.18;
  playGroup.add(leg2);

  const topBarGeo = new THREE.BoxGeometry(2.8, 0.12, 0.12);
  const topBar = new THREE.Mesh(topBarGeo, materials.carPaintRed);
  topBar.position.set(2.35, 2.3, -1.2);
  playGroup.add(topBar);

  const playgroundSwing = new THREE.Group();
  playgroundSwing.position.set(2.35, 2.3, -1.2);
  const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.5, 6);
  const r1 = new THREE.Mesh(ropeGeo, materials.metalSteel);
  r1.position.set(-0.35, -0.75, 0);
  playgroundSwing.add(r1);

  const r2 = new THREE.Mesh(ropeGeo, materials.metalSteel);
  r2.position.set(0.35, -0.75, 0);
  playgroundSwing.add(r2);

  const seatGeo = new THREE.BoxGeometry(0.9, 0.08, 0.35);
  const seat = new THREE.Mesh(seatGeo, materials.modernWoodSiding);
  seat.position.set(0, -1.5, 0);
  playgroundSwing.add(seat);

  playGroup.add(playgroundSwing);

  // 4. Animated Children's Seesaw
  const seesawGroup = new THREE.Group();
  seesawGroup.position.set(0.2, 0, 2.0);

  // Fulcrum support bracket
  const fulcrumGeo = new THREE.ConeGeometry(0.35, 0.7, 4);
  fulcrumGeo.rotateY(Math.PI / 4);
  const fulcrum = new THREE.Mesh(fulcrumGeo, materials.metalBlack);
  fulcrum.position.y = 0.35;
  fulcrum.castShadow = true;
  seesawGroup.add(fulcrum);

  // Pivot axle pin
  const axlePin = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 8), materials.metalSteel);
  axlePin.rotation.x = Math.PI / 2;
  axlePin.position.y = 0.65;
  seesawGroup.add(axlePin);

  // Tilting plank group (animated)
  const playgroundSeesaw = new THREE.Group();
  playgroundSeesaw.position.y = 0.65;

  const beamGeo = new THREE.BoxGeometry(3.6, 0.08, 0.3);
  const beam = new THREE.Mesh(beamGeo, materials.modernWoodSiding);
  beam.castShadow = true;
  playgroundSeesaw.add(beam);

  // Seats on ends
  const seatBlue = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.32), materials.carPaintBlue);
  seatBlue.position.set(-1.45, 0.05, 0);
  playgroundSeesaw.add(seatBlue);

  const seatRed = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.06, 0.32), materials.carPaintRed);
  seatRed.position.set(1.45, 0.05, 0);
  playgroundSeesaw.add(seatRed);

  // Safety handlebars
  for (const hx of [-1.25, 1.25]) {
    const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), materials.kayakYellow);
    bar.position.set(hx, 0.2, 0);
    playgroundSeesaw.add(bar);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.22), materials.metalBlack);
    grip.position.set(hx, 0.36, 0);
    playgroundSeesaw.add(grip);
  }

  // Rubber bumper end dampeners
  for (const bx of [-1.7, 1.7]) {
    const bumper = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.08, 0.16), materials.carTireRubber);
    bumper.position.set(bx, -0.06, 0);
    playgroundSeesaw.add(bumper);
  }

  seesawGroup.add(playgroundSeesaw);
  playGroup.add(seesawGroup);

  // 5. Geodesic Children's Climbing Dome
  const domeGroup = new THREE.Group();
  domeGroup.position.set(-3.6, 0, -1.4);

  // Colorful climbing dome tiers
  const tierColors = [materials.carPaintRed, materials.carPaintBlue, materials.kayakYellow, materials.carPaintEmerald];
  for (let ring = 0; ring < 3; ring++) {
    const ringRad = 1.6 - ring * 0.45;
    const ringY = 0.35 + ring * 0.45;
    const ringMat = tierColors[ring % tierColors.length];

    const hoop = new THREE.Mesh(new THREE.TorusGeometry(ringRad, 0.035, 6, 16), ringMat);
    hoop.rotation.x = Math.PI / 2;
    hoop.position.y = ringY;
    domeGroup.add(hoop);

    // Cross connecting struts
    for (let c = 0; c < 6; c++) {
      const ang = (c / 6) * Math.PI * 2;
      const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.52, 6), ringMat);
      strut.position.set(Math.cos(ang) * (ringRad - 0.18), ringY + 0.24, Math.sin(ang) * (ringRad - 0.18));
      strut.rotation.z = Math.cos(ang) * 0.45;
      strut.rotation.x = Math.sin(ang) * 0.45;
      domeGroup.add(strut);
    }
  }
  playGroup.add(domeGroup);

  // 6. Playground Spring Rockers (Duck & Pony)
  const rockerConfigs = [
    { x: -3.4, z: 1.8, col: materials.kayakYellow, type: 'duck' },
    { x: 3.4, z: 1.8, col: materials.carPaintBlue, type: 'pony' },
  ];

  rockerConfigs.forEach((rc) => {
    const rockGroup = new THREE.Group();
    rockGroup.position.set(rc.x, 0, rc.z);

    // Heavy steel ground spring
    const spring = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.45, 8), materials.metalSteel);
    spring.position.y = 0.225;
    rockGroup.add(spring);

    // Molded animal silhouette body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.24), rc.col);
    body.position.y = 0.65;
    body.castShadow = true;
    rockGroup.add(body);

    // Head
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.28, 0.22), rc.col);
    head.position.set(0.3, 0.95, 0);
    rockGroup.add(head);

    // Handlebar & footrests
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), materials.metalBlack);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.25, 0.9, 0);
    rockGroup.add(handle);

    const footpeg = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.36, 6), materials.metalSteel);
    footpeg.rotation.x = Math.PI / 2;
    footpeg.position.set(0.1, 0.45, 0);
    rockGroup.add(footpeg);

    playGroup.add(rockGroup);
  });

  parkGroup.add(playGroup);

  // ========================================================
  // Tartan Red Running & Jogging Track Loop around Central Park
  // ========================================================
  const trackMat = materials.sportCourtOrange;
  const trackWidth = 1.4;
  const trackElev = 0.165;

  // North track segment
  const nTrack = new THREE.Mesh(new THREE.PlaneGeometry(22.0, trackWidth), trackMat);
  nTrack.rotateX(-Math.PI / 2);
  nTrack.position.set(0, trackElev, -6.0);
  nTrack.receiveShadow = true;
  parkGroup.add(nTrack);

  // South track segment
  const sTrack = new THREE.Mesh(new THREE.PlaneGeometry(22.0, trackWidth), trackMat);
  sTrack.rotateX(-Math.PI / 2);
  sTrack.position.set(0, trackElev, 6.0);
  sTrack.receiveShadow = true;
  parkGroup.add(sTrack);

  // West track segment
  const wTrack = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth, 12.0), trackMat);
  wTrack.rotateX(-Math.PI / 2);
  wTrack.position.set(-11.0, trackElev, 0);
  wTrack.receiveShadow = true;
  parkGroup.add(wTrack);

  // East track segment
  const eTrack = new THREE.Mesh(new THREE.PlaneGeometry(trackWidth, 12.0), trackMat);
  eTrack.rotateX(-Math.PI / 2);
  eTrack.position.set(11.0, trackElev, 0);
  eTrack.receiveShadow = true;
  parkGroup.add(eTrack);

  // Dashed lane divider lines
  const lineMat = materials.roadMarkingWhite;
  for (let lx = -9; lx <= 9; lx += 3) {
    const dashN = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.08), lineMat);
    dashN.rotateX(-Math.PI / 2);
    dashN.position.set(lx, trackElev + 0.005, -6.0);
    parkGroup.add(dashN);

    const dashS = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.08), lineMat);
    dashS.rotateX(-Math.PI / 2);
    dashS.position.set(lx, trackElev + 0.005, 6.0);
    parkGroup.add(dashS);
  }

  // ========================================================
  // Timber Pergola Picnic Shelter & Stone Barbecue Hearth
  // ========================================================
  const picnicShelterGroup = new THREE.Group();
  picnicShelterGroup.position.set(-5, 0.15, -4);

  // Foundation flagstone dais
  const shelterFloor = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.16, 4.8), materials.concreteCurbs);
  shelterFloor.position.y = 0.08;
  shelterFloor.receiveShadow = true;
  picnicShelterGroup.add(shelterFloor);

  // 4 Robust timber posts
  const postCoords = [
    { x: -3.6, z: -2.6 },
    { x: 3.6, z: -2.6 },
    { x: -3.6, z: 2.6 },
    { x: 3.6, z: 2.6 },
  ];
  postCoords.forEach((pc) => {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.24, 2.8, 0.24), materials.modernWoodSiding);
    post.position.set(pc.x, 1.4, pc.z);
    post.castShadow = true;
    picnicShelterGroup.add(post);
  });

  // Longitudinal pergola rafters
  for (let rz = -2.6; rz <= 2.6; rz += 1.3) {
    const rafter = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.2, 0.16), materials.modernWoodSiding);
    rafter.position.set(0, 2.9, rz);
    rafter.castShadow = true;
    picnicShelterGroup.add(rafter);
  }

  // Transverse slatted sunshade purlins
  for (let rx = -3.8; rx <= 3.8; rx += 0.8) {
    const purlin = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 6.4), materials.modernWoodSiding);
    purlin.position.set(rx, 3.05, 0);
    purlin.castShadow = true;
    picnicShelterGroup.add(purlin);
  }

  // 2 Solid timber picnic tables with benches
  for (const tz of [-1.3, 1.3]) {
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.08, 0.85), materials.timberBench);
    tableTop.position.set(0, 0.72, tz);
    tableTop.castShadow = true;
    picnicShelterGroup.add(tableTop);

    for (const bz of [-0.65, 0.65]) {
      const bench = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.32), materials.timberBench);
      bench.position.set(0, 0.44, tz + bz);
      bench.castShadow = true;
      picnicShelterGroup.add(bench);
    }
  }

  // Masonry Stone Barbecue Grill Pit
  const bbqGeo = new THREE.BoxGeometry(1.4, 0.9, 1.1);
  const bbq = new THREE.Mesh(bbqGeo, materials.rockStoneMaterial);
  bbq.position.set(2.8, 0.45, 0);
  bbq.castShadow = true;
  picnicShelterGroup.add(bbq);

  // Blackened charcoal grill grate
  const grate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.04, 0.9), materials.metalBlack);
  grate.position.set(2.8, 0.92, 0);
  picnicShelterGroup.add(grate);

  // Smoke chimney stack
  const bbqChimney = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.8, 0.4), materials.rockStoneMaterial);
  bbqChimney.position.set(3.2, 1.8, 0);
  bbqChimney.castShadow = true;
  picnicShelterGroup.add(bbqChimney);

  parkGroup.add(picnicShelterGroup);

  // 4. Park Benches around paths
  const benchPositions = [
    { x: -5, z: 2.2, r: 0 },
    { x: 5, z: 2.2, r: 0 },
    { x: -5, z: -2.2, r: Math.PI },
    { x: 5, z: -2.2, r: Math.PI },
    { x: 2.2, z: 6, r: Math.PI / 2 },
    { x: -2.2, z: -6, r: -Math.PI / 2 },
  ];
  benchPositions.forEach((bp) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(bp.x, 0.24, bp.z);
    bGroup.rotation.y = bp.r;

    const bSeatGeo = new THREE.BoxGeometry(1.6, 0.08, 0.45);
    const bSeat = new THREE.Mesh(bSeatGeo, materials.timberBench);
    bSeat.position.y = 0.45;
    bSeat.castShadow = true;
    bGroup.add(bSeat);

    const bBackGeo = new THREE.BoxGeometry(1.6, 0.45, 0.08);
    const bBack = new THREE.Mesh(bBackGeo, materials.timberBench);
    bBack.position.set(0, 0.72, -0.2);
    bGroup.add(bBack);

    for (const lx of [-0.65, 0.65]) {
      const bLegGeo = new THREE.BoxGeometry(0.08, 0.45, 0.45);
      const bLeg = new THREE.Mesh(bLegGeo, materials.metalBlack);
      bLeg.position.set(lx, 0.225, 0);
      bGroup.add(bLeg);
    }
    parkGroup.add(bGroup);
  });

  // ========================================================
  // 5. Central Park Multi-Sport & Basketball Court - CLICKABLE
  // World pos: (32, 0, -14) -> parkGroup relative (10, 0.22, -8)
  // ========================================================
  const courtGroup = new THREE.Group();
  courtGroup.position.set(4, 0.22, 0);

  // Shock-absorbing polymer court surface
  const courtPlinth = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.15, 12.6), materials.concreteCurbs);
  courtPlinth.position.y = 0.075;
  courtGroup.add(courtPlinth);

  const courtFloor = new THREE.Mesh(new THREE.BoxGeometry(14.0, 0.18, 12.0), materials.sportCourtBlue);
  courtFloor.position.y = 0.09;
  courtFloor.receiveShadow = true;
  courtFloor.userData = { isBuilding: true, buildingId: 'sports-court' };
  clickableBuildings.push(courtFloor);
  courtGroup.add(courtFloor);

  // Key Area / Paint (Orange)
  const keyArea = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.19, 5.0), materials.sportCourtOrange);
  keyArea.position.set(4.4, 0.095, 0);
  courtGroup.add(keyArea);

  // White Court Line Markings
  const halfLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 11.6), materials.roadMarkingWhite);
  halfLine.position.set(-2.0, 0.1, 0);
  courtGroup.add(halfLine);

  // Basketball Hoop Post, Backboard & Ring
  const hoopGroup = new THREE.Group();
  hoopGroup.position.set(6.4, 0, 0);

  const hoopPole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 3.8, 8), materials.metalBlack);
  hoopPole.position.y = 1.9;
  hoopPole.castShadow = true;
  hoopGroup.add(hoopPole);

  const backboard = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 1.6), materials.modernWhiteStucco);
  backboard.position.set(-0.35, 3.2, 0);
  backboard.castShadow = true;
  hoopGroup.add(backboard);

  const hoopRim = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.03, 8, 16), materials.sportCourtOrange);
  hoopRim.rotation.x = Math.PI / 2;
  hoopRim.position.set(-0.7, 3.0, 0);
  hoopGroup.add(hoopRim);

  courtGroup.add(hoopGroup);

  // Courtside Spectator Bleachers
  for (let row = 0; row < 2; row++) {
    const bleacher = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 0.45), materials.modernWoodSiding);
    bleacher.position.set(-1.0, 0.35 + row * 0.3, -5.5 - row * 0.45);
    bleacher.castShadow = true;
    courtGroup.add(bleacher);
  }

  parkGroup.add(courtGroup);

  group.add(parkGroup);

  return {
    fountainWater,
    fountainSpout,
    playgroundSwing,
    playgroundSeesaw,
  };
}

// -----------------------------------------------------------------------------
// 4. BOTANICAL GARDENS & MODERN GREENHOUSE
// -----------------------------------------------------------------------------
function createBotanicalGardens(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary
) {
  const gardenGroup = new THREE.Group();
  gardenGroup.position.set(30, 0, 37);

  // Garden Enclosure Perimeter Lawn (strictly east of botanical drive [X <= 17.2])
  const lawnGeo = new THREE.BoxGeometry(23, 0.16, 25);
  const lawn = new THREE.Mesh(lawnGeo, materials.parkLawnMaterial);
  lawn.position.y = 0.08;
  lawn.receiveShadow = true;
  gardenGroup.add(lawn);

  // 1. Modern Steel & Glass Conservatory Greenhouse - CLICKABLE
  const ghGroup = new THREE.Group();
  ghGroup.position.set(0, 0.22, -6);

  const ghWidth = 14;
  const ghLength = 9;
  const ghHeight = 4.8;

  // Concrete foundation base
  const ghBaseGeo = new THREE.BoxGeometry(ghWidth + 0.6, 0.6, ghLength + 0.6);
  const ghBase = new THREE.Mesh(ghBaseGeo, materials.modernWhiteStucco);
  ghBase.position.y = 0.3;
  ghBase.castShadow = true;
  ghGroup.add(ghBase);

  // Glass Wall Enclosure - CLICKABLE
  const ghWallsGeo = new THREE.BoxGeometry(ghWidth, ghHeight, ghLength);
  const ghWalls = new THREE.Mesh(ghWallsGeo, materials.greenhouseGlass);
  ghWalls.position.y = ghHeight * 0.5 + 0.6;
  ghWalls.castShadow = true;
  ghWalls.userData = { isBuilding: true, buildingId: 'botanical-conservatory' };
  clickableBuildings.push(ghWalls);
  ghGroup.add(ghWalls);

  // Architectural Steel Ribs
  for (let x = -ghWidth / 2; x <= ghWidth / 2; x += 2.8) {
    const ribGeo = new THREE.BoxGeometry(0.14, ghHeight + 1.2, ghLength + 0.2);
    const rib = new THREE.Mesh(ribGeo, materials.metalSteel);
    rib.position.set(x, (ghHeight + 1.2) * 0.5 + 0.6, 0);
    ghGroup.add(rib);
  }

  // Greenhouse Gable Glass Roof - CLICKABLE
  const roofGeo = new THREE.ConeGeometry(ghWidth * 0.6, 2.2, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roof = new THREE.Mesh(roofGeo, materials.greenhouseGlass);
  roof.position.set(0, ghHeight + 1.7, 0);
  roof.userData = { isBuilding: true, buildingId: 'botanical-conservatory' };
  clickableBuildings.push(roof);
  ghGroup.add(roof);

  // Interior Tropical Plants visible inside conservatory
  for (let px = -4; px <= 4; px += 2.8) {
    const palm = new THREE.Mesh(new THREE.DodecahedronGeometry(0.85, 0), materials.treeFoliageDarkGreen);
    palm.position.set(px, 1.6, (Math.random() - 0.5) * 4);
    ghGroup.add(palm);
  }

  gardenGroup.add(ghGroup);

  // 2. Parterre Geometric Flower Beds with Mulch and Stone Curbs
  const bedColors = [materials.flowerRed, materials.flowerLavender, materials.flowerYellow];
  const bedCoords = [
    { x: -9, z: 6 },
    { x: -3, z: 6 },
    { x: 3, z: 6 },
    { x: 9, z: 6 },
    { x: -6, z: 11 },
    { x: 6, z: 11 },
  ];

  bedCoords.forEach((bc, idx) => {
    // Stone Curb Border
    const curbGeo = new THREE.BoxGeometry(3.6, 0.28, 3.6);
    const curb = new THREE.Mesh(curbGeo, materials.concreteCurbs);
    curb.position.set(bc.x, 0.34, bc.z);
    curb.castShadow = true;
    gardenGroup.add(curb);

    // Dark Organic Mulch Bed
    const mulchGeo = new THREE.BoxGeometry(3.2, 0.1, 3.2);
    const mulch = new THREE.Mesh(mulchGeo, materials.flowerBedMulchMaterial);
    mulch.position.set(bc.x, 0.44, bc.z);
    gardenGroup.add(mulch);

    // Dense Flowers in Bed
    const flowerMat = bedColors[idx % bedColors.length];
    for (let fx = -1.2; fx <= 1.2; fx += 0.6) {
      for (let fz = -1.2; fz <= 1.2; fz += 0.6) {
        const blossomGeo = new THREE.DodecahedronGeometry(0.18, 0);
        const blossom = new THREE.Mesh(blossomGeo, flowerMat);
        blossom.position.set(bc.x + fx + (Math.random() - 0.5) * 0.15, 0.65, bc.z + fz + (Math.random() - 0.5) * 0.15);
        blossom.castShadow = true;
        gardenGroup.add(blossom);
      }
    }
  });

  // 3. Water Lily Pond with Floating Pads & Lotus Flowers
  const pondGroup = new THREE.Group();
  pondGroup.position.set(0, 0.22, 8.5);

  const pondBasinGeo = new THREE.CylinderGeometry(3.2, 3.4, 0.4, 24);
  const pondBasin = new THREE.Mesh(pondBasinGeo, materials.rockStoneMaterial);
  pondBasin.position.y = 0.2;
  pondBasin.castShadow = true;
  pondGroup.add(pondBasin);

  const pondWaterGeo = new THREE.CylinderGeometry(2.9, 2.9, 0.08, 24);
  const pondWater = new THREE.Mesh(pondWaterGeo, materials.lakeWaterMaterial);
  pondWater.position.y = 0.38;
  pondGroup.add(pondWater);

  // Floating Lily Pads & Lotus Blossoms
  for (let i = 0; i < 7; i++) {
    const ang = (i / 7) * Math.PI * 2;
    const px = Math.cos(ang) * 1.6;
    const pz = Math.sin(ang) * 1.6;

    const padGeo = new THREE.CircleGeometry(0.36, 12);
    padGeo.rotateX(-Math.PI / 2);
    const pad = new THREE.Mesh(padGeo, materials.waterLilyMaterial);
    pad.position.set(px, 0.43, pz);
    pondGroup.add(pad);

    if (i % 2 === 0) {
      const lotusGeo = new THREE.ConeGeometry(0.12, 0.16, 6);
      const lotus = new THREE.Mesh(lotusGeo, materials.lotusBlossomMaterial);
      lotus.position.set(px, 0.52, pz);
      pondGroup.add(lotus);
    }
  }

  gardenGroup.add(pondGroup);

  // 4. Sculpted Topiary Hedges (Spheres and Cones)
  for (let tx = -12; tx <= 12; tx += 6) {
    if (Math.abs(tx) > 2) {
      const topiaryConeGeo = new THREE.ConeGeometry(0.85, 2.2, 16);
      const topiary = new THREE.Mesh(topiaryConeGeo, materials.hedgeBoxwood);
      topiary.position.set(tx, 1.3, -12);
      topiary.castShadow = true;
      gardenGroup.add(topiary);
    }
  }

  // 5. Labeled Plant Zone Wooden Signboards
  const zoneSignData = [
    { x: -8.5, z: 2.5, rot: 0.2, title: 'Zone A: Tropical Flora' },
    { x: 8.5, z: 2.5, rot: -0.2, title: 'Zone B: Alpine Conifers' },
    { x: -8.5, z: 13.5, rot: 0.1, title: 'Zone C: Aromatic Lavender' },
    { x: 8.5, z: 13.5, rot: -0.1, title: 'Zone D: Heritage Roses' },
  ];

  zoneSignData.forEach((zs) => {
    const sGroup = new THREE.Group();
    sGroup.position.set(zs.x, 0.22, zs.z);
    sGroup.rotation.y = zs.rot;

    // Rustic timber post
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.2, 8), materials.modernWoodSiding);
    post.position.y = 0.6;
    post.castShadow = true;
    sGroup.add(post);

    // Angled signboard plaque
    const plaque = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.45, 0.08), materials.timberBench);
    plaque.position.set(0, 1.15, 0.04);
    plaque.rotation.x = -0.25;
    plaque.castShadow = true;
    sGroup.add(plaque);

    // Inner bronze information plate
    const plate = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.32, 0.02), materials.metalBronze);
    plate.position.set(0, 1.15, 0.085);
    plate.rotation.x = -0.25;
    sGroup.add(plate);

    gardenGroup.add(sGroup);
  });

  // 6. Climbing Rose Trellis Arbors straddling garden walking paths
  for (const tz of [2.0, 12.5]) {
    const arborGroup = new THREE.Group();
    arborGroup.position.set(0, 0.22, tz);

    // 2 Upright timber trellis posts
    for (const ax of [-1.5, 1.5]) {
      const aPost = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.6, 0.14), materials.modernWoodSiding);
      aPost.position.set(ax, 1.3, 0);
      aPost.castShadow = true;
      arborGroup.add(aPost);

      // Trellis lattice rungs
      for (let ly = 0.4; ly <= 2.2; ly += 0.35) {
        const rung = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.6), materials.modernWoodSiding);
        rung.position.set(ax, ly, 0);
        arborGroup.add(rung);
      }
    }

    // Overhead curved trellis arch
    const arch = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 0.6), materials.modernWoodSiding);
    arch.position.set(0, 2.65, 0);
    arch.castShadow = true;
    arborGroup.add(arch);

    // Climbing Ivy Vines & Rose Blossoms
    for (let c = 0; c < 12; c++) {
      const vx = (Math.random() - 0.5) * 3.0;
      const vy = 1.0 + Math.random() * 1.6;
      const vz = (Math.random() - 0.5) * 0.4;

      const vineCluster = new THREE.Mesh(new THREE.DodecahedronGeometry(0.18, 0), materials.hedgeBoxwood);
      vineCluster.position.set(vx, vy, vz);
      arborGroup.add(vineCluster);

      if (c % 2 === 0) {
        const roseMat = c % 4 === 0 ? materials.flowerRed : materials.treeFoliageFloweringPink;
        const rose = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), roseMat);
        rose.position.set(vx, vy + 0.1, vz + 0.1);
        arborGroup.add(rose);
      }
    }

    gardenGroup.add(arborGroup);
  }

  group.add(gardenGroup);
}

// -----------------------------------------------------------------------------
// 4b. 3D CREATOR PAVILION (STUDIO OF SHAHANUR MOLLAH)
// -----------------------------------------------------------------------------
function createCreatorPavilion(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary,
  foliageGroup: THREE.Group
): CreatorPavilionInteriorResult {
  const pavilionGroup = new THREE.Group();
  // Situated in Modern Village garden zone, safely clear of Botanical Drive (X <= 17.2) and East Boulevard (Z <= 4.4)
  pavilionGroup.position.set(27.5, 0, 15.0);
  pavilionGroup.name = 'creator-pavilion';

  // --- Specialized Turquoise & Cyan Architectural Materials ---
  const turquoiseNeonMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    transparent: true,
    opacity: 0.95,
  });

  const cyanGlowMat = new THREE.MeshBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.9,
  });

  const glassCurtainMat = new THREE.MeshStandardMaterial({
    color: 0xccfbf1,
    transparent: true,
    opacity: 0.38,
    roughness: 0.05,
    metalness: 0.15,
    depthWrite: false,
  });

  // 1. Sleek Landscaped Garden Terrace Dais (Width 11m, Depth 10m, Height 0.22m)
  const terraceGeo = new THREE.BoxGeometry(11.0, 0.22, 10.0);
  const terrace = new THREE.Mesh(terraceGeo, materials.capitalGranite);
  terrace.position.y = 0.11;
  terrace.receiveShadow = true;
  pavilionGroup.add(terrace);

  // Recessed perimeter turquoise neon strip along terrace edges
  const edgeWidth = 11.1;
  const edgeDepth = 10.1;
  const edgeThickness = 0.04;
  const stripGeoN = new THREE.BoxGeometry(edgeWidth, edgeThickness, 0.05);
  const stripN = new THREE.Mesh(stripGeoN, turquoiseNeonMat);
  stripN.position.set(0, 0.22, -edgeDepth / 2);
  pavilionGroup.add(stripN);

  const stripS = new THREE.Mesh(stripGeoN, turquoiseNeonMat);
  stripS.position.set(0, 0.22, edgeDepth / 2);
  pavilionGroup.add(stripS);

  const stripGeoE = new THREE.BoxGeometry(0.05, edgeThickness, edgeDepth);
  const stripE = new THREE.Mesh(stripGeoE, turquoiseNeonMat);
  stripE.position.set(edgeWidth / 2, 0.22, 0);
  pavilionGroup.add(stripE);

  // Low-profile entrance steps facing west towards Botanical Drive
  const stepGeo1 = new THREE.BoxGeometry(0.8, 0.11, 4.0);
  const step1 = new THREE.Mesh(stepGeo1, materials.concreteCurbs);
  step1.position.set(-5.8, 0.055, 0);
  step1.receiveShadow = true;
  pavilionGroup.add(step1);

  // Paved flagstone walkway connecting steps westwards
  const walkGeo = new THREE.BoxGeometry(2.4, 0.04, 2.8);
  const walk = new THREE.Mesh(walkGeo, materials.plazaPaverMaterial);
  walk.position.set(-7.4, 0.02, 0);
  walk.receiveShadow = true;
  pavilionGroup.add(walk);

  // 2. Main Glass Pavilion Building (Width 8.0m, Depth 7.0m, Height 4.2m)
  const bWidth = 8.0;
  const bDepth = 7.0;
  const bHeight = 4.2;

  // Modern Basalt Foundation Plinth
  const plinthGeo = new THREE.BoxGeometry(bWidth + 0.3, 0.24, bDepth + 0.3);
  const plinth = new THREE.Mesh(plinthGeo, materials.modernDarkSlate);
  plinth.position.y = 0.22 + 0.12;
  plinth.castShadow = true;
  plinth.receiveShadow = true;
  pavilionGroup.add(plinth);

  // Four Slender Architectural White Corner Columns
  const colSize = 0.32;
  const colY = 0.34 + bHeight / 2;
  const colGeo = new THREE.BoxGeometry(colSize, bHeight, colSize);
  const colPositions = [
    { x: -bWidth / 2 + colSize / 2, z: -bDepth / 2 + colSize / 2 },
    { x: bWidth / 2 - colSize / 2, z: -bDepth / 2 + colSize / 2 },
    { x: -bWidth / 2 + colSize / 2, z: bDepth / 2 - colSize / 2 },
    { x: bWidth / 2 - colSize / 2, z: bDepth / 2 - colSize / 2 },
  ];
  colPositions.forEach((pos) => {
    const col = new THREE.Mesh(colGeo, materials.modernWhiteStucco);
    col.position.set(pos.x, colY, pos.z);
    col.castShadow = true;
    pavilionGroup.add(col);
  });

  // Floor-to-Ceiling Transparent Glass Curtain Walls
  // North Wall
  const wallGeoNZ = new THREE.BoxGeometry(bWidth - colSize * 2, bHeight - 0.1, 0.08);
  const wallN = new THREE.Mesh(wallGeoNZ, glassCurtainMat);
  wallN.position.set(0, colY, -bDepth / 2 + 0.05);
  wallN.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(wallN);
  pavilionGroup.add(wallN);

  // South Wall
  const wallS = new THREE.Mesh(wallGeoNZ, glassCurtainMat);
  wallS.position.set(0, colY, bDepth / 2 - 0.05);
  wallS.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(wallS);
  pavilionGroup.add(wallS);

  // East Wall
  const wallGeoE = new THREE.BoxGeometry(0.08, bHeight - 0.1, bDepth - colSize * 2);
  const wallE = new THREE.Mesh(wallGeoE, glassCurtainMat);
  wallE.position.set(bWidth / 2 - 0.05, colY, 0);
  wallE.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(wallE);
  pavilionGroup.add(wallE);

  // West Wall (Entrance Facade with Framed Glass Double Doors)
  const doorOpeningWidth = 2.4;
  const sideWallWidth = (bWidth - colSize * 2 - doorOpeningWidth) / 2;
  const wallGeoW = new THREE.BoxGeometry(0.08, bHeight - 0.1, sideWallWidth);
  const wallW1 = new THREE.Mesh(wallGeoW, glassCurtainMat);
  wallW1.position.set(-bWidth / 2 + 0.05, colY, -bDepth / 2 + sideWallWidth / 2 + colSize);
  wallW1.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(wallW1);
  pavilionGroup.add(wallW1);

  const wallW2 = new THREE.Mesh(wallGeoW, glassCurtainMat);
  wallW2.position.set(-bWidth / 2 + 0.05, colY, bDepth / 2 - sideWallWidth / 2 - colSize);
  wallW2.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(wallW2);
  pavilionGroup.add(wallW2);

  // Note: Entrance doorway (width 2.4m) is fitted with automatic sliding double glass doors inside interior architecture

  // 3. Cantilevered Dark Slate Floating Roof (Projecting 0.6m beyond walls)
  const roofWidth = bWidth + 1.2;
  const roofDepth = bDepth + 1.2;
  const roofThickness = 0.35;
  const roofY = 0.34 + bHeight + roofThickness / 2;

  const roofGeo = new THREE.BoxGeometry(roofWidth, roofThickness, roofDepth);
  const roof = new THREE.Mesh(roofGeo, materials.capitalDarkSteel);
  roof.position.set(0, roofY, 0);
  roof.castShadow = true;
  roof.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(roof);
  pavilionGroup.add(roof);

  // Under-eaves turquoise neon perimeter accent cove
  const underCoveGeoX = new THREE.BoxGeometry(roofWidth - 0.1, 0.04, 0.05);
  const underCoveN = new THREE.Mesh(underCoveGeoX, turquoiseNeonMat);
  underCoveN.position.set(0, roofY - roofThickness / 2 - 0.02, -roofDepth / 2 + 0.1);
  pavilionGroup.add(underCoveN);

  const underCoveS = new THREE.Mesh(underCoveGeoX, turquoiseNeonMat);
  underCoveS.position.set(0, roofY - roofThickness / 2 - 0.02, roofDepth / 2 - 0.1);
  pavilionGroup.add(underCoveS);

  const underCoveGeoZ = new THREE.BoxGeometry(0.05, 0.04, roofDepth - 0.1);
  const underCoveW = new THREE.Mesh(underCoveGeoZ, turquoiseNeonMat);
  underCoveW.position.set(-roofWidth / 2 + 0.1, roofY - roofThickness / 2 - 0.02, 0);
  pavilionGroup.add(underCoveW);

  const underCoveE = new THREE.Mesh(underCoveGeoZ, turquoiseNeonMat);
  underCoveE.position.set(roofWidth / 2 - 0.1, roofY - roofThickness / 2 - 0.02, 0);
  pavilionGroup.add(underCoveE);

  // 4. Interior Studio Lighting & Glowing Ceiling Cove
  const ceilingCoveGeo = new THREE.BoxGeometry(bWidth - 1.2, 0.04, bDepth - 1.2);
  const ceilingCove = new THREE.Mesh(ceilingCoveGeo, cyanGlowMat);
  ceilingCove.position.set(0, roofY - roofThickness / 2 - 0.04, 0);
  pavilionGroup.add(ceilingCove);

  // Architectural interior studio PointLight casting warm cyan luminescence
  const studioLight = new THREE.PointLight(0x2dd4bf, 2.2, 14);
  studioLight.position.set(0, roofY - 0.5, 0);
  pavilionGroup.add(studioLight);

  // 5. Illuminated "Creator" Sign above West Entrance Facade
  const signBackGeo = new THREE.BoxGeometry(0.1, 0.65, 3.2);
  const signBack = new THREE.Mesh(signBackGeo, materials.modernDarkSlate);
  signBack.position.set(-bWidth / 2 - 0.1, colY + 1.25, 0);
  signBack.castShadow = true;
  pavilionGroup.add(signBack);

  // Procedural Canvas Texture for Illuminated Sign
  const signCanvas = document.createElement('canvas');
  signCanvas.width = 512;
  signCanvas.height = 128;
  const sCtx = signCanvas.getContext('2d');
  if (sCtx) {
    sCtx.fillStyle = '#06161b';
    sCtx.fillRect(0, 0, 512, 128);
    sCtx.strokeStyle = '#2dd4bf';
    sCtx.lineWidth = 6;
    sCtx.strokeRect(6, 6, 500, 116);
    sCtx.strokeStyle = '#0d9488';
    sCtx.lineWidth = 2;
    sCtx.strokeRect(12, 12, 488, 104);

    sCtx.fillStyle = '#f0fdfa';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.textBaseline = 'middle';
    sCtx.fillText('CREATOR STUDIO', 256, 44);

    sCtx.fillStyle = '#2dd4bf';
    sCtx.font = 'bold 20px monospace';
    sCtx.fillText('SHAHANUR MOLLAH', 256, 86);
  }
  const signTex = new THREE.CanvasTexture(signCanvas);
  signTex.colorSpace = THREE.SRGBColorSpace;
  const signPlaqueMat = new THREE.MeshBasicMaterial({ map: signTex });

  const signFaceGeo = new THREE.PlaneGeometry(3.1, 0.6);
  signFaceGeo.rotateY(-Math.PI / 2);
  const signFace = new THREE.Mesh(signFaceGeo, signPlaqueMat);
  signFace.position.set(-bWidth / 2 - 0.16, colY + 1.25, 0);
  signFace.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(signFace);
  pavilionGroup.add(signFace);

  // Top & bottom neon trim on sign
  const signTrimGeo = new THREE.BoxGeometry(0.06, 0.03, 3.24);
  const signTrimTop = new THREE.Mesh(signTrimGeo, turquoiseNeonMat);
  signTrimTop.position.set(-bWidth / 2 - 0.12, colY + 1.25 + 0.33, 0);
  pavilionGroup.add(signTrimTop);

  const signTrimBot = new THREE.Mesh(signTrimGeo, turquoiseNeonMat);
  signTrimBot.position.set(-bWidth / 2 - 0.12, colY + 1.25 - 0.33, 0);
  pavilionGroup.add(signTrimBot);

  // 6. Explorable Interior Architecture & 8 Dedicated Interactive Spaces
  // (Sliding Doors, Reception, Workstation Rig, Holographic Showcase, Dev Gallery, Shahanur Mollah Portrait, Relaxation Lounge, Rooftop Viewing Deck)
  const interiorResult = createCreatorPavilionInterior(materials, clickableBuildings);
  pavilionGroup.add(interiorResult.interiorGroup);

  // 7. Landscaped Garden, Pathway Bollards & Outdoor Seating
  // Contemporary timber slat garden benches
  const benchZOffsets = [-4.0, 4.0];
  benchZOffsets.forEach((bz) => {
    const bGroup = new THREE.Group();
    bGroup.position.set(0, 0.22, bz);

    const bSeat = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.08, 0.6), materials.timberBench);
    bSeat.position.y = 0.42;
    bSeat.castShadow = true;
    bGroup.add(bSeat);

    const bBack = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.45, 0.06), materials.timberBench);
    bBack.position.set(0, 0.68, bz > 0 ? 0.27 : -0.27);
    bBack.castShadow = true;
    bGroup.add(bBack);

    // Steel leg supports
    for (const lx of [-0.85, 0.85]) {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.56), materials.metalBlack);
      leg.position.set(lx, 0.21, 0);
      leg.castShadow = true;
      bGroup.add(leg);
    }
    pavilionGroup.add(bGroup);
  });

  // Sculpted modern geometric topiary boxwood hedges
  const topiaryCoords = [
    { x: -5.0, z: -3.4 },
    { x: -5.0, z: 3.4 },
    { x: 5.0, z: -3.4 },
    { x: 5.0, z: 3.4 },
  ];
  topiaryCoords.forEach((tc) => {
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.9, 0.9), materials.hedgeBoxwood);
    hedge.position.set(tc.x, 0.22 + 0.45, tc.z);
    hedge.castShadow = true;
    pavilionGroup.add(hedge);
  });

  // 4 Pathway Bollards with Glowing Turquoise Diffusers
  const bollardPositions = [
    { x: -6.4, z: -2.0 },
    { x: -6.4, z: 2.0 },
    { x: -8.0, z: -2.0 },
    { x: -8.0, z: 2.0 },
  ];
  bollardPositions.forEach((bp) => {
    const bollard = new THREE.Group();
    bollard.position.set(bp.x, 0, bp.z);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.8, 12), materials.metalBlack);
    post.position.y = 0.4;
    post.castShadow = true;
    bollard.add(post);

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.08, 12), turquoiseNeonMat);
    cap.position.y = 0.84;
    bollard.add(cap);

    pavilionGroup.add(bollard);
  });

  // 2 Ornamental Trees (Birch Tree & Flowering Pink Blossom Tree)
  const tree1 = new THREE.Group();
  tree1.position.set(-4.5, 0, -4.5);
  const trunk1 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.8, 8), materials.treeTrunkBirch);
  trunk1.position.y = 1.4;
  trunk1.castShadow = true;
  tree1.add(trunk1);
  const foliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), materials.treeFoliageLightGreen);
  foliage1.position.y = 3.2;
  foliage1.castShadow = true;
  tree1.add(foliage1);
  pavilionGroup.add(tree1);

  const tree2 = new THREE.Group();
  tree2.position.set(4.5, 0, 4.5);
  const trunk2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.6, 8), materials.treeTrunkBark);
  trunk2.position.y = 1.3;
  trunk2.castShadow = true;
  tree2.add(trunk2);
  const foliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), materials.treeFoliageFloweringPink);
  foliage2.position.y = 3.0;
  foliage2.castShadow = true;
  tree2.add(foliage2);
  pavilionGroup.add(tree2);

  // 8. Interactive Entrance Threshold Ring
  const threshRingGeo = new THREE.RingGeometry(1.0, 1.35, 32);
  threshRingGeo.rotateX(-Math.PI / 2);
  const threshRingMat = new THREE.MeshBasicMaterial({
    color: 0x2dd4bf,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.85,
  });
  const threshRing = new THREE.Mesh(threshRingGeo, threshRingMat);
  threshRing.position.set(-5.8, 0.12, 0);
  threshRing.userData = { isBuilding: true, buildingId: 'creator-pavilion' };
  clickableBuildings.push(threshRing);
  pavilionGroup.add(threshRing);

  group.add(pavilionGroup);
  return interiorResult;
}

// -----------------------------------------------------------------------------
// 5. LAKE RECREATION & PICNIC GROUNDS
// -----------------------------------------------------------------------------
function createLakeRecreation(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary
) {
  const lakeRecGroup = new THREE.Group();
  lakeRecGroup.position.set(5, 0, -42);

  // Waterfront Picnic Tables along the northern shore
  const picnicCoords = [
    { x: -14, z: 4.5, r: 0.1 },
    { x: -6, z: 4.5, r: -0.2 },
    { x: 14, z: 4.5, r: 0.3 },
  ];

  picnicCoords.forEach((pc) => {
    const pGroup = new THREE.Group();
    pGroup.position.set(pc.x, 0.15, pc.z);
    pGroup.rotation.y = pc.r;

    // Table Top
    const tTopGeo = new THREE.BoxGeometry(2.2, 0.1, 1.0);
    const tTop = new THREE.Mesh(tTopGeo, materials.modernWoodSiding);
    tTop.position.y = 0.8;
    tTop.castShadow = true;
    pGroup.add(tTop);

    // Benches on either side
    for (const bz of [-0.75, 0.75]) {
      const benchGeo = new THREE.BoxGeometry(2.2, 0.08, 0.4);
      const bench = new THREE.Mesh(benchGeo, materials.modernWoodSiding);
      bench.position.set(0, 0.45, bz);
      bench.castShadow = true;
      pGroup.add(bench);
    }

    // A-frame Legs
    for (const lx of [-0.85, 0.85]) {
      const legGeo = new THREE.BoxGeometry(0.1, 0.8, 1.8);
      const leg = new THREE.Mesh(legGeo, materials.metalBlack);
      leg.position.set(lx, 0.4, 0);
      pGroup.add(leg);
    }

    lakeRecGroup.add(pGroup);
  });

  // Shoreline Weeping Willow Trees along the waterfront
  const willowCoords = [
    { x: -20, z: 5, s: 1.15 },
    { x: -10, z: 4, s: 1.05 },
    { x: 10, z: 5, s: 1.1 },
    { x: 20, z: 7, s: 1.2 },
  ];
  willowCoords.forEach((wc) => {
    const wGroup = new THREE.Group();
    wGroup.position.set(wc.x, 0.2, wc.z);
    wGroup.scale.set(wc.s, wc.s, wc.s);

    const trunkGeo = new THREE.CylinderGeometry(0.2, 0.32, 2.8, 10);
    const trunk = new THREE.Mesh(trunkGeo, materials.treeTrunkBark);
    trunk.position.y = 1.4;
    trunk.castShadow = true;
    wGroup.add(trunk);

    const canopyGeo = new THREE.SphereGeometry(2.0, 12, 10);
    canopyGeo.scale(1.2, 0.85, 1.2);
    const canopy = new THREE.Mesh(canopyGeo, materials.treeFoliageWillow);
    canopy.position.y = 3.2;
    canopy.castShadow = true;
    wGroup.add(canopy);

    lakeRecGroup.add(wGroup);
  });

  // Moored Wooden Rowboat on the lake water
  const rowboatGroup = new THREE.Group();
  rowboatGroup.position.set(16, -0.15, 6);

  const hullGeo = new THREE.BoxGeometry(1.4, 0.6, 3.2);
  const hull = new THREE.Mesh(hullGeo, materials.modernWoodSiding);
  hull.position.y = 0.2;
  hull.castShadow = true;
  rowboatGroup.add(hull);

  // Boat bench seats
  const boatSeat = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.08, 0.4), materials.doorWood);
  boatSeat.position.set(0, 0.38, 0);
  rowboatGroup.add(boatSeat);

  // Wooden oars
  for (const ox of [-0.8, 0.8]) {
    const oar = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.8, 6), materials.doorWood);
    oar.position.set(ox, 0.45, 0.2);
    oar.rotation.z = ox > 0 ? -0.4 : 0.4;
    rowboatGroup.add(oar);
  }

  lakeRecGroup.add(rowboatGroup);

  // ========================================================
  // Lakeside Boathouse & Picnic Pavilion - CLICKABLE
  // World pos: (-20, 0, -37.5) -> lakeRecGroup relative (-25, 0, 4.5)
  // ========================================================
  const bhGroup = new THREE.Group();
  bhGroup.position.set(-25, 0.15, 4.5);

  // Timber Deck Foundation
  const deck = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.25, 7.0), materials.modernWoodSiding);
  deck.position.y = 0.125;
  deck.receiveShadow = true;
  bhGroup.add(deck);

  // Main Pavilion Timber Frame
  const bhMain = new THREE.Mesh(new THREE.BoxGeometry(8.5, 3.8, 6.5), materials.modernWoodSiding);
  bhMain.position.y = 2.0;
  bhMain.castShadow = true;
  bhMain.receiveShadow = true;
  bhMain.userData = { isBuilding: true, buildingId: 'lake-boathouse' };
  clickableBuildings.push(bhMain);
  bhGroup.add(bhMain);

  // Pitched Timber Shingle Roof
  const bhRoof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.6, 4), materials.roofTileTerracotta);
  bhRoof.position.y = 5.1;
  bhRoof.rotation.y = Math.PI / 4;
  bhRoof.castShadow = true;
  bhRoof.userData = { isBuilding: true, buildingId: 'lake-boathouse' };
  clickableBuildings.push(bhRoof);
  bhGroup.add(bhRoof);

  // Fieldstone Barbecue Hearth Chimney
  const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.6, 5.8, 1.6), materials.rockStoneMaterial);
  chimney.position.set(4.2, 2.9, 0);
  chimney.castShadow = true;
  bhGroup.add(chimney);

  // Kayak Racks with 2 colorful kayaks
  const rack = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 2.8), materials.metalBlack);
  rack.position.set(-4.2, 0.9, 0);
  bhGroup.add(rack);

  // Yellow Kayak
  const k1 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.4, 8), materials.kayakYellow);
  k1.rotation.z = Math.PI / 2;
  k1.position.set(-4.2, 1.4, 0);
  k1.castShadow = true;
  bhGroup.add(k1);

  // Red Kayak
  const k2 = new THREE.Mesh(new THREE.ConeGeometry(0.35, 3.4, 8), materials.kayakRed);
  k2.rotation.z = Math.PI / 2;
  k2.position.set(-4.2, 0.6, 0);
  k2.castShadow = true;
  bhGroup.add(k2);

  lakeRecGroup.add(bhGroup);

  group.add(lakeRecGroup);

  return { rowboatGroup };
}

// -----------------------------------------------------------------------------
// 6. STREET INFRASTRUCTURE, CARS & WAYFINDING
// -----------------------------------------------------------------------------
function createStreetInfrastructureAndCars(
  group: THREE.Group,
  foliageGroup: THREE.Group,
  materials: MaterialLibrary
) {
  // 1. Modern Streetlamps along Main Boulevard & Neighborhoods
  const lampPositions = [
    // Main Boulevard
    { x: -32, z: 5.6 },
    { x: -18, z: 5.6 },
    { x: 8, z: 5.6 },
    { x: 24, z: 5.6 },
    { x: 38, z: 5.6 },
    { x: -32, z: -5.6 },
    { x: -18, z: -5.6 },
    { x: 8, z: -5.6 },
    { x: 24, z: -5.6 },
    // Residential North Road
    { x: -10.6, z: 20 },
    { x: -10.6, z: 36 },
    { x: -10.6, z: 52 },
    // Lake Promenade Road
    { x: -12, z: -23 },
    { x: 4, z: -23 },
    { x: 20, z: -23 },
  ];

  lampPositions.forEach((lp) => {
    const lamp = new THREE.Group();
    lamp.position.set(lp.x, 0.16, lp.z);

    // Pole
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.1, 4.2, 8);
    const pole = new THREE.Mesh(poleGeo, materials.metalBlack);
    pole.position.y = 2.1;
    pole.castShadow = true;
    lamp.add(pole);

    // Horizontal Arm
    const armGeo = new THREE.BoxGeometry(0.08, 0.08, 0.9);
    const arm = new THREE.Mesh(armGeo, materials.metalBlack);
    arm.position.set(0, 4.2, lp.z > 0 ? -0.45 : 0.45);
    lamp.add(arm);

    // Luminaire Fixture with warm glowing lantern head
    const fixtureGeo = new THREE.BoxGeometry(0.3, 0.12, 0.45);
    const fixture = new THREE.Mesh(fixtureGeo, materials.modernDarkSlate);
    fixture.position.set(0, 4.15, lp.z > 0 ? -0.8 : 0.8);
    lamp.add(fixture);

    const glowGeo = new THREE.BoxGeometry(0.24, 0.05, 0.38);
    const glow = new THREE.Mesh(glowGeo, materials.lampGlow);
    glow.position.set(0, 4.08, lp.z > 0 ? -0.8 : 0.8);
    lamp.add(glow);

    group.add(lamp);
  });

  // 2. Village Wayfinding Signpost at Roundabout Corner (-10.8, 0, 6.2)
  const signpost = new THREE.Group();
  signpost.position.set(-10.8, 0.18, 6.2);

  const signPostPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), materials.metalSteel);
  signPostPole.position.y = 1.6;
  signPostPole.castShadow = true;
  signpost.add(signPostPole);

  // Sign Plaque 1: Town Center (pointing west)
  const sign1 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.04), materials.modernDarkSlate);
  sign1.position.set(-0.4, 2.6, 0);
  signpost.add(sign1);

  // Sign Plaque 2: Central Park (pointing east)
  const sign2 = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.18, 0.04), materials.modernDarkSlate);
  sign2.position.set(0.4, 2.3, 0);
  signpost.add(sign2);

  // Sign Plaque 3: Residential District (pointing north)
  const sign3 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 1.1), materials.modernDarkSlate);
  sign3.position.set(0, 2.0, 0.45);
  signpost.add(sign3);

  // Sign Plaque 4: Lake Promenade (pointing south)
  const sign4 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 1.0), materials.modernDarkSlate);
  sign4.position.set(0, 1.7, -0.45);
  signpost.add(sign4);

  group.add(signpost);

  // 3. Modern Parked Vehicles for Scale (Sedan, Crossover SUV, Hatchback, Coupe)
  function buildCar(x: number, z: number, rotY: number, paintMat: THREE.MeshStandardMaterial) {
    const car = new THREE.Group();
    car.name = 'static-car';
    car.userData = { isVehicle: true };
    car.position.set(x, 0.1, z);
    car.rotation.y = rotY;

    // Chassis Lower Body
    const bodyGeo = new THREE.BoxGeometry(2.1, 0.65, 4.4);
    const body = new THREE.Mesh(bodyGeo, paintMat);
    body.position.y = 0.55;
    body.castShadow = true;
    body.receiveShadow = true;
    car.add(body);

    // Cabin Glass / Roof
    const cabinGeo = new THREE.BoxGeometry(1.8, 0.65, 2.5);
    const cabin = new THREE.Mesh(cabinGeo, materials.carGlass);
    cabin.position.set(0, 1.15, -0.2);
    cabin.castShadow = true;
    car.add(cabin);

    // Roof Cap
    const roofGeo = new THREE.BoxGeometry(1.7, 0.08, 2.4);
    const roof = new THREE.Mesh(roofGeo, paintMat);
    roof.position.set(0, 1.5, -0.2);
    car.add(roof);

    // 4 Wheels with Rims
    const wheelPositions = [
      { x: -1.05, z: 1.3 },
      { x: 1.05, z: 1.3 },
      { x: -1.05, z: -1.3 },
      { x: 1.05, z: -1.3 },
    ];
    wheelPositions.forEach((wp) => {
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 14);
      tireGeo.rotateZ(Math.PI / 2);
      const tire = new THREE.Mesh(tireGeo, materials.carTireRubber);
      tire.position.set(wp.x, 0.38, wp.z);
      tire.castShadow = true;
      car.add(tire);
    });

    group.add(car);
  }

  // Cars in Town Center Ground-Level Parking Plaza (Clear of all building footprints, facing Lake Scenic Road)
  buildCar(-28.5, -20.5, 0, materials.carPaintWhite);
  buildCar(-25.0, -20.5, 0, materials.carPaintBlue);
  buildCar(-18.0, -20.5, 0, materials.carPaintRed);

  // Cars in Residential Driveway Aprons (Clear of all villa walls and cul-de-sac)
  buildCar(-32.0, 42.0, 0, materials.carPaintWhite);
  buildCar(-17.0, 42.0, 0, materials.carPaintBlue);

  // 4. Tree-lined Avenues & Forest Buffers (Species: Oak, Birch, Cherry Blossom, Scots Pine)
  const treeCoords: {
    x: number;
    z: number;
    type: 'oak' | 'birch' | 'cherry' | 'pine';
    scale: number;
  }[] = [];

  // Boulevard Verge Trees
  for (let x = -38; x <= 36; x += 9) {
    if (Math.abs(x - -5) > 9.5) {
      treeCoords.push({ x, z: 7.2, type: 'oak', scale: 1.0 });
      treeCoords.push({ x, z: -7.2, type: 'birch', scale: 0.95 });
    }
  }

  // Residential Street Trees
  for (let z = 18; z <= 62; z += 10) {
    treeCoords.push({ x: -12.4, z, type: 'pine', scale: 1.05 });
  }

  // Central Park Decorative Trees (Deciduous, Birch & Flowering Cherry - Strictly inside park)
  const parkTrees = [
    { x: 10, z: -17, type: 'cherry', scale: 1.15 },
    { x: 31, z: -17, type: 'birch', scale: 1.2 },
    { x: 30, z: -10, type: 'oak', scale: 1.1 },
    { x: 9.5, z: -10, type: 'cherry', scale: 1.1 },
    { x: 25, z: -18, type: 'pine', scale: 1.15 },
    { x: 20, z: -10, type: 'oak', scale: 1.05 },
    { x: 31, z: -8, type: 'birch', scale: 1.2 },
  ];
  parkTrees.forEach((pt) => treeCoords.push(pt as any));

  // Build each tree with varied multi-part procedural geometry and appropriate species silhouettes
  treeCoords.forEach((tc) => {
    // Strictly verify tree does NOT overlap any drivable road surface, curb, or intersection
    if (isPointInDriveableArea(tc.x, tc.z, 0.8)) return;

    const tree = new THREE.Group();
    tree.position.set(tc.x, 0.15, tc.z);
    tree.scale.set(tc.scale, tc.scale, tc.scale);

    const trunkMat = tc.type === 'birch' ? materials.treeTrunkBirch : materials.treeTrunkBark;
    const trunkGeo = new THREE.CylinderGeometry(0.18, 0.28, 2.6, 8);
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1.3;
    trunk.castShadow = true;
    tree.add(trunk);

    if (tc.type === 'pine') {
      // Layered conical foliage
      for (let layer = 0; layer < 3; layer++) {
        const coneGeo = new THREE.ConeGeometry(1.5 - layer * 0.32, 1.4, 8);
        const cone = new THREE.Mesh(coneGeo, materials.treeFoliageDarkGreen);
        cone.position.y = 2.2 + layer * 0.9;
        cone.castShadow = true;
        tree.add(cone);
      }
    } else if (tc.type === 'cherry') {
      // Cloud of pink blossoms
      const cMat = materials.treeFoliageFloweringPink;
      const c1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.45, 1), cMat);
      c1.position.y = 2.9;
      c1.castShadow = true;
      tree.add(c1);

      const c2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.1, 1), cMat);
      c2.position.set(0.4, 3.8, 0.2);
      c2.castShadow = true;
      tree.add(c2);
    } else if (tc.type === 'birch') {
      // Light airy canopy
      const bMat = materials.treeFoliageLightGreen;
      const b1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), bMat);
      b1.position.y = 3.0;
      b1.castShadow = true;
      tree.add(b1);

      const b2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.95, 1), bMat);
      b2.position.set(-0.3, 3.9, 0.3);
      b2.castShadow = true;
      tree.add(b2);
    } else {
      // Broad oak tree
      const oMat = materials.treeFoliageOlive;
      const o1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.55, 1), oMat);
      o1.position.y = 2.8;
      o1.castShadow = true;
      tree.add(o1);

      const o2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), oMat);
      o2.position.set(0.35, 3.7, 0.25);
      o2.castShadow = true;
      tree.add(o2);
    }

    foliageGroup.add(tree);
  });
}

// -----------------------------------------------------------------------------
// 7. DISTRICT 1: RURAL VILLAGE & FARMLANDS (West District)
// -----------------------------------------------------------------------------
function createRuralVillage(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary,
  foliageGroup: THREE.Group
) {
  const ruralGroup = new THREE.Group();
  ruralGroup.name = 'District1_RuralVillage';

  // Helper for rustic clickable building
  function registerClickable(mesh: THREE.Mesh, buildingId: string) {
    mesh.userData = { isClickableBuilding: true, buildingId };
    clickableBuildings.push(mesh);
  }

  // 1. Rustic Thatched Cottage 1 at (-130, 0, 20)
  const c1Group = new THREE.Group();
  c1Group.position.set(-130, 0, 20);

  const c1BaseGeo = new THREE.BoxGeometry(8.5, 3.4, 7.5);
  const c1Base = new THREE.Mesh(c1BaseGeo, materials.modernWarmBeige);
  c1Base.position.y = 1.7;
  c1Base.castShadow = true;
  c1Base.receiveShadow = true;
  registerClickable(c1Base, 'rural-cottage-1');
  c1Group.add(c1Base);

  // Thatched hip roof
  const c1RoofGeo = new THREE.ConeGeometry(6.5, 3.2, 4);
  c1RoofGeo.rotateY(Math.PI / 4);
  const c1Roof = new THREE.Mesh(c1RoofGeo, materials.thatchedRoofMaterial);
  c1Roof.position.y = 4.8;
  c1Roof.castShadow = true;
  registerClickable(c1Roof, 'rural-cottage-1');
  c1Group.add(c1Roof);

  // Timber porch & veranda
  const porchGeo = new THREE.BoxGeometry(8.5, 0.25, 2.2);
  const porch = new THREE.Mesh(porchGeo, materials.modernWoodSiding);
  porch.position.set(0, 0.12, 4.5);
  porch.receiveShadow = true;
  c1Group.add(porch);

  // Porch timber posts
  for (const px of [-3.8, 0, 3.8]) {
    const postGeo = new THREE.CylinderGeometry(0.09, 0.09, 2.4, 8);
    const post = new THREE.Mesh(postGeo, materials.doorWood);
    post.position.set(px, 1.2, 5.4);
    post.castShadow = true;
    c1Group.add(post);
  }
  ruralGroup.add(c1Group);

  // 2. Clay Brick Village Home 2 at (-97, 0, 25)
  const c2Group = new THREE.Group();
  c2Group.position.set(-97, 0, 25);

  const c2BaseGeo = new THREE.BoxGeometry(8.5, 3.2, 7.0);
  const c2Base = new THREE.Mesh(c2BaseGeo, materials.clayBrickMaterial);
  c2Base.position.y = 1.6;
  c2Base.castShadow = true;
  c2Base.receiveShadow = true;
  registerClickable(c2Base, 'rural-cottage-2');
  c2Group.add(c2Base);

  // Pitched clay tile roof
  const c2RoofGeo = new THREE.ConeGeometry(6.6, 2.6, 4);
  c2RoofGeo.rotateY(Math.PI / 4);
  const c2Roof = new THREE.Mesh(c2RoofGeo, materials.roofTileTerracotta);
  c2Roof.position.y = 4.4;
  c2Roof.castShadow = true;
  registerClickable(c2Roof, 'rural-cottage-2');
  c2Group.add(c2Roof);
  ruralGroup.add(c2Group);

  // 3. Community Grain Barn & Silo at (-145, 0, 35)
  const barnGroup = new THREE.Group();
  barnGroup.position.set(-145, 0, 35);

  const barnGeo = new THREE.BoxGeometry(11.0, 5.2, 8.0);
  const barnMesh = new THREE.Mesh(barnGeo, materials.modernWoodSiding);
  barnMesh.position.y = 2.6;
  barnMesh.castShadow = true;
  barnMesh.receiveShadow = true;
  registerClickable(barnMesh, 'rural-grain-barn');
  barnGroup.add(barnMesh);

  // Gambrel roof
  const barnRoofGeo = new THREE.ConeGeometry(8.2, 3.4, 4);
  barnRoofGeo.rotateY(Math.PI / 4);
  const barnRoof = new THREE.Mesh(barnRoofGeo, materials.roofTileDark);
  barnRoof.position.y = 6.4;
  barnRoof.castShadow = true;
  registerClickable(barnRoof, 'rural-grain-barn');
  barnGroup.add(barnRoof);

  // Grain Silo cylinder beside barn
  const siloGeo = new THREE.CylinderGeometry(2.2, 2.4, 8.5, 16);
  const siloMesh = new THREE.Mesh(siloGeo, materials.metalSteel);
  siloMesh.position.set(7.5, 4.25, 0);
  siloMesh.castShadow = true;
  registerClickable(siloMesh, 'rural-grain-barn');
  barnGroup.add(siloMesh);

  const siloDomeGeo = new THREE.SphereGeometry(2.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const siloDome = new THREE.Mesh(siloDomeGeo, materials.metalSteel);
  siloDome.position.set(7.5, 8.5, 0);
  barnGroup.add(siloDome);
  ruralGroup.add(barnGroup);

  // 4. Village Community Tea Stall & Canopy at (-120, 0, -15)
  const teaGroup = new THREE.Group();
  teaGroup.position.set(-120, 0, -15);

  const teaPlatformGeo = new THREE.BoxGeometry(7.5, 0.2, 5.5);
  const teaPlatform = new THREE.Mesh(teaPlatformGeo, materials.modernWoodSiding);
  teaPlatform.position.y = 0.1;
  teaPlatform.receiveShadow = true;
  teaGroup.add(teaPlatform);

  // Bamboo Posts
  for (const px of [-3.2, 3.2]) {
    for (const pz of [-2.2, 2.2]) {
      const bPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.8, 8), materials.bambooGreen);
      bPost.position.set(px, 1.4, pz);
      bPost.castShadow = true;
      teaGroup.add(bPost);
    }
  }

  // Thatched Canopy
  const canopyGeo = new THREE.BoxGeometry(8.2, 0.4, 6.2);
  const canopy = new THREE.Mesh(canopyGeo, materials.thatchedRoofMaterial);
  canopy.position.y = 2.9;
  canopy.castShadow = true;
  registerClickable(canopy, 'rural-tea-stall');
  teaGroup.add(canopy);

  // Counter & Benches
  const counterGeo = new THREE.BoxGeometry(4.2, 1.0, 1.2);
  const counter = new THREE.Mesh(counterGeo, materials.modernWoodSiding);
  counter.position.set(0, 0.5, 0);
  registerClickable(counter, 'rural-tea-stall');
  teaGroup.add(counter);

  // Kettle / Tea urn on counter
  const urn = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.7, 12), materials.metalBronze);
  urn.position.set(1.2, 1.35, 0);
  teaGroup.add(urn);
  ruralGroup.add(teaGroup);

  // 5. Village Stone Well at (-100, 0, -16)
  const wellGroup = new THREE.Group();
  wellGroup.position.set(-100, 0, -16);

  const wellCurbGeo = new THREE.CylinderGeometry(1.6, 1.8, 1.1, 16);
  const wellCurb = new THREE.Mesh(wellCurbGeo, materials.rockStoneMaterial);
  wellCurb.position.y = 0.55;
  wellCurb.castShadow = true;
  registerClickable(wellCurb, 'rural-well');
  wellGroup.add(wellCurb);

  // Well Timber Canopy
  for (const wx of [-1.1, 1.1]) {
    const wPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.4, 8), materials.doorWood);
    wPost.position.set(wx, 1.2, 0);
    wellGroup.add(wPost);
  }
  const wRoof = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1.2, 4), materials.thatchedRoofMaterial);
  wRoof.position.y = 2.8;
  wRoof.rotation.y = Math.PI / 4;
  wellGroup.add(wRoof);

  // Well Crossbeam, Pulley Spool & Water Bucket
  const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.08, 0.08), materials.doorWood);
  crossBeam.position.y = 2.2;
  wellGroup.add(crossBeam);

  const pulleyWheel = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 12), materials.metalSteel);
  pulleyWheel.rotation.x = Math.PI / 2;
  pulleyWheel.position.set(0, 2.05, 0);
  wellGroup.add(pulleyWheel);

  const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 6), materials.thatchedRoofMaterial);
  rope.position.set(0, 1.55, 0);
  wellGroup.add(rope);

  const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.32, 10), materials.modernWoodSiding);
  bucket.position.set(0, 1.1, 0);
  bucket.castShadow = true;
  wellGroup.add(bucket);

  ruralGroup.add(wellGroup);

  // 6. Rural Primary Schoolhouse at (-125, 0, -32)
  const schoolGroup = new THREE.Group();
  schoolGroup.position.set(-125, 0, -32);

  const sBaseGeo = new THREE.BoxGeometry(12.0, 4.0, 8.5);
  const sBase = new THREE.Mesh(sBaseGeo, materials.modernWarmBeige);
  sBase.position.y = 2.0;
  sBase.castShadow = true;
  sBase.receiveShadow = true;
  registerClickable(sBase, 'rural-school');
  schoolGroup.add(sBase);

  // School pitched metal roof
  const sRoofGeo = new THREE.ConeGeometry(9.0, 3.0, 4);
  sRoofGeo.rotateY(Math.PI / 4);
  const sRoof = new THREE.Mesh(sRoofGeo, materials.roofTileTerracotta);
  sRoof.position.y = 5.2;
  sRoof.castShadow = true;
  registerClickable(sRoof, 'rural-school');
  schoolGroup.add(sRoof);

  // School Bell Tower
  const bellTowerGeo = new THREE.BoxGeometry(1.4, 2.2, 1.4);
  const bellTower = new THREE.Mesh(bellTowerGeo, materials.modernWarmBeige);
  bellTower.position.set(0, 7.2, 0);
  schoolGroup.add(bellTower);

  const bellSpire = new THREE.Mesh(new THREE.ConeGeometry(1.1, 1.6, 4), materials.metalBronze);
  bellSpire.position.set(0, 8.8, 0);
  schoolGroup.add(bellSpire);

  // Flagpole in front of school
  const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 8.0, 8), materials.metalSteel);
  flagPole.position.set(0, 4.0, 7.5);
  flagPole.castShadow = true;
  schoolGroup.add(flagPole);

  const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), materials.carPaintEmerald);
  flagMesh.position.set(0.7, 7.4, 7.5);
  schoolGroup.add(flagMesh);
  ruralGroup.add(schoolGroup);

  // 7. Rural Health Dispensary / Clinic at (-95, 0, -32)
  const clinicGroup = new THREE.Group();
  clinicGroup.position.set(-95, 0, -32);

  const clBaseGeo = new THREE.BoxGeometry(10.0, 3.6, 7.5);
  const clBase = new THREE.Mesh(clBaseGeo, materials.modernWhiteStucco);
  clBase.position.y = 1.8;
  clBase.castShadow = true;
  clBase.receiveShadow = true;
  registerClickable(clBase, 'rural-clinic');
  clinicGroup.add(clBase);

  const clRoof = new THREE.Mesh(new THREE.ConeGeometry(7.2, 2.5, 4), materials.roofTileTerracotta);
  clRoof.position.y = 4.6;
  clRoof.rotation.y = Math.PI / 4;
  registerClickable(clRoof, 'rural-clinic');
  clinicGroup.add(clRoof);

  // Red cross emblem on clinic wall
  const crossHoriz = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.45, 0.1), materials.medicalCrossRed);
  crossHoriz.position.set(0, 2.8, 3.8);
  clinicGroup.add(crossHoriz);

  const crossVert = new THREE.Mesh(new THREE.BoxGeometry(0.45, 1.4, 0.1), materials.medicalCrossRed);
  crossVert.position.set(0, 2.8, 3.8);
  clinicGroup.add(crossVert);
  ruralGroup.add(clinicGroup);

  // 8. Farmland Crop Fields (Plots with furrowed tilled soil & fence borders)
  const farmPlot1Geo = new THREE.PlaneGeometry(32, 22);
  farmPlot1Geo.rotateX(-Math.PI / 2);
  const farmPlot1 = new THREE.Mesh(farmPlot1Geo, materials.farmlandSoil);
  farmPlot1.position.set(-145, 0.05, 18);
  farmPlot1.receiveShadow = true;
  ruralGroup.add(farmPlot1);

  // Green crop sprout rows
  for (let zOffset = -8; zOffset <= 8; zOffset += 2.5) {
    const rowGeo = new THREE.BoxGeometry(28, 0.22, 0.5);
    const row = new THREE.Mesh(rowGeo, materials.cropGreen);
    row.position.set(-145, 0.16, 18 + zOffset);
    ruralGroup.add(row);
  }

  // Ancient Banyan Tree with wide spreading foliage at (-126, 0, -18)
  const banyanGroup = new THREE.Group();
  banyanGroup.position.set(-126, 0, -18);

  const bTrunk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.8, 5.2, 12), materials.treeTrunkBark);
  bTrunk.position.y = 2.6;
  bTrunk.castShadow = true;
  banyanGroup.add(bTrunk);

  // Spreading tiered canopy
  const bFoliage1 = new THREE.Mesh(new THREE.DodecahedronGeometry(3.8, 1), materials.treeFoliageDarkGreen);
  bFoliage1.position.set(0, 6.2, 0);
  bFoliage1.scale.set(1.4, 0.85, 1.4);
  bFoliage1.castShadow = true;
  banyanGroup.add(bFoliage1);

  const bFoliage2 = new THREE.Mesh(new THREE.DodecahedronGeometry(2.6, 1), materials.treeFoliageLightGreen);
  bFoliage2.position.set(1.8, 7.4, 0.8);
  banyanGroup.add(bFoliage2);
  foliageGroup.add(banyanGroup);

  // 9. Flooded Reflective Rice Paddies with Emergent Seedlings
  const ricePaddyGroup = new THREE.Group();
  ricePaddyGroup.position.set(-142, 0.04, -18);

  // Mud boundary bunds / earthen levees
  const bundMat = materials.riverBankMaterial;
  const bundWidth = 0.6;
  const bundHeight = 0.28;

  // Outer bund perimeter
  const bundN = new THREE.Mesh(new THREE.BoxGeometry(22, bundHeight, bundWidth), bundMat);
  bundN.position.set(0, 0.14, -8);
  ricePaddyGroup.add(bundN);

  const bundS = new THREE.Mesh(new THREE.BoxGeometry(22, bundHeight, bundWidth), bundMat);
  bundS.position.set(0, 0.14, 8);
  ricePaddyGroup.add(bundS);

  const bundW = new THREE.Mesh(new THREE.BoxGeometry(bundWidth, bundHeight, 16), bundMat);
  bundW.position.set(-11, 0.14, 0);
  ricePaddyGroup.add(bundW);

  const bundE = new THREE.Mesh(new THREE.BoxGeometry(bundWidth, bundHeight, 16), bundMat);
  bundE.position.set(11, 0.14, 0);
  ricePaddyGroup.add(bundE);

  // Central dividing bund
  const bundMid = new THREE.Mesh(new THREE.BoxGeometry(22, bundHeight, bundWidth), bundMat);
  bundMid.position.set(0, 0.14, 0);
  ricePaddyGroup.add(bundMid);

  // Reflective shallow water surface
  const paddyWaterGeo = new THREE.PlaneGeometry(21.4, 15.4);
  paddyWaterGeo.rotateX(-Math.PI / 2);
  const paddyWater = new THREE.Mesh(paddyWaterGeo, materials.lakeWaterMaterial);
  paddyWater.position.set(0, 0.12, 0);
  ricePaddyGroup.add(paddyWater);

  // Emergent bright green rice seedlings in neat rows
  for (let rx = -9; rx <= 9; rx += 2.2) {
    for (let rz = -6.5; rz <= 6.5; rz += 2.0) {
      if (Math.abs(rz) < 0.8) continue; // Skip dividing bund
      const sproutGeo = new THREE.ConeGeometry(0.18, 0.5, 5);
      const sprout = new THREE.Mesh(sproutGeo, materials.cropGreen);
      sprout.position.set(rx + (Math.random() - 0.5) * 0.3, 0.28, rz + (Math.random() - 0.5) * 0.3);
      ricePaddyGroup.add(sprout);
    }
  }
  ruralGroup.add(ricePaddyGroup);

  // 10. Raised Vegetable Gardens (Cabbages, Carrots, and Pumpkins)
  const vegGroup = new THREE.Group();
  vegGroup.position.set(-122, 0.05, 38);

  // Raised timber planter boxes
  const boxConfigs = [
    { z: -3.5, type: 'cabbage' },
    { z: 0, type: 'carrot' },
    { z: 3.5, type: 'pumpkin' },
  ];

  boxConfigs.forEach((box) => {
    // Timber border
    const border = new THREE.Mesh(new THREE.BoxGeometry(10.5, 0.35, 2.6), materials.modernWoodSiding);
    border.position.set(0, 0.175, box.z);
    border.castShadow = true;
    vegGroup.add(border);

    // Dark organic soil
    const soil = new THREE.Mesh(new THREE.BoxGeometry(9.9, 0.1, 2.0), materials.flowerBedMulchMaterial);
    soil.position.set(0, 0.3, box.z);
    vegGroup.add(soil);

    if (box.type === 'cabbage') {
      for (let cx = -4.2; cx <= 4.2; cx += 1.4) {
        const cabbage = new THREE.Mesh(new THREE.DodecahedronGeometry(0.24, 0), materials.hedgeBoxwood);
        cabbage.position.set(cx, 0.44, box.z);
        cabbage.castShadow = true;
        vegGroup.add(cabbage);
      }
    } else if (box.type === 'carrot') {
      for (let cx = -4.2; cx <= 4.2; cx += 0.9) {
        const top = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.4, 5), materials.cropGreen);
        top.position.set(cx, 0.45, box.z);
        vegGroup.add(top);
      }
    } else if (box.type === 'pumpkin') {
      for (let cx = -3.8; cx <= 3.8; cx += 1.8) {
        const pumpkin = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 8), materials.roofTileTerracotta);
        pumpkin.scale.set(1.2, 0.85, 1.2);
        pumpkin.position.set(cx, 0.48, box.z);
        pumpkin.castShadow = true;
        vegGroup.add(pumpkin);

        // Vine stem
        const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.15, 6), materials.cropGreen);
        stem.position.set(cx, 0.76, box.z);
        vegGroup.add(stem);
      }
    }
  });
  ruralGroup.add(vegGroup);

  // 11. Split-Rail Livestock Paddock, Animal Shelter & Golden Hay Bales
  const paddockGroup = new THREE.Group();
  paddockGroup.position.set(-94, 0.05, 36);

  // Rustic three-sided animal run-in shelter
  const shelter = new THREE.Group();
  shelter.position.set(-5, 0, -4);

  const sBack = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.8, 0.15), materials.modernWoodSiding);
  sBack.position.set(0, 1.4, -2.5);
  sBack.castShadow = true;
  shelter.add(sBack);

  const sLeft = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 5.0), materials.modernWoodSiding);
  sLeft.position.set(-3.2, 1.4, 0);
  sLeft.castShadow = true;
  shelter.add(sLeft);

  const sRight = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 5.0), materials.modernWoodSiding);
  sRight.position.set(3.2, 1.4, 0);
  sRight.castShadow = true;
  shelter.add(sRight);

  // Sloping corrugated tin roof
  const shelterRoof = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.12, 5.6), materials.metalSteel);
  shelterRoof.position.set(0, 2.9, 0);
  shelterRoof.rotation.x = 0.12;
  shelterRoof.castShadow = true;
  shelter.add(shelterRoof);

  paddockGroup.add(shelter);

  // Split-rail wooden zig-zag paddock fence
  const fenceMat = materials.modernWoodSiding;
  const fencePosts = [
    { x: -9, z: -7 }, { x: -3, z: -7 }, { x: 3, z: -7 }, { x: 8, z: -7 },
    { x: 8, z: 0 }, { x: 8, z: 7 }, { x: 2, z: 7 }, { x: -4, z: 7 }, { x: -9, z: 7 },
    { x: -9, z: 0 }
  ];
  fencePosts.forEach((fp) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.09, 1.3, 6), fenceMat);
    post.position.set(fp.x, 0.65, fp.z);
    post.castShadow = true;
    paddockGroup.add(post);
  });

  // Rails connecting posts
  for (let i = 0; i < fencePosts.length; i++) {
    const p1 = fencePosts[i];
    const p2 = fencePosts[(i + 1) % fencePosts.length];
    if (i === 4) continue; // Open farm gate

    const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
    const midX = (p1.x + p2.x) * 0.5;
    const midZ = (p1.z + p2.z) * 0.5;
    const ang = Math.atan2(p2.z - p1.z, p2.x - p1.x);

    for (const ry of [0.45, 0.95]) {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(dist, 0.08, 0.06), fenceMat);
      rail.position.set(midX, ry, midZ);
      rail.rotation.y = -ang;
      paddockGroup.add(rail);
    }
  }

  // Golden cylindrical hay bales
  const baleLocations = [
    { x: 2, z: -2, r: 0 },
    { x: 4.5, z: -1.5, r: 0.8 },
    { x: 3.2, z: -2.8, r: 1.4 },
    { x: 5, z: 3, r: 0.2 },
  ];
  baleLocations.forEach((bl) => {
    const bale = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 1.2, 12), materials.thatchedRoofMaterial);
    bale.rotation.z = Math.PI / 2;
    bale.rotation.y = bl.r;
    bale.position.set(bl.x, 0.65, bl.z);
    bale.castShadow = true;
    paddockGroup.add(bale);
  });

  ruralGroup.add(paddockGroup);

  // 12. Green & Yellow Classic Agricultural Utility Tractor parked by Grain Barn
  const tractorGroup = new THREE.Group();
  tractorGroup.position.set(-136, 0.05, 33);
  tractorGroup.rotation.y = -0.4;

  // Tractor chassis & engine hood (Classic green)
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.85, 2.8), materials.treeFoliageDarkGreen);
  chassis.position.y = 0.85;
  chassis.castShadow = true;
  tractorGroup.add(chassis);

  // High driver seat
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.6), materials.kayakYellow);
  seat.position.set(0, 1.4, -0.6);
  tractorGroup.add(seat);

  // Steering wheel & column
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 6), materials.metalBlack);
  column.position.set(0, 1.45, 0.1);
  column.rotation.x = -0.3;
  tractorGroup.add(column);

  const wheelRim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 12), materials.metalBlack);
  wheelRim.position.set(0, 1.7, 0.18);
  wheelRim.rotation.x = 0.5;
  tractorGroup.add(wheelRim);

  // Vertical exhaust stack
  const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 1.4, 8), materials.metalBlack);
  exhaust.position.set(0.45, 1.7, 0.9);
  tractorGroup.add(exhaust);

  // Large lugged rear wheels (Yellow hubs with heavy black rubber tires)
  for (const rx of [-0.85, 0.85]) {
    const rearTire = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 0.45, 16), materials.carTireRubber);
    rearTire.rotation.z = Math.PI / 2;
    rearTire.position.set(rx, 0.75, -0.7);
    rearTire.castShadow = true;
    tractorGroup.add(rearTire);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.48, 12), materials.kayakYellow);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(rx, 0.75, -0.7);
    tractorGroup.add(hub);
  }

  // Smaller front steering wheels
  for (const fx of [-0.75, 0.75]) {
    const frontTire = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.3, 14), materials.carTireRubber);
    frontTire.rotation.z = Math.PI / 2;
    frontTire.position.set(fx, 0.45, 1.0);
    frontTire.castShadow = true;
    tractorGroup.add(frontTire);

    const fHub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.32, 10), materials.kayakYellow);
    fHub.rotation.z = Math.PI / 2;
    fHub.position.set(fx, 0.45, 1.0);
    tractorGroup.add(fHub);
  }

  ruralGroup.add(tractorGroup);

  group.add(ruralGroup);
}

// -----------------------------------------------------------------------------
// 8. DISTRICT 3: CAPITAL TOWN & CENTRAL BUSINESS DISTRICT (East District)
// -----------------------------------------------------------------------------
function createCapitalTown(
  group: THREE.Group,
  clickableBuildings: THREE.Mesh[],
  materials: MaterialLibrary,
  foliageGroup: THREE.Group
) {
  const capGroup = new THREE.Group();
  capGroup.name = 'District3_CapitalTown';

  function registerClickable(mesh: THREE.Mesh, buildingId: string) {
    mesh.userData = { isClickableBuilding: true, buildingId };
    clickableBuildings.push(mesh);
  }

  // 1. Capital Municipal City Hall & Grand Colonnade at (132, 0, 18)
  const hallGroup = new THREE.Group();
  hallGroup.position.set(132, 0, 18);

  const hallBaseGeo = new THREE.BoxGeometry(18.0, 7.5, 12.0);
  const hallBase = new THREE.Mesh(hallBaseGeo, materials.capitalGranite);
  hallBase.position.y = 3.75;
  hallBase.castShadow = true;
  hallBase.receiveShadow = true;
  registerClickable(hallBase, 'capital-city-hall');
  hallGroup.add(hallBase);

  // Monumental Colonnade Pillars along front facade
  for (let px = -7.5; px <= 7.5; px += 3.0) {
    const colGeo = new THREE.CylinderGeometry(0.38, 0.44, 7.2, 12);
    const col = new THREE.Mesh(colGeo, materials.capitalGranite);
    col.position.set(px, 3.8, -6.4);
    col.castShadow = true;
    hallGroup.add(col);
  }

  // Grand Portico Pediment
  const pedGeo = new THREE.BoxGeometry(18.4, 1.8, 3.2);
  const ped = new THREE.Mesh(pedGeo, materials.capitalGranite);
  ped.position.set(0, 8.2, -5.2);
  ped.castShadow = true;
  hallGroup.add(ped);

  // Central Clock Tower with Gold Dome
  const towerGeo = new THREE.BoxGeometry(4.5, 8.5, 4.5);
  const tower = new THREE.Mesh(towerGeo, materials.capitalGranite);
  tower.position.set(0, 11.5, 0);
  tower.castShadow = true;
  registerClickable(tower, 'capital-city-hall');
  hallGroup.add(tower);

  // Clock faces on 4 sides
  const clockGeo = new THREE.CircleGeometry(1.1, 16);
  for (const rotY of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const clock = new THREE.Mesh(clockGeo, materials.lampGlow);
    clock.position.set(0, 12.8, 2.3);
    clock.rotation.y = rotY;
    tower.add(clock);
  }

  const domeGeo = new THREE.SphereGeometry(2.4, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
  const dome = new THREE.Mesh(domeGeo, materials.capitalGoldTrim);
  dome.position.set(0, 15.75, 0);
  tower.add(dome);
  capGroup.add(hallGroup);

  // 2. Capital Financial Tower (28m Modern Glass-and-Steel Skyscraper) at (130, 0, -14.5)
  const finGroup = new THREE.Group();
  finGroup.position.set(130, 0, -14.5);

  const finBaseGeo = new THREE.BoxGeometry(13.0, 26.0, 9.5);
  const finBase = new THREE.Mesh(finBaseGeo, materials.capitalGlassTower);
  finBase.position.y = 13.0;
  finBase.castShadow = true;
  finBase.receiveShadow = true;
  registerClickable(finBase, 'capital-financial-tower');
  finGroup.add(finBase);

  // Structural dark steel exterior mullions
  for (let layer = 2.5; layer <= 24.5; layer += 4.5) {
    const bandGeo = new THREE.BoxGeometry(13.4, 0.35, 9.9);
    const band = new THREE.Mesh(bandGeo, materials.capitalDarkSteel);
    band.position.y = layer;
    finGroup.add(band);
  }

  // Rooftop communications mast & helipad
  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.16, 6.5, 8), materials.metalSteel);
  mast.position.set(0, 29.25, 0);
  finGroup.add(mast);

  const helipadGeo = new THREE.CylinderGeometry(3.5, 3.5, 0.3, 16);
  const helipad = new THREE.Mesh(helipadGeo, materials.asphaltMaterial);
  helipad.position.set(0, 26.15, 0);
  finGroup.add(helipad);
  capGroup.add(finGroup);

  // 3. Capital Banking & Stock Exchange at (117.4, 0, -14.5)
  const bankGroup = new THREE.Group();
  bankGroup.position.set(117.4, 0, -14.5);

  const bankBaseGeo = new THREE.BoxGeometry(10.8, 14.0, 9.5);
  const bankBase = new THREE.Mesh(bankBaseGeo, materials.modernDarkSlate);
  bankBase.position.y = 7.0;
  bankBase.castShadow = true;
  registerClickable(bankBase, 'capital-banking-exchange');
  bankGroup.add(bankBase);

  // Glass Atrium curtain wall
  const atriumGeo = new THREE.BoxGeometry(9.0, 11.5, 1.2);
  const atrium = new THREE.Mesh(atriumGeo, materials.capitalGlassTower);
  atrium.position.set(0, 7.0, 4.6);
  bankGroup.add(atrium);
  capGroup.add(bankGroup);

  // 4. Capital Grand Department Store & Galleria at (144, 0, -14.5)
  const galleriaGroup = new THREE.Group();
  galleriaGroup.position.set(144, 0, -14.5);

  const gallBaseGeo = new THREE.BoxGeometry(14.0, 11.0, 9.5);
  const gallBase = new THREE.Mesh(gallBaseGeo, materials.modernWarmBeige);
  gallBase.position.y = 5.5;
  gallBase.castShadow = true;
  registerClickable(gallBase, 'capital-department-store');
  galleriaGroup.add(gallBase);

  // Curved illuminated storefront display ribbon
  const storeGeo = new THREE.BoxGeometry(14.2, 3.2, 9.7);
  const storeMesh = new THREE.Mesh(storeGeo, materials.glassWindowDay);
  storeMesh.position.y = 2.0;
  galleriaGroup.add(storeMesh);
  capGroup.add(galleriaGroup);

  // 5. Capital General Hospital & Emergency Center at (86, 0, 18)
  const hospGroup = new THREE.Group();
  hospGroup.position.set(86, 0, 18);

  const hospBaseGeo = new THREE.BoxGeometry(14.0, 10.5, 10.0);
  const hospBase = new THREE.Mesh(hospBaseGeo, materials.modernWhiteStucco);
  hospBase.position.y = 5.25;
  hospBase.castShadow = true;
  hospBase.receiveShadow = true;
  registerClickable(hospBase, 'capital-hospital');
  hospGroup.add(hospBase);

  // Hospital Ambulance ER entrance canopy
  const erCanopyGeo = new THREE.BoxGeometry(8.5, 0.4, 5.0);
  const erCanopy = new THREE.Mesh(erCanopyGeo, materials.modernDarkSlate);
  erCanopy.position.set(0, 3.8, -6.5);
  hospGroup.add(erCanopy);

  // Red Cross Illuminated Emblem
  const hCross1 = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.75, 0.15), materials.medicalCrossRed);
  hCross1.position.set(0, 8.2, 5.1);
  hospGroup.add(hCross1);

  const hCross2 = new THREE.Mesh(new THREE.BoxGeometry(0.75, 2.4, 0.15), materials.medicalCrossRed);
  hCross2.position.set(0, 8.2, 5.1);
  hospGroup.add(hCross2);
  capGroup.add(hospGroup);

  // 6. Capital University / College Main Hall at (120, 0, 50)
  const uniGroup = new THREE.Group();
  uniGroup.position.set(120, 0, 50);

  const uniBaseGeo = new THREE.BoxGeometry(15.0, 8.5, 10.5);
  const uniBase = new THREE.Mesh(uniBaseGeo, materials.clayBrickMaterial);
  uniBase.position.y = 4.25;
  uniBase.castShadow = true;
  uniBase.receiveShadow = true;
  registerClickable(uniBase, 'capital-university');
  uniGroup.add(uniBase);

  // Arched portal & copper roof
  const uniRoofGeo = new THREE.ConeGeometry(9.8, 3.2, 4);
  uniRoofGeo.rotateY(Math.PI / 4);
  const uniRoof = new THREE.Mesh(uniRoofGeo, materials.metalBronze);
  uniRoof.position.y = 10.1;
  uniRoof.castShadow = true;
  registerClickable(uniRoof, 'capital-university');
  uniGroup.add(uniRoof);
  capGroup.add(uniGroup);

  // 7. Capital Central Public Library at (86, 0, 50)
  const libGroup = new THREE.Group();
  libGroup.position.set(86, 0, 50);

  const libBaseGeo = new THREE.BoxGeometry(13.5, 8.5, 10.0);
  const libBase = new THREE.Mesh(libBaseGeo, materials.capitalGranite);
  libBase.position.y = 4.25;
  libBase.castShadow = true;
  registerClickable(libBase, 'capital-library');
  libGroup.add(libBase);

  // Glass reading pavilion
  const libGlass = new THREE.Mesh(new THREE.BoxGeometry(11.0, 6.0, 1.2), materials.capitalGlassTower);
  libGlass.position.set(0, 4.5, -5.1);
  libGroup.add(libGlass);
  capGroup.add(libGroup);

  // 8. Grand Capital Plaza Hotel at (142, 0, 50)
  const hotelGroup = new THREE.Group();
  hotelGroup.position.set(142, 0, 50);

  const hotBaseGeo = new THREE.BoxGeometry(15.0, 15.0, 10.0);
  const hotBase = new THREE.Mesh(hotBaseGeo, materials.modernWarmBeige);
  hotBase.position.y = 7.5;
  hotBase.castShadow = true;
  registerClickable(hotBase, 'capital-hotel');
  hotelGroup.add(hotBase);

  const hotCanopy = new THREE.Mesh(new THREE.BoxGeometry(9.0, 0.4, 4.5), materials.capitalGoldTrim);
  hotCanopy.position.set(0, 3.4, -6.5);
  hotelGroup.add(hotCanopy);
  capGroup.add(hotelGroup);

  // 9. Capital Central Transit Bus Terminal Canopy at (78, 0, -16)
  const termGroup = new THREE.Group();
  termGroup.position.set(78, 0, -16);

  const termCanopyGeo = new THREE.BoxGeometry(10.0, 0.4, 7.5);
  const termCanopy = new THREE.Mesh(termCanopyGeo, materials.capitalDarkSteel);
  termCanopy.position.y = 3.6;
  termCanopy.castShadow = true;
  registerClickable(termCanopy, 'capital-bus-terminal-building');
  termGroup.add(termCanopy);

  // Steel supporting columns
  for (const cx of [-4.2, 4.2]) {
    for (const cz of [-3.0, 3.0]) {
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 3.6, 8), materials.capitalDarkSteel);
      col.position.set(cx, 1.8, cz);
      termGroup.add(col);
    }
  }

  // Terminal office kiosk
  const termOffice = new THREE.Mesh(new THREE.BoxGeometry(4.0, 3.2, 3.0), materials.glassWindowDay);
  termOffice.position.set(0, 1.6, 0);
  termGroup.add(termOffice);
  capGroup.add(termGroup);

  // 10. Capital Skyrise Residential Towers 1 & 2 at (90, 0, 72) and (130, 0, 72)
  for (const tx of [90, 130]) {
    const tGroup = new THREE.Group();
    tGroup.position.set(tx, 0, 72);

    const tGeo = new THREE.BoxGeometry(13.0, 20.0, 9.5);
    const tMesh = new THREE.Mesh(tGeo, materials.modernDarkSlate);
    tMesh.position.y = 10.0;
    tMesh.castShadow = true;
    registerClickable(tMesh, 'capital-residential-tower-1');
    tGroup.add(tMesh);

    // Glass balcony bands
    for (let by = 3.0; by <= 18.0; by += 3.0) {
      const balcGeo = new THREE.BoxGeometry(13.4, 0.85, 9.9);
      const balc = new THREE.Mesh(balcGeo, materials.capitalGlassTower);
      balc.position.y = by;
      tGroup.add(balc);
    }
    capGroup.add(tGroup);
  }

  // 11. Capital Civic Plaza Fountain at (118, 0, 15)
  const fGroup = new THREE.Group();
  fGroup.position.set(118, 0, 15);

  const fBasinGeo = new THREE.CylinderGeometry(4.2, 4.5, 0.8, 24);
  const fBasin = new THREE.Mesh(fBasinGeo, materials.capitalGranite);
  fBasin.position.y = 0.4;
  fBasin.castShadow = true;
  fGroup.add(fBasin);

  const fWaterGeo = new THREE.CylinderGeometry(3.9, 3.9, 0.1, 24);
  const fWater = new THREE.Mesh(fWaterGeo, materials.lakeWaterMaterial);
  fWater.position.y = 0.65;
  fGroup.add(fWater);

  const fTierGeo = new THREE.CylinderGeometry(1.6, 1.8, 1.2, 16);
  const fTier = new THREE.Mesh(fTierGeo, materials.capitalGranite);
  fTier.position.y = 1.2;
  fGroup.add(fTier);
  capGroup.add(fGroup);

  // 12. High-Tech Capital EV Fast-Charging Hub
  const evHubGroup = new THREE.Group();
  evHubGroup.position.set(65, 0.14, -16);

  // Concrete charging bay apron
  const evApron = new THREE.Mesh(new THREE.BoxGeometry(9.5, 0.18, 7.5), materials.concreteCurbs);
  evApron.position.y = 0.09;
  evApron.receiveShadow = true;
  evHubGroup.add(evApron);

  // Cantilevered Solar Canopy Roof
  const canopyPost1 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 0.24), materials.capitalDarkSteel);
  canopyPost1.position.set(-4.5, 2.1, -3.2);
  evHubGroup.add(canopyPost1);

  const canopyPost2 = new THREE.Mesh(new THREE.BoxGeometry(0.24, 4.2, 0.24), materials.capitalDarkSteel);
  canopyPost2.position.set(4.5, 2.1, -3.2);
  evHubGroup.add(canopyPost2);

  const solarRoof = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.22, 8.2), materials.capitalGlassTower);
  solarRoof.position.set(0, 4.2, 0.2);
  solarRoof.rotation.x = -0.08;
  evHubGroup.add(solarRoof);

  // 4 Fast Charging Kiosks with glowing cyan LED status
  for (let k = 0; k < 4; k++) {
    const kx = -3.6 + k * 2.4;
    const kioskGroup = new THREE.Group();
    kioskGroup.position.set(kx, 0.18, -2.8);

    // Kiosk pedestal
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(0.65, 1.8, 0.4), materials.capitalDarkSteel);
    pedestal.position.y = 0.9;
    pedestal.castShadow = true;
    kioskGroup.add(pedestal);

    // Cyan touch screen
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.6, 0.05), materials.glassWindowDay);
    screen.position.set(0, 1.25, 0.2);
    kioskGroup.add(screen);

    // Glowing cyan LED connector holster
    const holster = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.15), materials.lampGlow);
    holster.position.set(0.22, 0.95, 0.2);
    kioskGroup.add(holster);

    // Charging cable loop
    const cable = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 6, 12), materials.carTireRubber);
    cable.position.set(0.25, 0.7, 0.15);
    kioskGroup.add(cable);

    evHubGroup.add(kioskGroup);
  }
  capGroup.add(evHubGroup);

  // 13. Modern Transit Bus Passenger Shelters along Capital Boulevard
  const shelterXPositions = [86, 120];
  shelterXPositions.forEach((sx) => {
    const bShelterGroup = new THREE.Group();
    bShelterGroup.position.set(sx, 0.16, 5.6);

    // Steel framework
    const bPost1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), materials.capitalDarkSteel);
    bPost1.position.set(-1.8, 1.4, 0);
    bPost1.castShadow = true;
    bShelterGroup.add(bPost1);

    const bPost2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.8, 8), materials.capitalDarkSteel);
    bPost2.position.set(1.8, 1.4, 0);
    bPost2.castShadow = true;
    bShelterGroup.add(bPost2);

    // Curved tempered glass canopy
    const bGlass = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.08, 1.8), materials.capitalGlassTower);
    bGlass.position.set(0, 2.75, 0.5);
    bGlass.rotation.x = 0.06;
    bShelterGroup.add(bGlass);

    // Integrated stainless steel passenger bench
    const benchMat = materials.metalSteel;
    const bBench = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.06, 0.4), benchMat);
    bBench.position.set(0, 0.5, 0.2);
    bBench.castShadow = true;
    bShelterGroup.add(bBench);

    // Timetable / route map info totem with glowing schedule head
    const totem = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.2, 0.15), materials.capitalDarkSteel);
    totem.position.set(2.4, 1.1, 0);
    bShelterGroup.add(totem);

    const totemMap = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.8, 0.02), materials.lampGlow);
    totemMap.position.set(2.4, 1.4, 0.08);
    bShelterGroup.add(totemMap);

    capGroup.add(bShelterGroup);
  });

  // 14. Capital City Hall Ceremonial Flags & Ornate Twin-Globe Plaza Lamp Standards
  const flagGroup = new THREE.Group();
  flagGroup.position.set(135, 0.16, 6.5);

  for (const fx of [-4.5, 0, 4.5]) {
    // Monumental 10m steel flagpole
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.1, 9.5, 10), materials.metalSteel);
    pole.position.set(fx, 4.75, 0);
    pole.castShadow = true;
    flagGroup.add(pole);

    // Gold finial sphere on top
    const finial = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), materials.capitalGoldTrim);
    finial.position.set(fx, 9.6, 0);
    flagGroup.add(finial);

    // Fluttering ceremonial flag
    const flagGeo = new THREE.PlaneGeometry(1.8, 1.1, 4, 2);
    const flagMesh = new THREE.Mesh(flagGeo, materials.carPaintBlue);
    flagMesh.position.set(fx + 0.9, 8.8, 0);
    flagGroup.add(flagMesh);
  }

  // Classical Twin-Globe bronze plaza lampposts
  for (const lx of [-9.5, 9.5]) {
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 5.0, 10), materials.metalBronze);
    lampPost.position.set(lx, 2.5, 0.5);
    lampPost.castShadow = true;
    flagGroup.add(lampPost);

    for (const gx of [-0.6, 0.6]) {
      const globe = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), materials.lampGlow);
      globe.position.set(lx + gx, 5.1, 0.5);
      flagGroup.add(globe);
    }
  }

  capGroup.add(flagGroup);

  group.add(capGroup);
}
