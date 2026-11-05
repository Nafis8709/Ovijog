// POST /api/evidence
// Reads photos added to an existing case (agent step 1 only), so the
// "make your case stronger" tips can be acted on after the case is created.
// Input:  { images: [dataUrl, ...], startIndex }   startIndex = number of photos already in the case
// Output: { evidence: EvidenceItem[] } with index = startIndex, startIndex + 1, ...

import { AiConfigError, dataUrlToImage, describeAiError, generateJson, isMockMode, type ImageInput } from "@/lib/gemini";
import { buildEvidencePrompt, evidenceSchema } from "@/lib/prompts";
import { cleanEvidence } from "@/lib/validate";
import { mockEvidence } from "@/lib/mockAi";
import type { EvidenceItem } from "@/lib/types";
import { guardRequest, readJsonBody } from "@/lib/guard";

export const maxDuration = 60;

const MAX_IMAGES = 4;
const MAX_IMAGE_CHARS = 2_000_000;

export async function POST(request: Request): Promise<Response> {
  const blocked = guardRequest(request, "evidence");
  if (blocked !== null) {
    return blocked;
  }
  const read = await readJsonBody(request);
  if (!read.ok) {
    return read.response;
  }
  const body = (read.body ?? {}) as { images?: unknown; startIndex?: unknown };

  const startIndex =
    typeof body.startIndex === "number" && Number.isFinite(body.startIndex) && body.startIndex >= 0
      ? Math.min(100, Math.floor(body.startIndex))
      : 0;
  const images: ImageInput[] = [];
  if (Array.isArray(body.images)) {
    for (const item of body.images.slice(0, MAX_IMAGES)) {
      if (typeof item !== "string" || item.length > MAX_IMAGE_CHARS) {
        return Response.json({ error: "One of the photos is too large." }, { status: 400 });
      }
      const image = dataUrlToImage(item);
      if (image === null) {
        return Response.json({ error: "Photos must be images." }, { status: 400 });
      }
      images.push(image);
    }
  }
  if (images.length === 0) {
    return Response.json({ error: "Add at least one photo." }, { status: 400 });
  }

  if (!isMockMode() && !process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY is not set. Add it to .env.local (see README)." }, { status: 503 });
  }

  try {
    const raw = isMockMode()
      ? mockEvidence(images.length)
      : await generateJson<unknown>(buildEvidencePrompt(images.length), images, evidenceSchema);
    const items = cleanEvidence(raw, images.length);
    const evidence: EvidenceItem[] = [];
    for (const item of items) {
      evidence.push({ ...item, index: item.index + startIndex });
    }
    return Response.json({ evidence: evidence });
  } catch (error) {
    if (error instanceof AiConfigError) {
      return Response.json({ error: error.message }, { status: 503 });
    }
    console.error("evidence failed:", error);
    return Response.json({ error: describeAiError(error) }, { status: 502 });
  }
}
