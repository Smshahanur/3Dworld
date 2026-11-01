import * as THREE from 'three';
import { MaterialLibrary } from './materials';

export interface AnimatedLandmarkComponents {
  fountainWater: THREE.Mesh;
  fountainSpout: THREE.Mesh;
  playgroundSwing: THREE.Group;
  foliageWindGroup: THREE.Group;
  floatingBeaconMarkers: THREE.Group;
  mooredRowboat?: THREE.Group;
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
  // 5. LAKE DISTRICT RECREATION & PICNIC GROUNDS
  // ========================================================
  const lakeAnim = createLakeRecreation(villageGroup, clickableBuildingMeshes, materials);
  createBeaconMarker('lake-district', 'Lake District', 5, 3.8, -42, 0x06b6d4);

  // ========================================================
  // 6. STREET FURNITURE, MODERN CARS & WAYFINDING
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

  // Pedestrian Plaza Pavers with subtle expansion joints
  const plazaGeo = new THREE.PlaneGeometry(30, 24);
  plazaGeo.rotateX(-Math.PI / 2);
  const plazaMesh = new THREE.Mesh(plazaGeo, materials.plazaPaverMaterial);
  plazaMesh.position.set(4, 0.12, 0);
  plazaMesh.receiveShadow = true;
  centerGroup.add(plazaMesh);

  // Decorative protective bollards separating plaza from main street
  for (let bx = -10; bx <= 18; bx += 2.8) {
    const bollardGeo = new THREE.CylinderGeometry(0.1, 0.12, 0.85, 10);
    const bollard = new THREE.Mesh(bollardGeo, materials.metalBlack);
    bollard.position.set(bx, 0.42, 4.2);
    bollard.castShadow = true;
    centerGroup.add(bollard);

    // Reflective top ring on bollard
    const bRingGeo = new THREE.CylinderGeometry(0.105, 0.105, 0.08, 10);
    const bRing = new THREE.Mesh(bRingGeo, materials.roadMarkingWhite);
    bRing.position.set(bx, 0.72, 4.2);
    centerGroup.add(bRing);
  }

  // Building A: Civic Center / Library with Modern Glass Atrium & Clock Tower
  const civicGroup = new THREE.Group();
  civicGroup.position.set(-6, 0, -8);

