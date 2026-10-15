"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { ExampleSelector } from "@/components/ExampleSelector";
import { AnalysisReport } from "@/components/AnalysisReport";
import { OllamaStatusModal } from "@/components/OllamaStatusModal";
import { ExportModal } from "@/components/ExportModal";
import {
  CampaignReport,
  DeliverableType,
  OllamaStatusResponse,
} from "@/lib/types";
import { CAMPAIGN_EXAMPLES } from "@/lib/examples";
import {
  Sparkles,
  Zap,
  RotateCcw,
  FileText,
  Video,
  Clock,
  Terminal,
  ShieldAlert,
} from "lucide-react";

export default function HomePage() {
  const [campaignName, setCampaignName] = useState(
    "NordShield VPN - YouTube Integration"
  );
  const [deliverableType, setDeliverableType] =
    useState<DeliverableType>("YOUTUBE_INTEGRATION");

  // Pre-load default example for immediate instant usability
  const [brief, setBrief] = useState(CAMPAIGN_EXAMPLES[0].brief);
  const [content, setContent] = useState(
    CAMPAIGN_EXAMPLES[0].flawedScript.content
  );

  const [report, setReport] = useState<CampaignReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(
    null
  );
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const [errorBanner, setErrorBanner] = useState<{
    message: string;
    type?: string;
    helpInstructions?: string[];
  } | null>(null);

  // Fetch Ollama connection status
  const fetchOllamaStatus = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch("/api/ollama-status");
      const data = await res.json();
      setOllamaStatus(data);
    } catch {
      setOllamaStatus({
        online: false,
        baseUrl: "http://127.0.0.1:11434",
        targetModel: "gemma3:1b",
        targetModelInstalled: false,
        installedModels: [],
        error: "Failed to query /api/ollama-status",
      });
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetch("/api/ollama-status")
      .then((res) => res.json())
      .then((data) => {
        if (active) {
          setOllamaStatus(data);
          setLoadingStatus(false);
        }
      })
      .catch(() => {
        if (active) {
          setOllamaStatus({
            online: false,
            baseUrl: "http://127.0.0.1:11434",
            targetModel: "gemma3:1b",
            targetModelInstalled: false,
            installedModels: [],
            error: "Failed to query /api/ollama-status",
          });
          setLoadingStatus(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleSelectExample = (
    exBrief: string,
    exContent: string,
    exDeliverable: DeliverableType,
    exName: string
  ) => {
    setBrief(exBrief);
    setContent(exContent);
    setDeliverableType(exDeliverable);
    setCampaignName(exName);
    setErrorBanner(null);
  };

  const handleClear = () => {
    setBrief("");
    setContent("");
    setReport(null);
    setErrorBanner(null);
  };

  const runAnalysis = async (mode: "auto" | "deterministic") => {
    if (!brief.trim() || !content.trim()) {
      setErrorBanner({
        message: "Please provide both the Brand Brief and Content Draft text.",
      });
      return;
    }

    setIsAnalyzing(true);
    setErrorBanner(null);

    if (mode === "deterministic") {
      setAnalysisStep("Running deterministic rule audit...");
    } else {
      setAnalysisStep("Extracting deterministic markers & exact codes...");
      setTimeout(() => {
        setAnalysisStep("Prompting Gemma 3 via Ollama...");
      }, 700);
      setTimeout(() => {
        setAnalysisStep("Verifying evidence quotes against source text...");
      }, 2500);
    }

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brief,
          content,
          deliverableType,
          campaignName,
          mode,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setErrorBanner({
          message: data.error || "Analysis failed",
          type: data.errorType,
          helpInstructions: data.helpInstructions || [],
        });
      } else {
        setReport(data.report);
        // Scroll down to the report container smoothly
        setTimeout(() => {
          document
            .getElementById("report-section")
            ?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to execute analysis";
      setErrorBanner({
        message: `Network error: ${message}`,
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep("");
    }
  };

  // Word & time counters for editor
  const briefWordCount = brief.trim().split(/\s+/).filter(Boolean).length;
  const contentWordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const spokenSeconds = Math.round((contentWordCount / 140) * 60);
  const spokenMinutes = Math.floor(spokenSeconds / 60);
  const spokenRemainder = spokenSeconds % 60;
  const spokenFormatted =
    spokenMinutes > 0
      ? `${spokenMinutes}m ${spokenRemainder}s`
      : `${spokenSeconds}s`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        ollamaStatus={ollamaStatus}
        loadingStatus={loadingStatus}
        onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Hero / Subhead Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl relative z-20">
          {/* Inner container to clip decorative blur without clipping dropdown menus */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
            <div className="absolute right-0 top-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Zero Hallucinations • Evidence-Backed Quotations
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Audit Sponsored Content Against Brand Briefs
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1 leading-relaxed">
                Compare talking points, exact promo codes, custom links, and FTC
                disclosures. Powered by local Gemma 3 via Ollama with strict
                verbatim evidence verification.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <ExampleSelector onSelectExample={handleSelectExample} />
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                title="Clear both inputs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Campaign Parameters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900/60 border border-slate-800/90 rounded-2xl p-3.5 relative z-10">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Campaign Name
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. NordShield VPN Q4 Integration"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Deliverable Format
            </label>
            <select
              value={deliverableType}
              onChange={(e) =>
                setDeliverableType(e.target.value as DeliverableType)
              }
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="YOUTUBE_INTEGRATION">YouTube Integration (60-90s)</option>
              <option value="YOUTUBE_DEDICATED">YouTube Dedicated Video</option>
              <option value="TIKTOK_REELS">TikTok / Reel / Shorts</option>
              <option value="PODCAST_READ">Podcast Host Read (45-60s)</option>
              <option value="INSTAGRAM_POST">Instagram Caption & Post</option>
              <option value="NEWSLETTER">Newsletter Sponsorship</option>
            </select>
          </div>
        </div>

        {/* Dual Input Textareas: Brief vs Script */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left: Brand Brief & Requirements */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-bold text-slate-200">
                  1. Brand Brief & Requirements
                </span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {briefWordCount} words • {brief.length} chars
              </span>
            </div>

            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Paste sponsor brief here (talking points, required promo code, custom link, prohibited topics, FTC rules)..."
              rows={16}
              className="w-full flex-1 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed"
            />
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Must declare talking points, codes, and legal terms</span>
              <span>Input treated as read-only data</span>
            </div>
          </div>

          {/* Right: Sponsored Content / Script / Caption */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-lg">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-bold text-slate-200">
                  2. Content Script or Draft Caption
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <span className="flex items-center gap-1 text-amber-400">
                  <Clock className="w-3.5 h-3.5" />
                  ~{spokenFormatted} spoken
                </span>
                <span>•</span>
                <span>{contentWordCount} words</span>
              </div>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your draft script, video voiceover transcript, or social media caption here..."
              rows={16}
              className="w-full flex-1 bg-slate-950/80 border border-slate-800/90 rounded-xl p-3.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 transition-colors resize-y leading-relaxed"
            />
            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
              <span>Check against promo code, #ad disclosure, talking points</span>
              <span>Calculated at 140 words per minute</span>
            </div>
          </div>
        </div>

        {/* Action Buttons Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-2">
          {/* Primary: Full Analysis with Gemma 3 */}
          <button
            onClick={() => runAnalysis("auto")}
            disabled={isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{analysisStep || "Auditing Campaign..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
                <span>Analyze Campaign (Gemma 3 + Rules)</span>
              </>
            )}
          </button>

          {/* Secondary: Instant Deterministic Rules Only */}
          <button
            onClick={() => runAnalysis("deterministic")}
            disabled={isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-colors cursor-pointer disabled:opacity-50"
            title="Instant regex & deterministic check for exact promo codes, URLs, hashtags, FTC, and prohibited terms (no LLM latency)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Instant Deterministic Audit</span>
          </button>
        </div>

        {/* Error / Diagnostic Alert Banner */}
        {errorBanner && (
          <div className="bg-rose-950/50 border border-rose-800/80 rounded-2xl p-5 shadow-xl text-rose-200 animate-in fade-in duration-200">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-100">
                    {errorBanner.type === "OLLAMA_UNREACHABLE"
                      ? "Ollama Service Unreachable"
                      : errorBanner.type === "MODEL_NOT_FOUND"
                      ? "Gemma 3 Model Not Installed"
                      : "Analysis Alert"}
                  </h4>
                  <button
                    onClick={() => setErrorBanner(null)}
                    className="text-xs text-rose-400 hover:text-rose-200 font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>

                <p className="text-xs text-rose-300 leading-relaxed font-mono">
                  {errorBanner.message}
                </p>

                {errorBanner.helpInstructions &&
                  errorBanner.helpInstructions.length > 0 && (
                    <div className="bg-slate-950/80 border border-rose-900/60 rounded-xl p-3 text-xs space-y-1">
                      <span className="font-bold text-rose-200 block mb-1">
                        How to resolve:
                      </span>
                      {errorBanner.helpInstructions.map((instruction, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-slate-300 font-mono text-[11px]">
                          <span className="text-indigo-400">•</span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => runAnalysis("deterministic")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    Run Instant Deterministic Audit Instead
                  </button>

                  <button
                    onClick={() => setIsOllamaModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white underline font-medium cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-indigo-400" />
                    View Ollama Terminal Setup Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Report Container */}
        {report && (
          <div id="report-section" className="pt-4">
            <AnalysisReport
              report={report}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-400">SponsorProof</span>
            <span>—</span>
            <span>Evidence-Based Sponsored Content Verification</span>
          </div>
          <div>
            <span>Local Gemma 3 Integration</span>
            <span className="mx-2">•</span>
            <span>No paid API, no login, no data retained</span>
          </div>
        </div>
      </footer>

      {/* Ollama Diagnostics Modal */}
      <OllamaStatusModal
        isOpen={isOllamaModalOpen}
        onClose={() => setIsOllamaModalOpen(false)}
        status={ollamaStatus}
        onRefresh={fetchOllamaStatus}
        isRefreshing={loadingStatus}
      />

      {/* Export Report Modal */}
      {report && (
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          report={report}
        />
      )}
    </div>
  );
}
