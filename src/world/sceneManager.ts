import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterialLibrary, MaterialLibrary } from './materials';
import { createModernVillageLandscape } from './terrain';
import { createModernVillage, AnimatedLandmarkComponents } from './landmarks';
import { createAtmosphericClouds } from './clouds';
import { createParticleSystems } from './particles';
import { LivingWorldManager } from './livingWorld';
import { DayNightCycleController, InterpolatedLightState } from './dayNightCycle';
import { LightingMode, LOCATIONS, LocationData, BUILDINGS, BuildingInfo, ViewMode } from '../types';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onSelectLandmark: (location: LocationData) => void;
  onSelectBuilding: (building: BuildingInfo | null) => void;
  onHoverLandmark: (name: string | null) => void;
  onLoadingComplete: () => void;
  onTimeChange?: (timeStr: string, hour: number, mode: LightingMode) => void;
}

export class SceneManager {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private materials!: MaterialLibrary;
  private animComponents!: AnimatedLandmarkComponents;
  private livingWorld!: LivingWorldManager;
  private dayNight = new DayNightCycleController(12.0, true);
  private skyUniforms!: {
    topColor: { value: THREE.Color };
    horizonColor: { value: THREE.Color };
    bottomColor: { value: THREE.Color };
  };
  private onTimeChange?: (timeStr: string, hour: number, mode: LightingMode) => void;
  private lastReportedMinute: number = -1;

  private beaconMeshes: THREE.Mesh[] = [];
  private clickableBuildingMeshes: THREE.Mesh[] = [];
  private selectionHighlightGroup!: THREE.Group;
  private selectedBuildingId: string | null = null;
  private currentViewMode: ViewMode = 'aerial';

  private updateParticles!: (delta: number, elapsed: number) => void;
  private cloudsGroup!: THREE.Group;
  private midClouds!: THREE.Group;
  private landscapeGroup!: THREE.Group;
  private villageGroup!: THREE.Group;
  private skyDome!: THREE.Mesh;

  // Lights & Fog
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private fillLight!: THREE.DirectionalLight;
  private fog!: THREE.FogExp2;

  // Camera Animation State (with elevated arc trajectory to prevent clipping)
  private isTransitioning: boolean = false;
  private camStartPos = new THREE.Vector3();
  private camTargetPos = new THREE.Vector3();
  private lookStart = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private transitionAlpha: number = 0;
  private transitionDuration: number = 1.6;
  private transitionArcPeak: number = 12;

  // Default Responsive Aerial View
  public defaultCameraPos = new THREE.Vector3(26, 56, -70);
  public defaultLookAt = new THREE.Vector3(-3, 1.2, 4);

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private isPointerDown: boolean = false;
  private pointerDownPos = new THREE.Vector2();

  // Callbacks
  private onSelectLandmark: (location: LocationData) => void;
  private onSelectBuilding: (building: BuildingInfo | null) => void;
  private onHoverLandmark: (name: string | null) => void;
  private onLoadingComplete: () => void;

  // Lifecycle
  private isDisposed: boolean = false;
  private clock = new THREE.Clock();
  private reqId: number = 0;
  public isSoftwareGl: boolean = false;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onSelectLandmark = options.onSelectLandmark;
    this.onSelectBuilding = options.onSelectBuilding;
    this.onHoverLandmark = options.onHoverLandmark;
    this.onLoadingComplete = options.onLoadingComplete;
    this.onTimeChange = options.onTimeChange;

