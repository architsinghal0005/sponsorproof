"use client";

import React from "react";
import {
  FileCheck2,
  Terminal,
  Share2,
  FileText,
  BarChart3,
  Sparkles,
  Zap,
  ShieldAlert,
} from "lucide-react";
import { OllamaStatusResponse } from "@/lib/types";

interface HeaderProps {
  ollamaStatus: OllamaStatusResponse | null;
  loadingStatus: boolean;
  onOpenOllamaModal: () => void;
  campaignName: string;
  deliverableType: string;
  hasReport: boolean;
  onOpenExportModal: () => void;
  onScrollToReport: () => void;
  onScrollToEditor: () => void;
  isAnalyzing?: boolean;
  analysisMode?: "ollama" | "deterministic_fallback" | null;
  lastErrorType?: string | null;
}

export function Header({
  ollamaStatus,
  loadingStatus,
  onOpenOllamaModal,
  campaignName,
  deliverableType,
  hasReport,
  onOpenExportModal,
  onScrollToReport,
  onScrollToEditor,
  isAnalyzing = false,
  analysisMode = null,
  lastErrorType = null,
}: HeaderProps) {
  const isOnline = ollamaStatus?.online;
  const isModelReady = ollamaStatus?.targetModelInstalled;

  const formatDeliverable = (type: string) => {
    return type
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  // Compute status button label and color
  let statusBadgeText = `Ollama: ${ollamaStatus?.targetModel || "gemma3:1b"}`;
  let statusBadgeColor = "text-[#347C68]";
  let statusDotColor = "bg-[#347C68]";

  if (loadingStatus) {
    statusBadgeText = "Connecting...";
    statusBadgeColor = "text-[#74736F]";
    statusDotColor = "bg-[#74736F] animate-ping";
  } else if (isAnalyzing) {
    statusBadgeText = "Gemma 3 Analyzing...";
    statusBadgeColor = "text-[#B45309]";
    statusDotColor = "bg-[#B45309] animate-pulse";
  } else if (lastErrorType) {
    statusBadgeText =
      lastErrorType === "TIMEOUT"
        ? "Inference Timed Out"
        : lastErrorType === "MODEL_NOT_FOUND"
        ? "Model Not Found"
        : "Ollama Error";
    statusBadgeColor = "text-[#C53929]";
    statusDotColor = "bg-[#C53929]";
  } else if (!isOnline) {
    statusBadgeText = "Ollama Offline";
    statusBadgeColor = "text-[#C53929]";
    statusDotColor = "bg-[#C53929]";
  } else if (!isModelReady) {
    statusBadgeText = `Need ${ollamaStatus?.targetModel || "gemma3:1b"}`;
    statusBadgeColor = "text-[#B45309]";
    statusDotColor = "bg-[#B45309]";
  }

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#E5E0D8] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-3 flex flex-wrap items-center justify-between gap-4">
          {/* Brand Identity */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#252A32] text-[#F5F2EC] flex items-center justify-center shadow-xs">
              <FileCheck2 className="w-5 h-5 text-[#EA6A50]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-[#252A32]">
                  SponsorProof
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#73536D]/10 text-[#73536D] border border-[#73536D]/20">
                  Creator Studio
                </span>
              </div>
              <p className="text-[11px] font-medium text-[#74736F] hidden sm:block">
                Every deliverable. Every requirement. Ready for review.
              </p>
            </div>
          </div>

          {/* Context pill & Navigation Tabs */}
          <div className="flex items-center gap-2">
            <nav className="hidden md:flex items-center gap-1 bg-[#F5F2EC] p-1 rounded-xl border border-[#E5E0D8]">
              <button
                onClick={onScrollToEditor}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#252A32] hover:bg-white transition-all cursor-pointer shadow-xs"
              >
                <FileText className="w-3.5 h-3.5 text-[#EA6A50]" />
                Campaign Review
              </button>

              <button
                onClick={onScrollToReport}
                disabled={!hasReport}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  hasReport
                    ? "text-[#252A32] hover:bg-white shadow-xs"
                    : "text-[#74736F]/60 cursor-not-allowed"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5 text-[#347C68]" />
                Current Audit
              </button>

              {hasReport && (
                <button
                  onClick={onOpenExportModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#252A32] hover:bg-white transition-all cursor-pointer shadow-xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#73536D]" />
                  Export Report
                </button>
              )}
            </nav>

            {/* AI Model Status Indicator */}
            <button
              onClick={onOpenOllamaModal}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#FAF8F5] border border-[#E5E0D8] hover:border-[#D1CBC0] hover:bg-white text-[#252A32] transition-all cursor-pointer shadow-xs"
              title="Click to check Ollama & Gemma connection diagnostics"
            >
              <span className={`w-2 h-2 rounded-full ${statusDotColor}`} />
              <span className={`font-semibold text-[11px] ${statusBadgeColor}`}>
                {statusBadgeText}
              </span>
            </button>

            {/* Setup Guide Button */}
            <button
              onClick={onOpenOllamaModal}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-[#E5E0D8] hover:border-[#252A32] text-[#252A32] transition-colors cursor-pointer shadow-xs"
            >
              <Terminal className="w-3.5 h-3.5 text-[#74736F]" />
              <span className="hidden sm:inline">Setup</span>
            </button>
          </div>
        </div>

        {/* Sub-bar showing active campaign context and honest engine state */}
        <div className="py-2 border-t border-[#E5E0D8]/60 flex items-center justify-between text-xs text-[#74736F]">
          <div className="flex items-center gap-2 truncate">
            <span className="font-medium text-[#252A32] truncate">
              {campaignName}
            </span>
            <span>•</span>
            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] text-[10px] font-semibold text-[#73536D] uppercase">
              {formatDeliverable(deliverableType)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px]">
            {isAnalyzing ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#B45309] animate-pulse" />
                <span className="text-[#B45309] font-semibold">
                  AI Analysis In Progress
                </span>
              </>
            ) : lastErrorType ? (
              <>
                <ShieldAlert className="w-3.5 h-3.5 text-[#C53929]" />
                <span className="text-[#C53929] font-semibold">
                  {lastErrorType === "TIMEOUT"
                    ? "AI Timed Out (Run Deterministic Audit)"
                    : "AI Analysis Failed (Ollama Unreachable)"}
                </span>
              </>
            ) : hasReport && analysisMode === "ollama" ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#347C68]" />
                <span className="hidden sm:inline text-[#252A32] font-medium">
                  Dual-Engine Verification:
                </span>
                <span className="text-[#347C68] font-semibold">
                  Verified with Gemma 3
                </span>
              </>
            ) : hasReport && analysisMode === "deterministic_fallback" ? (
              <>
                <Zap className="w-3.5 h-3.5 text-[#B45309]" />
                <span className="hidden sm:inline text-[#252A32] font-medium">
                  Rule Audit:
                </span>
                <span className="text-[#B45309] font-semibold">
                  Deterministic Only (No AI)
                </span>
              </>
            ) : isOnline && isModelReady ? (
              <>
                <Sparkles className="w-3.5 h-3.5 text-[#EA6A50]" />
                <span className="hidden sm:inline text-[#74736F]">
                  Dual-Engine Ready:
                </span>
                <span className="text-[#347C68] font-semibold">
                  Gemma 3:1b + Rules
                </span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 text-[#74736F]" />
                <span className="hidden sm:inline text-[#74736F]">Engine:</span>
                <span className="text-[#74736F] font-semibold">
                  Deterministic Rules Ready
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
