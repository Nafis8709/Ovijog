"use client";

// Add more photos to a case after it was created. Ovijog reads them and the
// evidence strength updates. The photos are also attached to the complaint letter.

import { useState } from "react";
import { compressImage } from "@/lib/imageUtils";
import type { Case, EvidenceItem } from "@/lib/types";

const MAX_PHOTOS = 8; // per case, so the browser storage does not fill up

interface Props {
  item: Case;
  onUpdate: (changes: Partial<Case>) => void;
}

export default function AddEvidence({ item, onUpdate }: Props) {
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");
  const room = MAX_PHOTOS - item.images.length;

  async function addPhotos(fileList: FileList | null) {
    if (fileList === null || fileList.length === 0) {
      return;
    }
    setError("");
    const files = Array.from(fileList).slice(0, Math.min(room, 4));
    const added: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        continue;
      }
      try {
        added.push(await compressImage(file));
      } catch {
        setError(`Could not read ${file.name}. Try a PNG or JPG.`);
      }
    }
    if (added.length === 0) {
      return;
    }

    setWorking(true);
    try {
      const response = await fetch("/api/evidence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: added, startIndex: item.images.length }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not read the photos. Try again.");
        setWorking(false);
        return;
      }
      onUpdate({
        images: [...item.images, ...added],
        evidence: [...item.evidence, ...(data.evidence as EvidenceItem[])],
      });
    } catch {
      setError("Could not reach the server. Check your internet connection.");
    }
    setWorking(false);
  }

  if (room <= 0) {
    return <p className="text-sm text-ink-soft">This case already has {MAX_PHOTOS} photos, the most it can hold.</p>;
  }

  return (
    <div>
      <input
        id="add-evidence"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={working}
        onChange={(event) => {
          addPhotos(event.target.files);
          event.target.value = "";
        }}
      />
      <label
        htmlFor="add-evidence"
        className={
          "flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-soft bg-white px-4 py-4 text-center hover:border-green" +
          (working ? " pointer-events-none opacity-60" : "")
        }
      >
        <span className="text-lg font-semibold text-green">{working ? "Reading your photos…" : "Add photos"}</span>
        <span className="text-sm text-ink-soft">Receipts, payment SMS, the post or price tag, messages, or the product.</span>
      </label>
      {error && (
        <p role="alert" className="mt-2 text-red">
          {error}
        </p>
      )}
    </div>
  );
}
