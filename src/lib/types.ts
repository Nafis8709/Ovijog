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

export interface Complainant {
  name: string;
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
}

// Stage 2: the AI writes these parts; the app adds header, address and signature.
export interface ComplaintDraft {
  subjectBn: string;
  bodyParagraphsBn: string[];
  reliefBn: string;
  evidenceListBn: string[];
}
