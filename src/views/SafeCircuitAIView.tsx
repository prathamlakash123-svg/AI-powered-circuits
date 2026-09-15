import React, { useState } from "react";
import { useSimulation } from "../context/SimulationContext";
import { DiagnosticIssue } from "../types/simulation";
import { NavTab } from "../components/layout/Sidebar";
import { DiagnosticMapView } from "./DiagnosticMapView";
import {
  Bot,
  AlertTriangle,
  AlertOctagon,
  ShieldCheck,
  CheckCircle2,
  Wrench,
  HelpCircle,
  MapPin,
  Sparkles,
  Loader2,
  X,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";

interface SafeCircuitAIViewProps {
  onNavigate: (tab: NavTab) => void;
}

export const SafeCircuitAIView: React.FC<SafeCircuitAIViewProps> = ({ onNavigate }) => {
  const {
    diagnosticIssues,
    metrics,
    applySimulatedFix,
    selectedFaultCircuitId,
    setSelectedFaultCircuitId,
    requestAiExplanation,
  } = useSimulation();

  const [explainingIssueId, setExplainingIssueId] = useState<string | null>(null);
  const [aiExplanationModal, setAiExplanationModal] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState<boolean>(false);
  const [activeSelectedIssue, setActiveSelectedIssue] = useState<DiagnosticIssue | null>(
    diagnosticIssues[0] || null
  );

  const handleExplainFurther = async (issue: DiagnosticIssue) => {
    setExplainingIssueId(issue.id);
    setLoadingExplanation(true);
    try {
      const explanation = await requestAiExplanation(issue);
      setAiExplanationModal({
        title: issue.title,
        text: explanation,
      });
    } catch (err) {
      setAiExplanationModal({
        title: issue.title,
        text: "SafeCircuit AI explains: " + issue.why + " " + issue.prevention,
      });
    } finally {
      setLoadingExplanation(false);
      setExplainingIssueId(null);
    }
  };

  const handleShowFaultLocation = (issue: DiagnosticIssue) => {
    if (issue.circuitId) {
      setSelectedFaultCircuitId(issue.circuitId);
    }
    setActiveSelectedIssue(issue);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top AI Monitoring Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
            <Bot className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-lg font-bold tracking-tight">SafeCircuit AI Diagnostic Engine</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>Active Telemetry Monitor</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Analyzing branch load signatures, thermal heating equations, and ground loop continuity in real time.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700">
          <span className="text-slate-400">Diagnosis State:</span>
          {diagnosticIssues.length === 0 ? (
            <span className="text-emerald-400 font-bold flex items-center space-x-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero Anomalies Detected</span>
            </span>
          ) : (
            <span className="text-amber-400 font-bold flex items-center space-x-1">
              <AlertTriangle className="w-4 h-4" />
              <span>{diagnosticIssues.length} Active Anomaly</span>
            </span>
          )}
        </div>
      </div>

      {/* Real-Time Diagnostic Map */}
      <DiagnosticMapView highlightIssue={activeSelectedIssue} />

      {/* Active Diagnostics Issues List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Detected Electrical Anomalies ({diagnosticIssues.length})
          </h4>
          <span className="text-xs text-slate-500">
            Click "Apply Simulated Fix" to test safety remediation
          </span>
        </div>

        {diagnosticIssues.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center text-emerald-900 shadow-xs">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3 text-emerald-600">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold">Simulated System Operating Safely</h4>
            <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1 leading-relaxed">
              Branch currents are within conductor ampacities, grounding resistance is low, and protection devices are armed.
            </p>
            <button
              onClick={() => onNavigate("physics_circuit")}
              className="mt-4 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer"
            >
              <span>Explore Physics Circuit</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {diagnosticIssues.map((issue) => {
              const isCritical = issue.severity === "CRITICAL";

              return (
                <div
                  key={issue.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                    isCritical
                      ? "border-red-300 ring-1 ring-red-400/20"
                      : "border-amber-300 ring-1 ring-amber-400/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-xl mt-0.5 ${
                          isCritical ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {isCritical ? (
                          <AlertOctagon className="w-5 h-5" />
                        ) : (
                          <AlertTriangle className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                              isCritical
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : "bg-amber-100 text-amber-800 border border-amber-200"
                            }`}
                          >
                            {issue.severity} RISK
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {issue.type.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">{issue.title}</h4>
                      </div>
                    </div>

                    {/* Location Badge */}
                    <button
                      onClick={() => handleShowFaultLocation(issue)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium cursor-pointer transition-colors"
                    >
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span>Highlight Path</span>
                    </button>
                  </div>

                  {/* 4-Part Diagnostic Explanation Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-4 text-xs">
                    {/* Why it is dangerous */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-700 block mb-1">
                        1. Why It Is Dangerous:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{issue.why}</p>
                    </div>

                    {/* What the simulation detected */}
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                      <span className="font-bold text-slate-700 block mb-1">
                        2. Simulation Detection:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{issue.detected}</p>
                    </div>

                    {/* How automatic protection helps */}
                    <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80">
                      <span className="font-bold text-blue-900 block mb-1">
                        3. Protection Action:
                      </span>
                      <p className="text-blue-800 leading-relaxed">{issue.prevention}</p>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      {/* Explain Further (Gemini AI API) */}
                      <button
                        onClick={() => handleExplainFurther(issue)}
                        disabled={loadingExplanation && explainingIssueId === issue.id}
                        className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {loadingExplanation && explainingIssueId === issue.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>AI Deep Explanation</span>
                      </button>
                    </div>

                    {/* Apply Simulated Fix */}
                    <button
                      onClick={() => applySimulatedFix(issue.fixAction)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Apply Simulated Fix & Re-run</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Gemini AI Deep Explanation Dialog */}
      {aiExplanationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden p-6 relative">
            <button
              onClick={() => setAiExplanationModal(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                  SafeCircuit AI Educational Tutor
                </span>
                <h3 className="text-base font-bold text-slate-900">{aiExplanationModal.title}</h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed max-h-80 overflow-y-auto whitespace-pre-line">
              {aiExplanationModal.text}
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>
                <strong>Educational Simulation Only:</strong> This diagnostic explanation is generated for conceptual physics and safety education. Do not perform physical work on live electrical equipment.
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setAiExplanationModal(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Explanation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
