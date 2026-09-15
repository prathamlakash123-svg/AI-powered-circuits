import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Appliance,
  CircuitConfig,
  CircuitId,
  DiagnosticIssue,
  GroundingQuality,
  PanelType,
  ProtectionState,
  RoomId,
  SafetyLevel,
  Scenario,
  SimulatedMetrics,
  SimulationEvent,
  VoltageStability,
  WireCondition,
  WireGauge,
} from "../types/simulation";
import {
  CHALLENGE_SCENARIOS,
  DEFAULT_APPLIANCES,
  DEFAULT_CIRCUITS,
} from "../data/simulationData";

interface SimulationSettings {
  nominalVoltage: 230 | 120;
  simulationSpeed: number; // 0.5, 1, 2
  isPaused: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
}

interface SimulationContextType {
  // State
  circuits: CircuitConfig[];
  appliances: Appliance[];
  groundingQuality: GroundingQuality;
  panelType: PanelType;
  voltageStability: VoltageStability;
  protectionState: ProtectionState;
  activeScenario: Scenario | null;
  metrics: SimulatedMetrics;
  diagnosticIssues: DiagnosticIssue[];
  events: SimulationEvent[];
  settings: SimulationSettings;
  selectedFaultCircuitId: CircuitId | null;

  // Actions
  toggleAppliance: (id: string) => void;
  moveApplianceRoom: (applianceId: string, newRoom: RoomId) => void;
  assignApplianceCircuit: (applianceId: string, newCircuitId: CircuitId) => void;
  addAppliance: (appliance: Omit<Appliance, "id">) => void;
  removeAppliance: (id: string) => void;

  updateCircuit: (circuitId: CircuitId, updates: Partial<CircuitConfig>) => void;
  setGroundingQuality: (quality: GroundingQuality) => void;
  setPanelType: (type: PanelType) => void;
  setVoltageStability: (stability: VoltageStability) => void;

  resetProtection: () => void;
  toggleBreaker: (circuitId: CircuitId) => void;
  toggleMasterSwitch: () => void;
  triggerRcdTest: () => void;
  toggleApplianceFault: (applianceId: string) => void;
  applySimulatedFix: (issueId: string) => void;
  loadScenario: (scenarioId: string) => void;
  clearScenario: () => void;
  resetToDefaults: () => void;

  updateSettings: (updates: Partial<SimulationSettings>) => void;
  setSelectedFaultCircuitId: (circuitId: CircuitId | null) => void;
  addSimulationEvent: (title: string, type: SimulationEvent["type"], description: string, circuitId?: CircuitId, explanation?: string) => void;
  playSound: (type: "trip" | "click" | "warning" | "success") => void;
  requestAiExplanation: (issue: DiagnosticIssue) => Promise<string>;
}

const SimulationContext = createContext<SimulationContextType | undefined>(undefined);

// Web Audio synthesizer for tactile simulation feedback without external media
class SoundEngine {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  play(type: "trip" | "click" | "warning" | "success") {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;

      if (type === "trip") {
        // Heavy mechanical snap / clunk
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(30, now + 0.15);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.18);
        osc.start(now);
        osc.stop(now + 0.18);
      } else if (type === "warning") {
        // Double electronic chirp
        osc.type = "sine";
        osc.frequency.setValueAtTime(660, now);
        osc.frequency.setValueAtTime(880, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.22);
        osc.start(now);
        osc.stop(now + 0.22);
      } else if (type === "click") {
        // Subtle toggle click
        osc.type = "triangle";
        osc.frequency.setValueAtTime(350, now);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === "success") {
        // Ascending harmonic chime
        osc.type = "sine";
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.25);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
      }
    } catch {
      // Ignore if browser prevents auto-audio
    }
  }
}

const soundEngine = new SoundEngine();

