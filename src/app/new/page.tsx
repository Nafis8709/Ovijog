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
import type { Case, CaseAnalysis } from "@/lib/types";

const MAX_IMAGES = 4;

const STORY_PLACEHOLDER =
  "Example: Facebook page 'XYZ Fashion' theke 2,400 takar jacket order korsilam, bKash e advance dilam. Jacket chera ashse, size o vul. Message dile block kore dise.";

export default function NewCasePage() {
  const router = useRouter();
  const [story, setStory] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const [maxDate, setMaxDate] = useState("");

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
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ story: story, purchaseDate: purchaseDate, images: images }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Something went wrong. Try again.");
        setWorking(false);
        return;
      }

      const newCase: Case = {
        id: newCaseId(),
        createdAt: new Date().toISOString(),
        story: story.trim(),
        purchaseDate: purchaseDate,
        images: images,
        analysis: data.analysis as CaseAnalysis,
        status: "new",
        demandSentAt: "",
        complainant: null,
        complaint: null,
      };
      const saved = saveCase(newCase);
      if (!saved) {
        setError("Your browser storage is full or blocked, so the case could not be saved.");
        setWorking(false);
        return;
      }
      router.push(`/case/${newCase.id}`);
    } catch {
      setError("Could not reach the server. Check your internet connection and try again.");
      setWorking(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="display text-4xl">Start a case</h1>
      <p className="mt-3 text-ink-soft">
        Tell Ovijog what happened, in your own words. The more evidence you add, the stronger your complaint.
      </p>

      <form onSubmit={handleSubmit} className="file-cover mt-8 p-4 md:p-6">
        <div className="ledger space-y-7 rounded-sm p-5 md:p-7">
          <div>
            <label htmlFor="story" className="block text-lg font-semibold">
              What happened?
            </label>
            <p className="text-sm text-ink-soft">
              Bangla, English or Banglish. Mention the seller, the product, how much you paid and what went wrong.
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
            <p className="text-sm text-ink-soft">Used for the 30-day deadline if the screenshots do not show a date.</p>
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
              Screenshots
            </label>
            <p className="text-sm text-ink-soft">
              Order page, payment SMS (bKash or Nagad), your chat with the seller, photos of what you received. Up
              to {MAX_IMAGES}.
            </p>
            <input
              id="screenshots"
              type="file"
              accept="image/*"
              multiple
              className="mt-3 block text-sm"
              onChange={(event) => {
                handleFiles(event.target.files);
                event.target.value = "";
              }}
              disabled={images.length >= MAX_IMAGES}
            />
            {images.length > 0 && (
              <ul className="mt-4 flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <li key={index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={image}
                      alt={`Screenshot ${index + 1}`}
                      className="h-28 w-20 rounded border border-ink-soft object-cover"
                    />
                    <span className="absolute left-1 top-1 rounded bg-ink px-1.5 text-xs text-white">{index + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="mt-1 block w-full text-center text-xs text-red underline"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label className="flex items-start gap-3 text-base">
            <input
              type="checkbox"
              className="mt-1.5 h-4 w-4 accent-green"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              Everything I have written is true. I understand that Section {FALSE_CASE_WARNING.section} of the Act
              punishes false or harassing complaints.
            </span>
          </label>

          {error && (
            <p role="alert" className="rounded border-l-4 border-red bg-white p-3 text-red">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <button type="submit" className="btn btn-primary" disabled={working}>
              {working ? "Analysing your case…" : "Analyse my case"}
            </button>
            {working && <span className="text-sm text-ink-soft">Reading your screenshots and matching the law. This takes about 15 seconds.</span>}
          </div>
        </div>
      </form>
    </div>
  );
}