  // Ground plinth foundation (prevents clipping or floating)
  const civicPlinth = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.3, 8.6), materials.concreteCurbs);
  civicPlinth.position.y = 0.15;
  civicPlinth.receiveShadow = true;
  civicGroup.add(civicPlinth);

  // Main civic hall block - CLICKABLE
  const civicMainGeo = new THREE.BoxGeometry(14, 5.5, 8);
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

  // Building B: Corner Café with Striped Awnings, Mullioned Windows & Outdoor Terrace
  const cafeGroup = new THREE.Group();
  cafeGroup.position.set(10, 0, -8);

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
  const awningGeo = new THREE.BoxGeometry(8.2, 0.2, 2.2);
  const awning = new THREE.Mesh(awningGeo, materials.awningStriped);
  awning.position.set(0, 3.1, 4.7);
  awning.rotation.x = 0.22;
  awning.castShadow = true;
  cafeGroup.add(awning);

  // Outdoor Terrace: Tables, Parasols & Chairs
  const tablePositions = [
    { x: -2.2, z: 6.4 },
    { x: 1.8, z: 6.4 },
    { x: -0.2, z: 8.6 },
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
  const shopGroup = new THREE.Group();
  shopGroup.position.set(8, 0, 9);

  // Foundation Plinth
  const shopPlinth = new THREE.Mesh(new THREE.BoxGeometry(13.5, 0.25, 7.5), materials.concreteCurbs);
  shopPlinth.position.y = 0.125;
  shopGroup.add(shopPlinth);

  const shopGeo = new THREE.BoxGeometry(13, 5.0, 7);
  const shop = new THREE.Mesh(shopGeo, materials.modernDarkSlate);
  shop.position.y = 2.625;
  shop.castShadow = true;
  shop.receiveShadow = true;
  shop.userData = { isBuilding: true, buildingId: 'retail-arcade' };
  clickableBuildings.push(shop);
  shopGroup.add(shop);

  // Glazed storefront with mullions
  const shopWinGeo = new THREE.BoxGeometry(10.5, 2.6, 0.2);
  const shopWin = new THREE.Mesh(shopWinGeo, materials.glassWindowDay);
  shopWin.position.set(0, 1.8, -3.55);
  shopGroup.add(shopWin);

  for (let sx = -4; sx <= 4; sx += 2) {
    const sm = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.7, 0.24), materials.metalSteel);
    sm.position.set(sx, 1.8, -3.55);
    shopGroup.add(sm);
  }

  // Wood entrance canopy
  const canopyGeo = new THREE.BoxGeometry(6.4, 0.2, 2.0);
  const canopy = new THREE.Mesh(canopyGeo, materials.modernWoodSiding);
  canopy.position.set(0, 3.3, -4.3);
  canopy.castShadow = true;
  shopGroup.add(canopy);

  // Potted Topiary Shrubs flanking shop entrance
  for (const px of [-3.8, 3.8]) {
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.25, 0.6, 12), materials.concreteCurbs);
    pot.position.set(px, 0.3, -4.2);
    shopGroup.add(pot);

    const shrub = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), materials.hedgeBoxwood);
    shrub.position.set(px, 0.8, -4.2);
    shrub.castShadow = true;
    shopGroup.add(shrub);
  }

  centerGroup.add(shopGroup);

  // Modern Plaza Monument / Fountain Basin
  const plazaFountainGeo = new THREE.CylinderGeometry(2.4, 2.6, 0.5, 24);
  const plazaFountain = new THREE.Mesh(plazaFountainGeo, materials.modernDarkSlate);
  plazaFountain.position.set(4, 0.35, 0);
  plazaFountain.castShadow = true;
  centerGroup.add(plazaFountain);

  const waterDiscGeo = new THREE.CylinderGeometry(2.1, 2.1, 0.1, 24);
  const waterDisc = new THREE.Mesh(waterDiscGeo, materials.lakeWaterMaterial);
  waterDisc.position.set(4, 0.55, 0);
  centerGroup.add(waterDisc);

  // Center bronze water jet ring
  const bronzeJetGeo = new THREE.CylinderGeometry(0.4, 0.45, 0.6, 16);
  const bronzeJet = new THREE.Mesh(bronzeJetGeo, materials.metalBronze);
  bronzeJet.position.set(4, 0.65, 0);
  centerGroup.add(bronzeJet);

  // ========================================================
  // Civic Building D: Village Health Clinic & Urgent Care - CLICKABLE
  // World pos: (-26, 0, 16) -> centerGroup relative (-6, 0, 16)
  // ========================================================
  const clinicGroup = new THREE.Group();
  clinicGroup.position.set(-6, 0, 16);

  const clinicPlinth = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.3, 9.6), materials.concreteCurbs);
  clinicPlinth.position.y = 0.15;
  clinicPlinth.receiveShadow = true;
  clinicGroup.add(clinicPlinth);

  // Main 2-story clinic building
  const clinicMainGeo = new THREE.BoxGeometry(13.0, 5.2, 9.0);
  const clinicMain = new THREE.Mesh(clinicMainGeo, materials.modernWhiteStucco);
  clinicMain.position.y = 2.75;
  clinicMain.castShadow = true;
  clinicMain.receiveShadow = true;
  clinicMain.userData = { isBuilding: true, buildingId: 'health-clinic' };
  clickableBuildings.push(clinicMain);
  clinicGroup.add(clinicMain);

  // Parapet Trim
  const clinicTrim = new THREE.Mesh(new THREE.BoxGeometry(13.4, 0.3, 9.4), materials.modernDarkSlate);
  clinicTrim.position.y = 5.4;
  clinicGroup.add(clinicTrim);

  // Glazed emergency & entrance canopy
  const canopyBox = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.2, 3.2), materials.metalSteel);
  canopyBox.position.set(0, 3.2, -4.8);
  canopyBox.castShadow = true;
  clinicGroup.add(canopyBox);

  // Red Medical Cross Emblem on Entrance Facade
  const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.4, 1.4, 0.1), materials.medicalCrossRed);
  crossV.position.set(0, 4.2, -4.56);
  clinicGroup.add(crossV);
  const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 0.1), materials.medicalCrossRed);
  crossH.position.set(0, 4.2, -4.56);
  clinicGroup.add(crossH);

  // Glass Frontage & Emergency Drop-off
  const clinicGlass = new THREE.Mesh(new THREE.BoxGeometry(9.0, 2.4, 0.2), materials.glassWindowDay);
  clinicGlass.position.set(0, 1.6, -4.55);
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

  const schoolPlinth = new THREE.Mesh(new THREE.BoxGeometry(16.8, 0.3, 10.8), materials.concreteCurbs);
  schoolPlinth.position.y = 0.15;
  schoolPlinth.receiveShadow = true;
  schoolGroup.add(schoolPlinth);

  // Main School Body
  const schoolMain = new THREE.Mesh(new THREE.BoxGeometry(16.0, 5.8, 10.0), materials.modernWarmBeige);
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
  // World pos: (-38, 0, -16) -> centerGroup relative (-18, 0, -16)
  // ========================================================
  const commGroup = new THREE.Group();
  commGroup.position.set(-18, 0, -16);

  const commPlinth = new THREE.Mesh(new THREE.BoxGeometry(14.6, 0.3, 10.6), materials.concreteCurbs);
  commPlinth.position.y = 0.15;
  commPlinth.receiveShadow = true;
  commGroup.add(commPlinth);

  // Curved Glulam Timber Hall Structure
  const commMain = new THREE.Mesh(new THREE.BoxGeometry(14.0, 5.0, 10.0), materials.modernWoodSiding);
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
  resGroup.position.set(-32, 0, 42);

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

  // Villa 1: North Lane East (Cedar Horizon Villa) - CLICKABLE
  buildModernVilla(-8, 8, 0, 'white-wood', 'villa-cedar');
  // Villa 2: North Lane Center (Dark Slate Contemporary Villa) - CLICKABLE
  buildModernVilla(8, 8, 0, 'dark-slate', 'villa-slate');
  // Villa 3: North Lane West (Terracotta Gable Residence) - CLICKABLE
  buildModernVilla(22, 8, 0, 'terracotta', 'villa-terracotta');

  // Villa 4: South Lane (Facing opposite)
  buildModernVilla(-8, -8, Math.PI, 'terracotta');
  // Villa 5: South Lane Center
  buildModernVilla(8, -8, Math.PI, 'white-wood');
  // Villa 6: South Lane East
  buildModernVilla(22, -8, Math.PI, 'dark-slate');

  // Multi-Story Contemporary Apartment Building on Corner - CLICKABLE
  const aptGroup = new THREE.Group();
  aptGroup.position.set(-22, 0, 0);

  // Plinth foundation
  const aptPlinth = new THREE.Mesh(new THREE.BoxGeometry(11.6, 0.3, 9.6), materials.concreteCurbs);
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
  // World pos: (-50, 0, 60) -> resGroup relative (-18, 0, 18)
  // ========================================================
  const thGroup = new THREE.Group();
  thGroup.position.set(-18, 0, 18);

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
  parkGroup.position.set(22, 0, -6);

  // Expansive Park Lawn with Sculpted Perimeter
  const lawnGeo = new THREE.BoxGeometry(40, 0.24, 36);
  const lawn = new THREE.Mesh(lawnGeo, materials.parkLawnMaterial);
  lawn.position.y = 0.12;
  lawn.receiveShadow = true;
  parkGroup.add(lawn);

  // Winding Gravel Walking Paths across the park
  const path1Geo = new THREE.PlaneGeometry(38, 2.8);
  path1Geo.rotateX(-Math.PI / 2);
  const path1 = new THREE.Mesh(path1Geo, materials.gravelPathMaterial);
  path1.position.set(0, 0.25, 0);
  path1.receiveShadow = true;
  parkGroup.add(path1);

  const path2Geo = new THREE.PlaneGeometry(2.8, 34);
  path2Geo.rotateX(-Math.PI / 2);
  const path2 = new THREE.Mesh(path2Geo, materials.gravelPathMaterial);
  path2.position.set(0, 0.25, 0);
  path2.receiveShadow = true;
  parkGroup.add(path2);

  // 1. Grand Multi-Tiered Central Water Fountain
  const fountainGroup = new THREE.Group();
  fountainGroup.position.set(0, 0.24, 0);

  // Outer Stone Basin
  const basin1Geo = new THREE.CylinderGeometry(5.2, 5.5, 0.7, 36);
  const basin1 = new THREE.Mesh(basin1Geo, materials.modernDarkSlate);
  basin1.position.y = 0.35;
  basin1.castShadow = true;
  basin1.receiveShadow = true;
  fountainGroup.add(basin1);

  // Outer Basin Water
  const waterGeo = new THREE.CylinderGeometry(4.8, 4.8, 0.1, 36);
  const fountainWater = new THREE.Mesh(waterGeo, materials.lakeWaterMaterial);
  fountainWater.position.y = 0.65;
  fountainGroup.add(fountainWater);

  // Tier 2 Center Pedestal
  const pedGeo = new THREE.CylinderGeometry(1.4, 1.8, 1.6, 24);
  const ped = new THREE.Mesh(pedGeo, materials.modernDarkSlate);
  ped.position.y = 1.2;
  ped.castShadow = true;
  fountainGroup.add(ped);

  // Tier 2 Upper Basin
  const basin2Geo = new THREE.CylinderGeometry(2.6, 2.9, 0.45, 32);
  const basin2 = new THREE.Mesh(basin2Geo, materials.modernWhiteStucco);
  basin2.position.y = 2.1;
  basin2.castShadow = true;
  fountainGroup.add(basin2);

  // Fountain Jet Spout (Animated)
  const spoutGeo = new THREE.ConeGeometry(0.35, 1.6, 16);
  const fountainSpout = new THREE.Mesh(spoutGeo, materials.lakeWaterMaterial);
  fountainSpout.position.y = 2.9;
  fountainGroup.add(fountainSpout);

  parkGroup.add(fountainGroup);

  // 2. Classic Gazebo Pavilion with Columns & Copper Roof - CLICKABLE
  const gazeboGroup = new THREE.Group();
  gazeboGroup.position.set(-11, 0.24, 9);

  // Gazebo Base Dais
  const gBaseGeo = new THREE.CylinderGeometry(3.6, 3.8, 0.4, 8);
  const gBase = new THREE.Mesh(gBaseGeo, materials.modernWhiteStucco);
  gBase.position.y = 0.2;
  gBase.castShadow = true;
  gBase.userData = { isBuilding: true, buildingId: 'park-gazebo' };
  clickableBuildings.push(gBase);
  gazeboGroup.add(gBase);

  // 8 Perimeter Columns
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    const colGeo = new THREE.CylinderGeometry(0.12, 0.14, 2.8, 12);
    const col = new THREE.Mesh(colGeo, materials.modernWhiteStucco);
    col.position.set(Math.cos(ang) * 3.1, 1.6, Math.sin(ang) * 3.1);
    col.castShadow = true;
    gazeboGroup.add(col);
  }

  // Gazebo Octagonal Roof - CLICKABLE
  const gRoofGeo = new THREE.ConeGeometry(4.2, 2.2, 8);
  const gRoof = new THREE.Mesh(gRoofGeo, materials.roofTileTerracotta);
  gRoof.position.y = 3.9;
  gRoof.castShadow = true;
  gRoof.userData = { isBuilding: true, buildingId: 'park-gazebo' };
  clickableBuildings.push(gRoof);
  gazeboGroup.add(gRoof);

  parkGroup.add(gazeboGroup);

  // 3. Children's Adventure Playground
  const playGroup = new THREE.Group();
  playGroup.position.set(12, 0.24, -9);

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
  parkGroup.add(playGroup);

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
  // World pos: (32, 0, -6) -> parkGroup relative (10, 0, 0)
  // ========================================================
  const courtGroup = new THREE.Group();
  courtGroup.position.set(10, 0.22, 0);

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
  gardenGroup.position.set(28, 0, 36);

  // Garden Enclosure Perimeter Lawn
  const lawnGeo = new THREE.BoxGeometry(34, 0.22, 32);
  const lawn = new THREE.Mesh(lawnGeo, materials.parkLawnMaterial);
  lawn.position.y = 0.11;
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

  group.add(gardenGroup);
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
    { x: -14, z: 8, r: 0.1 },
    { x: -6, z: 9.5, r: -0.2 },
    { x: 14, z: 8.5, r: 0.3 },
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
  // World pos: (-12, 0, -35) -> lakeRecGroup relative (-17, 0, 7)
  // ========================================================
  const bhGroup = new THREE.Group();
  bhGroup.position.set(-17, 0.15, 7);

  // Timber Deck Foundation
  const deck = new THREE.Mesh(new THREE.BoxGeometry(10.6, 0.25, 8.6), materials.modernWoodSiding);
  deck.position.y = 0.125;
  deck.receiveShadow = true;
  bhGroup.add(deck);

  // Main Pavilion Timber Frame
  const bhMain = new THREE.Mesh(new THREE.BoxGeometry(10.0, 3.8, 8.0), materials.modernWoodSiding);
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

  // 2. Village Wayfinding Signpost at Roundabout Corner (-9, 0, 7)
  const signpost = new THREE.Group();
  signpost.position.set(-8.5, 0.18, 6.2);

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
  sign4.position.set(0, 1.7, -0.42);
  signpost.add(sign4);

  group.add(signpost);

  // 3. Modern Parked Vehicles for Scale (Sedan, Crossover SUV, Hatchback, Coupe)
  function buildCar(x: number, z: number, rotY: number, paintMat: THREE.MeshStandardMaterial) {
    const car = new THREE.Group();
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

  // Cars in Town Center Parking Lot
  buildCar(-28, -12, Math.PI / 2, materials.carPaintWhite);
  buildCar(-24, -12, Math.PI / 2, materials.carPaintBlue);
  buildCar(-20, -12, Math.PI / 2, materials.carPaintGrey);
  buildCar(-16, -12, Math.PI / 2, materials.carPaintRed);

  // Cars in Residential Driveways
  buildCar(-28, 46.5, 0, materials.carPaintWhite);
  buildCar(-10, 46.5, 0, materials.carPaintBlue);

  // 4. Tree-lined Avenues & Forest Buffers (Species: Oak, Birch, Cherry Blossom, Scots Pine)
  const treeCoords: {
    x: number;
    z: number;
    type: 'oak' | 'birch' | 'cherry' | 'pine';
    scale: number;
  }[] = [];

  // Boulevard Verge Trees
  for (let x = -38; x <= 42; x += 9) {
    if (Math.abs(x - -5) > 8) {
      treeCoords.push({ x, z: 7.2, type: 'oak', scale: 1.0 });
      treeCoords.push({ x, z: -7.2, type: 'birch', scale: 0.95 });
    }
  }

  // Residential Street Trees
  for (let z = 18; z <= 62; z += 10) {
    treeCoords.push({ x: -12.4, z, type: 'pine', scale: 1.05 });
  }

  // Central Park Decorative Trees (Deciduous, Birch & Flowering Cherry)
  const parkTrees = [
    { x: 10, z: -16, type: 'cherry', scale: 1.15 },
    { x: 34, z: -16, type: 'birch', scale: 1.2 },
    { x: 36, z: 6, type: 'oak', scale: 1.1 },
    { x: 10, z: 8, type: 'cherry', scale: 1.1 },
    { x: 26, z: -18, type: 'pine', scale: 1.15 },
    { x: 18, z: 12, type: 'oak', scale: 1.05 },
    { x: 38, z: -6, type: 'birch', scale: 1.2 },
  ];
  parkTrees.forEach((pt) => treeCoords.push(pt as any));

  // Build each tree with varied multi-part procedural geometry and appropriate species silhouettes
  treeCoords.forEach((tc) => {
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
