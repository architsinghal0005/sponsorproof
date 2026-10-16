"use client";

import React, { useState, useEffect, useRef } from "react";
import { Header } from "@/components/Header";
import { ExampleSelector } from "@/components/ExampleSelector";
import { AnalysisReport } from "@/components/AnalysisReport";
import { OllamaStatusModal } from "@/components/OllamaStatusModal";
import { ExportModal } from "@/components/ExportModal";
import { ContentPreview } from "@/components/ContentPreview";
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
  Clock,
  Terminal,
  ShieldAlert,
  Eye,
  Edit3,
  Check,
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

  const [activeContentTab, setActiveContentTab] = useState<"edit" | "preview">("edit");
  const [report, setReport] = useState<CampaignReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisStep, setAnalysisStep] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const [ollamaStatus, setOllamaStatus] = useState<OllamaStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isOllamaModalOpen, setIsOllamaModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  const cancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsAnalyzing(false);
    setAnalysisStep("");
    setErrorBanner({
      message: "Campaign audit cancelled by user.",
    });
  };

  const runAnalysis = async (mode: "auto" | "deterministic") => {
    // Strictly prevent duplicate concurrent requests
    if (isAnalyzing) return;

    if (!brief.trim() || !content.trim()) {
      setErrorBanner({
        message: "Please provide both the Brand Brief and Content Draft text.",
      });
      return;
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsAnalyzing(true);
    setErrorBanner(null);
    setElapsedSeconds(0);

    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    if (mode === "deterministic") {
      setAnalysisStep("Running deterministic rule checks...");
    } else {
      setAnalysisStep("Extracting exact rules & initializing Gemma 3...");
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
        signal: abortController.signal,
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
          reportRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    } catch (err: unknown) {
      if (abortController.signal.aborted) {
        return; // Handled in cancelAnalysis
      }
      const message =
        err instanceof Error ? err.message : "Failed to execute analysis";
      setErrorBanner({
        message: `Network error: ${message}`,
      });
    } finally {
      clearInterval(timerInterval);
      abortControllerRef.current = null;
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

  // Workflow progress step calculation
  const hasBrief = brief.trim().length > 0;
  const hasContent = content.trim().length > 0;
  const hasAudited = report !== null;
  const isReady = report?.complianceStatus === "READY_TO_POST";

  const brandName = campaignName.includes("-")
    ? campaignName.split("-")[0].trim()
    : campaignName.split(" ")[0];

  return (
    <div className="min-h-screen bg-[#F5F2EC] text-[#252A32] flex flex-col font-sans">
      {/* Product Header */}
      <Header
        ollamaStatus={ollamaStatus}
        loadingStatus={loadingStatus}
        onOpenOllamaModal={() => setIsOllamaModalOpen(true)}
        campaignName={campaignName}
        deliverableType={deliverableType}
        hasReport={report !== null}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onScrollToReport={() => reportRef.current?.scrollIntoView({ behavior: "smooth" })}
        onScrollToEditor={() => editorRef.current?.scrollIntoView({ behavior: "smooth" })}
        isAnalyzing={isAnalyzing}
        analysisMode={report?.executionMeta?.analysisMode}
        lastErrorType={errorBanner?.type}
      />

      {/* Main Campaign Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Campaign Workspace Header Card */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Campaign Identity & Creator Badge */}
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#FAF8F5] border-2 border-[#E5E0D8] text-[#73536D] font-bold text-sm flex items-center justify-center shrink-0">
                CS
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#73536D]">
                    {brandName} Campaign
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#FAF8F5] text-[#74736F] font-semibold border border-[#E5E0D8]">
                    Workspace
                  </span>
                </div>
                <h2 className="text-xl font-black text-[#252A32] tracking-tight">
                  {campaignName}
                </h2>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <ExampleSelector onSelectExample={handleSelectExample} />
              <button
                onClick={handleClear}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#F5F2EC] text-[#74736F] hover:text-[#252A32] border border-[#E5E0D8] transition-colors cursor-pointer"
                title="Clear current text"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Clear
              </button>
            </div>
          </div>

          {/* Workflow Progress Bar */}
          <div className="mt-4 pt-4 border-t border-[#E5E0D8] grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* Step 1: Brand Brief */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                hasBrief
                  ? "bg-[#EDF5F2] border-[#C2DFD4] text-[#347C68]"
                  : "bg-[#FAF8F5] border-[#E5E0D8] text-[#74736F]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  hasBrief ? "bg-[#347C68] text-white" : "bg-[#E5E0D8] text-[#74736F]"
                }`}
              >
                1
              </div>
              <div className="text-xs truncate">
                <span className="font-bold block leading-tight">Brand Brief</span>
                <span className="text-[10px] opacity-80">
                  {hasBrief ? "Loaded" : "Awaiting text"}
                </span>
              </div>
            </div>

            {/* Step 2: Content Draft */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                hasContent
                  ? "bg-[#EDF5F2] border-[#C2DFD4] text-[#347C68]"
                  : "bg-[#FAF8F5] border-[#E5E0D8] text-[#74736F]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  hasContent ? "bg-[#347C68] text-white" : "bg-[#E5E0D8] text-[#74736F]"
                }`}
              >
                2
              </div>
              <div className="text-xs truncate">
                <span className="font-bold block leading-tight">Content Draft</span>
                <span className="text-[10px] opacity-80">
                  {hasContent ? `${contentWordCount} words` : "Awaiting draft"}
                </span>
              </div>
            </div>

            {/* Step 3: Campaign Review */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                hasAudited
                  ? "bg-[#EDF5F2] border-[#C2DFD4] text-[#347C68]"
                  : "bg-[#FAF8F5] border-[#E5E0D8] text-[#74736F]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  hasAudited ? "bg-[#347C68] text-white" : "bg-[#E5E0D8] text-[#74736F]"
                }`}
              >
                3
              </div>
              <div className="text-xs truncate">
                <span className="font-bold block leading-tight">Campaign Review</span>
                <span className="text-[10px] opacity-80">
                  {hasAudited ? `Score: ${report.overallScore}/100` : "Run audit"}
                </span>
              </div>
            </div>

            {/* Step 4: Ready to Submit */}
            <div
              className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors ${
                isReady
                  ? "bg-[#EDF5F2] border-[#C2DFD4] text-[#347C68]"
                  : "bg-[#FAF8F5] border-[#E5E0D8] text-[#74736F]"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  isReady ? "bg-[#347C68] text-white" : "bg-[#E5E0D8] text-[#74736F]"
                }`}
              >
                {isReady ? <Check className="w-3 h-3 text-white" /> : "4"}
              </div>
              <div className="text-xs truncate">
                <span className="font-bold block leading-tight">Ready to Submit</span>
                <span className="text-[10px] opacity-80">
                  {isReady ? "All Passed" : "Revisions needed"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Parameters Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs">
          <div className="sm:col-span-2">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#74736F] mb-1">
              Campaign Title
            </label>
            <input
              type="text"
              value={campaignName}
              onChange={(e) => setCampaignName(e.target.value)}
              placeholder="e.g. NordShield VPN - YouTube Integration"
              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#252A32] focus:outline-none focus:border-[#EA6A50] transition-colors"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-[#74736F] mb-1">
              Deliverable Format
            </label>
            <select
              value={deliverableType}
              onChange={(e) =>
                setDeliverableType(e.target.value as DeliverableType)
              }
              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-3 py-2 text-xs font-semibold text-[#252A32] focus:outline-none focus:border-[#EA6A50] transition-colors cursor-pointer"
            >
              <option value="YOUTUBE_INTEGRATION">YouTube Integration (60-90s)</option>
              <option value="YOUTUBE_DEDICATED">YouTube Dedicated Video</option>
              <option value="TIKTOK_REELS">TikTok / Instagram Reel / Short</option>
              <option value="PODCAST_READ">Podcast Host Read (45-60s)</option>
              <option value="INSTAGRAM_POST">Instagram Caption & Post</option>
              <option value="NEWSLETTER">Newsletter Sponsorship Slot</option>
            </select>
          </div>
        </div>

        {/* Two-Column Editor Workspace */}
        <div ref={editorRef} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left Column: Brand Brief & Requirements */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#73536D]" />
                <h3 className="text-sm font-bold text-[#252A32]">
                  Brand Brief & Requirements
                </h3>
              </div>
              <span className="text-xs text-[#74736F] font-mono">
                {briefWordCount} words • {brief.length} chars
              </span>
            </div>

            <textarea
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              placeholder="Paste the sponsor brief here (required promo codes, hashtags, custom links, mandatory talking points, prohibited claims, FTC disclosures)..."
              rows={16}
              className="w-full flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 text-xs font-mono text-[#252A32] placeholder-[#74736F]/70 focus:outline-none focus:border-[#EA6A50] transition-colors resize-y leading-relaxed"
            />
            <div className="mt-2.5 text-[11px] text-[#74736F] flex items-center justify-between">
              <span>Sponsor deliverables & contractual guidelines</span>
              <span className="font-medium text-[#252A32]">Source Document</span>
            </div>
          </div>

          {/* Right Column: Content Draft & Live Preview */}
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E0D8] mb-3">
              {/* Tab Selector: Editor vs Live Preview */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#E5E0D8]">
                <button
                  type="button"
                  id="btn-tab-editor"
                  onClick={() => setActiveContentTab("edit")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeContentTab === "edit"
                      ? "bg-white text-[#252A32] shadow-xs"
                      : "text-[#74736F] hover:text-[#252A32]"
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#EA6A50]" />
                  Editor
                </button>
                <button
                  type="button"
                  id="btn-tab-preview"
                  onClick={() => setActiveContentTab("preview")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeContentTab === "preview"
                      ? "bg-white text-[#252A32] shadow-xs"
                      : "text-[#74736F] hover:text-[#252A32]"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-[#73536D]" />
                  Live Preview
                </button>
              </div>

              {/* Word Count & Spoken Duration */}
              <div className="flex items-center gap-2 text-xs text-[#74736F] font-mono">
                <span className="flex items-center gap-1 text-[#347C68] font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  ~{spokenFormatted}
                </span>
                <span>•</span>
                <span>{contentWordCount} words</span>
              </div>
            </div>

            {/* Toggle Content: Textarea or Live Preview */}
            {activeContentTab === "edit" ? (
              <>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Paste your draft script, voiceover transcript, or social media caption here..."
                  rows={16}
                  className="w-full flex-1 bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 text-xs font-mono text-[#252A32] placeholder-[#74736F]/70 focus:outline-none focus:border-[#EA6A50] transition-colors resize-y leading-relaxed"
                />
                <div className="mt-2.5 text-[11px] text-[#74736F] flex items-center justify-between">
                  <span>Switch to &ldquo;Live Preview&rdquo; to simulate deliverable layout</span>
                  <span className="font-medium text-[#252A32]">Draft Text</span>
                </div>
              </>
            ) : (
              <div className="flex-1 min-h-[380px]">
                <ContentPreview
                  content={content}
                  deliverableType={deliverableType}
                  campaignName={campaignName}
                />
              </div>
            )}
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-3">
          {/* Main Action: Audit with Gemma 3 + Deterministic */}
          <button
            type="button"
            id="btn-analyze-campaign"
            onClick={() => runAnalysis("auto")}
            disabled={isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-[#EA6A50] hover:bg-[#D8583E] text-white shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
          >
            {isAnalyzing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>
                  {analysisStep || "Auditing Campaign..."}{" "}
                  {elapsedSeconds > 0 && `(${elapsedSeconds}s)`}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Campaign (Gemma 3 + Rules)</span>
              </>
            )}
          </button>

          {/* Cancel button if analysis is running */}
          {isAnalyzing && (
            <button
              type="button"
              onClick={cancelAnalysis}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-xs font-semibold bg-[#FAF8F5] hover:bg-[#FDF2F0] text-[#C53929] border border-[#F5C7C0] transition-colors cursor-pointer shadow-xs"
              title="Stop the in-flight inference request"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Cancel Analysis</span>
            </button>
          )}

          {/* Secondary Action: Instant Deterministic Audit */}
          <button
            type="button"
            id="btn-instant-audit"
            onClick={() => runAnalysis("deterministic")}
            disabled={isAnalyzing}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-[#252A32] border border-[#E5E0D8] hover:border-[#D1CBC0] transition-colors cursor-pointer shadow-xs disabled:opacity-50"
            title="Instant regex & deterministic check for exact promo codes, URLs, hashtags, FTC, and prohibited terms (no LLM latency)"
          >
            <Zap className="w-3.5 h-3.5 text-[#B45309]" />
            <span>Instant Deterministic Audit</span>
          </button>
        </div>

        {/* Error / Diagnostic Alert Banner */}
        {errorBanner && (
          <div className="bg-[#FDF2F0] border border-[#F5C7C0] rounded-2xl p-5 shadow-xs text-[#252A32]">
            <div className="flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-[#C53929] shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-[#C53929]">
                    {errorBanner.type === "TIMEOUT"
                      ? "Local AI Inference Timed Out"
                      : errorBanner.type === "OLLAMA_UNREACHABLE"
                      ? "Ollama Service Unreachable"
                      : errorBanner.type === "MODEL_NOT_FOUND"
                      ? "Gemma 3 Model Not Installed"
                      : "Audit Notice"}
                  </h4>
                  <button
                    onClick={() => setErrorBanner(null)}
                    className="text-xs text-[#74736F] hover:text-[#252A32] font-semibold cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>

                <p className="text-xs text-[#252A32] leading-relaxed font-mono">
                  {errorBanner.message}
                </p>

                {errorBanner.helpInstructions &&
                  errorBanner.helpInstructions.length > 0 && (
                    <div className="bg-white border border-[#F5C7C0] rounded-xl p-3 text-xs space-y-1">
                      <span className="font-bold text-[#C53929] block mb-1">
                        How to resolve:
                      </span>
                      {errorBanner.helpInstructions.map((instruction, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-[#252A32] font-mono text-[11px]">
                          <span className="text-[#EA6A50]">•</span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  )}

                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => runAnalysis("deterministic")}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-[#FAF8F5] text-[#B45309] border border-[#FDE3A7] transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-[#B45309]" />
                    Run Deterministic Audit Instead
                  </button>

                  <button
                    onClick={() => setIsOllamaModalOpen(true)}
                    className="inline-flex items-center gap-1.5 text-xs text-[#73536D] hover:text-[#252A32] font-medium cursor-pointer"
                  >
                    <Terminal className="w-3 h-3 text-[#73536D]" />
                    View Ollama Terminal Setup Guide
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Report Container */}
        {report && (
          <div ref={reportRef} id="report-section" className="pt-4">
            <AnalysisReport
              report={report}
              onOpenExportModal={() => setIsExportModalOpen(true)}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] bg-[#F5F2EC] py-6 mt-12 text-center text-xs text-[#74736F]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#252A32]">SponsorProof</span>
            <span>—</span>
            <span>Creator Campaign Studio</span>
          </div>
          <div>
            <span>Local Gemma 3 Integration ({ollamaStatus?.targetModel || "gemma3:1b"})</span>
            <span className="mx-2">•</span>
            <span>Private & Local Inference</span>
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
