import * as THREE from 'three';
import { MaterialLibrary } from '../world/materials';
import { CatalogItem } from './types';

// Helper to assemble procedural models with proper shadows and bottom-center pivots
export const CATALOG_ITEMS: CatalogItem[] = [
  // ===========================================================================
  // 1. RESIDENTIAL
  // ===========================================================================
  {
    id: 'res-small-house',
    name: 'Small Modern House',
    category: 'residential',
    footprint: { width: 6, depth: 6, height: 4.5 },
    cost: 650,
    description: 'Compact single-family home with cedar cladding and pitched dark metal roof.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Foundation plinth
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 6), materials.concreteCurbs);
      plinth.position.y = 0.1;
      g.add(plinth);

      // Main body
      const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.8, 5.4), materials.modernWhiteStucco);
      body.position.y = 1.6;
      body.castShadow = !isSoftwareGl;
      body.receiveShadow = true;
      g.add(body);

      // Timber front accent
      const accent = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.7, 0.12), materials.modernWoodSiding);
      accent.position.set(1.2, 1.55, 2.75);
      g.add(accent);

      // Pitched Gable Roof
      const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 1.5, 4), materials.roofTileDark);
      roof.position.y = 3.75;
      roof.rotation.y = Math.PI / 4;
      roof.castShadow = !isSoftwareGl;
      g.add(roof);

      // Windows & Door
      const win = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 0.08), materials.glassWindowDay);
      win.position.set(-1.2, 1.8, 2.74);
      g.add(win);

      const door = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.08), materials.doorWood);
      door.position.set(1.2, 1.15, 2.78);
      g.add(door);

      return g;
    },
  },
  {
    id: 'res-medium-house',
    name: 'Medium Modern House',
    category: 'residential',
    footprint: { width: 8, depth: 8, height: 5.5 },
    cost: 1100,
    description: 'Two-story contemporary residence with glass balcony and warm cedar accents.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Foundation
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(8, 0.24, 8), materials.concreteCurbs);
      plinth.position.y = 0.12;
      g.add(plinth);

      // Ground floor
      const ground = new THREE.Mesh(new THREE.BoxGeometry(7.4, 2.6, 7.4), materials.modernWhiteStucco);
      ground.position.y = 1.54;
      ground.castShadow = !isSoftwareGl;
      ground.receiveShadow = true;
      g.add(ground);

      // Second floor offset
      const upper = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.4, 5.8), materials.modernDarkSlate);
      upper.position.set(-0.4, 4.04, -0.6);
      upper.castShadow = !isSoftwareGl;
      g.add(upper);

      // Timber balcony deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.14, 2.4), materials.modernWoodSiding);
      deck.position.set(1.2, 2.88, 2.2);
      g.add(deck);

      // Glass railing
      const rail = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.7, 0.06), materials.greenhouseGlass);
      rail.position.set(1.2, 3.3, 3.4);
      g.add(rail);

      // Roof flat cap
      const roofCap = new THREE.Mesh(new THREE.BoxGeometry(6.8, 0.16, 6.2), materials.roofTileDark);
      roofCap.position.set(-0.4, 5.32, -0.6);
      g.add(roofCap);

      // Front entry door
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.0, 0.08), materials.doorWood);
      door.position.set(1.2, 1.2, 3.74);
      g.add(door);

      return g;
    },
  },
  {
    id: 'res-large-villa',
    name: 'Large Luxury Villa',
    category: 'residential',
    footprint: { width: 10, depth: 10, height: 6.2 },
    cost: 1800,
    description: 'Spacious architectural villa with cantilevered sundeck, masonry chimney, and panoramic windows.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Base
      const base = new THREE.Mesh(new THREE.BoxGeometry(10, 0.28, 10), materials.concreteCurbs);
      base.position.y = 0.14;
      g.add(base);

      // Main lower wing
      const lower = new THREE.Mesh(new THREE.BoxGeometry(9.2, 2.8, 8.4), materials.modernWhiteStucco);
      lower.position.set(0, 1.68, -0.4);
      lower.castShadow = !isSoftwareGl;
      g.add(lower);

      // Upper floor with cedar cladding
      const upper = new THREE.Mesh(new THREE.BoxGeometry(8.0, 2.6, 6.2), materials.modernWoodSiding);
      upper.position.set(-0.6, 4.38, 0.4);
      upper.castShadow = !isSoftwareGl;
      g.add(upper);

      // Stone chimney column
      const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 6.4, 1.4), materials.modernDarkSlate);
      chimney.position.set(3.8, 3.2, -1.5);
      chimney.castShadow = !isSoftwareGl;
      g.add(chimney);

      // Panoramic glass facade
      const glass = new THREE.Mesh(new THREE.BoxGeometry(5.4, 2.0, 0.1), materials.glassWindowDay);
      glass.position.set(-0.6, 4.38, 3.52);
      g.add(glass);

      // Roof eaves
      const eaves = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.18, 6.8), materials.roofTileDark);
      eaves.position.set(-0.6, 5.76, 0.4);
      g.add(eaves);

      return g;
    },
  },
  {
    id: 'res-townhouse',
    name: 'Terraced Townhouse',
    category: 'residential',
    footprint: { width: 6, depth: 8, height: 6.0 },
    cost: 900,
    description: 'Two-story urban townhouse with private entrance stoop and cedar slat accents.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(6, 0.3, 8), materials.concreteCurbs);
      plinth.position.y = 0.15;
      g.add(plinth);

      const main = new THREE.Mesh(new THREE.BoxGeometry(5.5, 5.2, 7.2), materials.modernWarmBeige);
      main.position.y = 2.9;
      main.castShadow = !isSoftwareGl;
      g.add(main);

      const verticalWood = new THREE.Mesh(new THREE.BoxGeometry(1.8, 5.1, 0.12), materials.modernWoodSiding);
      verticalWood.position.set(-1.4, 2.85, 3.65);
      g.add(verticalWood);

      const winUpper = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.4, 0.08), materials.glassWindowDay);
      winUpper.position.set(1.2, 4.2, 3.65);
      g.add(winUpper);

      const stoop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.4, 1.2), materials.concreteCurbs);
      stoop.position.set(-1.4, 0.2, 4.2);
      g.add(stoop);

      const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.08), materials.doorWood);
      door.position.set(-1.4, 1.45, 3.65);
      g.add(door);

      return g;
    },
  },
  {
    id: 'res-apartment',
    name: 'Modern Apartment Complex',
    category: 'residential',
    footprint: { width: 10, depth: 12, height: 9.0 },
    cost: 2600,
    description: 'Three-story multi-unit modern residential building with balconies and glazed lobby.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 12), materials.concreteCurbs);
      plinth.position.y = 0.15;
      g.add(plinth);

      const body = new THREE.Mesh(new THREE.BoxGeometry(9.4, 8.2, 11.2), materials.modernWhiteStucco);
      body.position.y = 4.4;
      body.castShadow = !isSoftwareGl;
      g.add(body);

      // Balconies
      for (let floor = 1; floor <= 2; floor++) {
        const balc = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.18, 1.4), materials.modernWoodSiding);
        balc.position.set(0, floor * 2.8 + 0.3, 5.8);
        g.add(balc);

        const glassRail = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.7, 0.08), materials.greenhouseGlass);
        glassRail.position.set(0, floor * 2.8 + 0.75, 6.45);
        g.add(glassRail);
      }

      // Lobby glass
      const lobby = new THREE.Mesh(new THREE.BoxGeometry(4.0, 2.4, 0.1), materials.glassWindowDay);
      lobby.position.set(0, 1.4, 5.62);
      g.add(lobby);

      // Parapet roof rim
      const parapet = new THREE.Mesh(new THREE.BoxGeometry(9.8, 0.3, 11.6), materials.roofTileDark);
      parapet.position.y = 8.6;
      g.add(parapet);

      return g;
    },
  },

  // ===========================================================================
  // 2. COMMERCIAL
  // ===========================================================================
  {
    id: 'com-small-shop',
    name: 'Boutique Corner Shop',
    category: 'commercial',
    footprint: { width: 6, depth: 6, height: 4.2 },
    cost: 750,
    description: 'Cozy retail storefront with large display windows and a shaded awning.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(6, 0.2, 6), materials.concreteCurbs);
      plinth.position.y = 0.1;
      g.add(plinth);

      const body = new THREE.Mesh(new THREE.BoxGeometry(5.4, 3.2, 5.4), materials.modernDarkSlate);
      body.position.y = 1.8;
      body.castShadow = !isSoftwareGl;
      g.add(body);

      // Display window
      const disp = new THREE.Mesh(new THREE.BoxGeometry(3.6, 1.8, 0.1), materials.glassWindowDay);
      disp.position.set(-0.5, 1.5, 2.74);
      g.add(disp);

      // Awning
      const awning = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 1.4), materials.awningStriped);
      awning.position.set(-0.5, 2.7, 3.2);
      awning.rotation.x = 0.2;
      g.add(awning);

      // Entry door
      const door = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.1, 0.08), materials.metalBlack);
      door.position.set(1.8, 1.25, 2.74);
      g.add(door);

      return g;
    },
  },
  {
    id: 'com-cafe',
    name: 'Village Café & Terrace',
    category: 'commercial',
    footprint: { width: 7, depth: 7, height: 4.0 },
    cost: 850,
    description: 'Outdoor café with striped canopy and sun terrace tables.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Timber deck
      const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.18, 7), materials.modernWoodSiding);
      deck.position.y = 0.09;
      g.add(deck);

      // Café kiosk
      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(3.8, 3.0, 3.8), materials.modernWarmBeige);
      kiosk.position.set(-1.2, 1.6, -1.2);
      kiosk.castShadow = !isSoftwareGl;
      g.add(kiosk);

      // Serving window
      const win = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.4, 0.1), materials.glassWindowDay);
      win.position.set(-1.2, 1.7, 0.72);
      g.add(win);

      // Terrace umbrella
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 8), materials.metalSteel);
      pole.position.set(1.8, 1.2, 1.6);
      g.add(pole);

      const canopy = new THREE.Mesh(new THREE.ConeGeometry(1.4, 0.5, 8), materials.awningStriped);
      canopy.position.set(1.8, 2.3, 1.6);
      g.add(canopy);

      // Table & chairs
      const table = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.8, 12), materials.timberBench);
      table.position.set(1.8, 0.49, 1.6);
      g.add(table);

      return g;
    },
  },
  {
    id: 'com-restaurant',
    name: 'Promenade Bistro Restaurant',
    category: 'commercial',
    footprint: { width: 9, depth: 9, height: 5.0 },
    cost: 1400,
    description: 'Two-story dining bistro with outdoor seating and roof pergola.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(9, 0.24, 9), materials.concreteCurbs);
      plinth.position.y = 0.12;
      g.add(plinth);

      const main = new THREE.Mesh(new THREE.BoxGeometry(8.2, 4.0, 7.8), materials.modernDarkSlate);
      main.position.y = 2.24;
      main.castShadow = !isSoftwareGl;
      g.add(main);

      // Glass front
      const glass = new THREE.Mesh(new THREE.BoxGeometry(6.4, 2.2, 0.1), materials.glassWindowDay);
      glass.position.set(0, 1.6, 4.02);
      g.add(glass);

      // Roof pergola
      const pergola = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.15, 8.2), materials.modernWoodSiding);
      pergola.position.y = 4.35;
      g.add(pergola);

      return g;
    },
  },
  {
    id: 'com-grocery',
    name: 'Village Organic Market',
    category: 'commercial',
    footprint: { width: 9, depth: 9, height: 4.8 },
    cost: 1200,
    description: 'Full-service neighborhood grocery market with curbside display shelves.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(9, 0.24, 9), materials.concreteCurbs);
      plinth.position.y = 0.12;
      g.add(plinth);

      const body = new THREE.Mesh(new THREE.BoxGeometry(8.4, 3.8, 8.0), materials.modernWhiteStucco);
      body.position.y = 2.14;
      body.castShadow = !isSoftwareGl;
      g.add(body);

      // Green signage banner
      const banner = new THREE.Mesh(new THREE.BoxGeometry(7.0, 0.6, 0.15), materials.carPaintEmerald);
      banner.position.set(0, 3.4, 4.1);
      g.add(banner);

      // Double glass entrance
      const glass = new THREE.Mesh(new THREE.BoxGeometry(4.8, 2.2, 0.1), materials.glassWindowDay);
      glass.position.set(0, 1.4, 4.05);
      g.add(glass);

      return g;
    },
  },
  {
    id: 'com-office',
    name: 'Civic Office Building',
    category: 'commercial',
    footprint: { width: 10, depth: 10, height: 8.5 },
    cost: 2800,
    description: 'Three-story glass and steel commercial office building.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 10), materials.concreteCurbs);
      plinth.position.y = 0.15;
      g.add(plinth);

      const core = new THREE.Mesh(new THREE.BoxGeometry(9.2, 7.8, 9.2), materials.modernDarkSlate);
      core.position.y = 4.2;
      core.castShadow = !isSoftwareGl;
      g.add(core);

      // Glass ribbon bands
      for (let floor = 1; floor <= 3; floor++) {
        const ribbon = new THREE.Mesh(new THREE.BoxGeometry(9.3, 1.2, 9.3), materials.glassWindowDay);
        ribbon.position.y = floor * 2.2 - 0.2;
        g.add(ribbon);
      }

      return g;
    },
  },

  // ===========================================================================
  // 3. PUBLIC FACILITIES
  // ===========================================================================
  {
    id: 'civ-school',
    name: 'Valley Academy & School',
    category: 'civic',
    footprint: { width: 12, depth: 12, height: 7.0 },
    cost: 3200,
    description: 'Two-story educational facility with solar clock tower and courtyard.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, 12), materials.concreteCurbs);
      plinth.position.y = 0.15;
      g.add(plinth);

      // Main classroom block
      const main = new THREE.Mesh(new THREE.BoxGeometry(11, 4.8, 6.5), materials.modernWarmBeige);
      main.position.set(0, 2.7, -2.2);
      main.castShadow = !isSoftwareGl;
      g.add(main);

      // Clock tower
      const tower = new THREE.Mesh(new THREE.BoxGeometry(2.4, 7.2, 2.4), materials.modernWhiteStucco);
      tower.position.set(-3.8, 3.9, 2.2);
      tower.castShadow = !isSoftwareGl;
      g.add(tower);

      const clockFace = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.1, 16), materials.metalSteel);
      clockFace.rotateX(Math.PI / 2);
      clockFace.position.set(-3.8, 6.2, 3.45);
      g.add(clockFace);

      // Windows
      for (let i = -1; i <= 1; i++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 0.1), materials.glassWindowDay);
        win.position.set(i * 3.0, 3.5, 1.1);
        g.add(win);
      }

      return g;
    },
  },
  {
    id: 'civ-clinic',
    name: 'Village Health Clinic',
    category: 'civic',
    footprint: { width: 10, depth: 10, height: 5.5 },
    cost: 2200,
    description: 'Modern medical clinic with urgent care drop-off and red cross canopy.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 0.28, 10), materials.concreteCurbs);
      plinth.position.y = 0.14;
      g.add(plinth);

      const body = new THREE.Mesh(new THREE.BoxGeometry(9.2, 4.4, 8.4), materials.modernWhiteStucco);
      body.position.y = 2.48;
      body.castShadow = !isSoftwareGl;
      g.add(body);

      // Medical red cross emblem on facade
      const cV = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.6, 0.1), materials.medicalCrossRed);
      cV.position.set(0, 3.6, 4.3);
      g.add(cV);
      const cH = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.1), materials.medicalCrossRed);
      cH.position.set(0, 3.6, 4.3);
      g.add(cH);

      // Glazed entrance canopy
      const canopy = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.15, 2.2), materials.greenhouseGlass);
      canopy.position.set(0, 2.5, 5.2);
      g.add(canopy);

      return g;
    },
  },
  {
    id: 'civ-library',
    name: 'Public Library & Atrium',
    category: 'civic',
    footprint: { width: 10, depth: 10, height: 6.2 },
    cost: 2400,
    description: 'Community library featuring double-height reading atrium and rooftop terrace.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 10), materials.concreteCurbs);
      plinth.position.y = 0.15;
      g.add(plinth);

      const body = new THREE.Mesh(new THREE.BoxGeometry(9.0, 5.2, 8.8), materials.modernDarkSlate);
      body.position.y = 2.9;
      body.castShadow = !isSoftwareGl;
      g.add(body);

      // Double height glass atrium
      const atrium = new THREE.Mesh(new THREE.BoxGeometry(5.2, 4.2, 0.12), materials.glassWindowDay);
      atrium.position.set(0, 2.8, 4.46);
      g.add(atrium);

      return g;
    },
  },
  {
    id: 'civ-community',
    name: 'Community Cultural Hall',
    category: 'civic',
    footprint: { width: 10, depth: 9, height: 5.2 },
    cost: 1600,
    description: 'Municipal gathering hall with curved glulam timber beams and stone steps.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(10, 0.25, 9), materials.concreteCurbs);
      plinth.position.y = 0.12;
      g.add(plinth);

      const hall = new THREE.Mesh(new THREE.BoxGeometry(8.8, 4.2, 7.8), materials.modernWarmBeige);
      hall.position.y = 2.34;
      hall.castShadow = !isSoftwareGl;
      g.add(hall);

      // Curved timber roof arch
      const roof = new THREE.Mesh(new THREE.CylinderGeometry(4.8, 4.8, 8.2, 16, 1, false, 0, Math.PI), materials.modernWoodSiding);
      roof.rotateZ(Math.PI / 2);
      roof.position.y = 4.44;
      g.add(roof);

      return g;
    },
  },
  {
    id: 'civ-service-kiosk',
    name: 'Public Service Pavilion',
    category: 'civic',
    footprint: { width: 5, depth: 5, height: 3.5 },
    cost: 500,
    description: 'Small community kiosk providing visitor guidance and public transit information.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.16, 4.6), materials.concreteCurbs);
      base.position.y = 0.08;
      g.add(base);

      const kiosk = new THREE.Mesh(new THREE.BoxGeometry(3.0, 2.6, 3.0), materials.modernWhiteStucco);
      kiosk.position.y = 1.46;
      kiosk.castShadow = !isSoftwareGl;
      g.add(kiosk);

      const roof = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.18, 3.8), materials.roofTileDark);
      roof.position.y = 2.85;
      g.add(roof);

      return g;
    },
  },

  // ===========================================================================
  // 4. ROAD AND INFRASTRUCTURE
  // ===========================================================================
  {
    id: 'infra-road-straight',
    name: 'Asphalt Road Segment',
    category: 'infrastructure',
    footprint: { width: 8, depth: 8, height: 0.15 },
    cost: 150,
    description: '8m asphalt road module with curbs and dashed yellow center divider.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      // Asphalt surface
      const road = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 8), materials.asphaltMaterial);
      road.position.y = 0.05;
      road.receiveShadow = true;
      g.add(road);

      // Center dashed stripe
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.02, 5.0), materials.roadMarkingYellow);
      stripe.position.set(0, 0.11, 0);
      g.add(stripe);

      // Curbs on sides
      for (const ox of [-3.9, 3.9]) {
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 8), materials.concreteCurbs);
        curb.position.set(ox, 0.09, 0);
        g.add(curb);
      }

      return g;
    },
  },
  {
    id: 'infra-sidewalk',
    name: 'Concrete Sidewalk Segment',
    category: 'infrastructure',
    footprint: { width: 4, depth: 8, height: 0.2 },
    cost: 80,
    description: 'Paved pedestrian sidewalk segment with raised curb boundary.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      const sw = new THREE.Mesh(new THREE.BoxGeometry(4, 0.16, 8), materials.sidewalkMaterial);
      sw.position.y = 0.08;
      sw.receiveShadow = true;
      g.add(sw);
      return g;
    },
  },
  {
    id: 'infra-parking',
    name: 'Asphalt Parking Bay',
    category: 'infrastructure',
    footprint: { width: 8, depth: 8, height: 0.15 },
    cost: 220,
    description: 'Paved parking area with white stall lines and tire stops.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      const lot = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 8), materials.asphaltMaterial);
      lot.position.y = 0.05;
      lot.receiveShadow = true;
      g.add(lot);

      // Stall striping
      for (let i = -2.5; i <= 2.5; i += 2.5) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 6.0), materials.roadMarkingWhite);
        line.position.set(i, 0.11, 0);
        g.add(line);
      }
      return g;
    },
  },
  {
    id: 'infra-streetlight',
    name: 'Modern LED Streetlight',
    category: 'infrastructure',
    footprint: { width: 1.5, depth: 1.5, height: 4.8 },
    cost: 90,
    description: 'Modern curved steel streetlight with warm nighttime illumination fixture.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Pole
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 4.4, 8), materials.metalSteel);
      pole.position.y = 2.2;
      pole.castShadow = !isSoftwareGl;
      g.add(pole);

      // Curved arm
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 1.2), materials.metalSteel);
      arm.position.set(0, 4.35, 0.5);
      g.add(arm);

      // Lamp fixture & glowing lens
      const fixture = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.4), materials.metalBlack);
      fixture.position.set(0, 4.3, 1.05);
      g.add(fixture);

      const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.04, 0.32), materials.lampGlow);
      bulb.position.set(0, 4.23, 1.05);
      g.add(bulb);

      return g;
    },
  },
  {
    id: 'infra-road-sign',
    name: 'Village Direction Sign',
    category: 'infrastructure',
    footprint: { width: 1, depth: 1, height: 2.5 },
    cost: 40,
    description: 'Municipal street post with directional arrow and speed limit sign.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.2, 8), materials.metalSteel);
      post.position.y = 1.1;
      g.add(post);

      const sign1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.25, 0.04), materials.carPaintBlue);
      sign1.position.set(0.25, 1.9, 0);
      g.add(sign1);

      const sign2 = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.04, 16), materials.medicalCrossRed);
      sign2.rotateX(Math.PI / 2);
      sign2.position.set(0, 1.4, 0.03);
      g.add(sign2);

      return g;
    },
  },
  {
    id: 'infra-bench',
    name: 'Public Timber Bench',
    category: 'infrastructure',
    footprint: { width: 2, depth: 1, height: 0.9 },
    cost: 50,
    description: 'Ergonomic cedar slat bench with powder-coated steel frame.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      // Seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.08, 0.5), materials.timberBench);
      seat.position.set(0, 0.45, 0);
      g.add(seat);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.06), materials.timberBench);
      back.position.set(0, 0.75, -0.22);
      g.add(back);

      // Legs
      for (const lx of [-0.65, 0.65]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.5), materials.metalBlack);
        leg.position.set(lx, 0.225, 0);
        g.add(leg);
      }
      return g;
    },
  },
  {
    id: 'infra-fence',
    name: 'Cedar Garden Fence',
    category: 'infrastructure',
    footprint: { width: 4, depth: 0.5, height: 1.2 },
    cost: 45,
    description: 'Horizontal cedar timber fence module for gardens and boundaries.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      // Posts
      for (const px of [-1.9, 0, 1.9]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.2, 0.12), materials.doorWood);
        post.position.set(px, 0.6, 0);
        g.add(post);
      }
      // Horizontal slats
      for (let y = 0.3; y <= 1.0; y += 0.25) {
        const slat = new THREE.Mesh(new THREE.BoxGeometry(3.9, 0.12, 0.04), materials.modernWoodSiding);
        slat.position.set(0, y, 0);
        g.add(slat);
      }
      return g;
    },
  },
  {
    id: 'infra-crosswalk',
    name: 'Zebra Pedestrian Crosswalk',
    category: 'infrastructure',
    footprint: { width: 8, depth: 4, height: 0.15 },
    cost: 160,
    description: 'Zebra crosswalk section with textured white stop bars.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      const base = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 4), materials.asphaltMaterial);
      base.position.y = 0.05;
      base.receiveShadow = true;
      g.add(base);

      // Zebra stripes
      for (let x = -3.2; x <= 3.2; x += 1.3) {
        const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.02, 3.2), materials.roadMarkingWhite);
        stripe.position.set(x, 0.11, 0);
        g.add(stripe);
      }
      return g;
    },
  },

  // ===========================================================================
  // 5. LANDSCAPE
  // ===========================================================================
  {
    id: 'nat-oak-tree',
    name: 'Grand Parkland Oak Tree',
    category: 'landscape',
    footprint: { width: 4, depth: 4, height: 5.2 },
    cost: 75,
    description: 'Mature deciduous oak tree with dense foliage and sturdy trunk.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.38, 2.4, 8), materials.treeTrunkBark);
      trunk.position.y = 1.2;
      trunk.castShadow = !isSoftwareGl;
      g.add(trunk);

      const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.6, 1), materials.treeFoliageDarkGreen);
      crown1.position.y = 3.2;
      crown1.castShadow = !isSoftwareGl;
      g.add(crown1);

      const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.2, 1), materials.treeFoliageOlive);
      crown2.position.set(0.4, 4.1, 0.3);
      crown2.castShadow = !isSoftwareGl;
      g.add(crown2);

      return g;
    },
  },
  {
    id: 'nat-birch-tree',
    name: 'Slender White Birch',
    category: 'landscape',
    footprint: { width: 3, depth: 3, height: 4.8 },
    cost: 75,
    description: 'Slender white bark birch with airy lime green foliage canopy.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.8, 8), materials.treeTrunkBirch);
      trunk.position.y = 1.4;
      trunk.castShadow = !isSoftwareGl;
      g.add(trunk);

      const crown = new THREE.Mesh(new THREE.DodecahedronGeometry(1.3, 1), materials.treeFoliageLightGreen);
      crown.position.y = 3.6;
      crown.castShadow = !isSoftwareGl;
      g.add(crown);

      return g;
    },
  },
  {
    id: 'nat-blossom-tree',
    name: 'Flowering Cherry Blossom',
    category: 'landscape',
    footprint: { width: 4, depth: 4, height: 4.6 },
    cost: 95,
    description: 'Vibrant ornamental pink cherry blossom tree.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.28, 2.0, 8), materials.treeTrunkBark);
      trunk.position.y = 1.0;
      trunk.castShadow = !isSoftwareGl;
      g.add(trunk);

      const crown1 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.5, 1), materials.treeFoliageFloweringPink);
      crown1.position.y = 2.8;
      crown1.castShadow = !isSoftwareGl;
      g.add(crown1);

      const crown2 = new THREE.Mesh(new THREE.DodecahedronGeometry(1.0, 1), materials.treeFoliageFloweringPink);
      crown2.position.set(-0.3, 3.6, 0.2);
      crown2.castShadow = !isSoftwareGl;
      g.add(crown2);

      return g;
    },
  },
  {
    id: 'nat-hedge',
    name: 'Sculpted Boxwood Hedge',
    category: 'landscape',
    footprint: { width: 3, depth: 1, height: 1.2 },
    cost: 40,
    description: 'Dense manicured hedge section for perimeter landscaping.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const hedge = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.1, 0.8), materials.hedgeBoxwood);
      hedge.position.y = 0.55;
      hedge.castShadow = !isSoftwareGl;
      g.add(hedge);
      return g;
    },
  },
  {
    id: 'nat-flowerbed',
    name: 'Botanical Floral Parterre',
    category: 'landscape',
    footprint: { width: 4, depth: 2, height: 0.6 },
    cost: 60,
    description: 'Geometric mulched bed with lavender, red, and yellow flowering blooms.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      // Soil border
      const mulch = new THREE.Mesh(new THREE.BoxGeometry(4.0, 0.15, 2.0), materials.flowerBedMulchMaterial);
      mulch.position.y = 0.08;
      g.add(mulch);

      // Stone border
      const border = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 2.2), materials.concreteCurbs);
      border.position.y = 0.1;
      g.add(border);

      // Clustered flower dots
      const flowerMats = [materials.flowerLavender, materials.flowerRed, materials.flowerYellow];
      for (let i = -1.5; i <= 1.5; i += 0.75) {
        for (let j = -0.5; j <= 0.5; j += 0.5) {
          const mat = flowerMats[Math.floor(Math.abs(i + j) * 3) % flowerMats.length];
          const fl = new THREE.Mesh(new THREE.SphereGeometry(0.18, 6, 6), mat);
          fl.position.set(i, 0.28, j);
          g.add(fl);
        }
      }
      return g;
    },
  },
  {
    id: 'nat-garden-path',
    name: 'Stone Paver Garden Trail',
    category: 'landscape',
    footprint: { width: 3, depth: 3, height: 0.15 },
    cost: 50,
    description: 'Natural stone paving path module for gardens and park connections.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      const path = new THREE.Mesh(new THREE.BoxGeometry(3, 0.1, 3), materials.gravelPathMaterial);
      path.position.y = 0.05;
      path.receiveShadow = true;
      g.add(path);
      return g;
    },
  },
  {
    id: 'nat-small-pond',
    name: 'Ornamental Lily Reflection Pond',
    category: 'landscape',
    footprint: { width: 7, depth: 7, height: 0.4 },
    cost: 450,
    description: 'Stone-lined circular reflection pond with floating water lilies.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      // Stone curb ring
      const stoneRing = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.5, 0.35, 24), materials.rockStoneMaterial);
      stoneRing.position.y = 0.18;
      g.add(stoneRing);

      // Water surface
      const water = new THREE.Mesh(new THREE.CylinderGeometry(3.1, 3.1, 0.3, 24), materials.lakeWaterMaterial);
      water.position.y = 0.18;
      g.add(water);

      // Water lily pads
      for (let i = 0; i < 4; i++) {
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.02, 8), materials.waterLilyMaterial);
        const ang = (i / 4) * Math.PI * 2 + 0.4;
        pad.position.set(Math.cos(ang) * 1.6, 0.34, Math.sin(ang) * 1.6);
        g.add(pad);

        const lotus = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), materials.lotusBlossomMaterial);
        lotus.position.set(pad.position.x, 0.44, pad.position.z);
        g.add(lotus);
      }
      return g;
    },
  },
  {
    id: 'nat-fountain',
    name: 'Tiered Ornamental Water Fountain',
    category: 'landscape',
    footprint: { width: 5, depth: 5, height: 3.2 },
    cost: 380,
    description: 'Tiered stone water fountain with central plume spout.',
    createMesh: (materials) => {
      const g = new THREE.Group();
      const basin = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.4, 20), materials.rockStoneMaterial);
      basin.position.y = 0.2;
      g.add(basin);

      const water = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.35, 20), materials.lakeWaterMaterial);
      water.position.y = 0.22;
      g.add(water);

      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.45, 1.8, 12), materials.rockStoneMaterial);
      pillar.position.y = 1.1;
      g.add(pillar);

      const upperBowl = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 0.6, 0.3, 16), materials.rockStoneMaterial);
      upperBowl.position.y = 2.0;
      g.add(upperBowl);

      const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.15, 0.6, 8), materials.glassWindowDay);
      spout.position.y = 2.45;
      g.add(spout);

      return g;
    },
  },
  {
    id: 'nat-playground',
    name: 'Adventure Playground Set',
    category: 'landscape',
    footprint: { width: 6, depth: 6, height: 3.2 },
    cost: 550,
    description: 'Children adventure playset with swing frame, timber platform, and slide.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Safety rubber ground
      const mat = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 6), materials.sportCourtBlue);
      mat.position.y = 0.04;
      g.add(mat);

      // A-frame swing poles
      for (const sx of [-1.8, 1.8]) {
        const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), materials.metalSteel);
        pole1.position.set(sx, 1.5, -0.6);
        pole1.rotation.x = 0.25;
        g.add(pole1);

        const pole2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 3.2, 8), materials.metalSteel);
        pole2.position.set(sx, 1.5, 0.6);
        pole2.rotation.x = -0.25;
        g.add(pole2);
      }

      // Top crossbeam
      const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 4.0, 8), materials.metalSteel);
      beam.rotateZ(Math.PI / 2);
      beam.position.set(0, 2.9, 0);
      g.add(beam);

      // Swing seat
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.3), materials.sportCourtOrange);
      seat.position.set(0, 0.6, 0);
      g.add(seat);

      return g;
    },
  },
  {
    id: 'nat-gazebo',
    name: 'Classic Garden Gazebo Pavilion',
    category: 'landscape',
    footprint: { width: 5, depth: 5, height: 3.8 },
    cost: 420,
    description: 'Octagonal wooden pavilion with classical columns and pitched roof.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      // Octagonal deck
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.5, 0.25, 8), materials.modernWoodSiding);
      deck.position.y = 0.125;
      g.add(deck);

      // Columns
      for (let i = 0; i < 8; i++) {
        const ang = (i / 8) * Math.PI * 2;
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.4, 8), materials.modernWhiteStucco);
        col.position.set(Math.cos(ang) * 2.1, 1.45, Math.sin(ang) * 2.1);
        col.castShadow = !isSoftwareGl;
        g.add(col);
      }

      // Roof pyramid
      const roof = new THREE.Mesh(new THREE.ConeGeometry(2.7, 1.4, 8), materials.roofTileTerracotta);
      roof.position.y = 3.35;
      roof.castShadow = !isSoftwareGl;
      g.add(roof);

      return g;
    },
  },
  {
    id: 'nat-park-sculpture',
    name: 'Modern Civic Kinetic Sculpture',
    category: 'landscape',
    footprint: { width: 3, depth: 3, height: 3.5 },
    cost: 300,
    description: 'Contemporary metallic civic monument on a granite plinth.',
    createMesh: (materials, isSoftwareGl) => {
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 2.0), materials.modernDarkSlate);
      plinth.position.y = 0.3;
      g.add(plinth);

      // Torus ring sculpture
      const torus = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.22, 12, 24), materials.metalSteel);
      torus.position.y = 1.9;
      torus.rotation.x = Math.PI / 4;
      torus.castShadow = !isSoftwareGl;
      g.add(torus);

      const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), materials.metalBronze);
      sphere.position.y = 1.9;
      g.add(sphere);

      return g;
    },
  },
];

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Items',
  residential: 'Residential',
  commercial: 'Commercial',
  civic: 'Public Facilities',
  infrastructure: 'Infrastructure',
  landscape: 'Landscape & Nature',
};
