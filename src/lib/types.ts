import { z } from "zod";

export type FindingStatus = "PASS" | "MISSING" | "NEEDS_REVIEW";

export type FindingCategory =
  | "PROMO_AND_LINKS"
  | "DISCLOSURES"
  | "MANDATORY_TALKING_POINTS"
  | "PROHIBITED_CONTENT"
  | "CALL_TO_ACTION"
  | "TONE_AND_SPECS";

export type Severity = "CRITICAL" | "IMPORTANT" | "RECOMMENDED";

export type DeliverableType =
  | "YOUTUBE_INTEGRATION"
  | "YOUTUBE_DEDICATED"
  | "TIKTOK_REELS"
  | "PODCAST_READ"
  | "INSTAGRAM_POST"
  | "NEWSLETTER";

export interface EvidenceQuote {
  text: string;
  verified: boolean;
  source: "brief" | "content";
  matchIndex?: number;
  length?: number;
  verificationNote?: string;
}

export type VerificationMethod =
  | "Exact Text Match"
  | "AI Semantic Check"
  | "Calculated Check";

export interface Finding {
  id: string;
  title: string;
  category: FindingCategory;
  status: FindingStatus;
  severity: Severity;
  briefQuote: EvidenceQuote | null;
  contentQuote: EvidenceQuote | null;
  explanation: string;
  suggestedFix: string | null;
  sourceType: "deterministic" | "llm" | "hybrid";
  verificationMethod: VerificationMethod;
}

export interface DeterministicMetrics {
  briefCodes: string[];
  contentCodes: string[];
  matchedCodes: string[];
  missingCodes: string[];
  briefHashtags: string[];
  contentHashtags: string[];
  matchedHashtags: string[];
  missingHashtags: string[];
  briefLinks: string[];
  contentLinks: string[];
  matchedLinks: string[];
  missingLinks: string[];
  ftcCompliant: boolean;
  ftcTermsFound: string[];
  prohibitedTermsFound: { term: string; context: string }[];
}

export interface SourceStats {
  briefWordCount: number;
  contentWordCount: number;
  contentCharCount: number;
  estimatedReadTimeSeconds: number;
  estimatedSpeakingTimeFormatted: string;
}

export interface ExecutionMeta {
  modelUsed: string;
  ollamaBaseUrl: string;
  analysisMode: "ollama" | "deterministic_fallback";
  durationMs: number;
  ollamaAvailable: boolean;
}

export interface CampaignReport {
  id: string;
  timestamp: string;
  campaignName: string;
  deliverableType: DeliverableType;
  overallScore: number;
  complianceStatus: "READY_TO_POST" | "CHANGES_REQUIRED" | "HIGH_RISK_VIOLATIONS";
  summary: string;
  counts: {
    pass: number;
    missing: number;
    needsReview: number;
    total: number;
  };
  findings: Finding[];
  deterministicMetrics: DeterministicMetrics;
  sourceStats: SourceStats;
  executionMeta: ExecutionMeta;
}

// Zod validation schemas for LLM JSON responses
export const LLMEvidenceQuoteSchema = z.object({
  text: z.string().default(""),
});

function normalizeCategory(val: unknown): unknown {
  if (typeof val !== "string") return val;
  const s = val.trim().toLowerCase().replace(/[-_\s]+/g, " ");

  // Mandatory talking points / features / benefits
  if (
    s.includes("talking point") ||
    s.includes("product feature") ||
    s.includes("key benefit") ||
    s.includes("benefit") ||
    s.includes("feature") ||
    s.includes("mandatory")
  ) {
    return "MANDATORY_TALKING_POINTS";
  }

  // Call to action
  if (
    s.includes("call to action") ||
    s.includes("cta") ||
    s.includes("action")
  ) {
    return "CALL_TO_ACTION";
  }

  // Disclosures / FTC / legal
  if (
    s.includes("disclosure") ||
    s.includes("ftc") ||
    s.includes("legal") ||
    s.includes("compliance")
  ) {
    return "DISCLOSURES";
  }

  // Promo and links
  if (
    s.includes("promo") ||
    s.includes("discount") ||
    s.includes("coupon") ||
    s.includes("link") ||
    s.includes("hashtag") ||
    s.includes("marketing")
  ) {
    return "PROMO_AND_LINKS";
  }

  // Prohibited content / brand safety
  if (
    s.includes("prohibited") ||
    s.includes("brand safety") ||
    s.includes("forbidden") ||
    s.includes("restricted")
  ) {
    return "PROHIBITED_CONTENT";
  }

  // Tone and specs
  if (
    s.includes("tone") ||
    s.includes("spec") ||
    s.includes("length") ||
    s.includes("pacing") ||
    s.includes("deliverable")
  ) {
    return "TONE_AND_SPECS";
  }

  // Fallback for generic assessment categories
  if (s.includes("review") || s.includes("general") || s.includes("overall")) {
    return "MANDATORY_TALKING_POINTS";
  }

  return val;
}

function normalizeStatus(val: unknown): unknown {
  if (typeof val !== "string") return val;
  const s = val.trim().toLowerCase();
  if (s === "pass" || s === "passed" || s === "compliant" || s === "fulfilled")
    return "PASS";
  if (s === "missing" || s === "fail" || s === "failed" || s === "omitted")
    return "MISSING";
  if (
    s === "needs_review" ||
    s === "needs review" ||
    s === "review" ||
    s === "unverified"
  )
    return "NEEDS_REVIEW";
  return val;
}

function normalizeSeverity(val: unknown): unknown {
  if (typeof val !== "string") return "IMPORTANT";
  const s = val.trim().toLowerCase();
  if (s === "critical" || s === "high") return "CRITICAL";
  if (s === "important" || s === "medium") return "IMPORTANT";
  if (s === "recommended" || s === "low" || s === "optional") return "RECOMMENDED";
  return val;
}

export const LLMFindingSchema = z.object({
  title: z.string().default("Requirement Finding"),
  category: z.preprocess(
    normalizeCategory,
    z.enum([
      "PROMO_AND_LINKS",
      "DISCLOSURES",
      "MANDATORY_TALKING_POINTS",
      "PROHIBITED_CONTENT",
      "CALL_TO_ACTION",
      "TONE_AND_SPECS",
    ])
  ),
  status: z.preprocess(
    normalizeStatus,
    z.enum(["PASS", "MISSING", "NEEDS_REVIEW"])
  ),
  severity: z.preprocess(
    normalizeSeverity,
    z.enum(["CRITICAL", "IMPORTANT", "RECOMMENDED"])
  ).default("IMPORTANT"),
  briefQuote: z.string().nullable().optional(),
  contentQuote: z.string().nullable().optional(),
  explanation: z.string().default(""),
  suggestedFix: z.string().nullable().optional(),
});

export const LLMAnalysisOutputSchema = z.object({
  summary: z.string(),
  findings: z.array(LLMFindingSchema),
});

export type LLMAnalysisOutput = z.infer<typeof LLMAnalysisOutputSchema>;

export interface OllamaStatusResponse {
  online: boolean;
  baseUrl: string;
  targetModel: string;
  targetModelInstalled: boolean;
  installedModels: string[];
  error?: string;
  helpInstructions?: string[];
}
