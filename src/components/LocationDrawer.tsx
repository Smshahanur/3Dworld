import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  ChevronRight,
  Compass,
  Building2,
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

type DestinationCategoryId =
  | 'all'
  | 'rural-village'
  | 'modern-village'
  | 'capital-town'
  | 'central-park'
  | 'botanical-garden'
  | 'lake-district'
  | 'residential'
  | 'creator-pavilion';

interface CategoryGroup {
  id: Exclude<DestinationCategoryId, 'all'>;
  label: string;
  subtitle: string;
  locationIds: LocationData['id'][];
  buildingDistrictIds: BuildingInfo['districtId'][];
}

const DESTINATION_CATEGORIES: CategoryGroup[] = [
  {
    id: 'rural-village',
    label: 'Rural Village',
    subtitle: 'Traditional pastoral farmland, cottages & village life',
    locationIds: ['rural-village'],
    buildingDistrictIds: ['rural-village'],
  },
  {
    id: 'modern-village',
    label: 'Modern Village',
    subtitle: 'Town Center civic plaza, cafes, shops & avenues',
    locationIds: ['town-center'],
    buildingDistrictIds: ['town-center'],
  },
  {
    id: 'capital-town',
    label: 'Capital Town',
    subtitle: 'Metropolitan skyscrapers, Civic Plaza & transit hub',
    locationIds: ['capital-town', 'capital-plaza'],
    buildingDistrictIds: ['capital-town', 'capital-plaza'],
  },
  {
    id: 'central-park',
    label: 'Central Park',
    subtitle: 'Grand tiered fountain, gazebo & recreation lawns',
    locationIds: ['central-park'],
    buildingDistrictIds: ['central-park'],
  },
  {
    id: 'botanical-garden',
    label: 'Botanical Garden',
    subtitle: 'Glass conservatory greenhouse & floral parterres',
    locationIds: ['botanical-garden'],
    buildingDistrictIds: ['botanical-garden'],
  },
  {
    id: 'lake-district',
    label: 'Lake District',
    subtitle: 'Freshwater shoreline, marina boardwalk & footbridges',
    locationIds: ['lake-district'],
    buildingDistrictIds: ['lake-district'],
  },
  {
    id: 'residential',
    label: 'Residential District',
    subtitle: 'Contemporary cedar & slate villas and townhouses',
    locationIds: ['residential'],
    buildingDistrictIds: ['residential'],
  },
  {
    id: 'creator-pavilion',
    label: 'Creator Pavilion',
    subtitle: 'Interactive 3D Studio of Shahanur Mollah',
    locationIds: ['creator-pavilion'],
    buildingDistrictIds: ['creator-pavilion'],
  },
];

export const LocationDrawer: React.FC<LocationDrawerProps> = ({
  isOpen,
  onClose,
  activeLocationId,
  activeBuildingId,
  onSelectLocation,
  onSelectBuilding,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<DestinationCategoryId>('all');

  const groupedDestinations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return DESTINATION_CATEGORIES.filter(
      (cat) => activeCategory === 'all' || cat.id === activeCategory
    )
      .map((cat) => {
        const locations = LOCATIONS.filter((loc) => {
          if (!cat.locationIds.includes(loc.id)) return false;
          if (!q) return true;
          return (
            cat.label.toLowerCase().includes(q) ||
            loc.name.toLowerCase().includes(q) ||
            loc.subtitle.toLowerCase().includes(q) ||
            loc.description.toLowerCase().includes(q)
          );
        });

        const buildings = BUILDINGS.filter((b) => {
          if (!cat.buildingDistrictIds.includes(b.districtId)) return false;
          if (!q) return true;
          return (
            cat.label.toLowerCase().includes(q) ||
            b.name.toLowerCase().includes(q) ||
            b.type.toLowerCase().includes(q) ||
            b.district.toLowerCase().includes(q) ||
            b.description.toLowerCase().includes(q)
          );
        });

        return {
          ...cat,
          locations,
          buildings,
        };
      })
      .filter((group) => group.locations.length > 0 || group.buildings.length > 0);
  }, [searchQuery, activeCategory]);

  if (!isOpen) return null;

  const totalMatches = groupedDestinations.reduce(
    (sum, g) => sum + g.locations.length + g.buildings.length,
    0
  );

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className="absolute inset-0 bg-black/55 backdrop-blur-[2px] pointer-events-auto transition-opacity"
      />

      {/* Slide-out Discover Locations Panel */}
      <aside
        id="landmarks"
        role="dialog"
        aria-modal="true"
        aria-labelledby="landmarks-title"
        className="relative pointer-events-auto w-full max-w-lg h-full bg-[#071022]/98 border-l border-white/10 shadow-2xl flex flex-col p-4 sm:p-6 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400 shrink-0" />
              <h2 id="landmarks-title" className="font-display font-bold text-lg text-white">
                Discover Locations
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Choose any district or landmark to travel directly across 3DWorld.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close Discover Locations"
            className="w-9 h-9 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input */}
        <div className="mt-4 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search districts, parks, cafes, villas..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/60 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 8 Destination Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-3 no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              activeCategory === 'all'
                ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
            }`}
          >
            All Categories
          </button>
          {DESTINATION_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-400/50'
                    : 'bg-white/[0.04] text-slate-300 hover:bg-white/[0.08] border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Organized Destinations */}
        <div className="flex-1 overflow-y-auto space-y-5 pr-1 pb-2">
          {groupedDestinations.map((group) => (
            <section key={group.id} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2 pb-1.5 border-b border-white/10">
                <div>
                  <h3 className="font-display font-semibold text-sm text-white">
                    {group.label}
                  </h3>
                  <p className="text-[11px] text-slate-400">{group.subtitle}</p>
                </div>
                <span className="text-[11px] text-slate-400 tabular-nums shrink-0">
                  {group.locations.length + group.buildings.length} places
                </span>
              </div>

              {/* Primary District / Zone Actions */}
              {group.locations.map((loc) => {
                const isActive = activeLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      onSelectLocation(loc);
                      onClose();
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer group ${
                      isActive
                        ? 'bg-cyan-500/15 border-cyan-400/50'
                        : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.06] hover:border-cyan-400/40'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-display font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                        {loc.name}
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-cyan-300 shrink-0">
                        <span>Visit</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {loc.description}
                    </p>
                  </button>
                );
              })}

              {/* Buildings inside this Category */}
              {group.buildings.length > 0 && (
                <div className="grid grid-cols-1 gap-1.5">
                  {group.buildings.map((b) => {
                    const isSelected = activeBuildingId === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => {
                          onSelectBuilding(b);
                          onClose();
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl border transition-colors cursor-pointer flex items-center justify-between gap-3 group ${
                          isSelected
                            ? 'bg-cyan-500/15 border-cyan-400/50'
                            : 'bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.06] hover:border-white/15'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2.5">
                          <Building2 className="w-3.5 h-3.5 text-amber-300/80 shrink-0" />
                          <div className="min-w-0">
                            <div className="text-xs font-semibold text-slate-100 group-hover:text-cyan-300 truncate transition-colors">
                              {b.name}
                            </div>
                            <div className="text-[11px] text-slate-400 truncate">
                              {b.type}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-cyan-300 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          ))}

          {totalMatches === 0 && (
            <div className="py-12 text-center text-slate-400 text-xs">
              <p>No destinations found matching &ldquo;{searchQuery}&rdquo;.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setActiveCategory('all');
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-400/40 text-cyan-200 text-xs font-medium hover:bg-cyan-500/25 cursor-pointer"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
