export type TerminalId =
  | "mains_live"
  | "mains_neutral"
  | "mains_earth"
  | "breaker_in"
  | "breaker_out"
  | "switch_in"
  | "switch_out"
  | "load1_in"
  | "load1_out"
  | "load2_in"
  | "load2_out"
  | "chassis_tap"
  | "chassis_earth"
  | "earth_rod";

export interface Terminal {
  id: TerminalId;
  label: string;
  type: "live" | "neutral" | "earth" | "load" | "switch" | "breaker";
  x: number; // percentage (0 - 100) on canvas
  y: number; // percentage (0 - 100) on canvas
  componentName: string;
}

export type WireDegradation = "optimal" | "aged" | "severely_degraded";

export interface CircuitWire {
  id: string;
  from: TerminalId;
  to: TerminalId;
  color: "live" | "neutral" | "earth" | "fault";
  gauge?: number; // AWG: 14, 12, 10
  degradation?: WireDegradation;
}

export interface WireSegmentPhysics {
  wireId: string;
  from: TerminalId;
  to: TerminalId;
  fromLabel: string;
  toLabel: string;
  componentFrom: string;
  componentTo: string;
  colorType: "live" | "neutral" | "earth" | "fault";
  currentAmps: number;
  gauge: number; // AWG
  ampacityRating: number; // Safe continuous current (A)
  loadPercentage: number; // % of safe ampacity
  degradation: WireDegradation;
  resistanceOhms: number;
  temperatureC: number;
  jouleHeatWatts: number;
  displayThickness: number; // Stroke width (px)
  strokeColor: string; // Dynamic hex color
  glowColor: string; // Dynamic glow color
  statusText: string;
  statusBadge: "safe" | "warm" | "overloaded" | "degraded" | "short_fault" | "shock_hazard" | "idle";
}

export type CircuitCondition =
  | "normal"
  | "overload"
  | "short_circuit"
  | "earth_leakage"
  | "broken_earth"
  | "degraded_wire"
  | "arc_fault";

export interface CircuitPhysicsState {
  nominalVoltage: number; // 230 or 120
  breakerRating: number; // 10, 16, 20, 32
  breakerState: "closed" | "tripped";
  breakerType: "mcb" | "fuse" | "rccb";
  hasRccb: boolean;
  rccbState: "closed" | "tripped";
  switchState: "on" | "off";
  activeCondition: CircuitCondition;
  wireGauge: number; // AWG e.g. 14, 12, 10
  wireResistance: number; // Ohms
  earthResistance: number; // Ohms
  
  // Real-time computed physics
  circuitClosed: boolean;
  loopResistance: number; // Ohms
  currentAmps: number;
  voltageEffective: number;
  powerWatts: number;
  wireTemperature: number; // Celsius
  earthLeakageAmps: number; // Amps
  chassisTouchVoltage: number; // Volts
  isArcing: boolean;
  hazardStatus: "SAFE" | "WARNING" | "CRITICAL";
  hazardTitle: string;
}

export interface AiActionPlan {
  hazardLevel: "SAFE" | "WARNING" | "CRITICAL";
  detectedCondition: string;
  physicsCause: string;
  whatAiDoes: {
    title: string;
    description: string;
    speed: string; // e.g. "Instantaneous (< 15ms)" or "Continuous"
  }[];
  aiRecommendedFix: string;
  canAutoFix: boolean;
}
