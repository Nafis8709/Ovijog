// POST /api/complaint
// Input:  { story, purchaseDate, analysis, demandSentAt }
// Output: { complaint } — subject, body paragraphs, relief and evidence list in Bangla.
// The letter header, address and signature are added by the letter page, not the AI.

import { AiConfigError, generateJson } from "@/lib/gemini";
import { buildComplaintPrompt, complaintSchema } from "@/lib/prompts";
import { cleanAnalysis, cleanComplaint } from "@/lib/validate";

export async function POST(request: Request): Promise<Response> {
  let body: { story?: unknown; purchaseDate?: unknown; analysis?: unknown; demandSentAt?: unknown; imageCount?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be JSON." }, { status: 400 });
  }

  // Re-clean the analysis: never trust data coming back from the browser.
  const analysis = cleanAnalysis(body.analysis);
  if (!analysis.isConsumerCase || analysis.matchedSections.length === 0) {
    return Response.json(
      { error: "This case has no matching section of the Act, so a formal complaint cannot be drafted." },
      { status: 400 },
    );
  }

  const story = typeof body.story === "string" ? body.story.slice(0, 4000) : "";
  const purchaseDate = typeof body.purchaseDate === "string" ? body.purchaseDate : "";
  const demandSentAt = typeof body.demandSentAt === "string" ? body.demandSentAt : "";
  const imageCount = typeof body.imageCount === "number" ? body.imageCount : 0;

  // Only the facts the letter needs (no demand messages).
  const caseForPrompt = {
    story: story,
    purchaseDate: purchaseDate,
    numberOfScreenshots: imageCount,
    sellerName: analysis.sellerName,
    sellerContact: analysis.sellerContact,
    productOrService: analysis.productOrService,
    amountPaidBDT: analysis.amountPaid,
    paymentMethod: analysis.paymentMethod,
    transactionId: analysis.transactionId,
    incidentDate: analysis.incidentDate,
    timeline: analysis.timeline,
    matchedSections: analysis.matchedSections,
  };

  try {
    const prompt = buildComplaintPrompt(JSON.stringify(caseForPrompt, null, 2), demandSentAt);
    const raw = await generateJson<unknown>(prompt, [], complaintSchema);
    const complaint = cleanComplaint(raw);
    if (complaint.bodyParagraphsBn.length === 0) {
      throw new Error("Empty complaint body");
    }
    return Response.json({ complaint: complaint });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("complaint failed:", error);
    return Response.json(
      { error: "The AI could not write the complaint right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
