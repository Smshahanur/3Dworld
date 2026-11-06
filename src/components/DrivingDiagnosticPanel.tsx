import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, CheckCircle2, RefreshCw, X, Layers, Box, ShieldCheck } from 'lucide-react';
import { VehicleDiagnosticData } from '../world/drivableVehicle';
import { SpatialAuditReport } from '../world/spatialAuditSystem';

interface DrivingDiagnosticPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getDiagnostics: () => VehicleDiagnosticData | undefined;
  onResetVehicle: () => void;
  onExitVehicle: () => void;
  onToggleSpatialDebug?: () => boolean;
  getSpatialDebugVisible?: () => boolean;
  getSpatialAuditReport?: () => SpatialAuditReport | null;
}

export const DrivingDiagnosticPanel: React.FC<DrivingDiagnosticPanelProps> = ({
  isOpen,
  onClose,
  getDiagnostics,
  onResetVehicle,
  onExitVehicle,
  onToggleSpatialDebug,
  getSpatialDebugVisible,
  getSpatialAuditReport,
}) => {
  const [data, setData] = useState<VehicleDiagnosticData | null>(null);
  const [auditReport, setAuditReport] = useState<SpatialAuditReport | null>(null);
  const [isSpatialDebugActive, setIsSpatialDebugActive] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    const updateTelemetry = () => {
      const diag = getDiagnostics();
      if (diag) setData({ ...diag });

      if (getSpatialAuditReport) {
        const report = getSpatialAuditReport();
        if (report) setAuditReport(report);
      }

      if (getSpatialDebugVisible) {
        setIsSpatialDebugActive(getSpatialDebugVisible());
      }
    };

    updateTelemetry();
    const interval = setInterval(updateTelemetry, 150);
    return () => clearInterval(interval);
  }, [isOpen, getDiagnostics, getSpatialAuditReport, getSpatialDebugVisible]);

  const handleToggleWireframes = () => {
    if (onToggleSpatialDebug) {
      const active = onToggleSpatialDebug();
      setIsSpatialDebugActive(active);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed top-16 right-4 z-50 w-84 max-w-[92vw] bg-[#080d1a]/95 border border-cyan-500/40 rounded-xl shadow-2xl backdrop-blur-md text-xs font-mono text-slate-200 overflow-hidden pointer-events-auto animate-in fade-in slide-in-from-right-3 duration-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-cyan-300">Diagnostics & Spatial Integrity</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close Diagnostics"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-3.5 space-y-2.5 max-h-[75vh] overflow-y-auto">
        {/* Spatial Coordinate System & Road Clearance Integrity Card */}
        <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-slate-300">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Road & Spatial Clearance</span>
            </div>
            {auditReport ? (
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 ${
                auditReport.isValid
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-red-500/20 text-red-300 border border-red-500/40'
              }`}>
                {auditReport.isValid ? <ShieldCheck className="w-3 h-3 text-emerald-400" /> : <AlertTriangle className="w-3 h-3 text-red-400" />}
                {auditReport.isValid ? '100% CLEAR' : `${auditReport.roadObstructionCount + auditReport.overlapCount} ISSUES`}
              </span>
            ) : null}
          </div>

          {auditReport && (
            <>
              <div className="grid grid-cols-3 gap-1 text-[10px] text-center bg-slate-900/50 p-1.5 rounded border border-slate-800/80">
                <div>
                  <div className="text-slate-400">Buildings</div>
                  <div className="font-bold text-blue-400">{auditReport.totalBuildings}</div>
                </div>
                <div>
                  <div className="text-slate-400">Road Corridors</div>
                  <div className="font-bold text-emerald-400">{auditReport.totalRoadsAndParking}</div>
                </div>
                <div>
                  <div className="text-slate-400">Vehicles</div>
                  <div className="font-bold text-amber-400">{auditReport.totalVehicles}</div>
                </div>
              </div>

              {/* Road Clearance & District Connectivity Summary */}
              <div className="text-[10px] space-y-1 bg-slate-900/40 p-1.5 rounded border border-slate-800/60">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Protected Corridors:</span>
                  <span className={`font-semibold ${auditReport.roadObstructionCount === 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                    {auditReport.roadObstructionCount === 0 ? '0 Blockages (Clear)' : `${auditReport.roadObstructionCount} Blocked`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Vehicle Swept Path (3m):</span>
                  <span className={`font-semibold ${auditReport.insufficientClearanceCount === 0 ? 'text-emerald-300' : 'text-yellow-400'}`}>
                    {auditReport.insufficientClearanceCount === 0 ? '100% Compliant' : `${auditReport.insufficientClearanceCount} Narrow`}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">3-District Connectivity:</span>
                  <span className={`font-semibold ${auditReport.connectivity.isAllConnected ? 'text-cyan-300' : 'text-purple-400'}`}>
                    {auditReport.connectivity.isAllConnected ? 'Traversable (B1 & B2 Online)' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </>
          )}

          {auditReport && !auditReport.isValid && (
            <div className="text-[10px] text-red-300 space-y-1">
              {auditReport.overlaps.map((ov, idx) => (
                <div key={idx} className="p-1 rounded bg-red-950/50 border border-red-900/50">
                  {ov.description}
                </div>
              ))}
            </div>
          )}

          {/* Diagnostic Color Palette Guide */}
          <div className="text-[9px] grid grid-cols-2 gap-1 px-1 text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Green: Valid Road</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span> Blue: Valid Building</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span> Red: Blocked Road</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span> Orange: Invalid Plinth</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500 inline-block"></span> Yellow: &lt;3m Clearance</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500 inline-block"></span> Purple: Disconnected</span>
          </div>

          {/* Toggle 3D Spatial Wireframes */}
          <button
            onClick={handleToggleWireframes}
            className={`w-full py-1.5 px-2 rounded border transition flex items-center justify-between text-[11px] font-semibold cursor-pointer ${
              isSpatialDebugActive
                ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Spatial Wireframe Mode</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">
              {isSpatialDebugActive ? 'ACTIVE (Shift+D)' : 'OFF (Shift+D)'}
            </span>
          </button>
        </div>

        {data ? (
          <>
            {/* Status Indicator */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400">Drive Mode:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                data.isDriving ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                {data.isDriving ? 'DRIVING ACTIVE' : 'PARKED / STANDBY'}
              </span>
            </div>

            {/* Collision Status */}
            <div className={`p-2 rounded-lg border ${
              data.hasCollided
                ? 'bg-red-950/30 border-red-500/50 text-red-200'
                : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold">
                {data.hasCollided ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                )}
                <span>Collision: {data.hasCollided ? 'OBSTACLE DETECTED' : 'CLEAR ROAD'}</span>
              </div>
              <div className="mt-1 text-[11px] opacity-80 truncate">
                Obstacle: {data.lastObstacle}
              </div>
            </div>

            {/* Telemetry Grid */}
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Speed & Gear</div>
                <div className="text-sm font-bold text-white mt-0.5">
                  {data.speedKmh} km/h <span className="text-cyan-400 font-semibold">[{data.gear}]</span>
                </div>
                <div className="text-[10px] text-slate-500">{data.actualSpeed} m/s</div>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Surface Type</div>
                <div className="text-[11px] font-bold text-cyan-200 mt-1 truncate">
                  {data.surfaceType}
                </div>
                <div className="text-[10px] text-emerald-400">Authoritative Ground Y: {data.y}</div>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Throttle & Brake</div>
                <div className="text-[11px] font-bold text-white mt-0.5">
                  Throt: {data.throttle > 0 ? `+${data.throttle}` : data.throttle}
                </div>
                <div className={`text-[10px] font-semibold ${data.isBraking ? 'text-red-400' : 'text-slate-500'}`}>
                  Brake: {data.isBraking ? 'ACTIVE' : 'OFF'}
                </div>
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80">
                <div className="text-slate-400 text-[10px] uppercase">Steering Input</div>
                <div className="text-[11px] font-bold text-white mt-0.5">
                  Steer: {data.steer > 0 ? `+${data.steer}` : data.steer}
                </div>
                <div className="text-[10px] text-slate-500">
                  Heading: {data.yawDeg}°
                </div>
              </div>
            </div>

            {/* Coordinates */}
            <div className="p-2 rounded bg-slate-900/60 border border-slate-800/80 text-[11px] space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Vehicle Pos:</span>
                <span className="text-slate-100 font-bold">X: {data.x}, Y: {data.y}, Z: {data.z}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chase Cam:</span>
                <span className="text-slate-300">X: {data.camX}, Y: {data.camY}, Z: {data.camZ}</span>
              </div>
            </div>

            {/* Control Actions */}
            <div className="pt-1 flex gap-2">
              <button
                onClick={onResetVehicle}
                className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer text-[11px] font-semibold"
              >
                <RefreshCw className="w-3 h-3 text-cyan-400" />
                Reset EV to Bay
              </button>
              {data.isDriving && (
                <button
                  onClick={onExitVehicle}
                  className="py-1.5 px-3 bg-red-600/30 hover:bg-red-600/50 text-red-200 rounded border border-red-500/50 transition cursor-pointer text-[11px] font-semibold"
                >
                  Exit Car
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="py-2 text-center text-slate-400 text-xs">
            EV telemetry ready. Press Drive to pilot the Roadster.
          </div>
        )}
      </div>
    </div>
  );
};

