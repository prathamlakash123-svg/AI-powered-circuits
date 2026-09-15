import React, { useState } from "react";
import { SimulationProvider } from "./context/SimulationContext";
import { Sidebar, NavTab } from "./components/layout/Sidebar";
import { Header } from "./components/layout/Header";
import { FooterDisclaimer } from "./components/layout/FooterDisclaimer";
import { DashboardView } from "./views/DashboardView";
import { PhysicsCircuitView } from "./views/PhysicsCircuitView";
import { CircuitLabView } from "./views/CircuitLabView";
import { LiveSimulationView } from "./views/LiveSimulationView";
import { SafeCircuitAIView } from "./views/SafeCircuitAIView";
import { LearnView } from "./views/LearnView";
import { SettingsView } from "./views/SettingsView";
import { SafetyDisclaimerView } from "./views/SafetyDisclaimerView";

const AppContent: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("physics_circuit");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const renderActiveView = () => {
    switch (currentTab) {
      case "physics_circuit":
        return <PhysicsCircuitView onNavigate={setCurrentTab} />;
      case "dashboard":
        return <DashboardView onNavigate={setCurrentTab} />;
      case "circuit_lab":
        return <CircuitLabView />;
      case "live_simulation":
        return <LiveSimulationView />;
      case "safecircuit_ai":
        return <SafeCircuitAIView onNavigate={setCurrentTab} />;
      case "learn":
        return <LearnView />;
      case "settings":
        return <SettingsView />;
      case "safety_disclaimer":
        return <SafetyDisclaimerView />;
      default:
        return <PhysicsCircuitView onNavigate={setCurrentTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Workspace */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        <Header
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          currentTab={currentTab}
          onNavigate={setCurrentTab}
        />

        {/* Dynamic View Body */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveView()}
        </main>

        {/* Global Mandatory Footer Disclaimer */}
        <FooterDisclaimer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SimulationProvider>
      <AppContent />
    </SimulationProvider>
  );
}
