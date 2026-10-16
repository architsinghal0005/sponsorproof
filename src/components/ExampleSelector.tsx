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
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#252A32] border border-[#E5E0D8] hover:border-[#D1CBC0] transition-all cursor-pointer shadow-xs active:scale-[0.98]"
      >
        <FolderOpen className="w-3.5 h-3.5 text-[#EA6A50]" />
        <span>Load Example Campaign</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#74736F] transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Select Example Campaign"
          className="absolute right-0 mt-2 w-[calc(100vw-2.5rem)] sm:w-96 max-w-sm sm:max-w-md max-h-[60vh] overflow-y-auto rounded-2xl bg-white border border-[#E5E0D8] shadow-xl p-3 z-50 overscroll-contain"
        >
          <div className="sticky -top-3 -mx-3 px-3 py-2 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] mb-2 flex items-center justify-between z-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#74736F]">
              Select Campaign Brief
            </span>
            <span className="text-[10px] text-[#74736F] font-mono">
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
                      ? "bg-[#FAF8F5] border border-[#EA6A50]/40 text-[#252A32] shadow-xs"
                      : "hover:bg-[#F5F2EC] text-[#74736F] hover:text-[#252A32] border border-transparent"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold flex items-center gap-1.5 text-[#252A32]">
                      {isCurrent && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#EA6A50]" />
                      )}
                      {ex.brand}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F5F2EC] text-[#74736F] font-medium border border-[#E5E0D8]">
                      {ex.category}
                    </span>
                  </div>
                  <span className="text-[11px] text-[#74736F] truncate">
                    {ex.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Draft Choice for Selected Campaign */}
          <div className="sticky -bottom-3 -mx-3 px-3 py-2.5 bg-white/95 backdrop-blur-md border-t border-[#E5E0D8] z-10">
            <div className="text-[11px] font-bold text-[#252A32] mb-2">
              Choose Test Content for <span className="text-[#EA6A50] font-semibold">{selectedCampaign.brand}</span>:
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleLoadDraft(true)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#EDF5F2] hover:bg-[#E2F0EA] border border-[#C2DFD4] text-left transition-all cursor-pointer group active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#347C68] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#347C68]">
                    Compliant Draft
                  </div>
                  <div className="text-[10px] text-[#347C68]/80 leading-tight">
                    Fulfills brief (Pass)
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleLoadDraft(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-[#FDF2F0] hover:bg-[#FBE6E3] border border-[#F5C7C0] text-left transition-all cursor-pointer group active:scale-[0.98]"
              >
                <AlertTriangle className="w-4 h-4 text-[#C53929] shrink-0" />
                <div>
                  <div className="text-xs font-bold text-[#C53929]">
                    Flawed Draft
                  </div>
                  <div className="text-[10px] text-[#C53929]/80 leading-tight">
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
