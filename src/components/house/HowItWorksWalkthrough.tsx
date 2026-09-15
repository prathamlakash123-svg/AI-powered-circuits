import React, { useState } from "react";
import {
  Zap,
  ShieldAlert,
  Sliders,
  Home,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ArrowRight,
  ChevronRight,
  Layers,
  Activity,
  Power,
  RotateCcw,
} from "lucide-react";

export interface WalkthroughStep {
  id: number;
  title: string;
  tagline: string;
  componentName: string;
  icon: React.ReactNode;
  concept: string;
  whyItMatters: string;
  whatIfItFails: string;
  simulationTip: string;
  color: string;
}

interface HowItWorksWalkthroughProps {
  activeStep: number;
  onSelectStep: (stepId: number) => void;
  onClose?: () => void;
}

export const HOW_IT_WORKS_STEPS: WalkthroughStep[] = [
  {
    id: 1,
    title: "1. Utility Grid & Electric Meter",
    tagline: "Where power enters your home",
    componentName: "Service Entrance & kWh Meter",
    icon: <Zap className="w-5 h-5 text-amber-500" />,
    concept:
      "Electricity arrives from the utility street transformer via overhead service drop or underground cable at 230V AC (or 120V/240V split-phase). The electric meter measures total energy in kilowatt-hours (kWh).",
    whyItMatters:
      "All household current passes through this single point before reaching the distribution board.",
    whatIfItFails:
      "Utility outages or external power surges disrupt the entire dwelling until restored.",
    simulationTip:
      "Check the live kWh meter on the panel below to see total household power draw update in real time.",
    color: "amber",
  },
  {
    id: 2,
    title: "2. Master Double-Pole Isolator",
    tagline: "The whole-house emergency shutoff",
    componentName: "Main Switch (100A DP)",
    icon: <Power className="w-5 h-5 text-red-500" />,
    concept:
      "A heavy-duty manual switch rated at 100 Amperes that disconnects both the Phase (Live) conductor AND the Neutral conductor simultaneously.",
    whyItMatters:
      "Allows electricians or homeowners to completely de-energize the entire building for safe electrical maintenance or emergencies.",
    whatIfItFails:
      "If seized or stuck, the home cannot be isolated safely without removing the service company's main cutout fuse.",
    simulationTip:
      "Click the red Master Switch on the panel. The entire house floor plan immediately enters a dark, de-energized blackout state!",
    color: "red",
  },
  {
    id: 3,
    title: "3. Life-Safety RCD (30mA RCCB)",
    tagline: "Protects humans from fatal electrocution",
    componentName: "Residual Current Device (Type A 30mA)",
    icon: <ShieldAlert className="w-5 h-5 text-blue-500" />,
    concept:
      "Continuously measures the magnetic balance between outgoing Live current and returning Neutral current. In a healthy circuit, I_out = I_in. If even 30 milliamperes (0.030 A) escapes through a person to ground, it trips in under 30 milliseconds.",
    whyItMatters:
      "Standard circuit breakers (16A–20A) will NOT protect you from fatal electric shock, because 50mA can cause cardiac arrest! Only an RCD detects tiny fatal ground leakages.",
    whatIfItFails:
      "Without an active RCD, a damaged appliance casing can become energized at full mains voltage without tripping the breaker.",
    simulationTip:
      "Click the 'T' (TEST) button on the RCD below, or inject an appliance ground fault to see how RCD trips to save lives.",
    color: "blue",
  },
  {
    id: 4,
    title: "4. Branch Circuit Breakers (MCBs)",
    tagline: "Protects wires from catching fire",
    componentName: "Miniature Circuit Breakers (B1 to B4)",
    icon: <Sliders className="w-5 h-5 text-emerald-500" />,
    concept:
      "Household electricity is split into separate branch circuits (Living Room, Kitchen, Bedroom, Garage). Each branch is guarded by an MCB sized to its wire gauge (e.g., 16A on 14 AWG wire, 20A on 12 AWG wire).",
    whyItMatters:
      "If an appliance overloads the kitchen circuit, only Breaker 2 trips—the rest of your house and bedroom lights remain powered!",
    whatIfItFails:
      "If a breaker is stuck or oversized (e.g. 32A breaker on thin 14 AWG wire), current will heat the wire past 100°C, melting insulation and igniting drywall framing.",
    simulationTip:
      "Flip any breaker switch B1–B4. Notice only that specific room goes dark while the other 3 rooms continue running!",
    color: "emerald",
  },
  {
    id: 5,
    title: "5. In-Wall Conduits & Receptacles",
    tagline: "The hidden 3-wire distribution highway",
    componentName: "Concealed Romex / Conduit Cabling",
    icon: <Layers className="w-5 h-5 text-purple-500" />,
    concept:
      "Copper conductors run inside walls and under floors: Live (Brown/Black: brings 230V), Neutral (Blue/White: returns current), and Protective Earth (Green/Yellow: ties metal frames safely to the ground rod).",
    whyItMatters:
      "Earthing provides a low-resistance path so a fault blows the breaker rather than shocking someone touching the appliance chassis.",
    whatIfItFails:
      "A broken or disconnected earth rod leaves appliance casings floating at high voltage with zero indication until someone touches it.",
    simulationTip:
      "Toggle 'X-Ray Electrical Wiring' mode above the floor plan to inspect the hidden conductors running through the walls!",
    color: "purple",
  },
  {
    id: 6,
    title: "6. Household Loads & Balancing",
    tagline: "Where power is consumed (P = V × I)",
    componentName: "Appliances & Wall Outlets",
    icon: <Home className="w-5 h-5 text-indigo-500" />,
    concept:
      "Every electrical device consumes power measured in Watts (W). Current drawn equals Watts divided by Voltage (Amps = W / 230V). High-heat appliances (Kettle: 2200W, Heater: 2400W) draw heavy current (10A+ each).",
    whyItMatters:
      "Plugging two 2000W appliances into the same branch circuit draws 4000W / 230V = 17.4 Amps, exceeding a 16A breaker rating and causing an overload trip.",
    whatIfItFails:
      "Nuisance trips, warm electrical outlets, or degraded wire contacts.",
    simulationTip:
      "Click '⚡ Overload Kitchen' in the Quick Experiments bar to watch the 16A breaker bimetallic strip heat up and trip automatically!",
    color: "indigo",
  },
];

