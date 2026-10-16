import type {
  CampaignReport,
  DeliverableType,
  Finding,
  OllamaStatusResponse,
} from "./types.ts";
import { LLMAnalysisOutputSchema } from "./types.ts";
import {
  calculateOverallScore,
  calculateSourceStats,
  computeCounts,
  determineComplianceStatus,
  extractFullSentence,
  runDeterministicAnalysis,
} from "./deterministic.ts";
import { verifyQuoteAgainstSource } from "./quoteVerifier.ts";

export class OllamaConnectionError extends Error {
  baseUrl: string;
  constructor(message: string, baseUrl: string) {
    super(message);
    this.name = "OllamaConnectionError";
    this.baseUrl = baseUrl;
  }
}

export class OllamaModelNotFoundError extends Error {
  model: string;
  constructor(message: string, model: string) {
    super(message);
    this.name = "OllamaModelNotFoundError";
    this.model = model;
  }
}

export function getOllamaConfig() {
  const parsedTimeout = parseInt(
    process.env.OLLAMA_TIMEOUT_MS || "200000",
    10
  );
  const timeoutMs =
    isNaN(parsedTimeout) || parsedTimeout <= 0 ? 200000 : parsedTimeout;
  return {
    baseUrl: process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434",
    model: process.env.OLLAMA_MODEL || "gemma3:1b",
    timeoutMs,
  };
}

/**
 * Checks connectivity with Ollama server and verifies if target model exists.
 */
export async function checkOllamaStatus(): Promise<OllamaStatusResponse> {
  const { baseUrl, model } = getOllamaConfig();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${baseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return {
        online: false,
        baseUrl,
        targetModel: model,
        targetModelInstalled: false,
        installedModels: [],
        error: `Ollama server returned HTTP ${response.status} ${response.statusText}`,
        helpInstructions: [
          `Make sure Ollama is running locally on ${baseUrl}`,
          "Run 'ollama serve' in your terminal",
        ],
      };
    }

    const data = await response.json();
    const modelsList: string[] = Array.isArray(data.models)
      ? data.models.map((m: { name?: string; model?: string }) => m.name || m.model || "")
      : [];

    const normalizedTarget = model.toLowerCase();
    const targetModelInstalled = modelsList.some((m) => {
      const normM = m.toLowerCase();
      return (
        normM === normalizedTarget ||
        normM === `${normalizedTarget}:latest` ||
        `${normM}:latest` === normalizedTarget ||
        normM.startsWith(`${normalizedTarget.split(":")[0]}:`)
      );
    });

    return {
      online: true,
      baseUrl,
      targetModel: model,
      targetModelInstalled,
      installedModels: modelsList,
      helpInstructions: targetModelInstalled
        ? []
        : [
            `Model '${model}' is not pulled yet.`,
            `Open terminal and run: ollama run ${model}`,
          ],
    };
  } catch (err: unknown) {
    const errorMessage =
      err instanceof Error ? err.message : "Failed to connect to Ollama";
    return {
      online: false,
      baseUrl,
      targetModel: model,
      targetModelInstalled: false,
      installedModels: [],
      error: errorMessage.includes("aborted")
        ? `Connection to Ollama at ${baseUrl} timed out after 4 seconds.`
        : `Could not connect to Ollama at ${baseUrl}. Ensure the service is active.`,
      helpInstructions: [
        "1. Install Ollama from https://ollama.com if not already installed",
        "2. Start the daemon with: ollama serve",
        `3. Download the model: ollama run ${model}`,
      ],
    };
  }
}

/**
 * Extracts and cleans JSON from LLM output (strips markdown code blocks if wrapped)
 */
