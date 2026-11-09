import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterialLibrary, MaterialLibrary } from './materials';
import { createModernVillageLandscape } from './terrain';
import { createModernVillage, AnimatedLandmarkComponents } from './landmarks';
import { createLivingNatureSystem, NatureSystemResult } from './natureSystem';
import { createAtmosphericClouds } from './clouds';
import { createParticleSystems } from './particles';
import { LivingWorldManager } from './livingWorld';
import { DayNightCycleController, InterpolatedLightState } from './dayNightCycle';
import { LightingMode, LOCATIONS, LocationData, BUILDINGS, BuildingInfo, ViewMode, GraphicsQuality, SimulationSpeed, WeatherMode } from '../types';
import { ConstructionManager } from '../builder/constructionManager';
import { CustomPlacedObject } from '../builder/types';
import { AvatarManager } from '../multiplayer/avatarManager';
import { PlayerData } from '../multiplayer/types';
import { WeatherManager } from './weather';
import { DrivableVehicle } from './drivableVehicle';
import { SpatialAuditSystem, SpatialAuditReport } from './spatialAuditSystem';
import { PavilionInteractionPoint, PAVILION_INTERACTION_POINTS } from './creatorPavilionInterior';
import { checkObstacleCollision } from './collisionSystem';
import { ActiveNPCEntity, WorldInteractionSpot } from './npcBehaviorSystem';
import { HumanoidGesture } from './humanoidCharacterSystem';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onSelectLandmark: (location: LocationData) => void;
  onSelectBuilding: (building: BuildingInfo | null) => void;
  onHoverLandmark: (name: string | null) => void;
  onLoadingComplete: () => void;
  onTimeChange?: (timeStr: string, hour: number, mode: LightingMode) => void;
  onBuildStateChange?: () => void;
  onBudgetChange?: (balance: number) => void;
  onSelectCustomObject?: (object: CustomPlacedObject | null) => void;
  onSelectRemotePlayer?: (player: PlayerData) => void;
  onDriveStateChange?: (driving: boolean) => void;
  onVehicleSpeedChange?: (speed: number, gear: 'D' | 'R' | 'P') => void;
  onNearPavilionInteraction?: (point: PavilionInteractionPoint | null) => void;
  onSelectPavilionPoint?: (point: PavilionInteractionPoint) => void;
  onPavilionInsideChange?: (inside: boolean) => void;
  onNearNPC?: (npc: ActiveNPCEntity | null) => void;
  onSelectNPC?: (npc: ActiveNPCEntity) => void;
  onNearWorldSpot?: (spot: WorldInteractionSpot | null) => void;
  onSelectSpot?: (spot: WorldInteractionSpot) => void;
  onPlayerGestureChange?: (gesture: HumanoidGesture) => void;
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
  public construction!: ConstructionManager;
  public avatars!: AvatarManager;
  public weather!: WeatherManager;
  public vehicle!: DrivableVehicle;
  public spatialAuditor!: SpatialAuditSystem;
  public onDriveStateChange?: (driving: boolean) => void;
  public onVehicleSpeedChange?: (speed: number, gear: 'D' | 'R' | 'P') => void;
  public onNearPavilionInteraction?: (point: PavilionInteractionPoint | null) => void;
  public onSelectPavilionPoint?: (point: PavilionInteractionPoint) => void;
  public onPavilionInsideChange?: (inside: boolean) => void;
  public onNearNPC?: (npc: ActiveNPCEntity | null) => void;
  public onSelectNPC?: (npc: ActiveNPCEntity) => void;
  public onNearWorldSpot?: (spot: WorldInteractionSpot | null) => void;
  public onSelectSpot?: (spot: WorldInteractionSpot) => void;
  public onPlayerGestureChange?: (gesture: HumanoidGesture) => void;
  public isInsidePavilion: boolean = false;
  public currentNearPavilionPoint: PavilionInteractionPoint | null = null;
  public currentNearNPC: ActiveNPCEntity | null = null;
  public currentNearSpot: WorldInteractionSpot | null = null;
  private lastNearNPCId: string | null = null;
  private lastNearSpotId: string | null = null;
  public isBuildMode: boolean = false;
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
  private natureSystemResult!: NatureSystemResult;
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

  private onBuildStateChange?: () => void;
  private onBudgetChange?: (balance: number) => void;
  private onSelectCustomObject?: (object: CustomPlacedObject | null) => void;
  private onSelectRemotePlayer?: (player: PlayerData) => void;

  constructor(options: SceneManagerOptions) {
    this.container = options.container;
    this.onSelectLandmark = options.onSelectLandmark;
    this.onSelectBuilding = options.onSelectBuilding;
    this.onHoverLandmark = options.onHoverLandmark;
    this.onLoadingComplete = options.onLoadingComplete;
    this.onTimeChange = options.onTimeChange;
    this.onBuildStateChange = options.onBuildStateChange;
    this.onBudgetChange = options.onBudgetChange;
    this.onSelectCustomObject = options.onSelectCustomObject;
    this.onSelectRemotePlayer = options.onSelectRemotePlayer;
    this.onDriveStateChange = options.onDriveStateChange;
    this.onVehicleSpeedChange = options.onVehicleSpeedChange;
    this.onNearPavilionInteraction = options.onNearPavilionInteraction;
    this.onSelectPavilionPoint = options.onSelectPavilionPoint;
    this.onPavilionInsideChange = options.onPavilionInsideChange;
    this.onNearNPC = options.onNearNPC;
    this.onSelectNPC = options.onSelectNPC;
    this.onNearWorldSpot = options.onNearWorldSpot;
    this.onSelectSpot = options.onSelectSpot;
    this.onPlayerGestureChange = options.onPlayerGestureChange;

    this.init();
  }

  public setBuildMode(enabled: boolean) {
    this.isBuildMode = enabled;
    if (!enabled) {
      this.construction?.cancelPlacement();
      this.construction?.selectPlacedObject(null);
    }
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
    this.controls.maxDistance = 280;
    this.controls.minDistance = 6;
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

    // Living Nature & River System (Riverbanks, Playgrounds, Botanical Themed Gardens, Sports Complex, Flocks of Birds)
    this.natureSystemResult = createLivingNatureSystem(this.materials);
    this.scene.add(this.natureSystemResult.natureGroup);

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

    // 12. Construction Manager (Village Builder System)
    this.construction = new ConstructionManager({
      scene: this.scene,
      materials: this.materials,
      isSoftwareGl: this.isSoftwareGl,
      onStateChange: () => {
        this.onBuildStateChange?.();
        if (this.onSelectCustomObject) {
          this.onSelectCustomObject(this.construction.getSelectedObjectData());
        }
      },
      onBudgetChange: (b) => this.onBudgetChange?.(b),
    });

    // 13. Multiplayer Avatars Manager
    this.avatars = new AvatarManager(this.scene, this.camera, this.materials, this.isSoftwareGl);

    // 14. Weather System (Subtle particles: Rain, Snow, Fog)
    this.weather = new WeatherManager(this.scene, isMobile);

    // 15. Drivable Electric Vehicle (Town Center Roadster)
    this.vehicle = new DrivableVehicle(this.scene, this.camera, this.materials);
    // 16. Authoritative Spatial Audit & Diagnostic Overlay System
    this.spatialAuditor = new SpatialAuditSystem(this.scene);
    this.vehicle.onSpeedChange = (speed, gear) => {
      this.onVehicleSpeedChange?.(speed, gear);
    };
    this.vehicle.onStateChange = (driving) => {
      this.onDriveStateChange?.(driving);
      this.controls.enabled = !driving;
      if (driving) {
        this.avatars?.setEnabled(false);
        this.avatars?.setFollowCamera(false);
        const localGrp = this.avatars?.getLocalAvatarGroup();
        if (localGrp) localGrp.visible = false;
      } else {
        this.avatars?.setEnabled(true);
        const localGrp = this.avatars?.getLocalAvatarGroup();
        if (localGrp) localGrp.visible = true;
      }
    };
    this.vehicle.onExitSafePosition = (safePos) => {
      const yaw = this.vehicle?.getYaw() ?? 0;
      if (this.avatars) {
        this.avatars.setEnabled(true);
        if (!this.avatars.getLocalAvatarGroup()) {
          // If no local avatar mesh exists yet, spawn resident explorer avatar beside car
          this.avatars.spawnLocalAvatar('Resident', 'cyan', 'explorer', [safePos.x, 0.22, safePos.z]);
        } else {
          this.avatars.setLocalPosition(safePos.x, 0.22, safePos.z, yaw);
        }
      }

      // Smoothly restore OrbitControls target and camera framing beside the parked EV
      this.controls.enabled = true;
      this.controls.target.set(safePos.x, 1.4, safePos.z);

      const camDist = 6.8;
      const camHeight = 3.6;
      this.camera.position.set(
        safePos.x - Math.sin(yaw) * camDist,
        0.22 + camHeight,
        safePos.z - Math.cos(yaw) * camDist
      );
      this.camera.lookAt(safePos.x, 1.4, safePos.z);
      this.controls.update();
    };

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
      this.controls.minDistance = 6;
      this.controls.maxDistance = 280;
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
    this.dirLight.shadow.camera.far = 280;
    const d = 135;
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

  public setTrafficActive(active: boolean) {
    if (this.livingWorld) {
      this.livingWorld.setTrafficActive(active);
    }
  }

  public setPedestriansActive(active: boolean) {
    if (this.livingWorld) {
      this.livingWorld.setPedestriansActive(active);
    }
  }

  public setEnvironmentAnimationActive(active: boolean) {
    if (this.livingWorld) {
      this.livingWorld.setEnvironmentAnimationActive(active);
    }
  }

  public setSimulationSpeed(speed: SimulationSpeed | number) {
    if (this.livingWorld) {
      this.livingWorld.setSimulationSpeed(speed);
    }
  }

  public resetSimulation() {
    if (this.livingWorld) {
      this.livingWorld.resetSimulation();
    }
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    if (this.livingWorld) {
      this.livingWorld.setQuality(quality);
    }

    if (!this.renderer || !this.dirLight) return;

    if (quality === 'low') {
      this.renderer.shadowMap.enabled = false;
      this.dirLight.castShadow = false;
      this.renderer.setPixelRatio(1.0);
    } else if (quality === 'medium') {
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      this.dirLight.castShadow = !this.isSoftwareGl;
      this.dirLight.shadow.mapSize.width = 1024;
      this.dirLight.shadow.mapSize.height = 1024;
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.5));
    } else {
      // High
      this.renderer.shadowMap.enabled = !this.isSoftwareGl;
      this.dirLight.castShadow = !this.isSoftwareGl;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2.0));
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
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);

    el.addEventListener('webglcontextlost', this.onContextLost, false);
    el.addEventListener('webglcontextrestored', this.onContextRestored, false);

    document.addEventListener('visibilitychange', this.onVisibilityChange);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(this.reqId);
  };

  private onContextRestored = () => {
    this.startLoop();
  };

  private onKeyUp = (e: KeyboardEvent) => {
    if (!e || typeof e.key !== 'string') return;
    if (this.vehicle?.getIsDriving()) {
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.vehicle.setThrottle(0);
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft' || e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.vehicle.setSteer(0);
      }
      if (e.key === ' ') {
        this.vehicle.setBraking(false);
      }
    }
  };

  private onKeyDown = (e: KeyboardEvent) => {
    if (!e || typeof e.key !== 'string') return;

    // Developer Diagnostic Shortcut: Shift + D toggles Spatial Debug Wireframes
    if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
      if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        this.toggleSpatialDebug();
        return;
      }
    }

    // Handle Driving Controls
    if (this.vehicle?.getIsDriving()) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'Escape' || e.key === 'e' || e.key === 'E') {
        this.stopDriving();
        return;
      }
      if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
        this.vehicle.setThrottle(1);
        return;
      }
      if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
        this.vehicle.setThrottle(-1);
        return;
      }
      if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
        this.vehicle.setSteer(1);
        return;
      }
      if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
        this.vehicle.setSteer(-1);
        return;
      }
      if (e.key === ' ') {
        e.preventDefault();
        this.vehicle.setBraking(true);
        return;
      }
    }

    if (this.isBuildMode && this.construction) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'r' || e.key === 'R' || e.key === 'e' || e.key === 'E') {
        if (this.construction.getActiveCatalogItem()) {
          this.construction.rotatePreview(45);
        } else if (this.construction.getSelectedObjectId()) {
          this.construction.rotateSelectedObject(45);
        }
        return;
      }
      if (e.key === 'q' || e.key === 'Q') {
        if (this.construction.getActiveCatalogItem()) {
          this.construction.rotatePreview(-45);
        } else if (this.construction.getSelectedObjectId()) {
          this.construction.rotateSelectedObject(-45);
        }
        return;
      }
      if (e.key === 'Escape') {
        this.construction.cancelPlacement();
        this.construction.selectPlacedObject(null);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        if (e.shiftKey) {
          this.construction.redo();
        } else {
          this.construction.undo();
        }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.construction.getSelectedObjectId()) {
          this.construction.deleteSelectedObject();
          return;
        }
      }
    }

    // Pavilion / World interaction shortcut: [E] inspects nearby exhibit, NPC, or public spot
    if ((e.key === 'e' || e.key === 'E') && !this.vehicle?.getIsDriving() && !this.isBuildMode) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (this.currentNearPavilionPoint) {
        this.onSelectPavilionPoint?.(this.currentNearPavilionPoint);
        return;
      }
      if (this.currentNearNPC) {
        this.onSelectNPC?.(this.currentNearNPC);
        return;
      }
      if (this.currentNearSpot) {
        this.onSelectSpot?.(this.currentNearSpot);
        return;
      }
    }

    // Number keys 1-5 for player gestures
    if (!this.vehicle?.getIsDriving() && !this.isBuildMode && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      if (e.key === '1') {
        this.setLocalPlayerGesture('wave');
        this.onPlayerGestureChange?.('wave');
        return;
      }
      if (e.key === '2') {
        this.setLocalPlayerGesture('sit');
        this.onPlayerGestureChange?.('sit');
        return;
      }
      if (e.key === '3') {
        this.setLocalPlayerGesture('cheer');
        this.onPlayerGestureChange?.('cheer');
        return;
      }
      if (e.key === '4') {
        this.setLocalPlayerGesture('dance');
        this.onPlayerGestureChange?.('dance');
        return;
      }
      if (e.key === '5') {
        this.setLocalPlayerGesture('none');
        this.onPlayerGestureChange?.('none');
        return;
      }
    }

    if (this.currentViewMode !== 'street') return;
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    // Do not interfere with avatar movement when avatar follow camera is active
    if (this.avatars?.isFollowCameraActive()) return;

    const moveStep = 0.9;
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    let stepVec: THREE.Vector3 | null = null;
    if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
      stepVec = forward.clone().multiplyScalar(moveStep);
    } else if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
      stepVec = forward.clone().multiplyScalar(-moveStep);
    } else if (e.key === 'a' || e.key === 'A' || e.key === 'ArrowLeft') {
      stepVec = right.clone().multiplyScalar(-moveStep);
    } else if (e.key === 'd' || e.key === 'D' || e.key === 'ArrowRight') {
      stepVec = right.clone().multiplyScalar(moveStep);
    }

    if (stepVec) {
      const nextTarget = this.controls.target.clone().add(stepVec);
      const col = checkObstacleCollision(nextTarget.x, nextTarget.z, 0.35);
      if (!col.collided) {
        this.camera.position.add(stepVec);
        this.controls.target.copy(nextTarget);
      }
    }
  };

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

    // In placement mode, temporarily disable camera orbit on pointerdown so placing doesn't rotate view
    if (this.isBuildMode && this.construction?.getActiveCatalogItem()) {
      this.controls.enableRotate = false;
    } else {
      this.controls.enableRotate = true;
    }
  };

  private onPointerMove = (e: PointerEvent) => {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);

    // Build Mode Pointer Raycasting
    if (this.isBuildMode && this.construction) {
      if (this.construction.getActiveCatalogItem()) {
        this.construction.updatePointerPosition(this.raycaster);
        this.renderer.domElement.style.cursor = 'crosshair';
        this.onHoverLandmark(null);
        return;
      }

      const customHitId = this.construction.raycastCustomObject(this.raycaster);
      if (customHitId) {
        this.renderer.domElement.style.cursor = 'pointer';
        this.onHoverLandmark('Custom Placed Structure (Click to Edit)');
        return;
      }
    }

    // Raycast for both beacon markers and clickable buildings
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
    this.controls.enableRotate = true;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);

    // Only fire click if pointer wasn't dragged
    if (dist < 6) {
      this.raycaster.setFromCamera(this.pointer, this.camera);

      // Build Mode Interaction
      if (this.isBuildMode && this.construction) {
        if (this.construction.getActiveCatalogItem()) {
          // Confirm placement
          this.construction.confirmPlacement();
          return;
        }

        const customHitId = this.construction.raycastCustomObject(this.raycaster);
        if (customHitId) {
          this.construction.selectPlacedObject(customHitId);
          return;
        } else {
          this.construction.selectPlacedObject(null);
        }
      }

      // Check if remote player was clicked
      if (!this.isBuildMode && this.avatars) {
        const remotePlayer = this.avatars.raycastAvatar(this.raycaster);
        if (remotePlayer) {
          this.onSelectRemotePlayer?.(remotePlayer);
          return;
        }
      }

      // Check if drivable vehicle was clicked
      if (!this.isBuildMode && this.vehicle && !this.vehicle.getIsDriving()) {
        const vehicleHits = this.raycaster.intersectObject(this.vehicle.getGroup(), true);
        if (vehicleHits.length > 0) {
          this.startDriving();
          return;
        }
      }

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
        } else if (hit.userData?.isPavilionInteractable && hit.userData?.pointId) {
          const pt = PAVILION_INTERACTION_POINTS.find((p) => p.id === hit.userData.pointId);
          if (pt) {
            this.onSelectPavilionPoint?.(pt);
            return;
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

      const isAvatarFollowActive = !this.vehicle?.getIsDriving() && (this.avatars?.isFollowCameraActive() ?? false);

      if (!this.vehicle?.getIsDriving()) {
        if (isAvatarFollowActive) {
          this.controls.enabled = false;
        } else {
          this.controls.enabled = true;
          this.controls.update();

          // Guarantee camera never clips underground, below sidewalks, or inside foundation plinths
          const minCamY = this.currentViewMode === 'street' ? 1.6 : 3.5;
          if (this.camera.position.y < minCamY) {
            this.camera.position.y = minCamY;
          }
          if (this.currentViewMode === 'street' && this.controls.target.y < 1.0) {
            this.controls.target.y = 1.0;
          }

          // Guarantee camera does not clip through pavilion roof when inside
          if (this.isInsidePavilion) {
            if (this.camera.position.y > 4.15) {
              this.camera.position.y = 4.15;
            }
          }
        }
      }

      // Continuous Animations
      if (this.animComponents) {
        const isEnvAnim = this.livingWorld?.getEnvironmentAnimationActive() ?? true;
        if (isEnvAnim) {
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

          // Playground seesaw tilting animation
          if (this.animComponents.playgroundSeesaw) {
            this.animComponents.playgroundSeesaw.rotation.z = Math.sin(elapsed * 1.6) * 0.16;
          }

          // Shimmering continuous river and lake water ripple flow
          if (this.materials.waterRippleTexture) {
            this.materials.waterRippleTexture.offset.y = (elapsed * 0.04) % 1;
            this.materials.waterRippleTexture.offset.x = (elapsed * 0.015) % 1;
          }

          // Moored rowboat gentle bobbing on lake
          if (this.animComponents.mooredRowboat) {
            this.animComponents.mooredRowboat.position.y = -0.15 + Math.sin(elapsed * 2.2) * 0.04;
            this.animComponents.mooredRowboat.rotation.z = Math.sin(elapsed * 1.6) * 0.05;
          }

          // Wind sway on parkland, garden & avenue trees
          if (this.animComponents.foliageWindGroup) {
            const trees = this.animComponents.foliageWindGroup.children;
            for (let t = 0; t < trees.length; t++) {
              trees[t].rotation.z = Math.sin(elapsed * 1.5 + t * 0.45) * 0.022;
              trees[t].rotation.x = Math.cos(elapsed * 1.2 + t * 0.35) * 0.015;
            }
          }
        }

        // Floating interactive beacon markers bounce & rotation
        if (this.animComponents.floatingBeaconMarkers) {
          this.animComponents.floatingBeaconMarkers.children.forEach((beacon, i) => {
            beacon.rotation.y = elapsed * 1.2 + i;
            const originalY = [5.0, 5.5, 4.5, 4.5, 3.8][i] || 4.5;
            beacon.position.y = originalY + Math.sin(elapsed * 2.2 + i * 1.2) * 0.35;
          });
        }

        // Update Creator Pavilion explorable interior: automatic sliding doors, holographic universe, proximity interactions
        if (this.animComponents.creatorPavilion) {
          const pavilion = this.animComponents.creatorPavilion;
          const focusPos = this.vehicle?.getIsDriving()
            ? this.vehicle.getPosition()
            : (this.currentViewMode === 'street' || this.isInsidePavilion ? this.controls.target : this.camera.position);

          pavilion.slidingDoors.update(focusPos, delta);
          pavilion.updateAnimation(delta, elapsed);

          // Check if inside pavilion ground floor footprint
          const isInside = focusPos.x >= 23.3 && focusPos.x <= 31.7 && focusPos.z >= 11.3 && focusPos.z <= 18.7 && focusPos.y <= 4.2;
          if (isInside !== this.isInsidePavilion) {
            this.isInsidePavilion = isInside;
            this.onPavilionInsideChange?.(isInside);
          }

          // Proximity detection for interactive exhibits
          const nearPt = pavilion.checkNearInteraction(focusPos);
          const nearId = nearPt ? nearPt.id : null;
          const lastId = this.currentNearPavilionPoint ? this.currentNearPavilionPoint.id : null;
          if (nearId !== lastId) {
            this.currentNearPavilionPoint = nearPt;
            this.onNearPavilionInteraction?.(nearPt);
          }
        }
      }

      // Update Living Nature environmental animations (soaring birds, river reeds sway, swings, seesaws)
      if (this.natureSystemResult) {
        this.natureSystemResult.updateAnimation(elapsed, delta);
      }

      // Building selection highlight pulse animation
      if (this.selectionHighlightGroup && this.selectionHighlightGroup.visible) {
        this.selectionHighlightGroup.rotation.y = elapsed * 0.8;
      }

      // Update living world simulation (vehicles, pedestrians, streetlights, waves, intelligent NPCs, environmental life)
      if (this.livingWorld) {
        const playerPos = this.vehicle?.getIsDriving()
          ? this.vehicle.getPosition()
          : this.avatars?.getLocalAvatarPosition() ?? null;

        if (this.vehicle) {
          this.livingWorld.setPlayerVehicle(
            this.vehicle.getIsDriving() ? this.vehicle.getPosition() : null,
            1.35
          );
        }
        if (playerPos) {
          this.livingWorld.setPlayerAvatarPosition({ x: playerPos.x, z: playerPos.z });
        } else {
          this.livingWorld.setPlayerAvatarPosition(null);
        }

        const currentHour = this.dayNight ? this.dayNight.timeOfDay : 12.0;
        this.livingWorld.update(delta, elapsed, currentHour, playerPos, this.camera.position);

        // Check Nearby NPC & World Interaction Spots
        const nearNPC = this.livingWorld.npcManager?.getActiveNearbyNPC() ?? null;
        const nearNPCId = nearNPC ? nearNPC.profile.id : null;
        if (nearNPCId !== this.lastNearNPCId) {
          this.lastNearNPCId = nearNPCId;
          this.currentNearNPC = nearNPC;
          this.onNearNPC?.(nearNPC);
        }

        const nearSpot = this.livingWorld.npcManager?.getActiveNearbySpot() ?? null;
        const nearSpotId = nearSpot ? nearSpot.id : null;
        if (nearSpotId !== this.lastNearSpotId) {
          this.lastNearSpotId = nearSpotId;
          this.currentNearSpot = nearSpot;
          this.onNearWorldSpot?.(nearSpot);
        }
      }

      // Update weather system (rain streaks, snowflakes, fog atmospheric transitions)
      if (this.weather) {
        const isEnvAnim = this.livingWorld?.getEnvironmentAnimationActive() ?? true;
        this.weather.setAnimationActive(isEnvAnim);
        this.weather.update(delta, elapsed);
      }

      // Update drivable vehicle physics & chase camera
      if (this.vehicle) {
        if (this.livingWorld) {
          this.vehicle.trafficObstacles = this.livingWorld.getTrafficObstacles();
        }
        this.vehicle.update(delta, elapsed);
      }

      // Update multiplayer avatars (local avatar walking & remote players smooth interpolation)
      if (this.avatars) {
        this.avatars.update(delta);
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

  // --- Weather & Driving Controls ---

  public setWeather(mode: WeatherMode) {
    this.weather?.setWeather(mode);
  }

  public startDriving() {
    if (this.isBuildMode) return;
    this.selectedBuildingId = null;
    this.selectionHighlightGroup.visible = false;
    this.controls.enabled = false;
    if (this.avatars) {
      this.avatars.setEnabled(false);
      this.avatars.setFollowCamera(false);
      const localGrp = this.avatars.getLocalAvatarGroup();
      if (localGrp) localGrp.visible = false;
    }
    this.vehicle?.enter();
    this.onDriveStateChange?.(true);
  }

  public stopDriving() {
    this.vehicle?.exit();
  }

  public resetVehicle() {
    this.vehicle?.resetToSpawn();
  }

  public getVehicleDiagnostics() {
    return this.vehicle?.getDiagnostics();
  }

  public getIsDriving(): boolean {
    return this.vehicle?.getIsDriving() ?? false;
  }

  public getNavPositions(): {
    playerPos: { x: number; z: number; yaw: number } | null;
    vehiclePos: { x: number; z: number; yaw: number };
    isDriving: boolean;
  } {
    const vPos = this.vehicle?.getPosition() || new THREE.Vector3(-22, 0.12, -2);
    const vYaw = this.vehicle?.getYaw() ?? Math.PI / 2;
    const isDriving = this.vehicle?.getIsDriving() ?? false;

    let playerPos: { x: number; z: number; yaw: number } | null = null;
    const localAvatar = this.avatars?.getLocalAvatarPosition();
    if (localAvatar) {
      playerPos = {
        x: localAvatar.x,
        z: localAvatar.z,
        yaw: localAvatar.rotation,
      };
    } else if (!isDriving) {
      playerPos = {
        x: this.controls?.target.x ?? 0,
        z: this.controls?.target.z ?? 0,
        yaw: 0,
      };
    }

    return {
      playerPos,
      vehiclePos: { x: vPos.x, z: vPos.z, yaw: vYaw },
      isDriving,
    };
  }

  public toggleSpatialDebug(): boolean {
    return this.spatialAuditor?.toggle() ?? false;
  }

  public setSpatialDebugVisible(visible: boolean) {
    this.spatialAuditor?.setVisible(visible);
  }

  public getSpatialDebugVisible(): boolean {
    return this.spatialAuditor?.getIsVisible() ?? false;
  }

  public getSpatialAuditReport(): SpatialAuditReport | null {
    return this.spatialAuditor?.runAudit() ?? null;
  }

  public getCameraState(): { position: THREE.Vector3; target: THREE.Vector3 } {
    return {
      position: this.camera.position.clone(),
      target: this.controls.target.clone(),
    };
  }

  public enterCreatorPavilion() {
    this.setViewMode('street');
    this.flyTo([25.0, 1.6, 15.0], [27.5, 1.4, 15.0], 1.5);
  }

  public exitCreatorPavilion() {
    this.setViewMode('street');
    this.flyTo([19.0, 2.0, 15.0], [27.5, 1.6, 15.0], 1.5);
  }

  public teleportPavilionRooftop() {
    this.setViewMode('street');
    this.flyTo([26.0, 5.8, 17.0], [30.0, 4.5, 15.0], 1.5);
  }

  public teleportPavilionGround() {
    this.setViewMode('street');
    this.flyTo([25.0, 1.6, 15.0], [27.5, 1.4, 15.0], 1.5);
  }

  public getLivingWorld(): LivingWorldManager {
    return this.livingWorld;
  }

  public getActiveNearbyNPC() {
    return this.livingWorld?.npcManager?.getActiveNearbyNPC() ?? null;
  }

  public getActiveNearbySpot() {
    return this.livingWorld?.npcManager?.getActiveNearbySpot() ?? null;
  }

  public setNPCTalkingState(npcId: string, isTalking: boolean) {
    this.livingWorld?.npcManager?.setNPCTalkingState(npcId, isTalking);
  }

  public setLocalPlayerGesture(gesture: import('./humanoidCharacterSystem').HumanoidGesture) {
    if (this.avatars) {
      this.avatars.setGesture(gesture);
    }
  }

  public getLocalPlayerGesture(): import('./humanoidCharacterSystem').HumanoidGesture {
    return this.avatars?.getGesture() ?? 'none';
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.reqId);

    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);

    const el = this.renderer?.domElement;
    if (el) {
      el.removeEventListener('pointerdown', this.onPointerDown);
      el.removeEventListener('pointermove', this.onPointerMove);
      el.removeEventListener('pointerup', this.onPointerUp);
      el.removeEventListener('webglcontextlost', this.onContextLost);
      el.removeEventListener('webglcontextrestored', this.onContextRestored);
    }

    this.spatialAuditor?.dispose();
    this.weather?.dispose();
    this.vehicle?.dispose();
    this.construction?.dispose();
    this.avatars?.dispose();
    this.livingWorld?.dispose();
    if (this.natureSystemResult) {
      this.scene.remove(this.natureSystemResult.natureGroup);
    }
    this.controls?.dispose();
    this.renderer?.dispose();

    if (this.renderer?.domElement && this.container?.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}

