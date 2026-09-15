import React from "react";
import { useSimulation } from "../context/SimulationContext";
import {
  CircuitId,
  DiagnosticIssue,
} from "../types/simulation";
import {
  Layers,
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Flame,
  ShieldAlert,
} from "lucide-react";

interface DiagnosticMapProps {
  highlightIssue?: DiagnosticIssue | null;
}

export const DiagnosticMapView: React.FC<DiagnosticMapProps> = ({ highlightIssue }) => {
  const {
    circuits,
    appliances,
    metrics,
    diagnosticIssues,
    selectedFaultCircuitId,
    setSelectedFaultCircuitId,
  } = useSimulation();

  // Find active issue or first critical issue
  const activeIssue =
    highlightIssue ||
    diagnosticIssues.find((i) => i.circuitId === selectedFaultCircuitId) ||
    diagnosticIssues[0] ||
    null;

  const targetCircuitId = activeIssue?.circuitId || selectedFaultCircuitId || "circuit_2";
  const circuit = circuits.find((c) => c.id === targetCircuitId) || circuits[0];
  const circuitApps = appliances.filter((a) => a.circuitId === circuit.id && a.isOn);
  const primaryApp = circuitApps[0] || appliances.find((a) => a.circuitId === circuit.id);

  const hasFaultOnThisCircuit = diagnosticIssues.some((i) => i.circuitId === circuit.id);

  return (
    <div
      id="real-time-diagnostic-map"
      className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] font-mono text-blue-600 uppercase tracking-wider font-bold block">
            Real-Time Fault Isolation
          </span>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Diagnostic Electrical Path Map</span>
            {hasFaultOnThisCircuit && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 animate-pulse">
                Fault Active
              </span>
            )}
          </h3>
        </div>

        <div className="text-right">
          <span className="text-xs font-semibold text-slate-700 block">
            Likely Fault Region:{" "}
            <strong className={hasFaultOnThisCircuit ? "text-red-600" : "text-emerald-700"}>
              {circuit.name}
            </strong>
          </span>
        </div>
      </div>

      {/* Path Visualization Flow: Appliance -> Circuit -> Breaker -> Panel */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
        {/* Node 1: Appliance */}
        <div
          className={`flex-1 p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            hasFaultOnThisCircuit
              ? "bg-red-50/80 border-red-300 ring-2 ring-red-400/20"
              : "bg-white border-slate-200"
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            1. Source Device
          </span>
          <div className="my-2 p-2 rounded-lg bg-blue-50 text-blue-600">
            <Zap className="w-5 h-5" />
          </div>
          <strong className="text-xs font-bold text-slate-900 block truncate max-w-[130px]">
            {primaryApp?.name || "Connected Loads"}
          </strong>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5">
            {circuitApps.reduce((s, a) => s + a.nominalWatts, 0)} Watts
          </span>
        </div>

        {/* Down Arrow / Right Arrow */}
        <div className="flex items-center justify-center text-slate-400">
          <ArrowDown className="w-5 h-5 sm:-rotate-90 text-blue-600 animate-pulse shrink-0" />
        </div>

        {/* Node 2: Circuit Branch Conductor */}
        <div
          className={`flex-1 p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            hasFaultOnThisCircuit
              ? "bg-red-50/80 border-red-300 ring-2 ring-red-400/20"
              : "bg-white border-slate-200"
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            2. Branch Conductor
          </span>
          <div className="my-2 p-2 rounded-lg bg-amber-50 text-amber-600">
            <Flame className="w-5 h-5" />
          </div>
          <strong className="text-xs font-bold text-slate-900 block">
            {circuit.name.split("-")[0].trim()}
          </strong>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5">
            {circuit.wireGauge.replace("_", " ")} ({circuit.wireCondition})
          </span>
        </div>

        {/* Down Arrow / Right Arrow */}
        <div className="flex items-center justify-center text-slate-400">
          <ArrowDown className="w-5 h-5 sm:-rotate-90 text-blue-600 animate-pulse shrink-0" />
        </div>

        {/* Node 3: Breaker (B1, B2, etc.) */}
        <div
          className={`flex-1 p-3.5 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
            circuit.isBreakerTripped
              ? "bg-red-50 border-red-400 ring-2 ring-red-500/30"
              : "bg-white border-slate-200"
          }`}
        >
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            3. Protective Breaker
          </span>
          <div
            className={`my-2 p-2 rounded-lg ${
              circuit.isBreakerTripped ? "bg-red-100 text-red-700" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <strong className="text-xs font-bold text-slate-900 block">
            Breaker {circuit.id.replace("circuit_", "B")}
          </strong>
          <span className="text-[11px] font-mono text-slate-500 mt-0.5">
            {circuit.breakerRating}A Rating ({circuit.isBreakerTripped ? "TRIPPED" : "ON"})
          </span>
        </div>

        {/* Down Arrow / Right Arrow */}
        <div className="flex items-center justify-center text-slate-400">
          <ArrowDown className="w-5 h-5 sm:-rotate-90 text-blue-600 animate-pulse shrink-0" />
        </div>

        {/* Node 4: Main Panel Board */}
        <div className="flex-1 p-3.5 rounded-xl border border-slate-200 bg-white flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            4. Service Panel
          </span>
          <div className="my-2 p-2 rounded-lg bg-purple-50 text-purple-600">
            <Layers className="w-5 h-5" />
          </div>
          <strong className="text-xs font-bold text-slate-900 block">Consumer Panel</strong>
          <span className="text-[11px] text-slate-500 font-mono mt-0.5">
            {metrics.voltage}V Grid Infeed
          </span>
        </div>
      </div>

      {/* Cause / Diagnostics Footer */}
      {activeIssue && (
        <div className="mt-3 p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs text-amber-950 flex items-start space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>Active Path Warning: {activeIssue.title}</strong>
            <p className="text-amber-900 mt-0.5 leading-relaxed">{activeIssue.why}</p>
          </div>
        </div>
      )}
    </div>
  );
};
