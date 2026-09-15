import React, { useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { CircuitId } from "../types/simulation";
import {
  ShieldAlert,
  RotateCcw,
  Zap,
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Power,
} from "lucide-react";

export const ElectricalPanelView: React.FC = () => {
  const {
    circuits,
    appliances,
    metrics,
    protectionState,
    resetProtection,
    toggleBreaker,
    toggleMasterSwitch,
    triggerRcdTest,
    groundingQuality,
    panelType,
  } = useSimulation();

  const [inspectedComponent, setInspectedComponent] = useState<{
    title: string;
    type: string;
    status: string;
    details: string;
    specs: string;
  } | null>(null);

  return (
    <div className="bg-slate-900 rounded-2xl border-4 border-slate-700 p-6 text-slate-100 shadow-2xl relative overflow-hidden">
      {/* Panel Enclosure Door Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-700/80">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-white text-xs">
            230V
          </div>
          <div>
            <h3 className="text-base font-bold tracking-tight text-white flex items-center space-x-2">
              <span>Residential Consumer Distribution Panel</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                {panelType === "MODERN_SPLIT"
                  ? "Dual RCD Split Load"
                  : panelType === "STANDARD_CONSUMER"
                  ? "Standard Consumer Unit"
                  : "Obsolete Fuse Box"}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Interactive 2D DIN-Rail Breakers. Click switches to manually open/close circuits.
            </p>
          </div>
        </div>

        {protectionState === "TRIPPED" && (
          <button
            onClick={resetProtection}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all animate-pulse cursor-pointer shadow-md"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Tripped Protection</span>
          </button>
        )}
      </div>

      {/* DIN Rail Enclosure Interior */}
      <div className="bg-slate-950/80 rounded-xl p-5 border border-slate-800 space-y-6">
        {/* Upper Rail: Main Switch, RCD / RCCB, and Earthing Terminal */}
        <div className="flex flex-wrap items-center gap-4 pb-4 border-b border-slate-800">
          {/* Main Incomer Switch */}
          <div
            onClick={() =>
              setInspectedComponent({
                title: "Main Incomer Isolator (DP 100A)",
                type: "Double-Pole Master Switch",
                status: protectionState === "DISCONNECTED" ? "OFF / Open" : "ON / Closed",
                details:
                  "Simulates the master double-pole switch that isolates both Live and Neutral incoming supply conductors.",
                specs: "Rated Current: 100A | Nominal: 230V 50Hz",
              })
            }
            className={`w-28 p-3 rounded-xl border flex flex-col items-center justify-between cursor-pointer transition-all ${
              protectionState === "DISCONNECTED"
                ? "bg-slate-800 border-red-500/80 text-slate-400"
                : "bg-slate-800/90 border-slate-600 text-white hover:border-blue-400"
            }`}
          >
            <span className="text-[10px] font-mono text-slate-400 uppercase">Master</span>
            <div className="my-2">
              {/* Toggle Switch Graphic */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMasterSwitch();
                }}
                className={`w-8 h-14 rounded-lg p-1 flex flex-col justify-between transition-colors cursor-pointer ${
                  protectionState === "DISCONNECTED" ? "bg-slate-700" : "bg-red-600 hover:bg-red-500"
                }`}
                title="Click to toggle master power switch"
              >
                <div
                  className={`w-6 h-6 rounded-md bg-white shadow-md transform transition-transform duration-300 ${
                    protectionState === "DISCONNECTED" ? "translate-y-6 bg-slate-300 text-slate-700" : "translate-y-0 text-red-600"
                  }`}
                />
              </button>
            </div>
            <span className="text-xs font-bold tracking-wider">
              {protectionState === "DISCONNECTED" ? "OFF" : "100A ON"}
            </span>
          </div>

          {/* Master RCCB / RCD Device */}
          <div
            onClick={() =>
              setInspectedComponent({
                title: "Master Residual Current Device (RCCB)",
                type: "Type A Life-Safety RCD",
                status: protectionState === "TRIPPED" ? "TRIPPED" : "ARMED",
                details:
                  "Monitors for imbalance between outgoing phase and returning neutral currents. Trips within 30ms if >30mA escapes to ground.",
                specs: "Sensitivity: 30mA | Trip Time: <40ms | Type A",
              })
            }
            className={`w-36 p-3 rounded-xl border flex flex-col items-center justify-between cursor-pointer transition-all ${
              protectionState === "TRIPPED"
                ? "bg-red-950/40 border-red-500 text-red-300"
                : "bg-slate-800/90 border-slate-600 text-white hover:border-blue-400"
            }`}
          >
            <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400">
              <span>RCCB</span>
              <span className="text-emerald-400 font-bold">30mA</span>
            </div>

            <div className="my-2 flex items-center space-x-2">
              <div
                className={`w-8 h-14 rounded-lg p-1 flex flex-col justify-between transition-colors ${
                  protectionState === "TRIPPED" ? "bg-slate-700" : "bg-blue-600"
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-md bg-white shadow-md transform transition-transform duration-300 ${
                    protectionState === "TRIPPED" ? "translate-y-6 bg-slate-300" : "translate-y-0"
                  }`}
                />
              </div>

              {/* Real 'T' (TEST) Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  triggerRcdTest();
                }}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-amber-600 active:scale-95 text-amber-300 hover:text-white border-2 border-amber-500/80 font-black text-xs flex items-center justify-center shadow-md transition-all cursor-pointer"
                title="Press to perform monthly mechanical test trip"
              >
                T
              </button>
            </div>

            <div className="text-center">
              <span
                className={`text-[11px] font-bold block ${
                  protectionState === "TRIPPED" ? "text-red-400" : "text-emerald-400"
                }`}
              >
                {protectionState === "TRIPPED" ? "TRIPPED" : "PROTECTED"}
              </span>
            </div>
          </div>

          {/* Grounding Earthing Terminal Busbar */}
          <div
            onClick={() =>
              setInspectedComponent({
                title: "Main Earthing Terminal (MET)",
                type: "Protective Earth (PE) Busbar",
                status: groundingQuality,
                details:
                  "Solid brass busbar tying all circuit protective conductors (cpc) to the main earth ground electrode.",
                specs: `Grounding Quality: ${groundingQuality} | Earth Resistance: ${
                  groundingQuality === "EXCELLENT" ? "< 2 Ω" : groundingQuality === "DEGRADED" ? "35 Ω" : "> 1000 Ω"
                }`,
              })
            }
            className="flex-1 min-w-[200px] p-3 rounded-xl border border-slate-700 bg-slate-900 flex flex-col justify-between cursor-pointer hover:border-emerald-500/80 transition-colors"
          >
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="font-bold text-slate-300 flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>Earth Ground Terminal Busbar</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  groundingQuality === "EXCELLENT"
                    ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    : groundingQuality === "DEGRADED"
                    ? "bg-amber-950 text-amber-400 border border-amber-800"
                    : "bg-red-950 text-red-400 border border-red-800"
                }`}
              >
                {groundingQuality}
              </span>
            </div>

            {/* Visual Brass Terminal Bar with Green/Yellow Wires */}
            <div className="h-6 bg-amber-800/40 rounded border border-amber-700/60 flex items-center justify-around px-2">
              {[1, 2, 3, 4, 5, 6].map((screw) => (
                <div key={screw} className="flex flex-col items-center">
                  <div className="w-2 h-2 rounded-full bg-amber-400 border border-amber-900" />
                  <div className="w-0.5 h-3 bg-emerald-400" />
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              Direct connection to external simulated earth rod.
            </p>
          </div>
        </div>

        {/* Lower Rail: Miniature Circuit Breakers (MCBs) */}
        <div>
          <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
            <span className="font-mono uppercase tracking-wider">Branch DIN Rail (Type B/C MCBs)</span>
            <span>Click breaker toggle to manually isolate circuit</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {circuits.map((c, idx) => {
              const cApps = appliances.filter((a) => a.circuitId === c.id && a.isOn);
              const cWatts = cApps.reduce((s, a) => s + a.nominalWatts, 0);
              const cCurrent = cWatts / metrics.voltage;
              const isTripped = c.isBreakerTripped;

              return (
                <div
                  key={c.id}
                  onClick={() =>
                    setInspectedComponent({
                      title: `Branch Breaker ${c.id.replace("circuit_", "B")}`,
                      type: `Miniature Circuit Breaker (${c.breakerRating}A Type B)`,
                      status: isTripped ? "TRIPPED / OFF" : "CLOSED / ENERGIZED",
                      details: `Protects ${c.name}. Modeled with thermal bimetallic overload curve and instantaneous electromagnetic trip mechanism.`,
                      specs: `Rating: ${c.breakerRating}A | Active Draw: ${cCurrent.toFixed(1)}A | Conductor: ${c.wireGauge.replace("_", " ")} (${c.wireCondition}) | Health: ${c.breakerHealth}%`,
                    })
                  }
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer ${
                    isTripped
                      ? "bg-red-950/30 border-red-500 text-red-200"
                      : "bg-slate-800/90 border-slate-700 text-slate-200 hover:border-blue-400"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="text-xs font-bold text-white">B{idx + 1}</span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                      {c.breakerRating}A
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-300 line-clamp-1 mb-2 font-medium">
                    {c.name.split("-")[1]?.trim() || c.name}
                  </p>

                  {/* Breaker Switch Mechanical Graphic */}
                  <div className="my-2 flex items-center justify-between bg-slate-900/60 p-2 rounded-lg">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBreaker(c.id);
                      }}
                      className={`w-7 h-12 rounded p-1 flex flex-col justify-between transition-colors cursor-pointer ${
                        isTripped ? "bg-slate-700" : "bg-emerald-600"
                      }`}
                      title={isTripped ? "Switch ON" : "Switch OFF"}
                    >
                      <div
                        className={`w-5 h-5 rounded bg-white shadow-md transform transition-transform duration-200 ${
                          isTripped ? "translate-y-5 bg-slate-300" : "translate-y-0"
                        }`}
                      />
                    </button>

                    <div className="text-right text-[11px]">
                      <span className="font-mono font-bold block text-slate-100">
                        {cCurrent.toFixed(1)} A
                      </span>
                      <span
                        className={`text-[10px] font-semibold ${
                          isTripped
                            ? "text-red-400"
                            : cCurrent > c.breakerRating * 0.85
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {isTripped ? "TRIPPED" : "CLOSED"}
                      </span>
                    </div>
                  </div>

                  {/* Health Bar */}
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                    <span>Health: {c.breakerHealth}%</span>
                    <span>{c.hasRCCB ? "RCCB: Yes" : "RCCB: No"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Component Inspection Drawer / Details Box */}
      {inspectedComponent && (
        <div className="mt-4 p-4 rounded-xl bg-slate-800 border border-slate-700 text-xs animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                Component Diagnostic Inspector
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{inspectedComponent.title}</h4>
              <p className="text-slate-300 mt-1">{inspectedComponent.details}</p>
              <div className="mt-2 text-[11px] font-mono text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800">
                {inspectedComponent.specs}
              </div>
            </div>
            <button
              onClick={() => setInspectedComponent(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
