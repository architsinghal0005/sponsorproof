import React, { useState } from "react";
import {
  Finding,
} from "@/lib/types";
import { CategoryBadge, SeverityBadge, StatusBadge } from "./StatusBadge";
import {
  Check,
  Copy,
  Quote,
  ShieldCheck,
  AlertCircle,
  FileText,
  Sparkles,
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

  // Border accents
  const borderClass =
    finding.status === "PASS"
      ? "border-emerald-500/30 hover:border-emerald-500/50"
      : finding.status === "MISSING"
      ? "border-rose-500/40 hover:border-rose-500/60"
      : "border-amber-500/40 hover:border-amber-500/60";

  return (
    <div
      className={`bg-slate-900/80 border ${borderClass} rounded-2xl p-5 shadow-lg backdrop-blur-sm transition-all duration-200 relative overflow-hidden`}
    >
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5">
        <div className="flex items-center gap-2">
          <StatusBadge status={finding.status} />
          <CategoryBadge category={finding.category} />
          <SeverityBadge severity={finding.severity} />
        </div>

        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/90 text-slate-300 border border-slate-700/60 shadow-sm">
          {finding.verificationMethod ||
            (finding.sourceType === "llm"
              ? "AI Semantic Check"
              : finding.category === "TONE_AND_SPECS"
              ? "Calculated Check"
              : "Exact Text Match")}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-base font-bold text-slate-100 mb-2 leading-snug">
        {finding.title}
      </h4>

      {/* Explanation */}
      <p className="text-sm text-slate-300 leading-relaxed mb-4">
        {finding.explanation}
      </p>

      {/* Evidence Quotes Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 mb-4">
        {/* Brief Quote Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Brand Brief Requirement
            </span>
            {finding.briefQuote?.verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified from Brief
              </span>
            ) : finding.briefQuote ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Unverified Quote
              </span>
            ) : null}
          </div>

          {finding.briefQuote?.text ? (
            <p className="text-xs text-slate-200 italic border-l-2 border-indigo-500/50 pl-3 py-1 font-mono leading-relaxed">
              &ldquo;{finding.briefQuote.text}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-slate-500 italic pl-1">
              General campaign requirement or industry regulation
            </p>
          )}
        </div>

        {/* Content Script Quote Box */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 relative">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Quote className="w-3.5 h-3.5 text-purple-400" />
              Content Draft Evidence
            </span>
            {finding.contentQuote?.verified ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Found in Script
              </span>
            ) : finding.status === "MISSING" ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-medium bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                Missing from Script
              </span>
            ) : finding.contentQuote ? (
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Unverified in Script
              </span>
            ) : null}
          </div>

          {finding.contentQuote?.text ? (
            <p className="text-xs text-slate-200 italic border-l-2 border-purple-500/50 pl-3 py-1 font-mono leading-relaxed">
              &ldquo;{finding.contentQuote.text}&rdquo;
            </p>
          ) : (
            <p className="text-xs text-rose-400/90 italic pl-1 font-medium">
              No matching mention was found in your draft text.
            </p>
          )}
        </div>
      </div>

      {/* Suggested Fix (if present) */}
      {finding.suggestedFix && (
        <div className="bg-gradient-to-r from-indigo-950/40 to-purple-950/30 border border-indigo-800/40 rounded-xl p-3.5 mt-3">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-xs font-semibold text-indigo-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              Suggested Copy Fix
            </span>
            <button
              onClick={handleCopyFix}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-300" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copy Fix
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-slate-200 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 leading-relaxed select-all">
            {finding.suggestedFix}
          </p>
        </div>
      )}
    </div>
  );
}
