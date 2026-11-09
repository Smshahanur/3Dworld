import * as THREE from 'three';
import { MaterialLibrary } from './materials';

interface ButterflyEntity {
  group: THREE.Group;
  wingL: THREE.Mesh;
  wingR: THREE.Mesh;
  centerPos: THREE.Vector3;
  radius: number;
  speed: number;
  phase: number;
  heightAmp: number;
}

interface FountainParticleEffect {
  jetMesh: THREE.Mesh;
  sprayPoints: THREE.Points;
  sprayPositions: Float32Array;
  sprayVelocities: Float32Array;
  sprayCount: number;
  centerPos: THREE.Vector3;
  baseHeight: number;
}

export class EnvironmentalLifeManager {
  public group = new THREE.Group();
  private materials: MaterialLibrary;
  private isSoftwareGl: boolean;

  private butterflies: ButterflyEntity[] = [];
  private fountains: FountainParticleEffect[] = [];
  private animatedWaterSurfaces: THREE.Mesh[] = [];
  private nightWindowMeshes: THREE.Mesh[] = [];
  private streetLamps: { mesh: THREE.Mesh; light?: THREE.PointLight }[] = [];

  constructor(materials: MaterialLibrary, isSoftwareGl: boolean = false) {
    this.materials = materials;
    this.isSoftwareGl = isSoftwareGl;
    this.group.name = 'EnvironmentalLifeSystem';

    this.initButterflies();
    this.initFountainEffects();
    this.initNightWindows();
  }

