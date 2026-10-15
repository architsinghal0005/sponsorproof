import React from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { FindingCategory, FindingStatus, Severity } from "@/lib/types";

export function StatusBadge({ status }: { status: FindingStatus }) {
  if (status === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        PASS
      </span>
    );
  }

  if (status === "MISSING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
        <XCircle className="w-3.5 h-3.5 text-rose-500" />
        MISSING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
      NEEDS REVIEW
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "CRITICAL") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-950/40 text-rose-400 border border-rose-800/50">
        Critical
      </span>
    );
  }
  if (severity === "IMPORTANT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-950/40 text-amber-400 border border-amber-800/50">
        Important
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
      Recommended
    </span>
  );
}

export function CategoryBadge({ category }: { category: FindingCategory }) {
  const labels: Record<FindingCategory, string> = {
    MANDATORY_TALKING_POINTS: "Talking Points",
    PROMO_AND_LINKS: "Promo & Links",
    DISCLOSURES: "FTC Disclosures",
    PROHIBITED_CONTENT: "Brand Safety",
    CALL_TO_ACTION: "Call to Action",
    TONE_AND_SPECS: "Specs & Pacing",
  };

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
      {labels[category] || category}
    </span>
  );
}
