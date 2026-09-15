import React, { useEffect, useRef } from "react";
import { VoltageStability } from "../../types/simulation";
import { Activity, AlertCircle, Sparkles } from "lucide-react";

interface WaveformCanvasProps {
  stability: VoltageStability;
  voltage: number;
  current: number;
  height?: number;
}

export const WaveformCanvas: React.FC<WaveformCanvasProps> = ({
  stability,
  voltage,
  current,
  height = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<number>(0);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let h = (canvas.height = height);

    const handleResize = () => {
      if (canvas && canvas.parentElement) {
        width = canvas.width = canvas.parentElement.clientWidth;
        h = canvas.height = height;
      }
    };

    window.addEventListener("resize", handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, h);

      // Draw subtle oscilloscope grid lines
      ctx.strokeStyle = "#f1f5f9";
      ctx.lineWidth = 1;

      // Horizontal center line
      const centerY = h / 2;
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      ctx.lineTo(width, centerY);
      ctx.stroke();

      // Vertical grid divisions
      const gridSpacing = 40;
      for (let x = 0; x < width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }

      // Increment phase
      phaseRef.current += 0.05;
      const phase = phaseRef.current;

      // Base amplitude scales with voltage (~40-60px)
      const baseAmp = Math.min(65, Math.max(25, (voltage / 230) * 45));

      // Draw Voltage Waveform (Primary line)
      ctx.beginPath();
      ctx.lineWidth = 2.5;

      let strokeColor = "#2563eb"; // Blue for Normal
      if (stability === "FLUCTUATING") strokeColor = "#d97706"; // Amber
      if (stability === "SEVERE_VARIATION" || stability === "ARC_FAULT") strokeColor = "#dc2626"; // Red

      ctx.strokeStyle = strokeColor;

      for (let x = 0; x < width; x++) {
        const t = (x / width) * Math.PI * 8 + phase;
        let yOffset = 0;

        if (stability === "STABLE") {
          // Pure sinusoidal wave
          yOffset = Math.sin(t) * baseAmp;
        } else if (stability === "FLUCTUATING") {
          // Mild amplitude modulation & harmonic ripple
          const mod = 1 + 0.25 * Math.sin(phase * 0.4 + x * 0.015);
          yOffset = Math.sin(t) * baseAmp * mod;
        } else if (stability === "SEVERE_VARIATION") {
          // Chaotic distortion, clipped peaks, sag/swell
          const mod = 1 + 0.5 * Math.sin(phase * 0.8) + 0.3 * Math.cos(x * 0.03);
          yOffset = Math.sin(t) * baseAmp * mod + (Math.sin(t * 3) * 12);
        } else if (stability === "ARC_FAULT") {
          // High-frequency sporadic spikes simulating spark discharge
          const isSpike = Math.sin(x * 0.3 + phase * 4) > 0.7 && Math.random() > 0.4;
          const noise = isSpike ? (Math.random() - 0.5) * 45 : (Math.random() - 0.5) * 6;
          yOffset = Math.sin(t) * baseAmp + noise;
        }

        const y = centerY + yOffset;
        if (x === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }
      ctx.stroke();

      // If current is active, draw a secondary subtle current waveform
      if (current > 0) {
        ctx.beginPath();
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "#10b981"; // Emerald

        const currentAmp = Math.min(45, (current / 20) * 35);
        for (let x = 0; x < width; x++) {
          const t = (x / width) * Math.PI * 8 + phase;
          const y = centerY + Math.sin(t) * currentAmp;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      }

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [stability, voltage, current, height]);

  // Beginner-friendly description labels
  const stabilityInfo = {
    STABLE: {
      badge: "NORMAL",
      badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-300",
      icon: Activity,
      heading: "Voltage Stability: NORMAL",
      text: "The simulated AC voltage is delivering a smooth, clean 50/60 Hz sine wave. All simulated appliances receive clean power without stress.",
    },
    FLUCTUATING: {
      badge: "FLUCTUATING",
      badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
      icon: AlertCircle,
      heading: "Voltage Stability: MODERATE FLUCTUATION",
      text: "The simulated supply is wobbling in amplitude. This models grid adjustments or switching transients from nearby heavy electrical equipment.",
    },
    SEVERE_VARIATION: {
      badge: "SEVERE VARIATION",
      badgeClass: "bg-red-100 text-red-800 border-red-300",
      icon: AlertCircle,
      heading: "Voltage Stability: HIGH VARIATION",
      text: "The simulated voltage is changing significantly. Severe sags or surges can stress insulation and overload simulated electrical equipment.",
    },
    ARC_FAULT: {
      badge: "ARC FAULT NOISE",
      badgeClass: "bg-purple-100 text-purple-800 border-purple-300",
      icon: Sparkles,
      heading: "Voltage Stability: HIGH-FREQUENCY ARC DISCHARGE",
      text: "Erratic spikes and irregular waveforms detected. Arcing occurs across loose screw terminals or frayed cords, generating extreme local heat without tripping regular breakers.",
    },
  }[stability];

  const Icon = stabilityInfo.icon;

  return (
    <div id="dynamic-waveform-container" className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-800">Dynamic Voltage & Load Waveform</h3>
        </div>
        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center space-x-1 text-blue-700 font-medium">
            <span className="inline-block w-3 h-0.5 bg-blue-600"></span>
            <span>Voltage ({voltage} V)</span>
          </span>
          {current > 0 && (
            <span className="flex items-center space-x-1 text-emerald-700 font-medium">
              <span className="inline-block w-3 h-0.5 border-b border-dashed border-emerald-600"></span>
              <span>Current ({current} A)</span>
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${stabilityInfo.badgeClass}`}>
            {stabilityInfo.badge}
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative w-full rounded-lg bg-slate-950/2 border border-slate-200 overflow-hidden">
        <canvas ref={canvasRef} className="w-full block" />
      </div>

      {/* Beginner-friendly explanation */}
      <div className="mt-3 flex items-start space-x-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200/80">
        <Icon className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-semibold text-slate-800">{stabilityInfo.heading}</p>
          <p className="text-slate-600 mt-0.5">{stabilityInfo.text}</p>
        </div>
      </div>
    </div>
  );
};