export function cleanJsonOutput(raw: string): string {
  let cleaned = raw.trim();

  // Remove markdown code fences ```json ... ``` or ``` ... ```
  const jsonBlockRegex = /```(?:json)?\s*([\s\S]*?)\s*```/;
  const match = cleaned.match(jsonBlockRegex);
  if (match) {
    cleaned = match[1].trim();
  }

  // If there are leading non-JSON characters before the first {
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Calls Ollama /api/chat with Gemma 3
 */
export async function analyzeWithOllama(
  brief: string,
  content: string,
  deliverableType: DeliverableType = "YOUTUBE_INTEGRATION",
  campaignName: string = "Sponsored Campaign",
  externalSignal?: AbortSignal
): Promise<CampaignReport> {
  const startTime = Date.now();
  const { baseUrl, model, timeoutMs } = getOllamaConfig();

  // First run deterministic analysis for ground-truth facts
  const { metrics, findings: deterministicFindings } = runDeterministicAnalysis(
    brief,
    content
  );
  const sourceStats = calculateSourceStats(brief, content);

  const deterministicSummary = `
- Promo Codes: Brief=[${metrics.briefCodes.join(", ")}], Content=[${metrics.contentCodes.join(", ")}], Matched=[${metrics.matchedCodes.join(", ")}], Missing=[${metrics.missingCodes.join(", ")}]
- Hashtags: Brief=[${metrics.briefHashtags.join(", ")}], Content=[${metrics.contentHashtags.join(", ")}], Matched=[${metrics.matchedHashtags.join(", ")}], Missing=[${metrics.missingHashtags.join(", ")}]
- Disclosure detected: ${metrics.ftcCompliant ? "Yes (" + metrics.ftcTermsFound.join(", ") + ")" : "NO"}
- Prohibited Terms Found: ${metrics.prohibitedTermsFound.map((p) => p.term).join(", ") || "None"}
`.trim();

  const systemPrompt = `You are SponsorProof AI, a strict compliance auditor for sponsored creator campaigns.
Your task is to evaluate SEMANTIC requirements: mandatory talking points, product benefit claims, prohibited claims context, and call-to-action intent.
(Literal promo codes, exact hashtags, URLs, and FTC disclosures are already verified deterministically).

Output ONLY a single valid JSON object adhering strictly to this schema:
{
  "summary": "2-sentence executive summary of semantic contract fulfillment.",
  "findings": [
    {
      "title": "Concise requirement title",
      "category": "MANDATORY_TALKING_POINTS",
      "status": "PASS",
      "severity": "IMPORTANT",
      "briefQuote": "Short verbatim excerpt from brand brief, or null",
      "contentQuote": "Short verbatim excerpt from creator draft, or null",
      "explanation": "Concise 1-2 sentence explanation of compliance or gap",
      "suggestedFix": "Single correction sentence if MISSING or NEEDS_REVIEW, or null if PASS"
    }
  ]
}

ALLOWED VALUES FOR "category":
- "MANDATORY_TALKING_POINTS" (product features, key benefits, technical claims)
- "PROHIBITED_CONTENT" (forbidden claims, competitor mentions)
- "CALL_TO_ACTION" (viewer instructions to click, visit, or buy)
- "TONE_AND_SPECS" (pacing, tone, style rules)

ALLOWED VALUES FOR "status": "PASS", "MISSING", "NEEDS_REVIEW"
ALLOWED VALUES FOR "severity": "CRITICAL", "IMPORTANT", "RECOMMENDED"

STRICT RULES:
1. Provide between 3 and 6 key semantic findings. Do NOT duplicate exact promo code, hashtag, or disclosure checks.
2. "briefQuote" and "contentQuote" MUST be short exact verbatim text from the inputs, or null. NEVER fabricate quotes.
3. If a requirement is missing from creator content, "contentQuote" MUST be null.
4. If a claim is ambiguous, partial, or unverified, mark status as "NEEDS_REVIEW".
5. Keep explanations and fixes concise. Return raw JSON only with no surrounding text or commentary.`;

  const userPrompt = `DELIVERABLE FORMAT: ${deliverableType}
CAMPAIGN: ${campaignName}

PRE-CHECKED LITERAL FACTS:
${deterministicSummary}

<brand_brief>
${brief}
</brand_brief>

<creator_content>
${content}
</creator_content>

Audit the semantic talking points, benefit claims, and call-to-action against the brand brief. Return valid JSON only.`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`TIMEOUT_${timeoutMs}`));
  }, timeoutMs);

  const onExternalAbort = () => {
    controller.abort(new Error("CLIENT_ABORTED"));
  };
  if (externalSignal) {
    if (externalSignal.aborted) {
      clearTimeout(timeoutId);
      throw new Error("Analysis was cancelled by user.");
    }
    externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  let rawResponseBody = "";

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        stream: false,
        format: "json",
        options: {
          temperature: 0.1,
          num_predict: 1024,
        },
        keep_alive: "10m",
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 404) {
        throw new OllamaModelNotFoundError(
          `Ollama returned 404: Model '${model}' was not found. Please run 'ollama run ${model}' in your terminal.`,
          model
        );
      }
      throw new OllamaConnectionError(
        `Ollama returned HTTP error ${response.status}: ${response.statusText}`,
        baseUrl
      );
    }

    const data = await response.json();
    rawResponseBody = data.message?.content || "";
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (
      err instanceof OllamaConnectionError ||
      err instanceof OllamaModelNotFoundError
    ) {
      throw err;
    }

    if (externalSignal?.aborted) {
      throw new Error("Analysis was cancelled by user.");
    }

    const message = err instanceof Error ? err.message : String(err);
    const isTimeout =
      message.includes("TIMEOUT_") ||
      controller.signal.aborted ||
      message.toLowerCase().includes("aborted") ||
      message.toLowerCase().includes("timeout");

    if (isTimeout) {
      const seconds = Math.round(timeoutMs / 1000);
      throw new OllamaConnectionError(
        `Ollama query timed out after ${seconds} seconds on ${baseUrl}. Local model '${model}' was still generating. You can increase OLLAMA_TIMEOUT_MS in .env.local or run the instant deterministic check.`,
        baseUrl
      );
    }

    throw new OllamaConnectionError(
      `Cannot connect to Ollama at ${baseUrl}. Ensure Ollama is running ('ollama serve'). Error: ${message}`,
      baseUrl
    );
  } finally {
    clearTimeout(timeoutId);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }

  // Parse and validate LLM output
  let parsed;
  try {
    const cleanedJson = cleanJsonOutput(rawResponseBody);
    const rawParsed = JSON.parse(cleanedJson);
    const validationResult = LLMAnalysisOutputSchema.safeParse(rawParsed);
    if (!validationResult.success) {
      console.error("Schema validation failed on LLM output:", validationResult.error);
      throw new Error(
        `Gemma model output failed schema validation: ${validationResult.error.issues.map((i) => i.message).join(", ")}`
      );
    }
    parsed = validationResult.data;
  } catch (parseError: unknown) {
    const msg = parseError instanceof Error ? parseError.message : "Invalid JSON";
    console.error("Failed to parse LLM JSON output:", msg, rawResponseBody);
    throw new Error(
      `Model output was not in expected JSON format (${msg}). Gemma response could not be validated.`
    );
  }

  // Verify all evidence quotes returned by the LLM
  const verifiedLlmFindings: Finding[] = parsed.findings.map((f, idx) => {
    const briefQuote = verifyQuoteAgainstSource(f.briefQuote, brief, "brief");
    const contentQuote = verifyQuoteAgainstSource(f.contentQuote, content, "content");

    let status = f.status;
    let explanation = f.explanation;

    // Rule: Never allow an AI finding to PASS without supporting verified content evidence.
    // Flag ambiguous or unsupported AI conclusions as Needs Review.
    if (status === "PASS" && (!contentQuote || !contentQuote.verified)) {
      status = "NEEDS_REVIEW";
      explanation = `${f.explanation} (Flagged for creator review: The AI marked this as compliant, but could not locate verified verbatim evidence in the creator draft.)`;
    }

    // Flag unverified brief quotes
    if (briefQuote && !briefQuote.verified) {
      if (status === "PASS") {
        status = "NEEDS_REVIEW";
      }
      explanation = `${explanation} (Note: Cited brief requirement could not be verified verbatim in brand brief text.)`;
    }

    return {
      id: `llm-finding-${idx + 1}`,
      title: f.title,
      category: f.category,
      status,
      severity: f.severity,
      briefQuote,
      contentQuote,
      explanation,
      suggestedFix: f.suggestedFix || null,
      sourceType: "llm",
      verificationMethod: "AI Semantic Check",
    };
  });

  // Merge findings, prioritizing deterministic findings for exact code/hashtag/disclosure checks
  const mergedFindings = mergeFindings(deterministicFindings, verifiedLlmFindings);

  // Compute overall score derived strictly from actual findings
  const counts = computeCounts(mergedFindings);
  const overallScore = calculateOverallScore(mergedFindings);
  const complianceStatus = determineComplianceStatus(mergedFindings, overallScore);

  return {
    id: `report-${Date.now()}`,
    timestamp: new Date().toISOString(),
    campaignName,
    deliverableType,
    overallScore,
    complianceStatus,
    summary: parsed.summary,
    counts,
    findings: mergedFindings,
    deterministicMetrics: metrics,
    sourceStats,
    executionMeta: {
      modelUsed: model,
      ollamaBaseUrl: baseUrl,
      analysisMode: "ollama",
      durationMs: Date.now() - startTime,
      ollamaAvailable: true,
    },
  };
}

