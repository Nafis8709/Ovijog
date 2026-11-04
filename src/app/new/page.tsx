"use client";

// Step 1 of the flow: the user tells their story and adds screenshots.
// On submit we call /api/analyze, save the case in the browser and open it.

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import VoiceInput from "@/components/VoiceInput";
import { compressImage } from "@/lib/imageUtils";
import { newCaseId, saveCase } from "@/lib/caseStore";
import { todayIso } from "@/lib/deadline";
import { FALSE_CASE_WARNING } from "@/lib/law";
import AgentTrace from "@/components/AgentTrace";
import type { Case, CaseAnalysis, EvidenceItem, TraceStep } from "@/lib/types";

const MAX_IMAGES = 4;

// Two short examples (online and in a shop) so people see it is not only for online orders.
const STORY_PLACEHOLDER =
  "Example: Facebook page theke 2,400 takar jacket order korsilam, bKash e advance dilam. Jacket chera ashse, size o vul, message dile block kore dise.\n\nOr: Pharmacy te ek pata oshudh er MRP 320 taka, kintu amar kach theke 450 taka nilo.";

interface StreamResult {
  analysis?: CaseAnalysis;
  evidence?: EvidenceItem[];
  trace?: TraceStep[];
  error?: string;
}

// Reads the NDJSON stream from /api/analyze line by line.
async function readAgentStream(body: ReadableStream<Uint8Array>, onStep: (step: TraceStep) => void): Promise<StreamResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let result: StreamResult = { error: "The agent stopped before finishing. Try again." };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    let newline = buffer.indexOf("\n");
    while (newline !== -1) {
      const line = buffer.slice(0, newline).trim();
      buffer = buffer.slice(newline + 1);
      if (line !== "") {
        const message = JSON.parse(line);
        if (message.type === "step") {
          onStep(message.step as TraceStep);
        } else if (message.type === "result") {
          result = { analysis: message.analysis, evidence: message.evidence, trace: message.trace };
        } else if (message.type === "error") {
          result = { error: message.error };
        }
      }
      newline = buffer.indexOf("\n");
    }
  }
  return result;
}

function upsertStep(steps: TraceStep[], step: TraceStep): TraceStep[] {
  const updated: TraceStep[] = [];
  let found = false;
  for (const item of steps) {
    if (item.id === step.id) {
      updated.push(step);
      found = true;
    } else {
      updated.push(item);
    }
  }
  if (!found) {
    updated.push(step);
  }
  return updated;
}

