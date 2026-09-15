import React from "react";
import { useSimulation } from "../context/SimulationContext";
import { SafetyGauge } from "../components/ui/SafetyGauge";
import { WaveformCanvas } from "../components/ui/WaveformCanvas";
import { DiagnosticMapView } from "./DiagnosticMapView";
import { EventLogDrawer } from "../components/ui/EventLogDrawer";
import {
  Activity,
  Zap,
  Flame,
  Droplets,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
  Sparkles,
  Layers,
  Thermometer,
  Gauge,
  Power,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";

export const LiveSimulationView: React.FC = () => {
  const {
    metrics,
    circuits,
    appliances,
    protectionState,
    resetProtection,
    groundingQuality,
    panelType,
    voltageStability,
    setVoltageStability,
    events,
    toggleAppliance,
    updateCircuit,
    playSound,
  } = useSimulation();

  // Helper quick actions for educational experimentation
  const handleTurnOnHighDraw = () => {
    appliances.forEach((a) => {
      if (a.nominalWatts >= 1000 && !a.isOn) {
        toggleAppliance(a.id);
      }
    });
    playSound("click");
  };

  const handleSimulateArcFault = () => {
    setVoltageStability("ARC_FAULT");
    playSound("warning");
  };

  const handleSimulateLeakage = () => {
    // Set first circuit to have no RCCB and high leakage
    updateCircuit("circuit_2", { hasRCCB: false });
    playSound("warning");
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner with Quick Experimenter Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <span>Live Electrical Telemetry & Diagnostics</span>
          </h3>
          <p className="text-xs text-slate-500">
            Real-time simulated analog meters, oscilloscopic waveforms, and conductor thermal models.
          </p>
        </div>

        {/* Quick Simulation Experiments */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleTurnOnHighDraw}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
            title="Turn on Oven, Heater, and Kettle together"
          >
            <Power className="w-3.5 h-3.5 text-amber-600" />
            <span>Engage High Load</span>
          </button>

          <button
            onClick={handleSimulateArcFault}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold flex items-center space-x-1 cursor-pointer transition-colors"
            title="Inject high-frequency arcing noise"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Simulate Arc Fault</span>
          </button>

          {protectionState === "TRIPPED" && (
            <button
              onClick={resetProtection}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1 cursor-pointer shadow-sm animate-pulse"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Breakers</span>
            </button>
          )}
        </div>
      </div>

      {/* 5 Real-Time Telemetry Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Gauge 1: Voltage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Voltage</span>
            <Zap className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {metrics.voltage}
              </span>
              <span className="text-xs font-semibold text-slate-500">V</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                metrics.voltageStatus === "NORMAL"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800 animate-pulse"
              }`}
            >
              Status: {metrics.voltageStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Nominal target: 230V AC</p>
        </div>

        {/* Gauge 2: Total Current */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Current</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {metrics.current}
              </span>
              <span className="text-xs font-semibold text-slate-500">A</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                metrics.currentStatus === "NORMAL"
                  ? "bg-emerald-100 text-emerald-800"
                  : metrics.currentStatus === "HIGH"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800 animate-pulse"
              }`}
            >
              Status: {metrics.currentStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Active service draw</p>
        </div>

        {/* Gauge 3: Conductor Temperature */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Temperature</span>
            <Thermometer className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  metrics.wireTemperature > 65 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {metrics.wireTemperature}
              </span>
              <span className="text-xs font-semibold text-slate-500">°C</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                metrics.temperatureStatus === "NORMAL"
                  ? "bg-emerald-100 text-emerald-800"
                  : metrics.temperatureStatus === "WARM"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800 animate-pulse"
              }`}
            >
              Status: {metrics.temperatureStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Insulation limit: 70°C</p>
        </div>

        {/* Gauge 4: Earth Leakage */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Leakage</span>
            <Droplets className="w-4 h-4 text-cyan-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span
                className={`text-2xl sm:text-3xl font-black font-mono ${
                  metrics.leakageCurrent > 25 ? "text-red-600" : "text-slate-900"
                }`}
              >
                {metrics.leakageCurrent}
              </span>
              <span className="text-xs font-semibold text-slate-500">mA</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 ${
                metrics.leakageStatus === "NORMAL"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-red-100 text-red-800 animate-pulse"
              }`}
            >
              Status: {metrics.leakageStatus}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">RCCB trip threshold: 30mA</p>
        </div>

        {/* Gauge 5: Average Breaker Health */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Breaker Health</span>
            <Gauge className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">
                {metrics.breakerHealthAverage}
              </span>
              <span className="text-xs font-semibold text-slate-500">%</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-1 bg-emerald-100 text-emerald-800">
              Trip Mechanism: OK
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2">Bimetallic contacts</p>
        </div>
      </div>

      {/* Central Risk Gauge + Oscilloscopic Waveform Display */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Risk Gauge */}
        <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col items-center justify-center">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Central Safety Level
          </span>
          <SafetyGauge level={metrics.safetyLevel} size="md" />

          {/* System Environment Sub-table */}
          <div className="w-full mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Grounding Quality:</span>
              <strong className="text-slate-900">{groundingQuality}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Panel Condition:</span>
              <strong className="text-slate-900">{panelType.replace("_", " ")}</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Protection State:</span>
              <strong
                className={protectionState === "ARMED" ? "text-emerald-600" : "text-red-600"}
              >
                {protectionState}
              </strong>
            </div>
          </div>
        </div>

        {/* Dynamic Voltage & Load Waveforms */}
        <div className="lg:col-span-2">
          <WaveformCanvas
            stability={metrics.voltageStability}
            voltage={metrics.voltage}
            current={metrics.current}
            height={200}
          />
        </div>
      </div>

      {/* Real-Time Diagnostic Path Map */}
      <DiagnosticMapView />

      {/* Event Log Drawer */}
      <EventLogDrawer events={events} isOpenDefault={false} />
    </div>
  );
};
