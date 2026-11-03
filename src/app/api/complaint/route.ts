// POST /api/complaint
// Input:  { story, purchaseDate, analysis, demandSentAt }
// Output: { complaint } — subject, body paragraphs, relief and evidence list in Bangla.
// The letter header, address and signature are added by the letter page, not the AI.

import { AiConfigError, describeAiError, generateJson, isMockMode } from "@/lib/gemini";
import { mockComplaint } from "@/lib/mockAi";
import { buildComplaintPrompt, complaintSchema } from "@/lib/prompts";
import { cleanAnalysis, cleanComplaint } from "@/lib/validate";

export async function POST(request: Request): Promise<Response> {
  let body: {
    story?: unknown;
    purchaseDate?: unknown;
    analysis?: unknown;
    demandSentAt?: unknown;
    imageCount?: unknown;
    sellerResponses?: unknown;
  };
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

  // Short summaries of how the seller replied during negotiation (from the Negotiator).
  const responseLines: string[] = [];
  if (Array.isArray(body.sellerResponses)) {
    for (const item of body.sellerResponses.slice(0, 6)) {
      if (typeof item === "string" && item.trim() !== "") {
        responseLines.push("- " + item.trim().slice(0, 300));
      }
    }
  }

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
    const prompt = buildComplaintPrompt(JSON.stringify(caseForPrompt, null, 2), demandSentAt, responseLines.join("\n"));
    const raw = isMockMode() ? mockComplaint() : await generateJson<unknown>(prompt, [], complaintSchema);
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
    return Response.json({ error: describeAiError(error) }, { status: 502 });
  }
}
