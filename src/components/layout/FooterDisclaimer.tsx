import React from "react";
import { ShieldAlert } from "lucide-react";

export const FooterDisclaimer: React.FC = () => {
  return (
    <footer className="mt-8 pt-4 pb-6 border-t border-slate-200 text-slate-500 text-xs text-center">
      <div className="max-w-4xl mx-auto px-4 flex flex-col items-center space-y-1.5">
        <div className="flex items-center space-x-1.5 text-slate-600 font-semibold">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Educational Simulation Only</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-normal max-w-2xl">
          SafeCircuit is an educational simulation and is not a substitute for a licensed electrician or qualified professional. The values, faults, protection behavior and diagnostics shown are simulated for learning purposes only. Do not use SafeCircuit to inspect, repair, modify, or maintain real electrical systems.
        </p>
      </div>
    </footer>
  );
};
