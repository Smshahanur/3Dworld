/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './world/sceneManager';
import { LightingMode, LOCATIONS, LocationData, BuildingInfo, ViewMode, BUILDINGS } from './types';
import { soundManager } from './utils/audio';
import { Navbar } from './components/Navbar';
import { HeroOverlay } from './components/HeroOverlay';
import { LocationDrawer } from './components/LocationDrawer';
import { LandmarkDetailModal } from './components/LandmarkDetailModal';
import { BuildingInfoCard } from './components/BuildingInfoCard';
import { DestinationBanner } from './components/DestinationBanner';
import { BottomControlDock } from './components/BottomControlDock';
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

  // World States
  const [lightingMode, setLightingMode] = useState<LightingMode>('day');
  const [viewMode, setViewMode] = useState<ViewMode>('aerial');
  const [autoRotate, setAutoRotate] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [simulationActive, setSimulationActive] = useState(true);
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
      onLoadingComplete: () => {
        clearInterval(progressTimer);
        setLoadProgress(100);
        setTimeout(() => {
          setIsLoaded(true);
        }, 350);
      },
    });

    sceneManagerRef.current = sm;

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
      if (e.key === 'Escape') {
        setSelectedLandmark(null);
        setSelectedBuilding(null);
        setIsDrawerOpen(false);
        setIsAboutOpen(false);
      } else if (e.key.toLowerCase() === 'h' && !isDrawerOpen && !isAboutOpen && !selectedLandmark && !selectedBuilding) {
        setCinemaMode((prev) => !prev);
      } else if (e.key === ' ' && !isDrawerOpen && !isAboutOpen && !selectedLandmark && !selectedBuilding) {
        e.preventDefault();
        handleToggleAutoRotate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, isAboutOpen, selectedLandmark, selectedBuilding, handleToggleAutoRotate]);

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
      {!cinemaMode && activeLocation && !selectedBuilding && (
        <DestinationBanner
          location={activeLocation}
          onReturnToOverview={handleResetView}
          onSelectNext={(nextLoc) => handleSelectLocation(nextLoc)}
          onClose={() => setActiveLocationId(null)}
        />
      )}

      {/* 6. Hero Intro Overlay (Full-screen hero presentation) */}
      {!cinemaMode && (
        <HeroOverlay
          onExploreWorld={handleExploreWorld}
          onDiscoverLocations={() => setIsDrawerOpen(true)}
          onSelectLocation={handleSelectLocation}
          isDismissed={heroDismissed}
          onDismiss={() => setHeroDismissed(true)}
        />
      )}

      {/* 7. Clickable Building Information Card */}
      {!cinemaMode && (
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

      {/* 8. Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      {!cinemaMode && (
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
          simulationActive={simulationActive}
          onToggleSimulation={handleToggleSimulation}
          ecoMode={ecoMode}
          onToggleEcoMode={handleToggleEcoMode}
          timeOfDay={timeOfDay}
          formattedTime={formattedTime}
          autoDayNight={autoDayNight}
          onToggleAutoDayNight={handleToggleAutoDayNight}
          onSetTimeOfDay={handleSetTimeOfDay}
        />
      )}

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
