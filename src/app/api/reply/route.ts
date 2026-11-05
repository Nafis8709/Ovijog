// POST /api/reply
// The seller answered the Stage 1 demand. Ovijog reads the reply, names the
// seller's tactic, recommends the next move and drafts the buyer's answer.
// Input:  { analysis, history: [{ sellerSaid, tactic, reply }], sellerReply, image? }
// Output: { analysis: ReplyAnalysis }

import { AiConfigError, dataUrlToImage, describeAiError, generateJson, isMockMode, type ImageInput } from "@/lib/gemini";
import { buildReplyPrompt, replySchema } from "@/lib/prompts";
import { cleanAnalysis, cleanReply } from "@/lib/validate";
import { mockReply } from "@/lib/mockAi";
import { cleanUserText, guardRequest, readJsonBody } from "@/lib/guard";

const MAX_REPLY = 2000;
const MAX_IMAGE_CHARS = 2_000_000;

export const maxDuration = 60; // seconds, room for retries when the AI is busy

export async function POST(request: Request): Promise<Response> {
  const blocked = guardRequest(request, "reply");
  if (blocked !== null) {
    return blocked;
  }
  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }
  const body = (read.body ?? {}) as { analysis?: unknown; history?: unknown; sellerReply?: unknown; image?: unknown };

  const sellerReply = cleanUserText(body.sellerReply, MAX_REPLY);

  const images: ImageInput[] = [];
  if (typeof body.image === "string" && body.image !== "") {
    if (body.image.length > MAX_IMAGE_CHARS) {
      return Response.json({ error: "The screenshot is too large." }, { status: 400 });
    }
    const image = dataUrlToImage(body.image);
    if (image === null) {
      return Response.json({ error: "The screenshot must be an image." }, { status: 400 });
    }
    images.push(image);
  }

  if (sellerReply.length < 2 && images.length === 0) {
    return Response.json({ error: "Paste the seller's reply or add a screenshot of it." }, { status: 400 });
  }

  // Never trust case data coming back from the browser.
  const analysis = cleanAnalysis(body.analysis);
  const caseFacts = {
    sellerName: analysis.sellerName,
    productOrService: analysis.productOrService,
    amountPaidBDT: analysis.amountPaid,
    paymentMethod: analysis.paymentMethod,
    problem: analysis.summary,
    matchedSections: analysis.matchedSections.map((item) => item.section),
  };

  // Earlier turns, oldest first, as plain text.
  const historyLines: string[] = [];
  let earlierTurns = 0;
  if (Array.isArray(body.history)) {
    for (const turn of body.history.slice(-5)) {
      const said = typeof turn?.sellerSaid === "string" ? turn.sellerSaid.slice(0, 400) : "";
      const tactic = typeof turn?.tactic === "string" ? turn.tactic : "other";
      const reply = typeof turn?.reply === "string" ? turn.reply.slice(0, 400) : "";
      historyLines.push(`Seller (${tactic}): ${said}`);
      if (reply) {
        historyLines.push(`Buyer: ${reply}`);
      }
      earlierTurns += 1;
    }
  }

  if (!isMockMode() && !process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY is not set. Add it to .env.local (see README)." }, { status: 503 });
  }

  try {
    const prompt = buildReplyPrompt(JSON.stringify(caseFacts, null, 2), historyLines.join("\n"), sellerReply, images.length > 0);
    const raw = isMockMode() ? mockReply(sellerReply) : await generateJson<unknown>(prompt, images, replySchema);
    return Response.json({ analysis: cleanReply(raw, earlierTurns) });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("reply failed:", error);
    return Response.json({ error: describeAiError(error) }, { status: 502 });
  }
}
