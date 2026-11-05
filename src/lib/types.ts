// Shared types for Ovijog.
// Everything about one complaint lives inside a single "Case" object,
// which is saved in the browser (see caseStore.ts).

export type CaseStatus =
  | "new" // analysed, nothing sent yet
  | "demand_sent" // stage 1: message sent to the seller
  | "resolved" // seller refunded / replaced
  | "complaint_ready" // stage 2: formal complaint generated
  | "complaint_filed"; // user says they filed it with DNCRP

export interface TimelineEvent {
  date: string; // ISO date (YYYY-MM-DD) or "" if unknown
  event: string; // short description in English
  evidence: string; // which screenshot / statement proves it
}

export interface MatchedSection {
  section: number; // official section number of CRPA 2009
  reason: string; // why this section applies to this case (English)
  reasonBn: string; // same reason in Bangla
}

// What the AI agent returns after reading the story + screenshots.
// The server validates and cleans this before sending it to the browser.
export interface CaseAnalysis {
  summary: string; // 1-2 sentence English summary
  summaryBn: string; // same summary in Bangla
  sellerName: string;
  sellerContact: string; // page link, phone, website if visible
  productOrService: string;
  amountPaid: number | null; // in BDT, null if unknown
  paymentMethod: string; // bKash / Nagad / COD / card / unknown
  transactionId: string;
  incidentDate: string; // ISO date when the problem happened (YYYY-MM-DD) or ""
  timeline: TimelineEvent[];
  matchedSections: MatchedSection[];
  isConsumerCase: boolean; // false if this is not a consumer-rights matter
  notConsumerReason: string;
  missingInfo: string[]; // questions the user should answer to strengthen the case
  confidence: "high" | "medium" | "low";
  demandMessageBn: string; // stage 1 message to the seller (Bangla)
  demandMessageEn: string; // English version for reference
}

// The directorate asks for the complainant's full name, father's and mother's
// names, address, phone, email (if any) and occupation.
export interface Complainant {
  name: string;
  fatherName: string;
  motherName: string;
  occupation: string;
  phone: string;
  email: string;
  address: string;
}

export interface Case {
  id: string;
  createdAt: string; // ISO timestamp
  story: string; // the user's own words
  purchaseDate: string; // ISO date given by the user (fallback for deadline)
  images: string[]; // small JPEG data URLs (compressed screenshots)
  analysis: CaseAnalysis;
  status: CaseStatus;
  demandSentAt: string; // ISO timestamp or ""
  complainant: Complainant | null;
  complaint: ComplaintDraft | null; // stage 2 letter, null until generated
  evidence: EvidenceItem[]; // what the agent found in each screenshot
  trace: TraceStep[]; // the agent's steps, shown as "How Ovijog reached this"
  negotiation: NegotiationTurn[]; // seller replies and Ovijog's suggested answers
}

// ---------- Evidence (agent step 1) ----------

export type EvidenceKind =
  | "payment_proof" // bKash / Nagad SMS, bank or card receipt
  | "order_proof" // order page, invoice, product post or advertisement
  | "chat" // conversation with the seller
  | "product_photo" // photo of what was received
  | "other";

export interface EvidenceItem {
  index: number; // 0-based screenshot number
  kind: EvidenceKind;
  summary: string; // one line: what this screenshot shows
  facts: string[]; // short facts read from the image
  readable: boolean; // false if blurry or unrelated
}

// ---------- Agent trace (shown live while the agent works) ----------

export type StepStatus = "running" | "done" | "skipped" | "failed";

export interface TraceStep {
  id: string;
  label: string;
  by: "ai" | "code"; // honest label: was this step done by the AI or by plain code?
  status: StepStatus;
  details: string[];
}

// ---------- Negotiation (Stage 1.5) ----------

export type SellerTactic =
  | "refund_offered"
  | "replacement_offered"
  | "partial_offer"
  | "stalling"
  | "denial"
  | "blame_shifting"
  | "threat_or_abuse"
  | "asks_for_info"
  | "other";

export type NextMove = "accept" | "counter" | "escalate";

export interface ReplyAnalysis {
  tactic: SellerTactic;
  tacticExplainEn: string;
  tacticExplainBn: string;
  nextMove: NextMove;
  nextMoveReason: string;
  replyBn: string; // empty when the advice is to stop replying
  replyEn: string;
}

export interface NegotiationTurn {
  at: string; // ISO timestamp
  sellerSaid: string; // text the user pasted (or "[screenshot]")
  analysis: ReplyAnalysis;
}

// Stage 2: the AI writes these parts; the app adds header, address and signature.
export interface ComplaintDraft {
  subjectBn: string;
  bodyParagraphsBn: string[];
  reliefBn: string;
  evidenceListBn: string[];
}