/**
 * Fallback mode when user chooses deterministic-only analysis.
 * Generates an evidence-backed report based strictly on deterministic rules, with NO fake AI claims.
 */
export function analyzeDeterministicOnly(
  brief: string,
  content: string,
  deliverableType: DeliverableType = "YOUTUBE_INTEGRATION",
  campaignName: string = "Sponsored Campaign",
  ollamaErrorReason?: string
): CampaignReport {
  const startTime = Date.now();
  const { baseUrl } = getOllamaConfig();

  const { metrics, findings } = runDeterministicAnalysis(brief, content);
  const sourceStats = calculateSourceStats(brief, content);

  // Additional semantic heuristic checks with full sentence quoting
  // 1. Call to action check
  const ctaMatch = content.match(
    /\b(link in|check out|click|visit|head to|head over to|grab your|save today|sign up)\b/i
  );
  if (ctaMatch) {
    const fullSentence = extractFullSentence(content, ctaMatch[0]) || ctaMatch[0];
    findings.push({
      id: "det-cta-pass",
      title: "Call to Action detected in content",
      category: "CALL_TO_ACTION",
      status: "PASS",
      severity: "IMPORTANT",
      briefQuote: null,
      contentQuote: verifyQuoteAgainstSource(fullSentence, content, "content"),
      explanation: `A clear call to action directing viewers/readers to take action was detected: "${fullSentence}".`,
      suggestedFix: null,
      sourceType: "deterministic",
      verificationMethod: "Exact Text Match",
    });
  } else {
    findings.push({
      id: "det-cta-missing",
      title: "Clear Call to Action is missing",
      category: "CALL_TO_ACTION",
      status: "MISSING",
      severity: "IMPORTANT",
      briefQuote: null,
      contentQuote: null,
      explanation:
        "No prominent Call to Action phrase (such as 'click the link below', 'visit our sponsor', or 'use code') was recognized in the script.",
      suggestedFix:
        "Add a clear closing statement: 'Click the link in the description or head to [sponsor link] and use my code for your discount!'",
      sourceType: "deterministic",
      verificationMethod: "Exact Text Match",
    });
  }

  // 2. Length check relative to deliverable
  if (deliverableType === "YOUTUBE_INTEGRATION") {
    if (sourceStats.estimatedReadTimeSeconds < 45) {
      findings.push({
        id: "det-length-short",
        title: "Integration pacing appears shorter than standard brief requirements (45-90s)",
        category: "TONE_AND_SPECS",
        status: "NEEDS_REVIEW",
        severity: "RECOMMENDED",
        briefQuote: null,
        contentQuote: null,
        explanation: `Estimated spoken duration is ~${sourceStats.estimatedSpeakingTimeFormatted} (${sourceStats.contentWordCount} words). Most YouTube sponsor integrations contractually mandate 60 seconds minimum.`,
        suggestedFix:
          "Expand on a personal experience or demonstrate the product workflow to reach at least 120-140 words.",
        sourceType: "deterministic",
        verificationMethod: "Calculated Check",
      });
    } else {
      findings.push({
        id: "det-length-pass",
        title: "Script length aligns with standard YouTube integration specs",
        category: "TONE_AND_SPECS",
        status: "PASS",
        severity: "RECOMMENDED",
        briefQuote: null,
        contentQuote: null,
        explanation: `Estimated spoken duration is ~${sourceStats.estimatedSpeakingTimeFormatted} (${sourceStats.contentWordCount} words), fitting typical 60-90 second mid-roll requirements.`,
        suggestedFix: null,
        sourceType: "deterministic",
        verificationMethod: "Calculated Check",
      });
    }
  }

  const counts = computeCounts(findings);
  const overallScore = calculateOverallScore(findings);
  const complianceStatus = determineComplianceStatus(findings, overallScore);

  const summary = ollamaErrorReason
    ? `Deterministic Rule Audit (Ollama Offline: ${ollamaErrorReason}). Evaluated exact promo codes, custom links, hashtags, disclosure phrase detection, and prohibited claims.`
    : `Deterministic Rule Audit completed. Analyzed promo codes, hashtags, commercial disclosures, URLs, and prohibited claims.`;

  return {
    id: `report-${Date.now()}`,
    timestamp: new Date().toISOString(),
    campaignName,
    deliverableType,
    overallScore,
    complianceStatus,
    summary,
    counts,
    findings,
    deterministicMetrics: metrics,
    sourceStats,
    executionMeta: {
      modelUsed: "Deterministic Rules Engine",
      ollamaBaseUrl: baseUrl,
      analysisMode: "deterministic_fallback",
      durationMs: Date.now() - startTime,
      ollamaAvailable: false,
    },
  };
}

