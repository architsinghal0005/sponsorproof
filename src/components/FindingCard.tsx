"use client";

import React, { useState } from "react";
import { Finding } from "@/lib/types";
import { CategoryBadge, SeverityBadge, StatusBadge } from "./StatusBadge";
import {
  Check,
  Copy,
  ShieldCheck,
  AlertCircle,
  FileText,
  Wand2,
} from "lucide-react";

interface FindingCardProps {
  finding: Finding;
}

export function FindingCard({ finding }: FindingCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyFix = () => {
    if (!finding.suggestedFix) return;
    navigator.clipboard.writeText(finding.suggestedFix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Subtle left border indicator
  const statusBorder =
    finding.status === "PASS"
      ? "border-l-4 border-l-[#347C68] border-[#E5E0D8]"
      : finding.status === "MISSING"
      ? "border-l-4 border-l-[#C53929] border-[#E5E0D8]"
      : "border-l-4 border-l-[#B45309] border-[#E5E0D8]";

  return (
    <div
      className={`bg-white border ${statusBorder} rounded-xl p-5 shadow-xs transition-all duration-150 relative`}
    >
      {/* Top Header: Status, Category, Severity & Verification Method */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <StatusBadge status={finding.status} />
          <CategoryBadge category={finding.category} />
          <SeverityBadge severity={finding.severity} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#252A32] border border-[#E5E0D8]">
          {finding.verificationMethod ||
            (finding.sourceType === "llm"
              ? "AI Semantic Check"
              : finding.category === "TONE_AND_SPECS"
              ? "Calculated Check"
              : "Exact Text Match")}
        </span>
      </div>

      {/* Finding Title */}
      <h4 className="text-base font-bold text-[#252A32] mb-1.5 leading-snug">
        {finding.title}
      </h4>

      {/* Explanation */}
      <p className="text-xs sm:text-sm text-[#74736F] leading-relaxed mb-4">
        {finding.explanation}
      </p>

      {/* Evidence Quotes Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-3.5">
        {/* Brand Brief Requirement Box */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-[#252A32] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#73536D]" />
              Brand Brief Requirement
            </span>
            {finding.briefQuote?.verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#347C68] font-semibold bg-[#EDF5F2] px-2 py-0.5 rounded border border-[#C2DFD4]">
                <ShieldCheck className="w-3 h-3 text-[#347C68]" />
                Verified from Brief
              </span>
            ) : finding.briefQuote ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#B45309] font-semibold bg-[#FEF9EE] px-2 py-0.5 rounded border border-[#FDE3A7]">
                <AlertCircle className="w-3 h-3 text-[#B45309]" />
                Unverified Quote
              </span>
            ) : null}
          </div>

          {finding.briefQuote?.text ? (
            <p className="text-xs text-[#252A32] italic border-l-2 border-[#73536D] pl-3 py-1 font-mono leading-relaxed bg-white rounded-r-md">
              &ldquo;{finding.briefQuote.text}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-[#74736F] italic pl-1">
              General campaign requirement or industry regulation
            </p>
          )}

          {finding.briefQuote?.verificationNote && (
            <span className="text-[10px] text-[#74736F] mt-2 block font-mono">
              {finding.briefQuote.verificationNote}
            </span>
          )}
        </div>

        {/* Content Evidence Box */}
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3.5 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-bold text-[#252A32] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#EA6A50]" />
              Content Draft Evidence
            </span>
            {finding.contentQuote?.verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#347C68] font-semibold bg-[#EDF5F2] px-2 py-0.5 rounded border border-[#C2DFD4]">
                <ShieldCheck className="w-3 h-3 text-[#347C68]" />
                Found in Script
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[10px] text-[#C53929] font-semibold bg-[#FDF2F0] px-2 py-0.5 rounded border border-[#F5C7C0]">
                <AlertCircle className="w-3 h-3 text-[#C53929]" />
                Missing from Script
              </span>
            )}
          </div>

          {finding.contentQuote?.text ? (
            <p className="text-xs text-[#252A32] italic border-l-2 border-[#EA6A50] pl-3 py-1 font-mono leading-relaxed bg-white rounded-r-md">
              &ldquo;{finding.contentQuote.text}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-[#C53929] italic pl-1">
              No matching mention was found in your draft text.
            </p>
          )}

          {finding.contentQuote?.verificationNote && (
            <span className="text-[10px] text-[#74736F] mt-2 block font-mono">
              {finding.contentQuote.verificationNote}
            </span>
          )}
        </div>
      </div>

      {/* Suggested Copy Fix Banner */}
      {finding.suggestedFix && (
        <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <Wand2 className="w-4 h-4 text-[#EA6A50] shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-[#252A32] uppercase tracking-wider block">
                Suggested Copy Fix
              </span>
              <p className="text-xs font-mono text-[#252A32] leading-snug mt-0.5">
                {finding.suggestedFix}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopyFix}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#EA6A50] hover:bg-[#D8583E] text-white shadow-xs transition-colors shrink-0 cursor-pointer active:scale-95"
            title="Copy fix to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Fix</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
