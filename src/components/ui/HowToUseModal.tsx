import React, { useState } from "react";
import {
  X,
  Sliders,
  Activity,
  Bot,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Zap,
  HelpCircle,
  ExternalLink,
} from "lucide-react";
import { NavTab } from "../layout/Sidebar";

interface HowToUseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: NavTab) => void;
}

interface GuideStep {
  title: string;
  subtitle: string;
  badge: string;
  icon: React.ElementType;
  color: string;
  tabTarget?: NavTab;
  tabLabel?: string;
  bullets: {
    heading: string;
    description: string;
  }[];
  tip: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    title: "1. Interactive Physics Circuit: Wire & Simulate",
    subtitle: "Route wires between components, simulate fault events, and inspect circuit reactions",
    badge: "Step 1 • Physics Circuit & AI",
    icon: Zap,
    color: "bg-blue-600 text-white",
    tabTarget: "physics_circuit",
    tabLabel: "Open Physics Circuit",
    bullets: [
      {
        heading: "Route Component Wires",
        description:
          "Click connection terminals to wire the DC power source, knife switch, fast-acting fuse, incandescent lamp, load resistor, and protective earth.",
      },
      {
        heading: "Inject Electrical Fault Presets",
        description:
          "Test conditions like Normal Operation, Short Circuit, Overload, Open Neutral, and High Resistance Ground to observe circuit physics.",
      },
      {
        heading: "Consult AI Copilot & Automated Fixes",
        description:
          "Inspect real-time AI fault pinpointing, click to review what AI does and root cause diagnoses, or trigger one-click automated circuit repairs.",
      },
    ],
    tip: "Pro Tip: When a fault is active, click 'Draw Graph' to inspect real-time voltage and current transient response curves!",
  },
  {
    title: "2. Circuit Lab: Configure Breakers, Wires & Earthing",
    subtitle: "Model distribution panels, wire thickness, aging, and life-safety RCCBs",
    badge: "Step 2 • Electrical Hardware",
    icon: Sliders,
    color: "bg-emerald-600 text-white",
    tabTarget: "circuit_lab",
    tabLabel: "Open Circuit Lab",
    bullets: [
      {
        heading: "Adjust Breaker Ratings",
        description:
          "Select between 10A, 16A, 20A, or 32A breaker thresholds for each circuit branch. Lower ratings trip sooner under load.",
      },
      {
        heading: "Tune Wire Gauge & Aging",
        description:
          "Switch wire thickness (14 AWG to 8 AWG) and conductor age (New, Good, Aged, Degraded). Notice how degraded or thin wires generate excessive heat (I²R).",
      },
      {
        heading: "Arm RCCB / Grounding Protection",
        description:
          "Toggle residual current protection (RCCB/RCBO 30mA) and change grounding resistance from Excellent to Disconnected to observe dangerous shock hazards.",
      },
      {
        heading: "Interactive Distribution Board",
        description:
          "Flip individual miniature circuit breaker switches ON/OFF manually and click 'Test Trip' on the RCCB to see how fault isolation works.",
      },
    ],
    tip: "Click any '(?)' icon in Circuit Lab to read a simple, plain-language explanation of what each electrical parameter means.",
  },
  {
    title: "3. Live Simulation: Oscilloscope & Telemetry",
    subtitle: "Watch real-time AC waveforms and monitor circuit temperature and leakage",
    badge: "Step 3 • Oscilloscope & Telemetry",
    icon: Activity,
    color: "bg-amber-600 text-white",
    tabTarget: "live_simulation",
    tabLabel: "Open Live Simulation",
    bullets: [
      {
        heading: "Real-Time AC Waveforms",
        description:
          "Observe 50/60 Hz sinusoidal voltage and current waves on the HTML5 oscilloscope. Normal loads show smooth sine waves; heavy loads show harmonic distortion.",
      },
      {
        heading: "Identify Arc Faults",
        description:
          "When an arc fault occurs, the waveform becomes jagged and erratic with high-frequency noise spikes, modeling intermittent electrical sparking.",
      },
      {
        heading: "Telemetry Gauges",
        description:
          "Monitor 5 critical meters: Supply Voltage (V), Branch Current (A), Conductor Temp (°C), Earth Leakage (mA), and Breaker Contact Health (%).",
      },
      {
        heading: "Interactive Diagnostic Map",
        description:
          "Follow the animated flow of electric energy from the main utility feed, through the panel, along wall conductors, to outlets and active loads.",
      },
    ],
    tip: "Use the pause or clock-speed buttons in the top header (0.5x, 1x, 2x) to slow down fast electrical events and study transient behaviors.",
  },
  {
    title: "4. SafeCircuit AI: Diagnostics & 1-Click Fixes",
    subtitle: "Automated root-cause analysis with educational explanations and simulated fixes",
    badge: "Step 4 • AI Diagnostics & Repair",
    icon: Bot,
    color: "bg-purple-600 text-white",
    tabTarget: "safecircuit_ai",
    tabLabel: "Open SafeCircuit AI",
    bullets: [
      {
        heading: "Automatic Hazard Detection",
        description:
          "SafeCircuit AI constantly scans for overloads, conductor overheating, missing residual current protection, broken grounding, and arc faults.",
      },
      {
        heading: "Plain-English Explanations",
        description:
          "Each diagnostic card clearly explains what happened, which physical components are affected, and why it poses an electrical safety hazard.",
      },
      {
        heading: "One-Click Simulated Fixes",
        description:
          "Click 'Apply Simulated Fix' on any diagnosed issue to automatically rebalance appliances, upgrade wire gauges, arm RCCB protection, or repair ground bonding.",
      },
      {
        heading: "Instant Re-run Verification",
        description:
          "Once a fix is applied, the simulation updates in real time so you can verify that the circuit returns to the SAFE state.",
      },
    ],
    tip: "Click 'Ask SafeCircuit AI for Deep Explanation' on any card to request an AI-powered technical summary!",
  },
  {
    title: "5. Breaker Trips & System Controls",
    subtitle: "What to do when the power cuts and how to control the simulation",
    badge: "Step 5 • Controls & Safety Notice",
    icon: RotateCcw,
    color: "bg-red-600 text-white",
    tabTarget: "settings",
    tabLabel: "Simulation Settings",
    bullets: [
      {
        heading: "When a Breaker Trips (Red Banner)",
        description:
          "If current exceeds safe thresholds or an earth fault occurs, the simulated breaker trips to protect the circuit. Click 'Reset Protection' in the top header to restore power after reducing load.",
      },
      {
        heading: "Pause & Audio Controls",
        description:
          "Use the top bar buttons to pause/play the simulation clock and mute/unmute tactile breaker click sound effects.",
      },
      {
        heading: "Grid Voltage Standard (Settings)",
        description:
          "Switch between 230V (Europe, UK, Australia, India) and 120V (North America) in the Settings tab to see how voltage affects amperage calculations (Amps = Watts / Volts).",
      },
      {
        heading: "Always Remember Safety",
        description:
          "SafeCircuit is strictly an educational tool. Never perform DIY electrical repairs on real homes. Always hire a licensed, certified electrician.",
      },
    ],
    tip: "You can reopen this guide anytime by clicking 'How to Use' in the top navigation bar!",
  },
];

