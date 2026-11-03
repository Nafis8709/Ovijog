// Thin wrapper around the Gemini API. Only imported by API routes (server side),
// so the API key never reaches the browser.

import { GoogleGenAI } from "@google/genai";

// Change the model in .env.local (GEMINI_MODEL) without touching code.
const DEFAULT_MODEL = "gemini-3.5-flash";

export interface ImageInput {
  mimeType: string; // e.g. "image/jpeg"
  base64: string; // raw base64, without the "data:...;base64," prefix
}

export class AiConfigError extends Error {}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new AiConfigError("GEMINI_API_KEY is not set. Add it to .env.local (see README).");
  }
  return new GoogleGenAI({ apiKey: apiKey });
}

// Offline demo / test mode: OVIJOG_MOCK=1 replaces every AI call with simple
// rules (see mockAi.ts). Useful when there is no internet on stage, and for testing.
export function isMockMode(): boolean {
  return process.env.OVIJOG_MOCK === "1";
}

export function modelName(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

// Sends a prompt (plus optional images) and asks for JSON that matches `schema`.
// Returns the parsed object. Throws if the model does not return valid JSON.
export async function generateJson<T>(prompt: string, images: ImageInput[], schema: object): Promise<T> {
  const client = getClient();

  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  parts.push({ text: prompt });
  for (const image of images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
  }

  const response = await client.models.generateContent({
    model: modelName(),
    contents: [{ role: "user", parts: parts }],
    config: {
      responseMimeType: "application/json",
      responseJsonSchema: schema,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error("The AI returned an empty response.");
  }
  return JSON.parse(text) as T;
}

// Converts "data:image/jpeg;base64,AAAA" into { mimeType, base64 }.
export function dataUrlToImage(dataUrl: string): ImageInput | null {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }
  return { mimeType: match[1], base64: match[2] };
}
