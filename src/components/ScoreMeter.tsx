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
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let strokeColor = "stroke-emerald-500";
  let scoreTextColor = "text-emerald-400";
  let glowColor = "rgba(16, 185, 129, 0.25)";

  if (score < 60) {
    strokeColor = "stroke-rose-500";
    scoreTextColor = "text-rose-400";
    glowColor = "rgba(244, 63, 94, 0.25)";
  } else if (score < 85) {
    strokeColor = "stroke-amber-500";
    scoreTextColor = "text-amber-400";
    glowColor = "rgba(245, 158, 11, 0.25)";
  }

  const statusConfig = {
    READY_TO_POST: {
      label: "Ready to Post",
      badgeClass: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
      icon: ShieldCheck,
      description: "All critical talking points, codes, and FTC disclosures passed verification.",
    },
    CHANGES_REQUIRED: {
      label: "Changes Required",
      badgeClass: "bg-amber-500/15 text-amber-400 border-amber-500/30",
      icon: AlertTriangle,
      description: "Missing minor talking points or call-to-action refinements before submission.",
    },
    HIGH_RISK_VIOLATIONS: {
      label: "High Risk Violations",
      badgeClass: "bg-rose-500/15 text-rose-400 border-rose-500/30",
      icon: ShieldAlert,
      description: "Critical promo codes missing or prohibited claims detected. Brand will likely reject this draft.",
    },
  }[status];

  const StatusIcon = statusConfig.icon;

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow */}
      <div
        className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{ backgroundColor: glowColor }}
      />

      <div className="flex flex-col md:flex-row items-center gap-6 justify-between relative z-10">
        {/* Left: Circular Gauge */}
        <div className="flex items-center gap-5">
          <div className="relative w-32 h-32 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 128 128">
              {/* Track */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="10"
                fill="none"
              />
              {/* Progress */}
              <circle
                cx="64"
                cy="64"
                r={radius}
                className={`${strokeColor} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
              />
            </svg>

            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className={`text-3xl font-extrabold tracking-tight ${scoreTextColor}`}>
                {score}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Score
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${statusConfig.badgeClass}`}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              Campaign Compliance Audit
            </h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              {statusConfig.description}
            </p>
          </div>
        </div>

        {/* Right: Breakdown Stats */}
        <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px]">
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-xl font-bold">{counts.pass}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Passed</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px]">
            <div className="flex items-center gap-1.5 text-rose-400 mb-1">
              <XCircle className="w-4 h-4" />
              <span className="text-xl font-bold">{counts.missing}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Missing</span>
          </div>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl px-4 py-3 flex flex-col items-center min-w-[90px]">
            <div className="flex items-center gap-1.5 text-amber-400 mb-1">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-xl font-bold">{counts.needsReview}</span>
            </div>
            <span className="text-[11px] font-medium text-slate-400">Review</span>
          </div>
        </div>
      </div>
    </div>
  );
}