/**
 * Merges findings: ensures deterministic findings (which are ground truth) take precedence,
 * and semantic LLM findings enrich the analysis without duplicate code/hashtag/disclosure checks.
 */
function mergeFindings(
  deterministicFindings: Finding[],
  llmFindings: Finding[]
): Finding[] {
  const merged: Finding[] = [...deterministicFindings];

  for (const llmF of llmFindings) {
    const isDuplicate = deterministicFindings.some((detF) => {
      if (
        (detF.category === "PROMO_AND_LINKS" && llmF.category === "PROMO_AND_LINKS") ||
        (detF.category === "DISCLOSURES" && llmF.category === "DISCLOSURES") ||
        (detF.category === "PROHIBITED_CONTENT" && llmF.category === "PROHIBITED_CONTENT")
      ) {
        const titleA = detF.title.toLowerCase();
        const titleB = llmF.title.toLowerCase();
        return (
          (titleA.includes("promo code") && titleB.includes("promo code")) ||
          (titleA.includes("hashtag") && titleB.includes("hashtag")) ||
          (titleA.includes("disclosure") && titleB.includes("disclosure")) ||
          (titleA.includes("link") && titleB.includes("link")) ||
          (titleA.includes("url") && titleB.includes("url"))
        );
      }
      return false;
    });

    if (!isDuplicate) {
      merged.push(llmF);
    }
  }

  return merged;
}
