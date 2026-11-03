// Offline stand-in for the AI, used when OVIJOG_MOCK=1.
// It uses simple keyword rules, so it is much less clever than the real model,
// but it lets the whole app run with no API key or internet (demo backup, tests).
// Its output goes through the same validators as the real AI.

import type { EvidenceItem } from "./types";

function includesAny(text: string, words: string[]): boolean {
  const lower = text.toLowerCase();
  for (const word of words) {
    if (lower.includes(word)) {
      return true;
    }
  }
  return false;
}

// "2,400 taka" / "৳2400" / "2400 tk" -> 2400
function findAmount(text: string): number | null {
  const converted = text.replace(/[০-৯]/g, (digit) => String("০১২৩৪৫৬৭৮৯".indexOf(digit)));
  const match = /(?:৳|tk\.?|taka|টাকা)?\s*(\d{1,3}(?:,\d{3})+|\d{3,6})\s*(?:৳|tk|taka|টাকা)?/i.exec(converted);
  if (!match) {
    return null;
  }
  return Number(match[1].replace(/,/g, ""));
}

function findPaymentMethod(text: string): string {
  if (includesAny(text, ["bkash", "বিকাশ"])) return "bKash";
  if (includesAny(text, ["nagad", "নগদ"])) return "Nagad";
  if (includesAny(text, ["rocket", "রকেট"])) return "Rocket";
  if (includesAny(text, ["card", "visa", "mastercard"])) return "Card";
  if (includesAny(text, ["cash on delivery", "cod"])) return "Cash on delivery";
  return "";
}

export function mockEvidence(imageCount: number): { items: EvidenceItem[] } {
  const items: EvidenceItem[] = [];
  for (let index = 0; index < imageCount; index++) {
    items.push({
      index: index,
      kind: "other",
      summary: "Offline mode: screenshots are not read without the AI.",
      facts: [],
      readable: true,
    });
  }
  return { items };
}

export function mockAnalysis(story: string, purchaseDate: string): object {
  const amount = findAmount(story);
  const paymentMethod = findPaymentMethod(story);

  const notConsumer = includesAny(story, ["hacked", "hack", "loan", "lent", "dhar", "harass", "job offer"]);
  const sections: { section: number; reason: string; reasonBn: string }[] = [];

  if (!notConsumer) {
    if (includesAny(story, ["not deliver", "nothing came", "never came", "ashe nai", "deliver hoy nai", "ডেলিভারি দেয়নি", "pai nai", "torn", "chera", "broken", "wrong", "vul", "damage", "size", "lost", "saban"])) {
      sections.push({
        section: 45,
        reason: "The seller took payment but did not deliver the promised product properly.",
        reasonBn: "বিক্রেতা টাকা নিয়েও প্রতিশ্রুত পণ্য যথাযথভাবে সরবরাহ করেননি।",
      });
    }
    if (includesAny(story, ["original", "fake", "advert", "post e bolsilo", "copy", "rexine"])) {
      sections.push({
        section: 44,
        reason: "The product did not match what the post or advertisement claimed.",
        reasonBn: "পণ্যটি পোস্ট বা বিজ্ঞাপনে যা বলা হয়েছিল তার সঙ্গে মেলেনি।",
      });
    }
    if (includesAny(story, ["weigh", "kg", "ojon", "ওজন"])) {
      sections.push({
        section: 46,
        reason: "The goods weighed less than what was paid for.",
        reasonBn: "পরিশোধিত ওজনের চেয়ে কম পণ্য দেওয়া হয়েছে।",
      });
    }
    if (includesAny(story, ["expired", "expiry", "meyad", "মেয়াদ"])) {
      sections.push({
        section: 51,
        reason: "The product was sold after its expiry date.",
        reasonBn: "মেয়াদোত্তীর্ণ পণ্য বিক্রি করা হয়েছে।",
      });
    }
    if (includesAny(story, ["mrp", "extra price", "beshi dam", "overcharg"])) {
      sections.push({
        section: 40,
        reason: "The price charged was higher than the fixed price.",
        reasonBn: "নির্ধারিত দামের চেয়ে বেশি দাম নেওয়া হয়েছে।",
      });
    }
    if (sections.length === 0) {
      sections.push({
        section: 45,
        reason: "The promised product or service was not delivered properly.",
        reasonBn: "প্রতিশ্রুত পণ্য বা সেবা যথাযথভাবে দেওয়া হয়নি।",
      });
    }
  }

  const sectionList = sections.map((item) => item.section).join(" ও ");
  const amountText = amount !== null ? `${amount} টাকা` : "টাকা";

  return {
    summary: "Offline mode summary: " + story.slice(0, 160),
    summaryBn: "অফলাইন মোড: গল্প থেকে মূল তথ্য নেওয়া হয়েছে।",
    sellerName: "",
    sellerContact: "",
    productOrService: "Product from your story",
    amountPaid: amount,
    paymentMethod: paymentMethod,
    transactionId: "",
    incidentDate: purchaseDate,
    timeline: [{ date: purchaseDate, event: "Purchase described in the story", evidence: "User's statement" }],
    matchedSections: sections,
    isConsumerCase: !notConsumer,
    notConsumerReason: notConsumer ? "This sounds like a personal or criminal matter, not a purchase from a business." : "",
    missingInfo: ["Offline mode: connect the AI for a full analysis.", "Do you have the payment SMS with the transaction ID?"],
    confidence: "low",
    demandMessageBn: notConsumer
      ? ""
      : `আসসালামু আলাইকুম। আমি আপনাদের কাছ থেকে ${amountText} দিয়ে একটি পণ্য কিনেছিলাম, কিন্তু প্রতিশ্রুত পণ্য যথাযথভাবে পাইনি। এটি ভোক্তা-অধিকার সংরক্ষণ আইন, ২০০৯-এর ${sectionList} ধারার লঙ্ঘন। অনুগ্রহ করে ৩ দিনের মধ্যে টাকা ফেরত দিন অথবা সঠিক পণ্য পাঠান। অন্যথায় আমি জাতীয় ভোক্তা-অধিকার সংরক্ষণ অধিদপ্তরে অভিযোগ করব।`,
    demandMessageEn: notConsumer
      ? ""
      : `Hello. I paid ${amount !== null ? amount + " taka" : ""} for a product from you but did not receive what was promised. This violates Section(s) ${sections.map((item) => item.section).join(" and ")} of the Consumers' Right Protection Act, 2009. Please refund me or send the correct product within 3 days, or I will file a complaint with the Directorate of National Consumer Rights Protection.`,
  };
}

