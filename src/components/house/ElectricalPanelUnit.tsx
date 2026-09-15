import React, { useState } from "react";
import { useSimulation } from "../../context/SimulationContext";
import { CircuitId } from "../../types/simulation";
import {
  Zap,
  Power,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Activity,
  Radio,
  Sliders,
} from "lucide-react";

interface ElectricalPanelUnitProps {
  onProbeComponent?: (componentName: string, voltage: number, current: number, notes: string) => void;
  isProbeActive?: boolean;
}

export const ElectricalPanelUnit: React.FC<ElectricalPanelUnitProps> = ({
  onProbeComponent,
  isProbeActive = false,
}) => {
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

  const [inspectedItem, setInspectedItem] = useState<{
    title: string;
    type: string;
    status: string;
    details: string;
    specs: string;
  } | null>(null);

  const isMasterOff = protectionState === "DISCONNECTED";
  const isRcdTripped = protectionState === "TRIPPED";

  // Calculate live branch currents
  const branchData = circuits.map((c, idx) => {
    const activeApps = appliances.filter((a) => a.circuitId === c.id && a.isOn);
    const activeWatts = activeApps.reduce((s, a) => s + a.nominalWatts, 0);
    const currentA = isMasterOff || c.isBreakerTripped ? 0 : activeWatts / metrics.voltage;
    const loadPercent = c.breakerRating > 0 ? (currentA / c.breakerRating) * 100 : 0;
    const isOverheated = currentA > c.breakerRating;
    const isNearCapacity = currentA > c.breakerRating * 0.85;

    return {
      circuit: c,
      index: idx + 1,
      currentA,
      activeWatts,
      activeAppsCount: activeApps.length,
      loadPercent,
      isOverheated,
      isNearCapacity,
      isTripped: c.isBreakerTripped || isMasterOff,
    };
  });

  return (
    <div className="bg-slate-900 rounded-2xl border-4 border-slate-700 p-4 sm:p-5 text-slate-100 shadow-xl relative">
      {/* Top Panel Door Trim & Electric Meter Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-white text-xs shadow-inner">
            <Zap className="w-5 h-5 text-amber-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight">
                Main Electrical Distribution Board
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                230V AC Single Phase
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Interactive DIN-Rail consumer unit. Click any switch, breaker, or test button to operate.
            </p>
          </div>
        </div>

        {/* Action Buttons (Reset / State Flag) */}
        <div className="flex items-center space-x-2">
          {isRcdTripped && (
            <button
              onClick={resetProtection}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all animate-pulse cursor-pointer shadow-md"
              title="Reset tripped protection"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Tripped Protection</span>
            </button>
          )}

          <div
            className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center space-x-1.5 ${
              isMasterOff
                ? "bg-slate-800 text-slate-400 border border-slate-700"
                : isRcdTripped
                ? "bg-red-950 text-red-400 border border-red-800 animate-pulse"
                : "bg-emerald-950 text-emerald-400 border border-emerald-800"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isMasterOff
                  ? "bg-slate-500"
                  : isRcdTripped
                  ? "bg-red-500 animate-ping"
                  : "bg-emerald-400"
              }`}
            />
            <span>
              {isMasterOff
                ? "PANEL DE-ENERGIZED"
                : isRcdTripped
                ? "RCD SAFETY TRIP"
                : "PANEL ENERGIZED"}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Utility Incomer & Smart kWh Meter Strip */}
      <div className="bg-slate-950/90 rounded-xl p-3 mb-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            kWh
          </div>
          <div>
            <span className="text-[10px] uppercase font-mono text-slate-400 block leading-tight">
              Utility Supply Meter
            </span>
            <span className="font-mono font-bold text-white text-xs sm:text-sm">
              {isMasterOff ? "0.00" : (metrics.totalWatts / 1000).toFixed(2)} kW Active Load
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-4 text-[11px] font-mono">
          <div>
            <span className="text-slate-500 block text-[9px]">SUPPLY VOLTAGE</span>
            <span className="text-emerald-400 font-bold">
              {isMasterOff ? "0.0 V" : `${metrics.voltage} V AC`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">TOTAL CURRENT</span>
            <span className="text-amber-400 font-bold">
              {isMasterOff ? "0.0 A" : `${metrics.current.toFixed(1)} A`}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px]">GRID FREQUENCY</span>
            <span className="text-blue-400 font-bold">50.0 Hz</span>
          </div>
        </div>
      </div>

      {/* DIN Rail Enclosure Interior */}
      <div className="bg-slate-950/70 rounded-xl p-4 border border-slate-800/90 space-y-4">
        {/* UPPER DIN RAIL: Master Incomer, 30mA RCD, and Earthing Busbar */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono uppercase tracking-wider">
            <span>Primary Protection Rail</span>
            <span>Double-Pole Isolator &amp; 30mA Life-Safety RCCB</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            {/* 1. Master 100A Double-Pole Isolator (Cols 4) */}
            <div
              onClick={() => {
                if (isProbeActive && onProbeComponent) {
                  onProbeComponent(
                    "Master 100A Double Pole Isolator",
                    isMasterOff ? 0 : metrics.voltage,
                    metrics.current,
                    isMasterOff ? "Master switch open: 0V downstream" : "Mains incoming supply live"
                  );
                } else {
                  setInspectedItem({
                    title: "Main Incomer Isolator Switch (100A DP)",
                    type: "Double-Pole Master Disconnect Switch",
                    status: isMasterOff ? "OPEN / OFF (Power Cut)" : "CLOSED / ON (Mains Active)",
                    details:
                      "Simulates the master double-pole switch that physically disconnects both Phase (Live) and Neutral supply conductors simultaneously. Use this to safely isolate the entire house.",
                    specs: `Rating: 100A Continuous | Nominal: 230V 50Hz | Poles: 2 (Live + Neutral)`,
                  });
                }
              }}
              className={`sm:col-span-4 p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                isMasterOff
                  ? "bg-slate-900 border-red-500/80 text-slate-400 shadow-inner"
                  : "bg-slate-800/90 border-slate-700 text-white hover:border-red-400 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Main Incomer
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">
                  100A DP
                </span>
              </div>

              {/* Toggle Switch Graphic */}
              <div className="my-2 flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleMasterSwitch();
                  }}
                  className={`w-9 h-14 rounded-lg p-1 flex flex-col justify-between transition-colors cursor-pointer ${
                    isMasterOff ? "bg-slate-700" : "bg-red-600 hover:bg-red-500"
                  }`}
                  title={isMasterOff ? "Click to turn Master Switch ON" : "Click to cut house power"}
                >
                  <div
                    className={`w-7 h-6 rounded-md bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center text-[10px] font-black ${
                      isMasterOff
                        ? "translate-y-6 bg-slate-300 text-slate-700"
                        : "translate-y-0 text-red-600"
                    }`}
                  >
                    {isMasterOff ? "OFF" : "ON"}
                  </div>
                </button>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold block ${
                      isMasterOff ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isMasterOff ? "POWER CUT" : "MAINS ON"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {isMasterOff ? "0.0 A" : `${metrics.current.toFixed(1)} A`}
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Whole-House Isolator</span>
                <span className="text-blue-400 font-medium">Click to flip</span>
              </div>
            </div>

            {/* 2. 30mA Life-Safety RCD / RCCB (Cols 4) */}
            <div
              onClick={() => {
                if (isProbeActive && onProbeComponent) {
                  onProbeComponent(
                    "Residual Current Device (RCCB 30mA)",
                    isMasterOff || isRcdTripped ? 0 : metrics.voltage,
                    metrics.leakageCurrent / 1000,
                    `Leakage current: ${metrics.leakageCurrent.toFixed(1)} mA (Trip threshold: 30 mA)`
                  );
                } else {
                  setInspectedItem({
                    title: "Master Residual Current Device (RCCB)",
                    type: "Life-Safety Earth Leakage Breaker (Type A)",
                    status: isRcdTripped ? "TRIPPED (Ground Fault Detected)" : "ARMED (Active Protection)",
                    details:
                      "Continuously monitors the vector sum of currents in Live and Neutral. If current escaping to ground exceeds 30mA (e.g. human body contact or water ingress), it trips in under 30ms to prevent cardiac fibrillation.",
                    specs: `Sensitivity: 30mA (0.03A) | Trip Time: <40ms | Test Resistor: 7.6 kΩ`,
                  });
                }
              }}
              className={`sm:col-span-4 p-3 rounded-xl border flex flex-col justify-between cursor-pointer transition-all ${
                isRcdTripped
                  ? "bg-red-950/40 border-red-500 text-red-200"
                  : "bg-slate-800/90 border-slate-700 text-white hover:border-blue-400 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold">
                  Life-Safety RCD
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300 font-bold">
                  IΔn 30mA
                </span>
              </div>

              {/* RCD Switch & Monthly TEST Button */}
              <div className="my-2 flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                {/* Switch lever */}
                <div
                  className={`w-8 h-14 rounded-lg p-1 flex flex-col justify-between transition-colors ${
                    isRcdTripped ? "bg-slate-700" : "bg-blue-600"
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-md bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center text-[10px] font-black ${
                      isRcdTripped
                        ? "translate-y-6 bg-slate-300 text-slate-700"
                        : "translate-y-0 text-blue-600"
                    }`}
                  >
                    {isRcdTripped ? "OFF" : "ON"}
                  </div>
                </div>

                {/* Real 'T' (TEST) Button found on every real consumer unit */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerRcdTest();
                    }}
                    className="w-8 h-8 rounded-full bg-slate-800 hover:bg-amber-600 active:scale-95 text-amber-300 hover:text-white border-2 border-amber-500/80 font-black text-xs flex items-center justify-center shadow-md transition-all cursor-pointer"
                    title="Press to perform monthly mechanical test trip"
                  >
                    T
                  </button>
                  <span className="text-[8px] font-mono text-slate-400 uppercase mt-0.5">
                    Test Monthly
                  </span>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-bold block ${
                      isRcdTripped ? "text-red-400" : "text-emerald-400"
                    }`}
                  >
                    {isRcdTripped ? "TRIPPED" : "PROTECTED"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Leakage: {metrics.leakageCurrent.toFixed(1)}mA
                  </span>
                </div>
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Shock Prevention</span>
                <span className="text-amber-400 font-medium">Click 'T' to test</span>
              </div>
            </div>

            {/* 3. Earthing Terminal Busbar (Cols 4) */}
            <div
              onClick={() => {
                if (isProbeActive && onProbeComponent) {
                  onProbeComponent(
                    "Main Earthing Terminal (MET)",
                    0,
                    metrics.leakageCurrent / 1000,
                    `Protective Earth ground loop resistance: ${groundingQuality === "EXCELLENT" ? "1.8 Ω" : "38 Ω"}`
                  );
                } else {
                  setInspectedItem({
                    title: "Main Earthing Terminal (MET) Busbar",
                    type: "Protective Earth (PE) Distribution Bar",
                    status: groundingQuality,
                    details:
                      "Solid copper/brass bar providing equipotential bonding. Connects all circuit earth wires (green/yellow) to the external earth ground rod buried in soil.",
                    specs: `Grounding Status: ${groundingQuality} | Earth Loop Impedance: ${
                      groundingQuality === "EXCELLENT" ? "< 2 Ω (Safe)" : "> 30 Ω (High Resistance)"
                    }`,
                  });
                }
              }}
              className="sm:col-span-4 p-3 rounded-xl border border-slate-700 bg-slate-800/90 flex flex-col justify-between cursor-pointer hover:border-emerald-500/80 transition-all shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 font-bold flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Earth Ground Bar</span>
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                    groundingQuality === "EXCELLENT"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-red-950 text-red-400 border border-red-800"
                  }`}
                >
                  {groundingQuality}
                </span>
              </div>

              {/* Brass Screw Terminal Visual */}
              <div className="my-2 h-14 bg-amber-900/30 rounded-lg border border-amber-700/50 flex items-center justify-around px-2">
                {[1, 2, 3, 4, 5, 6].map((screw) => (
                  <div key={screw} className="flex flex-col items-center">
                    <div className="w-2 h-2 rounded-full bg-amber-400 border border-amber-800" />
                    <div className="w-1 h-6 bg-emerald-500 rounded-b mt-0.5" />
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-slate-400 flex items-center justify-between">
                <span>Earth Rod Bond</span>
                <span className="text-emerald-400 font-mono">
                  {groundingQuality === "EXCELLENT" ? "< 2 Ω" : "38 Ω"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* LOWER DIN RAIL: Branch Miniature Circuit Breakers (MCBs B1–B4) */}
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 font-mono uppercase tracking-wider">
            <span>Branch Circuit Breakers (DIN Rail Type B MCBs)</span>
            <span>Click any breaker toggle handle to isolate or energize</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {branchData.map((item) => {
              const {
                circuit,
                index,
                currentA,
                activeWatts,
                activeAppsCount,
                loadPercent,
                isOverheated,
                isNearCapacity,
                isTripped,
              } = item;

              return (
                <div
                  key={circuit.id}
                  onClick={() => {
                    if (isProbeActive && onProbeComponent) {
                      onProbeComponent(
                        `Breaker B${index} (${circuit.name})`,
                        isTripped ? 0 : metrics.voltage,
                        currentA,
                        `Rating: ${circuit.breakerRating}A | Active Draw: ${currentA.toFixed(1)}A (${activeWatts}W)`
                      );
                    } else {
                      setInspectedItem({
                        title: `Branch Breaker B${index} (${circuit.name})`,
                        type: `Miniature Circuit Breaker (MCB Type B ${circuit.breakerRating}A)`,
                        status: isTripped ? "OPEN / TRIPPED" : "CLOSED / ENERGIZED",
                        details: `Protects ${circuit.name} wiring from overcurrent thermal damage. Dual tripping mechanisms: bimetallic strip for sustained thermal overloads, and electromagnetic coil for instantaneous short circuits.`,
                        specs: `Rating: ${circuit.breakerRating}A | Active: ${currentA.toFixed(1)}A (${activeWatts}W) | Conductor: ${circuit.wireGauge} (${circuit.wireCondition})`,
                      });
                    }
                  }}
                  className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all cursor-pointer relative ${
                    isTripped
                      ? "bg-red-950/30 border-red-500/80 text-red-200"
                      : isOverheated
                      ? "bg-amber-950/40 border-amber-500 text-amber-200"
                      : "bg-slate-800/90 border-slate-700 text-slate-200 hover:border-blue-400 shadow-sm"
                  }`}
                >
                  {/* Top Breaker Identifier & Amp Rating */}
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: circuit.color }}
                      />
                      <span className="text-xs font-bold text-white font-mono">B{index}</span>
                      <span className="text-[11px] font-semibold text-slate-300 truncate max-w-[90px]">
                        {circuit.name.split("-")[1]?.trim() || circuit.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-700 text-slate-200 font-bold">
                      {circuit.breakerRating}A
                    </span>
                  </div>

                  {/* Breaker Switch Mechanical Graphic */}
                  <div className="my-2 flex items-center justify-between bg-slate-900/80 p-2 rounded-lg border border-slate-800">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleBreaker(circuit.id);
                      }}
                      className={`w-8 h-13 rounded-md p-1 flex flex-col justify-between transition-colors cursor-pointer ${
                        isTripped ? "bg-slate-700" : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                      title={isTripped ? "Click to switch Breaker ON" : "Click to switch Breaker OFF"}
                    >
                      <div
                        className={`w-6 h-5 rounded bg-white shadow-md transform transition-transform duration-200 flex items-center justify-center text-[9px] font-black ${
                          isTripped
                            ? "translate-y-6 bg-slate-300 text-slate-700"
                            : "translate-y-0 text-emerald-700"
                        }`}
                      >
                        {isTripped ? "OFF" : "ON"}
                      </div>
                    </button>

                    <div className="text-right">
                      <span className="font-mono font-bold text-xs sm:text-sm block text-white">
                        {currentA.toFixed(1)} A
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider ${
                          isTripped
                            ? "text-red-400"
                            : isOverheated
                            ? "text-red-400 animate-pulse"
                            : isNearCapacity
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {isTripped
                          ? "TRIPPED"
                          : isOverheated
                          ? "OVERLOAD"
                          : isNearCapacity
                          ? "HEAVY LOAD"
                          : "NORMAL"}
                      </span>
                    </div>
                  </div>

                  {/* Load Percentage Progress Bar */}
                  <div className="mt-1">
                    <div className="flex justify-between text-[9px] font-mono text-slate-400 mb-1">
                      <span>Load Capacity</span>
                      <span
                        className={
                          loadPercent > 100
                            ? "text-red-400 font-bold"
                            : loadPercent > 80
                            ? "text-amber-400"
                            : "text-slate-400"
                        }
                      >
                        {Math.round(loadPercent)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          loadPercent > 100
                            ? "bg-red-500 animate-pulse"
                            : loadPercent > 80
                            ? "bg-amber-400"
                            : "bg-emerald-400"
                        }`}
                        style={{ width: `${Math.min(100, loadPercent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer status info */}
                  <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>{activeAppsCount} loads active</span>
                    <span>{activeWatts} W</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Component Diagnostic Inspector Drawer */}
      {inspectedItem && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-800 border border-slate-700 text-xs animate-in fade-in">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                Component Diagnostic Inspector
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">{inspectedItem.title}</h4>
              <p className="text-slate-300 mt-1 leading-relaxed">{inspectedItem.details}</p>
              <div className="mt-2 text-[11px] font-mono text-blue-300 bg-slate-900/80 p-2 rounded border border-slate-800">
                {inspectedItem.specs}
              </div>
            </div>
            <button
              onClick={() => setInspectedItem(null)}
              className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700 cursor-pointer ml-3"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
