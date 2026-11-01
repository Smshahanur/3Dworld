import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterialLibrary, MaterialLibrary } from './materials';
import { createFloatingIsland } from './terrain';
import { createLandmarks, AnimatedLandmarkComponents } from './landmarks';
import { createAtmosphericClouds } from './clouds';
import { createParticleSystems } from './particles';
import { LightingMode, LOCATIONS, LocationData } from '../types';

export interface SceneManagerOptions {
  container: HTMLDivElement;
  onSelectLandmark: (location: LocationData) => void;
  onHoverLandmark: (name: string | null) => void;
  onLoadingComplete: () => void;
}

export class SceneManager {
  private container: HTMLDivElement;
  private renderer!: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private controls!: OrbitControls;
  private materials!: MaterialLibrary;
  private animComponents!: AnimatedLandmarkComponents;
  private beaconMeshes: THREE.Mesh[] = [];
  private updateParticles!: (delta: number, elapsed: number) => void;
  private cloudsGroup!: THREE.Group;
  private midClouds!: THREE.Group;
  private lowClouds!: THREE.Group;
  private islandGroup!: THREE.Group;
  private skyDome!: THREE.Mesh;

  // Lights & Fog
  private dirLight!: THREE.DirectionalLight;
  private hemiLight!: THREE.HemisphereLight;
  private ambientLight!: THREE.AmbientLight;
  private fillLight!: THREE.DirectionalLight;
  private fog!: THREE.FogExp2;

  // Camera Animation State
  private isTransitioning: boolean = false;
  private camStartPos = new THREE.Vector3();
  private camTargetPos = new THREE.Vector3();
  private lookStart = new THREE.Vector3();
  private lookTarget = new THREE.Vector3();
  private transitionAlpha: number = 0;
  private transitionDuration: number = 1.6;

  // Default Hero View (Comfortable elevated isometric angle showing the entire floating island)
  public readonly defaultCameraPos = new THREE.Vector3(38, 30, 54);
  public readonly defaultLookAt = new THREE.Vector3(0, 1.5, 0);

  // Raycasting
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private isPointerDown: boolean = false;
  private pointerDownPos = new THREE.Vector2();

  // Callbacks
  private onSelectLandmark: (location: LocationData) => void;
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
    this.onHoverLandmark = options.onHoverLandmark;
    this.onLoadingComplete = options.onLoadingComplete;

    this.init();
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
    this.renderer.toneMappingExposure = 1.2;
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.container.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.outline = 'none';

    // 3. Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.fog = new THREE.FogExp2(0x060913, 0.0075);
    this.scene.fog = this.fog;

    // 4. Camera (Field of view tuned to 44 deg for cinematic perspective)
    this.camera = new THREE.PerspectiveCamera(44, width / height, 0.5, 550);
    this.camera.position.copy(this.defaultCameraPos);

    // 5. Controls with smooth damping
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(this.defaultLookAt);
    this.controls.maxDistance = 125;
    this.controls.minDistance = 16;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera from entering terrain or sinking below ground
    this.controls.minPolarAngle = 0.15;

    // Cancel camera transition when user manually interacts
    this.controls.addEventListener('start', () => {
      this.isTransitioning = false;
    });

