"use client";

import React, { useState, useMemo } from "react";
import {
  CampaignReport,
  FindingCategory,
  FindingStatus,
} from "@/lib/types";
import { ScoreMeter } from "./ScoreMeter";
import { FindingCard } from "./FindingCard";
import {
  Share2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Tag,
  Hash,
  Link2,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
} from "lucide-react";

interface AnalysisReportProps {
  report: CampaignReport;
  onOpenExportModal: () => void;
  onRunAuditAgain?: () => void;
}

export function AnalysisReport({
  report,
  onOpenExportModal,
}: AnalysisReportProps) {
  const [statusFilter, setStatusFilter] = useState<FindingStatus | "ALL">("ALL");
  const [categoryFilter, setCategoryFilter] = useState<FindingCategory | "ALL">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFindings = useMemo(() => {
    return report.findings.filter((f) => {
      if (statusFilter !== "ALL" && f.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && f.category !== categoryFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inTitle = f.title.toLowerCase().includes(q);
        const inExp = f.explanation.toLowerCase().includes(q);
        const inFix = f.suggestedFix?.toLowerCase().includes(q);
        return inTitle || inExp || inFix;
      }
      return true;
    });
  }, [report.findings, statusFilter, categoryFilter, searchQuery]);

  const { deterministicMetrics: det, sourceStats } = report;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400">
            {report.deliverableType.replace(/_/g, " ")} AUDIT
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100">
            {report.campaignName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 transition-all cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5" />
            Export & Share Report
          </button>
        </div>
      </div>

      {/* Score Meter & Verdict */}
      <ScoreMeter
        score={report.overallScore}
        status={report.complianceStatus}
        counts={report.counts}
      />

      {/* Executive Summary Card */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2 text-indigo-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          Executive Audit Summary
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-normal">
          {report.summary}
        </p>

        {/* Audit Mode Notice */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <span>
            Model:{" "}
            <strong className="text-slate-200">
              {report.executionMeta.modelUsed}
            </strong>
          </span>
          <span>
            Audit Duration:{" "}
            <strong className="text-slate-200">
              {(report.executionMeta.durationMs / 1000).toFixed(2)}s
            </strong>
          </span>
          <span>
            Mode:{" "}
            <strong className="text-slate-200">
              {report.executionMeta.analysisMode === "ollama"
                ? "Full Gemma 3 Semantic + Deterministic Rules"
                : "Deterministic Exact Rules Engine"}
            </strong>
          </span>
        </div>
      </div>

      {/* Deterministic Quick Chips Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Promo Codes */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-indigo-400" />
              Promo Code
            </span>
            {det.matchedCodes.length > 0 ? (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded">
                MATCH
              </span>
            ) : det.briefCodes.length > 0 ? (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded">
                MISSING
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">N/A</span>
            )}
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 truncate">
            {det.briefCodes.length > 0
              ? det.briefCodes.join(", ")
              : "No code in brief"}
          </div>
        </div>

        {/* Hashtags */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Hash className="w-3 h-3 text-purple-400" />
              Hashtags
            </span>
            {det.missingHashtags.length === 0 && det.briefHashtags.length > 0 ? (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded">
                ALL IN
              </span>
            ) : det.missingHashtags.length > 0 ? (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded">
                {det.missingHashtags.length} MISSING
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">N/A</span>
            )}
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 truncate">
            {det.briefHashtags.length > 0
              ? det.briefHashtags.join(" ")
              : "None specified"}
          </div>
        </div>

        {/* FTC Disclosure */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              FTC Disclosure
            </span>
            {det.ftcCompliant ? (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded">
                COMPLIANT
              </span>
            ) : (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded">
                REQUIRED
              </span>
            )}
          </div>
          <div className="text-xs font-bold text-slate-200 truncate">
            {det.ftcCompliant
              ? det.ftcTermsFound.join(", ")
              : "No #ad or sponsor tag"}
          </div>
        </div>

        {/* Campaign Links */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Link2 className="w-3 h-3 text-cyan-400" />
              Sponsor URL
            </span>
            {det.matchedLinks.length > 0 ? (
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-1.5 py-0.5 rounded">
                FOUND
              </span>
            ) : det.briefLinks.length > 0 ? (
              <span className="text-[10px] text-rose-400 font-bold bg-rose-950/50 px-1.5 py-0.5 rounded">
                MISSING
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-medium">N/A</span>
            )}
          </div>
          <div className="text-xs font-mono font-bold text-slate-200 truncate">
            {det.briefLinks.length > 0
              ? det.briefLinks[0]
              : "No specific link"}
          </div>
        </div>

        {/* Spoken Duration */}
        <div className="bg-slate-950/70 border border-slate-800/90 rounded-xl p-3 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-400" />
              Spoken Pacing
            </span>
            <span className="text-[10px] text-slate-400 font-medium">
              ~140 wpm
            </span>
          </div>
          <div className="text-xs font-bold text-slate-200">
            {sourceStats.estimatedSpeakingTimeFormatted} ({sourceStats.contentWordCount} words)
          </div>
        </div>
      </div>

      {/* Findings Section Header & Filter Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            Detailed Evidence Findings
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {filteredFindings.length} of {report.findings.length}
            </span>
          </h3>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search findings or fixes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-700 text-white"
                : "bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
            }`}
          >
            All ({report.counts.total})
          </button>

          <button
            onClick={() => setStatusFilter("MISSING")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "MISSING"
                ? "bg-rose-600 text-white"
                : "bg-rose-950/40 text-rose-300 hover:bg-rose-900/40 border border-rose-800/40"
            }`}
          >
            <XCircle className="w-3.5 h-3.5" />
            Missing ({report.counts.missing})
          </button>

          <button
            onClick={() => setStatusFilter("NEEDS_REVIEW")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "NEEDS_REVIEW"
                ? "bg-amber-600 text-white"
                : "bg-amber-950/40 text-amber-300 hover:bg-amber-900/40 border border-amber-800/40"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Needs Review ({report.counts.needsReview})
          </button>

          <button
            onClick={() => setStatusFilter("PASS")}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              statusFilter === "PASS"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-950/40 text-emerald-300 hover:bg-emerald-900/40 border border-emerald-800/40"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Passed ({report.counts.pass})
          </button>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-4">
          {filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
          <p className="text-sm font-medium">
            No findings match your current filters.
          </p>
          <button
            onClick={() => {
              setStatusFilter("ALL");
              setCategoryFilter("ALL");
              setSearchQuery("");
            }}
            className="mt-2 text-xs text-indigo-400 hover:underline font-semibold cursor-pointer"
          >
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
}
