"use client";

import React from "react";
import { ShieldCheck, Terminal } from "lucide-react";
import { OllamaStatusResponse } from "@/lib/types";

interface HeaderProps {
  ollamaStatus: OllamaStatusResponse | null;
  loadingStatus: boolean;
  onOpenOllamaModal: () => void;
}

export function Header({
  ollamaStatus,
  loadingStatus,
  onOpenOllamaModal,
}: HeaderProps) {
  const isOnline = ollamaStatus?.online;
  const isModelReady = ollamaStatus?.targetModelInstalled;

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                SponsorProof
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Gemma 3
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Evidence-Based Brief vs Script Verification
            </p>
          </div>
        </div>

        {/* Right: Ollama Diagnostics Pill & Instructions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenOllamaModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer shadow-sm hover:bg-slate-850"
            title="Click to view Ollama connection status and setup guide"
          >
            {loadingStatus ? (
              <>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-ping" />
                <span className="text-slate-400">Checking Ollama...</span>
              </>
            ) : isOnline && isModelReady ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                <span className="text-emerald-300 font-semibold">
                  Ollama Online: {ollamaStatus?.targetModel}
                </span>
              </>
            ) : isOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]" />
                <span className="text-amber-300 font-semibold">
                  Ollama Ready (Need {ollamaStatus?.targetModel})
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e]" />
                <span className="text-rose-300 font-semibold">
                  Ollama Offline (Click for Setup)
                </span>
              </>
            )}
          </button>

          <button
            onClick={onOpenOllamaModal}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-750 border border-slate-700 transition-colors cursor-pointer"
          >
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Setup</span> Guide
          </button>
        </div>
      </div>
    </header>
  );
}