  // ---------------------------------------------------------------------------
  // 1. FLUTTERING BUTTERFLIES IN BOTANICAL SANCTUARY & CENTRAL PARK
  // ---------------------------------------------------------------------------
  private initButterflies() {
    const butterflySanctuaries = [
      // Central Park Lavender & Rose Beds
      { x: 18, y: 0.8, z: -4, radius: 4.5, color: 0x38bdf8 },  // Electric Cyan
      { x: 22, y: 0.9, z: -8, radius: 5.0, color: 0xfbbf24 },  // Solar Amber
      { x: 16, y: 0.75, z: 2, radius: 4.0, color: 0xf472b6 },  // Rose Blossom
      // Botanical Conservatory Flowerbeds
      { x: 28, y: 0.9, z: 30, radius: 3.5, color: 0xa855f7 },  // Orchid Violet
      { x: 32, y: 0.85, z: 34, radius: 4.0, color: 0x34d399 }, // Emerald Mint
      { x: 26, y: 1.0, z: 36, radius: 3.8, color: 0xfb923c },  // Sunset Orange
      // Rural Wildflower Meadow
      { x: -108, y: 0.7, z: -14, radius: 5.5, color: 0xfde047 }, // Meadow Yellow
      { x: -116, y: 0.8, z: 18, radius: 4.8, color: 0x60a5fa },  // Cornflower Blue
    ];

    // Butterfly Wing Geometry (delicate curved plane)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.08, 0.05, 0.12, 0.16, 0.04, 0.18);
    wingShape.bezierCurveTo(-0.02, 0.14, 0.02, 0.06, 0, 0);

    const wingGeo = new THREE.ShapeGeometry(wingShape);

    butterflySanctuaries.forEach((sanctuary, idx) => {
      const bGroup = new THREE.Group();
      bGroup.position.set(sanctuary.x, sanctuary.y, sanctuary.z);

      const wingMat = new THREE.MeshBasicMaterial({
        color: sanctuary.color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      });

      // Left & Right Wings
      const wingL = new THREE.Mesh(wingGeo, wingMat);
      wingL.scale.set(0.65, 0.65, 0.65);
      wingL.rotation.y = 0.2;

      const wingR = new THREE.Mesh(wingGeo, wingMat);
      wingR.scale.set(-0.65, 0.65, 0.65);
      wingR.rotation.y = -0.2;

      // Small slender body
      const bodyGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.10, 5);
      const bodyMat = new THREE.MeshBasicMaterial({ color: 0x18181b });
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.rotation.x = Math.PI / 2;

      bGroup.add(body);
      bGroup.add(wingL);
      bGroup.add(wingR);

      this.group.add(bGroup);

      this.butterflies.push({
        group: bGroup,
        wingL,
        wingR,
        centerPos: new THREE.Vector3(sanctuary.x, sanctuary.y, sanctuary.z),
        radius: sanctuary.radius,
        speed: 0.85 + (idx % 3) * 0.25,
        phase: idx * 1.5,
        heightAmp: 0.35 + (idx % 2) * 0.2,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 2. FOUNTAIN JET WATER EFFECTS (Central Park & Capital Obelisk)
  // ---------------------------------------------------------------------------
  private initFountainEffects() {
    const fountainLocations = [
      // Central Park Crystal Fountain
      { x: 20, y: 0.4, z: -6, jetHeight: 2.8, sprayCount: this.isSoftwareGl ? 35 : 75 },
      // Capital Town Grand Obelisk Pool (Dual Fountains)
      { x: 131, y: 0.3, z: 20, jetHeight: 3.5, sprayCount: this.isSoftwareGl ? 35 : 85 },
      { x: 137, y: 0.3, z: 20, jetHeight: 3.5, sprayCount: this.isSoftwareGl ? 35 : 85 },
    ];

    fountainLocations.forEach((loc) => {
      // 1. Central rising water spout column
      const jetGeo = new THREE.CylinderGeometry(0.08, 0.22, loc.jetHeight, 8, 1, true);
      const jetMat = new THREE.MeshBasicMaterial({
        color: 0xbae6fd,
        transparent: true,
        opacity: 0.62,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const jetMesh = new THREE.Mesh(jetGeo, jetMat);
      jetMesh.position.set(loc.x, loc.y + loc.jetHeight / 2, loc.z);
      this.group.add(jetMesh);

      // 2. Cascading splash spray particles
      const count = loc.sprayCount;
      const sprayPositions = new Float32Array(count * 3);
      const sprayVelocities = new Float32Array(count * 3);

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const rad = Math.random() * 0.6;
        sprayPositions[i * 3 + 0] = loc.x + Math.cos(angle) * rad;
        sprayPositions[i * 3 + 1] = loc.y + Math.random() * loc.jetHeight;
        sprayPositions[i * 3 + 2] = loc.z + Math.sin(angle) * rad;

        sprayVelocities[i * 3 + 0] = (Math.cos(angle) * 0.6 + (Math.random() - 0.5) * 0.2);
        sprayVelocities[i * 3 + 1] = 1.2 + Math.random() * 1.5;
        sprayVelocities[i * 3 + 2] = (Math.sin(angle) * 0.6 + (Math.random() - 0.5) * 0.2);
      }

      const sprayGeo = new THREE.BufferGeometry();
      sprayGeo.setAttribute('position', new THREE.BufferAttribute(sprayPositions, 3));

      const sprayMat = new THREE.PointsMaterial({
        color: 0xe0f2fe,
        size: 0.12,
        transparent: true,
        opacity: 0.75,
        depthWrite: false,
      });

      const sprayPoints = new THREE.Points(sprayGeo, sprayMat);
      this.group.add(sprayPoints);

      this.fountains.push({
        jetMesh,
        sprayPoints,
        sprayPositions,
        sprayVelocities,
        sprayCount: count,
        centerPos: new THREE.Vector3(loc.x, loc.y, loc.z),
        baseHeight: loc.jetHeight,
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 3. WARM WINDOW LIGHTS & SHOP GLOWS AT NIGHT
  // ---------------------------------------------------------------------------
  private initNightWindows() {
    // Array of key building facades across all 3 districts
    const windowLocations = [
      // Rural Village Homes & Barns
      { x: -118, y: 1.8, z: -18, w: 1.2, h: 0.8, color: 0xfef08a },
      { x: -96, y: 1.8, z: -28, w: 1.0, h: 0.8, color: 0xfef08a },
      { x: -122, y: 1.8, z: 12, w: 1.2, h: 0.8, color: 0xfef08a },
      // Modern Village Plaza Shops & Apartments
      { x: -20, y: 2.2, z: 2, w: 2.4, h: 1.4, color: 0xa5f3fc },
      { x: -14, y: 2.2, z: -8, w: 2.2, h: 1.2, color: 0xfde047 },
      { x: 10, y: 3.5, z: 16, w: 1.8, h: 1.2, color: 0xa5f3fc },
      // Capital Town Corporate Towers & City Hall
      { x: 108, y: 4.5, z: -20, w: 3.2, h: 2.0, color: 0x38bdf8 },
      { x: 114, y: 3.0, z: -22, w: 2.6, h: 1.6, color: 0xfde047 },
      { x: 136, y: 4.0, z: -16, w: 3.5, h: 2.2, color: 0x818cf8 },
    ];

    const windowGeo = new THREE.PlaneGeometry(1, 1);

    windowLocations.forEach((loc) => {
      const winMat = new THREE.MeshBasicMaterial({
        color: loc.color,
        transparent: true,
        opacity: 0.0, // Switched on at night
        depthWrite: false,
      });

      const mesh = new THREE.Mesh(windowGeo, winMat);
      mesh.scale.set(loc.w, loc.h, 1);
      mesh.position.set(loc.x, loc.y, loc.z);
      this.group.add(mesh);
      this.nightWindowMeshes.push(mesh);
    });
  }

  // ---------------------------------------------------------------------------
  // 4. ANIMATION UPDATE LOOP
  // ---------------------------------------------------------------------------
  public update(delta: number, elapsed: number, nightGlowFactor: number) {
    // 1. Animate Butterflies (organic fluttering and flower orbit)
    for (let i = 0; i < this.butterflies.length; i++) {
      const b = this.butterflies[i];
      const angle = elapsed * b.speed + b.phase;

      // Elliptical figure-eight orbit over flowers
      const ox = Math.sin(angle) * b.radius + Math.sin(angle * 3.0) * 0.6;
      const oz = Math.cos(angle * 0.8) * (b.radius * 0.7) + Math.cos(angle * 2.5) * 0.5;
      const oy = b.centerPos.y + Math.sin(angle * 2.2) * b.heightAmp;

      b.group.position.set(b.centerPos.x + ox, oy, b.centerPos.z + oz);

      // Facing flight direction
      const nextAngle = angle + 0.04;
      const nextX = Math.sin(nextAngle) * b.radius;
      const nextZ = Math.cos(nextAngle * 0.8) * (b.radius * 0.7);
      b.group.rotation.y = Math.atan2(nextX - ox, nextZ - oz);
      b.group.rotation.z = Math.sin(elapsed * 5.0) * 0.15;

      // Wing fluttering motion
      const flap = Math.sin(elapsed * 16.0 + b.phase) * 0.75;
      b.wingL.rotation.y = flap;
      b.wingR.rotation.y = -flap;
    }

    // 2. Animate Fountains (rising jet pulse & splashing water droplets)
    for (let f = 0; f < this.fountains.length; f++) {
      const fountain = this.fountains[f];

      // Subtle pulse on water spout diameter
      const pulse = 1.0 + Math.sin(elapsed * 4.0 + f) * 0.08;
      fountain.jetMesh.scale.set(pulse, 1.0 + Math.cos(elapsed * 3.5) * 0.05, pulse);

      const positions = fountain.sprayPositions;
      const velocities = fountain.sprayVelocities;
      const count = fountain.sprayCount;
      const baseY = fountain.centerPos.y;

      for (let p = 0; p < count; p++) {
        const idx = p * 3;
        // Gravity
        velocities[idx + 1] -= delta * 3.8;

        // Advance positions
        positions[idx + 0] += velocities[idx + 0] * delta;
        positions[idx + 1] += velocities[idx + 1] * delta;
        positions[idx + 2] += velocities[idx + 2] * delta;

        // Reset droplets when hitting fountain pool base
        if (positions[idx + 1] <= baseY) {
          const angle = Math.random() * Math.PI * 2;
          const rad = Math.random() * 0.4;
          positions[idx + 0] = fountain.centerPos.x + Math.cos(angle) * rad;
          positions[idx + 1] = baseY + 0.1;
          positions[idx + 2] = fountain.centerPos.z + Math.sin(angle) * rad;

          velocities[idx + 0] = Math.cos(angle) * (0.4 + Math.random() * 0.5);
          velocities[idx + 1] = 2.2 + Math.random() * 1.6;
          velocities[idx + 2] = Math.sin(angle) * (0.4 + Math.random() * 0.5);
        }
      }

      fountain.sprayPoints.geometry.attributes.position.needsUpdate = true;
    }

    // 3. Update Night Window Emissive Glow based on Day/Night Cycle
    const targetWindowOpacity = Math.max(0, Math.min(0.85, (nightGlowFactor - 0.25) * 1.4));
    for (let w = 0; w < this.nightWindowMeshes.length; w++) {
      const mat = this.nightWindowMeshes[w].material as THREE.MeshBasicMaterial;
      mat.opacity += (targetWindowOpacity - mat.opacity) * Math.min(1.0, delta * 3.0);
    }
  }

  public dispose() {
    this.butterflies = [];
    this.fountains.forEach((f) => {
      f.jetMesh.geometry.dispose();
      (f.jetMesh.material as THREE.Material).dispose();
      f.sprayPoints.geometry.dispose();
      (f.sprayPoints.material as THREE.Material).dispose();
    });
    this.fountains = [];
    this.nightWindowMeshes.forEach((w) => {
      w.geometry.dispose();
      (w.material as THREE.Material).dispose();
    });
    this.nightWindowMeshes = [];
  }
}
