// Guardrails applied to every AI response before it reaches the user.
// The model is helpful but not trusted: anything outside the rules is removed.

import { allowedSectionNumbers } from "./law";
import type {
  CaseAnalysis,
  ComplaintDraft,
  EvidenceItem,
  EvidenceKind,
  MatchedSection,
  NextMove,
  ReplyAnalysis,
  SellerTactic,
  TimelineEvent,
} from "./types";

const MAX_SECTIONS = 3;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function cleanText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().slice(0, maxLength);
}

function cleanDate(value: unknown): string {
  const text = cleanText(value, 10);
  if (ISO_DATE.test(text)) {
    return text;
  }
  return "";
}

function cleanTimeline(items: unknown): TimelineEvent[] {
  const result: TimelineEvent[] = [];
  if (!Array.isArray(items)) {
    return result;
  }
  for (const item of items) {
    if (result.length >= 10) {
      break;
    }
    const event = cleanText(item?.event, 300);
    if (event === "") {
      continue;
    }
    result.push({
      date: cleanDate(item?.date),
      event: event,
      evidence: cleanText(item?.evidence, 150),
    });
  }
  return result;
}

// Keeps only real sections from our law list, removes duplicates, max 3.
function cleanSections(items: unknown): MatchedSection[] {
  const allowed = allowedSectionNumbers();
  const result: MatchedSection[] = [];
  const seen: number[] = [];
  if (!Array.isArray(items)) {
    return result;
  }
  for (const item of items) {
    if (result.length >= MAX_SECTIONS) {
      break;
    }
    const sectionNumber = Number(item?.section);
    if (!allowed.includes(sectionNumber)) {
      continue; // the model invented or misused a section: drop it
    }
    if (seen.includes(sectionNumber)) {
      continue;
    }
    seen.push(sectionNumber);
    result.push({
      section: sectionNumber,
      reason: cleanText(item?.reason, 400),
      reasonBn: cleanText(item?.reasonBn, 400),
    });
  }
  return result;
}

function cleanStringList(items: unknown, maxItems: number, maxLength: number): string[] {
  const result: string[] = [];
  if (!Array.isArray(items)) {
    return result;
  }
  for (const item of items) {
    if (result.length >= maxItems) {
      break;
    }
    const text = cleanText(item, maxLength);
    if (text !== "") {
      result.push(text);
    }
  }
  return result;
}

