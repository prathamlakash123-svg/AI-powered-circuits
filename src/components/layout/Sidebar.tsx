import React from "react";
import {
  BookOpen,
  Settings as SettingsIcon,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { useSimulation } from "../../context/SimulationContext";

export type NavTab =
  | "physics_circuit"
  | "learn"
  | "settings"
  | "dashboard"
  | "circuit_lab"
  | "live_simulation"
  | "safecircuit_ai"
  | "safety_disclaimer";

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const { metrics, diagnosticIssues, protectionState } = useSimulation();

  // Streamlined to essential modules for the interactive prototype
  const navItems = [
    {
      id: "physics_circuit" as NavTab,
      label: "Physics Circuit & AI",
      icon: Zap,
      badge: "PROTOTYPE",
      badgeColor: "bg-blue-600 text-white font-black",
    },
    {
      id: "learn" as NavTab,
      label: "Learn & Guide",
      icon: BookOpen,
    },
    {
      id: "settings" as NavTab,
      label: "Settings",
      icon: SettingsIcon,
    },
  ];

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-slate-100 flex flex-col justify-between border-r border-slate-800 transition-transform duration-200 ease-in-out md:translate-x-0 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Branding */}
        <div>
          <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-lg font-bold tracking-tight text-white">SafeCircuit</h1>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  SIM
                </span>
              </div>
              <p className="text-xs text-slate-400">Electrical Safety Lab</p>
            </div>
          </div>

          {/* Quick Simulation Health Indicator */}
          <div className="px-4 py-3 bg-slate-950/40 border-b border-slate-800/80">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-slate-400">Simulated Health</span>
              <span
                className={`font-semibold ${
                  metrics.safetyLevel === "SAFE"
                    ? "text-emerald-400"
                    : metrics.safetyLevel === "WARNING"
                    ? "text-amber-400"
                    : "text-red-400"
                }`}
              >
                {metrics.safetyLevel}
              </span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  metrics.safetyLevel === "SAFE"
                    ? "bg-emerald-500 w-full"
                    : metrics.safetyLevel === "WARNING"
                    ? "bg-amber-500 w-2/3"
                    : "bg-red-500 w-1/3"
                }`}
              />
            </div>
          </div>

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer text-left ${
                    isActive
                      ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wide ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Educational Disclaimer Badge */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-start space-x-2 text-[11px] text-slate-400 leading-relaxed">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-300 block">Simulation Only</strong>
              <span>Not real electrical advice. For beginner education only.</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
