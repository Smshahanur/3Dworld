import * as THREE from 'three';
import { LightingMode } from '../types';

export interface DayNightKeyframe {
  hour: number;
  sunColor: number;
  sunIntensity: number;
  fillColor: number;
  fillIntensity: number;
  hemiSkyColor: number;
  hemiGroundColor: number;
  hemiIntensity: number;
  fogColor: number;
  fogDensity: number;
  skyTopColor: number;
  skyHorizonColor: number;
  skyBottomColor: number;
  nightGlowFactor: number;
  modeTag: LightingMode;
}

export const DAY_NIGHT_KEYFRAMES: DayNightKeyframe[] = [
  {
    hour: 0.0, // Midnight
    sunColor: 0x4f46e5,
    sunIntensity: 1.0,
    fillColor: 0x38bdf8,
    fillIntensity: 0.6,
    hemiSkyColor: 0x1e1b4b,
    hemiGroundColor: 0x060913,
    hemiIntensity: 0.7,
    fogColor: 0x060913,
    fogDensity: 0.0055,
    skyTopColor: 0x020617,
    skyHorizonColor: 0x060913,
    skyBottomColor: 0x02040a,
    nightGlowFactor: 1.0,
    modeTag: 'cyber-night',
  },
  {
    hour: 4.5, // Late Night / Pre-Dawn
    sunColor: 0x6366f1,
    sunIntensity: 1.1,
    fillColor: 0x818cf8,
    fillIntensity: 0.65,
    hemiSkyColor: 0x241442,
    hemiGroundColor: 0x080c18,
    hemiIntensity: 0.75,
    fogColor: 0x090d1f,
    fogDensity: 0.0055,
    skyTopColor: 0x050b24,
    skyHorizonColor: 0x111636,
    skyBottomColor: 0x030612,
    nightGlowFactor: 1.0,
    modeTag: 'cyber-night',
  },
  {
    hour: 5.8, // First Light / Dawn
    sunColor: 0xfda4af,
    sunIntensity: 2.2,
    fillColor: 0xc084fc,
    fillIntensity: 0.85,
    hemiSkyColor: 0xfbcfe8,
    hemiGroundColor: 0x2d123b,
    hemiIntensity: 1.1,
    fogColor: 0x19142b,
    fogDensity: 0.0052,
    skyTopColor: 0x1a2142,
    skyHorizonColor: 0xf472b6,
    skyBottomColor: 0x140c24,
    nightGlowFactor: 0.75,
    modeTag: 'dawn',
  },
  {
    hour: 6.8, // Golden Sunrise
    sunColor: 0xfb923c,
    sunIntensity: 2.8,
    fillColor: 0xf472b6,
    fillIntensity: 1.0,
    hemiSkyColor: 0xfde68a,
    hemiGroundColor: 0x241c30,
    hemiIntensity: 1.25,
    fogColor: 0x1b1c36,
    fogDensity: 0.005,
    skyTopColor: 0x0284c7,
    skyHorizonColor: 0xfbbf24,
    skyBottomColor: 0x18142a,
    nightGlowFactor: 0.35,
    modeTag: 'dawn',
  },
  {
    hour: 8.5, // Fresh Morning
    sunColor: 0xfef08a,
    sunIntensity: 3.3,
    fillColor: 0x38bdf8,
    fillIntensity: 1.1,
    hemiSkyColor: 0xbae6fd,
    hemiGroundColor: 0x16293f,
    hemiIntensity: 1.35,
    fogColor: 0x0d2844,
    fogDensity: 0.0048,
    skyTopColor: 0x0284c7,
    skyHorizonColor: 0x7dd3fc,
    skyBottomColor: 0x0a1e35,
    nightGlowFactor: 0.0,
    modeTag: 'day',
  },
  {
    hour: 12.0, // Solar Midday
    sunColor: 0xfffbeb,
    sunIntensity: 3.6,
    fillColor: 0x38bdf8,
    fillIntensity: 1.2,
    hemiSkyColor: 0xbae6fd,
    hemiGroundColor: 0x1e3a5f,
    hemiIntensity: 1.4,
    fogColor: 0x0f2b48,
    fogDensity: 0.0045,
    skyTopColor: 0x0369a1,
    skyHorizonColor: 0xbfe9fe,
    skyBottomColor: 0x0f2b48,
    nightGlowFactor: 0.0,
    modeTag: 'day',
  },
  {
    hour: 16.5, // Late Afternoon Gold
    sunColor: 0xfde047,
    sunIntensity: 3.4,
    fillColor: 0x38bdf8,
    fillIntensity: 1.15,
    hemiSkyColor: 0xfef08a,
    hemiGroundColor: 0x1e2e48,
    hemiIntensity: 1.3,
    fogColor: 0x122a44,
    fogDensity: 0.0048,
    skyTopColor: 0x0284c7,
    skyHorizonColor: 0x93c5fd,
    skyBottomColor: 0x10233b,
    nightGlowFactor: 0.0,
    modeTag: 'day',
  },
  {
    hour: 18.0, // Golden Hour Sunset
    sunColor: 0xf97316,
    sunIntensity: 2.9,
    fillColor: 0xd946ef,
    fillIntensity: 1.1,
    hemiSkyColor: 0xf472b6,
    hemiGroundColor: 0x221338,
    hemiIntensity: 1.2,
    fogColor: 0x1e112a,
    fogDensity: 0.0052,
    skyTopColor: 0x1e1b4b,
    skyHorizonColor: 0xf97316,
    skyBottomColor: 0x160c22,
    nightGlowFactor: 0.45,
    modeTag: 'twilight',
  },
  {
    hour: 19.5, // Dusk / Twilight
    sunColor: 0xa855f7,
    sunIntensity: 2.0,
    fillColor: 0xec4899,
    fillIntensity: 0.9,
    hemiSkyColor: 0x7c3aed,
    hemiGroundColor: 0x150b28,
    hemiIntensity: 1.0,
    fogColor: 0x170e28,
    fogDensity: 0.0055,
    skyTopColor: 0x0f102f,
    skyHorizonColor: 0xc084fc,
    skyBottomColor: 0x0d071d,
    nightGlowFactor: 0.85,
    modeTag: 'twilight',
  },
  {
    hour: 21.0, // Nightfall
    sunColor: 0x60a5fa,
    sunIntensity: 1.35,
    fillColor: 0x818cf8,
    fillIntensity: 0.7,
    hemiSkyColor: 0x4338ca,
    hemiGroundColor: 0x060913,
    hemiIntensity: 0.8,
    fogColor: 0x060913,
    fogDensity: 0.0055,
    skyTopColor: 0x030712,
    skyHorizonColor: 0x1e1b4b,
    skyBottomColor: 0x030611,
    nightGlowFactor: 1.0,
    modeTag: 'cyber-night',
  },
  {
    hour: 24.0, // Wraparound Midnight
    sunColor: 0x4f46e5,
    sunIntensity: 1.0,
    fillColor: 0x38bdf8,
    fillIntensity: 0.6,
    hemiSkyColor: 0x1e1b4b,
    hemiGroundColor: 0x060913,
    hemiIntensity: 0.7,
    fogColor: 0x060913,
    fogDensity: 0.0055,
    skyTopColor: 0x020617,
    skyHorizonColor: 0x060913,
    skyBottomColor: 0x02040a,
    nightGlowFactor: 1.0,
    modeTag: 'cyber-night',
  },
];

