import React from "react";
import { useSimulation } from "../context/SimulationContext";
import {
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Zap,
  Gauge,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Check,
} from "lucide-react";

export const SettingsView: React.FC = () => {
  const { settings, updateSettings, resetToDefaults } = useSimulation();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">Simulation Environment Settings</h3>
          <p className="text-xs text-slate-500">
            Adjust grid supply standard, simulation engine step speed, and accessibility options.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        {/* Nominal Grid Standard */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Grid Nominal Voltage Standard</h4>
              <p className="text-xs text-slate-500">
                Switches between international 230V/50Hz and North American 120V/60Hz standards.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">
              {settings.nominalVoltage} Volts
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {([230, 120] as const).map((volts) => (
              <button
                key={volts}
                onClick={() => updateSettings({ nominalVoltage: volts })}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  settings.nominalVoltage === volts
                    ? "bg-blue-50 border-blue-400 text-blue-950 font-semibold ring-1 ring-blue-400"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div>
                  <span className="text-sm font-bold block">{volts}V System</span>
                  <span className="text-[11px] text-slate-500">
                    {volts === 230 ? "Europe, UK, Australia, India" : "US, Canada, Mexico"}
                  </span>
                </div>
                {settings.nominalVoltage === volts && <Check className="w-4 h-4 text-blue-600" />}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Simulation Speed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Simulation Clock Speed</h4>
              <p className="text-xs text-slate-500">
                Adjust how quickly thermal heating and transient fluctuations resolve.
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-blue-600">
              {settings.simulationSpeed}x Speed
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0.5, 1.0, 2.0].map((speed) => (
              <button
                key={speed}
                onClick={() => updateSettings({ simulationSpeed: speed })}
                className={`py-2.5 px-4 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                  settings.simulationSpeed === speed
                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {speed}x {speed === 0.5 ? "(Slow Motion)" : speed === 1 ? "(Real Time)" : "(Fast)"}
              </button>
            ))}
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Audio Synthesis Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Sound Effects & Breaker Clicks</h4>
            <p className="text-xs text-slate-500">
              Web Audio API tactile acoustic clicks when switching breakers or tripping protection.
            </p>
          </div>

          <button
            onClick={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              settings.soundEnabled
                ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                : "bg-slate-100 border-slate-200 text-slate-500"
            }`}
          >
            {settings.soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Audio Enabled</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-400" />
                <span>Audio Muted</span>
              </>
            )}
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* High Contrast Mode */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900">High Contrast Accessibility</h4>
            <p className="text-xs text-slate-500">
              Reinforces borders and indicators for enhanced readability.
            </p>
          </div>

          <button
            onClick={() => updateSettings({ highContrast: !settings.highContrast })}
            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              settings.highContrast
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {settings.highContrast ? "Active" : "Standard"}
          </button>
        </div>

        <hr className="border-slate-100" />

        {/* Reset All */}
        <div className="pt-2 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-red-600">Reset Entire Simulation</h4>
            <p className="text-xs text-slate-500">
              Restores all circuits, appliances, and settings back to initial factory baseline.
            </p>
          </div>

          <button
            onClick={resetToDefaults}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
