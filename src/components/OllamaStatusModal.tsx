"use client";

import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  RefreshCw,
  Server,
  Cpu,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react";
import { OllamaStatusResponse } from "@/lib/types";

interface OllamaStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: OllamaStatusResponse | null;
  onRefresh: () => Promise<void>;
  isRefreshing: boolean;
}

export function OllamaStatusModal({
  isOpen,
  onClose,
  status,
  onRefresh,
  isRefreshing,
}: OllamaStatusModalProps) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isOnline = status?.online;
  const isModelReady = status?.targetModelInstalled;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-slate-100">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">
              Ollama & Gemma 3 Integration
            </h3>
            <p className="text-xs text-slate-400">
              Server-side local LLM connection status & commands
            </p>
          </div>
        </div>

        {/* Current Connection Diagnostic Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-indigo-400" />
              Ollama Base URL:
            </span>
            <code className="text-indigo-300 font-mono bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
              {status?.baseUrl || "http://127.0.0.1:11434"}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              Required Model:
            </span>
            <code className="text-purple-300 font-mono bg-purple-950/50 px-2 py-0.5 rounded border border-purple-800/40">
              {status?.targetModel || "gemma3:1b"}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
            <span className="text-slate-400 font-medium">Connection State:</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Online & Reachable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-rose-400 font-bold">
                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                Offline / Unreachable
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Model Installed:</span>
            {isModelReady ? (
              <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                {status?.targetModel} is ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-bold">
                <XCircle className="w-3.5 h-3.5 text-amber-400" />
                Not installed yet
              </span>
            )}
          </div>

          {status?.installedModels && status.installedModels.length > 0 && (
            <div className="text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 block mb-1">Installed Models:</span>
              <div className="flex flex-wrap gap-1.5">
                {status.installedModels.map((m) => (
                  <span
                    key={m}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900 text-slate-300 border border-slate-800"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Step-by-Step Setup Guide */}
        <div className="space-y-3 mb-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Terminal Setup
          </h4>

          {/* Step 1 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">
                1. Start the Ollama Service
              </p>
              <code className="text-xs font-mono text-indigo-400">
                ollama serve
              </code>
            </div>
            <button
              onClick={() => copyToClipboard("ollama serve", 1)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy command"
            >
              {copiedIndex === 1 ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold text-slate-200">
                2. Pull & Run {status?.targetModel || "gemma3:1b"}
              </p>
              <code className="text-xs font-mono text-purple-400">
                ollama run {status?.targetModel || "gemma3:1b"}
              </code>
            </div>
            <button
              onClick={() => copyToClipboard(`ollama run ${status?.targetModel || "gemma3:1b"}`, 2)}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Copy command"
            >
              {copiedIndex === 2 ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <a
            href="https://ollama.com/download"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            Download Ollama
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
              />
              {isRefreshing ? "Testing..." : "Test Connection"}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