// Pre-allocated reusable helpers (Zero GC)
const _c1 = new THREE.Color();
const _c2 = new THREE.Color();
const _resColor = new THREE.Color();

export interface InterpolatedLightState {
  hour: number;
  formattedTime: string;
  modeTag: LightingMode;
  sunPosition: THREE.Vector3;
  sunColor: THREE.Color;
  sunIntensity: number;
  fillPosition: THREE.Vector3;
  fillColor: THREE.Color;
  fillIntensity: number;
  hemiSkyColor: THREE.Color;
  hemiGroundColor: THREE.Color;
  hemiIntensity: number;
  fogColor: THREE.Color;
  fogDensity: number;
  skyTopColor: THREE.Color;
  skyHorizonColor: THREE.Color;
  skyBottomColor: THREE.Color;
  nightGlowFactor: number;
}

export class DayNightCycleController {
  public timeOfDay: number = 12.0; // Current time in hours (0.0 to 24.0)
  public isAutoPlaying: boolean = true;
  public timeSpeed: number = 0.25; // Hours advanced per real second (~96s for full 24h)

  // Smooth preset glide animation
  private isGliding: boolean = false;
  private glideStartHour: number = 12.0;
  private glideTargetHour: number = 12.0;
  private glideProgress: number = 0;
  private glideDuration: number = 1.2;

