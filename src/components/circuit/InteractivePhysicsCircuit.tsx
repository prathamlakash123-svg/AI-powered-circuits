import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  Zap,
  RotateCcw,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Power,
  Sliders,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Bot,
  Activity,
  Sparkles,
  Info,
  CheckCircle2,
  Trash2,
  HelpCircle,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  Wrench,
  X,
} from "lucide-react";
import {
  CircuitWire,
  CircuitCondition,
  Terminal,
  TerminalId,
  CircuitPhysicsState,
  AiActionPlan,
  WireSegmentPhysics,
  WireDegradation,
} from "../../types/circuitPhysics";
import { VisualConnectorMap } from "./VisualConnectorMap";
import { FaultPhysicsGraph } from "./FaultPhysicsGraph";
import { useSimulation } from "../../context/SimulationContext";

// Fixed positions on 100% x 100% canvas for clean electrical schematic layout
const TERMINALS: Terminal[] = [
  // Mains AC Supply
  { id: "mains_live", label: "L (Live)", type: "live", x: 8, y: 22, componentName: "AC Mains Supply" },
  { id: "mains_neutral", label: "N (Neutral)", type: "neutral", x: 8, y: 78, componentName: "AC Mains Supply" },
  { id: "mains_earth", label: "PE (Earth)", type: "earth", x: 8, y: 92, componentName: "AC Mains Supply" },

  // Breaker / Protection
  { id: "breaker_in", label: "In", type: "breaker", x: 26, y: 22, componentName: "Circuit Breaker (MCB)" },
  { id: "breaker_out", label: "Out", type: "breaker", x: 38, y: 22, componentName: "Circuit Breaker (MCB)" },

  // Main Switch
  { id: "switch_in", label: "In", type: "switch", x: 50, y: 22, componentName: "Power Switch" },
  { id: "switch_out", label: "Out", type: "switch", x: 62, y: 22, componentName: "Power Switch" },

  // Load 1: Normal 100W Lamp
  { id: "load1_in", label: "L1 In", type: "load", x: 74, y: 22, componentName: "Lamp (100W)" },
  { id: "load1_out", label: "L1 Out", type: "neutral", x: 86, y: 22, componentName: "Lamp (100W)" },

  // Load 2: 2500W Heavy Heater (Parallel)
  { id: "load2_in", label: "L2 In", type: "load", x: 74, y: 52, componentName: "Heater (2500W)" },
  { id: "load2_out", label: "L2 Out", type: "neutral", x: 86, y: 52, componentName: "Heater (2500W)" },

  // Appliance Chassis & Fault
  { id: "chassis_tap", label: "Chassis Tap", type: "live", x: 62, y: 52, componentName: "Metal Chassis" },
  { id: "chassis_earth", label: "Earth Lug", type: "earth", x: 62, y: 70, componentName: "Metal Chassis" },

  // Earth Rod Grounding
  { id: "earth_rod", label: "Earth Rod", type: "earth", x: 86, y: 92, componentName: "Earth Stake" },
];

const DEFAULT_WIRES: CircuitWire[] = [
  { id: "w1", from: "mains_live", to: "breaker_in", color: "live" },
  { id: "w2", from: "breaker_out", to: "switch_in", color: "live" },
  { id: "w3", from: "switch_out", to: "load1_in", color: "live" },
  { id: "w4", from: "load1_out", to: "mains_neutral", color: "neutral" },
  { id: "w5", from: "chassis_earth", to: "earth_rod", color: "earth" },
  { id: "w6", from: "mains_earth", to: "earth_rod", color: "earth" },
];

