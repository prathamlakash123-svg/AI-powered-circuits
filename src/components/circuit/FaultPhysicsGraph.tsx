import React, { useState, useEffect, useRef } from "react";
import { CircuitCondition, CircuitPhysicsState } from "../../types/circuitPhysics";
import {
  Activity,
  Sparkles,
  Zap,
  RotateCcw,
  X,
  Flame,
  ShieldAlert,
  AlertTriangle,
  Radio,
  Sliders,
} from "lucide-react";

interface FaultPhysicsGraphProps {
  condition: CircuitCondition;
  physics: CircuitPhysicsState;
  onClose?: () => void;
  faultComponentName: string;
}

export const FaultPhysicsGraph: React.FC<FaultPhysicsGraphProps> = ({
  condition,
  physics,
  onClose,
  faultComponentName,
}) => {
  const [graphMode, setGraphMode] = useState<"waveform" | "transient">("waveform");
  const [isDrawing, setIsDrawing] = useState<boolean>(true);
  const [drawProgress, setDrawProgress] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const drawProgressRef = useRef<number>(0);

  // Trigger progressive drawing animation when component mounts or re-drawn
  const startDrawingAnimation = () => {
    setIsDrawing(true);
    setDrawProgress(0);
    drawProgressRef.current = 0;
    phaseRef.current = 0;
  };

  useEffect(() => {
    startDrawingAnimation();
  }, [condition, graphMode]);

  // Progressive Drawing & Real-Time Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 640);
    const height = (canvas.height = 240);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
      }
    };
    window.addEventListener("resize", handleResize);

    const nominalV = physics.nominalVoltage || 230;
    const vPeak = Math.round(nominalV * Math.SQRT2);
    const currentA = physics.currentAmps || 0.43;

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // 1. Draw Oscilloscope Grid
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, width, height);

      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;

      // Vertical divisions (time divisions, 10 columns)
      const colWidth = width / 10;
      for (let i = 0; i <= 10; i++) {
        const x = i * colWidth;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();

        // Minor tick marks
        if (i < 10) {
          ctx.strokeStyle = "#152033";
          for (let sub = 1; sub < 5; sub++) {
            const subX = x + (sub * colWidth) / 5;
            ctx.beginPath();
            ctx.moveTo(subX, height / 2 - 4);
            ctx.lineTo(subX, height / 2 + 4);
            ctx.stroke();
          }
          ctx.strokeStyle = "#1e293b";
        }
      }

      // Horizontal divisions (voltage/current divisions, 6 rows)
      const rowHeight = height / 6;
      for (let j = 0; j <= 6; j++) {
        const y = j * rowHeight;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Center baseline
      const centerY = height / 2;
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Animate progressive drawing sweep
      if (drawProgressRef.current < 1) {
        drawProgressRef.current += 0.02; // Complete in ~50 frames (around 0.9s)
        if (drawProgressRef.current >= 1) {
          drawProgressRef.current = 1;
          setIsDrawing(false);
        }
        setDrawProgress(Math.min(100, Math.round(drawProgressRef.current * 100)));
      }

      if (!isPaused && drawProgressRef.current >= 1) {
        phaseRef.current += 0.06;
      }
      const phase = phaseRef.current;
      const visibleWidth = Math.floor(width * drawProgressRef.current);

      // ==========================================
      // MODE 1: OSCILLOSCOPE WAVEFORM (V(t) & I(t))
      // ==========================================
      if (graphMode === "waveform") {
        // --- A. VOLTAGE WAVEFORM TRACE (CYAN / BLUE) ---
        ctx.beginPath();
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = "#38bdf8"; // Sky cyan

        // Glow filter
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8;

        const vAmp = 65; // px

        for (let x = 0; x <= visibleWidth; x++) {
          const t = (x / width) * Math.PI * 6 + phase;
          let yOffset = 0;

          if (condition === "short_circuit") {
            // Near-total voltage collapse during short circuit
            const collapseFactor = 0.12;
            yOffset = Math.sin(t) * vAmp * collapseFactor + (Math.random() - 0.5) * 6;
          } else if (condition === "arc_fault") {
            // Chaotic sputtering high-frequency noise & zero-crossing notches
            const isArcBurst = Math.sin(x * 0.4 + phase * 4) > 0.6;
            const noise = isArcBurst ? (Math.random() - 0.5) * 35 : (Math.random() - 0.5) * 4;
            yOffset = Math.sin(t) * vAmp + noise;
          } else if (condition === "earth_leakage") {
            // Slight distortion due to residual path leakage
            yOffset = Math.sin(t) * vAmp;
          } else if (condition === "broken_earth") {
            // Full 230V sinusoidal touch voltage
            yOffset = Math.sin(t) * vAmp;
          } else if (condition === "degraded_wire") {
            // Voltage drop across 4.8 ohm resistance (sagged by ~18%)
            yOffset = Math.sin(t) * (vAmp * 0.82);
          } else if (condition === "overload") {
            // Mild line impedance voltage sag (down ~6%)
            yOffset = Math.sin(t) * (vAmp * 0.94);
          } else {
            // Normal clean 50Hz sine
            yOffset = Math.sin(t) * vAmp;
          }

          const y = centerY + yOffset;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // --- B. CURRENT WAVEFORM TRACE (AMBER / RED / PURPLE) ---
        ctx.beginPath();
        ctx.lineWidth = 2.2;
        ctx.strokeStyle =
          condition === "short_circuit"
            ? "#ef4444"
            : condition === "earth_leakage"
            ? "#a855f7"
            : condition === "degraded_wire"
            ? "#f97316"
            : "#f59e0b"; // Amber

        ctx.shadowColor = ctx.strokeStyle;
        ctx.shadowBlur = 6;

        for (let x = 0; x <= visibleWidth; x++) {
          const t = (x / width) * Math.PI * 6 + phase;
          let yOffset = 0;

          if (condition === "short_circuit") {
            // Massive 180A peak current spike with sharp saturation clipping
            const rawSpike = Math.sin(t) * 160;
            // Clipped by conductor loop impedance / breaker magnetic cutoff
            const clipped = Math.max(-95, Math.min(95, rawSpike));
            yOffset = clipped + (Math.random() - 0.5) * 8;
          } else if (condition === "arc_fault") {
            // Sputtering intermittent current packets
            const arcSpark = Math.sin(t * 3) > 0.3 ? (Math.random() - 0.5) * 40 : 0;
            yOffset = Math.sin(t) * 15 + arcSpark;
          } else if (condition === "earth_leakage") {
            // 28mA earth leakage phase shifted waveform
            yOffset = Math.sin(t + Math.PI / 4) * 32;
          } else if (condition === "broken_earth") {
            // Body shock current potential if touched
            yOffset = Math.sin(t) * 45;
          } else if (condition === "degraded_wire") {
            // High current through resistive element
            yOffset = Math.sin(t) * 30;
          } else if (condition === "overload") {
            // Continuous 11.7A exceeding 10A rating line
            yOffset = Math.sin(t) * 52;
          } else {
            // Normal low current
            yOffset = Math.sin(t) * 18;
          }

          const y = centerY + yOffset;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Draw Overload Threshold Reference Line if Overload or Short
        if (condition === "overload" || condition === "short_circuit") {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#ef444499";
          ctx.lineWidth = 1.5;

          // Upper threshold (+10A limit)
          ctx.beginPath();
          ctx.moveTo(0, centerY - 42);
          ctx.lineTo(visibleWidth, centerY - 42);
          ctx.stroke();

          // Lower threshold (-10A limit)
          ctx.beginPath();
          ctx.moveTo(0, centerY + 42);
          ctx.lineTo(visibleWidth, centerY + 42);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#f87171";
          ctx.font = "9px monospace";
          ctx.fillText("BREAKER TRIP RATING (10A LIMIT)", 8, centerY - 45);
        }

        // Draw 30mA RCD Trip Line if Earth Leakage
        if (condition === "earth_leakage") {
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#c084fc99";
          ctx.lineWidth = 1.5;

          ctx.beginPath();
          ctx.moveTo(0, centerY - 34);
          ctx.lineTo(visibleWidth, centerY - 34);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#c084fc";
          ctx.font = "9px monospace";
          ctx.fillText("30mA RCD LIFE-SAFETY TRIP THRESHOLD", 8, centerY - 37);
        }
      }
      // ==========================================
      // MODE 2: TIME-DOMAIN TRANSIENT & RESPONSE CURVE
      // ==========================================
      else {
        // Draw axes labels
        ctx.fillStyle = "#94a3b8";
        ctx.font = "10px monospace";
        ctx.fillText("0ms", 10, height - 10);
        ctx.fillText("20ms", width * 0.25, height - 10);
        ctx.fillText("50ms", width * 0.5, height - 10);
        ctx.fillText("100ms", width * 0.75, height - 10);
        ctx.fillText("200ms", width - 40, height - 10);

        if (condition === "short_circuit") {
          // Instantaneous Magnetic Trip: Current spikes to 180A in 5ms, breaker trips at 12ms
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#ef4444";
          ctx.shadowColor = "#ef4444";
          ctx.shadowBlur = 10;

          const tripX = width * 0.28; // 12ms mark
          for (let x = 0; x <= visibleWidth; x++) {
            let y = height - 30;
            if (x < width * 0.08) {
              // Pre-fault
              y = height - 35;
            } else if (x < tripX) {
              // Massive spike
              const progress = (x - width * 0.08) / (tripX - width * 0.08);
              y = height - 35 - Math.sin(progress * Math.PI * 0.5) * 170;
            } else {
              // Instant Cutoff (Breaker open!)
              y = height - 30;
            }

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          // Trip marker line
          if (visibleWidth >= tripX) {
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = "#fbbf24";
            ctx.beginPath();
            ctx.moveTo(tripX, 15);
            ctx.lineTo(tripX, height - 25);
            ctx.stroke();
            ctx.setLineDash([]);

            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 10px monospace";
            ctx.fillText("MAGNETIC CUTOFF (12ms)", tripX + 5, 30);
            ctx.fillStyle = "#f87171";
            ctx.fillText("180A PEAK SPIKE", tripX - 110, 50);
          }
        } else if (condition === "degraded_wire") {
          // Thermal Runaway: Temperature rises from 24°C to 112°C
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#f97316";
          ctx.shadowColor = "#f97316";
          ctx.shadowBlur = 10;

          // 75°C PVC insulation danger threshold
          const thresholdY = height - 30 - ((75 - 24) / (120 - 24)) * 170;
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#ef4444";
          ctx.beginPath();
          ctx.moveTo(0, thresholdY);
          ctx.lineTo(width, thresholdY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#ef4444";
          ctx.font = "bold 9px monospace";
          ctx.fillText("75°C INSULATION DEGRADATION THRESHOLD", 10, thresholdY - 5);

          // Plot thermal curve
          ctx.beginPath();
          ctx.strokeStyle = "#f97316";
          for (let x = 0; x <= visibleWidth; x++) {
            const tRatio = x / width;
            // Exponential saturation: T = 24 + (112 - 24)*(1 - e^(-3 * t))
            const temp = 24 + 88 * (1 - Math.exp(-3.2 * tRatio));
            const y = height - 30 - ((temp - 24) / (120 - 24)) * 170;

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.shadowBlur = 0;

          if (visibleWidth > width * 0.7) {
            ctx.fillStyle = "#f97316";
            ctx.font = "bold 11px monospace";
            ctx.fillText("PYROLYTIC THERMAL RUNAWAY (112°C)", width * 0.45, thresholdY - 25);
          }
        } else if (condition === "earth_leakage") {
          // Residual differential current crossing 30mA
          ctx.beginPath();
          ctx.lineWidth = 3;
          ctx.strokeStyle = "#a855f7";

          const thresholdY = height * 0.42; // 30mA line
          ctx.setLineDash([4, 4]);
          ctx.strokeStyle = "#c084fc";
          ctx.beginPath();
          ctx.moveTo(0, thresholdY);
          ctx.lineTo(width, thresholdY);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.fillStyle = "#c084fc";
          ctx.font = "bold 9px monospace";
          ctx.fillText("30mA RCD CUTOFF LIMIT", 10, thresholdY - 6);

          ctx.beginPath();
          ctx.strokeStyle = "#a855f7";
          const tripX = width * 0.45; // 38ms trip
          for (let x = 0; x <= visibleWidth; x++) {
            let y = height - 35;
            if (x < width * 0.1) {
              y = height - 35;
            } else if (x < tripX) {
              const p = (x - width * 0.1) / (tripX - width * 0.1);
              y = height - 35 - p * (height - 35 - thresholdY + 15);
            } else {
              y = height - 35; // cut off
            }

            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          if (visibleWidth >= tripX) {
            ctx.fillStyle = "#fbbf24";
            ctx.font = "bold 10px monospace";
            ctx.fillText("RCD SOLENOID TRIP (38ms)", tripX + 5, thresholdY + 20);
          }
        } else {
          // General fault response plot
          ctx.beginPath();
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = "#38bdf8";
          for (let x = 0; x <= visibleWidth; x++) {
            const p = x / width;
            const y = height / 2 + Math.sin(p * 12) * 45 * (1 - p * 0.3);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
        }
      }

      // 3. Draw Scanning Beam Cursor at the leading edge
      if (drawProgressRef.current < 1) {
        ctx.beginPath();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 12;
        ctx.moveTo(visibleWidth, 0);
        ctx.lineTo(visibleWidth, height);
        ctx.stroke();

        // Glowing dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(visibleWidth, centerY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [condition, graphMode, physics, isPaused]);

  // Fault telemetry summary
  const getFaultMetrics = () => {
    switch (condition) {
      case "short_circuit":
        return {
          title: "Dead Short Circuit Physics Signature",
          subtitle: "Instantaneous L-N Bypass Surge & Voltage Collapse",
          vPeak: "~12V (Near Total Collapse)",
          iPeak: "180A Peak Inrush",
          tripTime: "< 15 ms (Type-B Magnetic Cutoff)",
          risk: "Massive arc flash, explosive conductor vaporization, fire hazard",
          color: "border-red-500 bg-red-950/30 text-red-300",
        };
      case "arc_fault":
        return {
          title: "Sputtering Arc Discharge Noise Signature",
          subtitle: "Ionized Air Gap High-Frequency Sparking & Notching",
          vPeak: "230V RMS + High Frequency Spikes",
          iPeak: "Chaotic sputtering bursts (5 - 40A)",
          tripTime: "Ignored by standard MCB (Requires AFDD)",
          risk: "3,000°C localized plasma ignites adjacent framing or insulation",
          color: "border-purple-500 bg-purple-950/30 text-purple-300",
        };
      case "earth_leakage":
        return {
          title: "Chassis Current Leakage Differential Signature",
          subtitle: "Phase Insulation Breakdown Leaking to Metal Frame",
          vPeak: "230V AC",
          iPeak: "28mA Differential Vector (IL ≠ IN)",
          tripTime: "< 40 ms (30mA RCCB / GFCI Release)",
          risk: "Fatal ventricular fibrillation shock if human touches ungrounded frame",
          color: "border-purple-500 bg-purple-950/30 text-purple-300",
        };
      case "broken_earth":
        return {
          title: "Severed Earth Return Touch Voltage Curve",
          subtitle: "Floating Chassis Energized to Full Mains Potential",
          vPeak: "230V Full Mains Potential on Metal Body",
          iPeak: "Human body contact completes circuit through soil (46mA)",
          tripTime: "Untripped until human touches frame!",
          risk: "Lethal 230V contact shock without functional earth reference",
          color: "border-rose-500 bg-rose-950/30 text-rose-300",
        };
      case "degraded_wire":
        return {
          title: "High-Resistance Degraded Wire Thermal Signature",
          subtitle: "I²R Power Dissipation & Exponential Pyrolytic Heat Rise",
          vPeak: "188V (42V lost across degraded wire)",
          iPeak: "3.2A continuous through 4.8Ω defect",
          tripTime: "Untripped (Current is below 16A breaker threshold!)",
          risk: "Wire core reaches 112°C, melting PVC insulation inside wall cavity",
          color: "border-orange-500 bg-orange-950/30 text-orange-300",
        };
      case "overload":
        return {
          title: "Branch Overcurrent Waveform & Heating Curve",
          subtitle: "Parallel Loads Drawing 11.7A on 10A Branch Circuit",
          vPeak: "230V AC (with 6% line sag)",
          iPeak: "11.7A (117% of Breaker Rating)",
          tripTime: "~12 to 25 seconds (Bimetallic Strip Inverse-Time)",
          risk: "Progressive conductor overheating, accelerated breaker degradation",
          color: "border-amber-500 bg-amber-950/30 text-amber-300",
        };
      default:
        return {
          title: "Normal Sinusoidal Waveform",
          subtitle: "Clean 50/60 Hz Balanced Operation",
          vPeak: "325V Peak (230V RMS)",
          iPeak: "0.43A Safe Load Current",
          tripTime: "Indefinite Safe Operation",
          risk: "Zero hazard. Conductor temperature at ambient.",
          color: "border-emerald-500 bg-emerald-950/30 text-emerald-300",
        };
    }
  };

  const metrics = getFaultMetrics();

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Top Header Bar */}
      <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                LIVE FAULT GRAPH ANALYSIS
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-semibold text-slate-300">
                Origin: <strong className="text-white">{faultComponentName}</strong>
              </span>
            </div>
            <h4 className="text-sm font-extrabold text-white leading-tight">
              {metrics.title}
            </h4>
          </div>
        </div>

        {/* Action Controls: Mode Switch, Re-draw, Close */}
        <div className="flex items-center space-x-2">
          {/* Mode Switcher */}
          <div className="bg-slate-900 p-0.5 rounded-lg border border-slate-800 flex text-xs">
            <button
              onClick={() => setGraphMode("waveform")}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                graphMode === "waveform"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Waveforms V(t) & I(t)
            </button>
            <button
              onClick={() => setGraphMode("transient")}
              className={`px-2.5 py-1 rounded-md font-bold transition-colors cursor-pointer ${
                graphMode === "transient"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Transient Physics Response
            </button>
          </div>

          {/* Re-Draw Button */}
          <button
            onClick={startDrawingAnimation}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            title="Re-run progressive oscilloscope drawing sweep"
          >
            <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
            <span>Re-Draw Graph</span>
          </button>

          {/* Close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Close graphs"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Real-Time Oscilloscope Screen */}
      <div className="relative w-full bg-slate-950 p-2 sm:p-3">
        {/* Drawing Progress Bar / Status Pill */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-800 text-[11px] font-mono">
          <span
            className={`w-2 h-2 rounded-full ${
              isDrawing ? "bg-amber-400 animate-ping" : "bg-emerald-400"
            }`}
          />
          <span className="text-slate-300">
            {isDrawing ? `TRACING FAULT SIGNAL (${drawProgress}%)` : "REAL-TIME OSCILLOSCOPE ACTIVE"}
          </span>
        </div>

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-10 hidden sm:flex items-center space-x-3 bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-mono">
          <span className="flex items-center space-x-1 text-sky-400">
            <span className="w-3 h-0.5 bg-sky-400" />
            <span>Voltage V(t)</span>
          </span>
          <span className="flex items-center space-x-1 text-amber-400">
            <span className="w-3 h-0.5 bg-amber-400" />
            <span>Current I(t)</span>
          </span>
        </div>

        {/* Canvas Element */}
        <div className="w-full rounded-xl overflow-hidden border border-slate-800 shadow-inner">
          <canvas ref={canvasRef} className="w-full block" />
        </div>
      </div>

      {/* Physics Readouts & Diagnostic Insight Footer */}
      <div className="p-4 bg-slate-950/80 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Peak / Effective V</span>
          <strong className="text-sm text-sky-400 block mt-0.5">{metrics.vPeak}</strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Peak Fault Current</span>
          <strong className="text-sm text-red-400 block mt-0.5">{metrics.iPeak}</strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Protective Cutoff</span>
          <strong className="text-sm text-amber-400 block mt-0.5">{metrics.tripTime}</strong>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-500 block uppercase">Physical Risk</span>
          <span className="text-xs text-slate-300 font-sans leading-tight block mt-0.5 line-clamp-2">
            {metrics.risk}
          </span>
        </div>
      </div>
    </div>
  );
};
