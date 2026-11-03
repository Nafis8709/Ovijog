// Grounding data: the Consumers' Right Protection Act, 2009 (Act No. 26 of 2009).
//
// WHY THIS FILE EXISTS
// The AI is NOT allowed to invent law. It may only pick section numbers from
// this list. The text shown to the user always comes from here, never from
// the model. That is the core reliability guarantee of Ovijog.
//
// SOURCES
// - English text of Chapter IV (offences): lawyersnjurists.com, "The Consumers'
//   Right Protection Act 2009, Part 4". That page numbers the sections 32-51;
//   the official Act numbers them 37-56 (offset of +5). The official numbers
//   were cross-checked: s.44 = false advertisement and s.45 = not delivering
//   promised goods (The Daily Star; BSS, Aug 2026).
// - s.60 (30-day limit) and s.76(4) (25% of fine to complainant): The Daily
//   Star, ITV BD (Oct 2026), DNCRP district portals.
//
// BEFORE THE FINAL PITCH: compare every entry with the official text at
// bdlaws.minlaw.gov.bd and fix anything that differs.

export interface LawSection {
  section: number;
  titleEn: string;
  titleBn: string; // plain-language Bangla title (our summary, not official wording)
  textEn: string; // English text of the section
  maxPenalty: string;
  // Hints for the AI about when this section fits (kept short on purpose)
  usedFor: string;
}

export const CRPA_OFFENCES: LawSection[] = [
  {
    section: 37,
    titleEn: "Not using cover / label of goods",
    titleBn: "পণ্যের মোড়ক বা লেবেলে তথ্য না থাকা",
    textEn:
      "If any person violates any obligation, imposed by any Act or rules, of selling any goods within cover and inscribing weight, amount, ingredients, instructions for use, maximum retail price, date of manufacture, date of packaging and date of expiry of that goods on the label, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Packaged product with no MRP, expiry date or ingredients on the label",
  },
  {
    section: 38,
    titleEn: "Not showing price-list of goods",
    titleBn: "পণ্যের মূল্য তালিকা প্রদর্শন না করা",
    textEn:
      "If any person violates any obligation, imposed by any Act or rules, of displaying the price-list of goods by affixing it at a conspicuous place of his shop or organization, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Physical shop that hides prices where a price list is required",
  },
  {
    section: 39,
    titleEn: "Not preserving and displaying price-list of services",
    titleBn: "সেবার মূল্য তালিকা সংরক্ষণ ও প্রদর্শন না করা",
    textEn:
      "If any person violates the obligation, imposed under any Act or rules, of preserving price-list of service of his shop or organization and displaying it by affixing at a relevant or conspicuous place, he shall be punished with imprisonment for a term not exceeding 1 (one) year or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Service provider (clinic, salon, repair shop) with no displayed service prices",
  },
  {
    section: 40,
    titleEn: "Selling goods, medicine or service at higher price than fixed one",
    titleBn: "নির্ধারিত মূল্যের চেয়ে বেশি দামে পণ্য, ওষুধ বা সেবা বিক্রি",
    textEn:
      "If any person sells or offers to sell any goods, medicine or service at a price higher than the price fixed under any Act or rules, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Charged more than the MRP or a government-fixed price",
  },
  {
    section: 41,
    titleEn: "Selling adulterated goods or medicine",
    titleBn: "ভেজাল পণ্য বা ওষুধ বিক্রি",
    textEn:
      "If any person knowingly sells or offers to sell any adulterated goods or medicine, he shall be punished with imprisonment for a term not exceeding 3 (three) years, or with fine not exceeding Taka 2 (two) lacs, or with both.",
    maxPenalty: "3 years or Tk 2,00,000",
    usedFor: "Adulterated food, cosmetics or medicine",
  },
  {
    section: 42,
    titleEn: "Mixing prohibited materials in foodstuff",
    titleBn: "খাদ্যপণ্যে নিষিদ্ধ দ্রব্য মেশানো",
    textEn:
      "If any person mixes with foodstuff any ingredient which is injurious to human life or health and the mixing of which with foodstuff is prohibited by any Act or rules, he shall be punished with imprisonment for a term not exceeding 3 (three) years, or with fine not exceeding Taka 2 (two) lacs, or with both.",
    maxPenalty: "3 years or Tk 2,00,000",
    usedFor: "Harmful chemicals or banned colours found in food",
  },
  {
    section: 43,
    titleEn: "Manufacturing or processing goods in illegal process",
    titleBn: "অবৈধ প্রক্রিয়ায় পণ্য উৎপাদন বা প্রক্রিয়াকরণ",
    textEn:
      "If any person manufactures or processes any goods in a process which is injurious to human life or health and prohibited under any Act or rules, he shall be punished with imprisonment for a term not exceeding 2 (two) years, or with fine not exceeding Taka 1 (one) lac, or with both.",
    maxPenalty: "2 years or Tk 1,00,000",
    usedFor: "Goods made in an unsafe, prohibited way",
  },
  {
    section: 44,
    titleEn: "Deceiving buyers by false advertisement",
    titleBn: "মিথ্যা বিজ্ঞাপন দিয়ে ক্রেতাকে প্রতারণা",
    textEn:
      "If any person deceives any buyer by any false or untrue advertisement for the purpose of selling any goods or service, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 2 (two) lacs, or with both.",
    maxPenalty: "1 year or Tk 2,00,000",
    usedFor: "Product looks or works very differently from the post, photo or ad (fake 'original', fake discount)",
  },
  {
    section: 45,
    titleEn: "Not selling or delivering properly any goods or service promised",
    titleBn: "প্রতিশ্রুত পণ্য বা সেবা যথাযথভাবে বিক্রি বা সরবরাহ না করা",
    textEn:
      "If any person does not sell or deliver properly any goods or service promised in consideration of money, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Paid but product never delivered, wrong/damaged item delivered, service not given as promised",
  },
  {
    section: 46,
    titleEn: "Deceiving in weight",
    titleBn: "ওজনে কারচুপি",
    textEn:
      "If any person sells or supplies any goods to consumer less than the offered weight, at the time of supplying or selling, he shall be punished with imprisonment for not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Received less weight than paid for",
  },
  {
    section: 48,
    titleEn: "Deceiving in measurement",
    titleBn: "পরিমাপে কারচুপি",
    textEn:
      "If any person sells or delivers any goods to the consumer less than the offered measurement at the time of delivering or selling, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Received less quantity, volume or size than offered",
  },
  {
    section: 50,
    titleEn: "Making or manufacturing fake goods",
    titleBn: "নকল পণ্য তৈরি বা উৎপাদন",
    textEn:
      "If any person makes or manufactures fake goods, he shall be punished with imprisonment for a term not exceeding 3 (three) years, or with fine not exceeding Taka 2 (two) lacs, or with both.",
    maxPenalty: "3 years or Tk 2,00,000",
    usedFor: "Counterfeit brand product (when the seller made it, or alongside s.44 for selling it as original)",
  },
  {
    section: 51,
    titleEn: "Selling date-expired goods or medicine",
    titleBn: "মেয়াদোত্তীর্ণ পণ্য বা ওষুধ বিক্রি",
    textEn:
      "If any person sells or offers to sell any date expired goods or medicine, he shall be punished with imprisonment for a term not exceeding 1 (one) year, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
    maxPenalty: "1 year or Tk 50,000",
    usedFor: "Expired food, cosmetics or medicine was sold",
  },
  {
    section: 53,
    titleEn: "Damaging money, health or life of service receiver by negligence",
    titleBn: "অবহেলায় সেবাগ্রহীতার অর্থ, স্বাস্থ্য বা জীবনের ক্ষতি",
    textEn:
      "If any service provider, by negligence, irresponsibility or carelessness, damaging money, health or life of a service receiver, he shall be punished with imprisonment for a term not exceeding 3 (three) years, or with fine not exceeding Taka 2 (two) lacs, or with both.",
    maxPenalty: "3 years or Tk 2,00,000",
    usedFor: "Courier lost/damaged parcel, careless service that caused money loss or harm",
  },
];