export default function NewCasePage() {
  const router = useRouter();
  const [story, setStory] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [maxDate, setMaxDate] = useState("");
  const [steps, setSteps] = useState<TraceStep[]>([]);
  const [finished, setFinished] = useState(false);

  // When a problem is reported, scroll it into view (on phones it is often off-screen).
  useEffect(() => {
    if (error !== "") {
      document.getElementById("form-error")?.scrollIntoView({ block: "center" });
    }
  }, [error]);

  useEffect(() => {
    // "Today" must be read in the browser, not while the page is prerendered.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMaxDate(todayIso());
  }, []);

  function addSpokenText(text: string) {
    setStory((previous) => (previous ? previous + " " + text : text));
  }

  async function handleFiles(fileList: FileList | null) {
    if (fileList === null) {
      return;
    }
    setError("");
    const added: string[] = [];
    for (const file of Array.from(fileList)) {
      if (images.length + added.length >= MAX_IMAGES) {
        setError(`You can add up to ${MAX_IMAGES} screenshots.`);
        break;
      }
      if (!file.type.startsWith("image/")) {
        setError("Only image files can be added.");
        continue;
      }
      try {
        added.push(await compressImage(file));
      } catch {
        setError(`Could not read ${file.name}. Try a PNG or JPG screenshot.`);
      }
    }
    setImages((previous) => [...previous, ...added]);
  }

  function removeImage(index: number) {
    const remaining: string[] = [];
    for (let i = 0; i < images.length; i++) {
      if (i !== index) {
        remaining.push(images[i]);
      }
    }
    setImages(remaining);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (story.trim().length < 20) {
      setError("Describe what happened in at least a sentence or two.");
      return;
    }
    if (!confirmed) {
      setError("Please confirm that your story is true before continuing.");
      return;
    }

    setWorking(true);
    setSteps([]);
    // The form hides and the progress panel appears at the top: bring it into view.
    window.scrollTo({ top: 0 });
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: story, purchaseDate: purchaseDate, images: images }),
      });

      // Errors found before the agent starts come back as normal JSON.
      if (!response.ok || response.body === null) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Something went wrong. Try again.");
        setWorking(false);
        return;
      }

      const result = await readAgentStream(response.body, (step) => {
        setSteps((previous) => upsertStep(previous, step));
      });
      if (result.error) {
        setError(result.error);
        setWorking(false);
        return;
      }

      const newCase: Case = {
        id: newCaseId(),
        createdAt: new Date().toISOString(),
        story: story.trim(),
        purchaseDate: purchaseDate,
        images: images,
        analysis: result.analysis as CaseAnalysis,
        status: "new",
        demandSentAt: "",
        complainant: null,
        complaint: null,
        evidence: result.evidence || [],
        trace: result.trace || [],
        negotiation: [],
      };
      const saved = saveCase(newCase);
      if (!saved) {
        setError("Your browser storage is full or blocked, so the case could not be saved.");
        setWorking(false);
        return;
      }
      setFinished(true);
      // A short pause so the finished steps can be seen before the case opens.
      setTimeout(() => router.push(`/case/${newCase.id}`), 1200);
    } catch {
      setError("Could not reach the server. Check your internet connection and try again.");
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="display text-4xl">Start a case</h1>
      <p className="mt-3 text-ink-soft">
        Tell Ovijog what happened, in your own words. It works for shops, online orders and services. The more proof you add, the stronger your complaint.
      </p>

      {working && (
        <section className="file-cover mt-6 p-2 sm:mt-8 sm:p-4 md:p-6" aria-label="Ovijog is working on your case">
          <div className="sheet rounded-sm p-4 sm:p-5 md:p-7">
            <h2 className="display text-2xl">{finished ? "Your case file is ready" : "Ovijog is working on your case"}</h2>
            <p className="mt-1 text-sm text-ink-soft">
              {finished ? "Opening it now." : "This usually takes 10 to 20 seconds."}
            </p>
            <div className="mt-6">
              {steps.length === 0 ? <p className="text-ink-soft">Starting…</p> : <AgentTrace steps={steps} />}
            </div>
          </div>
        </section>
      )}

      <form onSubmit={handleSubmit} className={"file-cover mt-6 p-2 sm:mt-8 sm:p-4 md:p-6" + (working ? " hidden" : "")}>
        <div className="sheet space-y-7 rounded-sm p-4 sm:p-5 md:p-7">
          <div>
            <label htmlFor="story" className="block text-lg font-semibold">
              What happened?
            </label>
            <p className="text-sm text-ink-soft">
              Bangla, English or Banglish. Mention who you bought from, what it was, how much you paid and what went wrong.
            </p>
            <textarea
              id="story"
              className="field mt-3 min-h-44"
              value={story}
              onChange={(event) => setStory(event.target.value)}
              placeholder={STORY_PLACEHOLDER}
              maxLength={4000}
            />
            <div className="mt-2">
              <VoiceInput onText={addSpokenText} />
            </div>
          </div>

          <div>
            <label htmlFor="purchaseDate" className="block text-lg font-semibold">
              When did you buy it?
            </label>
            <p className="text-sm text-ink-soft">Used for your 30-day deadline if your photos or story do not show a date.</p>
            <input
              id="purchaseDate"
              type="date"
              className="field mt-3 max-w-xs"
              value={purchaseDate}
              max={maxDate || undefined}
              onChange={(event) => setPurchaseDate(event.target.value)}
            />
          </div>

          <div>
            <label htmlFor="screenshots" className="block text-lg font-semibold">
              Photos and screenshots (optional)
            </label>
            <p className="text-sm text-ink-soft">
              A receipt or payment SMS, the order page, post or price tag, your messages with the seller, or a photo of
              what you received. Up to {MAX_IMAGES}.
            </p>
            <input
              id="screenshots"
              type="file"
              accept="image/*"
              multiple
              className="sr-only"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
              disabled={images.length >= MAX_IMAGES}
            />
            {images.length < MAX_IMAGES && (
              <label
                htmlFor="screenshots"
                className="mt-3 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-soft bg-paper px-4 py-5 text-center hover:border-green focus-within:border-green"
              >
                <span className="text-lg font-semibold text-green">{images.length === 0 ? "Add photos" : "Add more photos"}</span>
                <span className="text-sm text-ink-soft">
                  Take a photo or choose from your gallery. {images.length} of {MAX_IMAGES} added.
                </span>
              </label>
            )}
            {images.length > 0 && (
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <li key={index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`Photo ${index + 1}`}
                      className="aspect-[3/4] w-full rounded border border-ink-soft object-cover"
                    />
                    <span className="absolute left-1.5 top-1.5 rounded bg-ink px-1.5 text-xs text-white">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      aria-label={`Remove photo ${index + 1}`}
                      className="absolute right-1.5 top-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-white text-xl font-bold text-red shadow"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-paper-line p-3 text-base">
            <input
              type="checkbox"
              className="mt-1 h-5 w-5 shrink-0 accent-green"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              Everything I have written is true. I understand that Section {FALSE_CASE_WARNING.section} of the Act
              punishes false or harassing complaints.
            </span>
          </label>

          {error && (
            <div id="form-error" role="alert" className="rounded border-l-4 border-red bg-white p-3">
              <p className="text-red">{error}</p>
              {steps.length > 0 && (
                <div className="mt-3">
                  <AgentTrace steps={steps} />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={working}>
              {working ? "Analysing your case…" : "Analyse my case"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
