import React from "react";
import { useSimulation } from "../../context/SimulationContext";
import {
  Flame,
  ShieldAlert,
  CheckCircle2,
  Power,
  RotateCcw,
  Sparkles,
  Zap,
} from "lucide-react";

export const QuickExperimentBar: React.FC = () => {
  const {
    appliances,
    circuits,
    metrics,
    protectionState,
    resetProtection,
    toggleMasterSwitch,
    assignApplianceCircuit,
    toggleAppliance,
    toggleApplianceFault,
    addSimulationEvent,
    playSound,
  } = useSimulation();

  // 1. Experiment: Overload Kitchen
  const handleOverloadKitchen = () => {
    // Ensure breaker is closed
    resetProtection();
    // Turn on heavy kitchen appliances on circuit 2
    appliances.forEach((a) => {
      if (a.room === "kitchen" || a.name.toLowerCase().includes("microwave") || a.name.toLowerCase().includes("heater")) {
        assignApplianceCircuit(a.id, "circuit_2");
        if (!a.isOn) toggleAppliance(a.id);
      }
    });
    addSimulationEvent(
      "Experiment: Kitchen Overload Triggered",
      "warning",
      "Loaded Microwave, Refrigerator, and Heaters onto Circuit 2. Active draw exceeds 22A on a 16A breaker.",
      "circuit_2",
      "Observe the B2 breaker load meter climb past 100%. The simulated bimetallic strip will trip the breaker to prevent conductor overheating."
    );
    playSound("warning");
  };

  // 2. Experiment: Ground Fault Shock Hazard
  const handleGroundFaultExperiment = () => {
    resetProtection();
    const app = appliances.find(
      (a) => a.room === "kitchen" || a.room === "garage_utility"
    ) || appliances[0];

    if (app) {
      if (!app.isOn) toggleAppliance(app.id);
      if (!app.isFaulty) toggleApplianceFault(app.id);
    }

    addSimulationEvent(
      "Experiment: 28mA Ground Leakage Injected",
      "trip",
      `Injected 28mA chassis fault on ${app?.name || "appliance"}. Testing residual current detection.`,
      app?.circuitId,
      "The RCCB senses current imbalance (I_live != I_neutral) and trips instantly, safeguarding against electric shock."
    );
    playSound("trip");
  };

  // 3. Experiment: Safe Balanced Load
  const handleBalancedLoad = () => {
    resetProtection();
    appliances.forEach((a) => {
      if (a.isFaulty) toggleApplianceFault(a.id);
      // Turn on moderate appliances
      if (a.nominalWatts <= 600 && !a.isOn) toggleAppliance(a.id);
      if (a.nominalWatts > 1500 && a.isOn) toggleAppliance(a.id);
    });
    addSimulationEvent(
      "Experiment: Balanced Load Applied",
      "fix",
      "Rebalanced household loads across all 4 branch circuits. All branch currents below 45% capacity.",
      undefined,
      "Safe electrical design ensures continuous loads do not exceed 80% of any circuit's breaker ampacity."
    );
    playSound("success");
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center space-x-2">
        <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
            Instant Interactive Experiments
          </span>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Click any test to watch real electrical physics (overloads, trips, ground faults) in action:
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleOverloadKitchen}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
          title="Turn on multiple high-draw devices in the kitchen to trip Breaker 2"
        >
          <Flame className="w-3.5 h-3.5 text-amber-600" />
          <span>⚡ Overload Kitchen (Trip B2)</span>
        </button>

        <button
          onClick={handleGroundFaultExperiment}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-300 flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
          title="Inject 28mA chassis leakage to test RCD trip"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
          <span>🧲 Ground Fault (Test RCD)</span>
        </button>

        <button
          onClick={handleBalancedLoad}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
          title="Restore safe, balanced usage across all circuits"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>💡 Balanced Load</span>
        </button>

        <button
          onClick={toggleMasterSwitch}
          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs ${
            protectionState === "DISCONNECTED"
              ? "bg-slate-900 text-white border-slate-900"
              : "bg-red-50 hover:bg-red-100 text-red-900 border-red-300"
          }`}
          title="Toggle whole-house 100A master switch"
        >
          <Power className="w-3.5 h-3.5 text-red-600" />
          <span>{protectionState === "DISCONNECTED" ? "Restore Mains" : "🛑 Master Cutout"}</span>
        </button>

        <button
          onClick={resetProtection}
          className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 flex items-center space-x-1.5 cursor-pointer transition-colors shadow-2xs"
          title="Reset all tripped breakers and RCD"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
          <span>🔄 Reset All</span>
        </button>
      </div>
    </div>
  );
};