// Section 54 is shown as an honesty warning, not matched to cases.
export const FALSE_CASE_WARNING = {
  section: 54,
  titleEn: "Filing false or vexatious cases",
  titleBn: "মিথ্যা বা হয়রানিমূলক অভিযোগ",
  textEn:
    "If any person, with a motive to harass any person, businessman or service provider or to defame him publicly or to damage his business reputation, files any false or vexatious case, he shall be punished with imprisonment for a term not exceeding 3 (three) years, or with fine not exceeding Taka 50 (fifty) thousands, or with both.",
};

// Procedural facts used by the app (plain-language summaries).
export const PROCEDURE = {
  deadlineDays: 30, // s.60: complaint within 30 days of the cause of action
  deadlineSection: "Section 60",
  rewardPercent: 25, // s.76(4): 25% of the realised fine goes to the complainant
  rewardSection: "Section 76(4)",
  hotline: "16121",
  email: "info@dncrp.gov.bd",
  website: "https://dncrp.gov.bd",
};

// Ministry of Commerce, Digital Commerce Operation Guidelines 2021
// (summary reported by The Daily Star). Used only as supporting context.
export const DIGITAL_COMMERCE_RULE =
  "Digital Commerce Operation Guidelines 2021: for prepaid orders, the product must be handed to delivery within 48 hours and delivered within 5 days in the same city, or within 10 days elsewhere.";

export function findSection(sectionNumber: number): LawSection | undefined {
  for (const item of CRPA_OFFENCES) {
    if (item.section === sectionNumber) {
      return item;
    }
  }
  return undefined;
}

export function allowedSectionNumbers(): number[] {
  const numbers: number[] = [];
  for (const item of CRPA_OFFENCES) {
    numbers.push(item.section);
  }
  return numbers;
}

// Short catalogue that goes into the AI prompt.
export function sectionCatalogueForPrompt(): string {
  const lines: string[] = [];
  for (const item of CRPA_OFFENCES) {
    lines.push(`- Section ${item.section}: ${item.titleEn}. Use when: ${item.usedFor}.`);
  }
  return lines.join("\n");
}