export const InteractivePhysicsCircuit: React.FC = () => {
  const { settings, playSound } = useSimulation();

  // Circuit Wiring State
  const [wires, setWires] = useState<CircuitWire[]>(DEFAULT_WIRES);
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalId | null>(null);

  // Switch & Component States
  const [switchState, setSwitchState] = useState<"on" | "off">("on");
  const [breakerRating, setBreakerRating] = useState<number>(16); // 16A default
  const [breakerState, setBreakerState] = useState<"closed" | "tripped">("closed");
  const [hasRccb, setHasRccb] = useState<boolean>(true);
  const [rccbState, setRccbState] = useState<"closed" | "tripped">("closed");
  const [wireGauge, setWireGauge] = useState<number>(12); // 12 AWG
  const [wireCondition, setWireCondition] = useState<"good" | "degraded">("good");
  const [earthConnected, setEarthConnected] = useState<boolean>(true);

  // Active Condition (Applied to this same circuit)
  const [activeCondition, setActiveCondition] = useState<CircuitCondition>("normal");

  // Feature: Interactive Graph Drawer - ONLY draws when user clicks on it!
  const [showFaultGraph, setShowFaultGraph] = useState<boolean>(false);

  // Feature: AI Diagnosis & Possible Actions - ONLY opened when user clicks to see it!
  const [showAiSolution, setShowAiSolution] = useState<boolean>(false);

  // Visual Effects State
  const [sparkEffect, setSparkEffect] = useState<boolean>(false);
  const [aiExplanationText, setAiExplanationText] = useState<string | null>(null);
  const [isAiExplaining, setIsAiExplaining] = useState<boolean>(false);
  const [aiFixSuccessNotice, setAiFixSuccessNotice] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // Calculate Real Physical Parameters
  const physics: CircuitPhysicsState = useMemo(() => {
    const nominalVoltage = settings.nominalVoltage || 230;

    // Check if main loop is physically connected
    const hasLiveFeed = wires.some(
      (w) =>
        (w.from === "mains_live" && w.to === "breaker_in") ||
        (w.to === "mains_live" && w.from === "breaker_in")
    );
    const hasBreakerToSwitch = wires.some(
      (w) =>
        (w.from === "breaker_out" && w.to === "switch_in") ||
        (w.to === "breaker_out" && w.from === "switch_in")
    );
    const hasSwitchToLoad1 = wires.some(
      (w) =>
        (w.from === "switch_out" && w.to === "load1_in") ||
        (w.to === "switch_out" && w.from === "load1_in")
    );
    const hasLoad1ToNeutral = wires.some(
      (w) =>
        (w.from === "load1_out" && w.to === "mains_neutral") ||
        (w.to === "load1_out" && w.from === "mains_neutral")
    );
    const hasHeaterConnected = wires.some(
      (w) =>
        (w.from === "switch_out" && w.to === "load2_in") ||
        (w.to === "switch_out" && w.from === "load2_in")
    ) && wires.some(
      (w) =>
        (w.from === "load2_out" && w.to === "mains_neutral") ||
        (w.to === "load2_out" && w.from === "mains_neutral")
    );

    // Is ground connected?
    const hasGroundBond = earthConnected && wires.some(
      (w) =>
        (w.from === "chassis_earth" && w.to === "earth_rod") ||
        (w.to === "chassis_earth" && w.from === "earth_rod")
    );

    const isProtectorTripped = breakerState === "tripped" || rccbState === "tripped";
    const isSwitchOpen = switchState === "off";

    // Wire base resistance
    const baseWireR = wireGauge === 14 ? 0.35 : wireGauge === 12 ? 0.2 : 0.1;
    const wireResistance = wireCondition === "degraded" || activeCondition === "degraded_wire" ? 4.8 : baseWireR;
    const earthResistance = hasGroundBond ? 5.0 : 9999.0; // 5 ohms vs disconnected

    // Resistances of loads
    // 100W lamp at 230V: R = V^2 / P = 529 ohms (at 120V: 144 ohms)
    const lampR = (nominalVoltage * nominalVoltage) / 100;
    // 2500W heater at 230V: R = V^2 / 2500 = 21.1 ohms
    const heaterR = (nominalVoltage * nominalVoltage) / 2500;

    let loopResistance = 999999;
    let currentAmps = 0;
    let powerWatts = 0;
    let earthLeakageAmps = 0;
    let chassisTouchVoltage = 0;
    let isArcing = false;
    let hazardStatus: "SAFE" | "WARNING" | "CRITICAL" = "SAFE";
    let hazardTitle = "Normal Safe Operation";

    const circuitClosed =
      hasLiveFeed &&
      hasBreakerToSwitch &&
      !isProtectorTripped &&
      !isSwitchOpen &&
      ((hasSwitchToLoad1 && hasLoad1ToNeutral) || hasHeaterConnected || activeCondition === "short_circuit");

    if (circuitClosed) {
      if (activeCondition === "short_circuit") {
        // Direct Short Circuit between Live and Neutral (bypass load)
        loopResistance = 0.12 + wireResistance;
        currentAmps = Math.round((nominalVoltage / loopResistance) * 10) / 10;
        powerWatts = Math.round(nominalVoltage * currentAmps);
        hazardStatus = "CRITICAL";
        hazardTitle = "Direct Short Circuit Fault (Dead Short)";
      } else if (activeCondition === "overload") {
        // Parallel combination of Lamp + Heavy Heater
        const totalLoadR = 1 / (1 / lampR + 1 / heaterR);
        loopResistance = totalLoadR + wireResistance;
        currentAmps = Math.round((nominalVoltage / loopResistance) * 10) / 10;
        powerWatts = Math.round(nominalVoltage * currentAmps);

        if (currentAmps > breakerRating) {
          hazardStatus = "CRITICAL";
          hazardTitle = `Overload Hazard (${currentAmps}A exceeds ${breakerRating}A Breaker)`;
        } else {
          hazardStatus = "WARNING";
          hazardTitle = `Heavy Load Running (${currentAmps}A)`;
        }
      } else if (activeCondition === "degraded_wire") {
        loopResistance = lampR + wireResistance;
        currentAmps = Math.round((nominalVoltage / loopResistance) * 10) / 10;
        powerWatts = Math.round(nominalVoltage * currentAmps);
        hazardStatus = "CRITICAL";
        hazardTitle = "High-Resistance Degraded Wire (Thermal Fire Hazard)";
      } else if (activeCondition === "arc_fault") {
        loopResistance = lampR + wireResistance + 15;
        currentAmps = Math.round((nominalVoltage / loopResistance) * 10) / 10;
        powerWatts = Math.round(nominalVoltage * currentAmps);
        isArcing = true;
        hazardStatus = "CRITICAL";
        hazardTitle = "Sputtering Arc Fault (Loose Connection Arcing)";
      } else if (activeCondition === "earth_leakage" || activeCondition === "broken_earth") {
        loopResistance = lampR + wireResistance;
        currentAmps = Math.round((nominalVoltage / loopResistance) * 10) / 10;
        powerWatts = Math.round(nominalVoltage * currentAmps);

        // Fault current leaking to chassis:
        // Fault resistance across insulation breakdown ~ 2000 ohms
        const faultR = 2500;
        earthLeakageAmps = Math.round((nominalVoltage / (faultR + earthResistance)) * 1000) / 1000; // Amps

        if (hasGroundBond) {
          // Voltage divided across chassis earth rod
          chassisTouchVoltage = Math.round(earthLeakageAmps * earthResistance);
          hazardStatus = hasRccb ? "WARNING" : "CRITICAL";
          hazardTitle = hasRccb
            ? "Earth Leakage (Will Trip 30mA RCCB)"
            : "Earth Leakage without RCCB (Fire & Shock Risk)";
        } else {
          // Disconnected ground! Chassis holds full voltage!
          chassisTouchVoltage = nominalVoltage;
          hazardStatus = "CRITICAL";
          hazardTitle = "Lethal Touch Voltage: Severed Earth Ground!";
        }
      } else {
        // Normal Safe Condition
        const activeR = hasHeaterConnected ? 1 / (1 / lampR + 1 / heaterR) : lampR;
        loopResistance = activeR + wireResistance;
        currentAmps = Math.round((nominalVoltage / loopResistance) * 10) / 10;
        powerWatts = Math.round(nominalVoltage * currentAmps);
        hazardStatus = "SAFE";
        hazardTitle = "Circuit Operating Normally & Safely";
      }
    } else {
      hazardStatus = isProtectorTripped ? "CRITICAL" : "SAFE";
      hazardTitle = isProtectorTripped
        ? "Protection Tripped: Circuit De-energized"
        : isSwitchOpen
        ? "Circuit Switched OFF (De-energized)"
        : "Incomplete Circuit (Open Loop)";
    }

    // Joule Heating: T = Ambient + I^2 * R_wire * factor
    const ambientTemp = 24;
    const heatingFactor = 0.28;
    const wireTemperature = Math.min(
      140,
      Math.round(ambientTemp + currentAmps * currentAmps * wireResistance * heatingFactor)
    );

    return {
      nominalVoltage,
      breakerRating,
      breakerState,
      breakerType: "mcb",
      hasRccb,
      rccbState,
      switchState,
      activeCondition,
      wireGauge,
      wireResistance: Math.round(wireResistance * 100) / 100,
      earthResistance,
      circuitClosed,
      loopResistance: Math.round(loopResistance * 10) / 10,
      currentAmps,
      voltageEffective: circuitClosed ? nominalVoltage : 0,
      powerWatts,
      wireTemperature,
      earthLeakageAmps,
      chassisTouchVoltage,
      isArcing,
      hazardStatus,
      hazardTitle,
    };
  }, [
    settings.nominalVoltage,
    wires,
    switchState,
    breakerState,
    rccbState,
    breakerRating,
    hasRccb,
    wireGauge,
    wireCondition,
    earthConnected,
    activeCondition,
  ]);

  // Fault pinpoint: Exists ONLY where a fault is physically located on the circuit
  const faultPinpoint = useMemo(() => {
    if (activeCondition === "normal") return null;

    switch (activeCondition) {
      case "short_circuit":
        return {
          condition: "short_circuit" as const,
          componentName: "Load 1 Terminals (Lamp)",
          terminalLabel: "L1 In ↔ L1 Out Bypass",
          x: 80,
          y: 22,
          title: "Dead Short Circuit (L-N Contact)",
          shortDescription: "Zero-resistance bridge bypasses the load. Instantaneous current surges to 180A.",
          metricBadge: "180A Peak Inrush (< 15ms cutoff)",
          severity: "CRITICAL" as const,
        };
      case "arc_fault":
        return {
          condition: "arc_fault" as const,
          componentName: "Switch Screw Terminal",
          terminalLabel: "Terminal: switch_in / switch_out",
          x: 55,
          y: 22,
          title: "Sputtering Arc Fault",
          shortDescription: "Air gap ionization across loose screw terminal causes continuous plasma sparks.",
          metricBadge: "3,000°C Plasma Arc (AFDD Required)",
          severity: "CRITICAL" as const,
        };
      case "earth_leakage":
        return {
          condition: "earth_leakage" as const,
          componentName: "Appliance Metal Chassis",
          terminalLabel: "Chassis Frame Lug",
          x: 62,
          y: 61,
          title: "Chassis Current Leakage",
          shortDescription: "Phase conductor insulation breakdown leaks 28mA residual current onto metal frame.",
          metricBadge: "28mA Differential (RCCB Cutoff: 30mA)",
          severity: "CRITICAL" as const,
        };
      case "broken_earth":
        return {
          condition: "broken_earth" as const,
          componentName: "Earth Stake & Ground Bond",
          terminalLabel: "Terminal: earth_rod",
          x: 86,
          y: 85,
          title: "Severed Protective Ground",
          shortDescription: "Missing ground bond causes metal chassis to float to 230V lethal mains potential.",
          metricBadge: "230V Touch Potential Shock Hazard",
          severity: "CRITICAL" as const,
        };
      case "degraded_wire":
        return {
          condition: "degraded_wire" as const,
          componentName: "In-Wall Conductor Wire",
          terminalLabel: "Conductor: Switch Out → Load 1 In",
          x: 67,
          y: 22,
          title: "High-Resistance Degraded Wire",
          shortDescription: "4.8Ω resistance generates extreme I²R heat without tripping standard 16A MCB.",
          metricBadge: "112°C Core Heat (Fire Hazard)",
          severity: "CRITICAL" as const,
        };
      case "overload":
        return {
          condition: "overload" as const,
          componentName: "Branch Load 2 (Heater) & Breaker",
          terminalLabel: "Heater (2500W) + Lamp (100W)",
          x: 80,
          y: 52,
          title: "Circuit Overcurrent Overload",
          shortDescription: "Parallel heavy loads draw 11.7A on a 10A branch circuit (117% capacity).",
          metricBadge: "11.7A on 10A Breaker (117%)",
          severity: "WARNING" as const,
        };
      default:
        return null;
    }
  }, [activeCondition]);

  // Derive detailed physical wire segments for dynamic visualization & connector map
  const wireSegments: WireSegmentPhysics[] = useMemo(() => {
    return wires.map((wire) => {
      const fromT = TERMINALS.find((t) => t.id === wire.from);
      const toT = TERMINALS.find((t) => t.id === wire.to);

      const fromLabel = fromT?.label || wire.from;
      const toLabel = toT?.label || wire.to;
      const componentFrom = fromT?.componentName || "Terminal";
      const componentTo = toT?.componentName || "Terminal";

      const gauge = wire.gauge || wireGauge;
      const degradation: WireDegradation =
        wire.degradation ||
        (wireCondition === "degraded" || activeCondition === "degraded_wire"
          ? "severely_degraded"
          : "optimal");

      // Safe continuous ampacity rating by AWG
      const ampacityRating = gauge === 14 ? 15 : gauge === 12 ? 20 : 30;

      // Base resistance based on gauge and degradation
      let baseR = gauge === 14 ? 0.35 : gauge === 12 ? 0.22 : 0.14;
      if (degradation === "aged") baseR *= 1.4;
      if (degradation === "severely_degraded") baseR = 4.8;
      const resistanceOhms = Math.round(baseR * 100) / 100;

      // Determine the specific branch current carrying through this conductor
      let segmentCurrent = 0;
      if (physics.circuitClosed) {
        // Main feeder lines
        const isMainFeeder =
          (wire.from === "mains_live" && wire.to === "breaker_in") ||
          (wire.to === "mains_live" && wire.from === "breaker_in") ||
          (wire.from === "breaker_out" && wire.to === "switch_in") ||
          (wire.to === "breaker_out" && wire.from === "switch_in");

        // Short circuit bypass line
        const isShortFault =
          (wire.from === "breaker_out" && wire.to === "mains_neutral") ||
          (wire.to === "breaker_out" && wire.from === "mains_neutral") ||
          wire.color === "fault";

        // Chassis leakage line
        const isLeakageLine =
          (wire.from === "switch_out" && wire.to === "chassis_tap") ||
          (wire.to === "switch_out" && wire.from === "chassis_tap") ||
          (wire.from === "chassis_earth" && wire.to === "earth_rod") ||
          (wire.to === "chassis_earth" && wire.from === "earth_rod");

        // Lamp branch
        const isLoad1 =
          wire.from === "load1_in" ||
          wire.to === "load1_in" ||
          wire.from === "load1_out" ||
          wire.to === "load1_out";

        // Heater branch
        const isLoad2 =
          wire.from === "load2_in" ||
          wire.to === "load2_in" ||
          wire.from === "load2_out" ||
          wire.to === "load2_out";

        if (isShortFault && activeCondition === "short_circuit") {
          segmentCurrent = physics.currentAmps;
        } else if (isLeakageLine) {
          segmentCurrent = physics.earthLeakageAmps;
        } else if (isMainFeeder) {
          segmentCurrent = physics.currentAmps;
        } else if (isLoad1) {
          segmentCurrent =
            physics.currentAmps > 0
              ? Math.min(physics.currentAmps, Math.round((100 / physics.nominalVoltage) * 100) / 100)
              : 0;
        } else if (isLoad2) {
          segmentCurrent =
            physics.currentAmps > 1
              ? Math.round((2500 / physics.nominalVoltage) * 10) / 10
              : 0;
        } else {
          segmentCurrent = wire.color === "neutral" ? physics.currentAmps : 0;
        }
      }

      const loadPercentage =
        ampacityRating > 0 ? (segmentCurrent / ampacityRating) * 100 : 0;

      // Segment Joule heating calculation
      const jouleHeatWatts = Math.round(segmentCurrent * segmentCurrent * resistanceOhms * 10) / 10;
      const ambientC = 24;
      const temperatureC =
        segmentCurrent > 0
          ? Math.min(140, Math.round(ambientC + jouleHeatWatts * 0.35))
          : ambientC;

      // Dynamic stroke width calculation based on current load and gauge
      const baseGaugeThickness = gauge === 14 ? 2.5 : gauge === 12 ? 3.5 : 4.5;
      let displayThickness = baseGaugeThickness;

      if (segmentCurrent > 0) {
        if (segmentCurrent > 50) {
          displayThickness = 12; // Short circuit surge
        } else {
          // Dynamic scaling with current load: up to 9px
          const loadRatio = segmentCurrent / ampacityRating;
          displayThickness = Math.min(9.5, baseGaugeThickness + loadRatio * 3.8);
        }
      } else {
        displayThickness = Math.max(2, baseGaugeThickness - 0.5);
      }

      // Thermal expansion under severe heat
      if (temperatureC > 65) {
        displayThickness += 1.5;
      }

      // Dynamic Color Coding based on physical state:
      let strokeColor = "#64748b"; // Idle slate
      let glowColor = "transparent";
      let statusText = "Idle / De-energized";
      let statusBadge: WireSegmentPhysics["statusBadge"] = "idle";

      if (physics.activeCondition === "short_circuit" && segmentCurrent > 20) {
        strokeColor = "#ef4444";
        glowColor = "rgba(239, 68, 68, 0.9)";
        statusText = "Dead Short (180A Surge)";
        statusBadge = "short_fault";
      } else if (
        physics.activeCondition === "broken_earth" &&
        (wire.from === "chassis_tap" || wire.to === "chassis_tap")
      ) {
        strokeColor = "#f43f5e";
        glowColor = "rgba(244, 63, 94, 0.85)";
        statusText = "Lethal Touch Potential (230V)";
        statusBadge = "shock_hazard";
      } else if (temperatureC > 65 || degradation === "severely_degraded") {
        strokeColor = "#ea580c";
        glowColor = "rgba(234, 88, 12, 0.9)";
        statusText = `Thermal Runaway (${temperatureC}°C)`;
        statusBadge = "degraded";
      } else if (loadPercentage > 100 || segmentCurrent > ampacityRating) {
        strokeColor = "#f97316";
        glowColor = "rgba(249, 115, 22, 0.85)";
        statusText = `Overloaded (${Math.round(loadPercentage)}%)`;
        statusBadge = "overloaded";
      } else if (segmentCurrent > 0) {
        if (wire.color === "live") {
          strokeColor = loadPercentage > 75 ? "#f59e0b" : "#eab308";
          glowColor = "rgba(234, 179, 8, 0.6)";
          statusText = loadPercentage > 75 ? "Heavy Load" : "Optimal Live Phase";
          statusBadge = loadPercentage > 75 ? "warm" : "safe";
        } else if (wire.color === "neutral") {
          strokeColor = "#38bdf8";
          glowColor = "rgba(56, 189, 248, 0.5)";
          statusText = "Balanced Neutral Return";
          statusBadge = "safe";
        } else if (wire.color === "earth") {
          strokeColor = "#22c55e";
          glowColor = "rgba(34, 197, 94, 0.5)";
          statusText = "Protective Earth Bond";
          statusBadge = "safe";
        } else {
          strokeColor = "#f59e0b";
          glowColor = "rgba(245, 158, 11, 0.5)";
          statusText = "Active Fault Tap";
          statusBadge = "warm";
        }
      } else {
        if (wire.color === "live") strokeColor = "#94a3b8";
        else if (wire.color === "neutral") strokeColor = "#64748b";
        else if (wire.color === "earth") strokeColor = "#334155";
        statusText = "Circuit De-energized";
        statusBadge = "idle";
      }

      return {
        wireId: wire.id,
        from: wire.from,
        to: wire.to,
        fromLabel,
        toLabel,
        componentFrom,
        componentTo,
        colorType: wire.color,
        currentAmps: segmentCurrent,
        gauge,
        ampacityRating,
        loadPercentage,
        degradation,
        resistanceOhms,
        temperatureC,
        jouleHeatWatts,
        displayThickness: Math.round(displayThickness * 10) / 10,
        strokeColor,
        glowColor,
        statusText,
        statusBadge,
      };
    });
  }, [
    wires,
    wireGauge,
    wireCondition,
    activeCondition,
    physics.circuitClosed,
    physics.currentAmps,
    physics.earthLeakageAmps,
    physics.nominalVoltage,
  ]);

  // Handle Automatic Breaker Trips based on physics
  useEffect(() => {
    if (!physics.circuitClosed) return;

    if (physics.activeCondition === "short_circuit" && breakerState === "closed") {
      // Instantaneous magnetic trip for short circuit
      setSparkEffect(true);
      playSound("trip");
      const timer = setTimeout(() => {
        setBreakerState("tripped");
        setSparkEffect(false);
      }, 350);
      return () => clearTimeout(timer);
    }

    if (physics.activeCondition === "overload" && physics.currentAmps > breakerRating && breakerState === "closed") {
      // Thermal bimetallic delayed trip
      const timer = setTimeout(() => {
        setBreakerState("tripped");
        playSound("trip");
      }, 1400);
      return () => clearTimeout(timer);
    }

    if (
      (physics.activeCondition === "earth_leakage" || physics.activeCondition === "broken_earth") &&
      hasRccb &&
      rccbState === "closed" &&
      physics.earthLeakageAmps * 1000 >= 30
    ) {
      // RCCB residual current trip (>30mA)
      const timer = setTimeout(() => {
        setRccbState("tripped");
        playSound("trip");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [
    physics.circuitClosed,
    physics.activeCondition,
    physics.currentAmps,
    physics.earthLeakageAmps,
    breakerRating,
    breakerState,
    hasRccb,
    rccbState,
    playSound,
  ]);

  // Terminal click to draw / connect wires
  const handleTerminalClick = (termId: TerminalId) => {
    playSound("click");
    if (!selectedTerminal) {
      setSelectedTerminal(termId);
      return;
    }

    if (selectedTerminal === termId) {
      setSelectedTerminal(null);
      return;
    }

    // Check if wire already exists between these two terminals
    const existingIndex = wires.findIndex(
      (w) =>
        (w.from === selectedTerminal && w.to === termId) ||
        (w.from === termId && w.to === selectedTerminal)
    );

    if (existingIndex >= 0) {
      // Remove wire if clicked again
      setWires(wires.filter((_, idx) => idx !== existingIndex));
    } else {
      // Determine wire color
      let color: CircuitWire["color"] = "live";
      if (selectedTerminal.includes("neutral") || termId.includes("neutral")) {
        color = "neutral";
      } else if (selectedTerminal.includes("earth") || termId.includes("earth")) {
        color = "earth";
      }

      setWires([
        ...wires,
        {
          id: `w-${Date.now()}`,
          from: selectedTerminal,
          to: termId,
          color,
        },
      ]);
    }
    setSelectedTerminal(null);
  };

  const handleRemoveWire = (wireId: string) => {
    playSound("click");
    setWires((prev) => prev.filter((w) => w.id !== wireId));
  };

  const handleUpdateWireGauge = (wireId: string, gauge: number) => {
    playSound("click");
    setWires((prev) =>
      prev.map((w) => (w.id === wireId ? { ...w, gauge } : w))
    );
  };

  const handleToggleWireDegradation = (wireId: string) => {
    playSound("click");
    setWires((prev) =>
      prev.map((w) => {
        if (w.id !== wireId) return w;
        const nextDegradation: WireDegradation =
          w.degradation === "severely_degraded" ? "optimal" : "severely_degraded";
        return { ...w, degradation: nextDegradation };
      })
    );
  };

  const handleAutoWire = () => {
    playSound("click");
    setWires(DEFAULT_WIRES);
    setEarthConnected(true);
    setBreakerState("closed");
    setRccbState("closed");
    setSwitchState("on");
    setActiveCondition("normal");
    setShowFaultGraph(false);
    setShowAiSolution(false);
    setAiFixSuccessNotice("Restored standard clean circuit wiring.");
    setTimeout(() => setAiFixSuccessNotice(null), 3500);
  };

  const handleClearWires = () => {
    playSound("click");
    setWires([]);
    setSelectedTerminal(null);
    setShowFaultGraph(false);
    setShowAiSolution(false);
  };

  // Apply condition presets directly to this circuit
  const handleApplyCondition = (cond: CircuitCondition) => {
    playSound("click");
    setActiveCondition(cond);
    setAiExplanationText(null);
    setShowFaultGraph(false); // Reset graphs so user explicitly clicks to draw!
    setShowAiSolution(false); // Reset AI plan so user explicitly clicks to see!

    // Adapt physical wiring and switches to reflect chosen condition
    if (cond === "normal") {
      setWires(DEFAULT_WIRES);
      setEarthConnected(true);
      setWireCondition("good");
      setBreakerState("closed");
      setRccbState("closed");
      setSwitchState("on");
    } else if (cond === "overload") {
      // Connect second heavy heater in parallel
      const hasHeaterIn = wires.some((w) => w.from === "switch_out" && w.to === "load2_in");
      const hasHeaterOut = wires.some((w) => w.from === "load2_out" && w.to === "mains_neutral");
      const newWires = [...wires];
      if (!hasHeaterIn) newWires.push({ id: `w-heater-in-${Date.now()}`, from: "switch_out", to: "load2_in", color: "live" });
      if (!hasHeaterOut) newWires.push({ id: `w-heater-out-${Date.now()}`, from: "load2_out", to: "mains_neutral", color: "neutral" });
      setWires(newWires);
      setBreakerRating(10); // set to 10A to guarantee overload demonstration
      setBreakerState("closed");
      setSwitchState("on");
    } else if (cond === "short_circuit") {
      // Connect live directly to neutral across the circuit
      setWires([
        ...wires,
        { id: `w-short-${Date.now()}`, from: "breaker_out", to: "mains_neutral", color: "fault" },
      ]);
      setBreakerState("closed");
      setSwitchState("on");
    } else if (cond === "earth_leakage") {
      setWires([
        ...wires,
        { id: `w-leak-${Date.now()}`, from: "switch_out", to: "chassis_tap", color: "fault" },
      ]);
      setEarthConnected(true);
      setHasRccb(true);
      setRccbState("closed");
    } else if (cond === "broken_earth") {
      // Live touches chassis, but ground wire is severed
      setWires(
        wires
          .filter((w) => w.from !== "chassis_earth" && w.to !== "chassis_earth" && w.from !== "earth_rod" && w.to !== "earth_rod")
          .concat([{ id: `w-leak-${Date.now()}`, from: "switch_out", to: "chassis_tap", color: "fault" }])
      );
      setEarthConnected(false);
      setHasRccb(false); // test without RCCB to demonstrate lethal chassis touch
    } else if (cond === "degraded_wire") {
      setWireCondition("degraded");
      setWireGauge(14);
      setBreakerState("closed");
      setSwitchState("on");
    } else if (cond === "arc_fault") {
      setBreakerState("closed");
      setSwitchState("on");
    }
  };

  // AI Action Plan generation for the "What Would AI Do?" column
  const aiPlan: AiActionPlan = useMemo(() => {
    switch (physics.activeCondition) {
      case "short_circuit":
        return {
          hazardLevel: "CRITICAL",
          detectedCondition: "Direct Phase-to-Neutral Dead Short",
          physicsCause:
            "Resistance dropped to near-zero (0.12Ω). By Ohm's Law (I = V/R), current immediately surges past 180A, releasing explosive electromagnetic force and vaporization heat.",
          whatAiDoes: [
            {
              title: "Autonomous Solenoid Trip",
              description: "AI commands instantaneous magnetic breaker trip in < 12ms to quench the arc before insulation combustion.",
              speed: "12 milliseconds",
            },
            {
              title: "Sub-Branch Isolation",
              description: "AI digitally isolates the shorted outlet branch, keeping essential lighting circuits online.",
              speed: "Instantaneous",
            },
            {
              title: "Diagnostic Root-Cause Flag",
              description: "Flags zero-resistance conductive bridge between terminal L and N for human inspection.",
              speed: "Real-time log",
            },
          ],
          aiRecommendedFix: "Remove the conductive short bridge and reset the magnetic trip latch.",
          canAutoFix: true,
        };

      case "overload":
        return {
          hazardLevel: "CRITICAL",
          detectedCondition: `Sustained Branch Overload (${physics.currentAmps}A on ${physics.breakerRating}A Breaker)`,
          physicsCause:
            "Sum of connected appliance loads draws more current than the breaker and copper wire can safely carry. Heat builds according to Joule's Law (P = I²R).",
          whatAiDoes: [
            {
              title: "Predictive Load Shedding",
              description: "AI detects current exceeding 100% rated capacity and schedules secondary load detachment before breaker trips.",
              speed: "Pre-emptive (3 sec)",
            },
            {
              title: "Dynamic Circuit Rebalancing",
              description: "AI signals smart plugs to move the 2500W heater to an unencumbered high-capacity branch circuit.",
              speed: "Automated",
            },
            {
              title: "Thermal Stress Monitoring",
              description: "Calculates cumulative thermal degradation on the internal conductor insulation.",
              speed: "Continuous telemetry",
            },
          ],
          aiRecommendedFix: "Disconnect the 2500W heavy heater or upgrade circuit branch to 20A breaker with 10 AWG wiring.",
          canAutoFix: true,
        };

      case "earth_leakage":
        return {
          hazardLevel: "WARNING",
          detectedCondition: "Ground Leakage Current (Insulation Breakdown)",
          physicsCause:
            "Phase conductor is in contact with the appliance metal enclosure. Stray leakage current is returning via the ground path rather than the neutral wire.",
          whatAiDoes: [
            {
              title: "Residual Current Differential Analysis",
              description: "AI continuously compares Vector Sum (I_live + I_neutral). Identifies > 30mA imbalance.",
              speed: "Continuous (20ms)",
            },
            {
              title: "RCCB Trip Authorization",
              description: "Authorizes immediate trip of the 30mA RCD to protect human occupants from electric shock.",
              speed: "Under 25ms",
            },
            {
              title: "Insulation Resistance Profiling",
              description: "Logs megohmmeter breakdown trend, alerting user of damaged internal wiring.",
              speed: "System report",
            },
          ],
          aiRecommendedFix: "Disconnect damaged chassis fault tap and re-arm the RCCB protective module.",
          canAutoFix: true,
        };

      case "broken_earth":
        return {
          hazardLevel: "CRITICAL",
          detectedCondition: "Missing Ground Conductor with Energized Chassis",
          physicsCause:
            "The appliance body is energized to 230V, but the protective earth wire is severed. Touching the metal frame will cause current to pass directly through human heart tissue to ground!",
          whatAiDoes: [
            {
              title: "Lethal Touch Voltage Warning",
              description: "AI registers 230V chassis potential with infinite loop impedance, issuing immediate acoustic and visual lockout.",
              speed: "Immediate",
            },
            {
              title: "Upstream Power Cutoff",
              description: "De-energizes the supply to prevent electrocution of room occupants.",
              speed: "< 30ms",
            },
            {
              title: "Ground Bond Integrity Test",
              description: "Dispatches automated Earth Loop Impedance test showing open-circuit ground rod.",
              speed: "Telemetry alert",
            },
          ],
          aiRecommendedFix: "Bond the appliance chassis to Earth Rod ground and verify impedance under 5Ω.",
          canAutoFix: true,
        };

      case "degraded_wire":
        return {
          hazardLevel: "CRITICAL",
          detectedCondition: "Localized Conductor Thermal Runaway (> 80°C)",
          physicsCause:
            "Wire has deteriorated, corroded, or is undersized (4.8Ω resistance). Even normal currents generate dangerous internal heat (I²R) that won't trip a breaker but will ignite building timber.",
          whatAiDoes: [
            {
              title: "I²R Thermal Modeling",
              description: "AI calculates conductor temperature exceeds 70°C PVC insulation rating without triggering standard overcurrent.",
              speed: "Real-time computation",
            },
            {
              title: "Ampacity Throttling",
              description: "AI automatically restricts maximum allowable draw on this line to 5 Amperes.",
              speed: "Instantaneous",
            },
            {
              title: "Fire Hazard Dispatch",
              description: "Issues red fire warning and advises replacement of aged 14 AWG cable with 10 AWG copper.",
              speed: "Action item",
            },
          ],
          aiRecommendedFix: "Replace degraded wire with fresh 10 AWG copper conductor (0.1Ω).",
          canAutoFix: true,
        };

      case "arc_fault":
        return {
          hazardLevel: "CRITICAL",
          detectedCondition: "Series Arc Fault (Sputtering Loose Connection)",
          physicsCause:
            "Loose terminal screw causes intermittent micro-gaps. Ionized air creates a high-temperature electric arc (> 3000°C) with high-frequency noise waveforms.",
          whatAiDoes: [
            {
              title: "FFT High-Frequency Spectral Analysis",
              description: "AI signature recognition isolates the erratic 50kHz noise burst characteristic of electric arcing.",
              speed: "< 50ms",
            },
            {
              title: "AFDD (Arc Fault Detection) Trip",
              description: "Triggers arc fault circuit interrupter before sparks ignite surrounding dust or framing.",
              speed: "Rapid cutoff",
            },
            {
              title: "Terminal Location Pinpointing",
              description: "Directs technician directly to the loose switch terminal screw.",
              speed: "Diagnostic map",
            },
          ],
          aiRecommendedFix: "Torque loose switch terminal screws to specification and engage Arc Fault protection.",
          canAutoFix: true,
        };

      default:
        return {
          hazardLevel: "SAFE",
          detectedCondition: "Normal Balanced Operation",
          physicsCause:
            "Current draw is within safe wire ampacity (0.43A vs 16A rating). Temperature is at ambient (24°C), and leakage is 0mA.",
          whatAiDoes: [
            {
              title: "Continuous Health Verification",
              description: "AI monitors line voltage stability, current harmonics, and thermal margin in real-time.",
              speed: "Continuous (60Hz)",
            },
            {
              title: "Energy Efficiency Optimization",
              description: "Calculates power factor and verifies zero parasitic leakage to earth.",
              speed: "Background task",
            },
            {
              title: "Predictive Equipment Life",
              description: "Estimates breaker contact wear at 0% degradation under clean sinusoidal load.",
              speed: "Ongoing analysis",
            },
          ],
          aiRecommendedFix: "System is operating safely. No corrective actions required.",
          canAutoFix: false,
        };
    }
  }, [physics]);

  // "Let AI Fix This Circuit" 1-Click Action
  const handleAiAutoFix = () => {
    playSound("success");
    // Clear fault wires, reset breakers, fix ground
    setWires(DEFAULT_WIRES);
    setEarthConnected(true);
    setWireCondition("good");
    setWireGauge(12);
    setBreakerRating(16);
    setHasRccb(true);
    setBreakerState("closed");
    setRccbState("closed");
    setSwitchState("on");
    setActiveCondition("normal");
    setShowFaultGraph(false);
    setShowAiSolution(false);

    setAiFixSuccessNotice(
      "AI Intervention Applied: Removed fault bridges, restored protective earthing, balanced load, and reset protective breakers. Simulation verified SAFE."
    );
    setTimeout(() => {
      setAiFixSuccessNotice(null);
    }, 4500);
  };

  // Request deep explanation from Gemini AI
  const handleRequestAiExplanation = async () => {
    setIsAiExplaining(true);
    try {
      const res = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: aiPlan.detectedCondition,
          circuitData: {
            voltage: physics.nominalVoltage,
            current: physics.currentAmps,
            power: physics.powerWatts,
            temperature: physics.wireTemperature,
            leakage: physics.earthLeakageAmps,
            hazard: aiPlan.hazardLevel,
          },
          symptoms: [aiPlan.physicsCause],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setAiExplanationText(data.explanation || aiPlan.physicsCause);
      } else {
        setAiExplanationText(
          `${aiPlan.physicsCause} In electrical engineering practice: ${aiPlan.aiRecommendedFix}`
        );
      }
    } catch {
      setAiExplanationText(
        `${aiPlan.physicsCause} In electrical engineering practice: ${aiPlan.aiRecommendedFix}`
      );
    } finally {
      setIsAiExplaining(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner: Prototype Purpose & Condition Selector */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[11px] font-black tracking-wider uppercase">
                Interactive Physics Prototype
              </span>
              <span className="text-xs text-slate-400 font-semibold">•</span>
              <span className="text-xs text-slate-500 font-medium">Draw wires & apply live faults</span>
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight mt-1">
              Physics Circuit Sandbox & AI Copilot
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 max-w-2xl leading-relaxed">
              Click terminals to <strong>draw or disconnect wires</strong>. Then click any condition button below to apply faults directly to this circuit and see how physics and AI respond!
            </p>
          </div>

          {/* Quick Wiring Helpers */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={handleAutoWire}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
              title="Auto-wire standard clean circuit"
            >
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              <span>Auto-Wire Circuit</span>
            </button>
            <button
              onClick={handleClearWires}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Remove all wires to draw from scratch"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Clear Wires</span>
            </button>
          </div>
        </div>

        {/* Condition Selector Bar: Applied to the SAME circuit */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Apply Condition to this Circuit:</span>
            <span className="text-slate-400 font-normal lowercase">click any to simulate fault</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            <button
              onClick={() => handleApplyCondition("normal")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "normal"
                  ? "bg-emerald-50 border-emerald-400 text-emerald-950 shadow-xs ring-2 ring-emerald-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-xs font-bold truncate">1. Normal</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">100W Lamp Safe</span>
            </button>

            <button
              onClick={() => handleApplyCondition("overload")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "overload"
                  ? "bg-amber-50 border-amber-400 text-amber-950 shadow-xs ring-2 ring-amber-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                <span className="text-xs font-bold truncate">2. Overload</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">+2500W Heater</span>
            </button>

            <button
              onClick={() => handleApplyCondition("short_circuit")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "short_circuit"
                  ? "bg-red-50 border-red-400 text-red-950 shadow-xs ring-2 ring-red-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-600 shrink-0 animate-ping" />
                <span className="text-xs font-bold truncate">3. Dead Short</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">L touches N (180A)</span>
            </button>

            <button
              onClick={() => handleApplyCondition("earth_leakage")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "earth_leakage"
                  ? "bg-purple-50 border-purple-400 text-purple-950 shadow-xs ring-2 ring-purple-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span className="text-xs font-bold truncate">4. Leakage</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">L touches chassis</span>
            </button>

            <button
              onClick={() => handleApplyCondition("broken_earth")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "broken_earth"
                  ? "bg-rose-50 border-rose-400 text-rose-950 shadow-xs ring-2 ring-rose-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 shrink-0" />
                <span className="text-xs font-bold truncate">5. Cut Earth</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">230V Touch Shock</span>
            </button>

            <button
              onClick={() => handleApplyCondition("degraded_wire")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "degraded_wire"
                  ? "bg-orange-50 border-orange-400 text-orange-950 shadow-xs ring-2 ring-orange-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                <span className="text-xs font-bold truncate">6. Wire Heat</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">4.8Ω Wire &gt; 80°C</span>
            </button>

            <button
              onClick={() => handleApplyCondition("arc_fault")}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                activeCondition === "arc_fault"
                  ? "bg-cyan-50 border-cyan-400 text-cyan-950 shadow-xs ring-2 ring-cyan-400/20"
                  : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                <span className="text-xs font-bold truncate">7. Arc Fault</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-1 truncate">Loose screw spark</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main 2-Column Core: Physics Circuit on Left, What Would AI Do on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT COLUMN (7 Cols): Interactive Circuit Schematic with Wires & Animation */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white border border-slate-800 shadow-md relative overflow-hidden flex flex-col">
            {/* Schematic Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" />
                <span className="text-xs font-mono font-bold text-slate-300">
                  PHYSICAL CIRCUIT SCHEMATIC
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs font-mono">
                <span className="text-slate-400">
                  Grid: <strong className="text-white">{physics.nominalVoltage}V AC</strong>
                </span>
                <span className="text-slate-400">
                  Wires: <strong className="text-blue-400">{wires.length}</strong>
                </span>
                {selectedTerminal && (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold animate-pulse">
                    Click 2nd terminal to connect
                  </span>
                )}
              </div>
            </div>

            {/* Circuit Canvas Container */}
            <div
              ref={canvasRef}
              className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-slate-950/90 rounded-xl border border-slate-800 overflow-hidden select-none"
            >
              {/* Background Grid Pattern */}
              <div
                className="absolute inset-0 opacity-15"
                style={{
                  backgroundImage:
                    "radial-gradient(circle, #64748b 1px, transparent 1px)",
                  backgroundSize: "24px 24px",
                }}
              />

              {/* Spark Flash Overlay on Short Circuit or Arc */}
              {(sparkEffect || physics.isArcing) && (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-amber-400/40 blur-xl animate-ping" />
                  <Sparkles className="w-12 h-12 text-amber-300 animate-spin absolute" />
                </div>
              )}

              {/* SVG Canvas for Drawing Real Curved Wires & Charges */}
              <svg
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
              >
                <defs>
                  <filter id="glow-live" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                  <filter id="glow-fault" x="-30%" y="-30%" width="160%" height="160%">
                    <feGaussianBlur stdDeviation="5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                  </filter>
                </defs>

                {/* Render Drawn Wires with Dynamic Thickness & Color-Coding */}
                {wireSegments.map((segment) => {
                  const fromT = TERMINALS.find((t) => t.id === segment.from);
                  const toT = TERMINALS.find((t) => t.id === segment.to);
                  if (!fromT || !toT) return null;

                  // Smooth curved control points
                  const midX = (fromT.x + toT.x) / 2;
                  const midY = (fromT.y + toT.y) / 2 + (Math.abs(fromT.x - toT.x) > 10 ? 3 : 0);
                  const pathD = `M ${fromT.x} ${fromT.y} Q ${midX} ${midY} ${toT.x} ${toT.y}`;

                  const isCarryingCurrent = segment.currentAmps > 0;
                  const isOverheated = segment.temperatureC > 65;

                  return (
                    <g key={segment.wireId}>
                      {/* Outer Thermal / Overload Glow Halo */}
                      {isCarryingCurrent && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke={segment.strokeColor}
                          strokeWidth={segment.displayThickness + 5}
                          strokeOpacity={isOverheated ? "0.6" : "0.22"}
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          className={isOverheated ? "animate-pulse" : ""}
                        />
                      )}

                      {/* Main Solid Wire Conductor - dynamically sized to physical load & degradation */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke={segment.strokeColor}
                        strokeWidth={segment.displayThickness}
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />

                      {/* Animated Flowing Charge Particles along wire when loop carries current */}
                      {isCarryingCurrent && (
                        <path
                          d={pathD}
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth={Math.max(1.5, Math.min(3, segment.displayThickness * 0.4))}
                          strokeDasharray="3 9"
                          strokeLinecap="round"
                          vectorEffect="non-scaling-stroke"
                          style={{
                            animation: `dash ${Math.max(0.15, 2.4 - Math.min(2.2, segment.currentAmps * 0.12))}s linear infinite`,
                          }}
                        />
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Physical Circuit Components rendered on canvas */}
              {/* 1. Mains AC Power Source (Left) */}
              <div
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-slate-800 border border-slate-700 shadow-lg text-center"
                style={{ left: "8%", top: "50%", width: "90px" }}
              >
                <div className="w-6 h-6 mx-auto rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center mb-1">
                  <Activity className="w-3.5 h-3.5" />
                </div>
                <div className="text-[10px] font-black tracking-wider text-slate-300">MAINS AC</div>
                <div className="text-[11px] font-mono font-bold text-blue-400">
                  {physics.nominalVoltage}V 50Hz
                </div>
              </div>

              {/* 2. Miniature Circuit Breaker (MCB) */}
              <div
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border shadow-lg text-center transition-all ${
                  breakerState === "tripped"
                    ? "bg-red-950/80 border-red-500 text-red-200"
                    : "bg-slate-800 border-slate-700 text-slate-200"
                }`}
                style={{ left: "32%", top: "22%", width: "100px" }}
              >
                <div className="flex items-center justify-between text-[9px] font-mono font-bold text-slate-400 mb-1">
                  <span>MCB</span>
                  <span className="text-amber-400">{breakerRating}A</span>
                </div>
                <button
                  onClick={() => {
                    setBreakerState(breakerState === "closed" ? "tripped" : "closed");
                    playSound("click");
                  }}
                  className={`w-full py-1 rounded text-[10px] font-bold tracking-wider transition-colors cursor-pointer ${
                    breakerState === "closed"
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                      : "bg-red-600 hover:bg-red-500 text-white animate-pulse"
                  }`}
                >
                  {breakerState === "closed" ? "CLOSED (ON)" : "TRIPPED"}
                </button>
              </div>

              {/* 3. Main Power Switch */}
              <div
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-lg text-center"
                style={{ left: "56%", top: "22%", width: "85px" }}
              >
                <div className="text-[9px] font-mono font-bold text-slate-400 mb-1">SWITCH</div>
                <button
                  onClick={() => {
                    setSwitchState(switchState === "on" ? "off" : "on");
                    playSound("click");
                  }}
                  className={`w-full py-1 rounded text-[10px] font-bold tracking-wider transition-colors cursor-pointer ${
                    switchState === "on"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-400"
                  }`}
                >
                  {switchState === "on" ? "ON" : "OFF"}
                </button>
              </div>

              {/* 4. Load 1: 100W Lamp */}
              <div
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border shadow-lg text-center transition-all ${
                  physics.circuitClosed && physics.currentAmps > 0 && switchState === "on"
                    ? "bg-amber-950/80 border-amber-400 text-amber-200 ring-4 ring-amber-400/20"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                style={{ left: "80%", top: "22%", width: "95px" }}
              >
                <Lightbulb
                  className={`w-5 h-5 mx-auto mb-1 ${
                    physics.circuitClosed && physics.currentAmps > 0 && switchState === "on"
                      ? "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                      : "text-slate-500"
                  }`}
                />
                <div className="text-[10px] font-bold text-white leading-tight">100W Lamp</div>
                <div className="text-[9px] font-mono text-slate-400">
                  {physics.circuitClosed ? `${Math.min(100, Math.round(physics.powerWatts))}W` : "0W"}
                </div>
              </div>

              {/* 5. Load 2: 2500W Heavy Heater (Parallel) */}
              <div
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border shadow-lg text-center transition-all ${
                  wires.some((w) => w.to === "load2_in" || w.from === "load2_in") &&
                  physics.circuitClosed &&
                  physics.currentAmps > 5
                    ? "bg-orange-950/80 border-orange-500 text-orange-200 ring-4 ring-orange-500/25"
                    : "bg-slate-800 border-slate-700 text-slate-400"
                }`}
                style={{ left: "80%", top: "52%", width: "95px" }}
              >
                <Flame
                  className={`w-5 h-5 mx-auto mb-1 ${
                    wires.some((w) => w.to === "load2_in" || w.from === "load2_in") &&
                    physics.circuitClosed &&
                    physics.currentAmps > 5
                      ? "text-orange-400 animate-pulse drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]"
                      : "text-slate-500"
                  }`}
                />
                <div className="text-[10px] font-bold text-white leading-tight">2500W Heater</div>
                <div className="text-[9px] font-mono text-slate-400">
                  {wires.some((w) => w.to === "load2_in" || w.from === "load2_in") && physics.circuitClosed
                    ? "2500W Active"
                    : "Offline"}
                </div>
              </div>

              {/* 6. Metal Appliance Chassis */}
              <div
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl border shadow-lg text-center transition-all ${
                  physics.chassisTouchVoltage > 50
                    ? "bg-red-950/90 border-red-500 text-red-200 ring-4 ring-red-500/40 animate-pulse"
                    : "bg-slate-800/90 border-slate-700 text-slate-300"
                }`}
                style={{ left: "62%", top: "61%", width: "105px" }}
              >
                <div className="text-[9px] font-mono font-bold text-slate-400">APPLIANCE BODY</div>
                <div className="text-[10px] font-bold text-white">Metal Chassis</div>
                <div
                  className={`text-[10px] font-mono font-extrabold mt-0.5 ${
                    physics.chassisTouchVoltage > 50 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  Touch: {physics.chassisTouchVoltage}V
                </div>
              </div>

              {/* 7. Earth Ground Stake */}
              <div
                className="absolute z-20 -translate-x-1/2 -translate-y-1/2 p-2 rounded-xl bg-slate-800 border border-slate-700 shadow-lg text-center"
                style={{ left: "86%", top: "85%", width: "95px" }}
              >
                <ShieldCheck
                  className={`w-4 h-4 mx-auto mb-0.5 ${
                    earthConnected ? "text-emerald-400" : "text-slate-600"
                  }`}
                />
                <div className="text-[10px] font-bold text-white leading-tight">Earth Stake</div>
                <div className="text-[9px] font-mono text-emerald-400">
                  {earthConnected ? "5Ω Ground" : "DISCONNECTED"}
                </div>
              </div>

              {/* Render Clickable Connection Terminals (Nodes) */}
              {TERMINALS.map((term) => {
                const isSelected = selectedTerminal === term.id;
                const isConnected = wires.some(
                  (w) => w.from === term.id || w.to === term.id
                );

                let pinColor = "bg-amber-400 border-amber-200";
                if (term.type === "neutral") pinColor = "bg-sky-400 border-sky-200";
                if (term.type === "earth") pinColor = "bg-emerald-400 border-emerald-200";

                return (
                  <button
                    key={term.id}
                    onClick={() => handleTerminalClick(term.id)}
                    title={`${term.componentName}: ${term.label} (Click to connect)`}
                    className={`absolute z-30 -translate-x-1/2 -translate-y-1/2 group cursor-pointer transition-transform ${
                      isSelected ? "scale-150" : "hover:scale-130"
                    }`}
                    style={{ left: `${term.x}%`, top: `${term.y}%` }}
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 shadow-md flex items-center justify-center transition-all ${pinColor} ${
                        isSelected
                          ? "ring-4 ring-yellow-400 ring-offset-2 ring-offset-slate-950 animate-bounce"
                          : ""
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                    </div>

                    {/* Terminal Label Tooltip */}
                    <span className="absolute left-1/2 -translate-x-1/2 top-5 px-1.5 py-0.5 rounded bg-slate-900/90 text-[9px] font-mono text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xs">
                      {term.label}
                    </span>
                  </button>
                );
              })}

              {/* Fault Origin Beacon & Interactive Popup: Appears ONLY where the fault is */}
              {faultPinpoint && (
                <div
                  className="absolute z-40 -translate-x-1/2 -translate-y-1/2 pointer-events-auto"
                  style={{ left: `${faultPinpoint.x}%`, top: `${faultPinpoint.y}%` }}
                >
                  {/* Glowing Target Crosshair */}
                  <div className="relative flex items-center justify-center">
                    <span className="absolute w-12 h-12 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
                    <span className="absolute w-7 h-7 rounded-full bg-red-500/60 animate-pulse pointer-events-none" />
                    <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg border-2 border-white ring-2 ring-red-500 z-10">
                      <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                  </div>

                  {/* Contextual Fault Callout Card situated directly at this exact spot */}
                  <div
                    className="absolute z-50 w-72 sm:w-88 max-h-[80vh] overflow-y-auto p-3.5 rounded-xl bg-slate-900/98 border-2 border-red-500 text-white shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-200"
                    style={{
                      top: faultPinpoint.y < 40 ? "24px" : "auto",
                      bottom: faultPinpoint.y >= 40 ? "24px" : "auto",
                      left: faultPinpoint.x > 65 ? "auto" : faultPinpoint.x < 35 ? "0px" : "50%",
                      right: faultPinpoint.x > 65 ? "0px" : "auto",
                      transform:
                        faultPinpoint.x > 65
                          ? "none"
                          : faultPinpoint.x < 35
                          ? "none"
                          : "translateX(-50%)",
                    }}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                        <span className="text-[10px] font-mono font-black text-red-400 uppercase tracking-wider">
                          FAULT DETECTED HERE
                        </span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-red-950 text-red-300 border border-red-800">
                        {faultPinpoint.severity}
                      </span>
                    </div>

                    <div className="mt-2">
                      <div className="text-xs font-extrabold text-white leading-tight">
                        {faultPinpoint.title}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                        Target: <strong className="text-slate-200">{faultPinpoint.componentName}</strong>
                      </div>
                      <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                        {faultPinpoint.shortDescription}
                      </p>
                      <div className="mt-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-amber-300 flex items-center justify-between">
                        <span>{faultPinpoint.metricBadge}</span>
                      </div>
                    </div>

                    {/* Dual Action Triggers: 1) What AI Does & Diagnosis, 2) Draw Graph */}
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {/* Button 1: Click to See What AI Does, Diagnosis & Solution */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAiSolution((prev) => !prev);
                        }}
                        className={`py-2 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md ${
                          showAiSolution
                            ? "bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400/50"
                            : "bg-purple-950/90 hover:bg-purple-900 text-purple-200 border border-purple-500/60"
                        }`}
                      >
                        <Bot className="w-3.5 h-3.5 shrink-0" />
                        <span>{showAiSolution ? "Hide AI Plan" : "🤖 See AI Action"}</span>
                        {showAiSolution ? (
                          <ChevronUp className="w-3 h-3 ml-0.5 shrink-0" />
                        ) : (
                          <ChevronDown className="w-3 h-3 ml-0.5 shrink-0" />
                        )}
                      </button>

                      {/* Button 2: Click to Draw Graphs */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowFaultGraph(true);
                          setTimeout(() => {
                            graphContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                          }, 60);
                        }}
                        className={`py-2 px-2.5 rounded-lg text-[11px] font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-md ${
                          showFaultGraph
                            ? "bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/50"
                            : "bg-sky-950/90 hover:bg-sky-900 text-sky-200 border border-sky-500/60"
                        }`}
                      >
                        <Activity className="w-3.5 h-3.5 shrink-0" />
                        <span>{showFaultGraph ? "📊 Re-Draw" : "📈 Draw Graph"}</span>
                      </button>
                    </div>

                    {/* Downward indicator: indicates below the graph is drawn */}
                    <div className="mt-2 flex items-center justify-center space-x-1.5 py-1 px-2 rounded-lg bg-slate-950/95 border border-sky-500/50 text-[10px] font-mono font-bold text-sky-300 shadow-inner">
                      <ArrowDown className="w-3 h-3 text-sky-400 animate-bounce shrink-0" />
                      <span>{showFaultGraph ? "Below the graph is drawn" : "Click 'Draw Graph' — below graph is drawn"}</span>
                      <ArrowDown className="w-3 h-3 text-sky-400 animate-bounce shrink-0" />
                    </div>

                    {/* Expandable: What AI Does, Diagnosis & Solution directly inside this Fault Popup */}
                    {showAiSolution && (
                      <div className="mt-3 pt-2.5 border-t border-slate-800 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
                        {/* Diagnosis & Physics Cause */}
                        <div className="p-2.5 rounded-lg bg-slate-950/90 border border-purple-800/60">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-purple-400 font-bold block mb-0.5">
                            AI DIAGNOSIS
                          </span>
                          <div className="text-xs font-bold text-white leading-tight">
                            {aiPlan.detectedCondition}
                          </div>
                          <p className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                            {aiPlan.physicsCause}
                          </p>
                        </div>

                        {/* Possible Things AI Will Do */}
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300 font-bold block mb-1.5">
                            POSSIBLE THINGS AI WILL DO:
                          </span>
                          <div className="space-y-1.5">
                            {aiPlan.whatAiDoes.map((action, idx) => (
                              <div
                                key={idx}
                                className="p-2 rounded-lg bg-purple-950/40 border border-purple-900/60 flex items-start space-x-2"
                              >
                                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                  {idx + 1}
                                </span>
                                <div className="text-[10px] flex-1">
                                  <div className="flex items-center justify-between">
                                    <strong className="text-purple-200 font-bold">{action.title}</strong>
                                    <span className="text-[8px] font-mono text-purple-300 bg-purple-900/70 px-1 py-0.2 rounded">
                                      {action.speed}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 mt-0.5 leading-relaxed">{action.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* AI Recommended Remedy */}
                        <div className="p-2 rounded-lg bg-blue-950/50 border border-blue-800/60 text-[10px]">
                          <strong className="text-blue-300 block mb-0.5">AI Recommended Fix:</strong>
                          <p className="text-blue-200 leading-relaxed">{aiPlan.aiRecommendedFix}</p>
                        </div>

                        {/* Gemini Deep Explanation if loaded */}
                        {aiExplanationText && (
                          <div className="p-2.5 rounded-lg bg-slate-950 text-white border border-purple-900/60 text-[10px] space-y-1">
                            <div className="flex items-center space-x-1 text-purple-400 font-bold">
                              <Sparkles className="w-3 h-3" />
                              <span>Gemini AI In-Depth Technical Analysis:</span>
                            </div>
                            <p className="text-slate-300 leading-relaxed">{aiExplanationText}</p>
                          </div>
                        )}

                        {/* Direct Action Buttons inside the Fault Popup */}
                        <div className="pt-1 flex flex-col gap-1.5">
                          {aiPlan.canAutoFix && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAiAutoFix();
                              }}
                              className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>Apply AI Solution Now</span>
                            </button>
                          )}

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRequestAiExplanation();
                            }}
                            disabled={isAiExplaining}
                            className="w-full py-1.5 px-3 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-purple-400" />
                            <span>{isAiExplaining ? "Analyzing..." : "Ask Gemini AI Explanation"}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Live Wire & Physics Telemetry Readouts */}
            <div className="mt-3 pt-3 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CURRENT</span>
                <strong
                  className={`text-sm ${
                    physics.currentAmps > physics.breakerRating ? "text-red-400" : "text-amber-400"
                  }`}
                >
                  {physics.currentAmps} A
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">VOLTAGE</span>
                <strong className="text-sm text-blue-400">{physics.voltageEffective} V</strong>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">POWER</span>
                <strong className="text-sm text-emerald-400">{physics.powerWatts} W</strong>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] text-slate-400 block">WIRE TEMP</span>
                <strong
                  className={`text-sm ${
                    physics.wireTemperature > 65 ? "text-red-400 font-black animate-pulse" : "text-slate-200"
                  }`}
                >
                  {physics.wireTemperature} °C
                </strong>
              </div>

              <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800 col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 block">LEAKAGE</span>
                <strong
                  className={`text-sm ${
                    physics.earthLeakageAmps * 1000 > 25 ? "text-red-400" : "text-slate-300"
                  }`}
                >
                  {Math.round(physics.earthLeakageAmps * 1000)} mA
                </strong>
              </div>
            </div>
          </div>

          {/* Progressive Interactive Physics Graph: Traced dynamically when triggered by user */}
          {showFaultGraph && faultPinpoint && (
            <div
              ref={graphContainerRef}
              id="fault-physics-graph-section"
              className="animate-in fade-in zoom-in-95 duration-200 scroll-mt-6"
            >
              {/* Downward indicator notice directly above graph */}
              <div className="mb-2.5 flex items-center justify-center space-x-2 py-1.5 px-4 rounded-xl bg-sky-950/80 border border-sky-500/50 text-xs font-mono font-bold text-sky-300 shadow-sm">
                <ArrowDown className="w-4 h-4 text-sky-400 animate-bounce" />
                <span>Below the graph is drawn • Oscilloscope & Transient Signature</span>
                <ArrowDown className="w-4 h-4 text-sky-400 animate-bounce" />
              </div>
              <FaultPhysicsGraph
                condition={activeCondition}
                physics={physics}
                faultComponentName={faultPinpoint.componentName}
                onClose={() => setShowFaultGraph(false)}
              />
            </div>
          )}

          {/* Visual Connector Map within Physics Circuit View */}
          <VisualConnectorMap
            wires={wires}
            terminals={TERMINALS}
            wireSegments={wireSegments}
            physics={physics}
            onUpdateWireGauge={handleUpdateWireGauge}
            onToggleWireDegradation={handleToggleWireDegradation}
            onRemoveWire={handleRemoveWire}
          />
        </div>

        {/* RIGHT COLUMN (5 Cols): DEDICATED "WHAT WOULD AI DO?" COLUMN */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm flex flex-col h-full">
            {/* Header: SafeCircuit AI Copilot */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">
                    Dedicated Assistant
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                    What Would AI Do in This Case?
                  </h3>
                </div>
              </div>

              {/* Hazard Badge */}
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-black tracking-wider uppercase ${
                  aiPlan.hazardLevel === "CRITICAL"
                    ? "bg-red-100 text-red-700 border border-red-200 animate-pulse"
                    : aiPlan.hazardLevel === "WARNING"
                    ? "bg-amber-100 text-amber-800 border border-amber-200"
                    : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                }`}
              >
                {aiPlan.hazardLevel}
              </span>
            </div>

            {/* Success Notice if AI Fix was applied */}
            {aiFixSuccessNotice && (
              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-start space-x-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{aiFixSuccessNotice}</span>
              </div>
            )}

            {/* Dedicated Fault Origin Pinpoint Unit: Pops up in Copilot ONLY where the fault is */}
            {faultPinpoint ? (
              <div className="mt-4 p-3.5 rounded-xl bg-red-950/40 border-2 border-red-500/80 text-white shadow-xs animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-wider text-red-400">
                      AI FAULT PINPOINT LOCATED
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-red-900/80 text-red-200 px-2 py-0.5 rounded border border-red-700 font-bold">
                    {faultPinpoint.componentName}
                  </span>
                </div>

                <div className="mt-2 text-sm font-extrabold text-white">
                  {faultPinpoint.title}
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {faultPinpoint.shortDescription}
                </p>

                <div className="mt-3 pt-2.5 border-t border-red-900/60 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono text-amber-300 bg-red-950/60 px-2 py-1 rounded border border-red-900/60">
                      {faultPinpoint.metricBadge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Target: <strong className="text-slate-200">{faultPinpoint.componentName}</strong>
                    </span>
                  </div>

                  {/* Dual Action Triggers: 1) See What AI Does, 2) Draw Graph */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setShowAiSolution((prev) => !prev)}
                      className={`py-2 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
                        showAiSolution
                          ? "bg-purple-600 hover:bg-purple-500 text-white ring-2 ring-purple-400/40"
                          : "bg-purple-950 hover:bg-purple-900 text-purple-200 border border-purple-500/60"
                      }`}
                    >
                      <Bot className="w-3.5 h-3.5 shrink-0" />
                      <span>{showAiSolution ? "Hide AI Action" : "🤖 See AI Action"}</span>
                      {showAiSolution ? (
                        <ChevronUp className="w-3 h-3 ml-0.5 shrink-0" />
                      ) : (
                        <ChevronDown className="w-3 h-3 ml-0.5 shrink-0" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setShowFaultGraph(true);
                        setTimeout(() => {
                          graphContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
                        }, 60);
                      }}
                      className={`py-2 px-2.5 rounded-lg text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-xs ${
                        showFaultGraph
                          ? "bg-blue-600 hover:bg-blue-500 text-white ring-2 ring-blue-400/40"
                          : "bg-sky-950 hover:bg-sky-900 text-sky-200 border border-sky-500/60"
                      }`}
                    >
                      <Activity className="w-3.5 h-3.5 shrink-0" />
                      <span>{showFaultGraph ? "📊 Re-Draw" : "📈 Draw Graph"}</span>
                    </button>
                  </div>

                  {/* Downward indicator: writes down that below the graph is drawn with downward arrow to indicate the user */}
                  <div className="flex items-center justify-center space-x-2 py-1.5 px-3 rounded-lg bg-slate-950/90 border border-sky-500/60 text-xs font-mono font-bold text-sky-300">
                    <ArrowDown className="w-4 h-4 text-sky-400 animate-bounce shrink-0" />
                    <span>{showFaultGraph ? "Below the graph is drawn" : "Click 'Draw Graph' — below graph is drawn"}</span>
                    <ArrowDown className="w-4 h-4 text-sky-400 animate-bounce shrink-0" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-xs font-bold">System Health: Clean & Safe</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                  NO ACTIVE FAULTS
                </span>
              </div>
            )}

            {/* Condition Diagnosis & AI Action Playbook - Shown when showAiSolution is toggled */}
            {activeCondition !== "normal" && showAiSolution ? (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Detected Condition & Diagnosis
                    </span>
                    <button
                      onClick={() => setShowAiSolution(false)}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-800"
                    >
                      Hide
                    </button>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-900">{aiPlan.detectedCondition}</h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{aiPlan.physicsCause}</p>
                </div>

                {/* Step-by-Step: What AI Would Do */}
                <div>
                  <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Possible Things AI Will Do:
                  </span>

                  <div className="space-y-2">
                    {aiPlan.whatAiDoes.map((action, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-purple-50/50 border border-purple-100 flex items-start space-x-2.5"
                      >
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="text-xs flex-1">
                          <div className="flex items-center justify-between">
                            <strong className="font-bold text-slate-900">{action.title}</strong>
                            <span className="text-[10px] font-mono text-purple-700 bg-purple-100/70 px-1.5 py-0.5 rounded">
                              {action.speed}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-0.5 leading-relaxed">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommended Fix Box */}
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-950">
                  <strong className="font-bold text-blue-900 block mb-0.5">
                    AI Recommended Engineering Remedy:
                  </strong>
                  <p className="text-blue-800 leading-relaxed">{aiPlan.aiRecommendedFix}</p>
                </div>

                {/* Expanded AI Technical Explanation if generated */}
                {aiExplanationText && (
                  <div className="p-3.5 rounded-xl bg-slate-900 text-white border border-slate-800 text-xs space-y-1.5 animate-in fade-in">
                    <div className="flex items-center space-x-1.5 text-purple-400 font-bold text-[11px]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini AI In-Depth Explanation:</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{aiExplanationText}</p>
                  </div>
                )}

                {/* Action Buttons: 1-Click "Let AI Fix This Circuit" & "Deep Explanation" */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  {aiPlan.canAutoFix && (
                    <button
                      onClick={handleAiAutoFix}
                      className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xs transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Bot className="w-4 h-4" />
                      <span>Let AI Fix This Circuit</span>
                    </button>
                  )}

                  <button
                    onClick={handleRequestAiExplanation}
                    disabled={isAiExplaining}
                    className="py-2.5 px-3.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    <span>{isAiExplaining ? "Analyzing..." : "Ask AI Explanation"}</span>
                  </button>
                </div>
              </div>
            ) : activeCondition !== "normal" ? (
              <div className="mt-4 p-3.5 rounded-xl bg-purple-50/80 border border-purple-200/80 text-purple-950 flex flex-col space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                    <Bot className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>AI Diagnosis & Automated Playbook Ready</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded">
                    ON-DEMAND
                  </span>
                </div>
                <p className="text-xs text-purple-800 leading-relaxed">
                  Click <strong>"🤖 See AI Action"</strong> above or in the fault popup on the circuit to inspect what AI does, view the root cause diagnosis, and apply the engineering fix.
                </p>
                <button
                  onClick={() => setShowAiSolution(true)}
                  className="self-start py-1.5 px-3 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center space-x-1.5 cursor-pointer shadow-xs transition-colors"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>View What AI Will Do & Fix</span>
                  <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
