import React from "react";
import { useSimulation } from "../../context/SimulationContext";
import { CircuitId, RoomId } from "../../types/simulation";
import { Layers, Zap, AlertTriangle, ShieldCheck } from "lucide-react";

interface ConduitRoutingVisualizerProps {
  onSelectCircuit: (circuitId: CircuitId) => void;
  selectedCircuitId: CircuitId | null;
}

export const ConduitRoutingVisualizer: React.FC<ConduitRoutingVisualizerProps> = ({
  onSelectCircuit,
  selectedCircuitId,
}) => {
  const { circuits, appliances, metrics, protectionState } = useSimulation();

  const isMasterOff = protectionState === "DISCONNECTED";

  const roomNames: Record<RoomId, string> = {
    living_room: "Living Room",
    kitchen: "Kitchen",
    bedroom: "Bedroom",
    garage_utility: "Garage / Utility",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2 text-xs">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="font-bold text-slate-800 uppercase tracking-wider">
            In-Wall Feeder Conduits (Panel ➔ Rooms)
          </span>
        </div>
        <span className="text-[11px] text-slate-500">
          Click any feeder line below to inspect its dedicated distribution path
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {circuits.map((c, idx) => {
          const activeApps = appliances.filter((a) => a.circuitId === c.id && a.isOn);
          const activeWatts = activeApps.reduce((sum, a) => sum + a.nominalWatts, 0);
          const currentA = isMasterOff || c.isBreakerTripped ? 0 : activeWatts / metrics.voltage;
          const isTripped = c.isBreakerTripped || isMasterOff;
          const isSelected = selectedCircuitId === c.id;
          const isOverloaded = currentA > c.breakerRating;
          const targetRoom = c.roomIds[0] ? roomNames[c.roomIds[0]] : "Household Zone";

          return (
            <button
              key={c.id}
              onClick={() => onSelectCircuit(c.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? "ring-2 ring-blue-500 bg-blue-50/70 border-blue-400 shadow-sm"
                  : isTripped
                  ? "bg-slate-100/90 border-slate-200 opacity-80"
                  : isOverloaded
                  ? "bg-red-50/80 border-red-300"
                  : "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
              }`}
            >
              {/* Dynamic flowing top conduit line graphic */}
              <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden mb-2 relative">
                {!isTripped && currentA > 0 && (
                  <div
                    className={`h-full animate-pulse rounded-full ${
                      isOverloaded ? "bg-red-500" : "bg-blue-500"
                    }`}
                    style={{
                      backgroundColor: isOverloaded ? "#ef4444" : c.color,
                    }}
                  />
                )}
              </div>

              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: isTripped ? "#94a3b8" : c.color }}
                  />
                  <span className="text-xs font-bold text-slate-900">
                    B{idx + 1}: {targetRoom}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    isTripped
                      ? "bg-slate-200 text-slate-600"
                      : isOverloaded
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {isTripped ? "OFF / 0A" : `${currentA.toFixed(1)}A / ${c.breakerRating}A`}
                </span>
              </div>

              <div className="text-[11px] text-slate-500 flex items-center justify-between mt-1">
                <span>{c.wireGauge} Romex ({c.wireCondition.toLowerCase()})</span>
                <span className="font-mono font-semibold text-slate-700">{activeWatts} W</span>
              </div>

              {/* Status footer */}
              <div className="mt-2 pt-1.5 border-t border-slate-200/70 flex items-center justify-between text-[10px]">
                <span
                  className={
                    isTripped
                      ? "text-slate-400 font-semibold"
                      : isOverloaded
                      ? "text-red-600 font-bold flex items-center space-x-1"
                      : "text-emerald-600 font-medium"
                  }
                >
                  {isTripped ? "Conductor De-energized" : isOverloaded ? "Overcurrent Limit Exceeded" : "Energized & Feeding Room"}
                </span>
                <span className="text-blue-600 font-semibold">
                  {isSelected ? "Selected" : "Inspect"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
