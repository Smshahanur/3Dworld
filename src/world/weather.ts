import * as THREE from 'three';
import { WeatherMode, GraphicsQuality } from '../types';

export class WeatherManager {
  private scene: THREE.Scene;
  private isMobile: boolean;
  public group: THREE.Group;

  private currentWeather: WeatherMode = 'clear';
  private envAnimationActive: boolean = true;
  private graphicsQuality: GraphicsQuality = 'medium';

  // Particle systems
  private rainPoints: THREE.Points | null = null;
  private rainGeo: THREE.BufferGeometry | null = null;
  private rainPositions: Float32Array | null = null;
  private rainCount: number = 500;

  private snowPoints: THREE.Points | null = null;
  private snowGeo: THREE.BufferGeometry | null = null;
  private snowPositions: Float32Array | null = null;
  private snowVelocities: Float32Array | null = null;
  private snowCount: number = 350;

  // Fog & Atmosphere cache
  private baseFogDensity: number = 0.0055;
  private baseFogColor: number = 0x0f1c30;

  constructor(scene: THREE.Scene, isMobile: boolean) {
    this.scene = scene;
    this.isMobile = isMobile;

    this.group = new THREE.Group();
    this.group.name = 'WeatherSystem';
    this.scene.add(this.group);

    this.initParticleSystems();
    this.setWeather('clear');
  }

