// Evidence strength, computed in plain code (not by the AI).
//
// A strong consumer complaint proves four things. Each is worth 25 points:
//   1. You paid           -> payment screenshot
//   2. What was promised  -> order page, post or advertisement
//   3. What went wrong    -> photo of the product, or a chat showing the problem
//   4. You tried to fix it -> chat with the seller, or the Stage 1 demand logged by Ovijog
//
// A fact the user only wrote in the story earns 10 points instead of 25,
// because DNCRP officers will ask for proof.

import type { Case, CaseAnalysis, EvidenceItem, EvidenceKind } from "./types";

export type CheckState = "proved" | "stated" | "missing";

export interface EvidenceCheck {
  key: string;
  label: string;
  state: CheckState;
  points: number;
  source: string; // which screenshot or statement satisfied it
  tip: string; // what to add when it is not proved
}

export interface EvidenceScore {
  total: number; // 0-100
  level: "strong" | "fair" | "weak";
  checks: EvidenceCheck[];
}

const FULL = 25;
const PARTIAL = 10;

function screenshotsOfKind(items: EvidenceItem[], kinds: EvidenceKind[]): number[] {
  const numbers: number[] = [];
  for (const item of items) {
    if (item.readable && kinds.includes(item.kind)) {
      numbers.push(item.index + 1);
    }
  }
  return numbers;
}

function describe(numbers: number[]): string {
  if (numbers.length === 1) {
    return `Screenshot ${numbers[0]}`;
  }
  return `Screenshots ${numbers.join(", ")}`;
}

function makeCheck(
  key: string,
  label: string,
  proofNumbers: number[],
  statedInStory: boolean,
  statedSource: string,
  tip: string,
): EvidenceCheck {
  if (proofNumbers.length > 0) {
    return { key, label, state: "proved", points: FULL, source: describe(proofNumbers), tip: "" };
  }
  if (statedInStory) {
    return { key, label, state: "stated", points: PARTIAL, source: statedSource, tip };
  }
  return { key, label, state: "missing", points: 0, source: "", tip };
}

export function scoreEvidence(item: Case): EvidenceScore {
  return scoreEvidenceParts(item.evidence || [], item.analysis, item.demandSentAt);
}

export function scoreEvidenceParts(evidence: EvidenceItem[], analysis: CaseAnalysis, demandSentAt: string): EvidenceScore {
  const checks: EvidenceCheck[] = [];

  checks.push(
    makeCheck(
      "payment",
      "You paid",
      screenshotsOfKind(evidence, ["payment_proof"]),
      analysis.amountPaid !== null || analysis.paymentMethod !== "",
      "Your story",
      "Add the receipt, or the bKash or Nagad SMS, showing the amount.",
    ),
  );

  checks.push(
    makeCheck(
      "promise",
      "What was promised",
      screenshotsOfKind(evidence, ["order_proof"]),
      analysis.productOrService !== "",
      "Your story",
      "Add the post, ad, order page, price tag or packaging that shows what was promised.",
    ),
  );

  checks.push(
    makeCheck(
      "problem",
      "What went wrong",
      screenshotsOfKind(evidence, ["product_photo", "chat"]),
      analysis.matchedSections.length > 0,
      "Your story",
      "Add a photo of what you received, or a chat where the problem is clear.",
    ),
  );

  // Contacting the seller: a chat screenshot, or Ovijog's own record of the demand.
  const chatNumbers = screenshotsOfKind(evidence, ["chat"]);
  if (chatNumbers.length > 0) {
    checks.push({ key: "contact", label: "You tried to fix it", state: "proved", points: FULL, source: describe(chatNumbers), tip: "" });
  } else if (demandSentAt !== "") {
    checks.push({
      key: "contact",
      label: "You tried to fix it",
      state: "proved",
      points: FULL,
      source: "Stage 1 demand logged by Ovijog",
      tip: "",
    });
  } else {
    checks.push({
      key: "contact",
      label: "You tried to fix it",
      state: "missing",
      points: 0,
      source: "",
      tip: "Send the Stage 1 demand below. Ovijog records it as evidence.",
    });
  }

  let total = 0;
  for (const check of checks) {
    total += check.points;
  }

  let level: EvidenceScore["level"] = "weak";
  if (total >= 75) {
    level = "strong";
  } else if (total >= 45) {
    level = "fair";
  }

  return { total, level, checks };
}

// One line per screenshot, given to the AI in step 2.
export function evidenceAsText(items: EvidenceItem[]): string {
  const lines: string[] = [];
  for (const item of items) {
    const readable = item.readable ? "" : " (hard to read)";
    lines.push(`Screenshot ${item.index + 1} [${item.kind}]${readable}: ${item.summary}`);
    for (const fact of item.facts) {
      lines.push(`  - ${fact}`);
    }
  }
  return lines.join("\n");
}
