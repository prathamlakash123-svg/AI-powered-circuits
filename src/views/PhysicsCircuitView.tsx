import React from "react";
import { InteractivePhysicsCircuit } from "../components/circuit/InteractivePhysicsCircuit";
import { NavTab } from "../components/layout/Sidebar";

interface PhysicsCircuitViewProps {
  onNavigate?: (tab: NavTab) => void;
}

export const PhysicsCircuitView: React.FC<PhysicsCircuitViewProps> = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <InteractivePhysicsCircuit />
    </div>
  );
};
