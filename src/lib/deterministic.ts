import type {
  DeterministicMetrics,
  Finding,
  SourceStats,
} from "./types.ts";
import { verifyQuoteAgainstSource } from "./quoteVerifier.ts";

// Standard FTC / regulatory disclosure markers
const FTC_DISCLOSURE_PATTERNS = [
  /\b#ad\b/i,
  /\b#sponsored\b/i,
  /\b#partner\b/i,
  /\b#brandpartner\b/i,
  /\b#paidpartnership\b/i,
  /\bsponsored by\b/i,
  /\bpaid partnership with\b/i,
  /\bin partnership with\b/i,
  /\bpartnered with\b/i,
  /\bthanks to .+ for sponsoring\b/i,
  /\bthank you to .+ for sponsoring\b/i,
  /\badvertisement\b/i,
];

/**
 * Extracts promo / coupon codes from text using keyword context and casing patterns
 */
export function extractPromoCodes(text: string): string[] {
  const codes = new Set<string>();

  // Pattern 1: Explicit keyword context: "code: CREATOR70", "promo code CREATOR70", "use code CREATOR70"
  const keywordRegex =
    /(?:code|promo(?:tion)?(?:\s*code)?|coupon|discount(?: code)?|voucher)\s*[:=-]?\s*["'`]?([A-Z0-9_-]{3,20})["'`]?/gi;
  let match;
  while ((match = keywordRegex.exec(text)) !== null) {
    const candidate = match[1].trim();
    if (isValidCodeCandidate(candidate)) {
      codes.add(candidate.toUpperCase());
    }
  }

  // Pattern 2: Standalone uppercase token with numbers or common promo affixes (e.g., CREATOR20, BOOST50, 70OFF)
  const standaloneRegex = /\b([A-Z]{3,12}[0-9]{1,4}|[0-9]{1,3}[A-Z]{3,8}|[A-Z]{4,15})\b/g;
  while ((match = standaloneRegex.exec(text)) !== null) {
    const candidate = match[1];
    // Filter out common English uppercase words
    const commonWords = new Set([
      "AND", "FOR", "WITH", "THIS", "THAT", "FROM", "HAVE", "MORE",
      "ONLY", "YOUR", "THEIR", "ABOUT", "WHAT", "WHEN", "WHERE", "WHICH",
      "BRIEF", "SCRIPT", "BRAND", "VIDEO", "TIKTOK", "YOUTUBE", "INSTAGRAM",
      "REELS", "PODCAST", "EPISODE", "CHANNEL", "LINK", "BELOW", "DESC",
      "BRAND", "BRIEF", "RULES", "SAFETY", "TERMS", "DISCLOSURE"
    ]);
    if (!commonWords.has(candidate) && /[0-9]/.test(candidate) && isValidCodeCandidate(candidate)) {
      codes.add(candidate.toUpperCase());
    }
  }

  return Array.from(codes);
}

function isValidCodeCandidate(token: string): boolean {
  if (token.length < 3 || token.length > 20) return false;
  // Must contain alphanumeric characters
  if (!/^[A-Za-z0-9_-]+$/.test(token)) return false;
  // Ignore single words like "THE", "YOU"
  if (/^[A-Za-z]{1,3}$/.test(token)) return false;
  return true;
}

/**
 * Extracts hashtags (e.g., #NordPartner, #ad)
 */
export function extractHashtags(text: string): string[] {
  const matches = text.match(/#[a-zA-Z0-9_]+/g);
  if (!matches) return [];
  const normalized = matches.map((tag) => tag.toLowerCase());
  return Array.from(new Set(normalized));
}

/**
 * Searches for a hashtag case-insensitively with appropriate hashtag boundaries
 * (e.g. #NordPartner matches '#nordpartner' but not '#nordpartners')
 */
export function findHashtagMatch(
  content: string,
  hashtag: string
): { matched: boolean; text?: string } {
  const clean = hashtag.startsWith("#") ? hashtag.slice(1) : hashtag;
  // Delimiter before # (start of string or non-word/non-hashtag character)
  // Delimiter after tag (end of string or non-word character)
  const regex = new RegExp(`(?:^|[^a-zA-Z0-9_])(#${clean})(?![a-zA-Z0-9_])`, "i");
  const match = content.match(regex);
  if (match) {
    return { matched: true, text: match[1] };
  }
  return { matched: false };
}

/**
 * Extracts URLs and custom campaign domains (e.g., nordshield.com/creator)
 */
export function extractLinks(text: string): string[] {
  const links = new Set<string>();

  // Full URLs
  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"')]+(?:\/[^\s<>"')]*)?/gi;
  let match;
  while ((match = urlRegex.exec(text)) !== null) {
    const clean = match[0].replace(/[.,;:!?]+$/, "");
    links.add(clean.toLowerCase());
  }

  // Brand subpaths: brand.com/creator or brand.io/creator
  const domainRegex = /\b([a-zA-Z0-9-]+\.(?:com|io|co|org|net|app|gg|tech|me)\/[a-zA-Z0-9_-]+)\b/gi;
  while ((match = domainRegex.exec(text)) !== null) {
    const clean = match[1].toLowerCase();
    links.add(clean);
  }

  return Array.from(links);
}

/**
 * Extracts the full sentence containing a given phrase or regex
 */
export function extractFullSentence(
  text: string,
  keyword: string | RegExp
): string | null {
  const sentences = text.split(/(?<=[.!?\n])\s+/);
  for (const s of sentences) {
    const clean = s.trim();
    if (!clean) continue;
    const matches =
      typeof keyword === "string"
        ? clean.toLowerCase().includes(keyword.toLowerCase())
        : keyword.test(clean);
    if (matches) {
      return clean;
    }
  }
  return null;
}

/**
 * Checks for mandatory FTC / ASA disclosure markers
 */
export function evaluateFtcDisclosures(content: string): {
  compliant: boolean;
  termsFound: string[];
} {
  const termsFound: string[] = [];

  for (const pattern of FTC_DISCLOSURE_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      termsFound.push(match[0]);
    }
  }

  return {
    compliant: termsFound.length > 0,
    termsFound: Array.from(new Set(termsFound)),
  };
}

/**
 * Extracts prohibited terms or claims declared in the brand brief
 * (e.g., "Do not say: 100% unhackable", "prohibited words: cure, guaranteed")
 */
export function extractProhibitedRules(brief: string): string[] {
  const prohibited: string[] = [];

  const sectionsRegex =
    /(?:do\s*not\s*(?:say|claim|mention|use)|prohibited|avoid|never\s*(?:say|claim)|blacklisted)\s*[:=-]?\s*([^\n\r]+)/gi;
  let match;
  while ((match = sectionsRegex.exec(brief)) !== null) {
    const line = match[1];
    // Split on commas, semicolons, or quotes
    const items = line.split(/[,;]|(?<=")\s*(?=")/);
    for (const item of items) {
      const clean = item.replace(/["'`.*]/g, "").trim();
      if (clean.length > 2 && !clean.toLowerCase().startsWith("e.g")) {
        prohibited.push(clean);
      }
    }
  }

  return Array.from(new Set(prohibited));
}

/**
 * Checks if creator content contains any prohibited claims or words
 */
export function checkProhibitedContent(
  content: string,
  rules: string[]
): { term: string; context: string }[] {
  const violations: { term: string; context: string }[] = [];
  const lowerContent = content.toLowerCase();

  for (const rule of rules) {
    const lowerRule = rule.toLowerCase().trim();
    if (!lowerRule) continue;

    const index = lowerContent.indexOf(lowerRule);
    if (index !== -1) {
      // Extract context around the violation
      const start = Math.max(0, index - 25);
      const end = Math.min(content.length, index + lowerRule.length + 25);
      const snippet = content.slice(start, end).replace(/\s+/g, " ");

      violations.push({
        term: rule,
        context: `"...${snippet}..."`,
      });
    }
  }

  return violations;
}

/**
 * Computes words, characters, and estimated speaking duration at ~140 words/minute
 */
export function calculateSourceStats(
  brief: string,
  content: string
): SourceStats {
  const briefWords = brief.trim().split(/\s+/).filter(Boolean).length;
  const contentWords = content.trim().split(/\s+/).filter(Boolean).length;
  const contentChars = content.length;

  const seconds = Math.round((contentWords / 140) * 60);
  const minutes = Math.floor(seconds / 60);
  const remSeconds = seconds % 60;
  const formattedTime =
    minutes > 0 ? `${minutes}m ${remSeconds}s` : `${seconds}s`;

  return {
    briefWordCount: briefWords,
    contentWordCount: contentWords,
    contentCharCount: contentChars,
    estimatedReadTimeSeconds: seconds,
    estimatedSpeakingTimeFormatted: formattedTime,
  };
}

/**
 * Runs full deterministic analysis on the brief and script
 */
export function runDeterministicAnalysis(
  brief: string,
  content: string
): {
  metrics: DeterministicMetrics;
  findings: Finding[];
} {
  const briefCodes = extractPromoCodes(brief);
  const contentCodes = extractPromoCodes(content);

  const matchedCodes = briefCodes.filter((c) =>
    contentCodes.includes(c) || content.toUpperCase().includes(c)
  );
  const missingCodes = briefCodes.filter(
    (c) => !matchedCodes.includes(c)
  );

  const briefHashtags = extractHashtags(brief);
  const contentHashtags = extractHashtags(content);

  // Check each hashtag independently with boundary matching
  const matchedHashtags: string[] = [];
  const missingHashtags: string[] = [];

  for (const tag of briefHashtags) {
    const check = findHashtagMatch(content, tag);
    if (check.matched) {
      matchedHashtags.push(tag);
    } else {
      missingHashtags.push(tag);
    }
  }

  const briefLinks = extractLinks(brief);
  const contentLinks = extractLinks(content);
  const matchedLinks = briefLinks.filter((l) =>
    contentLinks.some((cl) => cl.includes(l) || l.includes(cl))
  );
  const missingLinks = briefLinks.filter(
    (l) => !matchedLinks.includes(l)
  );

  const ftcEval = evaluateFtcDisclosures(content);
  const prohibitedRules = extractProhibitedRules(brief);
  const prohibitedFound = checkProhibitedContent(content, prohibitedRules);

  const metrics: DeterministicMetrics = {
    briefCodes,
    contentCodes,
    matchedCodes,
    missingCodes,
    briefHashtags,
    contentHashtags,
    matchedHashtags,
    missingHashtags,
    briefLinks,
    contentLinks,
    matchedLinks,
    missingLinks,
    ftcCompliant: ftcEval.compliant,
    ftcTermsFound: ftcEval.termsFound,
    prohibitedTermsFound: prohibitedFound,
  };

  const findings: Finding[] = [];

  // Finding 1: Promo Code checks (evaluated independently per code)
  if (briefCodes.length > 0) {
    for (const code of briefCodes) {
      const isMatched = matchedCodes.includes(code);
      if (isMatched) {
        findings.push({
          id: `det-code-pass-${code.toLowerCase()}`,
          title: `Promo Code '${code}' accurately included`,
          category: "PROMO_AND_LINKS",
          status: "PASS",
          severity: "CRITICAL",
          briefQuote: verifyQuoteAgainstSource(code, brief, "brief"),
          contentQuote: verifyQuoteAgainstSource(code, content, "content"),
          explanation: `The exact required discount code '${code}' is correctly present in the sponsored content.`,
          suggestedFix: null,
          sourceType: "deterministic",
          verificationMethod: "Exact Text Match",
        });
      } else {
        findings.push({
          id: `det-code-missing-${code.toLowerCase()}`,
          title: `Required Promo Code '${code}' is missing or misspelled`,
          category: "PROMO_AND_LINKS",
          status: "MISSING",
          severity: "CRITICAL",
          briefQuote: verifyQuoteAgainstSource(code, brief, "brief"),
          contentQuote: null,
          explanation: `The brand brief specifies discount code '${code}', but it does not appear in your content text. Sponsors routinely reject or penalize drafts missing the exact promo code.`,
          suggestedFix: `Add: "Use code ${code} at checkout for your exclusive discount."`,
          sourceType: "deterministic",
          verificationMethod: "Exact Text Match",
        });
      }
    }
  }

  // Finding 2: Hashtags check (EACH required hashtag evaluated independently)
  if (briefHashtags.length > 0) {
    for (const tag of briefHashtags) {
      const check = findHashtagMatch(content, tag);
      const tagId = tag.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (check.matched) {
        const foundText = check.text || tag;
        findings.push({
          id: `det-hashtag-pass-${tagId}`,
          title: `Required hashtag '${tag}' included`,
          category: "PROMO_AND_LINKS",
          status: "PASS",
          severity: "IMPORTANT",
          briefQuote: verifyQuoteAgainstSource(tag, brief, "brief"),
          contentQuote: verifyQuoteAgainstSource(foundText, content, "content"),
          explanation: `The required campaign hashtag '${tag}' was detected with proper boundaries in the content draft.`,
          suggestedFix: null,
          sourceType: "deterministic",
          verificationMethod: "Exact Text Match",
        });
      } else {
        findings.push({
          id: `det-hashtag-missing-${tagId}`,
          title: `Required hashtag '${tag}' is missing`,
          category: "PROMO_AND_LINKS",
          status: "MISSING",
          severity: "IMPORTANT",
          briefQuote: verifyQuoteAgainstSource(tag, brief, "brief"),
          contentQuote: null,
          explanation: `The brand brief specifies hashtag '${tag}', but it was not detected in the content or caption.`,
          suggestedFix: `Append '${tag}' to your caption, video description, or social post.`,
          sourceType: "deterministic",
          verificationMethod: "Exact Text Match",
        });
      }
    }
  }

  // Finding 3: Custom Campaign Links (evaluated independently)
  if (briefLinks.length > 0) {
    for (const link of briefLinks) {
      const isMatched = matchedLinks.includes(link);
      const linkId = link.toLowerCase().replace(/[^a-z0-9]/g, "");

      if (isMatched) {
        const fullContentSentence = extractFullSentence(content, link) || link;
        findings.push({
          id: `det-link-pass-${linkId}`,
          title: `Campaign URL '${link}' present`,
          category: "PROMO_AND_LINKS",
          status: "PASS",
          severity: "IMPORTANT",
          briefQuote: verifyQuoteAgainstSource(link, brief, "brief"),
          contentQuote: verifyQuoteAgainstSource(fullContentSentence, content, "content"),
          explanation: `The custom sponsor link '${link}' is present in the copy.`,
          suggestedFix: null,
          sourceType: "deterministic",
          verificationMethod: "Exact Text Match",
        });
      } else {
        findings.push({
          id: `det-link-missing-${linkId}`,
          title: `Required custom link '${link}' is missing`,
          category: "PROMO_AND_LINKS",
          status: "MISSING",
          severity: "IMPORTANT",
          briefQuote: verifyQuoteAgainstSource(link, brief, "brief"),
          contentQuote: null,
          explanation: `The brief mandates directing followers to '${link}', which is not present in the draft text.`,
          suggestedFix: `Add: "Click the link in description/bio: ${link}"`,
          sourceType: "deterministic",
          verificationMethod: "Exact Text Match",
        });
      }
    }
  }

  // Finding 4: Commercial Sponsorship / Regulatory Disclosure
  if (ftcEval.compliant) {
    const detectedPhrase = ftcEval.termsFound[0];
    const fullSentence = extractFullSentence(content, detectedPhrase) || detectedPhrase;

    findings.push({
      id: "det-ftc-pass",
      title: "Commercial sponsorship disclosure phrase detected",
      category: "DISCLOSURES",
      status: "PASS",
      severity: "CRITICAL",
      briefQuote: null,
      contentQuote: verifyQuoteAgainstSource(fullSentence, content, "content"),
      explanation: `Commercial sponsorship disclosure phrase was detected: "${ftcEval.termsFound.join('", "')}". Ensure the disclosure is placed prominently upfront and clearly audible/visible. Note: This result is an automated assistance tool, not a legal certification.`,
      suggestedFix: null,
      sourceType: "deterministic",
      verificationMethod: "Exact Text Match",
    });
  } else {
    findings.push({
      id: "det-ftc-missing",
      title: "No commercial sponsorship disclosure detected",
      category: "DISCLOSURES",
      status: "MISSING",
      severity: "CRITICAL",
      briefQuote: null,
      contentQuote: null,
      explanation: `No standard commercial sponsorship disclosure (such as #ad, #sponsored, or "sponsored by") was detected in the draft. Platform rules and regulatory guidelines (such as FTC/ASA) expect clear, conspicuous disclosure on all paid promotions. Note: This result is an automated assistance tool, not a legal certification.`,
      suggestedFix: `Include "#ad" or "Sponsored by [Brand]" within the first 3 lines of your caption or description and state it orally in video/audio.`,
      sourceType: "deterministic",
      verificationMethod: "Exact Text Match",
    });
  }

  // Finding 5: Prohibited Content / Claims Check
  if (prohibitedFound.length > 0) {
    for (const prohibited of prohibitedFound) {
      const probId = prohibited.term.toLowerCase().replace(/[^a-z0-9]/g, "");
      const fullSentence = extractFullSentence(content, prohibited.term) || prohibited.term;

      findings.push({
        id: `det-prohibited-${probId}`,
        title: `Prohibited term or claim detected: "${prohibited.term}"`,
        category: "PROHIBITED_CONTENT",
        status: "NEEDS_REVIEW",
        severity: "CRITICAL",
        briefQuote: verifyQuoteAgainstSource(prohibited.term, brief, "brief"),
        contentQuote: verifyQuoteAgainstSource(fullSentence, content, "content"),
        explanation: `The brief instructs creators to avoid "${prohibited.term}", but it was found in context: ${prohibited.context}. Brands may withhold approval or demand a revision for prohibited claims.`,
        suggestedFix: `Remove or rephrase "${prohibited.term}" to comply with brand safety guidelines.`,
        sourceType: "deterministic",
        verificationMethod: "Exact Text Match",
      });
    }
  }

  return { metrics, findings };
}

/**
 * Computes finding counts
 */
export function computeCounts(findings: Finding[]) {
  let pass = 0;
  let missing = 0;
  let needsReview = 0;

  for (const f of findings) {
    if (f.status === "PASS") pass++;
    else if (f.status === "MISSING") missing++;
    else if (f.status === "NEEDS_REVIEW") needsReview++;
  }

  return {
    pass,
    missing,
    needsReview,
    total: findings.length,
  };
}

/**
 * Calculates a weighted compliance score derived strictly from actual findings and severity.
 * CRITICAL = 3x weight, IMPORTANT = 2x weight, RECOMMENDED = 1x weight.
 * PASS = 100%, NEEDS_REVIEW = 40%, MISSING = 0%.
 */
export function calculateOverallScore(findings: Finding[]): number {
  if (findings.length === 0) return 100;

  let totalWeight = 0;
  let earnedScore = 0;

  for (const f of findings) {
    const weight =
      f.severity === "CRITICAL" ? 3 : f.severity === "IMPORTANT" ? 2 : 1;
    totalWeight += weight;

    if (f.status === "PASS") {
      earnedScore += weight * 1.0;
    } else if (f.status === "NEEDS_REVIEW") {
      earnedScore += weight * 0.4;
    } else {
      // MISSING yields 0
      earnedScore += 0;
    }
  }

  if (totalWeight === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((earnedScore / totalWeight) * 100)));
}

/**
 * Determines overall compliance status category based on score and severity
 */
export function determineComplianceStatus(
  findings: Finding[],
  overallScore: number
): "READY_TO_POST" | "CHANGES_REQUIRED" | "HIGH_RISK_VIOLATIONS" {
  const hasCriticalMissing = findings.some(
    (f) => f.severity === "CRITICAL" && f.status === "MISSING"
  );
  const hasProhibitedViolation = findings.some(
    (f) =>
      f.category === "PROHIBITED_CONTENT" &&
      (f.status === "NEEDS_REVIEW" || f.status === "MISSING")
  );

  if (hasCriticalMissing || hasProhibitedViolation || overallScore < 60) {
    return "HIGH_RISK_VIOLATIONS";
  }

  if (overallScore < 85 || findings.some((f) => f.status === "MISSING")) {
    return "CHANGES_REQUIRED";
  }

  return "READY_TO_POST";
}
