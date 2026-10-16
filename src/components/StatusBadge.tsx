import React from "react";
import { CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { FindingCategory, FindingStatus, Severity } from "@/lib/types";

export function StatusBadge({ status }: { status: FindingStatus }) {
  if (status === "PASS") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#EDF5F2] text-[#347C68] border border-[#C2DFD4]">
        <CheckCircle2 className="w-3.5 h-3.5 text-[#347C68]" />
        PASS
      </span>
    );
  }

  if (status === "MISSING") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FDF2F0] text-[#C53929] border border-[#F5C7C0]">
        <XCircle className="w-3.5 h-3.5 text-[#C53929]" />
        MISSING
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-[#FEF9EE] text-[#B45309] border border-[#FDE3A7]">
      <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
      NEEDS REVIEW
    </span>
  );
}

export function SeverityBadge({ severity }: { severity: Severity }) {
  if (severity === "CRITICAL") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FDF2F0] text-[#C53929] border border-[#F5C7C0]">
        Critical
      </span>
    );
  }
  if (severity === "IMPORTANT") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-[#FEF9EE] text-[#B45309] border border-[#FDE3A7]">
        Important
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF8F5] text-[#74736F] border border-[#E5E0D8]">
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
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#FAF8F5] text-[#73536D] border border-[#E5E0D8]">
      {labels[category] || category}
    </span>
  );
}
