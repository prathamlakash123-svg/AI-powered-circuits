import React from "react";
import {
  Zap,
  Activity,
  Flame,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Gauge,
  Sliders,
  Radio,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Cpu,
  RefreshCw,
} from "lucide-react";
import {
  CircuitWire,
  Terminal,
  TerminalId,
  WireDegradation,
  WireSegmentPhysics,
  CircuitPhysicsState,
} from "../../types/circuitPhysics";

interface VisualConnectorMapProps {
  wires: CircuitWire[];
  terminals: Terminal[];
  wireSegments: WireSegmentPhysics[];
  physics: CircuitPhysicsState;
  onUpdateWireGauge?: (wireId: string, gauge: number) => void;
  onToggleWireDegradation?: (wireId: string) => void;
  onRemoveWire: (wireId: string) => void;
}

export const VisualConnectorMap: React.FC<VisualConnectorMapProps> = ({
  wires,
  terminals,
  wireSegments,
  physics,
  onUpdateWireGauge,
  onToggleWireDegradation,
  onRemoveWire,
}) => {
  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white shadow-lg space-y-5">
      {/* Header with Live Status Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400 flex items-center justify-center shadow-xs">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">
                Topological Diagnostic
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400 font-mono">
                {wires.length} Active {wires.length === 1 ? "Link" : "Links"}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Visual Connector & Conductor Map
            </h3>
          </div>
        </div>

        {/* Dynamic Scale Indicators */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-slate-400">Conductor Temp:</span>
            <span
              className={`font-bold ${
                physics.wireTemperature > 65
                  ? "text-red-400 animate-pulse font-black"
                  : physics.wireTemperature > 40
                  ? "text-amber-400"
                  : "text-emerald-400"
              }`}
            >
              {physics.wireTemperature} °C
            </span>
          </div>

          <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-slate-400">Peak Current:</span>
            <span
              className={`font-bold ${
                physics.currentAmps > physics.breakerRating ? "text-red-400" : "text-amber-400"
              }`}
            >
              {physics.currentAmps} A
            </span>
          </div>
        </div>
      </div>

      {/* Visual Dynamic Legend: How Thickness & Color Map to Physical Reality */}
      <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2.5">
          <span className="font-bold text-slate-300 uppercase tracking-wider">
            Physical Representation Legend:
          </span>
          <span>Line Thickness = Load Amperage • Color = Thermal & Hazard State</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-[10px] font-mono">
          {/* Legend 1: Idle / Low Load */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-slate-400">Idle / &lt;1A</span>
              <span className="text-slate-500">2.5px</span>
            </div>
            <div className="h-1 rounded-full bg-slate-600 mb-1" />
            <span className="text-[9px] text-slate-400">De-energized or Light</span>
          </div>

          {/* Legend 2: Normal Safe Load */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-emerald-400 font-bold">Safe (1-10A)</span>
              <span className="text-slate-400">4px</span>
            </div>
            <div className="h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)] mb-1" />
            <span className="text-[9px] text-slate-400">24°C - 35°C Ambient</span>
          </div>

          {/* Legend 3: Heavy Load */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-amber-400 font-bold">Heavy (10-16A)</span>
              <span className="text-slate-400">6px</span>
            </div>
            <div className="h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.7)] mb-1" />
            <span className="text-[9px] text-slate-400">35°C - 55°C Warming</span>
          </div>

          {/* Legend 4: Overload */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-orange-400 font-bold">Overload (&gt;16A)</span>
              <span className="text-slate-400">8.5px</span>
            </div>
            <div className="h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)] mb-1 animate-pulse" />
            <span className="text-[9px] text-slate-400">55°C - 75°C Overheat</span>
          </div>

          {/* Legend 5: Degraded / Corroded */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-rose-400 font-bold">Degraded (4.8Ω)</span>
              <span className="text-slate-400">High R</span>
            </div>
            <div className="h-2 rounded-full bg-gradient-to-r from-orange-600 via-rose-600 to-red-600 shadow-[0_0_10px_rgba(225,29,72,0.8)] mb-1" />
            <span className="text-[9px] text-slate-400">&gt;80°C Thermal Runaway</span>
          </div>

          {/* Legend 6: Short Circuit Flash */}
          <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-red-400 font-black">Short (180A+)</span>
              <span className="text-red-300">12px</span>
            </div>
            <div className="h-3 rounded-full bg-red-600 shadow-[0_0_12px_rgba(239,68,68,0.9)] mb-1 animate-ping" />
            <span className="text-[9px] text-slate-400">Instant Surge Blast</span>
          </div>
        </div>
      </div>

      {/* Wire Connectors Table & Interactive Diagnostic Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300 font-semibold px-1">
          <span>Active Circuit Conductors ({wireSegments.length})</span>
          <span className="text-[11px] text-slate-400 font-normal">
            Wire gauge & degradation affect electrical resistance ($R$) and heat dissipation ($P=I^2R$)
          </span>
        </div>

        {wireSegments.length === 0 ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-slate-400 text-xs">
            No active conductors in circuit. Click terminals in the schematic above to create connections.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {wireSegments.map((segment) => {
              const isOverheated = segment.temperatureC > 65;
              const isOverloaded = segment.loadPercentage > 100;
              const isDegraded = segment.degradation !== "optimal";

              return (
                <div
                  key={segment.wireId}
                  className={`p-3.5 rounded-xl border transition-all relative overflow-hidden flex flex-col justify-between ${
                    segment.statusBadge === "short_fault"
                      ? "bg-red-950/40 border-red-500/80 shadow-red-950/50"
                      : segment.statusBadge === "shock_hazard"
                      ? "bg-rose-950/40 border-rose-500/80 shadow-rose-950/50"
                      : isOverheated
                      ? "bg-orange-950/40 border-orange-500/80 shadow-orange-950/50"
                      : isOverloaded
                      ? "bg-amber-950/30 border-amber-500/60"
                      : "bg-slate-950/80 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {/* Visual Wire Strip Indicator across the card header */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1.5 transition-all"
                    style={{
                      backgroundColor: segment.strokeColor,
                      boxShadow: `0 0 10px ${segment.glowColor}`,
                    }}
                  />

                  {/* Top Bar: Connection Terminals & Status Badge */}
                  <div className="flex items-start justify-between gap-2 pt-1 mb-2.5">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: segment.strokeColor }}
                        />
                        <span className="text-xs font-mono font-bold text-white">
                          {segment.fromLabel} ➔ {segment.toLabel}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {segment.componentFrom} to {segment.componentTo}
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase shrink-0 ${
                        segment.statusBadge === "short_fault"
                          ? "bg-red-500 text-white animate-pulse"
                          : segment.statusBadge === "shock_hazard"
                          ? "bg-rose-600 text-white animate-pulse"
                          : segment.statusBadge === "degraded"
                          ? "bg-orange-600 text-white"
                          : segment.statusBadge === "overloaded"
                          ? "bg-amber-500 text-slate-950"
                          : segment.statusBadge === "warm"
                          ? "bg-amber-900/60 text-amber-300 border border-amber-700"
                          : segment.statusBadge === "idle"
                          ? "bg-slate-800 text-slate-400"
                          : "bg-emerald-950 text-emerald-300 border border-emerald-800"
                      }`}
                    >
                      {segment.statusText}
                    </span>
                  </div>

                  {/* Wire Metric Grid */}
                  <div className="grid grid-cols-4 gap-2 py-2 px-2.5 rounded-lg bg-slate-900/90 border border-slate-800/80 text-center font-mono text-[11px] mb-3">
                    <div>
                      <span className="text-[9px] text-slate-400 block">CURRENT</span>
                      <strong
                        className={`text-xs ${
                          isOverloaded ? "text-red-400 font-black" : "text-amber-300"
                        }`}
                      >
                        {segment.currentAmps} A
                      </strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">LOAD %</span>
                      <strong
                        className={`text-xs ${
                          segment.loadPercentage > 100
                            ? "text-red-400 font-bold"
                            : segment.loadPercentage > 75
                            ? "text-amber-300"
                            : "text-slate-300"
                        }`}
                      >
                        {Math.round(segment.loadPercentage)}%
                      </strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">RESISTANCE</span>
                      <strong
                        className={`text-xs ${
                          segment.resistanceOhms > 1.0 ? "text-orange-400 font-bold" : "text-slate-300"
                        }`}
                      >
                        {segment.resistanceOhms} Ω
                      </strong>
                    </div>

                    <div>
                      <span className="text-[9px] text-slate-400 block">TEMP</span>
                      <strong
                        className={`text-xs ${
                          isOverheated ? "text-red-400 font-black animate-pulse" : "text-emerald-400"
                        }`}
                      >
                        {segment.temperatureC} °C
                      </strong>
                    </div>
                  </div>

                  {/* Wire Thickness Gauge & Physical Controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 gap-2">
                    {/* Visual thickness representation bar */}
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-mono text-slate-400">Stroke:</span>
                      <div className="w-16 h-3.5 bg-slate-900 rounded flex items-center px-1">
                        <div
                          className="rounded-full transition-all"
                          style={{
                            height: `${Math.min(10, Math.max(2, segment.displayThickness))}px`,
                            width: "100%",
                            backgroundColor: segment.strokeColor,
                            boxShadow: `0 0 6px ${segment.glowColor}`,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">
                        {Math.round(segment.displayThickness * 10) / 10}px
                      </span>
                    </div>

                    {/* Interactive Degradation and Snip controls */}
                    <div className="flex items-center space-x-1.5">
                      {/* Gauge Selector */}
                      {onUpdateWireGauge && (
                        <div className="flex items-center space-x-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[10px] font-mono">
                          {[14, 12, 10].map((g) => (
                            <button
                              key={g}
                              onClick={() => onUpdateWireGauge(segment.wireId, g)}
                              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                segment.gauge === g
                                  ? "bg-blue-600 text-white font-bold"
                                  : "text-slate-400 hover:text-white"
                              }`}
                              title={`${g} AWG (${g === 14 ? "15A" : g === 12 ? "20A" : "30A"} safe)`}
                            >
                              {g}G
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Degradation Toggle */}
                      {onToggleWireDegradation && (
                        <button
                          onClick={() => onToggleWireDegradation(segment.wireId)}
                          className={`px-2 py-1 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                            isDegraded
                              ? "bg-orange-600/30 text-orange-300 border-orange-500/50 hover:bg-orange-600/50"
                              : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                          }`}
                          title="Simulate wire age and resistance degradation"
                        >
                          {isDegraded ? "Aged (4.8Ω)" : "New (0.2Ω)"}
                        </button>
                      )}

                      {/* Snip / Disconnect Button */}
                      <button
                        onClick={() => onRemoveWire(segment.wireId)}
                        className="px-2 py-1 rounded text-[10px] font-mono font-bold bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-800 hover:border-red-800 transition-colors cursor-pointer"
                        title="Disconnect this wire"
                      >
                        Snip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Terminal Node Health & Potential Matrix */}
      <div className="pt-3 border-t border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
            Terminal Node Potential & Ground Bonding:
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Ground Loop: {physics.earthResistance < 50 ? "BONDED (5Ω)" : "OPEN (∞)"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-[10px] font-mono">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">L1 Mains</span>
            <span className="text-blue-400 font-bold">{physics.nominalVoltage}V</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Neutral N</span>
            <span className="text-sky-400 font-bold">0.0V</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Breaker Out</span>
            <span className={physics.breakerState === "closed" ? "text-amber-400 font-bold" : "text-slate-500"}>
              {physics.breakerState === "closed" ? `${physics.voltageEffective}V` : "0V (Tripped)"}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Switch Out</span>
            <span className={physics.switchState === "on" && physics.breakerState === "closed" ? "text-amber-400 font-bold" : "text-slate-500"}>
              {physics.switchState === "on" && physics.breakerState === "closed" ? `${physics.voltageEffective}V` : "0V (Open)"}
            </span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">100W Lamp</span>
            <span className={physics.circuitClosed ? "text-emerald-400 font-bold" : "text-slate-500"}>
              {physics.circuitClosed ? "ACTIVE" : "OFF"}
            </span>
          </div>

          <div
            className={`p-2 rounded-lg border ${
              physics.chassisTouchVoltage > 50
                ? "bg-red-950/80 border-red-500 text-red-300 font-black animate-pulse"
                : "bg-slate-950 border-slate-800 text-emerald-400"
            }`}
          >
            <span className="block text-slate-400">Chassis Potential</span>
            <span>{physics.chassisTouchVoltage}V</span>
          </div>

          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">Earth Stake</span>
            <span className={physics.earthResistance < 50 ? "text-emerald-400 font-bold" : "text-red-400"}>
              {physics.earthResistance < 50 ? "5.0Ω Ground" : "DISCONNECTED"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
