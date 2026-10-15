import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  runDeterministicAnalysis,
  findHashtagMatch,
  evaluateFtcDisclosures,
  calculateOverallScore,
  computeCounts,
  determineComplianceStatus,
} from "../src/lib/deterministic.ts";
import { verifyQuoteAgainstSource } from "../src/lib/quoteVerifier.ts";
import {
  analyzeDeterministicOnly,
  cleanJsonOutput,
  checkOllamaStatus,
} from "../src/lib/ollamaClient.ts";
import { LLMAnalysisOutputSchema } from "../src/lib/types.ts";

describe("SponsorProof Comprehensive Audit & Verification Suite", () => {
  // Test 1: Correct versus incorrect promo codes
  test("1. Correct versus incorrect promo codes", () => {
    const brief = "Brand brief: Must use discount code CREATOR70 for 70% off.";

    // Correct code present in content
    const contentPass = "Check out our sponsor! Use promo code CREATOR70 at checkout.";
    const reportPass = runDeterministicAnalysis(brief, contentPass);
    const passFinding = reportPass.findings.find((f) =>
      f.id.includes("det-code-pass")
    );
    assert.ok(passFinding, "Should generate a PASS finding for matching code");
    assert.equal(passFinding?.status, "PASS");
    assert.equal(passFinding?.verificationMethod, "Exact Text Match");
    assert.ok(passFinding?.contentQuote?.verified, "Content quote must be verified");

    // Incorrect code in content
    const contentFail = "Check out our sponsor! Use promo code SAVE20 at checkout.";
    const reportFail = runDeterministicAnalysis(brief, contentFail);
    const missingFinding = reportFail.findings.find((f) =>
      f.id.includes("det-code-missing")
    );
    assert.ok(missingFinding, "Should generate a MISSING finding for wrong code");
    assert.equal(missingFinding?.status, "MISSING");
    assert.equal(missingFinding?.contentQuote, null);
  });

  // Test 2: One present hashtag and multiple missing hashtags
  test("2. One present hashtag and multiple missing hashtags evaluated independently", () => {
    const brief = `
Requirements:
Required hashtags: #NordPartner #OnlinePrivacy #ad
Promo Code: CREATOR70
`.trim();

    // Content contains ONLY #NordPartner, missing #OnlinePrivacy and #ad
    const content = `
Sponsored by NordShield VPN.
Use code CREATOR70 for 70% off.
Thank you for watching! #NordPartner
`.trim();

    const analysis = runDeterministicAnalysis(brief, content);

    // Look for hashtag findings
    const hashtagFindings = analysis.findings.filter((f) =>
      f.id.includes("det-hashtag-")
    );

    // Must have findings for each required hashtag independently
    assert.equal(
      hashtagFindings.length,
      3,
      "Must generate 3 separate hashtag findings for 3 required hashtags"
    );

    const nordPartnerFinding = hashtagFindings.find((f) =>
      f.id.includes("nordpartner")
    );
    const onlinePrivacyFinding = hashtagFindings.find((f) =>
      f.id.includes("onlineprivacy")
    );
    const adFinding = hashtagFindings.find((f) => f.id.includes("ad"));

    // #NordPartner must PASS with evidence
    assert.ok(nordPartnerFinding, "Must have finding for #NordPartner");
    assert.equal(nordPartnerFinding?.status, "PASS");
    assert.ok(
      nordPartnerFinding?.contentQuote?.verified,
      "Content quote for #NordPartner must be verified"
    );

    // #OnlinePrivacy must be MISSING
    assert.ok(onlinePrivacyFinding, "Must have finding for #OnlinePrivacy");
    assert.equal(onlinePrivacyFinding?.status, "MISSING");
    assert.equal(
      onlinePrivacyFinding?.contentQuote,
      null,
      "Content quote for missing #OnlinePrivacy must be null"
    );

    // #ad must be MISSING
    assert.ok(adFinding, "Must have finding for #ad");
    assert.equal(adFinding?.status, "MISSING");
    assert.equal(
      adFinding?.contentQuote,
      null,
      "Content quote for missing #ad must be null"
    );

    // Ensure metrics properly record matched vs missing
    assert.deepEqual(analysis.metrics.matchedHashtags, ["#nordpartner"]);
    assert.ok(analysis.metrics.missingHashtags.includes("#onlineprivacy"));
    assert.ok(analysis.metrics.missingHashtags.includes("#ad"));
  });

  // Test 3: Case-insensitive hashtag matching & boundary isolation
  test("3. Case-insensitive hashtag matching and boundary boundaries", () => {
    const content = "Loving the new security features! #nordpartner and #ad in this video.";

    // Case-insensitive match with boundary
    const matchLower = findHashtagMatch(content, "#NordPartner");
    assert.equal(matchLower.matched, true);
    assert.equal(matchLower.text, "#nordpartner");

    const matchUpper = findHashtagMatch(content, "#NORDPARTNER");
    assert.equal(matchUpper.matched, true);

    const matchAd = findHashtagMatch(content, "#ad");
    assert.equal(matchAd.matched, true);

    // Boundary check: #NordPartnerExtra should NOT match #NordPartner
    const contentWithSuffix = "Check out our #NordPartnerExtra deal!";
    const falseMatch = findHashtagMatch(contentWithSuffix, "#NordPartner");
    assert.equal(
      falseMatch.matched,
      false,
      "#NordPartner should NOT match #NordPartnerExtra"
    );

    // Boundary check: #advertisement should NOT match #ad
    const contentWithAdWord = "Check out this #advertisement today.";
    const falseAdMatch = findHashtagMatch(contentWithAdWord, "#ad");
    assert.equal(falseAdMatch.matched, false, "#ad should NOT match #advertisement");
  });

  // Test 4: Missing versus present sponsorship disclosures
  test("4. Missing versus present sponsorship disclosures with non-legal certification notice", () => {
    // Present disclosure
    const compliantText = "Sponsored by NordShield VPN. Enjoy the video!";
    const ftcCheckPass = evaluateFtcDisclosures(compliantText);
    assert.equal(ftcCheckPass.compliant, true);
    assert.ok(ftcCheckPass.termsFound.some((t) => t.toLowerCase() === "sponsored by"));

    const brief = "Must include sponsor disclosure.";
    const reportPass = runDeterministicAnalysis(brief, compliantText);
    const ftcPassFinding = reportPass.findings.find((f) =>
      f.id.includes("det-ftc-pass")
    );
    assert.ok(ftcPassFinding);
    assert.equal(ftcPassFinding?.status, "PASS");
    assert.match(
      ftcPassFinding?.title || "",
      /disclosure phrase detected/i,
      "Title must specify disclosure phrase detected, not claim full legal compliance"
    );
    assert.match(
      ftcPassFinding?.explanation || "",
      /automated assistance tool, not a legal certification/i,
      "Explanation must emphasize it is an assistance tool, not a legal certification"
    );

    // Missing disclosure
    const nonCompliantText = "Hey everyone, check out this great software tool!";
    const ftcCheckFail = evaluateFtcDisclosures(nonCompliantText);
    assert.equal(ftcCheckFail.compliant, false);

    const reportFail = runDeterministicAnalysis(brief, nonCompliantText);
    const ftcMissingFinding = reportFail.findings.find((f) =>
      f.id.includes("det-ftc-missing")
    );
    assert.ok(ftcMissingFinding);
    assert.equal(ftcMissingFinding?.status, "MISSING");
    assert.match(
      ftcMissingFinding?.explanation || "",
      /automated assistance tool, not a legal certification/i
    );
  });

  // Test 5: Genuine evidence quotations versus fabricated quotations
  test("5. Genuine evidence quotations versus fabricated quotations", () => {
    const briefText = "Must highlight the 30-day money-back guarantee with zero risk.";
    const contentText = "You get a 30-day money-back guarantee with zero risk.";

    // Verbatim quote in brief
    const validBriefQuote = verifyQuoteAgainstSource(
      "30-day money-back guarantee",
      briefText,
      "brief"
    );
    assert.ok(validBriefQuote);
    assert.equal(validBriefQuote?.verified, true);
    assert.equal(validBriefQuote?.source, "brief");

    // Verbatim quote in content
    const validContentQuote = verifyQuoteAgainstSource(
      "30-day money-back guarantee with zero risk",
      contentText,
      "content"
    );
    assert.ok(validContentQuote);
    assert.equal(validContentQuote?.verified, true);
    assert.equal(validContentQuote?.source, "content");

    // Fabricated / hallucinated quote not present in source text
    const hallucinatedQuote = verifyQuoteAgainstSource(
      "Military-grade quantum shield eliminates all known viruses",
      briefText,
      "brief"
    );
    assert.ok(hallucinatedQuote);
    assert.equal(
      hallucinatedQuote?.verified,
      false,
      "Hallucinated quote must strictly fail verification"
    );
    assert.match(
      hallucinatedQuote?.verificationNote || "",
      /Unverified/i,
      "Must include Unverified warning note"
    );
  });

  // Test 6: Semantic Call to Action uses complete sentence, not solitary word "link"
  test("6. Semantic Call to Action extracts complete sentence rather than single word 'link'", () => {
    const script = `
Before we get started, thanks to our sponsor NordShield.
They protect your internet connection seamlessly across all your devices.
Head over to nordshield.com/creator or click the link in the description to get 70% off!
Let us get into the tutorial.
`.trim();

    const report = analyzeDeterministicOnly(
      "Brand brief text",
      script,
      "YOUTUBE_INTEGRATION",
      "NordShield Test"
    );

    const ctaFinding = report.findings.find(
      (f) => f.category === "CALL_TO_ACTION" && f.status === "PASS"
    );
    assert.ok(ctaFinding, "Should detect CTA in content");
    assert.ok(ctaFinding?.contentQuote?.text, "CTA must have content quote");

    // Must NOT be just the solitary 4-letter word "link"
    assert.notEqual(
      ctaFinding?.contentQuote?.text?.trim(),
      "link",
      "Must not use generic single word 'link' as quote"
    );
    assert.ok(
      ctaFinding?.contentQuote?.text && ctaFinding.contentQuote.text.length > 15,
      "Must quote the full sentence"
    );
    assert.ok(
      ctaFinding?.contentQuote?.text?.includes("click the link in the description") ||
      ctaFinding?.contentQuote?.text?.includes("Head over to")
    );
  });

  // Test 7: Ollama unavailable or configured model missing
  test("7. Ollama unavailable or configured model missing handling", async () => {
    // Test checkOllamaStatus on an invalid port
    const badPortUrl = "http://127.0.0.1:59999";
    process.env.OLLAMA_BASE_URL = badPortUrl;
    process.env.OLLAMA_MODEL = "gemma3:1b";

    const status = await checkOllamaStatus();
    assert.equal(status.online, false);
    assert.equal(status.targetModelInstalled, false);
    assert.ok(status.error, "Should provide error message");
    assert.ok(status.helpInstructions && status.helpInstructions.length > 0);

    // Reset env
    process.env.OLLAMA_BASE_URL = "http://127.0.0.1:11434";
    process.env.OLLAMA_MODEL = "gemma3:1b";
  });

  // Test 8: Incorrect or malformed AI JSON output
  test("8. Incorrect or malformed AI JSON output is cleanly rejected", () => {
    // Markdown wrapped JSON
    const markdownWrapped = "```json\n{\"summary\": \"Clean\", \"findings\": []}\n```";
    const cleaned = cleanJsonOutput(markdownWrapped);
    assert.equal(cleaned, '{"summary": "Clean", "findings": []}');

    // Malformed JSON that breaks Zod schema (missing required fields)
    const malformedPayload = {
      summary: "Some summary",
      findings: [
        {
          title: "Invalid category finding",
          category: "NON_EXISTENT_CATEGORY",
          status: "PASS",
        },
      ],
    };
    const validation = LLMAnalysisOutputSchema.safeParse(malformedPayload);
    assert.equal(
      validation.success,
      false,
      "Zod schema must reject invalid categories"
    );

    // Invalid status (e.g. "MAYBE")
    const invalidStatusPayload = {
      summary: "Some summary",
      findings: [
        {
          title: "Test finding",
          category: "MANDATORY_TALKING_POINTS",
          status: "MAYBE",
          explanation: "Inconclusive",
        },
      ],
    };
    const statusValidation = LLMAnalysisOutputSchema.safeParse(invalidStatusPayload);
    assert.equal(
      statusValidation.success,
      false,
      "Zod schema must reject non-standard status values"
    );
  });

  // Test 9: Consistent finding counts, severity labels, filters and dynamic overall score
  test("9. Consistent finding counts, severity labels, filters and dynamic overall score", () => {
    const sampleFindings = [
      {
        id: "f-1",
        title: "Critical Promo Code",
        category: "PROMO_AND_LINKS",
        status: "PASS",
        severity: "CRITICAL", // weight 3
        briefQuote: null,
        contentQuote: null,
        explanation: "Code matches",
        suggestedFix: null,
        sourceType: "deterministic",
        verificationMethod: "Exact Text Match",
      },
      {
        id: "f-2",
        title: "Missing Hashtag",
        category: "PROMO_AND_LINKS",
        status: "MISSING",
        severity: "IMPORTANT", // weight 2
        briefQuote: null,
        contentQuote: null,
        explanation: "Missing tag",
        suggestedFix: "Add tag",
        sourceType: "deterministic",
        verificationMethod: "Exact Text Match",
      },
      {
        id: "f-3",
        title: "Ambiguous feature claim",
        category: "MANDATORY_TALKING_POINTS",
        status: "NEEDS_REVIEW",
        severity: "RECOMMENDED", // weight 1
        briefQuote: null,
        contentQuote: null,
        explanation: "Partially stated",
        suggestedFix: "Clarify claim",
        sourceType: "llm",
        verificationMethod: "AI Semantic Check",
      },
    ];

    // Compute counts
    const counts = computeCounts(sampleFindings);
    assert.equal(counts.pass, 1);
    assert.equal(counts.missing, 1);
    assert.equal(counts.needsReview, 1);
    assert.equal(counts.total, 3);
    assert.equal(counts.pass + counts.missing + counts.needsReview, counts.total);

    // Dynamic score derivation
    // Total weight = 3 (CRITICAL) + 2 (IMPORTANT) + 1 (RECOMMENDED) = 6
    // Earned score = (3 * 1.0) + (2 * 0) + (1 * 0.4) = 3.4
    // Score = Math.round((3.4 / 6) * 100) = Math.round(56.666) = 57
    const score = calculateOverallScore(sampleFindings);
    assert.equal(score, 57, "Score must be mathematically derived from findings");

    // Compliance status
    const status = determineComplianceStatus(sampleFindings, score);
    assert.equal(status, "HIGH_RISK_VIOLATIONS"); // Because score < 60

    // Perfect findings: 100%
    const perfectFindings = sampleFindings.map((f) => ({
      ...f,
      status: "PASS",
    }));
    const perfectScore = calculateOverallScore(perfectFindings);
    assert.equal(perfectScore, 100);
    const perfectStatus = determineComplianceStatus(perfectFindings, perfectScore);
    assert.equal(perfectStatus, "READY_TO_POST");
  });
});
