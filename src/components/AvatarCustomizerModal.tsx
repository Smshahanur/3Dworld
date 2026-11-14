import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  X,
  User,
  Check,
  Sparkles,
  Briefcase,
  Compass,
  Hammer,
  Upload,
  RotateCcw,
  Box,
  AlertTriangle,
  CheckCircle2,
  Play,
} from 'lucide-react';
import {
  AvatarColor,
  AvatarType,
  GenderType,
  LocalAvatarConfig,
  AVATAR_COLORS,
  AVATAR_STYLES,
  AVATAR_SKIN_TONES,
  AVATAR_HAIRSTYLES,
  AVATAR_HAIR_COLORS,
  AVATAR_EYE_COLORS,
} from '../multiplayer/types';
import {
  createHumanoidCharacter,
  HumanoidRig,
  HumanHairStyle,
  HumanOutfitType,
  HumanoidGesture,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
} from '../world/humanoidCharacterSystem';
import {
  characterAssetManager,
  CharacterAssetStatus,
  CharacterLoadError,
  CharacterModelRole,
  ModelInspectionReport,
} from '../world/glbCharacterLoader';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialConfig: LocalAvatarConfig;
  isMultiplayerActive: boolean;
  onApply: (config: LocalAvatarConfig) => void;
}

type PreviewMotion = 'idle' | 'walk' | 'run' | 'talk' | 'sit' | 'wave';

const PREVIEW_MOTIONS: { id: PreviewMotion; label: string }[] = [
  { id: 'idle', label: 'Idle' },
  { id: 'walk', label: 'Walk' },
  { id: 'run', label: 'Run' },
  { id: 'talk', label: 'Talk' },
  { id: 'sit', label: 'Sit' },
  { id: 'wave', label: 'Wave' },
];

