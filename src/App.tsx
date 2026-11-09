/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './world/sceneManager';
import { LightingMode, LOCATIONS, LocationData, BuildingInfo, ViewMode, BUILDINGS, GraphicsQuality, SimulationSpeed, WeatherMode } from './types';
import { soundManager } from './utils/audio';
import { Navbar } from './components/Navbar';
import { HeroOverlay } from './components/HeroOverlay';
import { LocationDrawer } from './components/LocationDrawer';
import { LandmarkDetailModal } from './components/LandmarkDetailModal';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { DestinationBanner } from './components/DestinationBanner';
import { BottomControlDock } from './components/BottomControlDock';
import { BuildToolbar } from './components/BuildToolbar';
import { CatalogItem, CustomPlacedObject } from './builder/types';
import { MultiplayerModal } from './components/MultiplayerModal';
import { MultiplayerHUD } from './components/MultiplayerHUD';
import { MultiplayerChat } from './components/MultiplayerChat';
import { VirtualJoystick } from './components/VirtualJoystick';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { VehicleDashboard } from './components/VehicleDashboard';
import { DrivingDiagnosticPanel } from './components/DrivingDiagnosticPanel';
import { multiplayerService } from './multiplayer/multiplayerService';
import { PlayerData, ChatMessage, MultiplayerUser } from './multiplayer/types';
import { AboutModal } from './components/AboutModal';
import { PavilionInteractionPoint } from './world/creatorPavilionInterior';
import { PavilionInteractionModal } from './components/PavilionInteractionModal';
import { PavilionHUD } from './components/PavilionHUD';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { WorldMinimap } from './components/WorldMinimap';
import { WebGLFallback } from './components/WebGLFallback';
import { WorldInteractionPrompt } from './components/WorldInteractionPrompt';
import { NPCInteractionModal } from './components/NPCInteractionModal';
import { ContextualLocationModal } from './components/ContextualLocationModal';
import { GestureToolbar } from './components/GestureToolbar';
import { ActiveNPCEntity, WorldInteractionSpot } from './world/npcBehaviorSystem';
import { HumanoidGesture } from './world/humanoidCharacterSystem';

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // App & Experience State
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(15);
  const [hasWebGL, setHasWebGL] = useState(true);
  const [heroDismissed, setHeroDismissed] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);

  // Construction Build Mode State
  const [isBuildMode, setIsBuildMode] = useState(false);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState<CatalogItem | null>(null);
  const [selectedCustomObject, setSelectedCustomObject] = useState<CustomPlacedObject | null>(null);
  const [gridSnap, setGridSnap] = useState(true);
  const [budget, setBudget] = useState(15000);
  const [placedCount, setPlacedCount] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [validationStatus, setValidationStatus] = useState<{ isValid: boolean; reason: string }>({
    isValid: true,
    reason: '',
  });

  // Multiplayer Virtual World State
  const [isMultiplayerModalOpen, setIsMultiplayerModalOpen] = useState(false);
  const [isMultiplayerActive, setIsMultiplayerActive] = useState(false);
  const [multiplayerUser, setMultiplayerUser] = useState<MultiplayerUser | null>(null);
  const [remotePlayers, setRemotePlayers] = useState<PlayerData[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [followCamera, setFollowCamera] = useState(true);
  const [selectedRemotePlayer, setSelectedRemotePlayer] = useState<PlayerData | null>(null);
  const [avatarCurrentSpeed, setAvatarCurrentSpeed] = useState(0);
  const [movementSpeedMultiplier, setMovementSpeedMultiplier] = useState(1.0);
  const [lookSensitivityMultiplier, setLookSensitivityMultiplier] = useState(1.0);

  // Monitor real-time local avatar movement velocity
  useEffect(() => {
    if (!isMultiplayerActive) {
      setAvatarCurrentSpeed(0);
      return;
    }
    const interval = setInterval(() => {
      const spd = sceneManagerRef.current?.avatars?.getCurrentSpeed() ?? 0;
      setAvatarCurrentSpeed(spd);
    }, 120);
    return () => clearInterval(interval);
  }, [isMultiplayerActive]);

  // Persistent World & Simulation Preferences
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [viewMode, setViewMode] = useState<ViewMode>('aerial');
  const [autoRotate, setAutoRotate] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [simulationActive, setSimulationActive] = useState(true);
  const [trafficActive, setTrafficActive] = useState(() => {
    try { return localStorage.getItem('3dworld_traffic_active') !== 'false'; } catch { return true; }
  });
  const [pedestriansActive, setPedestriansActive] = useState(() => {
    try { return localStorage.getItem('3dworld_pedestrians_active') !== 'false'; } catch { return true; }
  });
  const [envAnimationActive, setEnvAnimationActive] = useState(() => {
    try { return localStorage.getItem('3dworld_env_anim_active') !== 'false'; } catch { return true; }
  });
  const [simulationSpeed, setSimulationSpeed] = useState<SimulationSpeed>(() => {
    try {
      const saved = parseFloat(localStorage.getItem('3dworld_sim_speed') || '1');
      return (saved === 0.5 || saved === 1 || saved === 2 ? saved : 1) as SimulationSpeed;
    } catch { return 1; }
  });
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(() => {
    try {
      const saved = localStorage.getItem('3dworld_graphics_quality');
      return (saved === 'low' || saved === 'medium' || saved === 'high' ? saved : 'medium') as GraphicsQuality;
    } catch { return 'medium'; }
  });
  const [ecoMode, setEcoMode] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState(12.0);
  const [formattedTime, setFormattedTime] = useState('12:00 PM');
  const [autoDayNight, setAutoDayNight] = useState(true);

  // Weather System State (Clear, Rain, Snow, Fog)
  const [weatherMode, setWeatherMode] = useState<WeatherMode>(() => {
    try {
      const saved = localStorage.getItem('3dworld_weather_mode');
      return (saved === 'clear' || saved === 'rain' || saved === 'snow' || saved === 'fog' ? saved : 'clear') as WeatherMode;
    } catch {
      return 'clear';
    }
  });

  // Drivable Electric Vehicle State (Town Center Roadster)
  const [isDriving, setIsDriving] = useState(false);
  const [vehicleSpeed, setVehicleSpeed] = useState(0);
  const [vehicleGear, setVehicleGear] = useState<'D' | 'R' | 'P'>('P');
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<LocationData | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [aboutInitialTab, setAboutInitialTab] = useState<'creator' | 'project'>('creator');

  // Explorable Creator Pavilion State
  const [isInsidePavilion, setIsInsidePavilion] = useState(false);
  const [nearPavilionPoint, setNearPavilionPoint] = useState<PavilionInteractionPoint | null>(null);
  const [activePavilionPoint, setActivePavilionPoint] = useState<PavilionInteractionPoint | null>(null);
  const [isPavilionRooftop, setIsPavilionRooftop] = useState(false);
  const previousWorldStateRef = useRef<{
    cameraPos: [number, number, number];
    target: [number, number, number];
    viewMode: ViewMode;
  } | null>(null);

  // Living Universe & NPC Proximity State
  const [nearbyNPC, setNearbyNPC] = useState<ActiveNPCEntity | null>(null);
  const [activeNPCModal, setActiveNPCModal] = useState<ActiveNPCEntity | null>(null);
  const [nearbySpot, setNearbySpot] = useState<WorldInteractionSpot | null>(null);
  const [activeSpotModal, setActiveSpotModal] = useState<WorldInteractionSpot | null>(null);
  const [playerGesture, setPlayerGesture] = useState<HumanoidGesture>('none');

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) {
        setHasWebGL(false);
      }
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Initialize SceneManager
  useEffect(() => {
    if (!mountRef.current || !hasWebGL) return;

    // Simulate steady loading progression
    const progressTimer = setInterval(() => {
      setLoadProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressTimer);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    const sm = new SceneManager({
      container: mountRef.current,
      onSelectLandmark: (loc) => {
        setActiveLocationId(loc.id);
        setSelectedLandmark(loc);
        setSelectedBuilding(null);
        soundManager.playInteractSound();
        if (loc.id === 'creator-pavilion') {
          sm.enterCreatorPavilion();
          setViewMode('street');
        }
      },
      onSelectBuilding: (building) => {
        setSelectedBuilding(building);
        soundManager.playInteractSound();
        if (building?.id === 'creator-pavilion') {
          sm.enterCreatorPavilion();
          setViewMode('street');
        }
      },
      onHoverLandmark: (name) => {
        setHoveredLandmark(name);
      },
      onTimeChange: (timeStr, hour, mode) => {
        setFormattedTime(timeStr);
        setTimeOfDay(hour);
        setLightingMode(mode);
      },
      onBuildStateChange: () => {
        if (!sm.construction) return;
        setBudget(sm.construction.getBudget());
        setPlacedCount(sm.construction.getPlacedCount());
        setCanUndo(sm.construction.canUndo());
        setCanRedo(sm.construction.canRedo());
        setGridSnap(sm.construction.isGridSnapEnabled());
        setSelectedCatalogItem(sm.construction.getActiveCatalogItem());
        setValidationStatus(sm.construction.getValidationStatus());
      },
      onBudgetChange: (b) => setBudget(b),
      onSelectCustomObject: (obj) => setSelectedCustomObject(obj),
      onSelectRemotePlayer: (player) => {
        setSelectedRemotePlayer(player);
        soundManager.playInteractSound();
      },
      onDriveStateChange: (driving) => {
        setIsDriving(driving);
      },
      onVehicleSpeedChange: (speed, gear) => {
        setVehicleSpeed(speed);
        setVehicleGear(gear);
      },
      onNearPavilionInteraction: (pt) => {
        setNearPavilionPoint(pt);
      },
      onSelectPavilionPoint: (pt) => {
        setActivePavilionPoint(pt);
        soundManager.playInteractSound();
      },
      onPavilionInsideChange: (inside) => {
        setIsInsidePavilion(inside);
      },
      onNearNPC: (npc) => {
        setNearbyNPC(npc);
      },
      onSelectNPC: (npc) => {
        setActiveNPCModal(npc);
        soundManager.playInteractSound();
        sm.setNPCTalkingState(npc.profile.id, true);
      },
      onNearWorldSpot: (spot) => {
        setNearbySpot(spot);
      },
      onSelectSpot: (spot) => {
        setActiveSpotModal(spot);
        soundManager.playInteractSound();
      },
      onPlayerGestureChange: (gesture) => {
        setPlayerGesture(gesture);
      },
      onLoadingComplete: () => {
        clearInterval(progressTimer);
        setLoadProgress(100);
        setTimeout(() => {
          setIsLoaded(true);

          // Deep-linking support: Check URL query parameters (?district=...) or hash for instant district navigation
          try {
            const urlParams = new URLSearchParams(window.location.search);
            const districtParam = (urlParams.get('district') || window.location.hash.replace('#', '')).toLowerCase();
            if (districtParam) {
              setHeroDismissed(true);

              if (districtParam === 'creator' || districtParam === 'creator-pavilion') {
                sm.enterCreatorPavilion();
                setViewMode('street');
                setIsInsidePavilion(true);
              } else {
                const targetLoc = LOCATIONS.find(
                  (l) => l.id.toLowerCase() === districtParam ||
                         l.id.toLowerCase().replace(/_/g, '-') === districtParam ||
                         l.name.toLowerCase().replace(/\s+/g, '-') === districtParam
                );
                if (targetLoc) {
                  setActiveLocationId(targetLoc.id);
                  setSelectedLandmark(targetLoc);
                  sm.travelToLocation(targetLoc);
                }
              }
            }
          } catch (e) {
            console.warn('District deep-link parsing ignored:', e);
          }
        }, 350);
      },
    });

    sceneManagerRef.current = sm;

    // Apply restored simulation & quality preferences
    sm.setTrafficActive(trafficActive);
    sm.setPedestriansActive(pedestriansActive);
    sm.setEnvironmentAnimationActive(envAnimationActive);
    sm.setSimulationSpeed(simulationSpeed);
    sm.setGraphicsQuality(graphicsQuality);
    sm.setWeather(weatherMode);

    // Sync initial builder state
    setBudget(sm.construction.getBudget());
    setPlacedCount(sm.construction.getPlacedCount());
    setCanUndo(sm.construction.canUndo());
    setCanRedo(sm.construction.canRedo());

    return () => {
      clearInterval(progressTimer);
      sm.dispose();
      sceneManagerRef.current = null;
    };
  }, [hasWebGL]);

  // Handle Lighting Mode changes
  const handleSelectLighting = useCallback((mode: LightingMode) => {
    setLightingMode(mode);
    sceneManagerRef.current?.setLightingMode(mode);
    soundManager.playInteractSound();
  }, []);

  const handleCycleLighting = useCallback(() => {
    const modes: LightingMode[] = ['cyber-night', 'dawn', 'day', 'twilight'];
    const nextIdx = (modes.indexOf(lightingMode) + 1) % modes.length;
    handleSelectLighting(modes[nextIdx]);
  }, [lightingMode, handleSelectLighting]);

  // Handle Automated Day-Night Cycle
  const handleToggleAutoDayNight = useCallback(() => {
    setAutoDayNight((prev) => {
      const next = !prev;
      sceneManagerRef.current?.toggleAutoDayNight(next);
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  const handleSetTimeOfDay = useCallback((hour: number) => {
    setTimeOfDay(hour);
    sceneManagerRef.current?.setTimeOfDay(hour);
  }, []);

  // Handle View Mode Toggle (Aerial Overview vs Street Level Exploration)
  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next: ViewMode = prev === 'aerial' ? 'street' : 'aerial';
      sceneManagerRef.current?.setViewMode(next);
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  // Handle Auto-Orbit
  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setAutoRotate(next);
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  // Handle Audio toggle
  const handleToggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (next) {
        soundManager.start();
      } else {
        soundManager.stop();
      }
      return next;
    });
  }, []);

  // Handle Living Simulation Toggle (Vehicles & Pedestrians)
  const handleToggleSimulation = useCallback(() => {
    setSimulationActive((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setSimulationActive(next);
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  const handleToggleTraffic = useCallback(() => {
    setTrafficActive((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setTrafficActive(next);
      try { localStorage.setItem('3dworld_traffic_active', String(next)); } catch {}
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  const handleTogglePedestrians = useCallback(() => {
    setPedestriansActive((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setPedestriansActive(next);
      try { localStorage.setItem('3dworld_pedestrians_active', String(next)); } catch {}
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  const handleToggleEnvAnimation = useCallback(() => {
    setEnvAnimationActive((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setEnvironmentAnimationActive(next);
      try { localStorage.setItem('3dworld_env_anim_active', String(next)); } catch {}
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  const handleSelectSimulationSpeed = useCallback((speed: SimulationSpeed) => {
    setSimulationSpeed(speed);
    sceneManagerRef.current?.setSimulationSpeed(speed);
    try { localStorage.setItem('3dworld_sim_speed', String(speed)); } catch {}
    soundManager.playInteractSound();
  }, []);

  const handleSelectGraphicsQuality = useCallback((quality: GraphicsQuality) => {
    setGraphicsQuality(quality);
    sceneManagerRef.current?.setGraphicsQuality(quality);
    try { localStorage.setItem('3dworld_graphics_quality', quality); } catch {}
    soundManager.playInteractSound();
  }, []);

  const handleResetSimulation = useCallback(() => {
    sceneManagerRef.current?.resetSimulation();
    soundManager.playInteractSound();
  }, []);

  // Handle Eco Mode Toggle (Low Power / Mobile Battery Saver)
  const handleToggleEcoMode = useCallback(() => {
    setEcoMode((prev) => {
      const next = !prev;
      sceneManagerRef.current?.setEcoMode(next);
      return next;
    });
    soundManager.playInteractSound();
  }, []);

  // Handle Reset View (Returns to wide aerial overview)
  const handleResetView = useCallback(() => {
    sceneManagerRef.current?.resetView();
    setActiveLocationId(null);
    setSelectedLandmark(null);
    setSelectedBuilding(null);
    setViewMode('aerial');
    soundManager.playInteractSound();
  }, []);

  // Handle Location Selection
  const handleSelectLocation = useCallback((loc: LocationData) => {
    setActiveLocationId(loc.id);
    setSelectedLandmark(loc);
    setSelectedBuilding(null);
    sceneManagerRef.current?.travelToLocation(loc);
    soundManager.playInteractSound();
  }, []);

  // Handle Building Selection & Focus
  const handleSelectBuilding = useCallback((building: BuildingInfo) => {
    setSelectedBuilding(building);
    setActiveLocationId(null);
    setSelectedLandmark(null);
    sceneManagerRef.current?.selectBuilding(building);
    soundManager.playInteractSound();
  }, []);

  const handleFocusBuildingStreetLevel = useCallback((building: BuildingInfo) => {
    sceneManagerRef.current?.flyTo(building.cameraPos, building.target, 1.6);
    setViewMode('street');
    soundManager.playInteractSound();
  }, []);

  // Dedicated Creator Experience & 3D Creator Pavilion Navigation
  const handleOpenCreator = useCallback(() => {
    // 1. Capture current world state before entering Creator Studio if outside
    if (!isInsidePavilion && sceneManagerRef.current) {
      const camState = sceneManagerRef.current.getCameraState();
      previousWorldStateRef.current = {
        cameraPos: [camState.position.x, camState.position.y, camState.position.z],
        target: [camState.target.x, camState.target.y, camState.target.z],
        viewMode,
      };
    }

    // 2. Clear ALL popups, building selection, and drawer states so no old popup remains
    setSelectedLandmark(null);
    setSelectedBuilding(null);
    setActiveLocationId(null);
    setActivePavilionPoint(null);
    setIsAboutOpen(false);
    setIsDrawerOpen(false);

    // 3. Smoothly navigate camera directly into Creator Studio interior
    sceneManagerRef.current?.enterCreatorPavilion();
    setViewMode('street');
    setIsInsidePavilion(true);
    setIsPavilionRooftop(false);
    soundManager.playInteractSound();
  }, [isInsidePavilion, viewMode]);

  const handleExitPavilion = useCallback(() => {
    // Clear pavilion-specific states
    setIsInsidePavilion(false);
    setIsPavilionRooftop(false);
    setActivePavilionPoint(null);

    // Restore previous world state without resetting the visitor unnecessarily
    if (previousWorldStateRef.current && sceneManagerRef.current) {
      const prev = previousWorldStateRef.current;
      sceneManagerRef.current.flyTo(prev.cameraPos, prev.target, 1.5);
      setViewMode(prev.viewMode);
      previousWorldStateRef.current = null;
    } else {
      sceneManagerRef.current?.exitCreatorPavilion();
      setViewMode('street');
    }
    soundManager.playInteractSound();
  }, []);

  const handleTogglePavilionRooftop = useCallback(() => {
    if (isPavilionRooftop) {
      sceneManagerRef.current?.teleportPavilionGround();
      setIsPavilionRooftop(false);
    } else {
      sceneManagerRef.current?.teleportPavilionRooftop();
      setIsPavilionRooftop(true);
    }
    soundManager.playInteractSound();
  }, [isPavilionRooftop]);

  const handlePlayerGesture = useCallback((gesture: HumanoidGesture) => {
    setPlayerGesture(gesture);
    sceneManagerRef.current?.setLocalPlayerGesture(gesture);
  }, []);

  // Subscribe to Multiplayer Service updates & Community Shared Builds
  useEffect(() => {
    const unsubPlayers = multiplayerService.onRemotePlayersUpdate((players) => {
      setRemotePlayers(players);
    });

    const unsubChat = multiplayerService.onChatUpdate((msgs) => {
      setChatMessages(msgs);
      if (!isChatOpen && msgs.length > 0) {
        setUnreadChatCount((prev) => prev + 1);
      }
    });

    const unsubBuilds = multiplayerService.onSharedBuildsUpdate((builds) => {
      sceneManagerRef.current?.construction?.syncSharedBuilds(builds);
    });

    return () => {
      unsubPlayers();
      unsubChat();
      unsubBuilds();
    };
  }, [isChatOpen]);

  // Handle Multiplayer Online Actions
  const handleToggleMultiplayer = useCallback(() => {
    setIsMultiplayerModalOpen((prev) => !prev);
    soundManager.playInteractSound();
  }, []);

  const handleJoinedMultiplayer = useCallback((user: MultiplayerUser) => {
    setMultiplayerUser(user);
    setIsMultiplayerActive(true);
    setHeroDismissed(true);
    setSelectedLandmark(null);
    setSelectedBuilding(null);
    setActiveLocationId(null);

    // Spawn 3D avatar in village
    sceneManagerRef.current?.avatars.spawnLocalAvatar(
      user.displayName,
      user.avatarColor,
      user.avatarType
    );
    sceneManagerRef.current?.avatars.setFollowCamera(true);
    setFollowCamera(true);

    // Join online Firestore realm & subscribe to shared builds
    multiplayerService.joinMultiplayerWorld();
    multiplayerService.subscribeToSharedBuilds();
    soundManager.playInteractSound();
  }, []);

  const handleLeaveMultiplayer = useCallback(() => {
    multiplayerService.leaveMultiplayerWorld();
    sceneManagerRef.current?.avatars.removeLocalAvatar();
    sceneManagerRef.current?.avatars.setFollowCamera(false);
    setIsMultiplayerActive(false);
    setMultiplayerUser(null);
    soundManager.playInteractSound();
  }, []);

  const handleToggleFollowCamera = useCallback(() => {
    setFollowCamera((prev) => {
      const next = !prev;
      sceneManagerRef.current?.avatars.setFollowCamera(next);
      soundManager.playInteractSound();
      return next;
    });
  }, []);

  // Handle Construction & Build Mode Actions
  const handleToggleBuildMode = useCallback((override?: boolean) => {
    setIsBuildMode((prev) => {
      const next = override !== undefined ? override : !prev;
      sceneManagerRef.current?.setBuildMode(next);
      if (next) {
        setHeroDismissed(true);
        setSelectedLandmark(null);
        setSelectedBuilding(null);
        setActiveLocationId(null);
      }
      soundManager.playInteractSound();
      return next;
    });
  }, []);

  const handleSelectCatalogItem = useCallback((item: CatalogItem | null) => {
    setSelectedCatalogItem(item);
    sceneManagerRef.current?.construction?.startPlacement(item);
    soundManager.playInteractSound();
  }, []);

  const handleConfirmPlacement = useCallback(() => {
    const res = sceneManagerRef.current?.construction?.confirmPlacement();
    if (res) {
      soundManager.playInteractSound();
    }
  }, []);

  const handleCancelPlacement = useCallback(() => {
    sceneManagerRef.current?.construction?.cancelPlacement();
    setSelectedCatalogItem(null);
    soundManager.playInteractSound();
  }, []);

  const handleRotatePreview = useCallback((deltaDeg: number) => {
    sceneManagerRef.current?.construction?.rotatePreview(deltaDeg);
    soundManager.playInteractSound();
  }, []);

  const handleToggleGridSnap = useCallback(() => {
    const next = sceneManagerRef.current?.construction?.toggleGridSnap();
    if (typeof next === 'boolean') {
      setGridSnap(next);
    }
    soundManager.playInteractSound();
  }, []);

  const handleRotateSelected = useCallback((deltaDeg: number) => {
    sceneManagerRef.current?.construction?.rotateSelected(deltaDeg);
    soundManager.playInteractSound();
  }, []);

  const handleDuplicateSelected = useCallback(() => {
    const dup = sceneManagerRef.current?.construction?.duplicateSelected();
    if (dup) {
      soundManager.playInteractSound();
    }
  }, []);

  const handleDeleteSelected = useCallback(() => {
    const success = sceneManagerRef.current?.construction?.deleteSelected();
    if (success) {
      soundManager.playInteractSound();
    }
  }, []);

  const handleDeselectCustomObject = useCallback(() => {
    sceneManagerRef.current?.construction?.deselectObject();
    setSelectedCustomObject(null);
    soundManager.playInteractSound();
  }, []);

  const handleUndo = useCallback(() => {
    sceneManagerRef.current?.construction?.undo();
    soundManager.playInteractSound();
  }, []);

  const handleRedo = useCallback(() => {
    sceneManagerRef.current?.construction?.redo();
    soundManager.playInteractSound();
  }, []);

  const handleSaveVillage = useCallback((name: string) => {
    if (!sceneManagerRef.current?.construction) return false;
    return sceneManagerRef.current.construction.saveToLocalStorage(name);
  }, []);

  const handleLoadVillage = useCallback(() => {
    if (!sceneManagerRef.current?.construction) {
      return { success: false, error: 'Construction engine not initialized' };
    }
    return sceneManagerRef.current.construction.loadFromLocalStorage();
  }, []);

  const handleResetVillage = useCallback(() => {
    sceneManagerRef.current?.construction?.resetCustomVillage();
    soundManager.playInteractSound();
  }, []);

  // Weather System Selection Handler (Clear, Rain, Snow, Fog)
  const handleSelectWeather = useCallback((mode: WeatherMode) => {
    setWeatherMode(mode);
    sceneManagerRef.current?.setWeather(mode);
    soundManager.setWeatherSound(mode);
    try { localStorage.setItem('3dworld_weather_mode', mode); } catch {}
    soundManager.playInteractSound();
  }, []);

  // Drivable Roadster Toggle Handler
  const handleToggleDrive = useCallback(() => {
    if (isDriving) {
      sceneManagerRef.current?.stopDriving();
    } else {
      sceneManagerRef.current?.startDriving();
    }
    soundManager.playInteractSound();
  }, [isDriving]);

  // Publish structure to Firestore Shared Builds
  const handlePublishToSharedWorld = useCallback(async (obj: CustomPlacedObject): Promise<{ success: boolean; error?: string }> => {
    if (!multiplayerUser) {
      return { success: false, error: 'Must enter Multiplayer World to publish community structures.' };
    }
    try {
      await multiplayerService.publishSharedBuild({
        id: obj.id,
        typeId: obj.typeId,
        position: obj.position,
        rotation: obj.rotation,
        cost: obj.cost,
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to publish to community.' };
    }
  }, [multiplayerUser]);

  // Handle Explore World Button (Cinematic fly-in)
  const handleExploreWorld = useCallback(() => {
    setHeroDismissed(true);
    // Smoothly fly camera into a closer cinematic inspection flyover over Town Center and Central Park
    sceneManagerRef.current?.flyTo([-18, 14, 32], [-8, 2, 0], 2.0);
    soundManager.playInteractSound();
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
        return;
      }

      if (!e || typeof e.key !== 'string') return;

      if (e.key === 'Escape') {
        setSelectedLandmark(null);
        setSelectedBuilding(null);
        setIsDrawerOpen(false);
        setIsAboutOpen(false);
      } else if (e.key.toLowerCase() === 'h' && !isDrawerOpen && !isAboutOpen && !selectedLandmark && !selectedBuilding) {
        setCinemaMode((prev) => !prev);
      } else if (e.key.toLowerCase() === 't' && !isDrawerOpen && !isAboutOpen) {
        setIsDiagnosticsOpen((prev) => !prev);
      } else if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        sceneManagerRef.current?.toggleSpatialDebug();
      } else if (e.key.toLowerCase() === 'b' && !isDrawerOpen && !isAboutOpen) {
        handleToggleBuildMode();
      } else if (e.key.toLowerCase() === 'm' && !isDrawerOpen && !isAboutOpen && !isBuildMode) {
        handleToggleMultiplayer();
      } else if (e.key === ' ' && !isDriving && !isDrawerOpen && !isAboutOpen && !selectedLandmark && !selectedBuilding) {
        e.preventDefault();
        handleToggleAutoRotate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, isAboutOpen, selectedLandmark, selectedBuilding, handleToggleAutoRotate, handleToggleBuildMode, isBuildMode, handleToggleMultiplayer, isDriving]);

  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  const activeLocation = LOCATIONS.find((l) => l.id === activeLocationId) || null;

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-[#060913] select-none text-slate-100">
      {/* 1. Loading Screen */}
      <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />

      {/* 2. Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing outline-none touch-none"
        tabIndex={0}
        aria-label="3DWorld Interactive Viewport"
      />

      {/* 3. Essential Semantic Heading & Content Structure for Search Engines & Screen Readers */}
      <div className="sr-only">
        <h1>3DWorld – Explore an Interactive 3D Virtual World</h1>
        <p>
          Explore 3DWorld, an interactive 3D virtual world featuring floating islands, crystal landscapes, futuristic architecture and immersive environments.
        </p>

        <section id="explore">
          <h2>Explore 3DWorld Modern Village & Living Environment</h2>
          <p>
            Step into a living, real-time 3D universe built with WebGL and Three.js. Explore an expansive modern village landscape featuring residential neighborhoods, landscaped parks, botanical conservatories, a bustling town center, and serene lakeside recreation directly in your web browser.
          </p>
        </section>

        <section id="landmarks-list">
          <h2>Featured Modern Village Districts</h2>
          <article>
            <h3>Town Center</h3>
            <p>Civic plaza, modern library with clock tower, outdoor cafés, bakery, boutique shops, and pedestrian dining terraces.</p>
          </article>
          <article>
            <h3>Residential District</h3>
            <p>Contemporary two-story villas and multi-unit residences with landscaped front gardens, balconies, driveways, and quiet tree-lined avenues.</p>
          </article>
          <article>
            <h3>Central Park</h3>
            <p>Expansive green lawns, grand ornamental tiered water fountain, classic gazebo pavilion, children's playground, and winding promenade trails.</p>
          </article>
          <article>
            <h3>Botanical Garden</h3>
            <p>Steel-framed glass greenhouse conservatory, geometric parterre flower displays, ornamental boxwood topiary, and water lily ponds.</p>
          </article>
          <article>
            <h3>Lake District</h3>
            <p>Scenic freshwater lake bordered by wooden promenades, an arched footbridge, waterfront picnic spots, weeping willows, and panoramic hills.</p>
          </article>
        </section>

        <section id="districts-directory">
          <h2>Explore the 3DWorld Districts</h2>
          <p>
            Explore all seven public regions and architectural zones across 3DWorld:
          </p>
          <ul>
            <li>
              <a href="/rural-village/">Rural Village Guide</a> &ndash; Traditional pastoral farmland, organic wheat crops, and mud-stucco thatched cottages on the western plains.
            </li>
            <li>
              <a href="/modern-village/">Modern Village Guide</a> &ndash; Contemporary sustainable villas, the bustling town center plaza, boutique shopping, and artisan espresso cafes.
            </li>
            <li>
              <a href="/capital-town/">Capital Town Guide</a> &ndash; Metropolitan skyline, high-rise commercial center, central transit terminal, and civic municipal plaza.
            </li>
            <li>
              <a href="/central-park/">Central Park Guide</a> &ndash; Manicured lawns, ornamental tiered water fountain, classical gazebo pavilion, and jogging promenade loops.
            </li>
            <li>
              <a href="/botanical-garden/">Botanical Garden Guide</a> &ndash; Geodesic glass conservatory greenhouse, exotic floral parterres, and animated butterfly swarms.
            </li>
            <li>
              <a href="/lake-district/">Lake District Guide</a> &ndash; Illuminated wooden waterfront boardwalk, arched river footbridges, and scenic lake promenades.
            </li>
            <li>
              <a href="/creator/">About the Creator &ndash; Shahanur Mollah</a> &ndash; Learn about the creator and developer of 3DWorld, technical WebGL architecture, and the 3D Creator Pavilion.
            </li>
          </ul>
        </section>

        <section id="about-info">
          <h2>About 3DWorld Project</h2>
          <p>
            3DWorld is an interactive virtual-world experience created by <a href="/creator/">Shahanur Mollah</a>. Explore imaginative landscapes, floating islands, crystal formations, futuristic architecture, and immersive 3D environments.
          </p>
        </section>

        <footer>
          <p>© 2026 3DWorld. Created by Shahanur Mollah.</p>
        </footer>
      </div>

      {/* 4. Top Navigation Bar */}
      <Navbar
        onHomeClick={() => {
          setHeroDismissed(false);
          handleResetView();
        }}
        onExploreClick={handleExploreWorld}
        onDiscoverClick={() => setIsDrawerOpen(true)}
        onAboutClick={handleOpenCreator}
        onCreatorClick={handleOpenCreator}
        isBuildMode={isBuildMode}
        onToggleBuildMode={() => handleToggleBuildMode()}
        isMultiplayerActive={isMultiplayerActive}
        onToggleMultiplayer={handleToggleMultiplayer}
        multiplayerPlayerCount={remotePlayers.length + 1}
        lightingMode={lightingMode}
        onCycleLighting={handleCycleLighting}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        cinemaMode={cinemaMode}
        onToggleCinema={() => setCinemaMode(!cinemaMode)}
        hoveredLandmark={hoveredLandmark}
        formattedTime={formattedTime}
      />

      {/* 5. Destination Banner (When visiting a specific district) */}
      {!cinemaMode && !isBuildMode && activeLocation && !selectedBuilding && (
        <DestinationBanner
          location={activeLocation}
          onReturnToOverview={handleResetView}
          onSelectNext={(nextLoc) => handleSelectLocation(nextLoc)}
          onClose={() => setActiveLocationId(null)}
          onOpenCreator={handleOpenCreator}
        />
      )}

      {/* Street Exploration Quick Banner (When roaming in Street view) */}
      {!cinemaMode && !isBuildMode && viewMode === 'street' && !activeLocation && !selectedBuilding && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-30 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto max-w-[92vw]">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-cyan-400/40 bg-[#080d19]/90 shadow-2xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shrink-0" />
            <span className="text-xs font-medium text-slate-200 truncate">
              Street Exploration • Drag / WASD to Roam
            </span>
            <button
              onClick={handleToggleViewMode}
              className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500 hover:text-white border border-cyan-400/40 transition-all cursor-pointer whitespace-nowrap"
              aria-label="Return to Aerial Overview"
            >
              Return to Aerial
            </button>
          </div>
        </div>
      )}

      {/* 5b. Interactive World Navigation Minimap (Three Districts & GPS Tracking) */}
      {!cinemaMode && !isBuildMode && (
        <WorldMinimap
          getNavPositions={() => sceneManagerRef.current?.getNavPositions()}
          onFastTravel={(district) => {
            if (district === 'rural') {
              sceneManagerRef.current?.flyTo([-110, 35, 45], [-110, 0, 0], 1.8);
            } else if (district === 'modern') {
              sceneManagerRef.current?.flyTo([-5, 45, 55], [-5, 0, 0], 1.8);
            } else if (district === 'capital') {
              sceneManagerRef.current?.flyTo([105, 65, 75], [105, 0, 0], 1.8);
            }
          }}
          cinemaMode={cinemaMode}
        />
      )}

      {/* 6. Hero Intro Overlay (Full-screen hero presentation) */}
      {!cinemaMode && !isBuildMode && !isMultiplayerActive && (
        <HeroOverlay
          onExploreWorld={handleExploreWorld}
          onDiscoverLocations={() => setIsDrawerOpen(true)}
          onSelectLocation={handleSelectLocation}
          isDismissed={heroDismissed}
          onDismiss={() => setHeroDismissed(true)}
        />
      )}

      {/* 7. Clickable Building Information Card */}
      {!cinemaMode && !isBuildMode && !isInsidePavilion && (
        <BuildingInfoCard
          building={selectedBuilding}
          onClose={() => {
            setSelectedBuilding(null);
            sceneManagerRef.current?.selectBuilding(null);
          }}
          onFocusStreetLevel={handleFocusBuildingStreetLevel}
          onReturnToOverview={handleResetView}
          onOpenCreator={handleOpenCreator}
        />
      )}

      {/* 8a. Collapsible Bottom Control Dock (Exploration & Simulation HUD) */}
      {!cinemaMode && !isBuildMode && !isDriving && (
        <BottomControlDock
          onResetView={handleResetView}
          autoRotate={autoRotate}
          onToggleAutoRotate={handleToggleAutoRotate}
          lightingMode={lightingMode}
          onSelectLighting={handleSelectLighting}
          weatherMode={weatherMode}
          onSelectWeather={handleSelectWeather}
          isDriving={isDriving}
          onToggleDrive={handleToggleDrive}
          activeLocationId={activeLocationId}
          onSelectLocation={handleSelectLocation}
          soundEnabled={soundEnabled}
          onToggleSound={handleToggleSound}
          onOpenDiscover={() => setIsDrawerOpen(true)}
          viewMode={viewMode}
          onToggleViewMode={handleToggleViewMode}
          isBuildMode={isBuildMode}
          onToggleBuildMode={() => handleToggleBuildMode()}
          isMultiplayerActive={isMultiplayerActive}
          onToggleMultiplayer={handleToggleMultiplayer}
          multiplayerPlayerCount={remotePlayers.length + 1}
          simulationActive={simulationActive}
          onToggleSimulation={handleToggleSimulation}
          trafficActive={trafficActive}
          onToggleTraffic={handleToggleTraffic}
          pedestriansActive={pedestriansActive}
          onTogglePedestrians={handleTogglePedestrians}
          envAnimationActive={envAnimationActive}
          onToggleEnvAnimation={handleToggleEnvAnimation}
          simulationSpeed={simulationSpeed}
          onSelectSimulationSpeed={handleSelectSimulationSpeed}
          graphicsQuality={graphicsQuality}
          onSelectGraphicsQuality={handleSelectGraphicsQuality}
          onResetSimulation={handleResetSimulation}
          ecoMode={ecoMode}
          onToggleEcoMode={handleToggleEcoMode}
          timeOfDay={timeOfDay}
          formattedTime={formattedTime}
          autoDayNight={autoDayNight}
          onToggleAutoDayNight={handleToggleAutoDayNight}
          onSetTimeOfDay={handleSetTimeOfDay}
        />
      )}

      {/* 8b. Interactive Village Builder Construction Toolbar */}
      {!cinemaMode && isBuildMode && (
        <BuildToolbar
          activeItem={selectedCatalogItem}
          onSelectItem={handleSelectCatalogItem}
          onConfirmPlacement={handleConfirmPlacement}
          onCancelPlacement={handleCancelPlacement}
          onRotatePreview={handleRotatePreview}
          gridSnap={gridSnap}
          onToggleGridSnap={handleToggleGridSnap}
          validationStatus={validationStatus}
          selectedObject={selectedCustomObject}
          onRotateSelected={handleRotateSelected}
          onDuplicateSelected={handleDuplicateSelected}
          onDeleteSelected={handleDeleteSelected}
          onDeselectObject={handleDeselectCustomObject}
          budget={budget}
          placedCount={placedCount}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onSaveVillage={handleSaveVillage}
          onLoadVillage={handleLoadVillage}
          onResetVillage={handleResetVillage}
          onExitBuildMode={() => handleToggleBuildMode(false)}
          isMultiplayerActive={isMultiplayerActive}
          onPublishToSharedWorld={handlePublishToSharedWorld}
        />
      )}

      {/* 8c. Multiplayer HUD & Real-time Controls */}
      {!cinemaMode && isMultiplayerActive && multiplayerUser && (
        <>
          <MultiplayerHUD
            user={multiplayerUser}
            remotePlayers={remotePlayers}
            followCamera={followCamera}
            onToggleFollowCamera={handleToggleFollowCamera}
            isChatOpen={isChatOpen}
            onToggleChat={() => {
              setIsChatOpen(!isChatOpen);
              if (!isChatOpen) setUnreadChatCount(0);
            }}
            unreadChatCount={unreadChatCount}
            onLeaveMultiplayer={handleLeaveMultiplayer}
            onSelectPlayer={(p) => setSelectedRemotePlayer(p)}
            currentSpeed={avatarCurrentSpeed}
            speedMultiplier={movementSpeedMultiplier}
            sensitivityMultiplier={lookSensitivityMultiplier}
            onUpdateMovementSettings={(speedMult, sensMult) => {
              setMovementSpeedMultiplier(speedMult);
              setLookSensitivityMultiplier(sensMult);
              sceneManagerRef.current?.avatars?.setMovementSettings(speedMult, sensMult);
            }}
          />

          <MultiplayerChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatMessages}
            currentUserId={multiplayerUser.uid}
          />

          {!isDriving && (
            <VirtualJoystick
              onMove={(forward, strafe) => {
                sceneManagerRef.current?.avatars.setTouchJoystickInput(forward, strafe);
              }}
              onLook={(dx, dy) => {
                sceneManagerRef.current?.avatars.setTouchLookDelta(dx, dy);
              }}
              onJump={() => {
                sceneManagerRef.current?.avatars.triggerJump();
              }}
              onSprintToggle={() => {
                sceneManagerRef.current?.avatars.toggleSprint();
              }}
              onCenterCamera={() => {
                sceneManagerRef.current?.avatars.centerCamera();
              }}
            />
          )}
        </>
      )}

      {/* 8d. Electric Roadster Driving HUD & Touch Controls */}
      {!cinemaMode && isDriving && (
        <>
          <VehicleDashboard
            speedKmh={vehicleSpeed}
            gear={vehicleGear}
            onExit={handleToggleDrive}
            onToggleDiagnostics={() => setIsDiagnosticsOpen((prev) => !prev)}
            isDiagnosticsOpen={isDiagnosticsOpen}
            onReset={() => sceneManagerRef.current?.resetVehicle()}
            onThrottle={(v) => sceneManagerRef.current?.vehicle.setThrottle(v)}
            onSteer={(v) => sceneManagerRef.current?.vehicle.setSteer(v)}
            onBrake={(b) => sceneManagerRef.current?.vehicle.setBrake(b)}
          />
          <VirtualJoystick
            onMove={(forward, strafe) => {
              sceneManagerRef.current?.vehicle.setThrottle(forward);
              sceneManagerRef.current?.vehicle.setSteer(strafe);
            }}
          />
        </>
      )}

      {/* Live Vehicle Telemetry & Collision Diagnostic Panel */}
      <DrivingDiagnosticPanel
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        getDiagnostics={() => sceneManagerRef.current?.getVehicleDiagnostics()}
        onResetVehicle={() => sceneManagerRef.current?.resetVehicle()}
        onExitVehicle={handleToggleDrive}
        onToggleSpatialDebug={() => sceneManagerRef.current?.toggleSpatialDebug() ?? false}
        getSpatialDebugVisible={() => sceneManagerRef.current?.getSpatialDebugVisible() ?? false}
        getSpatialAuditReport={() => sceneManagerRef.current?.getSpatialAuditReport() ?? null}
      />

      {/* Multiplayer Entrance Dialog */}
      <MultiplayerModal
        isOpen={isMultiplayerModalOpen}
        onClose={() => setIsMultiplayerModalOpen(false)}
        onJoined={handleJoinedMultiplayer}
      />

      {/* Selected Remote Player Profile Card */}
      <PlayerProfileModal
        player={selectedRemotePlayer}
        onClose={() => setSelectedRemotePlayer(null)}
      />

      {/* 9. Discover & Search Destinations Slide-out Drawer */}
      <LocationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeLocationId={activeLocationId}
        activeBuildingId={selectedBuilding?.id}
        onSelectLocation={handleSelectLocation}
        onSelectBuilding={handleSelectBuilding}
      />

      {/* 10. Landmark Detail Modal (upon clicking a 3D beacon or selecting from drawer) */}
      {!isInsidePavilion && (
        <LandmarkDetailModal
          landmark={selectedLandmark}
          onClose={() => setSelectedLandmark(null)}
          onSelectNext={(nextLoc) => handleSelectLocation(nextLoc)}
          onFocusCamera={(loc) => sceneManagerRef.current?.travelToLocation(loc)}
          onOpenCreator={handleOpenCreator}
        />
      )}

      {/* 11. Explorable Creator Pavilion HUD & Proximity Inspection */}
      <PavilionHUD
        isInside={isInsidePavilion}
        nearPoint={nearPavilionPoint}
        onOpenPoint={(pt) => {
          setActivePavilionPoint(pt);
          soundManager.playInteractSound();
        }}
        onExitPavilion={handleExitPavilion}
        onToggleRooftop={handleTogglePavilionRooftop}
        isRooftop={isPavilionRooftop}
      />

      {/* 12. Pavilion Exhibit Interactive Detail Panel */}
      <PavilionInteractionModal
        point={activePavilionPoint}
        isOpen={!!activePavilionPoint}
        onClose={() => setActivePavilionPoint(null)}
        onTeleportRooftop={() => {
          sceneManagerRef.current?.teleportPavilionRooftop();
          setIsPavilionRooftop(true);
        }}
        onTeleportGround={() => {
          sceneManagerRef.current?.teleportPavilionGround();
          setIsPavilionRooftop(false);
        }}
        onExitPavilion={handleExitPavilion}
        isRooftopActive={isPavilionRooftop}
      />

      {/* 13. About 3DWorld Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
        initialTab={aboutInitialTab}
      />

      {/* 14. Living Universe Interaction Prompt (Unobtrusive Floating Action Pill) */}
      {!isInsidePavilion && !activeNPCModal && !activeSpotModal && (
        <WorldInteractionPrompt
          nearbyNPC={nearbyNPC}
          nearbySpot={nearbySpot}
          onInteractNPC={(npc) => {
            setActiveNPCModal(npc);
            soundManager.playInteractSound();
            sceneManagerRef.current?.setNPCTalkingState(npc.profile.id, true);
          }}
          onInteractSpot={(spot) => {
            setActiveSpotModal(spot);
            soundManager.playInteractSound();
          }}
        />
      )}

      {/* 15. Player Character Gesture Toolbar (Collapsible) */}
      {!isInsidePavilion && (
        <GestureToolbar
          currentGesture={playerGesture}
          onSelectGesture={handlePlayerGesture}
          isDriving={isDriving}
        />
      )}

      {/* 16. NPC Conversation & Schedule Dialog */}
      <NPCInteractionModal
        npc={activeNPCModal}
        onClose={() => {
          if (activeNPCModal) {
            sceneManagerRef.current?.setNPCTalkingState(activeNPCModal.profile.id, false);
          }
          setActiveNPCModal(null);
        }}
        onPerformPlayerGesture={handlePlayerGesture}
      />

      {/* 17. Contextual World Spot Interaction Modal */}
      <ContextualLocationModal
        spot={activeSpotModal}
        onClose={() => setActiveSpotModal(null)}
        onPerformPlayerGesture={handlePlayerGesture}
      />

      {/* 12. Persistent Footer Credit (Zero Dock Overlap) */}
      <Footer
        cinemaMode={cinemaMode}
        onOpenCreator={handleOpenCreator}
      />
    </main>
  );
}
