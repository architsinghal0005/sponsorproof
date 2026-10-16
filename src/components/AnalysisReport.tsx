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
  Tag,
  Hash,
  Link2,
  Clock,
  Sparkles,
  ShieldCheck,
  Search,
  CheckCircle2,
  XCircle,
  AlertTriangle,
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
    <div className="space-y-6">
      {/* Top Header & Export Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E0D8]">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#73536D]">
            {report.deliverableType.replace(/_/g, " ")} Audit Review
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#252A32] tracking-tight">
            {report.campaignName}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExportModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#EA6A50] hover:bg-[#D8583E] text-white shadow-xs transition-colors cursor-pointer"
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
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-2 mb-2 text-[#73536D] text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-[#EA6A50]" />
          Executive Audit Summary
        </div>
        <p className="text-sm text-[#252A32] leading-relaxed font-normal">
          {report.summary}
        </p>

        {/* Audit Mode Notice & Metadata */}
        <div className="mt-3.5 pt-3 border-t border-[#E5E0D8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#74736F]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#252A32]">Model Engine:</span>
            <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E5E0D8] font-mono text-[11px] text-[#252A32]">
              {report.executionMeta.modelUsed}
            </span>
            <span className="text-[11px]">({report.executionMeta.durationMs}ms)</span>
          </div>

          <div className="text-[11px]">
            Analysis Mode:{" "}
            <span className="font-semibold text-[#252A32]">
              {report.executionMeta.analysisMode === "ollama"
                ? "Gemma 3 Local LLM + Deterministic Verification"
                : "Deterministic Rules Engine"}
            </span>
          </div>
        </div>
      </div>

      {/* Literal Checks Quick Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {/* Promo Codes */}
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#74736F] mb-1 font-medium">
            <Tag className="w-3.5 h-3.5 text-[#73536D]" />
            Promo Code
          </div>
          <div className="text-xs font-bold truncate">
            {det.missingCodes.length > 0 ? (
              <span className="text-[#C53929]">
                {det.missingCodes.join(", ")} MISSING
              </span>
            ) : det.matchedCodes.length > 0 ? (
              <span className="text-[#347C68]">
                {det.matchedCodes.join(", ")} MATCHED
              </span>
            ) : (
              <span className="text-[#74736F]">None Declared</span>
            )}
          </div>
        </div>

        {/* Hashtags */}
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#74736F] mb-1 font-medium">
            <Hash className="w-3.5 h-3.5 text-[#EA6A50]" />
            Hashtags
          </div>
          <div className="text-xs font-bold truncate">
            {det.missingHashtags.length > 0 ? (
              <span className="text-[#C53929]">
                {det.missingHashtags.length} MISSING
              </span>
            ) : det.matchedHashtags.length > 0 ? (
              <span className="text-[#347C68]">
                {det.matchedHashtags.length} VERIFIED
              </span>
            ) : (
              <span className="text-[#74736F]">None Required</span>
            )}
          </div>
        </div>

        {/* FTC Disclosure */}
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#74736F] mb-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#347C68]" />
            Sponsorship Tag
          </div>
          <div className="text-xs font-bold truncate">
            {det.ftcCompliant ? (
              <span className="text-[#347C68]">
                Detected ({det.ftcTermsFound[0] || "Found"})
              </span>
            ) : (
              <span className="text-[#C53929]">No Tag Found</span>
            )}
          </div>
        </div>

        {/* Sponsor Link */}
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs text-[#74736F] mb-1 font-medium">
            <Link2 className="w-3.5 h-3.5 text-[#73536D]" />
            Custom Link
          </div>
          <div className="text-xs font-bold truncate">
            {det.matchedLinks.length > 0 ? (
              <span className="text-[#347C68] truncate block">
                {det.matchedLinks[0]}
              </span>
            ) : det.briefLinks.length > 0 ? (
              <span className="text-[#C53929]">Missing Link</span>
            ) : (
              <span className="text-[#74736F]">None Specified</span>
            )}
          </div>
        </div>

        {/* Spoken Pacing */}
        <div className="bg-white border border-[#E5E0D8] rounded-xl p-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="flex items-center gap-1.5 text-xs text-[#74736F] mb-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#B45309]" />
            Spoken Pacing
          </div>
          <div className="text-xs font-bold text-[#252A32] truncate">
            ~{sourceStats.estimatedSpeakingTimeFormatted} ({sourceStats.contentWordCount} words)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === "ALL"
                  ? "bg-[#252A32] text-white"
                  : "bg-[#FAF8F5] text-[#74736F] hover:bg-[#F5F2EC] hover:text-[#252A32]"
              }`}
            >
              All ({report.findings.length})
            </button>

            <button
              onClick={() => setStatusFilter("MISSING")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === "MISSING"
                  ? "bg-[#C53929] text-white"
                  : "bg-[#FDF2F0] text-[#C53929] hover:bg-[#C53929]/15"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              Missing ({report.counts.missing})
            </button>

            <button
              onClick={() => setStatusFilter("NEEDS_REVIEW")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === "NEEDS_REVIEW"
                  ? "bg-[#B45309] text-white"
                  : "bg-[#FEF9EE] text-[#B45309] hover:bg-[#B45309]/15"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Needs Review ({report.counts.needsReview})
            </button>

            <button
              onClick={() => setStatusFilter("PASS")}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0 ${
                statusFilter === "PASS"
                  ? "bg-[#347C68] text-white"
                  : "bg-[#EDF5F2] text-[#347C68] hover:bg-[#347C68]/15"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Passed ({report.counts.pass})
            </button>
          </div>

          {/* Search Box */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#74736F] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search findings or fixes..."
              className="w-full bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#252A32] placeholder-[#74736F] focus:outline-none focus:border-[#EA6A50] transition-colors"
            />
          </div>
        </div>

        {/* Category Pill Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-2 border-t border-[#E5E0D8] text-xs">
          <span className="text-[11px] font-bold text-[#74736F] uppercase mr-1 shrink-0">
            Category:
          </span>
          {[
            { id: "ALL", label: "All Categories" },
            { id: "PROMO_AND_LINKS", label: "Promo & Links" },
            { id: "DISCLOSURES", label: "Disclosures" },
            { id: "MANDATORY_TALKING_POINTS", label: "Talking Points" },
            { id: "CALL_TO_ACTION", label: "Call to Action" },
            { id: "PROHIBITED_CONTENT", label: "Brand Safety" },
            { id: "TONE_AND_SPECS", label: "Pacing & Specs" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id as FindingCategory | "ALL")}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer shrink-0 ${
                categoryFilter === cat.id
                  ? "bg-[#73536D] text-white font-bold"
                  : "bg-[#FAF8F5] text-[#74736F] hover:bg-[#F5F2EC] hover:text-[#252A32]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-[#74736F]">
          <span className="font-bold text-[#252A32]">
            Showing {filteredFindings.length} of {report.findings.length} Finding
            {report.findings.length > 1 ? "s" : ""}
          </span>
          <span>Click &ldquo;Copy Fix&rdquo; to copy suggested replacements</span>
        </div>

        {filteredFindings.length === 0 ? (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-12 text-center text-[#74736F]">
            No findings match the selected status or category filters.
          </div>
        ) : (
          filteredFindings.map((finding) => (
            <FindingCard key={finding.id} finding={finding} />
          ))
        )}
      </div>
    </div>
  );
}
