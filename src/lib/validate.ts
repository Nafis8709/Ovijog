// Guardrails applied to every AI response before it reaches the user.
// The model is helpful but not trusted: anything outside the rules is removed.

import { allowedSectionNumbers } from "./law";
import type { CaseAnalysis, ComplaintDraft, MatchedSection, TimelineEvent } from "./types";

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
export function cleanComplaint(raw: any): ComplaintDraft {
  return {
    subjectBn: cleanText(raw?.subjectBn, 300),
    bodyParagraphsBn: cleanStringList(raw?.bodyParagraphsBn, 6, 1200),
    reliefBn: cleanText(raw?.reliefBn, 800),
    evidenceListBn: cleanStringList(raw?.evidenceListBn, 10, 200),
  };
}