export const HowItWorksWalkthrough: React.FC<HowItWorksWalkthroughProps> = ({
  activeStep,
  onSelectStep,
  onClose,
}) => {
  const current =
    HOW_IT_WORKS_STEPS.find((s) => s.id === activeStep) || HOW_IT_WORKS_STEPS[0];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-6">
      {/* Header with Title and Step Selectors */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>Interactive Electrical Journey: From Street to Socket</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Step {activeStep} of 6
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Click any step below to see exactly how electricity flows, why components exist, and what happens when faults occur.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 transition-colors"
            >
              Hide Guide
            </button>
          )}
        </div>

        {/* Step Buttons Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {HOW_IT_WORKS_STEPS.map((step) => {
            const isSelected = step.id === activeStep;
            return (
              <button
                key={step.id}
                onClick={() => onSelectStep(step.id)}
                className={`px-3 py-2.5 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-white text-slate-900 border-white shadow-lg ring-2 ring-blue-400"
                    : "bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/80"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span
                    className={`text-[10px] font-mono font-bold ${
                      isSelected ? "text-blue-600" : "text-slate-400"
                    }`}
                  >
                    0{step.id}
                  </span>
                  <div className="scale-75 origin-right">{step.icon}</div>
                </div>
                <span className="text-[11px] font-bold truncate leading-tight">
                  {step.title.split(".")[1]?.trim()}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Content Body */}
      <div className="p-4 sm:p-5 bg-slate-50/50">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Concept & Why It Matters */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center shrink-0">
                {current.icon}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-bold text-slate-900">{current.title}</h4>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {current.componentName}
                  </span>
                </div>
                <p className="text-xs font-medium text-slate-500 mt-0.5">{current.tagline}</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-white p-3.5 rounded-xl border border-slate-200/80">
              {current.concept}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Why It Matters</span>
                </span>
                <p className="text-xs text-emerald-900 leading-snug">{current.whyItMatters}</p>
              </div>

              <div className="bg-red-50/70 border border-red-200/80 rounded-xl p-3">
                <span className="text-[10px] font-bold text-red-800 uppercase tracking-wider block mb-1 flex items-center space-x-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>What If It Fails?</span>
                </span>
                <p className="text-xs text-red-900 leading-snug">{current.whatIfItFails}</p>
              </div>
            </div>
          </div>

          {/* Interactive Simulation Action Box */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-xl border border-blue-200/80 p-4 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-1.5 text-blue-800 text-xs font-bold uppercase tracking-wider mb-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>Hands-On Simulation Tip</span>
              </div>
              <p className="text-xs text-blue-950 font-medium leading-relaxed bg-white/80 p-3 rounded-lg border border-blue-100">
                {current.simulationTip}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-blue-200/60 flex items-center justify-between text-xs">
              <button
                onClick={() => onSelectStep(activeStep > 1 ? activeStep - 1 : 6)}
                className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold cursor-pointer text-[11px]"
              >
                Previous Step
              </button>

              <button
                onClick={() => onSelectStep(activeStep < 6 ? activeStep + 1 : 1)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center space-x-1 cursor-pointer text-[11px]"
              >
                <span>{activeStep < 6 ? "Next Step" : "Restart Guide"}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
