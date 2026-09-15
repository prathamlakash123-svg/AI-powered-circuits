import React from "react";
import { SafetyLevel } from "../../types/simulation";
import { ShieldCheck, AlertTriangle, AlertOctagon } from "lucide-react";

interface SafetyGaugeProps {
  level: SafetyLevel;
  size?: "sm" | "md" | "lg";
  subtext?: string;
  showDetails?: boolean;
}

export const SafetyGauge: React.FC<SafetyGaugeProps> = ({
  level,
  size = "lg",
  subtext,
  showDetails = true,
}) => {
  // Angle for the needle:
  // SAFE: -50deg
  // WARNING: 0deg
  // CRITICAL: 50deg
  const angle = level === "SAFE" ? -50 : level === "WARNING" ? 0 : 50;

  const colorConfig = {
    SAFE: {
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      ring: "ring-emerald-500",
      needle: "#059669",
      icon: ShieldCheck,
      label: "SAFE / NORMAL",
      desc: "Simulated voltages, currents, and temperatures are within designed safe margins.",
    },
    WARNING: {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "ring-amber-500",
      needle: "#d97706",
      icon: AlertTriangle,
      label: "WARNING / ATTENTION",
      desc: "Elevated load, thermal warming, or grounding degradation detected.",
    },
    CRITICAL: {
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      ring: "ring-red-500",
      needle: "#dc2626",
      icon: AlertOctagon,
      label: "CRITICAL / FAULT",
      desc: "Threshold breach, sustained overload, or protection tripped.",
    },
  }[level];

  const Icon = colorConfig.icon;

  const dimensions = {
    sm: { width: 140, height: 80, cx: 70, cy: 70, r: 55 },
    md: { width: 220, height: 120, cx: 110, cy: 110, r: 85 },
    lg: { width: 300, height: 160, cx: 150, cy: 150, r: 115 },
  }[size];

  return (
    <div
      id="safety-gauge-container"
      className={`flex flex-col items-center justify-center p-4 rounded-xl border ${colorConfig.border} ${colorConfig.bg} transition-all duration-300`}
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="overflow-visible"
        >
          {/* Arc Background Sectors */}
          <path
            d={`M ${dimensions.cx - dimensions.r} ${dimensions.cy} A ${dimensions.r} ${dimensions.r} 0 0 1 ${dimensions.cx + dimensions.r} ${dimensions.cy}`}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={size === "sm" ? "10" : "16"}
            strokeLinecap="round"
          />

          {/* Green Safe Zone Arc */}
          <path
            d={`M ${dimensions.cx - dimensions.r} ${dimensions.cy} A ${dimensions.r} ${dimensions.r} 0 0 1 ${dimensions.cx - dimensions.r * 0.35} ${dimensions.cy - dimensions.r * 0.93}`}
            fill="none"
            stroke="#10b981"
            strokeWidth={size === "sm" ? "10" : "16"}
            strokeDasharray="4 2"
          />

          {/* Amber Warning Zone Arc */}
          <path
            d={`M ${dimensions.cx - dimensions.r * 0.35} ${dimensions.cy - dimensions.r * 0.93} A ${dimensions.r} ${dimensions.r} 0 0 1 ${dimensions.cx + dimensions.r * 0.35} ${dimensions.cy - dimensions.r * 0.93}`}
            fill="none"
            stroke="#f59e0b"
            strokeWidth={size === "sm" ? "10" : "16"}
            strokeDasharray="4 2"
          />

          {/* Red Critical Zone Arc */}
          <path
            d={`M ${dimensions.cx + dimensions.r * 0.35} ${dimensions.cy - dimensions.r * 0.93} A ${dimensions.r} ${dimensions.r} 0 0 1 ${dimensions.cx + dimensions.r} ${dimensions.cy}`}
            fill="none"
            stroke="#ef4444"
            strokeWidth={size === "sm" ? "10" : "16"}
            strokeDasharray="4 2"
          />

          {/* Gauge Center Pivot */}
          <circle cx={dimensions.cx} cy={dimensions.cy} r="7" fill="#334155" />

          {/* Animated Needle */}
          <g
            transform={`translate(${dimensions.cx}, ${dimensions.cy}) rotate(${angle})`}
            style={{ transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2={-(dimensions.r - 8)}
              stroke={colorConfig.needle}
              strokeWidth={size === "sm" ? "3" : "4"}
              strokeLinecap="round"
            />
            <polygon
              points={`-4,-${dimensions.r - 18} 4,-${dimensions.r - 18} 0,-${dimensions.r - 4}`}
              fill={colorConfig.needle}
            />
          </g>
        </svg>
      </div>

      {/* Status Label with accessible icon */}
      <div className="flex items-center space-x-2 mt-2">
        <Icon className={`w-5 h-5 ${colorConfig.text} shrink-0`} />
        <span className={`text-base md:text-lg font-bold tracking-wide ${colorConfig.text}`}>
          {colorConfig.label}
        </span>
      </div>

      {showDetails && (
        <p className="text-xs text-slate-600 text-center max-w-xs mt-1 leading-relaxed">
          {subtext || colorConfig.desc}
        </p>
      )}
    </div>
  );
};
