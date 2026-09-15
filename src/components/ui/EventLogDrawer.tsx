import React, { useState } from "react";
import { SimulationEvent } from "../../types/simulation";
import { History, ChevronDown, ChevronUp, AlertTriangle, Zap, CheckCircle2, Info, X } from "lucide-react";

interface EventLogDrawerProps {
  events: SimulationEvent[];
  isOpenDefault?: boolean;
}

export const EventLogDrawer: React.FC<EventLogDrawerProps> = ({
  events,
  isOpenDefault = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(isOpenDefault);
  const [selectedEvent, setSelectedEvent] = useState<SimulationEvent | null>(null);

  const getEventIcon = (type: SimulationEvent["type"]) => {
    switch (type) {
      case "trip":
        return <Zap className="w-3.5 h-3.5 text-red-600 shrink-0" />;
      case "warning":
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />;
      case "fix":
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
      case "scenario":
        return <Info className="w-3.5 h-3.5 text-purple-600 shrink-0" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />;
    }
  };

  return (
    <>
      <div
        id="collapsible-event-log"
        className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden transition-all duration-200"
      >
        {/* Toggle Bar */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors border-b border-slate-200/80 cursor-pointer text-left"
          aria-expanded={isOpen}
        >
          <div className="flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-semibold text-slate-800">Simulated Event Log</span>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700">
              {events.length}
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <span>{isOpen ? "Collapse" : "Expand"}</span>
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Content */}
        {isOpen && (
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
            {events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className="flex items-start justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors group text-xs"
              >
                <div className="flex items-start space-x-2">
                  <div className="mt-0.5">{getEventIcon(ev.type)}</div>
                  <div>
                    <span className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                      {ev.title}
                    </span>
                    <p className="text-slate-500 mt-0.5 line-clamp-1">{ev.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3 shrink-0">
                  <span className="font-mono text-[11px] text-slate-400">{ev.timestamp}</span>
                  <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    Explain
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Explanation Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden p-6 relative">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2 mb-3">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                {selectedEvent.timestamp}
              </span>
              <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
                {selectedEvent.type} event
              </span>
            </div>

            <h3 className="text-base font-bold text-slate-900 mb-2">{selectedEvent.title}</h3>
            <p className="text-sm text-slate-600 mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200/80">
              {selectedEvent.description}
            </p>

            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 text-xs text-blue-900 space-y-1">
              <strong className="font-semibold block text-blue-950">Educational Explanation</strong>
              <p className="leading-relaxed">
                {selectedEvent.educationalExplanation ||
                  "This event occurred as a result of simulated circuit dynamics (voltage, current, or protection switch behavior)."}
              </p>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
