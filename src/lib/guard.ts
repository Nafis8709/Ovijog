// Request guards shared by every API route (server only):
//  - a simple per-visitor rate limit, so one person (or a bot) cannot use up
//    the AI quota and take the app down for everyone else;
//  - a body size limit (Vercel rejects bodies over 4.5 MB anyway, this gives a clear message);
//  - a same-site check, so other websites cannot call our AI endpoints from a visitor's browser.
//
// The rate limit is kept in memory. On a serverless host each running instance
// has its own counter, so this is a best-effort brake, not a hard quota.

interface RateWindow {
  start: number;
  count: number;
}

const windows = new Map<string, RateWindow>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

// Requests allowed per visitor per 10 minutes, per kind of request.
// Generous enough for a whole room of judges sharing one Wi-Fi address.
const LIMITS: Record<string, number> = {
  analyze: 40,
  complaint: 40,
  reply: 80,
  evidence: 60,
};

export const MAX_BODY_BYTES = 4_000_000;

function visitorKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for") || "";
  const first = forwarded.split(",")[0].trim();
  return first || request.headers.get("x-real-ip") || "unknown";
}

function overLimit(kind: string, visitor: string): boolean {
  const limit = LIMITS[kind] ?? 30;
  const key = `${kind}:${visitor}`;
  const now = Date.now();

  // Forget old windows now and then so memory does not grow forever.
  if (windows.size > 5000) {
    for (const [storedKey, stored] of windows) {
      if (now - stored.start > WINDOW_MS) {
        windows.delete(storedKey);
      }
    }
  }

  const current = windows.get(key);
  if (current === undefined || now - current.start > WINDOW_MS) {
    windows.set(key, { start: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

// Browsers send Origin on POST requests. If it is present, it must be this site.
function isCrossSite(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return false; // server-to-server or same-origin requests without Origin (e.g. curl, tests)
  }
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

// Returns an error Response to send back, or null when the request may continue.
export function guardRequest(request: Request, kind: string): Response | null {
  if (isCrossSite(request)) {
    return Response.json({ error: "Requests from other websites are not allowed." }, { status: 403 });
  }

  const declaredLength = Number(request.headers.get("content-length") || "0");
  if (declaredLength > MAX_BODY_BYTES) {
    return Response.json(
      { error: "The photos are too large to send together. Remove one or two and try again." },
      { status: 413 },
    );
  }

  if (overLimit(kind, visitorKey(request))) {
    return Response.json(
      { error: "Too many requests from your connection. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": "600" } },
    );
  }
  return null;
}

// Reads the JSON body with a size limit that also works when Content-Length is missing.
export async function readJsonBody(request: Request): Promise<{ ok: true; body: unknown } | { ok: false; response: Response }> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return { ok: false, response: Response.json({ error: "Could not read the request." }, { status: 400 }) };
  }
  if (text.length > MAX_BODY_BYTES) {
    return {
      ok: false,
      response: Response.json(
        { error: "The photos are too large to send together. Remove one or two and try again." },
        { status: 413 },
      ),
    };
  }
  try {
    return { ok: true, body: JSON.parse(text) };
  } catch {
    return { ok: false, response: Response.json({ error: "Request body must be JSON." }, { status: 400 }) };
  }
}

// Only real calendar dates in YYYY-MM-DD form, not in the future (Bangladesh time).
export function cleanPurchaseDate(value: unknown, todayIso: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return "";
  }
  const date = new Date(value + "T00:00:00Z");
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return ""; // e.g. 2026-02-31
  }
  if (value > todayIso || value < "2000-01-01") {
    return "";
  }
  return value;
}

// User text goes inside """ blocks in the prompts; stop it from closing the block early.
export function cleanUserText(value: unknown, maxLength: number): string {
  if (typeof value !== "string") {
    return "";
  }
  return value.replace(/"""/g, "”””").replace(/\u0000/g, "").trim().slice(0, maxLength);
}
