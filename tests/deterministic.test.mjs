import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  extractPromoCodes,
  extractHashtags,
  extractLinks,
  evaluateFtcDisclosures,
  extractProhibitedRules,
  checkProhibitedContent,
  calculateSourceStats,
  runDeterministicAnalysis,
} from "../src/lib/deterministic.ts";

describe("Deterministic Matcher Engine", () => {
  test("extracts promo codes with keyword prefixes and standalone tokens", () => {
    const text1 = "Use code CREATOR70 for 70% off at checkout!";
    const codes1 = extractPromoCodes(text1);
    assert.deepEqual(codes1, ["CREATOR70"]);

    const text2 = "Promo Code: DAILYBOOST | coupon: SAVE20 | voucher = FREEBOX50";
    const codes2 = extractPromoCodes(text2);
    assert.ok(codes2.includes("DAILYBOOST"));
    assert.ok(codes2.includes("SAVE20"));
    assert.ok(codes2.includes("FREEBOX50"));
  });

  test("extracts hashtags accurately", () => {
    const text = "Thanks to the team #NordPartner #ad #OnlinePrivacy for this video!";
    const tags = extractHashtags(text);
    assert.deepEqual(tags, ["#nordpartner", "#ad", "#onlineprivacy"]);
  });

  test("extracts custom URLs and subpaths", () => {
    const text = "Visit nordshield.com/creator or https://vitalgreens.com/creator to grab the deal";
    const links = extractLinks(text);
    assert.ok(links.some((l) => l.includes("nordshield.com/creator")));
    assert.ok(links.some((l) => l.includes("vitalgreens.com/creator")));
  });

  test("detects FTC disclosures accurately", () => {
    const compliant1 = evaluateFtcDisclosures("Sponsored by NordShield VPN | #ad");
    assert.equal(compliant1.compliant, true);
    assert.ok(compliant1.termsFound.length > 0);

    const nonCompliant = evaluateFtcDisclosures("Hey guys check out this awesome tool I like.");
    assert.equal(nonCompliant.compliant, false);
    assert.equal(nonCompliant.termsFound.length, 0);
  });

  test("detects prohibited claims declared in brand brief", () => {
    const brief = `
BRAND SAFETY:
Do not say: 100% unhackable, completely anonymous
Prohibited words: cure, guaranteed immunity
Avoid mentioning: ExpressVPN, Surfshark
`.trim();

    const rules = extractProhibitedRules(brief);
    assert.ok(rules.some((r) => r.toLowerCase().includes("100% unhackable")));
    assert.ok(rules.some((r) => r.toLowerCase().includes("cure")));

    const scriptWithViolations = "This software is 100% unhackable and way better than ExpressVPN.";
    const foundViolations = checkProhibitedContent(scriptWithViolations, rules);
    assert.ok(foundViolations.length >= 1);
    assert.ok(foundViolations.some((v) => v.term.toLowerCase().includes("100% unhackable")));
  });

  test("calculates source stats and spoken timing correctly", () => {
    const brief = "This is a brief with seven words in total.";
    const content = new Array(140).fill("word").join(" "); // 140 words = ~60s spoken
    const stats = calculateSourceStats(brief, content);

    assert.equal(stats.briefWordCount, 9);
    assert.equal(stats.contentWordCount, 140);
    assert.equal(stats.estimatedReadTimeSeconds, 60);
    assert.equal(stats.estimatedSpeakingTimeFormatted, "1m 0s");
  });

  test("runDeterministicAnalysis produces findings for matched and missing promo codes", () => {
    const brief = "Use promo code CREATOR70 and link nordshield.com/creator #NordPartner";
    const passingScript = "Sponsored by NordShield. Use promo code CREATOR70 at nordshield.com/creator #NordPartner";
    const flawedScript = "Sponsored by NordShield. Use promo code CREATOR20 at nordshield.com/creator";

    const passResult = runDeterministicAnalysis(brief, passingScript);
    assert.ok(passResult.findings.some((f) => f.id.includes("det-code-pass") && f.status === "PASS"));

    const failResult = runDeterministicAnalysis(brief, flawedScript);
    assert.ok(failResult.findings.some((f) => f.id.includes("det-code-missing") && f.status === "MISSING"));
  });
});
