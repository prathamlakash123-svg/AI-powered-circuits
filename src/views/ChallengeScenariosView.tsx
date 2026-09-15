import React, { useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { CHALLENGE_SCENARIOS } from "../data/simulationData";
import { ChallengeScenario } from "../types/simulation";
import { NavTab } from "../components/layout/Sidebar";
import {
  Compass,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Layers,
  Wrench,
  HelpCircle,
  ShieldCheck,
  Zap,
} from "lucide-react";

interface ChallengeScenariosViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const ChallengeScenariosView: React.FC<ChallengeScenariosViewProps> = ({ onNavigate }) => {
  const {
    activeScenario,
    loadScenario,
    clearScenario,
    applySimulatedFix,
    diagnosticIssues,
    protectionState,
    resetProtection,
  } = useSimulation();

  const [selectedScenario, setSelectedScenario] = useState<ChallengeScenario>(
    activeScenario || CHALLENGE_SCENARIOS[0]
  );
  const [activeStep, setActiveStep] = useState<number>(0);
  const [hasAppliedFix, setHasAppliedFix] = useState<boolean>(false);

  const steps = [
    { title: "1. Start Scenario", desc: "Inject baseline simulated conditions" },
    { title: "2. Observe Symptoms", desc: "Watch gauges, telemetry & waveforms" },
    { title: "3. Diagnose Issue", desc: "Inspect SafeCircuit AI analysis" },
    { title: "4. Apply Simulated Changes", desc: "Apply corrective configuration" },
    { title: "5. Re-run Verification", desc: "Confirm safe operating state" },
  ];

  const handleLaunchScenario = (sc: ChallengeScenario) => {
    setSelectedScenario(sc);
    loadScenario(sc.id);
    setActiveStep(1); // Move to observe step
    setHasAppliedFix(false);
  };

  const handleApplyFix = () => {
    if (selectedScenario.fixAction) {
      applySimulatedFix(selectedScenario.fixAction);
    } else {
      applySimulatedFix(selectedScenario.id);
    }
    setHasAppliedFix(true);
    setActiveStep(4); // Move to Re-run verification step
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Compass className="w-5 h-5 text-purple-600" />
            <span>Guided Electrical Safety Scenarios</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Exploratory simulation cases modeling household faults, conductor heating, and protection mechanics.
          </p>
        </div>

        {activeScenario && (
          <button
            onClick={() => {
              clearScenario();
              setHasAppliedFix(false);
              setActiveStep(0);
            }}
            className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Exit Active Scenario</span>
          </button>
        )}
      </div>

      {/* Scenario Selection Grid (6 Pre-built Scenarios) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHALLENGE_SCENARIOS.map((sc) => {
          const isActive = activeScenario?.id === sc.id;

          return (
            <div
              key={sc.id}
              onClick={() => setSelectedScenario(sc)}
              className={`bg-white rounded-xl border p-4 shadow-xs transition-all cursor-pointer flex flex-col justify-between ${
                isActive
                  ? "border-purple-400 ring-2 ring-purple-500/20 bg-purple-50/20"
                  : selectedScenario.id === sc.id
                  ? "border-blue-400 bg-blue-50/10"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                    Scenario #{sc.number}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white animate-pulse">
                      Active
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold text-slate-900 leading-snug">{sc.title}</h4>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">{sc.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {sc.circuitId ? "Branch Isolated" : "Panel Wide"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunchScenario(sc);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors ${
                    isActive
                      ? "bg-purple-600 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white"
                  }`}
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isActive ? "Restart" : "Start"}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Step-by-Step Flow for Selected Scenario */}
      {selectedScenario && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">
                  Scenario #{selectedScenario.number}
                </span>
                <span className="text-slate-300">•</span>
                <span className="text-xs text-slate-500 font-medium">
                  {selectedScenario.subtitle}
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mt-0.5">{selectedScenario.title}</h3>
            </div>

            <button
              onClick={() => handleLaunchScenario(selectedScenario)}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-purple-600/30 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Load Simulation State</span>
            </button>
          </div>

          {/* 5-Step Progress Timeline */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {steps.map((st, idx) => (
              <div
                key={idx}
                onClick={() => setActiveStep(idx)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  activeStep === idx
                    ? "bg-purple-50 border-purple-300 ring-1 ring-purple-400 font-semibold"
                    : idx < activeStep
                    ? "bg-slate-50 border-slate-200 text-slate-700"
                    : "bg-slate-50/50 border-slate-200/60 text-slate-400"
                }`}
              >
                <div className="flex items-center space-x-1 text-xs mb-1">
                  {idx < activeStep ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded-full border border-current flex items-center justify-center text-[9px]">
                      {idx + 1}
                    </span>
                  )}
                  <span className="text-[11px] truncate">{st.title.split(".")[1]}</span>
                </div>
                <p className="text-[10px] text-slate-500 line-clamp-1">{st.desc}</p>
              </div>
            ))}
          </div>

          {/* Step Detail Content */}
          <div className="bg-slate-50 rounded-xl p-5 border border-slate-200/80 space-y-4">
            {activeStep === 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Initial Starting Condition:
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
                  {selectedScenario.initialCondition}
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => handleLaunchScenario(selectedScenario)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 cursor-pointer"
                  >
                    <span>Proceed to Observe →</span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === 1 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Observable Symptoms in Simulation:
                </h4>
                <div className="space-y-2">
                  {selectedScenario.symptoms.map((sym, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex items-start space-x-2 text-xs text-slate-700"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>{sym}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate("live_simulation")}
                    className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Check Live Meters & Waveform →
                  </button>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    Diagnose with AI →
                  </button>
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  SafeCircuit AI Diagnostic Analysis:
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200">
                  {selectedScenario.aiDiagnosis}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate("safecircuit_ai")}
                    className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                  >
                    Open Full AI Diagnostic Assistant →
                  </button>
                  <button
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    View Fix Solutions →
                  </button>
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Available Simulated Solutions:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                  {selectedScenario.solutionOptions.map((sol, i) => (
                    <div
                      key={i}
                      className="p-3 bg-white rounded-lg border border-slate-200 flex items-center space-x-2 text-xs text-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{sol}</span>
                    </div>
                  ))}
                </div>

                <div className="p-3.5 bg-purple-50 rounded-xl border border-purple-200 flex items-center justify-between">
                  <div>
                    <strong className="text-xs text-purple-950 block">Ready to apply fix?</strong>
                    <span className="text-[11px] text-purple-800">
                      SafeCircuit will update circuit configurations and re-test conductor parameters.
                    </span>
                  </div>
                  <button
                    onClick={handleApplyFix}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    <span>Apply Simulated Fix</span>
                  </button>
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div>
                <div className="flex items-center space-x-2 text-emerald-700 font-bold text-sm mb-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>Simulated Remediation Applied</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-200 mb-4">
                  {selectedScenario.resultAfterFix}
                </p>

                {protectionState === "TRIPPED" && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 flex items-center justify-between text-xs text-red-900 mb-4">
                    <span>Protection was previously tripped during the fault.</span>
                    <button
                      onClick={resetProtection}
                      className="px-3 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 cursor-pointer"
                    >
                      Reset Protection Breakers
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleLaunchScenario(selectedScenario)}
                    className="text-slate-600 hover:underline cursor-pointer"
                  >
                    Re-run from Beginning
                  </button>
                  <button
                    onClick={() => onNavigate("live_simulation")}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer"
                  >
                    Verify on Live Meters →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
