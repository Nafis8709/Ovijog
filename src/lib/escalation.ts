// Where else the buyer can go, chosen by plain rules (never by the AI),
// so every phone number and address shown here is one we checked.
//
// Sources (checked November 2026):
// - DNCRP: hotline 16121, info@dncrp.gov.bd, office at TCB Bhaban, Karwan Bazar; official site
//   dncrp.portal.gov.bd; online complaint portal dncrp.com (needs mobile number and NID)
//   (The Daily Star Dec 2025, The Financial Express Jan 2023, Bangla Tribune, ITV BD)
// - bKash helpline 16247 or 02-55663001 (bkash.com/en/help/contact-us)
// - Bangladesh Bank Customer Interest Protection Centre (CIPC): hotline 16236 on working days,
//   bb.cipc@bb.org.bd. Covers banks, finance companies and mobile financial services, after the
//   customer has first complained to the provider (bb.org.bd, CIPC procedure page).

import { PROCEDURE } from "./law";
import type { CaseAnalysis } from "./types";

export interface EscalationRoute {
  id: string;
  title: string;
  when: string; // when this route makes sense
  how: string[]; // concrete steps
}

function mentions(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  for (const word of words) {
    if (lower.includes(word)) {
      return true;
    }
  }
  return false;
}

export function escalationRoutes(analysis: CaseAnalysis): EscalationRoute[] {
  const routes: EscalationRoute[] = [];
  const payment = analysis.paymentMethod;

  if (analysis.isConsumerCase) {
    routes.push({
      id: "dncrp",
      title: "Directorate of National Consumer Rights Protection",
      when: "The main route for this case. The directorate can fine the seller, and 25% of any fine it collects is paid to you.",
      how: [
        `Online: the complaint portal at ${PROCEDURE.complaintPortal} (sign up with your mobile number and NID), or email the letter and photos to ${PROCEDURE.email}.`,
        `In person: hand in the signed letter at ${PROCEDURE.office}, or at your divisional or district consumer rights office.`,
        `Attach the receipt or payment proof, and for online orders the page link and your chats. Keep a copy.`,
        `File within ${PROCEDURE.deadlineDays} days of the problem (${PROCEDURE.deadlineSection}). Questions: hotline ${PROCEDURE.hotline}.`,
      ],
    });
  }

  if (mentions(payment, ["bkash"])) {
    routes.push({
      id: "bkash",
      title: "bKash customer care",
      when: "You sent money by bKash. Report the number that received it so bKash has a record of the transaction.",
      how: [
        "Call 16247 (or 02-55663001), or use Help in the bKash app.",
        analysis.transactionId ? `Give the transaction ID: ${analysis.transactionId}.` : "Have the transaction ID from the payment SMS ready.",
        "Write down the complaint number they give you.",
      ],
    });
  } else if (mentions(payment, ["nagad", "rocket"])) {
    routes.push({
      id: "mfs",
      title: `${payment} customer care`,
      when: `You paid by ${payment}. Report the number that received the money.`,
      how: [
        `Use the helpline or Help section inside the ${payment} app.`,
        "Have the transaction ID from the payment SMS ready, and write down the complaint number.",
      ],
    });
  } else if (mentions(payment, ["card", "visa", "master", "bank"])) {
    routes.push({
      id: "bank",
      title: "Your bank (card dispute)",
      when: "You paid by card or bank transfer. Banks can investigate disputed card payments.",
      how: [
        "Call the number on the back of your card and ask to dispute the transaction.",
        "Ask for the complaint number and the bank's final answer in writing.",
      ],
    });
  }

  const paidDigitally = mentions(payment, ["bkash", "nagad", "rocket", "card", "visa", "master", "bank"]);
  if (paidDigitally) {
    routes.push({
      id: "bb-cipc",
      title: "Bangladesh Bank, Customer Interest Protection Centre",
      when: "Only if your bank or mobile wallet does not handle your complaint properly. This is a complaint about the provider, not the seller.",
      how: [
        "Hotline 16236 (working days, office hours), or email bb.cipc@bb.org.bd.",
        "Attach the provider's final answer and your screenshots.",
      ],
    });
  }

  if (!analysis.isConsumerCase) {
    routes.push({
      id: "police",
      title: "Police",
      when: "If you were threatened, your account was hacked, or someone cheated you outside a purchase.",
      how: ["Go to your nearest police station with your screenshots.", "In an emergency, call 999."],
    });
  }

  return routes;
}
