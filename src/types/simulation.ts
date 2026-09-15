export type SafetyLevel = "SAFE" | "WARNING" | "CRITICAL";

export type ProtectionState = "ARMED" | "TRIPPED" | "DISCONNECTED";

export type VoltageStability = "STABLE" | "FLUCTUATING" | "SEVERE_VARIATION" | "ARC_FAULT";

export type WireGauge = "14_AWG" | "12_AWG" | "10_AWG" | "8_AWG";

export type WireCondition = "NEW" | "GOOD" | "AGED" | "DEGRADED";

export type GroundingQuality = "EXCELLENT" | "DEGRADED" | "DISCONNECTED";

export type PanelType = "MODERN_SPLIT" | "STANDARD_CONSUMER" | "OBSOLETE_FUSEBOX";

export type BreakerRating = 10 | 16 | 20 | 32; // Amperes

export type RoomId = "living_room" | "kitchen" | "bedroom" | "garage_utility";

export type CircuitId = "circuit_1" | "circuit_2" | "circuit_3" | "circuit_4";

export interface Appliance {
  id: string;
  name: string;
  type: "light" | "fan" | "tv" | "computer" | "refrigerator" | "heater" | "microwave" | "outlet";
  room: RoomId;
  circuitId: CircuitId;
  nominalWatts: number;
  isOn: boolean;
  isFaulty?: boolean; // e.g. Simulated leakage or arc
  leakageCurrentMa?: number;
  iconName: string;
}

export interface CircuitConfig {
  id: CircuitId;
  name: string;
  roomIds: RoomId[];
  breakerRating: BreakerRating;
  wireGauge: WireGauge;
  wireCondition: WireCondition;
  hasRCCB: boolean;
  hasRCBO: boolean;
  isBreakerTripped: boolean;
  breakerHealth: number; // 0 - 100%
  color: string;
}

export interface SimulatedMetrics {
  voltage: number; // Volts
  current: number; // Amperes
  totalWatts: number;
  maxCircuitWatts: number;
  wireTemperature: number; // Celsius
  leakageCurrent: number; // mA
  safetyLevel: SafetyLevel;
  voltageStability: VoltageStability;
  protectionState: ProtectionState;
  activeWarningsCount: number;

  // Status indicators for meters
  voltageStatus: "NORMAL" | "FLUCTUATING" | "UNSTABLE";
  currentStatus: "NORMAL" | "HIGH" | "OVERLOAD";
  temperatureStatus: "NORMAL" | "WARM" | "CRITICAL";
  leakageStatus: "NORMAL" | "ELEVATED" | "DANGEROUS";
  breakerHealthAverage: number;
}

export interface DiagnosticIssue {
  id: string;
  title: string;
  severity: SafetyLevel;
  description: string;
  why: string;
  detected?: string;
  prevention?: string;
  affectedArea: string;
  circuitId?: CircuitId;
  applianceId?: string;
  componentType: "circuit" | "wire" | "breaker" | "ground" | "panel" | "appliance";
  fixDescription: string;
  type?: string;
  fixAction?: string;
  fixActionType:
    | "rebalance_load"
    | "upgrade_wire"
    | "add_rccb"
    | "upgrade_breaker"
    | "fix_grounding"
    | "upgrade_panel"
    | "turn_off_faulty";
}

export interface SimulationEvent {
  id: string;
  timestamp: string;
  title: string;
  type: "info" | "load" | "warning" | "trip" | "fix" | "scenario";
  description: string;
  circuitId?: CircuitId;
  educationalExplanation?: string;
}

export interface Scenario {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  description: string;
  learningGoal: string;
  initialSetupDescription: string;
  expectedFault: string;
  correctActionHint: string;
  circuitId?: CircuitId;
  initialCondition?: string;
  symptoms?: string[];
  aiDiagnosis?: string;
  solutionOptions?: string[];
  resultAfterFix?: string;
  fixAction?: string;
}

export type ChallengeScenario = Scenario;

export interface LearnArticle {
  id: string;
  title: string;
  icon: string;
  summary: string;
  analogy: string;
  plainExplanation: string;
  howProtectionWorks: string;
  keyTakeaways: string[];
}
