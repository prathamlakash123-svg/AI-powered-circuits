import React, { useState } from "react";
import {
  Menu,
  RotateCcw,
  Play,
  Pause,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Info,
  HelpCircle,
} from "lucide-react";
import { useSimulation } from "../../context/SimulationContext";
import { NavTab } from "./Sidebar";
import { HowToUseModal } from "../ui/HowToUseModal";

interface HeaderProps {
  onToggleMobileMenu: () => void;
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleMobileMenu,
  currentTab,
  onNavigate,
}) => {
  const [isHowToUseOpen, setIsHowToUseOpen] = useState(false);
  const {
    metrics,
    protectionState,
    resetProtection,
    settings,
    updateSettings,
    playSound,
  } = useSimulation();

  const getStatusBadge = () => {
    switch (metrics.safetyLevel) {
      case "SAFE":
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>SYSTEM: SAFE</span>
          </div>
        );
      case "WARNING":
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>SYSTEM: WARNING</span>
          </div>
        );
      case "CRITICAL":
        return (
          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-800 text-xs font-semibold animate-pulse">
            <AlertOctagon className="w-3.5 h-3.5 text-red-600" />
            <span>SYSTEM: CRITICAL</span>
          </div>
        );
    }
  };

  const getPageTitle = () => {
    switch (currentTab) {
      case "physics_circuit":
        return "Interactive Physics Circuit & AI Copilot";
      case "dashboard":
        return "Simulation Overview Dashboard";
      case "circuit_lab":
        return "Circuit Lab - Distribution & Wire Configuration";
      case "live_simulation":
        return "Live Simulation - Real-Time Electrical Diagnostics";
      case "safecircuit_ai":
        return "SafeCircuit AI - Intelligent Fault Diagnostics";
      case "learn":
        return "Learn - Fundamental Electrical Safety Principles";
      case "settings":
        return "Simulation Environment Settings";
      case "safety_disclaimer":
        return "Official Educational Safety Disclaimer";
      default:
        return "Interactive Physics Circuit & AI Copilot";
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Mobile hamburger & title */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onToggleMobileMenu}
            className="p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {getPageTitle()}
            </h2>
            <div className="flex items-center space-x-2 text-xs text-slate-500">
              <span>Household Electrical Safety Simulation</span>
            </div>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Status Badge */}
          <div className="hidden sm:block">{getStatusBadge()}</div>

          {/* Tripped Protection Reset Button */}
          {protectionState === "TRIPPED" && (
            <button
              onClick={resetProtection}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-sm shadow-red-600/30 transition-colors animate-bounce cursor-pointer"
              title="Reset all tripped circuit breakers and reconnect simulated supply"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Protection</span>
            </button>
          )}

          {/* How to Use Guide Button */}
          <button
            onClick={() => {
              setIsHowToUseOpen(true);
              playSound("click");
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
            title="Open Interactive How to Use SafeCircuit Guide"
          >
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">How to Use</span>
          </button>

          {/* Pause / Play */}
          <button
            onClick={() => {
              updateSettings({ isPaused: !settings.isPaused });
              playSound("click");
            }}
            className={`p-2 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
              settings.isPaused
                ? "bg-amber-50 text-amber-700 border-amber-300"
                : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
            }`}
            title={settings.isPaused ? "Resume Simulation" : "Pause Simulation"}
          >
            {settings.isPaused ? <Play className="w-4 h-4 fill-amber-600" /> : <Pause className="w-4 h-4" />}
          </button>

          {/* Audio toggle */}
          <button
            onClick={() => {
              const newSound = !settings.soundEnabled;
              updateSettings({ soundEnabled: newSound });
              if (newSound) playSound("click");
            }}
            className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
              settings.soundEnabled
                ? "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
            title={settings.soundEnabled ? "Mute Simulation Audio" : "Enable Simulation Audio"}
          >
            {settings.soundEnabled ? <Volume2 className="w-4 h-4 text-slate-700" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Critical Simulated Protection Banner if tripped */}
      {protectionState === "TRIPPED" && (
        <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between text-xs text-red-900">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-red-600 shrink-0" />
            <span>
              <strong>CRITICAL SIMULATION EVENT:</strong> Simulated protection activated. Supply
              disconnected to isolate simulated fault.
            </span>
          </div>
          <button
            onClick={resetProtection}
            className="px-2.5 py-1 bg-red-600 text-white rounded font-bold hover:bg-red-700 shrink-0 ml-2 cursor-pointer"
          >
            Reset Simulation Protection
          </button>
        </div>
      )}

      {/* Interactive Guide Modal */}
      <HowToUseModal
        isOpen={isHowToUseOpen}
        onClose={() => setIsHowToUseOpen(false)}
        onNavigate={onNavigate}
      />
    </header>
  );
};
