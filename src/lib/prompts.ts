// All prompts and JSON schemas for the Ovijog agent live here,
// so they are easy to read, test and improve in one place.

import { sectionCatalogueForPrompt, PROCEDURE, DIGITAL_COMMERCE_RULE } from "./law";
import type { ComplaintDraft } from "./types";

export type { ComplaintDraft };

// ---------- Step 1: analyse the case ----------

export function buildAnalysisPrompt(story: string, purchaseDate: string, today: string): string {
  return `You are Ovijog, an assistant that helps consumers in Bangladesh prepare complaints under the Consumers' Right Protection Act, 2009 (CRPA).
You are NOT a lawyer. You organise facts and draft messages. You never invent facts.

TODAY'S DATE (Bangladesh): ${today}
PURCHASE DATE GIVEN BY THE USER: ${purchaseDate || "not given"}

THE USER'S STORY (may be Bangla, English or Banglish):
"""
${story}
"""

Screenshots may be attached (order page, payment SMS, chat with seller, product photo). Read them carefully.

YOUR TASKS
1. Extract the facts: seller name, seller contact (page link, phone, website), product or service, amount paid in BDT, payment method, transaction ID.
   Use ONLY what the story or screenshots show. If something is not shown, use "" (or null for amount). Never guess a transaction ID or phone number.
2. Build a short timeline of events in date order. Dates must be YYYY-MM-DD. Convert relative dates ("gotokal", "last Friday") using today's date. If a date is unknown use "".
   For each event, say which evidence supports it (for example "Screenshot 2: bKash SMS" or "User's statement").
3. incidentDate = the date the problem happened (delivery of a wrong item, the day delivery became overdue, the day the seller blocked the user). YYYY-MM-DD or "".
4. Decide whether this is a consumer-rights matter (a business sold goods or a service for money and did not deliver what was promised, cheated on price, quality, weight, labels or expiry, used false advertising, or caused loss through negligent service).
   If it is NOT (for example a personal loan between friends, an online harassment case, a hacked account, a job scam with no purchase), set isConsumerCase=false and explain briefly in notConsumerReason.
5. Choose 1 to 3 sections that best fit, ONLY from this list. Do not use any other section number.
${sectionCatalogueForPrompt()}
   Supporting rule you may mention for online orders: ${DIGITAL_COMMERCE_RULE}
   For each section give the reason in English and in simple Bangla.
6. missingInfo: up to 4 short questions (in English) whose answers would make the complaint stronger (for example "Do you have the order confirmation screenshot?").
7. confidence: "high" if facts and evidence are clear, "medium" if some key facts are missing, "low" if the story is vague or contradictory.
8. Write the Stage 1 demand message to the SELLER in Bangla (demandMessageBn) and the same message in English (demandMessageEn). It must:
   - be polite, firm and short (under 120 words), suitable to paste into Facebook Messenger or WhatsApp;
   - state the order (product, amount, date, transaction ID if known) and the problem;
   - mention the Consumers' Right Protection Act 2009 and the section number(s) you chose;
   - ask for a full refund or a correct replacement within 3 days;
   - say that otherwise the buyer will file a complaint with the Directorate of National Consumer Rights Protection (DNCRP);
   - contain no insults, no threats of violence and no claims that are not in the facts.
9. summary / summaryBn: one or two sentences describing the case.

If isConsumerCase is false, still fill the facts, leave matchedSections empty and set demandMessageBn and demandMessageEn to "".

Complaints must be filed within ${PROCEDURE.deadlineDays} days of the cause of action (${PROCEDURE.deadlineSection}). You do not need to calculate the deadline; the app does that.`;
}

const timelineItemSchema = {
  type: "object",
  properties: {
    date: { type: "string" },
    event: { type: "string" },
    evidence: { type: "string" },
  },
  required: ["date", "event", "evidence"],
};

const sectionItemSchema = {
  type: "object",
  properties: {
    section: { type: "integer" },
    reason: { type: "string" },
    reasonBn: { type: "string" },
  },
  required: ["section", "reason", "reasonBn"],
};

export const analysisSchema = {
  type: "object",
  properties: {
    summary: { type: "string" },
    summaryBn: { type: "string" },
    sellerName: { type: "string" },
    sellerContact: { type: "string" },
    productOrService: { type: "string" },
    amountPaid: { type: ["number", "null"] },
    paymentMethod: { type: "string" },
    transactionId: { type: "string" },
    incidentDate: { type: "string" },
    timeline: { type: "array", items: timelineItemSchema },
    matchedSections: { type: "array", items: sectionItemSchema },
    isConsumerCase: { type: "boolean" },
    notConsumerReason: { type: "string" },
    missingInfo: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    demandMessageBn: { type: "string" },
    demandMessageEn: { type: "string" },
  },
  required: [
    "summary",
    "summaryBn",
    "sellerName",
    "sellerContact",
    "productOrService",
    "amountPaid",
    "paymentMethod",
    "transactionId",
    "incidentDate",
    "timeline",
    "matchedSections",
    "isConsumerCase",
    "notConsumerReason",
    "missingInfo",
    "confidence",
    "demandMessageBn",
    "demandMessageEn",
  ],
};

// ---------- Step 2: formal complaint letter ----------

export function buildComplaintPrompt(caseJson: string, demandSentAt: string): string {
  return `You are Ovijog. Write the body of a formal written complaint in standard formal Bangla (চলিত ভাষা; do not mix সাধু and চলিত) addressed to the Director General, Directorate of National Consumer Rights Protection (DNCRP), under the Consumers' Right Protection Act, 2009.

The app will add the date, the address block, the complainant's name, address, phone and signature itself. You write ONLY:
- subjectBn: one line subject, starting with "বিষয়:".
- bodyParagraphsBn: 3 to 5 short paragraphs that state, in order: who the complainant is (use "আমি" — do not write their name), what was bought from whom, when and for how much, what went wrong, what the complainant did to resolve it with the seller${demandSentAt ? ` (a written demand was sent to the seller on ${demandSentAt.slice(0, 10)} and the issue was not resolved)` : ""}, and which section(s) of the Act were violated.
- reliefBn: one paragraph asking for a refund of the amount paid and lawful action against the seller.
- evidenceListBn: a numbered list of the evidence available (one item per screenshot or fact), each item under 15 words.

RULES
- Use ONLY the facts in the case data below. Do not add facts, amounts, dates or names that are not there.
- If a fact is unknown, leave it out instead of guessing.
- Cite only the section numbers listed in matchedSections.
- Keep the tone respectful and factual. No exaggeration.

CASE DATA (JSON):
${caseJson}`;
}

export const complaintSchema = {
  type: "object",
  properties: {
    subjectBn: { type: "string" },
    bodyParagraphsBn: { type: "array", items: { type: "string" } },
    reliefBn: { type: "string" },
    evidenceListBn: { type: "array", items: { type: "string" } },
  },
  required: ["subjectBn", "bodyParagraphsBn", "reliefBn", "evidenceListBn"],
};
