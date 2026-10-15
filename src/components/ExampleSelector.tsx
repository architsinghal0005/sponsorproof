"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FolderOpen,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { CAMPAIGN_EXAMPLES, CampaignExample } from "@/lib/examples";
import { DeliverableType } from "@/lib/types";

interface ExampleSelectorProps {
  onSelectExample: (
    brief: string,
    content: string,
    deliverableType: DeliverableType,
    campaignName: string
  ) => void;
}

export function ExampleSelector({ onSelectExample }: ExampleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignExample>(
    CAMPAIGN_EXAMPLES[0]
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleLoadDraft = (isPassing: boolean) => {
    const draft = isPassing
      ? selectedCampaign.passingScript
      : selectedCampaign.flawedScript;

    onSelectExample(
      selectedCampaign.brief,
      draft.content,
      selectedCampaign.deliverableType,
      selectedCampaign.name
    );
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-600/20 to-purple-600/20 hover:from-indigo-600/30 hover:to-purple-600/30 text-indigo-200 border border-indigo-500/30 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
      >
        <FolderOpen className="w-4 h-4 text-indigo-400" />
        <span>Load Example Campaign</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Select Example Campaign"
          className="absolute right-0 mt-2 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm sm:max-w-md max-h-[60vh] overflow-y-auto rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/90 shadow-2xl p-3 z-50 overscroll-contain animate-in fade-in zoom-in-95 duration-150"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#475569 transparent" }}
        >
          <div className="sticky -top-3 -mx-3 px-3 py-2 bg-slate-900/95 backdrop-blur-md border-b border-slate-800/80 mb-2 flex items-center justify-between z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Select Campaign Brief
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {CAMPAIGN_EXAMPLES.length} Options
            </span>
          </div>

          <div className="space-y-1.5 mb-3">
            {CAMPAIGN_EXAMPLES.map((ex) => {
              const isCurrent = ex.id === selectedCampaign.id;
              return (
                <button
                  type="button"
                  key={ex.id}
                  onClick={() => setSelectedCampaign(ex)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs transition-all cursor-pointer flex flex-col gap-0.5 ${
                    isCurrent
                      ? "bg-indigo-600/25 border border-indigo-500/50 text-white shadow-inner"
                      : "hover:bg-slate-800/80 text-slate-300 border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5">
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                      )}
                      {ex.brand}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium border border-slate-700/50">
                      {ex.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate">
                    {ex.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Draft Choice for Selected Campaign */}
          <div className="sticky -bottom-3 -mx-3 px-3 py-2.5 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 z-10">
            <div className="text-[11px] font-bold text-slate-300 mb-2">
              Choose Test Content for <span className="text-indigo-400 font-semibold">{selectedCampaign.brand}</span>:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLoadDraft(true)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-800/60 hover:border-emerald-600 text-left transition-all cursor-pointer group active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-emerald-300">
                    Compliant Draft
                  </div>
                  <div className="text-[10px] text-emerald-400/80 leading-tight">
                    Fulfills brief (Pass)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadDraft(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/60 hover:border-rose-600 text-left transition-all cursor-pointer group active:scale-[0.98]"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 group-hover:scale-110 transition-transform" />
                <div>
                  <div className="text-xs font-bold text-rose-300">
                    Flawed Draft
                  </div>
                  <div className="text-[10px] text-rose-400/80 leading-tight">
                    Shows missing codes
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