export function mockComplaint(): object {
  return {
    subjectBn: "বিষয়: প্রতিশ্রুত পণ্য যথাযথভাবে সরবরাহ না করার প্রতিকার প্রসঙ্গে।",
    bodyParagraphsBn: [
      "আমি একজন ভোক্তা। আমি অভিযুক্ত বিক্রেতার কাছ থেকে একটি পণ্য কিনেছিলাম এবং মূল্য পরিশোধ করেছিলাম।",
      "কিন্তু বিক্রেতা প্রতিশ্রুত পণ্য যথাযথভাবে সরবরাহ করেননি। বিষয়টি সমাধানের জন্য আমি বিক্রেতার সঙ্গে যোগাযোগ করেছি, কিন্তু কোনো সমাধান পাইনি।",
      "এটি ভোক্তা-অধিকার সংরক্ষণ আইন, ২০০৯-এর সংশ্লিষ্ট ধারার লঙ্ঘন। (অফলাইন মোডে তৈরি খসড়া; এআই সংযুক্ত থাকলে আপনার ঘটনার বিস্তারিত যুক্ত হবে।)",
    ],
    reliefBn: "অতএব, আমার পরিশোধিত অর্থ ফেরত এবং বিক্রেতার বিরুদ্ধে আইনানুগ ব্যবস্থা গ্রহণের জন্য বিনীত অনুরোধ করছি।",
    evidenceListBn: ["পেমেন্টের প্রমাণ", "বিক্রেতার সঙ্গে কথোপকথনের স্ক্রিনশট"],
  };
}

export function mockReply(sellerReply: string): object {
  let tactic = "other";
  let nextMove = "counter";
  if (includesAny(sellerReply, ["refund", "taka ferot", "ferot dibo", "return korbo"])) {
    tactic = "refund_offered";
    nextMove = "accept";
  } else if (includesAny(sellerReply, ["wait", "opekkha", "dekhchi", "processing", "kal"])) {
    tactic = "stalling";
  } else if (includesAny(sellerReply, ["courier", "delivery man"])) {
    tactic = "blame_shifting";
  } else if (includesAny(sellerReply, ["police", "dekhe nibo", "block", "case korbo"])) {
    tactic = "threat_or_abuse";
    nextMove = "escalate";
  } else if (includesAny(sellerReply, ["no problem", "kono somossa nai", "amader dosh na"])) {
    tactic = "denial";
    nextMove = "escalate";
  }
  return {
    tactic: tactic,
    tacticExplainEn: "Offline mode: the reply was classified with simple keyword rules.",
    tacticExplainBn: "অফলাইন মোড: সাধারণ নিয়মে উত্তরটি শ্রেণিবদ্ধ করা হয়েছে।",
    nextMove: nextMove,
    nextMoveReason: "Offline mode suggestion.",
    replyBn:
      nextMove === "accept"
        ? "ধন্যবাদ। অনুগ্রহ করে টাকা ফেরতের নির্দিষ্ট তারিখ লিখিতভাবে জানান।"
        : "আপনার উত্তরের জন্য ধন্যবাদ। অনুগ্রহ করে ৪৮ ঘণ্টার মধ্যে টাকা ফেরত দিন, অন্যথায় আমি জাতীয় ভোক্তা-অধিকার সংরক্ষণ অধিদপ্তরে অভিযোগ করব।",
    replyEn:
      nextMove === "accept"
        ? "Thank you. Please confirm the refund date in writing."
        : "Thank you for your reply. Please refund me within 48 hours, or I will file a complaint with the Directorate of National Consumer Rights Protection.",
  };
}