export const SimulationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [circuits, setCircuits] = useState<CircuitConfig[]>(DEFAULT_CIRCUITS);
  const [appliances, setAppliances] = useState<Appliance[]>(DEFAULT_APPLIANCES);
  const [groundingQuality, setGroundingQuality] = useState<GroundingQuality>("EXCELLENT");
  const [panelType, setPanelType] = useState<PanelType>("MODERN_SPLIT");
  const [voltageStability, setVoltageStability] = useState<VoltageStability>("STABLE");
  const [protectionState, setProtectionState] = useState<ProtectionState>("ARMED");
  const [activeScenario, setActiveScenario] = useState<Scenario | null>(null);
  const [selectedFaultCircuitId, setSelectedFaultCircuitId] = useState<CircuitId | null>(null);

  const [settings, setSettings] = useState<SimulationSettings>({
    nominalVoltage: 230,
    simulationSpeed: 1,
    isPaused: false,
    soundEnabled: true,
    highContrast: false,
  });

  const [events, setEvents] = useState<SimulationEvent[]>([
    {
      id: "ev_init",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      title: "SafeCircuit Simulation Initialized",
      type: "info",
      description: "Default residential distribution network loaded. All protective devices armed.",
      educationalExplanation: "Standard household split-load panel configured with 230V supply and branch circuit breakers.",
    },
  ]);

  const playSound = useCallback((type: "trip" | "click" | "warning" | "success") => {
    if (settings.soundEnabled) {
      soundEngine.play(type);
    }
  }, [settings.soundEnabled]);

  const addSimulationEvent = useCallback((
    title: string,
    type: SimulationEvent["type"],
    description: string,
    circuitId?: CircuitId,
    explanation?: string
  ) => {
    const newEvent: SimulationEvent = {
      id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      title,
      type,
      description,
      circuitId,
      educationalExplanation: explanation || "Simulated educational observation based on modeled electrical parameters.",
    };

    setEvents((prev) => [newEvent, ...prev.slice(0, 49)]); // keep latest 50 events
  }, []);

  // Update specific circuit configuration
  const updateCircuit = useCallback((circuitId: CircuitId, updates: Partial<CircuitConfig>) => {
    setCircuits((prev) =>
      prev.map((c) => (c.id === circuitId ? { ...c, ...updates } : c))
    );
    addSimulationEvent(
      "Circuit Parameter Modified",
      "info",
      `Updated parameters on ${circuitId}.`,
      circuitId,
      "Modifying wire gauge, breaker rating, or safety devices alters simulated current carrying capacity and protection curves."
    );
    playSound("click");
  }, [addSimulationEvent, playSound]);

  // Appliance state modifications
  const toggleAppliance = useCallback((id: string) => {
    setAppliances((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const newState = !app.isOn;
          addSimulationEvent(
            newState ? `${app.name} Switched ON` : `${app.name} Switched OFF`,
            "load",
            `${app.name} (${app.nominalWatts}W) ${newState ? "connected to" : "disconnected from"} ${app.circuitId}.`,
            app.circuitId,
            newState
              ? "Turning on an appliance draws electrical power, increasing current flow through that circuit's conductors and breaker."
              : "Turning off an appliance reduces total circuit current and thermal dissipation."
          );
          return { ...app, isOn: newState };
        }
        return app;
      })
    );
    playSound("click");
  }, [addSimulationEvent, playSound]);

  const moveApplianceRoom = useCallback((applianceId: string, newRoom: RoomId) => {
    setAppliances((prev) =>
      prev.map((a) => (a.id === applianceId ? { ...a, room: newRoom } : a))
    );
    playSound("click");
  }, [playSound]);

  const assignApplianceCircuit = useCallback((applianceId: string, newCircuitId: CircuitId) => {
    setAppliances((prev) =>
      prev.map((a) => {
        if (a.id === applianceId) {
          addSimulationEvent(
            `Reassigned ${a.name}`,
            "info",
            `Moved ${a.name} from ${a.circuitId} to ${newCircuitId}.`,
            newCircuitId,
            "Rebalancing heavy appliances across separate circuits is a primary method to eliminate circuit overload."
          );
          return { ...a, circuitId: newCircuitId };
        }
        return a;
      })
    );
    playSound("click");
  }, [addSimulationEvent, playSound]);

  const addAppliance = useCallback((applianceData: Omit<Appliance, "id">) => {
    const newApp: Appliance = {
      ...applianceData,
      id: `app_custom_${Date.now()}`,
    };
    setAppliances((prev) => [...prev, newApp]);
    addSimulationEvent(
      `Appliance Added: ${newApp.name}`,
      "load",
      `Added ${newApp.name} (${newApp.nominalWatts}W) to ${newApp.room}.`,
      newApp.circuitId
    );
    playSound("click");
  }, [addSimulationEvent, playSound]);

  const removeAppliance = useCallback((id: string) => {
    setAppliances((prev) => prev.filter((a) => a.id !== id));
    playSound("click");
  }, [playSound]);

  const toggleBreaker = useCallback((circuitId: CircuitId) => {
    setCircuits((prev) =>
      prev.map((c) => {
        if (c.id === circuitId) {
          const newTripped = !c.isBreakerTripped;
          addSimulationEvent(
            newTripped ? `Breaker ${circuitId} Opened (OFF)` : `Breaker ${circuitId} Closed (ON)`,
            newTripped ? "trip" : "fix",
            `Manual toggle of breaker for ${c.name}.`,
            circuitId
          );
          return { ...c, isBreakerTripped: newTripped };
        }
        return c;
      })
    );
    playSound("trip");
  }, [addSimulationEvent, playSound]);

  const resetProtection = useCallback(() => {
    setProtectionState("ARMED");
    setCircuits((prev) =>
      prev.map((c) => ({
        ...c,
        isBreakerTripped: false,
      }))
    );
    addSimulationEvent(
      "Simulated Protection Reset",
      "fix",
      "All branch circuit breakers and main residual current protection re-engaged.",
      undefined,
      "In real life, never reset a tripped breaker without first investigating and clearing the fault."
    );
    playSound("success");
  }, [addSimulationEvent, playSound]);

  const toggleMasterSwitch = useCallback(() => {
    setProtectionState((prev) => {
      const nextState: ProtectionState = prev === "DISCONNECTED" ? "ARMED" : "DISCONNECTED";
      addSimulationEvent(
        nextState === "DISCONNECTED" ? "Main Isolator Opened (Power Cut)" : "Main Isolator Closed (Mains Restored)",
        nextState === "DISCONNECTED" ? "warning" : "info",
        nextState === "DISCONNECTED"
          ? "Double-pole master isolator turned OFF. All household circuits completely de-energized."
          : "Double-pole master isolator turned ON. 230V mains supply restored to consumer panel.",
        undefined,
        "The master isolator is the primary manual disconnect switch for the building, isolating both Phase (Live) and Neutral conductors simultaneously."
      );
      playSound(nextState === "DISCONNECTED" ? "trip" : "click");
      return nextState;
    });
  }, [addSimulationEvent, playSound]);

  const triggerRcdTest = useCallback(() => {
    setProtectionState("TRIPPED");
    setCircuits((prev) =>
      prev.map((c) => (c.hasRCCB || c.hasRCBO ? { ...c, isBreakerTripped: true } : c))
    );
    addSimulationEvent(
      "RCD 'TEST' Pushbutton Activated",
      "trip",
      "Simulated 30mA residual leakage initiated through internal test resistor. RCCB mechanical trip latch successfully actuated.",
      undefined,
      "Electrical codes (BS 7671 / IEC 60364) mandate pressing this mechanical test button periodically to ensure the mechanical spring trip mechanism has not seized."
    );
    playSound("trip");
  }, [addSimulationEvent, playSound]);

  const toggleApplianceFault = useCallback((applianceId: string) => {
    setAppliances((prev) =>
      prev.map((a) => {
        if (a.id === applianceId) {
          const nextFault = !a.isFaulty;
          addSimulationEvent(
            nextFault ? `Injected Chassis Ground Fault: ${a.name}` : `Cleared Fault on ${a.name}`,
            nextFault ? "warning" : "fix",
            nextFault
              ? `Simulated 28mA current leakage escaping through metal chassis of ${a.name}.`
              : `Restored insulation resistance on ${a.name}. Leakage current returned to 0 mA.`,
            a.circuitId,
            nextFault
              ? "If a protective earth wire or RCD is not functioning, touching this metal casing delivers a dangerous electrical shock."
              : "Appliances in good condition maintain >1 Megaohm insulation resistance, preventing leakage to touchable metalwork."
          );
          playSound(nextFault ? "warning" : "success");
          return {
            ...a,
            isFaulty: nextFault,
            leakageCurrentMa: nextFault ? 28 : 0,
          };
        }
        return a;
      })
    );
  }, [addSimulationEvent, playSound]);

  // Load a guided educational scenario
  const loadScenario = useCallback((scenarioId: string) => {
    const sc = CHALLENGE_SCENARIOS.find((s) => s.id === scenarioId);
    if (!sc) return;

    setActiveScenario(sc);
    resetProtection();

    if (sc.id === "scenario_overload") {
      // Multiple heavy appliances on circuit 2 with 16A breaker
      setCircuits((prev) =>
        prev.map((c) =>
          c.id === "circuit_2"
            ? { ...c, breakerRating: 16, wireGauge: "14_AWG", wireCondition: "GOOD" }
            : c
        )
      );
      setAppliances((prev) =>
        prev.map((a) => {
          if (a.id === "app_microwave_kitchen" || a.id === "app_heater_kitchen") {
            return { ...a, circuitId: "circuit_2", isOn: true };
          }
          if (a.id === "app_fridge_kitchen") {
            return { ...a, isOn: true };
          }
          return a;
        })
      );
    } else if (sc.id === "scenario_aging_wire") {
      // Degraded wire on circuit 1
      setCircuits((prev) =>
        prev.map((c) =>
          c.id === "circuit_1"
            ? { ...c, wireCondition: "DEGRADED", wireGauge: "14_AWG" }
            : c
        )
      );
      setAppliances((prev) =>
        prev.map((a) => {
          if (a.id === "app_heater_bed") {
            return { ...a, isOn: true, circuitId: "circuit_1" };
          }
          if (a.id === "app_computer_bed") {
            return { ...a, isOn: true, circuitId: "circuit_1" };
          }
          return a;
        })
      );
    } else if (sc.id === "scenario_missing_rccb") {
      // Disable RCCB on circuit 2 and set leakage on an appliance
      setCircuits((prev) =>
        prev.map((c) =>
          c.id === "circuit_2" ? { ...c, hasRCCB: false, hasRCBO: false } : c
        )
      );
      setAppliances((prev) =>
        prev.map((a) =>
          a.id === "app_heater_kitchen"
            ? { ...a, isOn: true, isFaulty: true, leakageCurrentMa: 28 }
            : a
        )
      );
    } else if (sc.id === "scenario_poor_grounding") {
      setGroundingQuality("DISCONNECTED");
    } else if (sc.id === "scenario_obsolete_panel") {
      setPanelType("OBSOLETE_FUSEBOX");
      setCircuits((prev) =>
        prev.map((c) => ({
          ...c,
          hasRCCB: false,
          hasRCBO: false,
          breakerHealth: 65,
        }))
      );
    } else if (sc.id === "scenario_arc_fault") {
      setVoltageStability("ARC_FAULT");
      setAppliances((prev) =>
        prev.map((a) =>
          a.id === "app_tv_living" ? { ...a, isFaulty: true, isOn: true } : a
        )
      );
    }

    addSimulationEvent(
      `Started Scenario: ${sc.title}`,
      "scenario",
      sc.description,
      undefined,
      sc.learningGoal
    );
    playSound("warning");
  }, [addSimulationEvent, playSound, resetProtection]);

  const clearScenario = useCallback(() => {
    setActiveScenario(null);
    addSimulationEvent("Exited Scenario Mode", "info", "Simulation returned to free sandbox mode.");
    playSound("click");
  }, [addSimulationEvent, playSound]);

  const resetToDefaults = useCallback(() => {
    setCircuits(DEFAULT_CIRCUITS);
    setAppliances(DEFAULT_APPLIANCES);
    setGroundingQuality("EXCELLENT");
    setPanelType("MODERN_SPLIT");
    setVoltageStability("STABLE");
    setProtectionState("ARMED");
    setActiveScenario(null);
    setSelectedFaultCircuitId(null);
    addSimulationEvent("Simulation Network Reset", "fix", "Restored all default residential circuit parameters.");
    playSound("success");
  }, [addSimulationEvent, playSound]);

  const updateSettings = useCallback((updates: Partial<SimulationSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  }, []);

  // Continuous deterministic calculations of simulated electrical parameters
  const metrics = useMemo<SimulatedMetrics>(() => {
    const baseVoltage = settings.nominalVoltage;
    let effectiveVoltage = baseVoltage;

    // Adjust voltage based on stability
    if (voltageStability === "FLUCTUATING") {
      effectiveVoltage = baseVoltage + (Math.sin(Date.now() / 1500) * 12);
    } else if (voltageStability === "SEVERE_VARIATION") {
      effectiveVoltage = baseVoltage + (Math.sin(Date.now() / 800) * 28) - 15;
    } else if (voltageStability === "ARC_FAULT") {
      effectiveVoltage = baseVoltage + (Math.random() * 16 - 8);
    }

    let totalWatts = 0;
    let maxCircuitWatts = 0;
    let totalCurrent = 0;
    let maxWireTemp = 25; // ambient
    let maxLeakage = 3.5; // baseline capacitive leakage

    circuits.forEach((circuit) => {
      // Calculate active load for this circuit
      const circuitAppliances = appliances.filter(
        (a) => a.circuitId === circuit.id && a.isOn
      );

      const circuitWatts = circuitAppliances.reduce((sum, a) => sum + a.nominalWatts, 0);

      // If circuit breaker is tripped or whole protection tripped, current drops to 0
      const isEnergized =
        protectionState !== "DISCONNECTED" && !circuit.isBreakerTripped;

      const circuitCurrent = isEnergized ? circuitWatts / effectiveVoltage : 0;

      totalWatts += isEnergized ? circuitWatts : 0;
      totalCurrent += circuitCurrent;
      if (circuitWatts > maxCircuitWatts) {
        maxCircuitWatts = circuitWatts;
      }

      // Conductor resistance calculation based on gauge & condition
      const gaugeResistanceMultipliers: Record<WireGauge, number> = {
        "14_AWG": 1.4,
        "12_AWG": 1.0,
        "10_AWG": 0.7,
        "8_AWG": 0.5,
      };

      const conditionResistanceMultipliers: Record<WireCondition, number> = {
        NEW: 1.0,
        GOOD: 1.1,
        AGED: 1.6,
        DEGRADED: 2.8,
      };

      const rFactor =
        gaugeResistanceMultipliers[circuit.wireGauge] *
        conditionResistanceMultipliers[circuit.wireCondition];

      // Simulated thermal rise (I^2 * R heating modeled)
      const thermalRise = circuitCurrent * circuitCurrent * rFactor * 0.18;
      const circuitWireTemp = 25 + thermalRise;
      if (circuitWireTemp > maxWireTemp) {
        maxWireTemp = circuitWireTemp;
      }

      // Check for faulty appliance leakage on this circuit
      circuitAppliances.forEach((a) => {
        if (a.isFaulty && a.leakageCurrentMa) {
          maxLeakage += a.leakageCurrentMa;
        }
      });
    });

    // Check Grounding impedance factor
    if (groundingQuality === "DEGRADED") {
      maxLeakage += 8;
    } else if (groundingQuality === "DISCONNECTED") {
      maxLeakage += 22;
    }

    // Determine overall SafetyLevel
    let safety: SafetyLevel = "SAFE";

    const hasOverloadedCircuit = circuits.some((c) => {
      const cWatts = appliances
        .filter((a) => a.circuitId === c.id && a.isOn)
        .reduce((sum, a) => sum + a.nominalWatts, 0);
      const cCurrent = cWatts / effectiveVoltage;
      return cCurrent > c.breakerRating;
    });

    const hasNearOverload = circuits.some((c) => {
      const cWatts = appliances
        .filter((a) => a.circuitId === c.id && a.isOn)
        .reduce((sum, a) => sum + a.nominalWatts, 0);
      const cCurrent = cWatts / effectiveVoltage;
      return cCurrent > c.breakerRating * 0.85;
    });

    if (
      protectionState === "TRIPPED" ||
      protectionState === "DISCONNECTED" ||
      hasOverloadedCircuit ||
      maxWireTemp > 68 ||
      maxLeakage > 30 ||
      voltageStability === "ARC_FAULT"
    ) {
      safety = "CRITICAL";
    } else if (
      hasNearOverload ||
      maxWireTemp > 50 ||
      maxLeakage > 15 ||
      voltageStability === "FLUCTUATING" ||
      voltageStability === "SEVERE_VARIATION" ||
      groundingQuality !== "EXCELLENT" ||
      panelType === "OBSOLETE_FUSEBOX"
    ) {
      safety = "WARNING";
    }

    const voltageStatus: "NORMAL" | "FLUCTUATING" | "UNSTABLE" =
      voltageStability === "STABLE"
        ? "NORMAL"
        : voltageStability === "FLUCTUATING"
        ? "FLUCTUATING"
        : "UNSTABLE";

    const currentStatus: "NORMAL" | "HIGH" | "OVERLOAD" =
      hasOverloadedCircuit
        ? "OVERLOAD"
        : hasNearOverload
        ? "HIGH"
        : "NORMAL";

    const temperatureStatus: "NORMAL" | "WARM" | "CRITICAL" =
      maxWireTemp > 65
        ? "CRITICAL"
        : maxWireTemp > 45
        ? "WARM"
        : "NORMAL";

    const leakageStatus: "NORMAL" | "ELEVATED" | "DANGEROUS" =
      maxLeakage > 25
        ? "DANGEROUS"
        : maxLeakage > 10
        ? "ELEVATED"
        : "NORMAL";

    const breakerHealthAverage = Math.round(
      circuits.reduce((sum, c) => sum + c.breakerHealth, 0) / (circuits.length || 1)
    );

    return {
      voltage: Math.round(effectiveVoltage * 10) / 10,
      current: Math.round(totalCurrent * 10) / 10,
      totalWatts: Math.round(totalWatts),
      maxCircuitWatts: Math.round(maxCircuitWatts),
      wireTemperature: Math.round(maxWireTemp * 10) / 10,
      leakageCurrent: Math.round(maxLeakage * 10) / 10,
      safetyLevel: safety,
      voltageStability,
      protectionState,
      activeWarningsCount: 0, // dynamically filled below
      voltageStatus,
      currentStatus,
      temperatureStatus,
      leakageStatus,
      breakerHealthAverage,
    };
  }, [
    settings.nominalVoltage,
    voltageStability,
    circuits,
    appliances,
    protectionState,
    groundingQuality,
    panelType,
  ]);

  // AI Rule-Based Diagnostic Engine: generates structured issues with explanations & simulated fixes
  const diagnosticIssues = useMemo<DiagnosticIssue[]>(() => {
    const issues: DiagnosticIssue[] = [];

    // 1. Check for Circuit Overloads
    circuits.forEach((circuit) => {
      const circuitAppliances = appliances.filter(
        (a) => a.circuitId === circuit.id && a.isOn
      );
      const circuitWatts = circuitAppliances.reduce((sum, a) => sum + a.nominalWatts, 0);
      const current = circuitWatts / metrics.voltage;

      if (current > circuit.breakerRating) {
        issues.push({
          id: `issue_overload_${circuit.id}`,
          title: `Overload Risk Detected on ${circuit.name}`,
          severity: "CRITICAL",
          description: `Several appliances are drawing an excessive simulated current (${current.toFixed(1)} A) exceeding the ${circuit.breakerRating} A breaker limit.`,
          why: `The modeled current has exceeded the configured simulation limit for this branch. Continuous overcurrent will cause the bimetallic thermal element to trip or heat the conductors.`,
          affectedArea: `${circuit.name}`,
          circuitId: circuit.id,
          componentType: "breaker",
          fixDescription: "Rebalance appliances by moving one high-wattage appliance to another circuit, or upgrade simulated breaker & wire rating.",
          fixActionType: "rebalance_load",
        });
      } else if (current > circuit.breakerRating * 0.85) {
        issues.push({
          id: `issue_high_load_${circuit.id}`,
          title: `High Continuous Load on ${circuit.name}`,
          severity: "WARNING",
          description: `Current draw (${current.toFixed(1)} A) is operating at ${(current / circuit.breakerRating * 100).toFixed(0)}% of breaker capacity.`,
          why: `Operating close to maximum capacity reduces safety headroom and causes thermal warming over time.`,
          affectedArea: `${circuit.name}`,
          circuitId: circuit.id,
          componentType: "circuit",
          fixDescription: "Turn off non-essential appliances on this circuit to restore safe operating margin.",
          fixActionType: "rebalance_load",
        });
      }

      // 2. Check for Aging / Degraded Wire Thermal Hazard
      if (circuit.wireCondition === "DEGRADED" || circuit.wireCondition === "AGED") {
        if (current > 8) {
          issues.push({
            id: `issue_wire_age_${circuit.id}`,
            title: `Degraded Conductor Heating Risk (${circuit.name})`,
            severity: circuit.wireCondition === "DEGRADED" ? "CRITICAL" : "WARNING",
            description: `Simulated wire condition is ${circuit.wireCondition}, introducing high internal resistance and thermal heat dissipation.`,
            why: `As copper conductors age and undergo thermal fatigue, contact resistance increases. High current causes localized heat buildup inside simulated wall cavities.`,
            affectedArea: `${circuit.name} Wiring Path`,
            circuitId: circuit.id,
            componentType: "wire",
            fixDescription: "Upgrade simulated wire condition to 'Good' or 'New' with a heavier 12 AWG gauge in Circuit Lab.",
            fixActionType: "upgrade_wire",
          });
        }
      }

      // 3. Check for Missing RCCB / RCBO Protection
      if (!circuit.hasRCCB && !circuit.hasRCBO) {
        issues.push({
          id: `issue_missing_rccb_${circuit.id}`,
          title: `Missing Residual Current Protection (${circuit.name})`,
          severity: "WARNING",
          description: `This circuit lacks simulated RCCB/RCBO earth leakage detection.`,
          why: `Standard circuit breakers only trip on large overcurrents (16-20A). They cannot detect tiny 30mA residual leakages that present human electrical shock hazards.`,
          affectedArea: `${circuit.name} Panel Slot`,
          circuitId: circuit.id,
          componentType: "breaker",
          fixDescription: "Enable RCCB or RCBO protection for this circuit in Circuit Lab.",
          fixActionType: "add_rccb",
        });
      }
    });

    // 4. Grounding System Quality
    if (groundingQuality === "DISCONNECTED") {
      issues.push({
        id: "issue_ground_disconnected",
        title: "Main Earth Ground Disconnected",
        severity: "CRITICAL",
        description: "The simulated main grounding electrode connection has high impedance or is open-circuit.",
        why: "Without a low-resistance path to earth, stray electrical charges cannot dissipate safely, creating a touch-voltage shock hazard on metal chassis.",
        affectedArea: "Panel Ground Busbar & Earth Electrode",
        componentType: "ground",
        fixDescription: "Restore simulated grounding quality to 'Excellent / Solid Earth' in Circuit Lab.",
        fixActionType: "fix_grounding",
      });
    } else if (groundingQuality === "DEGRADED") {
      issues.push({
        id: "issue_ground_degraded",
        title: "Degraded Earth Ground Resistance",
        severity: "WARNING",
        description: "Ground loop resistance is elevated (>25Ω).",
        why: "Elevated earth resistance can impair the fast clearance of ground faults and surge suppression.",
        affectedArea: "Earth Ground Rod",
        componentType: "ground",
        fixDescription: "Service the simulated ground electrode connection to achieve <5Ω resistance.",
        fixActionType: "fix_grounding",
      });
    }

    // 5. Obsolete Panel
    if (panelType === "OBSOLETE_FUSEBOX") {
      issues.push({
        id: "issue_panel_obsolete",
        title: "Obsolete Fuse-Wire Distribution Panel",
        severity: "WARNING",
        description: "The distribution panel uses legacy rewireable fuses lacking modern magnetic trip curves and dual RCCBs.",
        why: "Rewireable fuses degrade slowly under overload and offer zero protection against residual current or micro-shocks.",
        affectedArea: "Main Distribution Board",
        componentType: "panel",
        fixDescription: "Upgrade the simulated distribution board to a modern Split-Load Consumer Unit.",
        fixActionType: "upgrade_panel",
      });
    }

    // 6. Arc Fault Scenario
    if (voltageStability === "ARC_FAULT") {
      issues.push({
        id: "issue_arc_fault",
        title: "Simulated Arc-Fault Condition Detected",
        severity: "CRITICAL",
        description: "High-frequency erratic waveform noise indicates intermittent sparking across a loose terminal.",
        why: "Arcing generates localized temperatures exceeding 3,000°C without drawing enough sustained current to trip a standard thermal breaker.",
        affectedArea: "Branch Outlets & Connections",
        componentType: "wire",
        fixDescription: "Clear simulated loose connection and reset voltage stability to 'Stable'.",
        fixActionType: "turn_off_faulty",
      });
    }

    // 7. Voltage Fluctuation
    if (voltageStability === "SEVERE_VARIATION" || voltageStability === "FLUCTUATING") {
      issues.push({
        id: "issue_voltage_fluctuation",
        title: `Voltage Instability: ${voltageStability === "SEVERE_VARIATION" ? "High Variation" : "Moderate Fluctuation"}`,
        severity: voltageStability === "SEVERE_VARIATION" ? "CRITICAL" : "WARNING",
        description: `Simulated voltage is varying by ±${voltageStability === "SEVERE_VARIATION" ? "25" : "12"}V from nominal.`,
        why: "Simulated grid brownouts or intermittent loose neutral connections cause erratic electrical delivery.",
        affectedArea: "Main Incomer Supply",
        componentType: "panel",
        fixDescription: "Stabilize the simulated voltage supply in Circuit Lab or Settings.",
        fixActionType: "upgrade_panel",
      });
    }

    return issues;
  }, [circuits, appliances, metrics.voltage, groundingQuality, panelType, voltageStability]);

  // Keep metrics.activeWarningsCount updated
  metrics.activeWarningsCount = diagnosticIssues.length;

  // Real-time automatic simulated protection trip logic
  const lastTripCheck = useRef<number>(Date.now());
  useEffect(() => {
    if (settings.isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      lastTripCheck.current = now;

      // Check if any circuit is in severe sustained overload
      circuits.forEach((circuit) => {
        if (circuit.isBreakerTripped || protectionState === "DISCONNECTED") return;

        const circuitAppliances = appliances.filter(
          (a) => a.circuitId === circuit.id && a.isOn
        );
        const circuitWatts = circuitAppliances.reduce((sum, a) => sum + a.nominalWatts, 0);
        const current = circuitWatts / metrics.voltage;

        // Severe overload: current > breaker rating
        if (current > circuit.breakerRating) {
          // Automatic Simulated Protection activation
          setCircuits((prev) =>
            prev.map((c) =>
              c.id === circuit.id
                ? { ...c, isBreakerTripped: true, breakerHealth: Math.max(10, c.breakerHealth - 4) }
                : c
            )
          );
          setProtectionState("TRIPPED");
          setSelectedFaultCircuitId(circuit.id);

          addSimulationEvent(
            "⚡ CRITICAL SIMULATION EVENT: Simulated Protection Activated",
            "trip",
            `Breaker ${circuit.name} tripped automatically due to overcurrent (${current.toFixed(1)} A > ${circuit.breakerRating} A). Supply disconnected.`,
            circuit.id,
            "Automatic protection successfully isolated the overloaded simulated branch to prevent virtual conductor damage. Inspect SafeCircuit AI and apply the simulated fix."
          );
          playSound("trip");
        }

        // Earth leakage trip: if circuit has RCCB and leakage > 30mA
        const hasHighLeakageApp = circuitAppliances.some(
          (a) => a.isFaulty && (a.leakageCurrentMa || 0) >= 25
        );
        if (hasHighLeakageApp && (circuit.hasRCCB || circuit.hasRCBO)) {
          setCircuits((prev) =>
            prev.map((c) => (c.id === circuit.id ? { ...c, isBreakerTripped: true } : c))
          );
          setProtectionState("TRIPPED");
          setSelectedFaultCircuitId(circuit.id);

          addSimulationEvent(
            "⚡ RESIDUAL CURRENT TRIP: RCCB Protection Activated",
            "trip",
            `RCCB on ${circuit.name} detected >30mA earth leakage current and tripped within simulated 30ms.`,
            circuit.id,
            "The RCCB detected an imbalance between live and neutral currents, simulating immediate protection against electrical shock."
          );
          playSound("trip");
        }
      });
    }, 2000 / settings.simulationSpeed);

    return () => clearInterval(interval);
  }, [circuits, appliances, metrics.voltage, protectionState, settings.isPaused, settings.simulationSpeed, addSimulationEvent, playSound]);

  // Apply simulated fix function
  const applySimulatedFix = useCallback((issueId: string) => {
    const issue = diagnosticIssues.find((i) => i.id === issueId);
    if (!issue) return;

    if (issue.fixActionType === "rebalance_load" && issue.circuitId) {
      // Find an active heavy appliance on this circuit and move to another circuit (e.g. circuit 3 or 4)
      const heavyApp = appliances.find(
        (a) => a.circuitId === issue.circuitId && a.isOn && a.nominalWatts >= 800
      );
      if (heavyApp) {
        const targetCircuit: CircuitId =
          issue.circuitId === "circuit_2" ? "circuit_3" : "circuit_4";
        assignApplianceCircuit(heavyApp.id, targetCircuit);
      } else {
        // Turn off highest wattage appliance
        const activeApps = appliances.filter((a) => a.circuitId === issue.circuitId && a.isOn);
        if (activeApps.length > 0) {
          activeApps.sort((a, b) => b.nominalWatts - a.nominalWatts);
          toggleAppliance(activeApps[0].id);
        }
      }
    } else if (issue.fixActionType === "upgrade_wire" && issue.circuitId) {
      updateCircuit(issue.circuitId, {
        wireCondition: "GOOD",
        wireGauge: "12_AWG",
      });
    } else if (issue.fixActionType === "add_rccb" && issue.circuitId) {
      updateCircuit(issue.circuitId, {
        hasRCCB: true,
        hasRCBO: true,
      });
    } else if (issue.fixActionType === "fix_grounding") {
      setGroundingQuality("EXCELLENT");
    } else if (issue.fixActionType === "upgrade_panel") {
      setPanelType("MODERN_SPLIT");
      setVoltageStability("STABLE");
    } else if (issue.fixActionType === "turn_off_faulty") {
      setVoltageStability("STABLE");
      setAppliances((prev) =>
        prev.map((a) => (a.isFaulty ? { ...a, isFaulty: false, leakageCurrentMa: 0 } : a))
      );
    }

    // Reset protection so user can re-run
    resetProtection();
    addSimulationEvent(
      "Simulated Fix Applied",
      "fix",
      `Resolved: ${issue.title}. Simulation parameters restored to safe profile.`,
      issue.circuitId,
      "The underlying simulated issue has been rectified. Observe the updated waveforms and gauges."
    );
    playSound("success");
  }, [diagnosticIssues, appliances, assignApplianceCircuit, toggleAppliance, updateCircuit, resetProtection, addSimulationEvent, playSound]);

  const requestAiExplanation = useCallback(async (issue: DiagnosticIssue): Promise<string> => {
    try {
      const response = await fetch("/api/ai-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          condition: issue.title,
          circuitData: {
            affectedArea: issue.affectedArea,
            why: issue.why,
            severity: issue.severity,
            componentType: issue.componentType,
          },
          symptoms: [issue.description],
        }),
      });
      if (!response.ok) {
        throw new Error("API request failed");
      }
      const data = await response.json();
      return data.explanation || issue.why;
    } catch {
      return `${issue.why} In educational simulation terms: ${issue.fixDescription}`;
    }
  }, []);

  return (
    <SimulationContext.Provider
      value={{
        circuits,
        appliances,
        groundingQuality,
        panelType,
        voltageStability,
        protectionState,
        activeScenario,
        metrics,
        diagnosticIssues,
        events,
        settings,
        selectedFaultCircuitId,
        toggleAppliance,
        moveApplianceRoom,
        assignApplianceCircuit,
        addAppliance,
        removeAppliance,
        updateCircuit,
        setGroundingQuality,
        setPanelType,
        setVoltageStability,
        resetProtection,
        toggleBreaker,
        toggleMasterSwitch,
        triggerRcdTest,
        toggleApplianceFault,
        applySimulatedFix,
        loadScenario,
        clearScenario,
        resetToDefaults,
        updateSettings,
        setSelectedFaultCircuitId,
        addSimulationEvent,
        playSound,
        requestAiExplanation,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
};

export function useSimulation(): SimulationContextType {
  const ctx = useContext(SimulationContext);
  if (!ctx) {
    throw new Error("useSimulation must be used within a SimulationProvider");
  }
  return ctx;
}
