// POST /api/analyze
// Input:  { story, purchaseDate, images: [dataUrl, ...] }
// Output: { analysis } — facts, timeline, matched law sections, Stage 1 demand message.

import { AiConfigError, dataUrlToImage, generateJson, type ImageInput } from "@/lib/gemini";
import { analysisSchema, buildAnalysisPrompt } from "@/lib/prompts";
import { cleanAnalysis } from "@/lib/validate";
import { todayIso } from "@/lib/deadline";

const MAX_IMAGES = 4;
const MAX_IMAGE_CHARS = 2_000_000; // ~1.5 MB per image after base64
const MIN_STORY = 20;
const MAX_STORY = 4000;

function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export async function POST(request: Request): Promise<Response> {
  let body: { story?: unknown; purchaseDate?: unknown; images?: unknown };
  try {
    body = await request.json();
  } catch {
    return badRequest("Request body must be JSON.");
  }

  const story = typeof body.story === "string" ? body.story.trim() : "";
  if (story.length < MIN_STORY) {
    return badRequest("Please describe what happened in a little more detail (at least 20 characters).");
  }
  if (story.length > MAX_STORY) {
    return badRequest("The story is too long. Please keep it under 4000 characters.");
  }

  const purchaseDate = typeof body.purchaseDate === "string" ? body.purchaseDate : "";

  const images: ImageInput[] = [];
  if (Array.isArray(body.images)) {
    for (const item of body.images.slice(0, MAX_IMAGES)) {
      if (typeof item !== "string" || item.length > MAX_IMAGE_CHARS) {
        return badRequest("One of the screenshots is too large or invalid.");
      }
      const image = dataUrlToImage(item);
      if (image === null) {
        return badRequest("Screenshots must be images.");
      }
      images.push(image);
    }
  }

  try {
    const prompt = buildAnalysisPrompt(story, purchaseDate, todayIso());
    const raw = await generateJson<unknown>(prompt, images, analysisSchema);
    const analysis = cleanAnalysis(raw);
    return Response.json({ analysis: analysis });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("analyze failed:", error);
    return Response.json(
      { error: "The AI could not analyse this case right now. Please try again in a moment." },
      { status: 502 },
    );
  }
}