    // 6. Mandatory Studio Environment Reflection (RoomEnvironment)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // RoomEnvironment fallback handled
    }

    // 7. Lighting Rig (Key, Fill, Hemisphere, Emissive balance)
    this.setupLighting();

    // 8. Procedural Sky Dome for depth
    this.setupSkyDome();

    // 9. Materials & Procedural World Geometry
    this.materials = createMaterialLibrary(this.isSoftwareGl);
    this.islandGroup = createFloatingIsland(this.materials);
    this.scene.add(this.islandGroup);

    const landmarksResult = createLandmarks(this.materials);
    this.animComponents = landmarksResult.animatedComponents;
    this.beaconMeshes = landmarksResult.beaconMeshes;
    this.scene.add(landmarksResult.landmarksGroup);

    // Layered Atmospheric Clouds
    const cloudsResult = createAtmosphericClouds(this.materials, isMobile);
    this.cloudsGroup = cloudsResult.cloudGroup;
    this.midClouds = cloudsResult.midClouds;
    this.lowClouds = cloudsResult.lowClouds;
    this.scene.add(this.cloudsGroup);

    // Particle Systems (Ambient motes + Swirling portal vortex)
    const particlesResult = createParticleSystems(isMobile);
    this.updateParticles = particlesResult.updateParticles;
    this.scene.add(particlesResult.particleGroup);

    // Pre-warm shaders
    if (!this.isSoftwareGl) {
      try {
        this.renderer.compile(this.scene, this.camera);
      } catch {
        // Safe catch
      }
    }

    // 10. Event Listeners
    this.setupEvents();

    // Inform parent loading complete
    setTimeout(() => {
      this.onLoadingComplete();
    }, 450);

    // 11. Start Render Loop
    this.startLoop();
  }

  private setupLighting() {
    // Key Sun Light (Warm golden directional sun with tuned soft shadows)
    this.dirLight = new THREE.DirectionalLight(0xfff7ed, 3.4);
    this.dirLight.position.set(38, 48, 28);
    this.dirLight.castShadow = !this.isSoftwareGl;
    this.dirLight.shadow.mapSize.width = 1024;
    this.dirLight.shadow.mapSize.height = 1024;
    this.dirLight.shadow.camera.near = 1;
    this.dirLight.shadow.camera.far = 130;
    const d = 36;
    this.dirLight.shadow.camera.left = -d;
    this.dirLight.shadow.camera.right = d;
    this.dirLight.shadow.camera.top = d;
    this.dirLight.shadow.camera.bottom = -d;
    this.dirLight.shadow.bias = -0.0004;
    this.dirLight.shadow.normalBias = 0.02;
    this.scene.add(this.dirLight);

    // Soft Rim/Fill Light (Opposite side cool cyan illumination)
    this.fillLight = new THREE.DirectionalLight(0x38bdf8, 1.2);
    this.fillLight.position.set(-36, 22, -26);
    this.scene.add(this.fillLight);

    // Sky/Ground Hemisphere Light (Pairing warm sky against deep cool underbody fill)
    this.hemiLight = new THREE.HemisphereLight(0x7dd3fc, 0x1e1b4b, 1.4);
    this.scene.add(this.hemiLight);

    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0x0f172a, 0.95);
    this.scene.add(this.ambientLight);
  }

  private setupSkyDome() {
    // Giant inverted celestial sky dome
    const skyGeo = new THREE.SphereGeometry(380, 24, 16);
    skyGeo.scale(-1, 1, 1); // Render inside

    // Create sky canvas gradient
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#060913');
    grad.addColorStop(0.35, '#0b1329');
    grad.addColorStop(0.65, '#0e223d');
    grad.addColorStop(0.9, '#1a365d');
    grad.addColorStop(1, '#0c1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 512);

    // Fine celestial starlight speckles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 280; i++) {
      const sx = Math.random() * 256;
      const sy = Math.random() * 320;
      const sr = Math.random() > 0.85 ? 1.5 : 0.8;
      ctx.beginPath();
      ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fill();
    }

    const skyTex = new THREE.CanvasTexture(canvas);
    skyTex.colorSpace = THREE.SRGBColorSpace;

    const skyMat = new THREE.MeshBasicMaterial({
      map: skyTex,
      side: THREE.BackSide,
      fog: false,
    });

    this.skyDome = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(this.skyDome);
  }

  public setLightingMode(mode: LightingMode) {
    switch (mode) {
      case 'dawn':
        this.dirLight.color.setHex(0xfda4af); // Warm rose/gold
        this.dirLight.intensity = 2.6;
        this.dirLight.position.set(42, 20, 32);
        this.fillLight.color.setHex(0xc084fc);
        this.hemiLight.color.setHex(0xfbcfe8);
        this.hemiLight.groundColor.setHex(0x311042);
        this.fog.color.setHex(0x19142b);
        this.scene.background = new THREE.Color(0x19142b);
        break;
      case 'day':
        this.dirLight.color.setHex(0xfffbeb); // Radiant gold sun
        this.dirLight.intensity = 3.6;
        this.dirLight.position.set(38, 48, 28);
        this.fillLight.color.setHex(0x38bdf8);
        this.hemiLight.color.setHex(0x7dd3fc);
        this.hemiLight.groundColor.setHex(0x0f2b38);
        this.fog.color.setHex(0x0a192f);
        this.scene.background = new THREE.Color(0x0a192f);
        break;
      case 'twilight':
        this.dirLight.color.setHex(0xf97316); // Sunset amber orange
        this.dirLight.intensity = 2.9;
        this.dirLight.position.set(-38, 14, -28);
        this.fillLight.color.setHex(0xd946ef);
        this.hemiLight.color.setHex(0xf472b6);
        this.hemiLight.groundColor.setHex(0x1e1b4b);
        this.fog.color.setHex(0x1e112a);
        this.scene.background = new THREE.Color(0x1e112a);
        break;
      case 'cyber-night':
      default:
        this.dirLight.color.setHex(0x60a5fa); // Cyan moonlight
        this.dirLight.intensity = 1.8;
        this.dirLight.position.set(-24, 38, -22);
        this.fillLight.color.setHex(0x818cf8);
        this.hemiLight.color.setHex(0x818cf8);
        this.hemiLight.groundColor.setHex(0x060913);
        this.fog.color.setHex(0x060913);
        this.scene.background = new THREE.Color(0x060913);
        break;
    }
  }

  public setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled;
    this.controls.autoRotateSpeed = 0.75;
  }

  public resetView() {
    this.flyTo(this.defaultCameraPos, this.defaultLookAt, 1.8);
  }

  public flyTo(eye: THREE.Vector3 | [number, number, number], target: THREE.Vector3 | [number, number, number], duration: number = 1.8) {
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

    this.transitionDuration = Math.max(0.8, duration);
    this.transitionAlpha = 0;
    this.isTransitioning = true;
  }

  public travelToLocation(loc: LocationData) {
    this.flyTo(loc.cameraPos, loc.target, 1.7);
  }

  private setupEvents() {
    window.addEventListener('resize', this.onResize);
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', this.onPointerDown);
    el.addEventListener('pointermove', this.onPointerMove);
    el.addEventListener('pointerup', this.onPointerUp);

    // Pause when tab hidden
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

    // Raycast for hover
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const intersects = this.raycaster.intersectObjects(this.beaconMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      const name = hit.userData?.landmarkName || null;
      this.renderer.domElement.style.cursor = 'pointer';
      this.onHoverLandmark(name);
    } else {
      this.renderer.domElement.style.cursor = 'default';
      this.onHoverLandmark(null);
    }
  };

  private onPointerUp = (e: PointerEvent) => {
    this.isPointerDown = false;
    const dist = Math.hypot(e.clientX - this.pointerDownPos.x, e.clientY - this.pointerDownPos.y);
    if (dist < 6) {
      this.raycaster.setFromCamera(this.pointer, this.camera);
      const intersects = this.raycaster.intersectObjects(this.beaconMeshes, false);
      if (intersects.length > 0) {
        const id = intersects[0].object.userData?.landmarkId;
        const loc = LOCATIONS.find((l) => l.id === id);
        if (loc) {
          this.onSelectLandmark(loc);
          this.travelToLocation(loc);
        }
      }
    }
  };

  private startLoop() {
    const tick = () => {
      if (this.isDisposed) return;

      const delta = Math.min(this.clock.getDelta(), 0.1);
      const elapsed = this.clock.getElapsedTime();

      // 1. Camera Transitions with exponential damping
      if (this.isTransitioning) {
        this.transitionAlpha += delta / this.transitionDuration;
        const t = Math.min(1, this.transitionAlpha);
        const ease = 1 - Math.pow(1 - t, 3);

        this.camera.position.lerpVectors(this.camStartPos, this.camTargetPos, ease);
        this.controls.target.lerpVectors(this.lookStart, this.lookTarget, ease);

        if (t >= 1) {
          this.isTransitioning = false;
        }
      }

      this.controls.update();

      // 2. Animate Enhanced Landmarks
      if (this.animComponents) {
        // Central Portal layered counter-rotating rings
        this.animComponents.portalOuterRing.rotation.z = elapsed * 0.32;
        this.animComponents.portalInnerRing.rotation.z = -elapsed * 0.52;
        this.animComponents.portalGyroscopicRing.rotation.x = elapsed * 0.65;
        this.animComponents.portalGyroscopicRing.rotation.y = elapsed * 0.45;
        this.animComponents.portalCore.rotation.y = elapsed * 1.1;
        this.animComponents.portalCore.rotation.x = elapsed * 0.5;
        this.animComponents.portalShards.rotation.y = elapsed * 0.75;
        this.animComponents.portalLightColumn.scale.x = 1.0 + Math.sin(elapsed * 2.2) * 0.08;
        this.animComponents.portalLightColumn.scale.z = 1.0 + Math.sin(elapsed * 2.2) * 0.08;

        // Sky Temple hovering sacred orb & armillary rings
        this.animComponents.templeOrb.position.y = 4.4 + Math.sin(elapsed * 2.0) * 0.28;
        this.animComponents.templeAltarRings.rotation.x = elapsed * 0.55;
        this.animComponents.templeAltarRings.rotation.y = elapsed * 0.72;

        // Cloud City kinetic rotating beacon rings
        this.animComponents.cityBeaconRings.rotation.z = elapsed * 0.45;

        // Subtle natural wind sway on Aurora Forest trees
        this.animComponents.forestWindGroup.rotation.z = Math.sin(elapsed * 1.2) * 0.016;

        // Hovering 3D Beacons
        this.animComponents.floatingBeaconMarkers.children.forEach((b, idx) => {
          b.position.y += Math.sin(elapsed * 2.5 + idx) * 0.003;
          b.rotation.y = elapsed * 0.8 + idx;
        });
      }

      // 3. Flowing Waterfall Animation (texture v-offset)
      if (this.materials?.waterfallFoamTex) {
        this.materials.waterfallFoamTex.offset.y -= delta * 1.35;
      }

      // 4. Layered Clouds Gentle Drift
      if (this.midClouds) {
        this.midClouds.rotation.y = elapsed * 0.008;
      }
      if (this.lowClouds) {
        this.lowClouds.rotation.y = -elapsed * 0.005;
      }

      // 5. Update Particles (Ambient Motes & Portal Vortex)
      if (this.updateParticles) {
        this.updateParticles(delta, elapsed);
      }

      // 6. Render Scene
      this.renderer.render(this.scene, this.camera);

      this.reqId = requestAnimationFrame(tick);
    };

    this.reqId = requestAnimationFrame(tick);
  }

  public dispose() {
    this.isDisposed = true;
    cancelAnimationFrame(this.reqId);

    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    const el = this.renderer.domElement;
    if (el) {
      el.removeEventListener('pointerdown', this.onPointerDown);
      el.removeEventListener('pointermove', this.onPointerMove);
      el.removeEventListener('pointerup', this.onPointerUp);
    }

    this.controls.dispose();
    this.renderer.dispose();
    if (el && el.parentElement) {
      el.parentElement.removeChild(el);
    }
  }
}
