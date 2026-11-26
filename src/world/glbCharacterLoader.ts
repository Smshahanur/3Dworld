/**
 * 3DWorld GLB / GLTF / FBX Human Character Asset Manager
 *
 * Clean, cached asset loading and skeletal animation pipeline for supplied
 * human character models (e.g., /public/models/characters/Athletic_man.glb or .fbx,
 * or local files uploaded in Avatar Studio).
 *
 * Features:
 * - Reads /models/characters/manifest.json once (zero-404 discovery)
 * - Auto-maps Athletic_man.{glb,gltf,fbx} and player_male.{glb,gltf,fbx} to player_male
 * - Supports both GLTFLoader (with DRACO) and FBXLoader (auto-detects binary/ASCII FBX vs GLB)
 * - Validates binary headers & rejects SPA HTML fallbacks so broken/missing assets trigger explicit errors
 * - Preserves original facial details, clothing, textures, and PBR materials
 * - Optimizes textures for Android (sRGB color space, mipmaps, capped anisotropy)
 * - Caches parsed templates once and reuses across local player & compatible remote avatars via SkeletonUtils.clone()
 * - Smooth THREE.AnimationMixer crossFadeTo blending (Idle, Walk, Run, Sprint, Turn, Jump, Gestures)
 * - Reports exact skeleton/clip inspection results and missing animations without inventing clips
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export type CharacterModelRole =
  | 'player_male'
  | 'player_female'
  | 'npc_rural_male'
  | 'npc_rural_female'
  | 'npc_modern_male'
  | 'npc_modern_female'
  | 'npc_capital_male'
  | 'npc_capital_female';

export type SkeletalAnimState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'sprint'
  | 'turn'
  | 'turn_left'
  | 'turn_right'
  | 'talk'
  | 'sit'
  | 'stand'
  | 'jump'
  | 'wave'
  | 'cheer'
  | 'work'
  | 'dance'
  | 'carry';

export interface RequiredModelSpec {
  role: CharacterModelRole;
  file: string;
  description: string;
  targetHeightMeters: number;
}

export interface CharacterManifest {
  version: number;
  basePath: string;
  availableModels: Record<string, string>;
  requiredModels: Record<
    string,
    {
      file: string;
      description: string;
      targetHeightMeters: number;
    }
  >;
  supportedAnimations: string[];
}

export interface ModelInspectionReport {
  role: CharacterModelRole;
  url: string;
  label: string;
  format: 'glb' | 'gltf' | 'fbx';
  hasSkeleton: boolean;
  boneCount: number;
  meshCount: number;
  materialCount: number;
  hasTextures: boolean;
  availableClips: string[];
  matchedStates: SkeletalAnimState[];
  missingCoreStates: ('idle' | 'walk' | 'run' | 'turn' | 'jump')[];
  boundsHeightMeters: number;
}

export interface CharacterLoadError {
  role: CharacterModelRole;
  expectedFile: string;
  attemptedUrl: string;
  reason: 'missing_file' | 'invalid_format' | 'parse_error' | 'empty_scene';
  message: string;
  timestamp: number;
}

export interface CharacterAssetStatus {
  manifestLoaded: boolean;
  totalRequired: number;
  availableCount: number;
  availableRoles: Record<string, { url: string; source: 'public' | 'bundled' | 'custom_file'; label: string }>;
  missingRoles: RequiredModelSpec[];
  errors: Partial<Record<CharacterModelRole, CharacterLoadError>>;
  inspections: Partial<Record<CharacterModelRole, ModelInspectionReport>>;
}

interface CachedTemplate {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  boundsHeight: number;
  boundsMinY: number;
  boundsCenterX: number;
  boundsCenterZ: number;
  format: 'glb' | 'gltf' | 'fbx';
  hasSkeleton: boolean;
  boneCount: number;
  meshCount: number;
  materialCount: number;
  hasTextures: boolean;
}

export interface GLBCharacterCustomization {
  primaryColor?: string | number;
  hairColor?: string | number;
  skinTone?: string | number;
  targetHeight?: number;
  castShadow?: boolean;
  preserveOriginalMaterials?: boolean;
}

export interface GLBCharacterInstance {
  root: THREE.Group;
  mixer: THREE.AnimationMixer;
  actions: Map<SkeletalAnimState, THREE.AnimationAction>;
  availableClipNames: string[];
  format: 'glb' | 'gltf' | 'fbx';
  inspection: ModelInspectionReport;
  updateAnimation: (
    state: SkeletalAnimState,
    dt: number,
    movementSpeed?: number,
    cameraDistance?: number,
    angularTurnRate?: number
  ) => void;
  applyCustomization: (opts: GLBCharacterCustomization) => void;
  dispose: () => void;
}

const DEFAULT_REQUIRED_MODELS: Record<
  CharacterModelRole,
  { file: string; description: string; targetHeightMeters: number }
> = {
  player_male: {
    file: 'Athletic_man.glb',
    description: 'Supplied Athletic Man male player character (GLB primary, FBX auto-supported)',
    targetHeightMeters: 1.78,
  },
  player_female: {
    file: 'player_female.glb',
    description: 'Realistic young adult female player character',
    targetHeightMeters: 1.65,
  },
  npc_rural_male: {
    file: 'npc_rural_male.glb',
    description: 'Rural village male resident (workwear / traditional attire)',
    targetHeightMeters: 1.76,
  },
  npc_rural_female: {
    file: 'npc_rural_female.glb',
    description: 'Rural village female resident (orchard / rural attire)',
    targetHeightMeters: 1.65,
  },
  npc_modern_male: {
    file: 'npc_modern_male.glb',
    description: 'Modern Village male resident (modern casual)',
    targetHeightMeters: 1.76,
  },
  npc_modern_female: {
    file: 'npc_modern_female.glb',
    description: 'Modern Village female resident (modern casual)',
    targetHeightMeters: 1.65,
  },
  npc_capital_male: {
    file: 'npc_capital_male.glb',
    description: 'Capital Town male resident (formal business attire)',
    targetHeightMeters: 1.78,
  },
  npc_capital_female: {
    file: 'npc_capital_female.glb',
    description: 'Capital Town female resident (formal business attire)',
    targetHeightMeters: 1.66,
  },
};

// Case-insensitive clip alias dictionary covering Mixamo, Ready Player Me, Blender, and custom glTF/FBX exports
const CLIP_ALIASES: Record<SkeletalAnimState, string[]> = {
  idle: ['idle', 'standing_idle', 'breathing_idle', 'breathe', 'stand_idle', 'default', 't-pose'],
  walk: ['walk', 'walking', 'locomotion_walk', 'female_walk', 'male_walk', 'stride'],
  run: ['run', 'running', 'jog', 'jogging', 'locomotion_run'],
  sprint: ['sprint', 'sprinting', 'fast_run', 'fastrun', 'run_fast'],
  turn: ['turn', 'turning', 'pivot', 'turn_around'],
  turn_left: ['turn_left', 'turnleft', 'left_turn', 'turn_l', 'pivot_left'],
  turn_right: ['turn_right', 'turnright', 'right_turn', 'turn_r', 'pivot_right'],
  talk: ['talk', 'talking', 'conversation', 'chat', 'speak', 'speaking'],
  sit: ['sit', 'sitting', 'seated', 'sit_idle', 'chair_sit'],
  stand: ['stand', 'standup', 'stand_up', 'get_up'],
  jump: ['jump', 'jumping', 'leap', 'air'],
  wave: ['wave', 'waving', 'greet', 'greeting', 'hello'],
  cheer: ['cheer', 'cheering', 'celebrate', 'victory', 'clap'],
  work: ['work', 'working', 'craft', 'crafting', 'farming', 'typing'],
  dance: ['dance', 'dancing', 'groove'],
  carry: ['carry', 'carrying', 'hold', 'holding'],
};

class CharacterAssetManager {
  private gltfLoader: GLTFLoader;
  private fbxLoader: FBXLoader;
  private dracoLoader: DRACOLoader | null = null;
  private templateCache = new Map<string, CachedTemplate>();
  private inFlightLoads = new Map<string, Promise<{ template: CachedTemplate | null; error?: CharacterLoadError }>>();

  private manifestLoaded = false;
  private manifestPromise: Promise<void> | null = null;
  private manifestSpecs = { ...DEFAULT_REQUIRED_MODELS };

  // Discovered / supplied URLs keyed by CharacterModelRole
  private roleUrlMap = new Map<
    CharacterModelRole,
    { url: string; source: 'public' | 'bundled' | 'custom_file'; label: string }
  >();
  private loadErrors = new Map<CharacterModelRole, CharacterLoadError>();
  private failedUrls = new Set<string>();
  private modelInspections = new Map<CharacterModelRole, ModelInspectionReport>();
  private roleVersions = new Map<CharacterModelRole, number>();
  private listeners = new Set<() => void>();
  private errorListeners = new Set<() => void>();
  private hasLoggedMissingNotice = false;

  constructor() {
    THREE.Cache.enabled = true;
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    this.scanBundledSrcAssets();
  }

  private ensureDracoConfigured() {
    if (this.dracoLoader) return;
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    this.gltfLoader.setDRACOLoader(this.dracoLoader);
  }

  /**
   * Optional bundled assets placed in /src/assets/models/characters/*.{glb,gltf,fbx}
   */
  private scanBundledSrcAssets() {
    try {
      const metaGlob = (import.meta as unknown as {
        glob?: (pattern: string, opts: Record<string, unknown>) => Record<string, string>;
      }).glob;

      if (typeof metaGlob === 'function') {
        const modules = metaGlob('/src/assets/models/characters/*.{glb,gltf,fbx}', {
          query: '?url',
          import: 'default',
          eager: true,
        });
        for (const [fullPath, url] of Object.entries(modules)) {
          const filename = fullPath.split('/').pop() || '';
          const role = this.matchFilenameToRole(filename);
          if (role && url) {
            this.roleUrlMap.set(role, { url, source: 'bundled', label: filename });
          }
        }
      }
    } catch {
      // Non-Vite environment (e.g., Node/tsx test runner)
    }
  }

  private matchFilenameToRole(filename: string): CharacterModelRole | null {
    const clean = filename.toLowerCase().replace(/\.(glb|gltf|fbx)$/i, '');
    if (clean === 'athletic_man') return 'player_male';
    const validRoles: CharacterModelRole[] = [
      'player_male',
      'player_female',
      'npc_rural_male',
      'npc_rural_female',
      'npc_modern_male',
      'npc_modern_female',
      'npc_capital_male',
      'npc_capital_female',
    ];
    for (const role of validRoles) {
      if (clean === role) return role;
    }
    return null;
  }

  /**
   * Fetches /models/characters/manifest.json once (always HTTP 200) to discover supplied assets.
   */
  public async initManifest(forceRefresh = false): Promise<void> {
    if (this.manifestLoaded && !forceRefresh) return;
    if (this.manifestPromise && !forceRefresh) return this.manifestPromise;

    this.manifestPromise = (async () => {
      if (typeof window === 'undefined' || typeof fetch !== 'function') {
        this.manifestLoaded = true;
        return;
      }

      let discoveredAnyModel = false;
      try {
        const res = await fetch('/models/characters/manifest.json', { cache: 'no-cache' });
        if (res.ok) {
          const data = (await res.json()) as CharacterManifest;
          if (data.requiredModels) {
            this.manifestSpecs = {
              ...DEFAULT_REQUIRED_MODELS,
              ...(data.requiredModels as typeof DEFAULT_REQUIRED_MODELS),
            };
          }
          if (data.availableModels) {
            for (const [roleKey, url] of Object.entries(data.availableModels)) {
              if (url && typeof url === 'string') {
                const role = (roleKey === 'athletic_man' ? 'player_male' : roleKey) as CharacterModelRole;
                const existing = this.roleUrlMap.get(role);
                if (!existing || existing.source !== 'custom_file') {
                  const fileLabel = url.split('/').pop() || url;
                  if (!existing || existing.url !== url) {
                    discoveredAnyModel = true;
                  }
                  this.roleUrlMap.set(role, { url, source: 'public', label: fileLabel });
                  this.loadErrors.delete(role);
                  this.failedUrls.delete(url);
                }
              }
            }
          }
        }
      } catch {
        // Offline or non-browser test run
      } finally {
        this.manifestLoaded = true;
        this.reportMissingAssetsOnce();
        // Warm up the cached template once when the permanent player_male GLB is present on disk
        const maleAsset = this.roleUrlMap.get('player_male');
        if (maleAsset && maleAsset.source === 'public' && !this.templateCache.has(maleAsset.url)) {
          void this.loadTemplate(maleAsset.url, maleAsset.label, 'player_male');
        }
        if (discoveredAnyModel) {
          this.notifyListeners();
        }
        this.notifyErrorListeners();
      }
    })();

    return this.manifestPromise;
  }

  private reportMissingAssetsOnce() {
    if (this.hasLoggedMissingNotice) return;
    this.hasLoggedMissingNotice = true;
    if (!this.roleUrlMap.has('player_male') && typeof console !== 'undefined') {
      console.warn(
        '[3DWorld CharacterAssets] Supplied male player model not found at public/models/characters/Athletic_man.glb (or Athletic_man.fbx). ' +
          'Using safe fallback character — place Athletic_man.glb in /public/models/characters/ or load a local .glb/.fbx file via Avatar Studio.'
      );
    }
  }

  public getRoleVersion(role: CharacterModelRole): number {
    const direct = this.roleVersions.get(role) || 0;
    if (role.endsWith('_male')) {
      return Math.max(direct, this.roleVersions.get('player_male') || 0);
    }
    if (role.endsWith('_female')) {
      return Math.max(direct, this.roleVersions.get('player_female') || 0);
    }
    return direct;
  }

  private bumpRoleVersion(role: CharacterModelRole) {
    this.roleVersions.set(role, (this.roleVersions.get(role) || 0) + 1);
  }

  /**
   * Registers a permanent static public asset URL (e.g., /models/characters/Athletic_man.glb)
   * and clears any prior temporary blob URL or negative cache entries so all rigs switch to it.
   */
  public registerPublicModel(role: CharacterModelRole, publicUrl: string, fileName: string) {
    const prev = this.roleUrlMap.get(role);
    if (prev) {
      this.templateCache.delete(prev.url);
      this.inFlightLoads.delete(prev.url);
      if (prev.source === 'custom_file' && prev.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prev.url);
        } catch {}
      }
    }
    this.templateCache.delete(publicUrl);
    this.inFlightLoads.delete(publicUrl);
    this.failedUrls.delete(publicUrl);
    this.loadErrors.delete(role);
    if (role === 'player_male') {
      this.loadErrors.delete('npc_rural_male');
      this.loadErrors.delete('npc_modern_male');
      this.loadErrors.delete('npc_capital_male');
    }
    this.roleUrlMap.set(role, {
      url: publicUrl,
      source: 'public',
      label: fileName,
    });
    this.bumpRoleVersion(role);
    this.notifyListeners();
    this.notifyErrorListeners();
  }

  /**
   * Saves a selected .glb / .gltf / .fbx file permanently to /public/models/characters/ via the
   * Vite dev server endpoint when available (so it persists across full page refreshes and builds
   * into dist/), verifying exact binary bytes and live HTTP serving before reporting success.
   */
  public async saveAndRegisterPermanentModel(
    role: CharacterModelRole,
    file: File
  ): Promise<{
    ok: boolean;
    status: 'success' | 'warning' | 'error';
    savedToProject: boolean;
    url?: string;
    fileName: string;
    diskPath?: string;
    bytes?: number;
    message: string;
  }> {
    if (!file || file.size === 0) {
      return {
        ok: false,
        status: 'error',
        savedToProject: false,
        fileName: file?.name || 'unknown',
        message: 'Selected file is empty (0 bytes). Please select a valid .glb, .gltf, or .fbx 3D model.',
      };
    }

    let buffer: ArrayBuffer;
    try {
      buffer = await file.arrayBuffer();
    } catch (err) {
      return {
        ok: false,
        status: 'error',
        savedToProject: false,
        fileName: file.name,
        message: `Failed to read selected file as binary: ${err instanceof Error ? err.message : String(err)}`,
      };
    }

    if (buffer.byteLength === 0 || buffer.byteLength !== file.size) {
      return {
        ok: false,
        status: 'error',
        savedToProject: false,
        fileName: file.name,
        message: `Binary read mismatch for ${file.name} (read ${buffer.byteLength} of ${file.size} bytes).`,
      };
    }

    const clientDetected = this.detectFormatFromBytes(buffer, file.name);
    if (clientDetected === 'html_or_unknown') {
      return {
        ok: false,
        status: 'error',
        savedToProject: false,
        fileName: file.name,
        message: `Invalid 3D model file "${file.name}". Expected a valid binary .glb ("glTF" header), .gltf JSON, or .fbx file.`,
      };
    }

    if (typeof window !== 'undefined' && typeof fetch === 'function') {
      try {
        const endpoint = `/api/dev/save-character-model?role=${encodeURIComponent(role)}&filename=${encodeURIComponent(file.name)}`;
        const payload = new Uint8Array(buffer);
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-Expected-Bytes': String(payload.byteLength),
          },
          body: payload,
        });
        const contentType = (res.headers.get('content-type') || '').toLowerCase();

        // If the server endpoint responded with JSON, handle both success and explicit validation errors
        if (contentType.includes('application/json')) {
          const data = (await res.json()) as {
            ok?: boolean;
            permanent?: boolean;
            verified?: boolean;
            url?: string;
            fileName?: string;
            diskPath?: string;
            bytes?: number;
            magic?: string;
            glbVersion?: number;
            error?: string;
          };

          if (!res.ok || !data.ok) {
            return {
              ok: false,
              status: 'error',
              savedToProject: false,
              fileName: file.name,
              message: data.error || `Permanent save failed with HTTP ${res.status}.`,
            };
          }

          if (data.url && data.fileName) {
            // Verify GET returns the actual binary (not index.html) before marking permanent success
            const verifyRes = await fetch(data.url, { method: 'GET', cache: 'no-store' });
            const verifyType = (verifyRes.headers.get('content-type') || '').toLowerCase();
            if (!verifyRes.ok || verifyType.includes('text/html')) {
              return {
                ok: false,
                status: 'error',
                savedToProject: false,
                fileName: data.fileName,
                message: `File was saved to ${data.diskPath || data.url}, but GET ${data.url} returned HTTP ${verifyRes.status} (${verifyType || 'unknown'}).`,
              };
            }
            const verifyBuf = await verifyRes.arrayBuffer();
            const verifyFormat = this.detectFormatFromBytes(verifyBuf, data.fileName);
            if (verifyFormat === 'html_or_unknown' || verifyBuf.byteLength !== payload.byteLength) {
              return {
                ok: false,
                status: 'error',
                savedToProject: false,
                fileName: data.fileName,
                message: `Verification failed on GET ${data.url}: expected ${payload.byteLength} valid model bytes, received ${verifyBuf.byteLength} bytes.`,
              };
            }

            await this.initManifest(true);
            this.registerPublicModel(role, data.url, data.fileName);
            const mb = (verifyBuf.byteLength / (1024 * 1024)).toFixed(2);
            const headerNote =
              data.magic === 'glTF' && data.glbVersion
                ? ` Verified GLB v${data.glbVersion} ("glTF", ${mb} MB).`
                : ` Verified (${mb} MB).`;
            return {
              ok: true,
              status: 'success',
              savedToProject: true,
              url: data.url,
              fileName: data.fileName,
              diskPath: data.diskPath || `public/models/characters/${data.fileName}`,
              bytes: verifyBuf.byteLength,
              message: `Installed permanently at ${data.diskPath || `public/models/characters/${data.fileName}`}.${headerNote} Persists across full page refresh and production builds.`,
            };
          }
        }
      } catch {
        // Static production host without dev write endpoint — fall through to session preview
      }
    }

    const blobUrl = URL.createObjectURL(file);
    this.registerCustomBlobModel(role, blobUrl, file.name);
    return {
      ok: true,
      status: 'warning',
      savedToProject: false,
      url: blobUrl,
      fileName: file.name,
      bytes: buffer.byteLength,
      message:
        'Loaded for this browser session only (permanent disk write endpoint unavailable on read-only hosting). Place the file at public/models/characters/Athletic_man.glb and rebuild for permanent hosting.',
    };
  }

  /**
   * Registers a user-selected local .glb / .gltf / .fbx file via ObjectURL for instant preview & world playback.
   */
  public registerCustomBlobModel(role: CharacterModelRole, blobUrl: string, fileName: string) {
    const prev = this.roleUrlMap.get(role);
    if (prev && prev.url !== blobUrl) {
      this.templateCache.delete(prev.url);
    }
    this.loadErrors.delete(role);
    this.failedUrls.delete(blobUrl);
    this.roleUrlMap.set(role, {
      url: blobUrl,
      source: 'custom_file',
      label: fileName,
    });
    this.bumpRoleVersion(role);
    this.notifyListeners();
    this.notifyErrorListeners();
  }

  public clearCustomBlobModel(role: CharacterModelRole) {
    const prev = this.roleUrlMap.get(role);
    if (prev && prev.source === 'custom_file') {
      this.templateCache.delete(prev.url);
      this.modelInspections.delete(role);
      if (prev.url.startsWith('blob:')) {
        try {
          URL.revokeObjectURL(prev.url);
        } catch {}
      }
      this.roleUrlMap.delete(role);
      void this.initManifest(true);
      this.notifyListeners();
    }
  }

  public hasModelForRole(role: CharacterModelRole): boolean {
    if (this.roleUrlMap.has(role)) return true;
    if (role.endsWith('_male') && this.roleUrlMap.has('player_male')) return true;
    if (role.endsWith('_female') && this.roleUrlMap.has('player_female')) return true;
    return false;
  }

  public resolveUrlForRole(role: CharacterModelRole): { url: string; label: string } | null {
    const direct = this.roleUrlMap.get(role);
    if (direct) return { url: direct.url, label: direct.label };
    if (role.endsWith('_male')) {
      const pm = this.roleUrlMap.get('player_male');
      if (pm) return { url: pm.url, label: pm.label };
    }
    if (role.endsWith('_female')) {
      const pf = this.roleUrlMap.get('player_female');
      if (pf) return { url: pf.url, label: pf.label };
    }
    return null;
  }

  public getErrorForRole(role: CharacterModelRole): CharacterLoadError | null {
    return this.loadErrors.get(role) ?? null;
  }

  public getInspectionForRole(role: CharacterModelRole): ModelInspectionReport | null {
    return this.modelInspections.get(role) ?? null;
  }

  public getAssetStatus(): CharacterAssetStatus {
    const availableRoles: CharacterAssetStatus['availableRoles'] = {};
    const missingRoles: RequiredModelSpec[] = [];

    const allRoles = Object.keys(this.manifestSpecs) as CharacterModelRole[];
    for (const role of allRoles) {
      const entry = this.roleUrlMap.get(role);
      if (entry) {
        availableRoles[role] = { ...entry };
      } else {
        const spec = this.manifestSpecs[role];
        missingRoles.push({
          role,
          file: spec.file,
          description: spec.description,
          targetHeightMeters: spec.targetHeightMeters,
        });
      }
    }

    const errors: Partial<Record<CharacterModelRole, CharacterLoadError>> = {};
    for (const [k, v] of this.loadErrors.entries()) errors[k] = v;
    const inspections: Partial<Record<CharacterModelRole, ModelInspectionReport>> = {};
    for (const [k, v] of this.modelInspections.entries()) inspections[k] = v;

    return {
      manifestLoaded: this.manifestLoaded,
      totalRequired: allRoles.length,
      availableCount: Object.keys(availableRoles).length,
      availableRoles,
      missingRoles,
      errors,
      inspections,
    };
  }

  public onModelsUpdated(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  public onErrorsUpdated(cb: () => void): () => void {
    this.errorListeners.add(cb);
    return () => this.errorListeners.delete(cb);
  }

  private notifyListeners() {
    for (const cb of this.listeners) cb();
  }

  private notifyErrorListeners() {
    for (const cb of this.errorListeners) cb();
  }

  private detectFormatFromBytes(buffer: ArrayBuffer, _nameHint: string): 'glb' | 'gltf' | 'fbx' | 'html_or_unknown' {
    const view = new Uint8Array(buffer);
    if (view.length < 4) return 'html_or_unknown';
    // Strict GLB binary magic: "glTF" (0x67 0x6C 0x54 0x46) + version/length check
    if (view[0] === 0x67 && view[1] === 0x6c && view[2] === 0x54 && view[3] === 0x46) {
      if (view.length < 20) return 'html_or_unknown';
      const dv = new DataView(buffer);
      const version = dv.getUint32(4, true);
      const declaredLength = dv.getUint32(8, true);
      if ((version === 1 || version === 2) && declaredLength === view.length) {
        return 'glb';
      }
      return 'html_or_unknown';
    }
    const headStr = new TextDecoder('utf-8', { fatal: false }).decode(view.slice(0, 128)).trimStart();
    if (headStr.startsWith('<') || headStr.toLowerCase().includes('<!doctype')) {
      return 'html_or_unknown';
    }
    if (headStr.startsWith('Kaydara FBX Binary') || headStr.startsWith('; FBX') || headStr.includes('FBXHeaderExtension')) {
      return 'fbx';
    }
    if (headStr.startsWith('{') && headStr.includes('"asset"')) {
      return 'gltf';
    }
    return 'html_or_unknown';
  }

  private optimizeTexturesForAndroid(scene: THREE.Object3D): {
    meshCount: number;
    materialCount: number;
    hasSkeleton: boolean;
    boneCount: number;
    hasTextures: boolean;
  } {
    let meshCount = 0;
    const uniqueMaterials = new Set<THREE.Material>();
    const uniqueBones = new Set<THREE.Bone>();
    let hasSkeleton = false;
    let hasTextures = false;

    const configureTex = (tex: THREE.Texture | null | undefined, isColor: boolean) => {
      if (!tex) return;
      hasTextures = true;
      tex.colorSpace = isColor ? THREE.SRGBColorSpace : THREE.NoColorSpace;
      tex.generateMipmaps = true;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      // Balanced anisotropy for Android & desktop GPUs without hurting mobile fill-rate
      tex.anisotropy = Math.min(4, tex.anisotropy || 4);
      tex.needsUpdate = true;
    };

    scene.traverse((child) => {
      if ((child as THREE.Bone).isBone) {
        uniqueBones.add(child as THREE.Bone);
      }
      const skinned = child as THREE.SkinnedMesh;
      if (skinned.isSkinnedMesh && skinned.skeleton) {
        hasSkeleton = true;
        for (const b of skinned.skeleton.bones) uniqueBones.add(b);
      }

      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      meshCount++;
      // Keep animated SkinnedMesh visible across all bone poses to avoid frustum-cull popping
      mesh.frustumCulled = !skinned.isSkinnedMesh;

      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      for (const mat of mats) {
        if (!mat) continue;
        uniqueMaterials.add(mat);
        const std = mat as THREE.MeshStandardMaterial;
        configureTex(std.map, true);
        configureTex(std.emissiveMap, true);
        configureTex(std.normalMap, false);
        configureTex(std.roughnessMap, false);
        configureTex(std.metalnessMap, false);
        configureTex(std.aoMap, false);
        if (typeof std.envMapIntensity === 'number') {
          std.envMapIntensity = 0.85;
        }
      }
    });

    return {
      meshCount,
      materialCount: uniqueMaterials.size,
      hasSkeleton,
      boneCount: uniqueBones.size,
      hasTextures,
    };
  }

  private async loadTemplate(
    url: string,
    label: string,
    role: CharacterModelRole
  ): Promise<{ template: CachedTemplate | null; error?: CharacterLoadError }> {
    if (this.templateCache.has(url)) {
      return { template: this.templateCache.get(url)! };
    }
    if (this.inFlightLoads.has(url)) {
      return this.inFlightLoads.get(url)!;
    }

    const expectedFile = `public/models/characters/${this.manifestSpecs[role]?.file || 'Athletic_man.glb'}`;

    const promise = (async (): Promise<{ template: CachedTemplate | null; error?: CharacterLoadError }> => {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) {
          const err: CharacterLoadError = {
            role,
            expectedFile,
            attemptedUrl: url,
            reason: 'missing_file',
            message: `HTTP ${res.status} while loading ${label} from ${url}.`,
            timestamp: Date.now(),
          };
          return { template: null, error: err };
        }

        const contentType = (res.headers.get('content-type') || '').toLowerCase();
        if (contentType.includes('text/html')) {
          const err: CharacterLoadError = {
            role,
            expectedFile,
            attemptedUrl: url,
            reason: 'missing_file',
            message: `Model file not found at ${url} (server returned HTML fallback instead of 3D model binary).`,
            timestamp: Date.now(),
          };
          return { template: null, error: err };
        }

        const buffer = await res.arrayBuffer();
        const detectedFormat = this.detectFormatFromBytes(buffer, label);

        if (detectedFormat === 'html_or_unknown') {
          const err: CharacterLoadError = {
            role,
            expectedFile,
            attemptedUrl: url,
            reason: 'invalid_format',
            message: `Invalid 3D model file at ${url}. Expected binary .glb, .gltf, or .fbx asset.`,
            timestamp: Date.now(),
          };
          return { template: null, error: err };
        }

        const baseResourcePath = url.startsWith('blob:') ? '' : url.slice(0, url.lastIndexOf('/') + 1);
        let scene: THREE.Group;
        let rawClips: THREE.AnimationClip[] = [];

        if (detectedFormat === 'fbx') {
          scene = this.fbxLoader.parse(buffer, baseResourcePath);
          rawClips = scene.animations || [];
        } else {
          this.ensureDracoConfigured();
          const gltf = await this.gltfLoader.parseAsync(buffer, baseResourcePath);
          scene = gltf.scene;
          rawClips = gltf.animations || [];
        }

        if (!scene) {
          return {
            template: null,
            error: {
              role,
              expectedFile,
              attemptedUrl: url,
              reason: 'empty_scene',
              message: `Loaded model ${label} contains no 3D scene root.`,
              timestamp: Date.now(),
            },
          };
        }

        scene.updateMatrixWorld(true);
        const bbox = new THREE.Box3().setFromObject(scene);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        bbox.getSize(size);
        bbox.getCenter(center);
        const boundsHeight = Math.max(0.1, size.y);

        const stats = this.optimizeTexturesForAndroid(scene);
        if (stats.meshCount === 0) {
          return {
            template: null,
            error: {
              role,
              expectedFile,
              attemptedUrl: url,
              reason: 'empty_scene',
              message: `Loaded model ${label} contains 0 renderable meshes.`,
              timestamp: Date.now(),
            },
          };
        }

        const animations = rawClips.map((clip) => {
          const c = clip.clone();
          c.optimize();
          return c;
        });

        const template: CachedTemplate = {
          scene,
          animations,
          boundsHeight,
          boundsMinY: Number.isFinite(bbox.min.y) ? bbox.min.y : 0,
          boundsCenterX: Number.isFinite(center.x) ? center.x : 0,
          boundsCenterZ: Number.isFinite(center.z) ? center.z : 0,
          format: detectedFormat,
          hasSkeleton: stats.hasSkeleton,
          boneCount: stats.boneCount,
          meshCount: stats.meshCount,
          materialCount: stats.materialCount,
          hasTextures: stats.hasTextures,
        };
        this.templateCache.set(url, template);
        return { template };
      } catch (err) {
        const errorObj: CharacterLoadError = {
          role,
          expectedFile,
          attemptedUrl: url,
          reason: 'parse_error',
          message: `Failed to parse ${label} (${url}): ${err instanceof Error ? err.message : String(err)}`,
          timestamp: Date.now(),
        };
        console.warn(`[3DWorld CharacterAssets] ${errorObj.message}`);
        return { template: null, error: errorObj };
      } finally {
        this.inFlightLoads.delete(url);
      }
    })();

    this.inFlightLoads.set(url, promise);
    return promise;
  }

  /**
   * Instantiates an independent, skinned, grounded, animation-blended GLB/FBX character instance.
   * Returns null and records a structured CharacterLoadError if no valid model could be loaded.
   */
  public async createInstance(
    role: CharacterModelRole,
    customization: GLBCharacterCustomization = {}
  ): Promise<GLBCharacterInstance | null> {
    await this.initManifest();
    let resolved = this.resolveUrlForRole(role);

    if (!resolved) {
      if ((role === 'player_male' || role.endsWith('_male')) && typeof window !== 'undefined' && typeof fetch === 'function') {
        const directUrl = '/models/characters/Athletic_man.glb';
        if (!this.failedUrls.has(directUrl)) {
          resolved = { url: directUrl, label: 'Athletic_man.glb' };
        }
      }

      if (!resolved) {
        if (role === 'player_male' && !this.loadErrors.has('player_male')) {
          const expectedFile = `public/models/characters/${this.manifestSpecs.player_male?.file || 'Athletic_man.glb'}`;
          this.loadErrors.set('player_male', {
            role: 'player_male',
            expectedFile,
            attemptedUrl: '/models/characters/Athletic_man.glb',
            reason: 'missing_file',
            message:
              'Supplied Athletic Man model not found at /models/characters/Athletic_man.glb. Using safe fallback character until the GLB asset is supplied.',
            timestamp: Date.now(),
          });
          this.notifyErrorListeners();
        }
        return null;
      }
    }

    if (this.failedUrls.has(resolved.url)) {
      return null;
    }

    const { template, error } = await this.loadTemplate(resolved.url, resolved.label, role);
    if (!template) {
      this.failedUrls.add(resolved.url);
      if (error) {
        this.loadErrors.set(role, error);
        if (role === 'player_male' || resolved.url === '/models/characters/Athletic_man.glb') {
          this.loadErrors.set('player_male', error);
        }
        this.notifyErrorListeners();
      }
      return null;
    }

    // Register successful direct load in roleUrlMap so subsequent instances skip probing
    if (!this.roleUrlMap.has(role) && resolved.url === '/models/characters/Athletic_man.glb') {
      this.roleUrlMap.set('player_male', { url: resolved.url, source: 'public', label: resolved.label });
    }

    this.failedUrls.delete(resolved.url);
    const hadError =
      this.loadErrors.delete(role) ||
      (resolved.url === '/models/characters/Athletic_man.glb' && this.loadErrors.delete('player_male'));
    if (hadError) {
      this.notifyErrorListeners();
    }

    // Clone with SkeletonUtils so SkinnedMesh skeletons remain 100% independent per player/avatar
    const clonedModel = SkeletonUtils.clone(template.scene) as THREE.Group;
    const root = new THREE.Group();
    root.name = `CharacterModel_${role}`;

    const spec = this.manifestSpecs[role] || DEFAULT_REQUIRED_MODELS.player_male;
    const targetHeight = customization.targetHeight ?? spec.targetHeightMeters;
    // Strict uniform scale preserves exact facial/body proportions without stretching
    const scaleFactor = targetHeight / template.boundsHeight;

    clonedModel.scale.setScalar(scaleFactor);
    clonedModel.position.set(
      -template.boundsCenterX * scaleFactor,
      -template.boundsMinY * scaleFactor,
      -template.boundsCenterZ * scaleFactor
    );
    root.add(clonedModel);

    // Clone materials per instance only if customization tints will be applied;
    // otherwise preserve original PBR materials and textures intact for best Android GPU efficiency
    const preserveOriginals =
      customization.preserveOriginalMaterials ?? role === 'player_male';
    const clonedMaterials: THREE.Material[] = [];
    const castShadow = customization.castShadow !== false;

    clonedModel.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = castShadow;
      mesh.receiveShadow = true;

      if (!preserveOriginals) {
        if (Array.isArray(mesh.material)) {
          mesh.material = mesh.material.map((m) => {
            const cm = m.clone();
            clonedMaterials.push(cm);
            return cm;
          });
        } else if (mesh.material) {
          const cm = mesh.material.clone();
          clonedMaterials.push(cm);
          mesh.material = cm;
        }
      }
    });

    // Setup skeletal AnimationMixer & map actual embedded AnimationClips
    const mixer = new THREE.AnimationMixer(clonedModel);
    const actions = new Map<SkeletalAnimState, THREE.AnimationAction>();
    const availableClipNames = template.animations.map((c) => c.name);

    for (const state of Object.keys(CLIP_ALIASES) as SkeletalAnimState[]) {
      const aliases = CLIP_ALIASES[state];
      const matchedClip = template.animations.find((clip) => {
        const nameLower = clip.name.toLowerCase();
        return aliases.some((alias) => nameLower === alias || nameLower.includes(alias));
      });
      if (matchedClip) {
        const action = mixer.clipAction(matchedClip);
        if (state === 'jump' || state === 'stand') {
          action.setLoop(THREE.LoopOnce, 1);
          action.clampWhenFinished = true;
        }
        actions.set(state, action);
      }
    }

    const coreStates: ('idle' | 'walk' | 'run' | 'turn' | 'jump')[] = ['idle', 'walk', 'run', 'turn', 'jump'];
    const missingCoreStates = coreStates.filter((st) => {
      if (st === 'turn') {
        return !actions.has('turn') && !actions.has('turn_left') && !actions.has('turn_right');
      }
      return !actions.has(st);
    });

    const inspection: ModelInspectionReport = {
      role,
      url: resolved.url,
      label: resolved.label,
      format: template.format,
      hasSkeleton: template.hasSkeleton,
      boneCount: template.boneCount,
      meshCount: template.meshCount,
      materialCount: template.materialCount,
      hasTextures: template.hasTextures,
      availableClips: availableClipNames,
      matchedStates: Array.from(actions.keys()),
      missingCoreStates,
      boundsHeightMeters: targetHeight,
    };
    this.modelInspections.set(role, inspection);

    // Start in idle (or first available clip if model lacks an explicit idle clip)
    let activeState: SkeletalAnimState = actions.has('idle') ? 'idle' : 'walk';
    let activeAction =
      actions.get(activeState) ||
      (template.animations[0] ? mixer.clipAction(template.animations[0]) : null);
    if (activeAction) {
      activeAction.reset().setEffectiveWeight(1).play();
    }

    const applyCustomization = (opts: GLBCharacterCustomization) => {
      if (preserveOriginals || opts.preserveOriginalMaterials) return;
      const accentColor = opts.primaryColor !== undefined ? new THREE.Color(opts.primaryColor) : null;
      const hairColor = opts.hairColor !== undefined ? new THREE.Color(opts.hairColor) : null;

      clonedModel.traverse((child) => {
        const mesh = child as THREE.Mesh;
        if (!mesh.isMesh) return;
        const meshName = (mesh.name || '').toLowerCase();
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

        for (const mat of mats) {
          const std = mat as THREE.MeshStandardMaterial;
          if (!std || !std.color) continue;
          const matName = (std.name || '').toLowerCase();
          const combined = `${meshName}_${matName}`;

          if (accentColor && (combined.includes('shirt') || combined.includes('jacket') || combined.includes('top') || combined.includes('outfit') || combined.includes('coat'))) {
            std.color.copy(accentColor);
          } else if (hairColor && combined.includes('hair')) {
            std.color.copy(hairColor);
          }
        }
      });
    };

    applyCustomization(customization);

    // Mobile & Android LOD animation throttling accumulator
    let lodAccumulator = 0;

    const updateAnimation = (
      state: SkeletalAnimState,
      dt: number,
      movementSpeed: number = 1.4,
      cameraDistance: number = 10,
      angularTurnRate: number = 0
    ) => {
      if (cameraDistance > 110) {
        return;
      }

      let stepDt = dt;
      if (cameraDistance > 55) {
        lodAccumulator += dt;
        if (lodAccumulator < 0.045) return;
        stepDt = lodAccumulator;
        lodAccumulator = 0;
      } else {
        lodAccumulator = 0;
      }

      // Resolve turning clip if turning cleanly while idle/slow
      let resolvedState = state;
      if (state === 'idle' && Math.abs(angularTurnRate) > 0.75) {
        const turnDirState: SkeletalAnimState = angularTurnRate > 0 ? 'turn_left' : 'turn_right';
        if (actions.has(turnDirState)) {
          resolvedState = turnDirState;
        } else if (actions.has('turn')) {
          resolvedState = 'turn';
        }
      }

      // Match actual clip without fabricating unsupported animations
      const targetAction =
        actions.get(resolvedState) ||
        (resolvedState === 'sprint' ? actions.get('run') || actions.get('walk') : undefined) ||
        (resolvedState === 'run' ? actions.get('walk') : undefined) ||
        (resolvedState === 'talk' || resolvedState === 'work' || resolvedState === 'carry'
          ? actions.get('idle')
          : undefined) ||
        actions.get('idle');

      if (targetAction && targetAction !== activeAction) {
        const fadeDuration = resolvedState === 'jump' || resolvedState === 'sprint' ? 0.14 : 0.22;
        targetAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).play();
        if (activeAction) {
          activeAction.crossFadeTo(targetAction, fadeDuration, true);
        }
        activeAction = targetAction;
        activeState = resolvedState;
      }

      // Synchronize locomotion playback rate with horizontal ground speed to avoid foot sliding
      if (activeAction && (activeState === 'walk' || activeState === 'run' || activeState === 'sprint')) {
        const baseSpeed = activeState === 'sprint' ? 5.0 : activeState === 'run' ? 3.5 : 1.4;
        activeAction.setEffectiveTimeScale(Math.max(0.65, Math.min(1.65, movementSpeed / baseSpeed)));
      }

      mixer.update(stepDt);
    };

    const dispose = () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(clonedModel);
      for (const m of clonedMaterials) {
        m.dispose();
      }
    };

    return {
      root,
      mixer,
      actions,
      availableClipNames,
      format: template.format,
      inspection,
      updateAnimation,
      applyCustomization,
      dispose,
    };
  }
}

export const characterAssetManager = new CharacterAssetManager();
