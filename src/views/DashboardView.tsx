import React, { useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { NavTab } from "../components/layout/Sidebar";
import {
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Home,
  Sliders,
  Activity,
  Bot,
  Zap,
  RotateCcw,
  ArrowRight,
  Flame,
  Droplets,
  Cpu,
  HelpCircle,
  Compass,
  CheckCircle2,
} from "lucide-react";
import { SafetyGauge } from "../components/ui/SafetyGauge";
import { EventLogDrawer } from "../components/ui/EventLogDrawer";
import { HowToUseModal } from "../components/ui/HowToUseModal";

interface DashboardViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const {
    metrics,
    activeScenario,
    circuits,
    appliances,
    protectionState,
    resetProtection,
    diagnosticIssues,
    events,
  } = useSimulation();

  const activeAppliancesCount = appliances.filter((a) => a.isOn).length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner / Welcome with Scenario Alert */}
      {activeScenario ? (
        <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
              #{activeScenario.number}
            </div>
            <div>
              <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                Active Guided Scenario
              </span>
              <h3 className="text-base font-bold text-purple-950">{activeScenario.title}</h3>
              <p className="text-xs text-purple-800/80">{activeScenario.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate("safecircuit_ai")}
              className="px-3.5 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            >
              <span>View AI Diagnostics</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Primary Overview Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: System Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              System Status
            </span>
            <div className="flex items-center space-x-2 mt-1">
              {metrics.safetyLevel === "SAFE" && (
                <>
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <span className="text-xl font-bold text-emerald-700">Normal</span>
                </>
              )}
              {metrics.safetyLevel === "WARNING" && (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <span className="text-xl font-bold text-amber-700">Attention</span>
                </>
              )}
              {metrics.safetyLevel === "CRITICAL" && (
                <>
                  <AlertOctagon className="w-6 h-6 text-red-600" />
                  <span className="text-xl font-bold text-red-700">Critical Fault</span>
                </>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
            {metrics.safetyLevel === "SAFE"
              ? "All parameters within simulated bounds"
              : metrics.safetyLevel === "WARNING"
              ? "Elevated load or grounding variation"
              : "Protection trip or threshold hazard"}
          </p>
        </div>

        {/* Card 2: Active Warnings */}
        <div
          onClick={() => onNavigate("safecircuit_ai")}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-300 transition-colors cursor-pointer group"
        >
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Active Warnings
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span
                className={`text-3xl font-extrabold ${
                  diagnosticIssues.length > 0 ? "text-amber-600" : "text-slate-700"
                }`}
              >
                {diagnosticIssues.length}
              </span>
              <span className="text-xs text-slate-500">detected by AI</span>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-blue-600 font-semibold mt-3 pt-3 border-t border-slate-100 group-hover:translate-x-0.5 transition-transform">
            <span>Inspect AI Diagnostics</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Card 3: Protection Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Protection
            </span>
            <div className="flex items-center space-x-2 mt-1">
              {protectionState === "ARMED" ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xl font-bold text-slate-800">Enabled</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                  <span className="text-xl font-bold text-red-600">Tripped / Cut</span>
                </>
              )}
            </div>
          </div>
          {protectionState === "TRIPPED" ? (
            <button
              onClick={resetProtection}
              className="mt-3 pt-2 text-xs font-bold text-red-600 hover:text-red-700 flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulation Protection</span>
            </button>
          ) : (
            <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100">
              MCBs and RCCB armed
            </p>
          )}
        </div>

        {/* Card 4: Simulation Ready */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Simulation
            </span>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-xl font-bold text-slate-800">Ready</span>
              <span className="text-xs text-slate-500 font-mono">({metrics.voltage} V)</span>
            </div>
          </div>
          <div className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
            <span>{activeAppliancesCount} / {appliances.length} active devices</span>
            <span className="font-semibold text-slate-700">{metrics.totalWatts} W</span>
          </div>
        </div>
      </div>

      {/* Middle Section: Central Gauge + House Electrical Status Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Central Safety Gauge */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Simulated Risk Level
          </span>
          <SafetyGauge level={metrics.safetyLevel} size="md" />

          <div className="grid grid-cols-2 gap-3 w-full mt-4 pt-4 border-t border-slate-100 text-center text-xs">
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 block">Total Current</span>
              <strong className="text-slate-800 text-sm">{metrics.current} A</strong>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <span className="text-slate-400 block">Max Conductor Temp</span>
              <strong
                className={`text-sm ${
                  metrics.wireTemperature > 60 ? "text-red-600" : "text-slate-800"
                }`}
              >
                {metrics.wireTemperature} °C
              </strong>
            </div>
          </div>
        </div>

        {/* Current House Status Card */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">Current House Status</h3>
                <p className="text-xs text-slate-500">Live summary of the residential branch circuits</p>
              </div>
              <button
                onClick={() => onNavigate("virtual_house")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1 cursor-pointer"
              >
                <span>Open Virtual House</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Branch Circuits Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {circuits.map((c) => {
                const cApps = appliances.filter((a) => a.circuitId === c.id && a.isOn);
                const cWatts = cApps.reduce((s, a) => s + a.nominalWatts, 0);
                const cCurrent = cWatts / metrics.voltage;
                const loadPercent = Math.min(100, (cCurrent / c.breakerRating) * 100);

                return (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      c.isBreakerTripped
                        ? "bg-red-50/50 border-red-200 text-red-900"
                        : loadPercent > 85
                        ? "bg-amber-50/50 border-amber-200 text-amber-900"
                        : "bg-slate-50 border-slate-200/80 text-slate-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold truncate max-w-[170px]">{c.name}</span>
                      <span className="text-[11px] font-mono font-semibold">
                        {cCurrent.toFixed(1)} / {c.breakerRating} A
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden my-1.5">
                      <div
                        className={`h-full transition-all duration-300 ${
                          c.isBreakerTripped
                            ? "bg-red-500"
                            : loadPercent > 85
                            ? "bg-amber-500"
                            : "bg-blue-600"
                        }`}
                        style={{ width: `${loadPercent}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{cApps.length} active appliance{cApps.length === 1 ? "" : "s"}</span>
                      <span>
                        {c.isBreakerTripped ? (
                          <strong className="text-red-600 font-bold">TRIPPED</strong>
                        ) : (
                          `${cWatts} W`
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center space-x-3">
              <span>Grounding: <strong>{useSimulation().groundingQuality}</strong></span>
              <span>•</span>
              <span>Voltage: <strong>{metrics.voltageStability}</strong></span>
            </div>
            <button
              onClick={() => onNavigate("circuit_lab")}
              className="text-blue-600 font-semibold hover:underline cursor-pointer"
            >
              Modify in Circuit Lab →
            </button>
          </div>
        </div>
      </div>

      {/* Interactive How to Use SafeCircuit Quick Start Guide Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden border border-blue-800/40">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[10px] font-black uppercase tracking-wider">
                Beginner & Student Guide
              </span>
              <span className="text-xs text-slate-300 font-semibold">•</span>
              <span className="text-xs text-slate-300">How to Navigate SafeCircuit</span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
              How to Use SafeCircuit: 5-Step Electrical Workflow
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Explore how residential electricity works safely without physical danger. Follow the cycle:
              <strong className="text-white"> Configure loads → Tune electrical parameters → Monitor waveforms → Inspect AI root causes → Apply simulated fixes.</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsHowToUseOpen(true)}
              className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Full Interactive Guide</span>
            </button>
            <button
              onClick={() => onNavigate("challenge_scenarios")}
              className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Compass className="w-4 h-4 text-purple-300" />
              <span>Try Guided Challenges</span>
            </button>
          </div>
        </div>

        {/* 5 Quick Step Pills */}
        <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <button
            onClick={() => onNavigate("virtual_house")}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] font-mono text-blue-300 font-bold block mb-1">STEP 1</span>
            <strong className="text-xs font-bold text-white block group-hover:text-blue-300 transition-colors">Virtual House</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Toggle appliances & balance room loads</span>
          </button>

          <button
            onClick={() => onNavigate("circuit_lab")}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] font-mono text-emerald-300 font-bold block mb-1">STEP 2</span>
            <strong className="text-xs font-bold text-white block group-hover:text-emerald-300 transition-colors">Circuit Lab</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Configure breakers, wire gauge & RCCBs</span>
          </button>

          <button
            onClick={() => onNavigate("live_simulation")}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] font-mono text-amber-300 font-bold block mb-1">STEP 3</span>
            <strong className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">Live Simulation</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Inspect AC waveforms & heat telemetry</span>
          </button>

          <button
            onClick={() => onNavigate("safecircuit_ai")}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group"
          >
            <span className="text-[10px] font-mono text-purple-300 font-bold block mb-1">STEP 4</span>
            <strong className="text-xs font-bold text-white block group-hover:text-purple-300 transition-colors">SafeCircuit AI</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">Automated diagnoses & 1-click fixes</span>
          </button>

          <button
            onClick={() => onNavigate("challenge_scenarios")}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left transition-colors cursor-pointer group col-span-2 sm:col-span-1"
          >
            <span className="text-[10px] font-mono text-pink-300 font-bold block mb-1">STEP 5</span>
            <strong className="text-xs font-bold text-white block group-hover:text-pink-300 transition-colors">Challenges</strong>
            <span className="text-[11px] text-slate-400 block mt-0.5">6 guided scenarios with verification</span>
          </button>
        </div>
      </div>

      {/* Quick Access Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Virtual House */}
        <div
          onClick={() => onNavigate("virtual_house")}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0 group-hover:scale-105 transition-transform">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                Virtual House
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Explore the 2D interactive floor plan. Drag appliances between rooms, switch loads on/off, and inspect electrical current paths.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-blue-600 group-hover:translate-x-1 transition-transform">
            <span>Explore Floor Plan →</span>
          </div>
        </div>

        {/* Card 2: Circuit Lab */}
        <div
          onClick={() => onNavigate("circuit_lab")}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-105 transition-transform">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                Circuit Lab
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Configure simulated parameters: wire gauges, conductor age, breaker amperage, RCCB/RCBO devices, and grounding quality.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-emerald-600 group-hover:translate-x-1 transition-transform">
            <span>Configure Parameters →</span>
          </div>
        </div>

        {/* Card 3: Live Simulation */}
        <div
          onClick={() => onNavigate("live_simulation")}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-purple-400 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group"
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                Live Simulation
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Watch animated electrical waveforms, monitor dynamic temperature/current gauges, and test automatic simulated protection.
              </p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs font-semibold text-purple-600 group-hover:translate-x-1 transition-transform">
            <span>Launch Live Meters →</span>
          </div>
        </div>
      </div>

      {/* Collapsible Real-Time Event Log */}
      <EventLogDrawer events={events} isOpenDefault={false} />

      {/* Interactive Guide Modal */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
        onNavigate={onNavigate}
      />
    </div>
  );
};