  // Cached state objects
  private sunPos = new THREE.Vector3();
  private fillPos = new THREE.Vector3();
  private sunCol = new THREE.Color();
  private fillCol = new THREE.Color();
  private hemiSkyCol = new THREE.Color();
  private hemiGndCol = new THREE.Color();
  private fogCol = new THREE.Color();
  private skyTopCol = new THREE.Color();
  private skyHrzCol = new THREE.Color();
  private skyBtmCol = new THREE.Color();

  constructor(initialHour: number = 12.0, autoPlay: boolean = true) {
    this.timeOfDay = initialHour;
    this.isAutoPlaying = autoPlay;
  }

  public setTimeOfDay(hour: number) {
    this.timeOfDay = ((hour % 24) + 24) % 24;
    this.isGliding = false;
  }

  public glideToHour(targetHour: number, duration: number = 1.2) {
    this.glideStartHour = this.timeOfDay;
    // Calculate shortest angular distance
    let diff = targetHour - this.timeOfDay;
    while (diff > 12) diff -= 24;
    while (diff < -12) diff += 24;
    this.glideTargetHour = this.timeOfDay + diff;
    this.glideDuration = Math.max(0.4, duration);
    this.glideProgress = 0;
    this.isGliding = true;
  }

  public glideToMode(mode: LightingMode) {
    let target = 12.0;
    if (mode === 'dawn') target = 6.2;
    else if (mode === 'day') target = 12.0;
    else if (mode === 'twilight') target = 18.2;
    else if (mode === 'cyber-night') target = 22.0;

    this.glideToHour(target, 1.2);
  }

  public toggleAutoPlay(enabled?: boolean): boolean {
    this.isAutoPlaying = enabled !== undefined ? enabled : !this.isAutoPlaying;
    return this.isAutoPlaying;
  }

  public setTimeSpeed(speed: number) {
    this.timeSpeed = Math.max(0.01, speed);
  }