const UPLOAD_ROLES: { id: CharacterModelRole; label: string }[] = [
  { id: 'player_male', label: 'Player Male' },
  { id: 'player_female', label: 'Player Female' },
  { id: 'npc_rural_male', label: 'Rural NPC (M)' },
  { id: 'npc_rural_female', label: 'Rural NPC (F)' },
  { id: 'npc_modern_male', label: 'Modern NPC (M)' },
  { id: 'npc_modern_female', label: 'Modern NPC (F)' },
  { id: 'npc_capital_male', label: 'Capital NPC (M)' },
  { id: 'npc_capital_female', label: 'Capital NPC (F)' },
];

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({
  isOpen,
  onClose,
  initialConfig,
  isMultiplayerActive,
  onApply,
}) => {
  const [displayName, setDisplayName] = useState(initialConfig.displayName);
  const [gender, setGender] = useState<GenderType>(initialConfig.gender);
  const [avatarType, setAvatarType] = useState<AvatarType>(initialConfig.avatarType);
  const [avatarColor, setAvatarColor] = useState<AvatarColor>(initialConfig.avatarColor);
  const [skinTone, setSkinTone] = useState<string>(initialConfig.skinTone);
  const [hairStyle, setHairStyle] = useState<string>(initialConfig.hairStyle);
  const [hairColor, setHairColor] = useState<string>(initialConfig.hairColor);
  const [eyeColor, setEyeColor] = useState<string>(initialConfig.eyeColor);

  const [previewMotion, setPreviewMotion] = useState<PreviewMotion>('idle');
  const [rigMode, setRigMode] = useState<'glb' | 'fbx' | 'loading' | 'error' | 'procedural_fallback'>('loading');
  const [loadedClips, setLoadedClips] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<CharacterLoadError | null>(null);
  const [inspectionReport, setInspectionReport] = useState<ModelInspectionReport | null>(null);
  const [assetStatus, setAssetStatus] = useState<CharacterAssetStatus>(() =>
    characterAssetManager.getAssetStatus()
  );
  const [uploadRole, setUploadRole] = useState<CharacterModelRole>(
    initialConfig.gender === 'female' ? 'player_female' : 'player_male'
  );
  const [showMissingList, setShowMissingList] = useState(false);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const motionRef = useRef<PreviewMotion>('idle');
  const rigRef = useRef<HumanoidRig | null>(null);
  const orbitYawRef = useRef<number>(0.35);
  const isDraggingRef = useRef<boolean>(false);
  const lastDragXRef = useRef<number>(0);

  useEffect(() => {
    motionRef.current = previewMotion;
  }, [previewMotion]);

  // Sync local form state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDisplayName(initialConfig.displayName);
    setGender(initialConfig.gender);
    setAvatarType(initialConfig.avatarType);
    setAvatarColor(initialConfig.avatarColor);
    setSkinTone(initialConfig.skinTone);
    setHairStyle(initialConfig.hairStyle);
    setHairColor(initialConfig.hairColor);
    setEyeColor(initialConfig.eyeColor);
    setUploadRole(initialConfig.gender === 'female' ? 'player_female' : 'player_male');
  }, [isOpen, initialConfig]);

  // Subscribe to GLB manifest / custom model updates
  useEffect(() => {
    if (!isOpen) return;
    void characterAssetManager.initManifest().then(() => {
      setAssetStatus(characterAssetManager.getAssetStatus());
    });
    const unsub = characterAssetManager.onModelsUpdated(() => {
      setAssetStatus(characterAssetManager.getAssetStatus());
    });
    return () => unsub();
  }, [isOpen]);

  // Keep uploadRole synced with selected gender if on player role
  useEffect(() => {
    if (uploadRole === 'player_male' || uploadRole === 'player_female') {
      setUploadRole(gender === 'female' ? 'player_female' : 'player_male');
    }
  }, [gender, uploadRole]);

  // Escape key closes modal
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Live 3D Character Preview Renderer
  useEffect(() => {
    if (!isOpen || !previewContainerRef.current) return;
    const container = previewContainerRef.current;

    let renderer: THREE.WebGLRenderer | null = null;
    let pmremGen: THREE.PMREMGenerator | null = null;
    let envRT: THREE.WebGLRenderTarget | null = null;
    let rafId = 0;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 380;

    // Detect software WebGL
    let isSoftwareGl = false;
    try {
      const testGl = document.createElement('canvas').getContext('webgl2');
      if (testGl) {
        const ext = testGl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : testGl.RENDERER;
        const gpu = String(testGl.getParameter(param));
        isSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
        testGl.getExtension('WEBGL_lose_context')?.loseContext();
      } else {
        isSoftwareGl = true;
      }
    } catch {
      isSoftwareGl = true;
    }

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        alpha: true,
        powerPreference: 'high-performance',
      });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.shadowMap.enabled = !isSoftwareGl;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, width / Math.max(1, height), 0.1, 30);
    camera.position.set(0, 1.38, 3.65);
    camera.lookAt(0, 0.92, 0);

    // Lighting
    pmremGen = new THREE.PMREMGenerator(renderer);
    const roomEnv = new RoomEnvironment();
    envRT = pmremGen.fromScene(roomEnv, 0.04);
    scene.environment = envRT.texture;
    roomEnv.dispose();

    const hemi = new THREE.HemisphereLight(0xe0f2fe, 0x1e293b, 0.85);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 1.9);
    keyLight.position.set(2.8, 4.2, 3.4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.set(512, 512);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.9);
    rimLight.position.set(-2.6, 2.5, -2.5);
    scene.add(rimLight);

    // Sleek Stage Pedestal
    const pedestalGeo = new THREE.CylinderGeometry(0.72, 0.82, 0.12, 36);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.35,
      metalness: 0.65,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.y = -0.06;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    const ringGeo = new THREE.RingGeometry(0.68, 0.72, 48);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x22d3ee,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.004;
    scene.add(ring);

    const avatarAnchor = new THREE.Group();
    scene.add(avatarAnchor);

    // Map selected configuration to outfit & colors
    let outfitType: HumanOutfitType = 'casual';
    if (avatarType === 'formal') outfitType = 'formal_blazer';
    else if (avatarType === 'traditional') outfitType = 'traditional';
    else if (avatarType === 'builder') outfitType = 'builder';
    else if (avatarType === 'cyber') outfitType = 'cyber';
    else if (avatarType === 'explorer') outfitType = 'explorer';

    const primaryHex = AVATAR_COLORS.find((c) => c.id === avatarColor)?.hex || '#06b6d4';
    const skinVal = (SKIN_TONES as Record<string, number>)[skinTone] ?? SKIN_TONES.warmBeige;
    const hairVal = (HAIR_COLORS as Record<string, number>)[hairColor] ?? HAIR_COLORS.darkBrown;
    const eyeVal = (EYE_COLORS as Record<string, number>)[eyeColor] ?? EYE_COLORS.brown;

    const rig = createHumanoidCharacter({
      gender,
      roleKey: gender === 'female' ? 'player_female' : 'player_male',
      strictAssetRequired: gender === 'male',
      hairStyle: hairStyle as HumanHairStyle,
      outfitType,
      primaryColor: primaryHex,
      secondaryColor: 0xffffff,
      skinTone: skinVal,
      hairColor: hairVal,
      eyeColor: eyeVal,
      pantsColor: 0x1e293b,
      shoesColor: 0x0f172a,
      castShadow: !isSoftwareGl,
    });
    rigRef.current = rig;
    avatarAnchor.add(rig.root);

    const syncRigInspection = () => {
      if (rigRef.current !== rig) return;
      setRigMode(rig.getRigMode());
      setLoadedClips(rig.getLoadedClipNames());
      setLoadError(rig.getLoadError());
      setInspectionReport(rig.getModelInspection());
    };

    syncRigInspection();
    if (rig.hotSwapPromise) {
      void rig.hotSwapPromise.then(() => {
        syncRigInspection();
      });
    }

    const unsubPreviewUpdates = characterAssetManager.onModelsUpdated(() => {
      setTimeout(() => {
        syncRigInspection();
      }, 150);
    });

    // Pointer resize handling
    const onResize = () => {
      if (!container || !renderer) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 380;
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    // Animation loop
    let lastTime = performance.now();
    let walkTime = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.06, Math.max(0.001, (now - lastTime) / 1000));
      lastTime = now;

      if (!isDraggingRef.current) {
        orbitYawRef.current += dt * 0.35;
      }
      avatarAnchor.rotation.y = orbitYawRef.current;

      const motion = motionRef.current;
      let isMoving = false;
      let isSprinting = false;
      let moveSpeed = 0;
      let gesture: HumanoidGesture = 'none';

      if (motion === 'walk') {
        isMoving = true;
        moveSpeed = 1.4;
        walkTime += dt * moveSpeed * 3.4;
      } else if (motion === 'run') {
        isMoving = true;
        isSprinting = true;
        moveSpeed = 3.5;
        walkTime += dt * moveSpeed * 3.4;
      } else if (motion === 'talk') {
        gesture = 'talk';
      } else if (motion === 'sit') {
        gesture = 'sit';
      } else if (motion === 'wave') {
        gesture = 'wave';
      }

      rig.updateAnimation(walkTime, isMoving, isSprinting, false, 0, dt, moveSpeed, gesture, 3.6);
      renderer?.render(scene, camera);
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      unsubPreviewUpdates();
      rigRef.current = null;
      rig.dispose();
      pedestalGeo.dispose();
      pedestalMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      envRT?.dispose();
      pmremGen?.dispose();
      if (renderer) {
        renderer.dispose();
        if (renderer.domElement && container.contains(renderer.domElement)) {
          container.removeChild(renderer.domElement);
        }
      }
    };
  }, [isOpen, gender, avatarType, avatarColor, skinTone, hairStyle, hairColor, eyeColor]);

  if (!isOpen) return null;

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    characterAssetManager.registerCustomBlobModel(uploadRole, url, file.name);
    e.target.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply({
      displayName: displayName.trim() || 'Explorer',
      avatarColor,
      avatarType,
      gender,
      skinTone,
      hairStyle,
      hairColor,
      eyeColor,
    });
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="avatar-customizer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-4xl bg-[#080d1a] border border-cyan-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-white/10 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 id="avatar-customizer-title" className="text-base font-bold text-white tracking-wide">
                Human Character & Avatar Studio
              </h2>
              <p className="text-xs text-slate-400">
                Customize appearance, test skeletal animations, or preview local GLB/GLTF models
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Avatar Studio"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body: 2 Columns (Live 3D Preview + Customization Controls) */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12">
          {/* Left Column: Interactive 3D Character Viewport */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-950 via-[#070d1d] to-slate-950 border-b md:border-b-0 md:border-r border-white/10 p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                  rigMode === 'glb' || rigMode === 'fbx'
                    ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                    : rigMode === 'error'
                    ? 'bg-rose-950/70 border-rose-500/50 text-rose-200'
                    : 'bg-amber-950/50 border-amber-500/30 text-amber-300'
                }`}
              >
                {rigMode === 'glb' || rigMode === 'fbx' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {rigMode.toUpperCase()} Rig Active ({loadedClips.length} clips)
                  </>
                ) : rigMode === 'error' ? (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Model Missing / Load Error
                  </>
                ) : rigMode === 'loading' ? (
                  <>
                    <Box className="w-3.5 h-3.5" />
                    Loading Athletic_man...
                  </>
                ) : (
                  <>
                    <Box className="w-3.5 h-3.5" />
                    Fallback Rig (No .glb loaded)
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() => {
                  orbitYawRef.current = 0.35;
                }}
                title="Reset rotation"
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 text-xs cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 3D WebGL Canvas Container */}
            <div
              ref={previewContainerRef}
              onPointerDown={(e) => {
                isDraggingRef.current = true;
                lastDragXRef.current = e.clientX;
              }}
              onPointerMove={(e) => {
                if (!isDraggingRef.current) return;
                const dx = e.clientX - lastDragXRef.current;
                lastDragXRef.current = e.clientX;
                orbitYawRef.current += dx * 0.012;
              }}
              onPointerUp={() => {
                isDraggingRef.current = false;
              }}
              onPointerLeave={() => {
                isDraggingRef.current = false;
              }}
              className="relative w-full h-72 sm:h-80 rounded-xl bg-[radial-gradient(circle_at_50%_35%,rgba(14,116,144,0.22),rgba(6,9,19,0.92))] border border-white/10 overflow-hidden cursor-grab active:cursor-grabbing touch-none"
            >
              {rigMode === 'error' && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 text-center bg-slate-950/85">
                  <AlertTriangle className="w-8 h-8 text-rose-400 mb-2" />
                  <p className="text-xs font-bold text-rose-200 mb-1">
                    Male Character Model Failed to Load
                  </p>
                  <p className="text-[11px] text-slate-300 leading-relaxed max-w-[260px]">
                    {loadError?.message ||
                      'public/models/characters/Athletic_man.glb was not found. Old procedural mannequin fallback is disabled.'}
                  </p>
                </div>
              )}
              <div className="pointer-events-none absolute bottom-2 left-2.5 text-[10px] text-slate-400">
                Drag to rotate 360°
              </div>
            </div>

            {inspectionReport && (rigMode === 'glb' || rigMode === 'fbx') && (
              <div className="mt-2.5 p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-[10px] text-slate-300 space-y-1">
                <div className="flex items-center justify-between font-semibold text-emerald-300">
                  <span>Model: {inspectionReport.label} ({inspectionReport.format.toUpperCase()})</span>
                  <span>{inspectionReport.boneCount} bones • {inspectionReport.hasTextures ? 'Textured' : 'Untextured'}</span>
                </div>
                <div className="text-slate-400">
                  Clips ({inspectionReport.availableClips.length}):{' '}
                  {inspectionReport.availableClips.length > 0 ? inspectionReport.availableClips.join(', ') : 'None embedded'}
                </div>
                {inspectionReport.missingCoreStates.length > 0 && (
                  <div className="text-amber-300">
                    Missing clips: {inspectionReport.missingCoreStates.join(', ')}
                  </div>
                )}
              </div>
            )}

            {/* Skeletal Animation State Switcher */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3 text-cyan-400" />
                  Animation Preview
                </span>
                <span className="text-cyan-300 capitalize font-medium">{previewMotion}</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {PREVIEW_MOTIONS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPreviewMotion(m.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                      previewMotion === m.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Appearance Customization & GLB Model Loader */}
          <div className="md:col-span-7 p-5 space-y-4">
            {/* Name & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  maxLength={24}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Explorer Name"
                  className="w-full px-3 py-2 rounded-lg bg-black/50 border border-slate-700 focus:border-cyan-400 focus:outline-none text-sm text-white"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1">Human Character Model</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      gender === 'male'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border ${
                      gender === 'female'
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-pink-400" />
                    Female
                  </button>
                </div>
              </div>
            </div>

            {/* Clothing Style */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Clothing Style</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {AVATAR_STYLES.map((sty) => {
                  const isSelected = avatarType === sty.id;
                  const Icon =
                    sty.id === 'formal'
                      ? Briefcase
                      : sty.id === 'explorer'
                      ? Compass
                      : sty.id === 'builder'
                      ? Hammer
                      : sty.id === 'traditional' || sty.id === 'cyber'
                      ? Sparkles
                      : User;
                  return (
                    <button
                      key={sty.id}
                      type="button"
                      onClick={() => setAvatarType(sty.id)}
                      title={sty.description}
                      className={`p-2 rounded-lg flex flex-col items-center gap-1 text-center cursor-pointer border transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                          : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="text-[11px] font-medium truncate w-full">{sty.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hairstyle */}
            <div>
              <span className="text-[11px] text-slate-400 block mb-1.5">Hairstyle</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {AVATAR_HAIRSTYLES.map((hs) => (
                  <button
                    key={hs.id}
                    type="button"
                    onClick={() => setHairStyle(hs.id)}
                    className={`py-1.5 px-2.5 rounded-lg text-xs font-medium truncate cursor-pointer border ${
                      hairStyle === hs.id
                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                        : 'bg-black/40 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {hs.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Palettes: Skin, Hair, Eyes, Outfit Accent */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Skin Tone</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_SKIN_TONES.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSkinTone(tone.id)}
                      title={tone.label}
                      className={`h-7 rounded-md flex items-center justify-center cursor-pointer border ${
                        skinTone === tone.id ? 'border-white ring-2 ring-cyan-400/60 scale-105' : 'border-white/15'
                      }`}
                      style={{ backgroundColor: tone.hex }}
                    >
                      {skinTone === tone.id && <Check className="w-3.5 h-3.5 text-black" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Hair Color</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_HAIR_COLORS.map((hc) => (
                    <button
                      key={hc.id}
                      type="button"
                      onClick={() => setHairColor(hc.id)}
                      title={hc.label}
                      className={`h-7 rounded-md flex items-center justify-center cursor-pointer border ${
                        hairColor === hc.id ? 'border-white ring-2 ring-cyan-400/60 scale-105' : 'border-white/15'
                      }`}
                      style={{ backgroundColor: hc.hex }}
                    >
                      {hairColor === hc.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Eye Color</span>
                <div className="grid grid-cols-6 gap-1.5">
                  {AVATAR_EYE_COLORS.map((ec) => (
                    <button
                      key={ec.id}
                      type="button"
                      onClick={() => setEyeColor(ec.id)}
                      title={ec.label}
                      className={`h-7 rounded-md flex items-center justify-center cursor-pointer border ${
                        eyeColor === ec.id ? 'border-white ring-2 ring-cyan-400/60 scale-105' : 'border-white/15'
                      }`}
                      style={{ backgroundColor: ec.hex }}
                    >
                      {eyeColor === ec.id && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 block mb-1.5">Outfit Accent Color</span>
                <div className="grid grid-cols-8 gap-1">
                  {AVATAR_COLORS.map((col) => (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => setAvatarColor(col.id)}
                      title={col.label}
                      className={`h-7 rounded-md flex items-center justify-center cursor-pointer border ${
                        avatarColor === col.id ? 'border-white ring-2 ring-cyan-400/60 scale-105' : 'border-white/15'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    >
                      {avatarColor === col.id && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* GLB / GLTF Human Asset Pipeline & Local File Loader */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-white/10 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs">
                  {assetStatus.availableCount > 0 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  )}
                  <span className="font-semibold text-slate-200">
                    GLB Human Assets: {assetStatus.availableCount} / {assetStatus.totalRequired} loaded
                  </span>
                </div>
                {assetStatus.missingRoles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowMissingList((v) => !v)}
                    className="text-[11px] text-cyan-300 hover:text-cyan-200 underline cursor-pointer"
                  >
                    {showMissingList ? 'Hide needed files' : 'View needed .glb files'}
                  </button>
                )}
              </div>

              {showMissingList && assetStatus.missingRoles.length > 0 && (
                <div className="p-2.5 rounded-lg bg-black/50 border border-amber-500/20 text-[11px] text-slate-300 space-y-1">
                  <p className="text-amber-300 font-medium">
                    Place professionally rigged GLB human models in <code className="text-cyan-300">/public/models/characters/</code>:
                  </p>
                  <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-slate-400 pt-1">
                    {assetStatus.missingRoles.map((m) => (
                      <span key={m.role}>• {m.file}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <select
                  aria-label="Target character role for local GLB test"
                  value={uploadRole}
                  onChange={(e) => setUploadRole(e.target.value as CharacterModelRole)}
                  className="px-2.5 py-1.5 rounded-lg bg-black/60 border border-white/15 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
                >
                  {UPLOAD_ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.label}
                    </option>
                  ))}
                </select>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".glb,.gltf,.fbx"
                  onChange={handleFileSelected}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-xs font-semibold text-cyan-200 transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Load Local .GLB / .FBX
                </button>
              </div>
            </div>

            {/* Footer Submit Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/5 hover:bg-white/10 text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 cursor-pointer"
              >
                {isMultiplayerActive ? 'Apply & Sync Avatar' : 'Apply & Spawn in World'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
