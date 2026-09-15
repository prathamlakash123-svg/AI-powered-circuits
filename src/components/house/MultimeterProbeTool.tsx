import React from "react";
import { Activity, Zap, CheckCircle2, AlertTriangle, ShieldCheck, X } from "lucide-react";

export interface ProbeMeasurement {
  targetName: string;
  voltage: number;
  current: number;
  watts?: number;
  impedanceOhms?: number;
  notes: string;
  timestamp: string;
}

interface MultimeterProbeToolProps {
  measurement: ProbeMeasurement | null;
  isActive: boolean;
  onToggleActive: () => void;
  onClearMeasurement: () => void;
}

export const MultimeterProbeTool: React.FC<MultimeterProbeToolProps> = ({
  measurement,
  isActive,
  onToggleActive,
  onClearMeasurement,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800 text-white shadow-md">
      {/* Probe Toggle Button */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onToggleActive}
          className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isActive
              ? "bg-amber-500 text-slate-950 ring-2 ring-amber-300 animate-pulse font-black"
              : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>{isActive ? "⚡ Multimeter Probes ACTIVE (Click Any Point)" : "Turn ON Multimeter Probes"}</span>
        </button>

        <p className="text-xs text-slate-400 hidden sm:block">
          {isActive
            ? "Click any outlet, appliance, breaker, or busbar to take live digital measurements."
            : "Measure real-time Volts, Amps, Watts, and Earthing impedance anywhere in the house."}
        </p>
      </div>

      {/* Digital HUD Readout if point is probed */}
      {measurement && (
        <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-1.5 rounded-lg border border-slate-800 text-xs">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-mono text-slate-400">Probed:</span>
            <span className="font-bold text-amber-400 max-w-[140px] truncate">
              {measurement.targetName}
            </span>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          <div className="font-mono flex items-center space-x-2.5">
            <span className="text-emerald-400 font-bold">{measurement.voltage.toFixed(1)} V</span>
            <span className="text-blue-400 font-bold">{measurement.current.toFixed(2)} A</span>
            {measurement.watts !== undefined && (
              <span className="text-purple-300 font-bold">{measurement.watts.toFixed(0)} W</span>
            )}
          </div>

          <button
            onClick={onClearMeasurement}
            className="text-slate-500 hover:text-white p-0.5 rounded cursor-pointer ml-1"
            title="Dismiss measurement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
