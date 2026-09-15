import React from "react";
import { TECHNICAL_HELP } from "../../data/simulationData";
import { Info, X, ShieldAlert } from "lucide-react";

interface InfoModalProps {
  topicKey: string | null;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ topicKey, onClose }) => {
  if (!topicKey) return null;

  const info = TECHNICAL_HELP[topicKey] || {
    title: "Simulation Parameter",
    explanation: "This parameter models electrical properties inside the household branch distribution system.",
    realWorldNote: "Simulated parameter for learning only. Do not apply to real wiring.",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">What is this?</span>
            <h3 className="text-lg font-bold text-slate-900">{info.title}</h3>
          </div>
        </div>

        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-slate-700">
            {info.explanation}
          </p>

          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">Educational Simulation Note</strong>
              <p>{info.realWorldNote}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
