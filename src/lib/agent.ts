// The Ovijog agent: the steps that turn a story and screenshots into a case.
// Server only. Used by /api/analyze (streamed to the browser) and by the eval script.
//
// Each step reports itself through `emit`, labelled honestly as done by the AI
// or by plain code, so the user can watch the agent work.

import { dataUrlToImage, generateJson, isMockMode, type ImageInput } from "./gemini";
import { analysisSchema, buildAnalysisPrompt, buildEvidencePrompt, evidenceSchema } from "./prompts";
import { cleanAnalysis, cleanEvidence } from "./validate";
import { computeDeadline, formatDate, formatTaka, todayIso } from "./deadline";
import { evidenceAsText, scoreEvidenceParts } from "./evidence";
import { findSection } from "./law";
import { mockAnalysis, mockEvidence } from "./mockAi";
import type { CaseAnalysis, EvidenceItem, TraceStep } from "./types";

export interface AgentInput {
  story: string;
  purchaseDate: string;
  images: string[]; // data URLs
}

export interface AgentResult {
  analysis: CaseAnalysis;
  evidence: EvidenceItem[];
  trace: TraceStep[];
}

const KIND_LABELS: Record<string, string> = {
  payment_proof: "payment proof",
  order_proof: "order or advertisement",
  chat: "chat with the seller",
  product_photo: "photo of the product",
  other: "other evidence",
};

export async function runCaseAgent(input: AgentInput, emit: (step: TraceStep) => void): Promise<AgentResult> {
  const trace: TraceStep[] = [];

  // Records a step and sends a copy to the browser.
  function report(step: TraceStep) {
    let replaced = false;
    for (let i = 0; i < trace.length; i++) {
      if (trace[i].id === step.id) {
        trace[i] = step;
        replaced = true;
      }
    }
    if (!replaced) {
      trace.push(step);
    }
    emit({ ...step, details: [...step.details] });
  }

  const images: ImageInput[] = [];
  for (const dataUrl of input.images) {
    const image = dataUrlToImage(dataUrl);
    if (image !== null) {
      images.push(image);
    }
  }

  // ---- Step 1 (AI): read each screenshot ----
  const readStep: TraceStep = { id: "read", label: "Reading your screenshots", by: "ai", status: "running", details: [] };
  let evidence: EvidenceItem[] = [];
  if (images.length === 0) {
    readStep.status = "skipped";
    readStep.details.push("No screenshots added. The case will rely on your story.");
    report(readStep);
  } else {
    report(readStep);
    try {
      const raw = isMockMode()
        ? mockEvidence(images.length)
        : await generateJson<unknown>(buildEvidencePrompt(images.length), images, evidenceSchema);
      evidence = cleanEvidence(raw, images.length);
    } catch (error) {
      readStep.status = "failed";
      readStep.details.push("Could not read the screenshots.");
      report(readStep);
      throw error;
    }
    for (const item of evidence) {
      const keyFacts = item.facts.slice(0, 2).join("; ");
      readStep.details.push(
        `Screenshot ${item.index + 1}: ${KIND_LABELS[item.kind]}${item.readable ? "" : " (hard to read)"}${keyFacts ? ". " + keyFacts : ""}`,
      );
    }
    readStep.status = "done";
    report(readStep);
  }

  // ---- Step 2 (AI): understand the case and draft the demand ----
  const understandStep: TraceStep = { id: "understand", label: "Understanding your case", by: "ai", status: "running", details: [] };
  report(understandStep);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let raw: any;
  try {
    const prompt = buildAnalysisPrompt(input.story, input.purchaseDate, todayIso(), evidenceAsText(evidence));
    raw = isMockMode() ? mockAnalysis(input.story, input.purchaseDate) : await generateJson<unknown>(prompt, [], analysisSchema);
  } catch (error) {
    understandStep.status = "failed";
    understandStep.details.push("The AI could not analyse the case.");
    report(understandStep);
    throw error;
  }
  const analysis = cleanAnalysis(raw);
  understandStep.details.push(`Seller: ${analysis.sellerName || "not found"}`);
  understandStep.details.push(`Product: ${analysis.productOrService || "not found"}`);
  understandStep.details.push(`Amount: ${analysis.amountPaid !== null ? formatTaka(analysis.amountPaid) : "not found"}`);
  const eventCount = analysis.timeline.length;
  understandStep.details.push(`Timeline: ${eventCount} ${eventCount === 1 ? "event" : "events"}, each linked to its evidence`);
  if (analysis.demandMessageBn) {
    understandStep.details.push("Drafted the demand message to the seller in Bangla and English");
  }
  understandStep.status = "done";
  report(understandStep);

  // ---- Step 3 (code): check the law ----
  const lawStep: TraceStep = { id: "law", label: "Checking the law", by: "code", status: "running", details: [] };
  const rawCount = Array.isArray(raw?.matchedSections) ? raw.matchedSections.length : 0;
  if (!analysis.isConsumerCase) {
    lawStep.details.push("Not a consumer-rights case, so no section of the Act applies.");
  }
  for (const match of analysis.matchedSections) {
    const law = findSection(match.section);
    if (law) {
      lawStep.details.push(`Section ${law.section}: ${law.titleEn} (verified against the Act)`);
    }
  }
  const rejected = analysis.isConsumerCase ? rawCount - analysis.matchedSections.length : 0;
  if (rejected > 0) {
    lawStep.details.push(`Rejected ${rejected} suggestion(s) that are not in Ovijog's list of sections`);
  }
  lawStep.status = "done";
  report(lawStep);

  // ---- Step 4 (code): the 30-day deadline ----
  const deadlineStep: TraceStep = { id: "deadline", label: "Calculating your deadline", by: "code", status: "running", details: [] };
  const deadline = computeDeadline(analysis.incidentDate, input.purchaseDate);
  if (!deadline.known) {
    deadlineStep.details.push("No date found. Add the purchase date to see your deadline.");
  } else if (deadline.expired) {
    deadlineStep.details.push(`The 30 days ended on ${formatDate(deadline.lastDate)}.`);
  } else {
    deadlineStep.details.push(`Counted from ${formatDate(deadline.startDate)}: file by ${formatDate(deadline.lastDate)} (${deadline.daysLeft} days left)`);
  }
  deadlineStep.status = "done";
  report(deadlineStep);

  // ---- Step 5 (code): score the evidence ----
  const scoreStep: TraceStep = { id: "score", label: "Scoring your evidence", by: "code", status: "running", details: [] };
  const score = scoreEvidenceParts(evidence, analysis, "");
  scoreStep.details.push(`Evidence strength: ${score.total}/100 (${score.level})`);
  for (const check of score.checks) {
    if (check.state === "stated") {
      scoreStep.details.push(`Only in your story, not proved: ${check.label.toLowerCase()}`);
    } else if (check.state === "missing") {
      scoreStep.details.push(`Missing: ${check.label.toLowerCase()}`);
    }
  }
  scoreStep.status = "done";
  report(scoreStep);

  return { analysis, evidence, trace };
}
