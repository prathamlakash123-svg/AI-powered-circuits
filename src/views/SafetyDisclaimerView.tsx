import React from "react";
import { ShieldAlert, AlertOctagon, CheckCircle2, Zap, Award, Phone } from "lucide-react";

export const SafetyDisclaimerView: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Critical Banner */}
      <div className="bg-red-50 border-2 border-red-300 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-red-700">
              Mandatory Safety Notice
            </span>
            <h2 className="text-xl font-black text-red-950 mt-1">Educational Simulation Only</h2>
            <p className="text-sm text-red-900 mt-2 leading-relaxed font-medium">
              SafeCircuit is an educational simulation and is not a substitute for a licensed electrician or qualified professional. The values, faults, protection behavior and diagnostics shown in this application are simulated for learning purposes only. Do not use SafeCircuit to inspect, repair, modify, or maintain real electrical systems.
            </p>
          </div>
        </div>
      </div>

      {/* Core Rules for Real-World Electrical Safety */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-2">
            Why Real Electrical Systems Demand Licensed Professionals
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            While SafeCircuit models physical phenomena like Joule heating (I²R), earth leakage current, and electromagnetic breaker trips, real residential electrical systems operate at hazardous energy levels that can cause fatal injuries in fractions of a second.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <AlertOctagon className="w-4 h-4 text-red-600" />
              <span>Electrocution & Shock Danger</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Mains electrical current as low as 30 milliamperes (0.03 Amps) through the human heart can trigger fatal ventricular fibrillation. Voltage can bridge unexpected conductors without visible signs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center space-x-2 text-slate-900 font-bold">
              <Zap className="w-4 h-4 text-amber-600" />
              <span>Arc Flash & Thermal Blast Hazards</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              A dead short circuit in a distribution panel can vaporize metal terminals, generating temperatures exceeding 10,000°C and causing devastating blast pressure and eye injury.
            </p>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* What to do in real life */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3">
            Real-World Electrical Warning Signs
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            If you ever observe any of the following symptoms in your real home, do not attempt to disassemble outlets or replace panel wiring yourself:
          </p>

          <div className="space-y-2 text-xs">
            {[
              "Circuit breaker trips repeatedly after resetting once.",
              "Acrid or burning plastic smell near outlets, switches, or the service panel.",
              "Discoloration, scorching, or black marks around faceplates or plugs.",
              "Tingling sensation or static buzz when touching appliances or metal plumbing.",
              "Lights flickering persistently across multiple fixtures on the same circuit.",
            ].map((symptom, i) => (
              <div
                key={i}
                className="flex items-start space-x-2.5 p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-amber-950"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0" />
                <span>{symptom}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start space-x-3">
          <Award className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong className="block font-bold mb-0.5">Always Contact a Certified Electrician</strong>
            <p className="leading-relaxed text-blue-900">
              Only certified, licensed electrical contractors possess the calibrated test instruments, safety isolation procedures, and regulatory code knowledge to safely inspect and repair household wiring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
