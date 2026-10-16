import React from "react";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert } from "lucide-react";

interface ScoreMeterProps {
  score: number;
  status: "READY_TO_POST" | "CHANGES_REQUIRED" | "HIGH_RISK_VIOLATIONS";
  counts: {
    pass: number;
    missing: number;
    needsReview: number;
    total: number;
  };
}

export function ScoreMeter({ score, status, counts }: ScoreMeterProps) {
  // SVG circular gauge math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "#347C68"; // Restrained green
  let scoreTextColor = "text-[#347C68]";

  if (score < 60) {
    strokeColor = "#C53929"; // Crimson red
    scoreTextColor = "text-[#C53929]";
  } else if (score < 85) {
    strokeColor = "#B45309"; // Warm amber
    scoreTextColor = "text-[#B45309]";
  }

  const statusConfig = {
    READY_TO_POST: {
      label: "Ready to Submit",
      badgeClass: "bg-[#EDF5F2] text-[#347C68] border-[#C2DFD4]",
      icon: ShieldCheck,
      description: "All mandatory talking points, promo codes, and sponsorship disclosures passed verification.",
    },
    CHANGES_REQUIRED: {
      label: "Revisions Required",
      badgeClass: "bg-[#FEF9EE] text-[#B45309] border-[#FDE3A7]",
      icon: AlertTriangle,
      description: "Missing minor talking points or call-to-action adjustments identified. Review suggested fixes before submitting.",
    },
    HIGH_RISK_VIOLATIONS: {
      label: "Action Needed: Missing Requirements",
      badgeClass: "bg-[#FDF2F0] text-[#C53929] border-[#F5C7C0]",
      icon: ShieldAlert,
      description: "Critical promo codes or hashtags missing, or prohibited claims detected. Brand will likely reject this draft.",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 shadow-xs relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
        {/* Left: Circular Compliance Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
              {/* Background Track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-[#E5E0D8]"
                strokeWidth="10"
                fill="none"
              />
              {/* Progress Bar */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                stroke={strokeColor}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-2xl font-black tracking-tight ${scoreTextColor}`}>
                {score}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#74736F]">
                / 100
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border ${statusConfig.badgeClass}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#252A32] mb-1">
              Campaign Review Score
            </h3>
            <p className="text-xs text-[#74736F] max-w-sm leading-relaxed">
              {statusConfig.description}
            </p>
          </div>
        </div>

        {/* Right: Breakdown Stats */}
        <div className="grid grid-cols-3 gap-2.5 w-full md:w-auto">
          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px]">
            <div className="flex items-center gap-1.5 text-[#347C68] mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-lg font-bold">{counts.pass}</span>
            </div>
            <span className="text-[11px] font-medium text-[#74736F]">Passed</span>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px]">
            <div className="flex items-center gap-1.5 text-[#C53929] mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-lg font-bold">{counts.missing}</span>
            </div>
            <span className="text-[11px] font-medium text-[#74736F]">Missing</span>
          </div>

          <div className="bg-[#FAF8F5] border border-[#E5E0D8] rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px]">
            <div className="flex items-center gap-1.5 text-[#B45309] mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-lg font-bold">{counts.needsReview}</span>
            </div>
            <span className="text-[11px] font-medium text-[#74736F]">Needs Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
