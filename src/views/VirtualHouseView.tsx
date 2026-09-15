import React, { useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { Appliance, CircuitId, RoomId } from "../types/simulation";
import { HowItWorksWalkthrough } from "../components/house/HowItWorksWalkthrough";
import { ElectricalPanelUnit } from "../components/house/ElectricalPanelUnit";
import { ConduitRoutingVisualizer } from "../components/house/ConduitRoutingVisualizer";
import { InteractiveFloorPlan } from "../components/house/InteractiveFloorPlan";
import { MultimeterProbeTool, ProbeMeasurement } from "../components/house/MultimeterProbeTool";
import { QuickExperimentBar } from "../components/house/QuickExperimentBar";
import {
  HelpCircle,
  Eye,
  EyeOff,
  Plus,
  Zap,
  Sliders,
  X,
  Layers,
  Activity,
  Check,
} from "lucide-react";

export const VirtualHouseView: React.FC = () => {
  const {
    appliances,
    circuits,
    metrics,
    addAppliance,
    playSound,
  } = useSimulation();

  const [showWalkthrough, setShowWalkthrough] = useState<boolean>(true);
  const [activeWalkthroughStep, setActiveWalkthroughStep] = useState<number>(1);
  const [viewMode, setViewMode] = useState<"architectural" | "xray">("architectural");
  const [selectedCircuitId, setSelectedCircuitId] = useState<CircuitId | null>(null);

  // Multimeter probe state
  const [isProbeActive, setIsProbeActive] = useState<boolean>(false);
  const [currentMeasurement, setCurrentMeasurement] = useState<ProbeMeasurement | null>(null);

  // Add Appliance modal state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newAppName, setNewAppName] = useState("");
  const [newAppWatts, setNewAppWatts] = useState(1200);
  const [newAppRoom, setNewAppRoom] = useState<RoomId>("kitchen");
  const [newAppCircuit, setNewAppCircuit] = useState<CircuitId>("circuit_2");
  const [newAppType, setNewAppType] = useState<Appliance["type"]>("microwave");

  // Probe handler
  const handleProbe = (
    targetName: string,
    voltage: number,
    current: number,
    notes: string,
    watts?: number
  ) => {
    setCurrentMeasurement({
      targetName,
      voltage,
      current,
      watts: watts ?? voltage * current,
      notes,
      timestamp: new Date().toLocaleTimeString(),
    });
    playSound("click");
  };

  const handleAddApplianceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAppName.trim()) return;

    addAppliance({
      name: newAppName.trim(),
      type: newAppType,
      room: newAppRoom,
      circuitId: newAppCircuit,
      nominalWatts: Number(newAppWatts) || 500,
      isOn: true,
      iconName: newAppType,
    });

    setNewAppName("");
    setShowAddModal(false);
    playSound("success");
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header with Context and View Mode Toggles */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <Zap className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Virtual House &amp; Electrical Distribution
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Interactive real-time model linking utility power, consumer panel breakers, in-wall wiring, and household appliances.
              </p>
            </div>
          </div>
        </div>

        {/* View Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Toggle How It Works Guide */}
          <button
            onClick={() => setShowWalkthrough(!showWalkthrough)}
            className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              showWalkthrough
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{showWalkthrough ? "Hide Flow Guide" : "How It Works Guide"}</span>
          </button>

          {/* Architectural vs X-Ray Wire Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setViewMode("architectural")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "architectural"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-blue-600" />
              <span>Room View</span>
            </button>
            <button
              onClick={() => setViewMode("xray")}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                viewMode === "xray"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>X-Ray In-Wall Wires</span>
            </button>
          </div>

          {/* Add Custom Appliance */}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>Add Appliance</span>
          </button>
        </div>
      </div>

      {/* Quick Hands-On Experiments Bar */}
      <QuickExperimentBar />

      {/* Multimeter Probe Tool HUD */}
      <MultimeterProbeTool
        isActive={isProbeActive}
        onToggleActive={() => setIsProbeActive(!isProbeActive)}
        measurement={currentMeasurement}
        onClearMeasurement={() => setCurrentMeasurement(null)}
      />

      {/* Interactive Step-by-Step 'How It Works' Guide (Street to Socket) */}
      {showWalkthrough && (
        <HowItWorksWalkthrough
          activeStep={activeWalkthroughStep}
          onSelectStep={(stepId) => setActiveWalkthroughStep(stepId)}
          onClose={() => setShowWalkthrough(false)}
        />
      )}

      {/* Side-by-Side Integrated Layout: Residential Consumer Unit + Live In-Wall Conduits */}
      <div className="space-y-4">
        {/* Electrical Panel Enclosure */}
        <ElectricalPanelUnit
          isProbeActive={isProbeActive}
          onProbeComponent={(name, v, a, notes) => handleProbe(name, v, a, notes)}
        />

        {/* Dynamic In-Wall Feeder Conduits */}
        <ConduitRoutingVisualizer
          selectedCircuitId={selectedCircuitId}
          onSelectCircuit={(cid) =>
            setSelectedCircuitId(selectedCircuitId === cid ? null : cid)
          }
        />

        {/* 4-Room Floor Plan with Appliances and Ambient Lighting */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center space-x-2">
              <span>Household Floor Plan &amp; Receptacles</span>
              <span className="text-xs text-slate-500 font-normal">
                (Click any appliance to inspect or inject ground faults, drag to relocate)
              </span>
            </h3>
            {selectedCircuitId && (
              <button
                onClick={() => setSelectedCircuitId(null)}
                className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
              >
                Clear Circuit Filter
              </button>
            )}
          </div>

          <InteractiveFloorPlan
            viewMode={viewMode}
            selectedCircuitId={selectedCircuitId}
            isProbeActive={isProbeActive}
            onProbeAppliance={(app, v, a, notes) =>
              handleProbe(`${app.name} (${app.room})`, v, a, notes, app.nominalWatts)
            }
            onOpenAddModal={() => setShowAddModal(true)}
          />
        </div>
      </div>

      {/* Add Custom Appliance Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Add Household Appliance</h3>
                <p className="text-xs text-slate-500">
                  Connect a new device to test electrical load and branch circuit capacity.
                </p>
              </div>
            </div>

            <form onSubmit={handleAddApplianceSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Appliance Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Electric Kettle, Induction Cooktop"
                  value={newAppName}
                  onChange={(e) => setNewAppName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Power (Watts)</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    step={50}
                    value={newAppWatts}
                    onChange={(e) => setNewAppWatts(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    ~{(newAppWatts / metrics.voltage).toFixed(1)}A at 230V
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={newAppType}
                    onChange={(e) => setNewAppType(e.target.value as Appliance["type"])}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="microwave">Cooking / Microwave</option>
                    <option value="heater">Heating / Kettle</option>
                    <option value="refrigerator">Cooling / Fridge</option>
                    <option value="tv">Entertainment / TV</option>
                    <option value="computer">Computer / Office</option>
                    <option value="light">Lighting</option>
                    <option value="outlet">General Socket Outlet</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Install in Room</label>
                  <select
                    value={newAppRoom}
                    onChange={(e) => setNewAppRoom(e.target.value as RoomId)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="living_room">Living Room</option>
                    <option value="kitchen">Kitchen</option>
                    <option value="bedroom">Bedroom</option>
                    <option value="garage_utility">Garage / Utility</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Feed from Circuit</label>
                  <select
                    value={newAppCircuit}
                    onChange={(e) => setNewAppCircuit(e.target.value as CircuitId)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    {circuits.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.breakerRating}A)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold cursor-pointer shadow-sm"
                >
                  Add to House
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