export const HowToUseModal: React.FC<HowToUseModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  if (!isOpen) return null;

  const currentStep = GUIDE_STEPS[activeStepIndex];
  const StepIcon = currentStep.icon;

  const handleNext = () => {
    if (activeStepIndex < GUIDE_STEPS.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
    }
  };

  const handleJumpToTab = (tab: NavTab) => {
    onNavigate(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden relative">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-600">
                SafeCircuit User Manual & Guide
              </span>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                How to Use SafeCircuit
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
            aria-label="Close Guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Navigation Tabs / Dots */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between gap-1 sm:gap-2 overflow-x-auto">
          {GUIDE_STEPS.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStepIndex(idx)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeStepIndex === idx
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${
                  activeStepIndex === idx ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                }`}
              >
                {idx + 1}
              </span>
              <span className="hidden sm:inline">
                {step.title.split(":")[0].replace(/^\d+\.\s*/, "")}
              </span>
            </button>
          ))}
        </div>

        {/* Step Content Body (Scrollable) */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-slate-800">
          {/* Step Banner */}
          <div className="flex items-start space-x-3.5">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${currentStep.color}`}
            >
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                {currentStep.badge}
              </span>
              <h4 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                {currentStep.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {currentStep.subtitle}
              </p>
            </div>
          </div>

          {/* Actionable Bullets */}
          <div className="space-y-3">
            {currentStep.bullets.map((b, i) => (
              <div
                key={i}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start space-x-3"
              >
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="font-bold text-slate-900 block mb-0.5">{b.heading}</strong>
                  <p className="text-slate-600 leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pro Tip Box */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 flex items-start space-x-2.5 text-xs text-amber-950">
            <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold block">Quick Tip</strong>
              <p className="text-amber-900 leading-relaxed mt-0.5">{currentStep.tip}</p>
            </div>
          </div>

          {/* Jump directly to feature button if available */}
          {currentStep.tabTarget && currentStep.tabLabel && (
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => handleJumpToTab(currentStep.tabTarget!)}
                className="flex items-center space-x-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                <span>{currentStep.tabLabel}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50/80 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            disabled={activeStepIndex === 0}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              activeStepIndex === 0
                ? "opacity-40 cursor-not-allowed border-slate-200 text-slate-400 bg-white"
                : "border-slate-300 text-slate-700 bg-white hover:bg-slate-100"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-slate-500 font-mono font-semibold">
            {activeStepIndex + 1} of {GUIDE_STEPS.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <span>{activeStepIndex === GUIDE_STEPS.length - 1 ? "Start Exploring" : "Next Step"}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
