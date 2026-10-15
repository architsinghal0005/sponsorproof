import type { EvidenceQuote } from "./types.ts";

export interface VerificationResult {
  verified: boolean;
  matchIndex: number;
  matchedText: string;
  note: string;
}

/**
 * Normalizes quotes, dashes, and whitespace to facilitate resilient substring search
 * without altering source text semantics.
 */
export function normalizeForSearch(text: string): string {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ");
}


function checkMatch(
  rawQuote: string,
  sourceText: string,
  sourceType: "brief" | "content"
): { verified: boolean; matchIndex?: number; length?: number; note?: string; text?: string } | null {
  if (!rawQuote || rawQuote.trim().length === 0) return null;
  const quote = rawQuote.trim();

  // 1. Direct verbatim exact match
  const exactIndex = sourceText.indexOf(quote);
  if (exactIndex !== -1) {
    return {
      text: quote,
      verified: true,
      matchIndex: exactIndex,
      length: quote.length,
      note: `Verified verbatim in ${sourceType} (character offset ${exactIndex})`,
    };
  }

  // 2. Case-insensitive verbatim match
  const lowerQuote = quote.toLowerCase();
  const lowerSource = sourceText.toLowerCase();
  const caseInsensitiveIndex = lowerSource.indexOf(lowerQuote);
  if (caseInsensitiveIndex !== -1) {
    const actualText = sourceText.slice(
      caseInsensitiveIndex,
      caseInsensitiveIndex + quote.length
    );
    return {
      text: actualText,
      verified: true,
      matchIndex: caseInsensitiveIndex,
      length: quote.length,
      note: `Verified in ${sourceType} (casing differed slightly)`,
    };
  }

  // 3. Normalized whitespace & punctuation match
  const normQuote = normalizeForSearch(quote).toLowerCase();
  const normSource = normalizeForSearch(sourceText).toLowerCase();
  const normIndex = normSource.indexOf(normQuote);
  if (normIndex !== -1) {
    return {
      text: quote,
      verified: true,
      matchIndex: normIndex,
      length: quote.length,
      note: `Verified in ${sourceType} (normalized punctuation/whitespace)`,
    };
  }

  // 4. Sub-phrase match if quote is long (>= 6 words, look for primary clause)
  const words = quote.split(/\s+/).filter(Boolean);
  if (words.length >= 6) {
    const subSnippet = words.slice(0, 5).join(" ").toLowerCase();
    const subIndex = lowerSource.indexOf(subSnippet);
    if (subIndex !== -1) {
      return {
        text: quote,
        verified: true,
        matchIndex: subIndex,
        length: quote.length,
        note: `Partial phrase match verified in ${sourceType}`,
      };
    }
  }

  return null;
}

/**
 * Verifies if an evidence quote actually appears inside the source document.
 * Returns verified status, location offsets, and explanation.
 */
export function verifyQuoteAgainstSource(
  quote: string | null | undefined,
  sourceText: string,
  sourceType: "brief" | "content"
): EvidenceQuote | null {
  if (!quote || quote.trim().length === 0) {
    return null;
  }

  const rawQuote = quote.trim();

  // Strip leading/trailing quotation marks if present (e.g. '"..."' or "“...”")
  const strippedQuote = rawQuote.replace(/^["'“”‘’]+|["'“”‘’]+$/g, "").trim();

  // Try direct match on raw or stripped quote
  let match = checkMatch(rawQuote, sourceText, sourceType);
  if (!match && strippedQuote.length > 0 && strippedQuote !== rawQuote) {
    match = checkMatch(strippedQuote, sourceText, sourceType);
  }

  // If still not matched, check if quote has an embedded quoted excerpt: '...' or "..."
  if (!match) {
    const innerQuotes = rawQuote.match(/['"“‘]([^'"“”‘’]{6,})['"”’]/g);
    if (innerQuotes) {
      for (const iq of innerQuotes) {
        const candidate = iq.replace(/^['"“‘]+|['"”’]+$/g, "").trim();
        const candidateMatch = checkMatch(candidate, sourceText, sourceType);
        if (candidateMatch) {
          match = candidateMatch;
          break;
        }
      }
    }
  }

  if (match) {
    return {
      text: match.text || rawQuote,
      verified: true,
      source: sourceType,
      matchIndex: match.matchIndex,
      length: match.length,
      verificationNote: match.note,
    };
  }

  // Quote not found - flag strictly as unverified to prevent AI hallucinations
  return {
    text: rawQuote,
    verified: false,
    source: sourceType,
    verificationNote: `Unverified: Text excerpt could not be located in ${sourceType}`,
  };
}