function cleanAmount(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }
  return Math.round(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanAnalysis(raw: any): CaseAnalysis {
  const isConsumerCase = raw?.isConsumerCase !== false;
  let sections = cleanSections(raw?.matchedSections);
  if (!isConsumerCase) {
    sections = [];
  }

  let confidence: CaseAnalysis["confidence"] = "medium";
  if (raw?.confidence === "high" || raw?.confidence === "low") {
    confidence = raw.confidence;
  }
  // If no valid section survived, we cannot be highly confident.
  if (isConsumerCase && sections.length === 0) {
    confidence = "low";
  }

  return {
    summary: cleanText(raw?.summary, 500),
    summaryBn: cleanText(raw?.summaryBn, 500),
    sellerName: cleanText(raw?.sellerName, 120),
    sellerContact: cleanText(raw?.sellerContact, 200),
    productOrService: cleanText(raw?.productOrService, 200),
    amountPaid: cleanAmount(raw?.amountPaid),
    paymentMethod: cleanText(raw?.paymentMethod, 60),
    transactionId: cleanText(raw?.transactionId, 60),
    incidentDate: cleanDate(raw?.incidentDate),
    timeline: cleanTimeline(raw?.timeline),
    matchedSections: sections,
    isConsumerCase: isConsumerCase,
    notConsumerReason: cleanText(raw?.notConsumerReason, 400),
    missingInfo: cleanStringList(raw?.missingInfo, 4, 200),
    confidence: confidence,
    demandMessageBn: isConsumerCase ? cleanText(raw?.demandMessageBn, 1500) : "",
    demandMessageEn: isConsumerCase ? cleanText(raw?.demandMessageEn, 1500) : "",
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanComplaint(raw: any, availableEvidenceCount: number): ComplaintDraft {
  // The letter numbers the attachments itself, so remove any "১." or "1)" the AI added,
  // and never list more attachments than actually exist.
  const evidence: string[] = [];
  for (const item of cleanStringList(raw?.evidenceListBn, availableEvidenceCount, 200)) {
    const withoutNumber = item.replace(/^\s*[0-9০-৯]+\s*[.)।:-]\s*/, "").trim();
    if (withoutNumber !== "") {
      evidence.push(withoutNumber);
    }
  }
  return {
    subjectBn: cleanText(raw?.subjectBn, 300),
    bodyParagraphsBn: cleanStringList(raw?.bodyParagraphsBn, 6, 1200),
    reliefBn: cleanText(raw?.reliefBn, 800),
    evidenceListBn: evidence,
  };
}

const EVIDENCE_KINDS: EvidenceKind[] = ["payment_proof", "order_proof", "chat", "product_photo", "other"];

// One item per uploaded screenshot, in order, even if the AI skipped one.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanEvidence(raw: any, imageCount: number): EvidenceItem[] {
  const result: EvidenceItem[] = [];
  const items = Array.isArray(raw?.items) ? raw.items : [];
  for (let index = 0; index < imageCount; index++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let found: any = null;
    for (const item of items) {
      if (Number(item?.index) === index) {
        found = item;
        break;
      }
    }
    if (found === null) {
      result.push({ index: index, kind: "other", summary: "Could not read this screenshot.", facts: [], readable: false });
      continue;
    }
    let kind: EvidenceKind = "other";
    if (EVIDENCE_KINDS.includes(found.kind)) {
      kind = found.kind;
    }
    result.push({
      index: index,
      kind: kind,
      summary: cleanText(found.summary, 200),
      facts: cleanStringList(found.facts, 6, 120),
      readable: found.readable !== false,
    });
  }
  return result;
}

const TACTICS: SellerTactic[] = [
  "refund_offered",
  "replacement_offered",
  "partial_offer",
  "stalling",
  "denial",
  "blame_shifting",
  "threat_or_abuse",
  "asks_for_info",
  "other",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function cleanReply(raw: any, earlierTurns: number): ReplyAnalysis {
  let tactic: SellerTactic = "other";
  if (TACTICS.includes(raw?.tactic)) {
    tactic = raw.tactic;
  }

  let nextMove: NextMove = "counter";
  if (raw?.nextMove === "accept" || raw?.nextMove === "escalate") {
    nextMove = raw.nextMove;
  }

  // Safety rules applied in code, whatever the AI said:
  // 1. Threats or abuse: stop replying and escalate.
  // 2. Denial: escalate.
  // 3. A third round of excuses: escalate instead of replying forever.
  const isExcuse = tactic === "stalling" || tactic === "blame_shifting" || tactic === "partial_offer";
  if (tactic === "threat_or_abuse" || tactic === "denial") {
    nextMove = "escalate";
  } else if (isExcuse && earlierTurns >= 2) {
    nextMove = "escalate";
  }

  let replyBn = cleanText(raw?.replyBn, 1200);
  let replyEn = cleanText(raw?.replyEn, 1200);
  if (tactic === "threat_or_abuse") {
    replyBn = "";
    replyEn = "";
  }

  return {
    tactic: tactic,
    tacticExplainEn: cleanText(raw?.tacticExplainEn, 400),
    tacticExplainBn: cleanText(raw?.tacticExplainBn, 400),
    nextMove: nextMove,
    nextMoveReason: cleanText(raw?.nextMoveReason, 300),
    replyBn: replyBn,
    replyEn: replyEn,
  };
}
