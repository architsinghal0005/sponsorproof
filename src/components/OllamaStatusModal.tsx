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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden text-[#252A32]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#74736F] hover:text-[#252A32] p-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#E5E0D8] flex items-center justify-center text-[#EA6A50]">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-[#252A32]">
              Ollama & Gemma 3 Diagnostics
            </h3>
            <p className="text-xs text-[#74736F]">
              Local open-weight LLM connection & status
            </p>
          </div>
        </div>

        {/* Current Connection Diagnostic Card */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-4 mb-5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#74736F] flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-[#73536D]" />
              Ollama Base URL:
            </span>
            <code className="text-[#252A32] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E0D8]">
              {status?.baseUrl || "http://127.0.0.1:11434"}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-[#74736F] flex items-center gap-1.5 font-medium">
              <Cpu className="w-3.5 h-3.5 text-[#EA6A50]" />
              Configured Model:
            </span>
            <code className="text-[#252A32] font-mono bg-white px-2 py-0.5 rounded border border-[#E5E0D8]">
              {status?.targetModel || "gemma3:1b"}
            </code>
          </div>

          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-[#E5E0D8]">
            <span className="text-[#74736F] font-medium">Connection State:</span>
            {isOnline ? (
              <span className="inline-flex items-center gap-1 text-[#347C68] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#347C68]" />
                Online & Reachable
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[#C53929] font-bold">
                <XCircle className="w-3.5 h-3.5 text-[#C53929]" />
                Unreachable
              </span>
            )}
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-[#E5E0D8]">
            <span className="text-[#74736F] font-medium">Model Installed:</span>
            {isModelReady ? (
              <span className="inline-flex items-center gap-1 text-[#347C68] font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#347C68]" />
                {status?.targetModel} Pulled & Ready
              </span>
            ) : isOnline ? (
              <span className="inline-flex items-center gap-1 text-[#B45309] font-bold">
                <XCircle className="w-3.5 h-3.5 text-[#B45309]" />
                Model Not Downloaded
              </span>
            ) : (
              <span className="text-[#74736F]">Awaiting Server</span>
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="space-y-3 mb-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#74736F]">
            Quick Setup Commands (Windows PowerShell / Terminal)
          </h4>

          {/* Step 1 */}
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-[#74736F] block text-[10px]">1. Start the daemon</span>
              <code className="text-[#252A32] font-mono font-semibold">ollama serve</code>
            </div>
            <button
              onClick={() => copyToClipboard("ollama serve", 1)}
              className="p-1.5 rounded-lg bg-white border border-[#E5E0D8] hover:border-[#D1CBC0] text-[#74736F] hover:text-[#252A32] transition-colors cursor-pointer"
            >
              {copiedIndex === 1 ? <Check className="w-3.5 h-3.5 text-[#347C68]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Step 2 */}
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-[#74736F] block text-[10px]">2. Pull Gemma 3</span>
              <code className="text-[#252A32] font-mono font-semibold">
                ollama run {status?.targetModel || "gemma3:1b"}
              </code>
            </div>
            <button
              onClick={() =>
                copyToClipboard(
                  `ollama run ${status?.targetModel || "gemma3:1b"}`,
                  2
                )
              }
              className="p-1.5 rounded-lg bg-white border border-[#E5E0D8] hover:border-[#D1CBC0] text-[#74736F] hover:text-[#252A32] transition-colors cursor-pointer"
            >
              {copiedIndex === 2 ? <Check className="w-3.5 h-3.5 text-[#347C68]" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Installed Models List */}
        {status?.installedModels && status.installedModels.length > 0 && (
          <div className="mb-5 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 text-xs">
            <span className="font-bold text-[#74736F] text-[10px] uppercase block mb-1.5">
              Locally Installed Models:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {status.installedModels.map((m, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded bg-white border border-[#E5E0D8] text-[#252A32] font-mono text-[11px]"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-[#E5E0D8]">
          <a
            href="https://ollama.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#73536D] hover:text-[#252A32] font-medium"
          >
            <span>Ollama Documentation</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#EA6A50] hover:bg-[#D8583E] text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Checking..." : "Re-test Connection"}
          </button>
        </div>
      </div>
    </div>
  );
}
