import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { LLMAnalysisOutputSchema } from "../src/lib/types.ts";

describe("LLM Schema Validation & Parsing", () => {
  test("validates compliant JSON schema output", () => {
    const validOutput = {
      summary: "Campaign fulfills all core talking points with minor wording suggestions.",
      findings: [
        {
          title: "Promo Code Included",
          category: "PROMO_AND_LINKS",
          status: "PASS",
          severity: "CRITICAL",
          briefQuote: "Code: CREATOR70",
          contentQuote: "use code CREATOR70",
          explanation: "Promo code matches exact casing.",
          suggestedFix: null,
        },
        {
          title: "Money-back guarantee mentioned",
          category: "MANDATORY_TALKING_POINTS",
          status: "PASS",
          severity: "IMPORTANT",
          briefQuote: "30-day money-back guarantee",
          contentQuote: "30-day money-back guarantee with zero risk",
          explanation: "Accurately stated in script.",
          suggestedFix: null,
        },
      ],
    };

    const parsed = LLMAnalysisOutputSchema.safeParse(validOutput);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.findings.length, 2);
    }
  });

  test("rejects malformed categories or invalid status types", () => {
    const invalidOutput = {
      summary: "Short summary",
      findings: [
        {
          title: "Unknown category finding",
          category: "INVALID_CATEGORY_NAME",
          status: "PASS",
          severity: "IMPORTANT",
          explanation: "Invalid category",
        },
      ],
    };

    const parsed = LLMAnalysisOutputSchema.safeParse(invalidOutput);
    assert.equal(parsed.success, false);
  });
});
