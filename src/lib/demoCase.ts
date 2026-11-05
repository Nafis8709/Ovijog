// A ready-made sample case so judges (and you, on stage) can see the full flow
// without an API key or internet. Dates are relative to today so the
// 30-day countdown always looks realistic. All names here are fictional.

import { todayIso } from "./deadline";
import { EXAMPLE_PREFIX } from "./caseStore";
import type { Case } from "./types";

function daysAgo(days: number): string {
  const today = new Date(todayIso() + "T00:00:00Z");
  const past = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
  return past.toISOString().slice(0, 10);
}

export function buildDemoCase(): Case {
  const orderDate = daysAgo(12);
  const deliveryDate = daysAgo(8);
  const blockedDate = daysAgo(6);

  return {
    id: EXAMPLE_PREFIX + Date.now().toString(36),
    createdAt: new Date().toISOString(),
    story:
      "Facebook page 'Winter Trend BD (example)' theke ekta leather jacket order korsilam 2,400 taka bKash e advance diye. Post e bolsilo 'original leather, size L'. Jacket ashse rexine er, size M, ar hata chera. Page e message dilam, prothome bolse exchange korbe, pore amake block kore dise.",
    purchaseDate: orderDate,
    images: [],
    status: "new",
    demandSentAt: "",
    complainant: null,
    complaint: null,
    evidence: [],
    negotiation: [],
    trace: [
      { id: "read", label: "Reading your screenshots", by: "ai", status: "skipped", details: ["This example has no screenshots."] },
      {
        id: "understand",
        label: "Understanding your case",
        by: "ai",
        status: "done",
        details: [
          "Seller: Winter Trend BD (example)",
          "Product: Leather jacket, size L",
          "Amount: ৳2,400",
          "Timeline: 4 events, each linked to its evidence",
          "Drafted the demand message to the seller in Bangla and English",
        ],
      },
      {
        id: "law",
        label: "Checking the law",
        by: "code",
        status: "done",
        details: [
          "Section 45: Not selling or delivering properly any goods or service promised",
          "Section 44: Deceiving buyers by false advertisement",
        ],
      },
      { id: "deadline", label: "Calculating your deadline", by: "code", status: "done", details: ["Counted from the delivery date (30 days, Section 60)"] },
      { id: "score", label: "Scoring your evidence", by: "code", status: "done", details: ["Evidence strength: 30/100 (weak)", "Add screenshots to make it stronger"] },
    ],
    analysis: {
      summary:
        "The buyer paid Tk 2,400 by bKash for an 'original leather' size L jacket from a Facebook page, received a torn rexine jacket in size M, and was blocked after asking for an exchange.",
      summaryBn:
        "ক্রেতা একটি ফেসবুক পেজ থেকে বিকাশে ২,৪০০ টাকা দিয়ে 'অরিজিনাল লেদার' সাইজ L জ্যাকেট অর্ডার করেন, কিন্তু ছেঁড়া রেক্সিনের সাইজ M জ্যাকেট পান এবং বদলানোর কথা বলার পর তাকে ব্লক করা হয়।",
      sellerName: "Winter Trend BD (example)",
      sellerContact: "facebook.com/wintertrendbd-example",
      productOrService: "Leather jacket, size L",
      amountPaid: 2400,
      paymentMethod: "bKash (advance)",
      transactionId: "",
      incidentDate: deliveryDate,
      timeline: [
        { date: orderDate, event: "Ordered 'original leather' jacket, size L, paid Tk 2,400 by bKash", evidence: "User's statement" },
        { date: deliveryDate, event: "Received a torn rexine jacket in size M", evidence: "User's statement" },
        { date: deliveryDate, event: "Messaged the page; seller agreed to an exchange", evidence: "User's statement" },
        { date: blockedDate, event: "Seller blocked the buyer on Facebook", evidence: "User's statement" },
      ],
      matchedSections: [
        {
          section: 45,
          reason: "The seller took payment but did not deliver the promised product (size L, undamaged).",
          reasonBn: "বিক্রেতা টাকা নিয়েও প্রতিশ্রুত পণ্য (সাইজ L, ভালো অবস্থায়) সরবরাহ করেননি।",
        },
        {
          section: 44,
          reason: "The post advertised 'original leather' but the jacket is rexine.",
          reasonBn: "পোস্টে 'অরিজিনাল লেদার' বলা হলেও জ্যাকেটটি রেক্সিনের, যা মিথ্যা বিজ্ঞাপন।",
        },
      ],
      isConsumerCase: true,
      notConsumerReason: "",
      missingInfo: [
        "Do you have a screenshot of the bKash payment SMS with the transaction ID?",
        "Do you have a screenshot of the original post that says 'original leather'?",
        "Do you have photos of the jacket you received?",
      ],
      confidence: "medium",
      demandMessageBn:
        "আসসালামু আলাইকুম। আমি আপনাদের পেজ থেকে ২,৪০০ টাকা বিকাশে অগ্রিম দিয়ে 'অরিজিনাল লেদার' সাইজ L জ্যাকেট অর্ডার করেছিলাম। কিন্তু আমি ছেঁড়া, রেক্সিনের সাইজ M জ্যাকেট পেয়েছি। এটি ভোক্তা-অধিকার সংরক্ষণ আইন, ২০০৯-এর ৪৪ ও ৪৫ ধারা লঙ্ঘন। অনুগ্রহ করে আগামী ৩ দিনের মধ্যে পুরো টাকা ফেরত দিন অথবা সঠিক পণ্য পাঠান। অন্যথায় আমি জাতীয় ভোক্তা-অধিকার সংরক্ষণ অধিদপ্তরে আনুষ্ঠানিক অভিযোগ করতে বাধ্য হব। ধন্যবাদ।",
      demandMessageEn:
        "Hello. I ordered an 'original leather' size L jacket from your page and paid Tk 2,400 in advance by bKash. I received a torn rexine jacket in size M. This violates Sections 44 and 45 of the Consumers' Right Protection Act, 2009. Please refund the full amount or send the correct product within 3 days. Otherwise I will file a formal complaint with the Directorate of National Consumer Rights Protection. Thank you.",
    },
  };
}
