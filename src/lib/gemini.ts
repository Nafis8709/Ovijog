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

// Backup models, tried in order when the main model is overloaded.
// Override with GEMINI_FALLBACK_MODELS="model-a,model-b" (empty string turns this off).
const DEFAULT_FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-flash-latest"];

function fallbackModels(): string[] {
  const setting = process.env.GEMINI_FALLBACK_MODELS;
  const list: string[] = [];
  const source = setting === undefined ? DEFAULT_FALLBACK_MODELS : setting.split(",");
  for (const item of source) {
    const name = item.trim();
    if (name !== "" && name !== modelName() && !list.includes(name)) {
      list.push(name);
    }
  }
  return list;
}

function errorStatus(error: unknown): number {
  const status = (error as { status?: unknown })?.status;
  return typeof status === "number" ? status : 0;
}

// 429 (rate limit), 500, 503 (overloaded) and 504 usually pass if you wait a moment.
function isTemporary(error: unknown): boolean {
  const status = errorStatus(error);
  return status === 429 || status === 500 || status === 503 || status === 504;
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function callModel<T>(model: string, parts: object[], schema: object): Promise<T> {
  const response = await getClient().models.generateContent({
    model: model,
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

// Sends a prompt (plus optional images) and asks for JSON that matches `schema`.
// When Gemini is busy it retries the main model twice (after 1.5 s and 4 s),
// then tries each backup model once. Throws the first error if everything fails.
export async function generateJson<T>(prompt: string, images: ImageInput[], schema: object): Promise<T> {
  const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
  parts.push({ text: prompt });
  for (const image of images) {
    parts.push({ inlineData: { mimeType: image.mimeType, data: image.base64 } });
  }

  const delays = [0, 1500, 4000];
  let firstError: unknown = null;

  for (const delay of delays) {
    if (delay > 0) {
      await wait(delay);
    }
    try {
      return await callModel<T>(modelName(), parts, schema);
    } catch (error) {
      if (firstError === null) {
        firstError = error;
      }
      if (!isTemporary(error)) {
        throw error; // a wrong key or bad request will not fix itself
      }
      console.warn(`Gemini ${modelName()} busy (status ${errorStatus(error)}), retrying`);
    }
  }

  for (const backup of fallbackModels()) {
    try {
      console.warn(`Trying backup model ${backup}`);
      return await callModel<T>(backup, parts, schema);
    } catch (error) {
      console.warn(`Backup model ${backup} failed (status ${errorStatus(error)})`);
    }
  }

  throw firstError;
}

// Converts "data:image/jpeg;base64,AAAA" into { mimeType, base64 }.
export function dataUrlToImage(dataUrl: string): ImageInput | null {
  const match = /^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/.exec(dataUrl);
  if (!match) {
    return null;
  }
  return { mimeType: match[1], base64: match[2] };
}

// Turns a Gemini API failure into a message that says what to fix.
// Never includes the key itself.
export function describeAiError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const status = typeof (error as { status?: unknown })?.status === "number" ? (error as { status: number }).status : 0;
  const lower = message.toLowerCase();

  if (lower.includes("api key not valid") || lower.includes("api_key_invalid") || status === 401 || status === 403) {
    return "The Gemini API key was rejected. Check GEMINI_API_KEY in your hosting settings (it should be about 39 characters and start with AIza).";
  }
  if (status === 404 || lower.includes("not found")) {
    return `The AI model "${modelName()}" is not available for this API key. Set GEMINI_MODEL to gemini-flash-latest and redeploy.`;
  }
  if (status === 429 || lower.includes("quota")) {
    return "The AI is receiving too many requests right now (free-tier limit). Wait a minute and try again.";
  }
  if (status === 503 || status === 500 || status === 504 || lower.includes("high demand")) {
    return "Google's AI service is busy right now. Wait a minute and try again, or open the sample case.";
  }
  return `The AI could not finish this step. Please try again in a moment.${status ? ` (error ${status})` : ""}`;
}
