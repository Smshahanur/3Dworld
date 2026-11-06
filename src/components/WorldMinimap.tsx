import React, { useState, useEffect } from 'react';
import { ROAD_SEGMENTS, ROUNDABOUT_NODES, BRIDGES, getDistrictForPoint } from '../world/roadNetwork';

interface WorldMinimapProps {
  getNavPositions?: () => {
    playerPos: { x: number; z: number; yaw: number } | null;
    vehiclePos: { x: number; z: number; yaw: number };
    isDriving: boolean;
  } | undefined;
  onFastTravel?: (district: 'rural' | 'modern' | 'capital') => void;
  cinemaMode?: boolean;
}

export const WorldMinimap: React.FC<WorldMinimapProps> = ({
  getNavPositions,
  onFastTravel,
  cinemaMode = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [positions, setPositions] = useState<{
    playerPos: { x: number; z: number; yaw: number } | null;
    vehiclePos: { x: number; z: number; yaw: number };
    isDriving: boolean;
  }>({
    playerPos: null,
    vehiclePos: { x: -22, z: -2, yaw: Math.PI / 2 },
    isDriving: false,
  });

  // Poll navigation positions at 15fps for smooth minimap tracking
  useEffect(() => {
    if (!getNavPositions || cinemaMode) return;
    const interval = setInterval(() => {
      const p = getNavPositions();
      if (p) {
        setPositions(p);
      }
    }, 66);
    return () => clearInterval(interval);
  }, [getNavPositions, cinemaMode]);

  if (cinemaMode) return null;

  // Coordinate mapping for SVG:
  // World bounds: X from -170 to +175 (width = 345), Z from -75 to +75 (depth = 150)
  const WORLD_MIN_X = -170;
  const WORLD_MAX_X = 175;
  const WORLD_MIN_Z = -75;
  const WORLD_MAX_Z = 75;

  const worldWidth = WORLD_MAX_X - WORLD_MIN_X;
  const worldDepth = WORLD_MAX_Z - WORLD_MIN_Z;

  const mapW = isExpanded ? 360 : 190;
  const mapH = isExpanded ? 170 : 90;

  function toMapX(worldX: number): number {
    return ((worldX - WORLD_MIN_X) / worldWidth) * mapW;
  }

  function toMapY(worldZ: number): number {
    return ((worldZ - WORLD_MIN_Z) / worldDepth) * mapH;
  }

  // Active tracking coordinate (EV if driving, otherwise player avatar / camera target)
  const activeX = positions.isDriving ? positions.vehiclePos.x : (positions.playerPos?.x ?? 0);
  const activeZ = positions.isDriving ? positions.vehiclePos.z : (positions.playerPos?.z ?? 0);
  const activeDistrictKey = getDistrictForPoint(activeX, activeZ);

  const districtNames: Record<string, string> = {
    'rural-village': 'District 1: Rural Village',
    'inter-district': 'Highway Corridor & River Bridges',
    'modern-village': 'District 2: Modern Village',
    'capital-town': 'District 3: Capital Town',
  };

  const currentDistrictLabel = districtNames[activeDistrictKey] || '3DWorld Universe';

  return (
    <div
      className={`fixed top-16 right-4 z-40 transition-all duration-300 pointer-events-auto select-none font-sans ${
        isExpanded ? 'w-[376px]' : 'w-[206px]'
      }`}
    >
      <div className="bg-slate-900/85 backdrop-blur-md border border-cyan-500/30 rounded-xl shadow-2xl p-2 text-white overflow-hidden">
        {/* Minimap Top Header */}
        <div className="flex items-center justify-between px-1 pb-1.5 border-b border-slate-700/60 mb-1.5">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-300">
              {positions.isDriving ? 'GPS Navigation' : 'World Minimap'}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              title={isExpanded ? 'Collapse Minimap' : 'Expand Minimap'}
              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {isExpanded ? '▾ Compact' : '▴ Expand'}
            </button>
          </div>
        </div>

        {/* Current Zone Label */}
        <div className="px-1 mb-1 flex items-center justify-between text-[9px] text-slate-400">
          <span className="truncate max-w-[130px] font-medium text-slate-200">
            {currentDistrictLabel}
          </span>
          <span className="font-mono text-cyan-400">
            X:{Math.round(activeX)} Z:{Math.round(activeZ)}
          </span>
        </div>

        {/* Minimap SVG Viewport */}
        <div className="relative rounded-lg overflow-hidden bg-[#0d1522] border border-slate-800/80">
          <svg
            width={mapW}
            height={mapH}
            viewBox={`0 0 ${mapW} ${mapH}`}
            className="w-full h-auto block"
          >
            {/* 1. District Background Zones */}
            {/* Rural Village Sector (West) */}
            <rect
              x={toMapX(-170)}
              y={0}
              width={toMapX(-60) - toMapX(-170)}
              height={mapH}
              fill="#142618"
              opacity={0.7}
            />

            {/* West River Creek */}
            <rect
              x={toMapX(-60)}
              y={0}
              width={toMapX(-48) - toMapX(-60)}
              height={mapH}
              fill="#0e3a53"
            />

            {/* Modern Village Sector (Center) */}
            <rect
              x={toMapX(-48)}
              y={0}
              width={toMapX(45) - toMapX(-48)}
              height={mapH}
              fill="#131c2e"
              opacity={0.8}
            />

            {/* Modern Village Lake Basin */}
            <ellipse
              cx={toMapX(5)}
              cy={toMapY(-45)}
              rx={((28) / worldWidth) * mapW}
              ry={((18) / worldDepth) * mapH}
              fill="#0284c7"
              opacity={0.4}
            />

            {/* Rural Village Pond */}
            <ellipse
              cx={toMapX(-95)}
              cy={toMapY(-35)}
              rx={((14) / worldWidth) * mapW}
              ry={((11) / worldDepth) * mapH}
              fill="#0369a1"
              opacity={0.4}
            />

            {/* Main River System */}
            <rect
              x={toMapX(45)}
              y={0}
              width={toMapX(57) - toMapX(45)}
              height={mapH}
              fill="#0369a1"
            />

            {/* Capital Town Sector (East) */}
            <rect
              x={toMapX(57)}
              y={0}
              width={toMapX(175) - toMapX(57)}
              height={mapH}
              fill="#181c2e"
              opacity={0.8}
            />

            {/* 2. Road Network Segments */}
            {ROAD_SEGMENTS.map((seg) => {
              const x1 = toMapX(seg.minX);
              const x2 = toMapX(seg.maxX);
              const y1 = toMapY(seg.minZ);
              const y2 = toMapY(seg.maxZ);
              const rw = Math.max(1.2, x2 - x1);
              const rh = Math.max(1.2, y2 - y1);

              const isDirt = seg.surface === 'dirt';
              const isHighway = seg.id.includes('highway') || seg.id.includes('main') || seg.id.includes('boulevard');

              return (
                <rect
                  key={seg.id}
                  x={x1}
                  y={y1}
                  width={rw}
                  height={rh}
                  fill={isDirt ? '#9a6b47' : isHighway ? '#cbd5e1' : '#64748b'}
                  opacity={isDirt ? 0.8 : 0.85}
                  rx={0.5}
                />
              );
            })}

            {/* Trans-District Bridges */}
            {BRIDGES.map((b) => {
              const bx1 = toMapX(Math.min(b.startX, b.endX));
              const bx2 = toMapX(Math.max(b.startX, b.endX));
              const by1 = toMapY(Math.min(b.startZ, b.endZ) - b.width * 0.5);
              const by2 = toMapY(Math.max(b.startZ, b.endZ) + b.width * 0.5);
              return (
                <rect
                  key={b.id}
                  x={bx1}
                  y={by1}
                  width={Math.max(2, bx2 - bx1)}
                  height={Math.max(2, by2 - by1)}
                  fill="#f59e0b"
                  opacity={0.9}
                  stroke="#fbbf24"
                  strokeWidth={0.5}
                />
              );
            })}

            {/* Roundabouts */}
            {ROUNDABOUT_NODES.map((rb) => {
              const cx = toMapX(rb.centerX);
              const cy = toMapY(rb.centerZ);
              const outerR = (rb.outerRadius / worldWidth) * mapW;
              const innerR = (rb.innerRadius / worldWidth) * mapW;
              return (
                <g key={rb.id}>
                  <circle cx={cx} cy={cy} r={outerR} fill="#cbd5e1" opacity={0.9} />
                  <circle cx={cx} cy={cy} r={innerR} fill="#10b981" />
                </g>
              );
            })}

            {/* 3. District Labels */}
            <text
              x={toMapX(-115)}
              y={toMapY(-60)}
              fill="#86efac"
              fontSize={isExpanded ? '8' : '6'}
              fontWeight="bold"
              textAnchor="middle"
              opacity={0.7}
            >
              RURAL VILLAGE
            </text>

            <text
              x={toMapX(-5)}
              y={toMapY(-62)}
              fill="#7dd3fc"
              fontSize={isExpanded ? '8' : '6'}
              fontWeight="bold"
              textAnchor="middle"
              opacity={0.7}
            >
              MODERN VILLAGE
            </text>

            <text
              x={toMapX(115)}
              y={toMapY(-60)}
              fill="#fde047"
              fontSize={isExpanded ? '8' : '6'}
              fontWeight="bold"
              textAnchor="middle"
              opacity={0.7}
            >
              CAPITAL TOWN
            </text>

            {/* Creator Pavilion Landmark Marker */}
            <g transform={`translate(${toMapX(27.5)}, ${toMapY(15.0)})`}>
              <circle r={isExpanded ? '3' : '2'} fill="#14b8a6" stroke="#ffffff" strokeWidth="0.5" />
              {isExpanded && (
                <text x="4" y="2" fill="#2dd4bf" fontSize="5.5" fontWeight="bold">
                  Creator
                </text>
              )}
            </g>

            {/* 4. Electric Vehicle Marker (Orange Roadster Icon) */}
            <g transform={`translate(${toMapX(positions.vehiclePos.x)}, ${toMapY(positions.vehiclePos.z)})`}>
              {/* Outer pulsing ring if vehicle is being driven */}
              {positions.isDriving && (
                <circle r="5" fill="none" stroke="#f97316" strokeWidth="1" className="animate-ping" opacity="0.6" />
              )}
              {/* EV body */}
              <circle r="3.2" fill="#f97316" stroke="#ffffff" strokeWidth="0.8" />
              {/* Heading indicator triangle */}
              <g transform={`rotate(${(-positions.vehiclePos.yaw * 180) / Math.PI + 90})`}>
                <polygon points="0,-4.5 -2.2,0 2.2,0" fill="#ffffff" />
              </g>
            </g>

            {/* 5. Player Avatar Marker (Cyan/Blue Icon, shown when not driving) */}
            {!positions.isDriving && positions.playerPos && (
              <g transform={`translate(${toMapX(positions.playerPos.x)}, ${toMapY(positions.playerPos.z)})`}>
                <circle r="4" fill="none" stroke="#38bdf8" strokeWidth="1" className="animate-pulse" />
                <circle r="2.8" fill="#0284c7" stroke="#ffffff" strokeWidth="0.8" />
              </g>
            )}
          </svg>

          {/* Compass Rose */}
          <div className="absolute top-1 left-1.5 bg-slate-900/70 px-1 py-0.5 rounded text-[8px] font-mono text-cyan-300 border border-slate-700/50">
            N
          </div>
        </div>

        {/* Legend / Key */}
        <div className="mt-1.5 flex items-center justify-between text-[8px] text-slate-400 px-0.5">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" />
              <span>EV Car</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              <span>Player</span>
            </span>
            <span className="flex items-center space-x-1">
              <span className="w-2 h-1 bg-amber-400 inline-block rounded-xs" />
              <span>Bridges</span>
            </span>
          </div>

          {/* Fast-Travel Buttons when expanded */}
          {isExpanded && onFastTravel && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => onFastTravel('rural')}
                className="px-1.5 py-0.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 rounded border border-emerald-700/50 text-[8px] transition-colors"
              >
                Rural
              </button>
              <button
                onClick={() => onFastTravel('modern')}
                className="px-1.5 py-0.5 bg-sky-950/80 hover:bg-sky-900 text-sky-300 rounded border border-sky-700/50 text-[8px] transition-colors"
              >
                Modern
              </button>
              <button
                onClick={() => onFastTravel('capital')}
                className="px-1.5 py-0.5 bg-amber-950/80 hover:bg-amber-900 text-amber-300 rounded border border-amber-700/50 text-[8px] transition-colors"
              >
                Capital
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
