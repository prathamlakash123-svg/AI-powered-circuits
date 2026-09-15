import React, { useState } from "react";
import { useSimulation } from "../../context/SimulationContext";
import { Appliance, CircuitId, RoomId } from "../../types/simulation";
import {
  Tv,
  Refrigerator,
  Microwave,
  Laptop,
  Flame,
  Fan,
  Lightbulb,
  Plug,
  Power,
  Zap,
  Check,
  AlertTriangle,
  Info,
  Layers,
  Plus,
  X,
  Sliders,
  ShieldAlert,
  Eye,
  EyeOff,
  Move,
} from "lucide-react";

interface InteractiveFloorPlanProps {
  viewMode: "architectural" | "xray";
  onProbeAppliance?: (appliance: Appliance, voltage: number, current: number, notes: string) => void;
  isProbeActive?: boolean;
  selectedCircuitId: CircuitId | null;
  onOpenAddModal: () => void;
}

export const InteractiveFloorPlan: React.FC<InteractiveFloorPlanProps> = ({
  viewMode,
  onProbeAppliance,
  isProbeActive = false,
  selectedCircuitId,
  onOpenAddModal,
}) => {
  const {
    appliances,
    circuits,
    metrics,
    protectionState,
    toggleAppliance,
    assignApplianceCircuit,
    moveApplianceRoom,
    toggleApplianceFault,
  } = useSimulation();

  const [selectedAppliance, setSelectedAppliance] = useState<Appliance | null>(null);
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);

  const isMasterOff = protectionState === "DISCONNECTED";

  const rooms: {
    id: RoomId;
    title: string;
    subtitle: string;
    defaultCircuit: CircuitId;
    bgArch: string;
    borderArch: string;
  }[] = [
    {
      id: "living_room",
      title: "Living Room",
      subtitle: "Entertainment & Ambient Lighting",
      defaultCircuit: "circuit_1",
      bgArch: "bg-blue-50/50",
      borderArch: "border-blue-200",
    },
    {
      id: "kitchen",
      title: "Kitchen",
      subtitle: "High-Draw Cooking & Cooling",
      defaultCircuit: "circuit_2",
      bgArch: "bg-amber-50/50",
      borderArch: "border-amber-200",
    },
    {
      id: "bedroom",
      title: "Bedroom",
      subtitle: "Study, Heating & Comfort",
      defaultCircuit: "circuit_3",
      bgArch: "bg-indigo-50/50",
      borderArch: "border-indigo-200",
    },
    {
      id: "garage_utility",
      title: "Garage / Utility",
      subtitle: "Heavy Machinery & Laundry",
      defaultCircuit: "circuit_4",
      bgArch: "bg-slate-100/70",
      borderArch: "border-slate-300",
    },
  ];

  const getApplianceIcon = (type: Appliance["type"], className: string) => {
    switch (type) {
      case "tv":
        return <Tv className={className} />;
      case "refrigerator":
        return <Refrigerator className={className} />;
      case "microwave":
        return <Microwave className={className} />;
      case "computer":
        return <Laptop className={className} />;
      case "heater":
        return <Flame className={className} />;
      case "fan":
        return <Fan className={className} />;
      case "light":
        return <Lightbulb className={className} />;
      default:
        return <Plug className={className} />;
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    setDraggedAppId(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropRoom = (e: React.DragEvent, targetRoom: RoomId) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggedAppId;
    if (id) {
      moveApplianceRoom(id, targetRoom);
      setDraggedAppId(null);
    }
  };

  // Quick helper to turn all appliances in a room ON or OFF
  const handleToggleRoomAll = (roomId: RoomId, targetState: boolean) => {
    const roomApps = appliances.filter((a) => a.room === roomId);
    roomApps.forEach((a) => {
      if (a.isOn !== targetState) {
        toggleAppliance(a.id);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 2D 4-Room Interactive Floor Plan Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rooms.map((room) => {
          const roomAppliances = appliances.filter((a) => a.room === room.id);
          const activeRoomWatts = roomAppliances
            .filter((a) => a.isOn)
            .reduce((sum, a) => {
              const assignedC = circuits.find((c) => c.id === a.circuitId);
              if (isMasterOff || assignedC?.isBreakerTripped) return sum;
              return sum + a.nominalWatts;
            }, 0);

          // Find which circuits feed this room
          const feedingCircuitIds = Array.from(
            new Set(roomAppliances.map((a) => a.circuitId))
          );
          const allFeedingCircuitsTripped =
            isMasterOff ||
            (feedingCircuitIds.length > 0 &&
              feedingCircuitIds.every((cid) => {
                const c = circuits.find((x) => x.id === cid);
                return c?.isBreakerTripped;
              }));

          const hasSelectedCircuit =
            selectedCircuitId &&
            roomAppliances.some((a) => a.circuitId === selectedCircuitId);

          return (
            <div
              key={room.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDropRoom(e, room.id)}
              className={`min-h-[290px] rounded-2xl border-2 p-4 shadow-sm flex flex-col justify-between transition-all relative overflow-hidden ${
                allFeedingCircuitsTripped
                  ? "bg-slate-900/90 border-slate-700 text-slate-300"
                  : viewMode === "xray"
                  ? "bg-slate-900 border-slate-700 text-slate-100"
                  : `${room.bgArch} ${room.borderArch} text-slate-800`
              } ${hasSelectedCircuit ? "ring-2 ring-blue-500 shadow-md" : ""}`}
            >
              {/* Room Blackout Overlay when power is cut */}
              {allFeedingCircuitsTripped && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center p-4 pointer-events-none select-none text-center">
                  <div className="w-10 h-10 rounded-full bg-red-950/80 border border-red-700/80 flex items-center justify-center text-red-400 mb-2">
                    <Power className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    Room De-Energized (Blackout)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                    {isMasterOff
                      ? "Main 100A switch is turned OFF on the panel."
                      : "Feeder circuit breaker has tripped or been isolated."}
                  </p>
                </div>
              )}

              {/* Room Header with Quick Controls */}
              <div className="flex items-center justify-between border-b pb-2.5 mb-3 border-slate-200/60 dark:border-slate-700/60 z-20">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold tracking-tight">
                      {room.title}
                    </h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {roomAppliances.length} devices
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {room.subtitle}
                  </p>
                </div>

                {/* Quick Room Power Buttons */}
                <div className="flex items-center space-x-1.5 text-[10px]">
                  <button
                    onClick={() => handleToggleRoomAll(room.id, true)}
                    className="px-2 py-1 rounded bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold transition-colors cursor-pointer"
                    title="Turn all appliances in this room ON"
                  >
                    All ON
                  </button>
                  <button
                    onClick={() => handleToggleRoomAll(room.id, false)}
                    className="px-2 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold transition-colors cursor-pointer"
                    title="Turn all appliances in this room OFF"
                  >
                    All OFF
                  </button>
                </div>
              </div>

              {/* X-Ray Mode Wall Wiring Banner */}
              {viewMode === "xray" && (
                <div className="mb-2.5 p-2 rounded-lg bg-slate-800/90 border border-slate-700 text-[10px] font-mono flex items-center justify-between text-slate-300 z-20">
                  <span className="flex items-center space-x-1 text-purple-400">
                    <Layers className="w-3.5 h-3.5" />
                    <span>In-Wall Romex 14/2 with Ground</span>
                  </span>
                  <span>Concealed Branch Junction</span>
                </div>
              )}

              {/* Appliances Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 flex-1 content-start z-20">
                {roomAppliances.map((app) => {
                  const assignedCircuit = circuits.find((c) => c.id === app.circuitId);
                  const isCircuitTripped =
                    isMasterOff || (assignedCircuit && assignedCircuit.isBreakerTripped);
                  const isPowered = app.isOn && !isCircuitTripped;
                  const currentA = isPowered ? app.nominalWatts / metrics.voltage : 0;

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => {
                        if (isProbeActive && onProbeAppliance) {
                          onProbeAppliance(
                            app,
                            isPowered ? metrics.voltage : 0,
                            currentA,
                            isPowered
                              ? `Nominal load: ${app.nominalWatts}W (${currentA.toFixed(2)}A) on ${assignedCircuit?.name}`
                              : "Appliance is unpowered (circuit open or switch OFF)"
                          );
                        } else {
                          setSelectedAppliance(app);
                        }
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer relative flex flex-col justify-between select-none ${
                        isProbeActive
                          ? "hover:ring-2 hover:ring-amber-400"
                          : ""
                      } ${
                        app.isFaulty
                          ? "ring-2 ring-red-500 bg-red-50 dark:bg-red-950/40 border-red-300"
                          : isPowered
                          ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-400"
                          : "bg-slate-100/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-400"
                      }`}
                    >
                      {/* Top status bar & power toggle */}
                      <div className="flex items-center justify-between mb-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor: isPowered
                              ? assignedCircuit?.color || "#3b82f6"
                              : "#94a3b8",
                          }}
                          title={`Fed by ${assignedCircuit?.name}`}
                        />

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleAppliance(app.id);
                          }}
                          className={`p-1 px-1.5 rounded-md text-[10px] font-bold flex items-center space-x-1 cursor-pointer transition-colors ${
                            app.isOn
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-slate-200 text-slate-600 hover:bg-slate-300 dark:bg-slate-700 dark:text-slate-300"
                          }`}
                        >
                          <Power className="w-3 h-3" />
                          <span>{app.isOn ? "ON" : "OFF"}</span>
                        </button>
                      </div>

                      {/* Icon and Device Name */}
                      <div className="flex items-center space-x-2 my-1">
                        <div
                          className={`p-1.5 rounded-lg ${
                            isPowered
                              ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                              : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                          }`}
                        >
                          {getApplianceIcon(app.type, "w-4 h-4")}
                        </div>
                        <span className="text-xs font-semibold leading-tight line-clamp-1">
                          {app.name}
                        </span>
                      </div>

                      {/* Watts and Circuit details */}
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[10px] font-mono">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">
                          {app.nominalWatts} W
                        </span>
                        <span className="text-slate-400 truncate max-w-[65px]">
                          {assignedCircuit?.id.replace("circuit_", "B") || "B?"}
                        </span>
                      </div>

                      {/* Fault Flag */}
                      {app.isFaulty && (
                        <div className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center space-x-0.5 animate-pulse">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          <span>28mA LEAK</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {roomAppliances.length === 0 && (
                  <div className="col-span-full py-8 text-center text-xs text-slate-400 italic">
                    Drop appliances here or click "Add Appliance"
                  </div>
                )}
              </div>

              {/* Room Bottom Summary */}
              <div className="mt-3 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 z-20 font-mono">
                <span>
                  Active Room Load:{" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    {activeRoomWatts} W
                  </strong>
                </span>
                <span className="text-[10px] text-slate-400">
                  {allFeedingCircuitsTripped ? "Circuit Tripped" : "Drag to relocate"}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Appliance Detail & Diagnostics Modal */}
      {selectedAppliance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setSelectedAppliance(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                {getApplianceIcon(selectedAppliance.type, "w-6 h-6")}
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                  Appliance &amp; Circuit Diagnostics
                </span>
                <h3 className="text-lg font-bold text-slate-900">
                  {selectedAppliance.name}
                </h3>
              </div>
            </div>

            {/* Electrical Parameters Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-4">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">
                  Power Rating
                </span>
                <strong className="text-sm text-slate-800 font-mono">
                  {selectedAppliance.nominalWatts} Watts
                </strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <span className="text-slate-400 block text-[10px] uppercase font-mono">
                  Current at {metrics.voltage}V
                </span>
                <strong className="text-sm text-slate-800 font-mono">
                  {selectedAppliance.isOn
                    ? (selectedAppliance.nominalWatts / metrics.voltage).toFixed(2)
                    : "0.00"}{" "}
                  Amps
                </strong>
              </div>
            </div>

            {/* Simulated Chassis Ground Fault Injection (Crucial for understanding RCD) */}
            <div className="mb-4 p-3 rounded-xl bg-amber-50/80 border border-amber-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Chassis Ground Fault Injection</span>
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    selectedAppliance.isFaulty
                      ? "bg-red-100 text-red-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {selectedAppliance.isFaulty ? "FAULT ACTIVE (28mA)" : "INSULATION HEALTHY"}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-snug mb-2">
                Simulates insulation failure causing 28mA of current to leak into the metal chassis. Tests whether your RCD trips to prevent human shock!
              </p>
              <button
                onClick={() => {
                  toggleApplianceFault(selectedAppliance.id);
                  setSelectedAppliance({
                    ...selectedAppliance,
                    isFaulty: !selectedAppliance.isFaulty,
                    leakageCurrentMa: !selectedAppliance.isFaulty ? 28 : 0,
                  });
                }}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  selectedAppliance.isFaulty
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    : "bg-red-600 hover:bg-red-700 text-white shadow-sm"
                }`}
              >
                {selectedAppliance.isFaulty
                  ? "Clear Fault (Restore Healthy Insulation)"
                  : "Inject 28mA Ground Leakage (Test RCD Trip)"}
              </button>
            </div>

            {/* Reassign Branch Circuit Selector */}
            <div className="mb-4">
              <label className="text-xs font-bold text-slate-700 block mb-1.5">
                Feed from Branch Circuit Breaker
              </label>
              <div className="space-y-1.5">
                {circuits.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      assignApplianceCircuit(selectedAppliance.id, c.id);
                      setSelectedAppliance({ ...selectedAppliance, circuitId: c.id });
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer text-left ${
                      selectedAppliance.circuitId === c.id
                        ? "bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400 font-bold"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: c.color }}
                      />
                      <span>{c.name}</span>
                    </div>
                    {selectedAppliance.circuitId === c.id && (
                      <Check className="w-4 h-4 text-blue-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200">
              <button
                onClick={() => {
                  toggleAppliance(selectedAppliance.id);
                  setSelectedAppliance({
                    ...selectedAppliance,
                    isOn: !selectedAppliance.isOn,
                  });
                }}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  selectedAppliance.isOn
                    ? "bg-slate-100 hover:bg-slate-200 text-slate-800"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {selectedAppliance.isOn ? "Turn Device OFF" : "Turn Device ON"}
              </button>

              <button
                onClick={() => setSelectedAppliance(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