    this.init();
  }

  /**
   * Calculates the optimal camera position, target, and FOV based on screen aspect ratio:
   * - Desktop widescreen (16:9): Balanced isometric view looking over the lake into the village core.
   * - Mobile portrait (9:16): Positioned further back with adapted FOV so the village width fits comfortably.
   */
  public getResponsiveCameraView(): { pos: THREE.Vector3; target: THREE.Vector3; fov: number } {
    const width = this.container?.clientWidth || window.innerWidth;
    const height = this.container?.clientHeight || window.innerHeight;
    const aspect = width / Math.max(1, height);

    // Village center target (slightly biased towards center of boulevard and roundabout)
    const target = new THREE.Vector3(-3, 1.2, 4);

    let pos: THREE.Vector3;
    let fov: number;

    if (aspect >= 1.55) {
      // 1. Widescreen Desktop (16:9, 16:10, 21:9)
      pos = new THREE.Vector3(26, 56, -70);
      fov = 40;
    } else if (aspect >= 1.15) {
      // 2. Standard Desktop / Laptop / Landscape Tablet (4:3, 3:2)
      pos = new THREE.Vector3(28, 62, -76);
      fov = 42;
    } else if (aspect >= 0.85) {
      // 3. Square / Portrait Tablet (iPad portrait, square split-screen)
      pos = new THREE.Vector3(30, 68, -84);
      fov = 45;
    } else {
      // 4. Mobile Phone Portrait (9:16, e.g. 390x844, 412x915)
      pos = new THREE.Vector3(32, 78, -94);
      fov = 48;
    }

    return { pos, target, fov };
  }

  private init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    const isMobile = width < 768;

    // 1. Detect Software WebGL
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return false;
      }
    })();

    // 2. Setup Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
      alpha: true,
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.outline = 'none';
    this.renderer.domElement.style.touchAction = 'none'; // Critical for fluid Android touch controls

    // 3. Scene & Atmospheric Horizon Fog
    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(0x0f1c30, 0.0055);
    this.scene.fog = this.fog;

    // 4. Responsive Camera Setup
    const initialView = this.getResponsiveCameraView();
    this.defaultCameraPos.copy(initialView.pos);
    this.defaultLookAt.copy(initialView.target);

    this.camera = new THREE.PerspectiveCamera(initialView.fov, width / height, 0.5, 650);
    this.camera.position.copy(initialView.pos);

    // 5. Controls with smooth damping and touch support
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.06;
    this.controls.target.copy(initialView.target);
    this.controls.maxDistance = 185;
    this.controls.minDistance = 8;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from dipping beneath ground
    this.controls.minPolarAngle = 0.15;
    this.controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    this.controls.addEventListener('start', () => {
      this.isTransitioning = false;
    });

    // 6. Reflection Environment
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Handled
    }

    // 7. Architectural Sunlight & Atmospheric Lighting
    this.setupLighting();

    // 8. Procedural Sky Dome
    this.setupSkyDome();

    // 9. Materials & Village World Geometry
    this.materials = createMaterialLibrary(this.isSoftwareGl);

    // Continuous Landscape (Terrain, Lake Basin, Road Network, Crosswalks)
    this.landscapeGroup = createModernVillageLandscape(this.materials);
    this.scene.add(this.landscapeGroup);

    // Modern Village Architecture (Town Center, Residential, Central Park, Botanical Garden, Lake Recreation)
    const villageResult = createModernVillage(this.materials);
    this.animComponents = villageResult.animatedComponents;
    this.beaconMeshes = villageResult.beaconMeshes;
    this.clickableBuildingMeshes = villageResult.clickableBuildingMeshes;
    this.villageGroup = villageResult.villageGroup;
    this.scene.add(this.villageGroup);

    // 10. Building Selection Highlight Marker (Subtle glowing 3D bracket & ring)
    this.setupSelectionHighlight();

    // High Atmospheric Clouds
    const cloudsResult = createAtmosphericClouds(this.materials, isMobile);
    this.cloudsGroup = cloudsResult.cloudGroup;
    this.midClouds = cloudsResult.midClouds;
    this.scene.add(this.cloudsGroup);

    // Environmental Breeze Particles
    const particlesResult = createParticleSystems(isMobile);
    this.updateParticles = particlesResult.updateParticles;
    this.scene.add(particlesResult.particleGroup);

    // 11. Living World Simulation (Vehicles, Pedestrians, Streetlights & Water Waves)
    this.livingWorld = new LivingWorldManager({
      materials: this.materials,
      isSoftwareGl: this.isSoftwareGl,
    });
    // Locate the lake water mesh in landscapeGroup to enable dynamic wave movement
    this.landscapeGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).material === this.materials.lakeWaterMaterial) {
        this.livingWorld.setLakeMesh(child as THREE.Mesh);
      }
    });
    this.scene.add(this.livingWorld.group);

    // Set initial Day atmosphere
    this.setLightingMode('day');

    // 11. Event Listeners
    this.setupEvents();

    // Inform parent loading complete
    setTimeout(() => {
      this.onLoadingComplete();
    }, 450);

    // 12. Start Render Loop
    this.startLoop();
  }

  private setupSelectionHighlight() {
    this.selectionHighlightGroup = new THREE.Group();
    this.selectionHighlightGroup.name = 'BuildingSelectionHighlight';
    this.selectionHighlightGroup.visible = false;

    // Ground projection pulse ring
    const ringGeo = new THREE.RingGeometry(3.2, 3.6, 32);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.22;
    this.selectionHighlightGroup.add(ring);

    // Subtle corner brackets indicating selection
    const cornerMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
    const cornerSize = 1.2;
    for (const [cx, cz] of [[-3.5, -3.5], [3.5, -3.5], [3.5, 3.5], [-3.5, 3.5]]) {
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(cornerSize, 0.12, 0.12), cornerMat);
      b1.position.set(cx - Math.sign(cx) * (cornerSize / 2), 0.25, cz);
      this.selectionHighlightGroup.add(b1);

      const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, cornerSize), cornerMat);
      b2.position.set(cx, 0.25, cz - Math.sign(cz) * (cornerSize / 2));
      this.selectionHighlightGroup.add(b2);
    }

    // Overhead indicator arrow/diamond
    const diamondGeo = new THREE.OctahedronGeometry(0.55, 0);
    const diamondMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0.85,
    });
    const diamond = new THREE.Mesh(diamondGeo, diamondMat);
    diamond.position.y = 8.5;
    this.selectionHighlightGroup.add(diamond);

    this.scene.add(this.selectionHighlightGroup);
  }

  public selectBuilding(building: BuildingInfo | null) {
    if (!building) {
      this.selectedBuildingId = null;
      this.selectionHighlightGroup.visible = false;
      return;
    }

    this.selectedBuildingId = building.id;
    this.selectionHighlightGroup.position.set(
      building.highlightPosition[0],
      0,
      building.highlightPosition[2]
    );

    const rad = building.highlightRadius || 5.0;
    this.selectionHighlightGroup.scale.set(rad / 4.0, 1, rad / 4.0);
    this.selectionHighlightGroup.visible = true;

    // Smoothly fly camera to showcase the building
    this.flyTo(building.cameraPos, building.target, 1.6);
  }

  public setViewMode(mode: ViewMode) {
    this.currentViewMode = mode;
    if (mode === 'street') {
      // Ground-level exploration view along the main boulevard / town square
      this.controls.minDistance = 3;
      this.controls.maxDistance = 50;
      this.flyTo([-14, 2.4, 14], [-14, 1.8, 0], 1.8);
    } else {
      // Reset back to wide aerial overview
      this.controls.minDistance = 8;
      this.controls.maxDistance = 185;
      this.resetView();
    }
  }

  private setupLighting() {
    // Key Sun Light (Illuminating south and east architectural facades towards camera)
    this.dirLight = new THREE.DirectionalLight(0xfffbeb, 3.4);
    this.dirLight.position.set(45, 65, -50);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 2;
    this.dirLight.shadow.camera.far = 180;
    const d = 75;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0003;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Soft Rim/Fill Light (Cool sky fill from opposite quadrant)
    this.fillLight = new THREE.DirectionalLight(0x38bdf8, 1.1);
    this.fillLight.position.set(-45, 35, 45);
    this.scene.add(this.fillLight);

    // Hemisphere Light (Sky vs Earth ground bounce)
    this.hemiLight = new THREE.HemisphereLight(0xbae6fd, 0x1e3a5f, 1.3);
    this.scene.add(this.hemiLight);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x0f172a, 0.85);
    this.scene.add(this.ambientLight);
  }

  private setupSkyDome() {
    const skyGeo = new THREE.SphereGeometry(450, 24, 16);
    skyGeo.scale(-1, 1, 1);

    this.skyUniforms = {
      topColor: { value: new THREE.Color(0x0369a1) },
      horizonColor: { value: new THREE.Color(0xbfe9fe) },
      bottomColor: { value: new THREE.Color(0x0f2b48) },
    };

    const skyMat = new THREE.ShaderMaterial({
      uniforms: this.skyUniforms,
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 horizonColor;
        uniform vec3 bottomColor;
        varying vec3 vWorldPosition;
        void main() {
          float h = normalize(vWorldPosition).y;
          vec3 sky;
          if (h > 0.0) {
            sky = mix(horizonColor, topColor, pow(h, 0.62));
          } else {
            sky = mix(horizonColor, bottomColor, pow(-h, 0.45));
          }
          gl_FragColor = vec4(sky, 1.0);
        }
      `,
      side: THREE.BackSide,
      fog: false,
      depthWrite: false,
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  public applyDayNightState(state: InterpolatedLightState) {
    if (!this.dirLight || !this.fillLight || !this.hemiLight || !this.fog) return;

    this.dirLight.position.copy(state.sunPosition);
    this.dirLight.color.copy(state.sunColor);
    this.dirLight.intensity = state.sunIntensity;

    this.fillLight.position.copy(state.fillPosition);
    this.fillLight.color.copy(state.fillColor);
    this.fillLight.intensity = state.fillIntensity;

    this.hemiLight.color.copy(state.hemiSkyColor);
    this.hemiLight.groundColor.copy(state.hemiGroundColor);
    this.hemiLight.intensity = state.hemiIntensity;

    this.fog.color.copy(state.fogColor);
    this.fog.density = state.fogDensity;
    this.scene.background = state.fogColor;

    if (this.skyUniforms) {
      this.skyUniforms.topColor.value.copy(state.skyTopColor);
      this.skyUniforms.horizonColor.value.copy(state.skyHorizonColor);
      this.skyUniforms.bottomColor.value.copy(state.skyBottomColor);
    }

    this.materials.updateNightGlow(state.nightGlowFactor);
    if (this.livingWorld) {
      this.livingWorld.setNightMode(state.nightGlowFactor);
    }
  }

  public setLightingMode(mode: LightingMode) {
    this.dayNight.glideToMode(mode);
  }

  public setTimeOfDay(hour: number) {
    this.dayNight.setTimeOfDay(hour);
  }

  public getTimeOfDay(): number {
    return this.dayNight.timeOfDay;
  }

  public toggleAutoDayNight(enabled?: boolean): boolean {
    return this.dayNight.toggleAutoPlay(enabled);
  }

  public isAutoDayNight(): boolean {
    return this.dayNight.isAutoPlaying;
  }

  public setTimeSpeed(speed: number) {
    this.dayNight.setTimeSpeed(speed);
  }

  public setSimulationActive(active: boolean) {
    if (this.livingWorld) {
      this.livingWorld.setActive(active);
    }
  }

  public setEcoMode(eco: boolean) {
    if (this.livingWorld) {
      this.livingWorld.setEcoMode(eco);
    }
    if (this.renderer) {
      this.renderer.setPixelRatio(eco ? 1 : (this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2)));
      this.renderer.shadowMap.enabled = !eco && !this.isSoftwareGl;
    }
  }

  public setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = 0.65;
  }

  public resetView() {
    this.selectedBuildingId = null;
    this.selectionHighlightGroup.visible = false;
    const view = this.getResponsiveCameraView();
    this.defaultCameraPos.copy(view.pos);
    this.defaultLookAt.copy(view.target);
    this.flyTo(view.pos, view.target, 1.8);
  }

  /**
   * Smooth flight to target with elevated arc to guarantee camera never clips through roofs or terrain
   */
  public flyTo(
    eye: THREE.Vector3 | [number, number, number],
    target: THREE.Vector3 | [number, number, number],
    duration: number = 1.8
  ) {
    this.camStartPos.copy(this.camera.position);
    this.camTargetPos.set(
      Array.isArray(eye) ? eye[0] : eye.x,
      Array.isArray(eye) ? eye[1] : eye.y,
      Array.isArray(eye) ? eye[2] : eye.z
    );

    this.lookStart.copy(this.controls.target);
    this.lookTarget.set(
      Array.isArray(target) ? target[0] : target.x,
      Array.isArray(target) ? target[1] : target.y,
      Array.isArray(target) ? target[2] : target.z
    );

    // Calculate arc peak based on travel distance
    const dist = this.camStartPos.distanceTo(this.camTargetPos);
    this.transitionArcPeak = Math.min(16, Math.max(6, dist * 0.16));

    this.transitionDuration = Math.max(0.8, duration);
    this.transitionAlpha = 0;
    this.isTransitioning = true;
  }

  public travelToLocation(loc: LocationData) {
    this.selectedBuildingId = null;
    this.selectionHighlightGroup.visible = false;
    this.flyTo(loc.cameraPos, loc.target, 1.8);
  }

  private setupEvents() {
    window.addEventListener('resize', this.onResize);
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onVisibilityChange = () => {
    if (document.hidden) {
      this.clock.stop();
    } else {
      this.clock.start();
    }
  };

  private onResize = () => {
    if (!this.container || this.isDisposed) return;
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const view = this.getResponsiveCameraView();
    this.defaultCameraPos.copy(view.pos);
    this.defaultLookAt.copy(view.target);
    this.camera.fov = view.fov;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };

  private onPointerDown = (e: PointerEvent) => {
    this.isPointerDown = true;
    this.pointerDownPos.set(e.clientX, e.clientY);
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Raycast for both beacon markers and clickable buildings
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const allInteractive = [...this.beaconMeshes, ...this.clickableBuildingMeshes];
    const intersects = this.raycaster.intersectObjects(allInteractive, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      let label: string | null = null;

      if (hit.userData?.isLandmarkBeacon) {
        label = hit.userData.landmarkName;
      } else if (hit.userData?.isBuilding) {
        const b = BUILDINGS.find((item) => item.id === hit.userData.buildingId);
        label = b ? `${b.name} (${b.type})` : null;
      }

      this.renderer.domElement.style.cursor = 'pointer';
      this.onHoverLandmark(label);
    } else {
      this.renderer.domElement.style.cursor = 'default';
      this.onHoverLandmark(null);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.isPointerDown = false;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);

    // Only fire click if pointer wasn't dragged
    if (dist < 6) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const allInteractive = [...this.beaconMeshes, ...this.clickableBuildingMeshes];
      const intersects = this.raycaster.intersectObjects(allInteractive, false);

      if (intersects.length > 0) {
        const hit = intersects[0].object;

        if (hit.userData?.isLandmarkBeacon) {
          const id = hit.userData.landmarkId;
          const loc = LOCATIONS.find((l) => l.id === id);
          if (loc) {
            this.onSelectLandmark(loc);
            this.travelToLocation(loc);
          }
        } else if (hit.userData?.isBuilding) {
          const b = BUILDINGS.find((item) => item.id === hit.userData.buildingId);
          if (b) {
            this.selectBuilding(b);
            this.onSelectBuilding(b);
          }
        }
      }
    }
  };

  // 12. Main Render Loop
  private startLoop() {
    const render = () => {
      if (this.isDisposed) return;

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      // Smooth camera transition using smoothstep with elevated parabolic arc (anti-clipping)
      if (this.isTransitioning) {
        this.transitionAlpha += delta / this.transitionDuration;
        if (this.transitionAlpha >= 1) {
          this.transitionAlpha = 1;
          this.isTransitioning = false;
        }

        const t = this.transitionAlpha;
        const ease = t * t * (3 - 2 * t); // Smoothstep curve

        // Elevated arc trajectory
        const arcY = Math.sin(t * Math.PI) * this.transitionArcPeak;

        this.camera.position.lerpVectors(this.camStartPos, this.camTargetPos, ease);
        this.camera.position.y += arcY;

        this.controls.target.lerpVectors(this.lookStart, this.lookTarget, ease);
      }

      this.controls.update();

      // Continuous Animations
      if (this.animComponents) {
        // Grand fountain ripples & water spout pulsation
        if (this.animComponents.fountainWater) {
          this.animComponents.fountainWater.rotation.y = elapsed * 0.4;
          const s = 1 + Math.sin(elapsed * 3.5) * 0.02;
          this.animComponents.fountainWater.scale.set(s, 1, s);
        }
        if (this.animComponents.fountainSpout) {
          this.animComponents.fountainSpout.scale.y = 1 + Math.sin(elapsed * 4) * 0.15;
        }

        // Playground swing gentle pendulum sway
        if (this.animComponents.playgroundSwing) {
          this.animComponents.playgroundSwing.rotation.x = Math.sin(elapsed * 1.8) * 0.28;
        }

        // Moored rowboat gentle bobbing on lake
        if (this.animComponents.mooredRowboat) {
          this.animComponents.mooredRowboat.position.y = -0.15 + Math.sin(elapsed * 2.2) * 0.04;
          this.animComponents.mooredRowboat.rotation.z = Math.sin(elapsed * 1.6) * 0.05;
        }

        // Floating interactive beacon markers bounce & rotation
        if (this.animComponents.floatingBeaconMarkers) {
          this.animComponents.floatingBeaconMarkers.children.forEach((beacon, i) => {
            beacon.rotation.y = elapsed * 1.2 + i;
            const originalY = [5.0, 5.5, 4.5, 4.5, 3.8][i] || 4.5;
            beacon.position.y = originalY + Math.sin(elapsed * 2.2 + i * 1.2) * 0.35;
          });
        }
      }

      // Building selection highlight pulse animation
      if (this.selectionHighlightGroup && this.selectionHighlightGroup.visible) {
        this.selectionHighlightGroup.rotation.y = elapsed * 0.8;
      }

      // Update living world simulation (vehicles, pedestrians, streetlights, waves)
      if (this.livingWorld) {
        this.livingWorld.update(delta, elapsed);
      }

      // Update particle systems
      if (this.updateParticles) {
        this.updateParticles(delta, elapsed);
      }

      // Continuous real-time Day-Night Cycle passage
      if (this.dayNight) {
        const lightState = this.dayNight.update(delta);
        this.applyDayNightState(lightState);

        const curMin = Math.floor(lightState.hour * 60);
        if (curMin !== this.lastReportedMinute) {
          this.lastReportedMinute = curMin;
          this.onTimeChange?.(lightState.formattedTime, lightState.hour, lightState.modeTag);
        }
      }

      // Atmospheric high clouds drift
      if (this.cloudsGroup) {
        this.cloudsGroup.rotation.y = elapsed * 0.008;
      }
      if (this.midClouds) {
        this.midClouds.rotation.y = -elapsed * 0.012;
      }

      this.renderer.render(this.scene, this.camera);
      this.reqId = requestAnimationFrame(render);
    };

    this.reqId = requestAnimationFrame(render);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.reqId);

    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    const el = this.renderer?.domElement;
    if (el) {
      el.removeEventListener('pointerdown', this.onPointerDown);
      el.removeEventListener('pointermove', this.onPointerMove);
      el.removeEventListener('pointerup', this.onPointerUp);
    }

    this.livingWorld?.dispose();
    this.controls?.dispose();
    this.renderer?.dispose();

    if (this.renderer?.domElement && this.container?.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
