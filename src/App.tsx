/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './world/sceneManager';
import { LightingMode, LOCATIONS, LocationData, BuildingInfo, ViewMode, BUILDINGS, GraphicsQuality, SimulationSpeed } from './types';
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
import { multiplayerService } from './multiplayer/multiplayerService';
import { PlayerData, ChatMessage, MultiplayerUser } from './multiplayer/types';
import { AboutModal } from './components/AboutModal';
import { Footer } from './components/Footer';
import { LoadingScreen } from './components/LoadingScreen';
import { WebGLFallback } from './components/WebGLFallback';

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
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<LocationData | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingInfo | null>(null);
  const [hoveredLandmark, setHoveredLandmark] = useState<string | null>(null);

  // Modals & Panels
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);

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
      },
      onSelectBuilding: (building) => {
        setSelectedBuilding(building);
        soundManager.playInteractSound();
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
      onLoadingComplete: () => {
        clearInterval(progressTimer);
        setLoadProgress(100);
        setTimeout(() => {
          setIsLoaded(true);
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

  // Subscribe to Multiplayer Service updates
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

    return () => {
      unsubPlayers();
      unsubChat();
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

    // Join online Firestore realm
    multiplayerService.joinMultiplayerWorld();
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
      } else if (e.key.toLowerCase() === 'b' && !isDrawerOpen && !isAboutOpen) {
        handleToggleBuildMode();
      } else if (e.key.toLowerCase() === 'm' && !isDrawerOpen && !isAboutOpen && !isBuildMode) {
        handleToggleMultiplayer();
      } else if (e.key === ' ' && !isDrawerOpen && !isAboutOpen && !selectedLandmark && !selectedBuilding) {
        e.preventDefault();
        handleToggleAutoRotate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, isAboutOpen, selectedLandmark, selectedBuilding, handleToggleAutoRotate, handleToggleBuildMode, isBuildMode, handleToggleMultiplayer]);

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

        <section id="about-info">
          <h2>About 3DWorld Project</h2>
          <p>
            3DWorld is an interactive virtual-world experience created by Shahanur Mollah. Explore imaginative landscapes, floating islands, crystal formations, futuristic architecture, and immersive 3D environments.
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
        onAboutClick={() => setIsAboutOpen(true)}
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
      {!cinemaMode && !isBuildMode && (
        <BuildingInfoCard
          building={selectedBuilding}
          onClose={() => {
            setSelectedBuilding(null);
            sceneManagerRef.current?.selectBuilding(null);
          }}
          onFocusStreetLevel={handleFocusBuildingStreetLevel}
          onReturnToOverview={handleResetView}
        />
      )}

      {/* 8a. Collapsible Bottom Control Dock (Exploration & Simulation HUD) */}
      {!cinemaMode && !isBuildMode && (
        <BottomControlDock
          onResetView={handleResetView}
          autoRotate={autoRotate}
          onToggleAutoRotate={handleToggleAutoRotate}
          lightingMode={lightingMode}
          onSelectLighting={handleSelectLighting}
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
          />

          <MultiplayerChat
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatMessages}
            currentUserId={multiplayerUser.uid}
          />

          <VirtualJoystick
            onMove={(forward, strafe) => {
              sceneManagerRef.current?.avatars.setTouchJoystickInput(forward, strafe);
            }}
          />
        </>
      )}

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
      <LandmarkDetailModal
        landmark={selectedLandmark}
        onClose={() => setSelectedLandmark(null)}
        onSelectNext={(nextLoc) => handleSelectLocation(nextLoc)}
        onFocusCamera={(loc) => sceneManagerRef.current?.travelToLocation(loc)}
      />

      {/* 11. About 3DWorld Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      {/* 12. Persistent Footer Credit (Zero Dock Overlap) */}
      <Footer cinemaMode={cinemaMode} />
    </main>
  );
}
