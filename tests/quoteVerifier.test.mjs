import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  verifyQuoteAgainstSource,
} from "../src/lib/quoteVerifier.ts";

describe("Evidence Quote Verifier", () => {
  const briefText = `
BRAND BRIEF: NordShield VPN
Promo Code: CREATOR70 (case-sensitive)
Must mention the 30-day money-back guarantee.
Do not claim that the product makes you 100% unhackable.
Required hashtag: #NordPartner.
`.trim();

  const scriptText = `
Sponsored by NordShield VPN.
Use code CREATOR70 for 70% off. You get a 30-day money-back guarantee with zero risk.
#NordPartner #OnlinePrivacy
`.trim();

  test("verifies verbatim quotes in brief", () => {
    const quote = "30-day money-back guarantee";
    const result = verifyQuoteAgainstSource(quote, briefText, "brief");

    assert.ok(result);
    assert.equal(result.verified, true);
    assert.equal(result.text, quote);
    assert.equal(result.source, "brief");
    assert.ok(result.matchIndex !== undefined && result.matchIndex >= 0);
  });

  test("verifies case-insensitive quotes in content", () => {
    const quote = "creator70";
    const result = verifyQuoteAgainstSource(quote, scriptText, "content");

    assert.ok(result);
    assert.equal(result.verified, true);
    assert.equal(result.source, "content");
  });

  test("verifies quotes with normalized punctuation and curly quotes", () => {
    const textWithCurly = `NordShield’s “Threat Protection” actively blocks trackers.`;
    const quoteWithStraight = `NordShield's "Threat Protection" actively blocks trackers.`;

    const result = verifyQuoteAgainstSource(quoteWithStraight, textWithCurly, "content");
    assert.ok(result);
    assert.equal(result.verified, true);
  });

  test("strictly flags hallucinated quotes that do not exist in source text", () => {
    const fabricatedQuote = "Our quantum encryption cannot be cracked by any alien civilization.";
    const result = verifyQuoteAgainstSource(fabricatedQuote, briefText, "brief");

    assert.ok(result);
    assert.equal(result.verified, false);
    assert.match(result.verificationNote || "", /Unverified/);
  });

  test("handles empty or null quote gracefully", () => {
    assert.equal(verifyQuoteAgainstSource("", briefText, "brief"), null);
    assert.equal(verifyQuoteAgainstSource(null, briefText, "brief"), null);
    assert.equal(verifyQuoteAgainstSource(undefined, briefText, "brief"), null);
  });
});