  private initParticleSystems() {
    this.configureParticleCounts();

    // 1. Rain Particle System
    const rainCanvas = document.createElement('canvas');
    rainCanvas.width = 16;
    rainCanvas.height = 64;
    const rCtx = rainCanvas.getContext('2d');
    if (rCtx) {
      const grad = rCtx.createLinearGradient(8, 0, 8, 64);
      grad.addColorStop(0, 'rgba(186, 230, 253, 0.1)');
      grad.addColorStop(0.5, 'rgba(186, 230, 253, 0.7)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.95)');
      rCtx.fillStyle = grad;
      rCtx.fillRect(6, 0, 4, 64);
    }
    const rainTexture = new THREE.CanvasTexture(rainCanvas);

    this.rainGeo = new THREE.BufferGeometry();
    this.rainPositions = new Float32Array(this.rainCount * 3);

    for (let i = 0; i < this.rainCount; i++) {
      const i3 = i * 3;
      this.rainPositions[i3] = (Math.random() - 0.5) * 140;
      this.rainPositions[i3 + 1] = Math.random() * 35;
      this.rainPositions[i3 + 2] = (Math.random() - 0.5) * 140;
    }

    this.rainGeo.setAttribute('position', new THREE.BufferAttribute(this.rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      map: rainTexture,
      size: this.isMobile ? 1.6 : 2.2,
      transparent: true,
      opacity: 0.75,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.rainPoints = new THREE.Points(this.rainGeo, rainMat);
    this.rainPoints.visible = false;
    this.group.add(this.rainPoints);

    // 2. Snow Particle System
    const snowCanvas = document.createElement('canvas');
    snowCanvas.width = 32;
    snowCanvas.height = 32;
    const sCtx = snowCanvas.getContext('2d');
    if (sCtx) {
      const grad = sCtx.createRadialGradient(16, 16, 0, 16, 16, 15);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(0.4, 'rgba(240, 249, 255, 0.7)');
      grad.addColorStop(0.8, 'rgba(224, 242, 254, 0.3)');
      grad.addColorStop(1, 'rgba(224, 242, 254, 0)');
      sCtx.fillStyle = grad;
      sCtx.beginPath();
      sCtx.arc(16, 16, 15, 0, Math.PI * 2);
      sCtx.fill();
    }
    const snowTexture = new THREE.CanvasTexture(snowCanvas);

    this.snowGeo = new THREE.BufferGeometry();
    this.snowPositions = new Float32Array(this.snowCount * 3);
    this.snowVelocities = new Float32Array(this.snowCount * 3);

    for (let i = 0; i < this.snowCount; i++) {
      const i3 = i * 3;
      this.snowPositions[i3] = (Math.random() - 0.5) * 140;
      this.snowPositions[i3 + 1] = Math.random() * 35;
      this.snowPositions[i3 + 2] = (Math.random() - 0.5) * 140;

      this.snowVelocities[i3] = (Math.random() - 0.5) * 0.4;
      this.snowVelocities[i3 + 1] = -(1.5 + Math.random() * 1.5);
      this.snowVelocities[i3 + 2] = (Math.random() - 0.5) * 0.4;
    }

    this.snowGeo.setAttribute('position', new THREE.BufferAttribute(this.snowPositions, 3));
    const snowMat = new THREE.PointsMaterial({
      map: snowTexture,
      size: this.isMobile ? 1.4 : 1.8,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.NormalBlending,
    });

    this.snowPoints = new THREE.Points(this.snowGeo, snowMat);
    this.snowPoints.visible = false;
    this.group.add(this.snowPoints);
  }

  private configureParticleCounts() {
    if (this.graphicsQuality === 'low' || this.isMobile) {
      this.rainCount = 280;
      this.snowCount = 180;
    } else if (this.graphicsQuality === 'high') {
      this.rainCount = 850;
      this.snowCount = 550;
    } else {
      this.rainCount = 500;
      this.snowCount = 350;
    }
  }

  public setWeather(mode: WeatherMode) {
    this.currentWeather = mode;

    if (this.rainPoints) this.rainPoints.visible = mode === 'rain';
    if (this.snowPoints) this.snowPoints.visible = mode === 'snow';

    // Adjust Fog atmosphere
    if (this.scene.fog && this.scene.fog instanceof THREE.FogExp2) {
      if (mode === 'fog') {
        this.scene.fog.density = 0.022;
        this.scene.fog.color.setHex(0x334155);
      } else if (mode === 'rain') {
        this.scene.fog.density = 0.012;
        this.scene.fog.color.setHex(0x1e293b);
      } else if (mode === 'snow') {
        this.scene.fog.density = 0.009;
        this.scene.fog.color.setHex(0xcbd5e1);
      } else {
        this.scene.fog.density = this.baseFogDensity;
        this.scene.fog.color.setHex(this.baseFogColor);
      }
    }
  }

  public getWeather(): WeatherMode {
    return this.currentWeather;
  }

  public setEnvironmentAnimationActive(active: boolean) {
    this.envAnimationActive = active;
  }

  public setAnimationActive(active: boolean) {
    this.envAnimationActive = active;
  }

  public setGraphicsQuality(quality: GraphicsQuality) {
    this.graphicsQuality = quality;
  }

  public update(delta: number, elapsed: number) {
    if (!this.envAnimationActive) return; // Sync with environment animation state: pause when paused!

    const dt = Math.min(delta, 0.1);

    // 1. Update Rain
    if (this.currentWeather === 'rain' && this.rainPositions && this.rainGeo) {
      const speed = 28.0;
      const windX = 3.5;
      for (let i = 0; i < this.rainCount; i++) {
        const i3 = i * 3;
        this.rainPositions[i3 + 1] -= speed * dt;
        this.rainPositions[i3] += windX * dt;

        // Reset when falling beneath ground level
        if (this.rainPositions[i3 + 1] < 0.1) {
          this.rainPositions[i3 + 1] = 32 + Math.random() * 5;
          this.rainPositions[i3] = (Math.random() - 0.5) * 140;
          this.rainPositions[i3 + 2] = (Math.random() - 0.5) * 140;
        }
      }
      this.rainGeo.attributes.position.needsUpdate = true;
    }

    // 2. Update Snow
    if (this.currentWeather === 'snow' && this.snowPositions && this.snowVelocities && this.snowGeo) {
      for (let i = 0; i < this.snowCount; i++) {
        const i3 = i * 3;
        const flutter = Math.sin(elapsed * 2.0 + i) * 0.8;
        this.snowPositions[i3] += (this.snowVelocities[i3] + flutter) * dt * 3.5;
        this.snowPositions[i3 + 1] += this.snowVelocities[i3 + 1] * dt * 2.8;
        this.snowPositions[i3 + 2] += (this.snowVelocities[i3 + 2] + Math.cos(elapsed * 1.5 + i) * 0.6) * dt * 3.5;

        // Reset snowflake
        if (this.snowPositions[i3 + 1] < 0.1) {
          this.snowPositions[i3 + 1] = 30 + Math.random() * 6;
          this.snowPositions[i3] = (Math.random() - 0.5) * 140;
          this.snowPositions[i3 + 2] = (Math.random() - 0.5) * 140;
        }
      }
      this.snowGeo.attributes.position.needsUpdate = true;
    }
  }

  public dispose() {
    this.rainGeo?.dispose();
    this.snowGeo?.dispose();
    this.scene.remove(this.group);
  }
}
