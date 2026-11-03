// POST /api/analyze
// Input:  { story, purchaseDate, images: [dataUrl, ...] }
// Output: a stream of JSON lines (NDJSON), so the browser can show the agent working:
//   {"type":"step","step":{...}}      one line each time a step starts or finishes
//   {"type":"result","analysis":{...},"evidence":[...],"trace":[...]}
//   {"type":"error","error":"..."}

import { AiConfigError, isMockMode } from "@/lib/gemini";
import { runCaseAgent } from "@/lib/agent";

export const maxDuration = 60; // seconds; two AI calls with images can take a while

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

  const images: string[] = [];
  if (Array.isArray(body.images)) {
    for (const item of body.images.slice(0, MAX_IMAGES)) {
      if (typeof item !== "string" || item.length > MAX_IMAGE_CHARS || !item.startsWith("data:image/")) {
        return badRequest("One of the screenshots is too large or is not an image.");
      }
      images.push(item);
    }
  }

  // Fail fast (as normal JSON) if the AI is not configured.
  if (!isMockMode() && !process.env.GEMINI_API_KEY) {
    return Response.json({ error: "GEMINI_API_KEY is not set. Add it to .env.local (see README)." }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      function send(message: object) {
        controller.enqueue(encoder.encode(JSON.stringify(message) + "\n"));
      }
      try {
        const result = await runCaseAgent({ story, purchaseDate, images }, (step) => send({ type: "step", step: step }));
        send({ type: "result", analysis: result.analysis, evidence: result.evidence, trace: result.trace });
      } catch (error) {
        if (error instanceof AiConfigError) {
          send({ type: "error", error: error.message });
        } else {
          console.error("analyze failed:", error);
          send({ type: "error", error: "The AI could not analyse this case right now. Please try again in a moment." });
        }
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
