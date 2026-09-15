import React, { useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import {
  BreakerRating,
  CircuitId,
  GroundingQuality,
  PanelType,
  VoltageStability,
  WireCondition,
  WireGauge,
} from "../types/simulation";
import {
  Sliders,
  Info,
  ShieldAlert,
  Zap,
  Activity,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
} from "lucide-react";
import { InfoModal } from "../components/ui/InfoModal";
import { ElectricalPanelView } from "./ElectricalPanelView";

export const CircuitLabView: React.FC = () => {
  const {
    circuits,
    updateCircuit,
    groundingQuality,
    setGroundingQuality,
    panelType,
    setPanelType,
    voltageStability,
    setVoltageStability,
    resetToDefaults,
  } = useSimulation();

  const [activeCircuitId, setActiveCircuitId] = useState<CircuitId>("circuit_1");
  const [activeInfoTopic, setActiveInfoTopic] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"parameters" | "panel">("parameters");

  const selectedCircuit = circuits.find((c) => c.id === activeCircuitId) || circuits[0];

  const breakerOptions: BreakerRating[] = [10, 16, 20, 32];
  const wireGaugeOptions: { id: WireGauge; label: string; desc: string }[] = [
    { id: "14_AWG", label: "14 AWG (2.08 mm²)", desc: "Standard light duty (up to 15A)" },
    { id: "12_AWG", label: "12 AWG (3.31 mm²)", desc: "Standard residential outlets (up to 20A)" },
    { id: "10_AWG", label: "10 AWG (5.26 mm²)", desc: "Heavy kitchen & AC units (up to 30A)" },
    { id: "8_AWG", label: "8 AWG (8.37 mm²)", desc: "Subpanel feeder / range stoves (up to 40A)" },
  ];

  const wireConditionOptions: { id: WireCondition; label: string; risk: string }[] = [
    { id: "NEW", label: "Brand New (Low Resistance)", risk: "Zero thermal degradation" },
    { id: "GOOD", label: "Good (Standard Service)", risk: "Normal copper resistance" },
    { id: "AGED", label: "Aged (15+ Years)", risk: "Mild thermal resistance increase" },
    { id: "DEGRADED", label: "Degraded / Brittle (Severe Risk)", risk: "High resistance & hotspot heating" },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Sub-navigation tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab("parameters")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === "parameters"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Circuit Parameters Lab</span>
          </button>
          <button
            onClick={() => setActiveSubTab("panel")}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === "panel"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>2D Electrical Panel</span>
          </button>
        </div>

        <button
          onClick={resetToDefaults}
          className="flex items-center space-x-1.5 px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Lab Defaults</span>
        </button>
      </div>

      {activeSubTab === "panel" ? (
        <ElectricalPanelView />
      ) : (
        <>
          {/* Circuit Selector Row */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Branch Circuit to Configure
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {circuits.map((c) => {
                const isSelected = c.id === activeCircuitId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCircuitId(c.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2 mb-1">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span className="text-xs font-bold text-slate-900 truncate">{c.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>{c.breakerRating}A Breaker</span>
                      <span>{c.wireGauge.replace("_", " ")}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Configuration Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Branch Specific Controls (Breaker, Wire Gauge, Age, Protection) */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: selectedCircuit.color }}
                  />
                  <span>Configuring {selectedCircuit.name}</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Simulation parameters directly affect heat dissipation and trip times.
                </p>
              </div>

              {/* 1. Breaker Rating */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Simulated Breaker Rating
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("breakerRating")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                      title="What is this?"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-mono font-bold text-blue-600">
                    {selectedCircuit.breakerRating} Amperes
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {breakerOptions.map((rating) => (
                    <button
                      key={rating}
                      onClick={() => updateCircuit(selectedCircuit.id, { breakerRating: rating })}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedCircuit.breakerRating === rating
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {rating}A
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Wire Gauge */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Simulated Conductor Wire Gauge
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("wireGauge")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {selectedCircuit.wireGauge.replace("_", " ")}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {wireGaugeOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateCircuit(selectedCircuit.id, { wireGauge: opt.id })}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        selectedCircuit.wireGauge === opt.id
                          ? "bg-blue-50 border-blue-400 text-blue-900 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span>{opt.label}</span>
                        <span className="text-[11px] text-slate-500 block font-normal">
                          {opt.desc}
                        </span>
                      </div>
                      {selectedCircuit.wireGauge === opt.id && (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Wire Age & Condition */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Wire Age & Insulation Condition
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("wireCondition")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      selectedCircuit.wireCondition === "DEGRADED"
                        ? "text-red-600"
                        : selectedCircuit.wireCondition === "AGED"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {selectedCircuit.wireCondition}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {wireConditionOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => updateCircuit(selectedCircuit.id, { wireCondition: opt.id })}
                      className={`p-2 rounded-lg border text-left text-xs transition-colors cursor-pointer ${
                        selectedCircuit.wireCondition === opt.id
                          ? "bg-slate-900 text-white border-slate-900 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span className="block font-medium">{opt.label.split("(")[0]}</span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {opt.risk}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Residual Current Safety Device (RCCB / RCBO) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Simulated Earth Leakage Device (RCCB/RCBO)
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("rccb")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      updateCircuit(selectedCircuit.id, {
                        hasRCCB: !selectedCircuit.hasRCCB,
                      })
                    }
                    className={`flex-1 py-2 px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center space-x-2 ${
                      selectedCircuit.hasRCCB
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                        : "bg-slate-100 border-slate-200 text-slate-500"
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>RCCB (30mA Protection): {selectedCircuit.hasRCCB ? "ACTIVE" : "NONE"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: Global Panel & Grid Environment Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span>Main Distribution Board & Supply Environment</span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  System-wide conditions including grounding quality and voltage waveforms.
                </p>
              </div>

              {/* 1. Grounding Quality */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Simulated Grounding / Earthing Quality
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("groundingQuality")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span
                    className={`text-xs font-bold ${
                      groundingQuality === "EXCELLENT"
                        ? "text-emerald-600"
                        : groundingQuality === "DEGRADED"
                        ? "text-amber-600"
                        : "text-red-600"
                    }`}
                  >
                    {groundingQuality}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  {(
                    [
                      { id: "EXCELLENT", label: "Excellent (< 2 Ω resistance)", desc: "Solid copper ground rod in moist earth" },
                      { id: "DEGRADED", label: "Degraded (35 Ω resistance)", desc: "Loose clamp or dry corroded soil" },
                      { id: "DISCONNECTED", label: "Disconnected / Broken (> 1000 Ω)", desc: "High touch-voltage shock hazard" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setGroundingQuality(opt.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        groundingQuality === opt.id
                          ? "bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span>{opt.label}</span>
                        <span className="text-[11px] text-slate-500 block">{opt.desc}</span>
                      </div>
                      {groundingQuality === opt.id && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Panel Condition */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Electrical Panel Architecture
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("panelType")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  {(
                    [
                      { id: "MODERN_SPLIT", label: "Modern Split-Load Dual RCD Consumer Unit", desc: "Meets latest international safety codes" },
                      { id: "STANDARD_CONSUMER", label: "Standard Consumer Unit", desc: "Individual MCBs with single main RCD" },
                      { id: "OBSOLETE_FUSEBOX", label: "Obsolete Rewireable Fuse Box", desc: "No residual current protection, slow clearance" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setPanelType(opt.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-colors cursor-pointer ${
                        panelType === opt.id
                          ? "bg-blue-50 border-blue-400 text-blue-950 font-semibold"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <div>
                        <span>{opt.label}</span>
                        <span className="text-[11px] text-slate-500 block">{opt.desc}</span>
                      </div>
                      {panelType === opt.id && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Voltage Stability Mode */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-1.5">
                    <label className="text-xs font-bold text-slate-800">
                      Supply Voltage Stability
                    </label>
                    <button
                      onClick={() => setActiveInfoTopic("voltageStability")}
                      className="text-slate-400 hover:text-blue-600 p-0.5"
                    >
                      <Info className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(
                    [
                      { id: "STABLE", label: "Stable (Pure 230V)" },
                      { id: "FLUCTUATING", label: "Fluctuating (±12V)" },
                      { id: "SEVERE_VARIATION", label: "Severe Variation (±28V)" },
                      { id: "ARC_FAULT", label: "Arc-Fault Noise" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setVoltageStability(opt.id)}
                      className={`p-2 rounded-lg border text-center transition-colors cursor-pointer ${
                        voltageStability === opt.id
                          ? "bg-slate-900 text-white border-slate-900 font-semibold"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Info Popover Modal */}
      <InfoModal topicKey={activeInfoTopic} onClose={() => setActiveInfoTopic(null)} />
    </div>
  );
};