  public update(delta: number): InterpolatedLightState {
    const dt = Math.min(delta, 0.1);

    // 1. Advance glide animation or auto-cycle progression
    if (this.isGliding) {
      this.glideProgress += dt / this.glideDuration;
      if (this.glideProgress >= 1.0) {
        this.glideProgress = 1.0;
        this.isGliding = false;
        this.timeOfDay = ((this.glideTargetHour % 24) + 24) % 24;
      } else {
        const t = this.glideProgress;
        const ease = t * t * (3 - 2 * t);
        const cur = this.glideStartHour + (this.glideTargetHour - this.glideStartHour) * ease;
        this.timeOfDay = ((cur % 24) + 24) % 24;
      }
    } else if (this.isAutoPlaying) {
      this.timeOfDay = (this.timeOfDay + dt * this.timeSpeed) % 24;
    }

    const hour = this.timeOfDay;

    // 2. Find bounding keyframes
    let kA = DAY_NIGHT_KEYFRAMES[0];
    let kB = DAY_NIGHT_KEYFRAMES[1];
    for (let i = 0; i < DAY_NIGHT_KEYFRAMES.length - 1; i++) {
      if (hour >= DAY_NIGHT_KEYFRAMES[i].hour && hour <= DAY_NIGHT_KEYFRAMES[i + 1].hour) {
        kA = DAY_NIGHT_KEYFRAMES[i];
        kB = DAY_NIGHT_KEYFRAMES[i + 1];
        break;
      }
    }

    const span = Math.max(0.0001, kB.hour - kA.hour);
    const alpha = (hour - kA.hour) / span;
    // Cubic smoothstep easing for color blend
    const ease = alpha * alpha * (3 - 2 * alpha);

    // 3. Interpolate Colors
    _c1.setHex(kA.sunColor);
    _c2.setHex(kB.sunColor);
    this.sunCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.fillColor);
    _c2.setHex(kB.fillColor);
    this.fillCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.hemiSkyColor);
    _c2.setHex(kB.hemiSkyColor);
    this.hemiSkyCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.hemiGroundColor);
    _c2.setHex(kB.hemiGroundColor);
    this.hemiGndCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.fogColor);
    _c2.setHex(kB.fogColor);
    this.fogCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.skyTopColor);
    _c2.setHex(kB.skyTopColor);
    this.skyTopCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.skyHorizonColor);
    _c2.setHex(kB.skyHorizonColor);
    this.skyHrzCol.lerpColors(_c1, _c2, ease);

    _c1.setHex(kA.skyBottomColor);
    _c2.setHex(kB.skyBottomColor);
    this.skyBtmCol.lerpColors(_c1, _c2, ease);

    // 4. Interpolate Float Intensities
    const sunIntensity = THREE.MathUtils.lerp(kA.sunIntensity, kB.sunIntensity, ease);
    const fillIntensity = THREE.MathUtils.lerp(kA.fillIntensity, kB.fillIntensity, ease);
    const hemiIntensity = THREE.MathUtils.lerp(kA.hemiIntensity, kB.hemiIntensity, ease);
    const fogDensity = THREE.MathUtils.lerp(kA.fogDensity, kB.fogDensity, ease);
    const nightGlowFactor = THREE.MathUtils.lerp(kA.nightGlowFactor, kB.nightGlowFactor, ease);

    // 5. Celestial Trajectory (Sun / Moon orbit)
    // Sun rises East at 6.0, reaches zenith at 12.0, sets West at 18.0
    const isDayTime = hour >= 5.5 && hour <= 18.5;
    if (isDayTime) {
      const sunAngle = ((hour - 6.0) / 12.0) * Math.PI;
      const x = Math.cos(sunAngle) * 55;
      const y = Math.max(4, Math.sin(sunAngle) * 68);
      const z = -45 + Math.sin(sunAngle) * 8;
      this.sunPos.set(x, y, z);
      this.fillPos.set(-x * 0.6, y * 0.4, -z);
    } else {
      // Moon trajectory during night
      const nightHour = hour < 5.5 ? hour + 24 : hour;
      const moonAngle = ((nightHour - 18.0) / 12.0) * Math.PI;
      const x = Math.cos(moonAngle) * 48;
      const y = Math.max(6, Math.sin(moonAngle) * 52);
      const z = 35 - Math.sin(moonAngle) * 6;
      this.sunPos.set(x, y, z);
      this.fillPos.set(-x * 0.6, y * 0.4, -z);
    }

    const modeTag = kA.modeTag;

    return {
      hour,
      formattedTime: this.formatTime(hour),
      modeTag,
      sunPosition: this.sunPos,
      sunColor: this.sunCol,
      sunIntensity,
      fillPosition: this.fillPos,
      fillColor: this.fillCol,
      fillIntensity,
      hemiSkyColor: this.hemiSkyCol,
      hemiGroundColor: this.hemiGndCol,
      hemiIntensity,
      fogColor: this.fogCol,
      fogDensity,
      skyTopColor: this.skyTopCol,
      skyHorizonColor: this.skyHrzCol,
      skyBottomColor: this.skyBtmCol,
      nightGlowFactor,
    };
  }

  public formatTime(hour: number): string {
    const totalMinutes = Math.floor(hour * 60);
    const h24 = Math.floor(totalMinutes / 60) % 24;
    const m = totalMinutes % 60;
    const isPM = h24 >= 12;
    const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
    const mStr = m < 10 ? `0${m}` : `${m}`;
    const period = isPM ? 'PM' : 'AM';
    return `${h12}:${mStr} ${period}`;
  }
}
