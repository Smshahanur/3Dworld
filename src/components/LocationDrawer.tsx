import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Sparkles,
  MapPin,
  ChevronRight,
  Building2,
  Compass,
  Check,
} from 'lucide-react';
import { LOCATIONS, LocationData, BUILDINGS, BuildingInfo } from '../types';

interface LocationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeLocationId: string | null;
  activeBuildingId?: string | null;
  onSelectLocation: (location: LocationData) => void;
  onSelectBuilding: (building: BuildingInfo) => void;
}

type FilterCategory = 'all' | 'districts' | 'civic' | 'commercial' | 'residential' | 'parks';

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  isOpen,
  onClose,
  activeLocationId,
  activeBuildingId,
  onSelectLocation,
  onSelectBuilding,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');

  // Filtered districts
  const filteredDistricts = useMemo(() => {
    if (activeCategory !== 'all' && activeCategory !== 'districts') return [];
    const q = searchQuery.toLowerCase().trim();
    if (!q) return LOCATIONS;
    return LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.subtitle.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q) ||
        loc.tag.toLowerCase().includes(q)
    );
  }, [searchQuery, activeCategory]);

  // Filtered buildings
  const filteredBuildings = useMemo(() => {
    if (activeCategory === 'districts') return [];
    const q = searchQuery.toLowerCase().trim();

    return BUILDINGS.filter((b) => {
      // Category match
      if (activeCategory === 'civic' && b.category !== 'civic') return false;
      if (activeCategory === 'commercial' && b.category !== 'commercial') return false;
      if (activeCategory === 'residential' && b.category !== 'residential') return false;
      if (activeCategory === 'parks' && b.category !== 'park' && b.category !== 'nature') return false;

      // Text query match
      if (!q) return true;
      return (
        b.name.toLowerCase().includes(q) ||
        b.type.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        b.description.toLowerCase().includes(q) ||
        b.features?.some((f) => f.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const totalResults = filteredDistricts.length + filteredBuildings.length;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end animate-in fade-in duration-200">
      {/* Backdrop (clickable to dismiss) */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/50 pointer-events-auto transition-opacity"
      />

      {/* Slide-out Panel */}
      <aside
        id="landmarks"
        aria-labelledby="landmarks-title"
        className="relative pointer-events-auto w-full max-w-lg h-full bg-[#080d19]/96 border-l border-white/10 shadow-2xl flex flex-col p-4 sm:p-6 overflow-hidden"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h2 id="landmarks-title" className="font-display font-bold text-lg text-white">
                Explore Destinations & Buildings
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Search and filter across modern village districts and public facilities.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Destinations Drawer"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="mt-3.5 relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search school, clinic, café, park, villa..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 no-scrollbar">
          {[
            { id: 'all', label: 'All Places' },
            { id: 'districts', label: '5 Districts' },
            { id: 'civic', label: 'Civic & Medical' },
            { id: 'commercial', label: 'Shops & Cafés' },
            { id: 'residential', label: 'Residential' },
            { id: 'parks', label: 'Parks & Nature' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as FilterCategory)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/50'
                  : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-slate-200 border border-white/5'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results Counter */}
        <div className="text-[10px] font-mono text-slate-400 pb-2 flex items-center justify-between">
          <span>{totalResults} Destinations Found</span>
          {searchQuery && <span className="text-cyan-400">Filtering by "{searchQuery}"</span>}
        </div>

        {/* Scrollable Destination & Building Cards */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {/* 1. Districts Section */}
          {filteredDistricts.length > 0 && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                <Compass className="w-3 h-3 text-cyan-400" />
                <span>Major Village Districts</span>
              </div>
              <div className="space-y-2">
                {filteredDistricts.map((loc) => {
                  const isActive = activeLocationId === loc.id;
                  return (
                    <article
                      key={loc.id}
                      onClick={() => {
                        onSelectLocation(loc);
                        onClose();
                      }}
                      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: loc.ambientColor }}
                          />
                          <h3 className="font-display font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {loc.name}
                          </h3>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                          {loc.tag}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2">
                        {loc.description}
                      </p>
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                        <span className="text-slate-400 font-mono text-[10px]">{loc.altitude}</span>
                        <div className="flex items-center gap-1 font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Navigate District</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Interactive Buildings Section */}
          {filteredBuildings.length > 0 && (
            <div className="pt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 mb-2 flex items-center gap-1.5">
                <Building2 className="w-3 h-3 text-cyan-400" />
                <span>Interactive Buildings & Public Amenities</span>
              </div>
              <div className="space-y-2">
                {filteredBuildings.map((b) => {
                  const isActive = activeBuildingId === b.id;
                  return (
                    <article
                      key={b.id}
                      onClick={() => {
                        onSelectBuilding(b);
                        onClose();
                      }}
                      className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-cyan-950/50 border-cyan-400 shadow-md shadow-cyan-500/10'
                          : 'bg-white/[0.03] border-white/10 hover:border-cyan-500/40 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <div className="text-[10px] font-mono text-cyan-400 uppercase tracking-wide">
                            {b.type}
                          </div>
                          <h4 className="font-display font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                            {b.name}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 shrink-0">
                          {b.district}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed mb-2">
                        {b.description}
                      </p>
                      {/* Features mini pills */}
                      {b.features && b.features.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {b.features.slice(0, 2).map((feat, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-500/20"
                            >
                              {feat}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-white/5">
                        <span className="text-slate-400 font-mono text-[10px]">Clickable 3D Landmark</span>
                        <div className="flex items-center gap-1 font-semibold text-cyan-400 group-hover:translate-x-0.5 transition-transform">
                          <span>Focus Camera</span>
                          <ChevronRight className="w-3 h-3" />
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          )}

          {totalResults === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <Sparkles className="w-8 h-8 text-cyan-400/60 mx-auto mb-2" />
              <p>No destinations found matching "{searchQuery}"</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 px-3 py-1.5 rounded-lg bg-cyan-600/30 text-cyan-300 text-xs hover:bg-cyan-600/50 cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Click any building directly in 3D to open its info card</span>
          </div>
        </div>
      </aside>
    </div>
  );
};
