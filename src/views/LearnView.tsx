import React, { useState } from "react";
import { LEARN_ARTICLES } from "../data/simulationData";
import { BookOpen, Search, ShieldAlert, Sparkles, CheckCircle2, ChevronRight } from "lucide-react";

export const LearnView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArticleId, setSelectedArticleId] = useState<string>(LEARN_ARTICLES[0].id);

  const filteredArticles = LEARN_ARTICLES.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.analogy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.plainExplanation.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedArticle =
    LEARN_ARTICLES.find((a) => a.id === selectedArticleId) || LEARN_ARTICLES[0];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* View Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <span>Electrical Safety Fundamentals & Visual Principles</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Clear, plain-language engineering analogies explaining voltage, current, grounding, and protection devices.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search concepts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-blue-500"
          />
        </div>
      </div>

      {/* Two-column layout: Article Navigation on left, Full Interactive Article on right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left: Article Index list */}
        <div className="md:col-span-4 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-slate-400 block px-1">
            Learning Modules ({filteredArticles.length})
          </span>
          <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredArticles.map((art) => {
              const isSelected = art.id === selectedArticle.id;
              return (
                <button
                  key={art.id}
                  onClick={() => setSelectedArticleId(art.id)}
                  className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="text-xs font-bold leading-tight line-clamp-1">{art.title}</span>
                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${isSelected ? "text-white" : "text-slate-400"}`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Article Content */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">
              Electrical Science Concept
            </span>
            <h2 className="text-xl font-extrabold text-slate-900">{selectedArticle.title}</h2>
          </div>

          {/* Everyday Analogy Callout */}
          <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs mb-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Beginner Analogy: Water & Physical Systems</span>
            </div>
            <p className="text-xs text-blue-950 leading-relaxed font-medium">
              "{selectedArticle.analogy}"
            </p>
          </div>

          {/* Plain Language Explanation */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              How It Works:
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {selectedArticle.plainExplanation}
            </p>
          </div>

          {/* How Automatic Protection Intervenes */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Safety Protection Role:
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-200/80">
              {selectedArticle.howProtectionWorks}
            </p>
          </div>

          {/* Key Takeaways */}
          <div>
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Key Takeaways:
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedArticle.keyTakeaways.map((point, i) => (
                <div
                  key={i}
                  className="p-3 rounded-lg border border-slate-200 bg-white flex items-start space-x-2 text-xs text-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{point}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Simulation Disclaimer Footer */}
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Educational Learning Notice</strong>
              <p className="mt-0.5 text-amber-800 text-[11px] leading-relaxed">
                SafeCircuit explains concepts theoretically to promote safety literacy. Never attempt DIY repairs on real residential circuits. Always consult a licensed electrical professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
