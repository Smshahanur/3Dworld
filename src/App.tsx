/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from './world/sceneManager';
import { LightingMode, LOCATIONS, LocationData } from './types';
import { soundManager } from './utils/audio';
import { Navbar } from './components/Navbar';
import { HeroOverlay } from './components/HeroOverlay';
import { LocationDrawer } from './components/LocationDrawer';
import { LandmarkDetailModal } from './components/LandmarkDetailModal';
import { BottomControlDock } from './components/BottomControlDock';
import { AboutModal } from './components/AboutModal';
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
  const [lightingMode, setLightingMode] = useState<LightingMode>('cyber-night');
  const [autoRotate, setAutoRotate] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [selectedLandmark, setSelectedLandmark] = useState<LocationData | null>(null);
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
        soundManager.playInteractSound();
      },
      onHoverLandmark: (name) => {
        setHoveredLandmark(name);
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

  // Handle Reset View
  const handleResetView = useCallback(() => {
    sceneManagerRef.current?.resetView();
    setActiveLocationId(null);
    setSelectedLandmark(null);
    soundManager.playInteractSound();
  }, []);

  // Handle Location Selection
  const handleSelectLocation = useCallback((loc: LocationData) => {
    setActiveLocationId(loc.id);
    setSelectedLandmark(loc);
    sceneManagerRef.current?.travelToLocation(loc);
    soundManager.playInteractSound();
  }, []);

  // Handle Explore World Button (Cinematic fly-in)
  const handleExploreWorld = useCallback(() => {
    setHeroDismissed(true);
    // Smoothly fly camera into a closer cinematic inspection flyover
    sceneManagerRef.current?.flyTo([18, 14, 28], [0, 2.5, 0], 2.0);
    soundManager.playInteractSound();
  }, []);

  // Keyboard accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedLandmark(null);
        setIsDrawerOpen(false);
        setIsAboutOpen(false);
      } else if (e.key.toLowerCase() === 'h' && !isDrawerOpen && !isAboutOpen && !selectedLandmark) {
        setCinemaMode((prev) => !prev);
      } else if (e.key === ' ' && !isDrawerOpen && !isAboutOpen && !selectedLandmark) {
        e.preventDefault();
        handleToggleAutoRotate();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, isAboutOpen, selectedLandmark, handleToggleAutoRotate]);

  if (!hasWebGL) {
    return <WebGLFallback />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#060913] select-none text-slate-100">
      {/* 1. Loading Screen */}
      <LoadingScreen progress={loadProgress} isLoaded={isLoaded} />

      {/* 2. Isolated WebGL Canvas Container */}
      <div
        ref={mountRef}
        className="absolute inset-0 z-0 w-full h-full cursor-grab active:cursor-grabbing outline-none"
        tabIndex={0}
        aria-label="3DWorld Interactive Viewport"
      />

      {/* 3. Essential Semantic Heading for Screen Readers and SEO outside WebGL */}
      <div className="sr-only">
        <h1>3DWorld - Explore an Interactive 3D Universe</h1>
        <p>
          Welcome to 3DWorld, an interactive floating island archipelago in virtual 3D.
          Locations include Crystal Valley, Sky Temple, Aurora Forest, Cloud City, and The Central Portal.
        </p>
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
      />

      {/* 5. Hero Intro Overlay (Full-screen hero presentation) */}
      {!cinemaMode && (
        <HeroOverlay
          onExploreWorld={handleExploreWorld}
          onDiscoverLocations={() => setIsDrawerOpen(true)}
          onSelectLocation={handleSelectLocation}
          isDismissed={heroDismissed}
          onDismiss={() => setHeroDismissed(true)}
        />
      )}

      {/* 6. Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
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
        />
      )}

      {/* 7. Discover Locations Slide-out Drawer */}
      <LocationDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeLocationId={activeLocationId}
        onSelectLocation={handleSelectLocation}
      />

      {/* 8. Landmark Detail Modal (upon clicking a 3D beacon or selecting from drawer) */}
      <LandmarkDetailModal
        landmark={selectedLandmark}
        onClose={() => setSelectedLandmark(null)}
        onSelectNext={(nextLoc) => handleSelectLocation(nextLoc)}
        onFocusCamera={(loc) => sceneManagerRef.current?.travelToLocation(loc)}
      />

      {/* 9. About 3DWorld Modal */}
      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}
