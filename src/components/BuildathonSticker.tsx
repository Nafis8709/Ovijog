"use client";

// Required by the buildathon rules: the organizer-provided sticker must be clearly
// visible near the top of the page. It sits in the slim strip above the navbar.
// If the image ever fails to load, a text badge with the same wording is shown instead.

import { useState } from "react";

const STICKER_PATH = "/buildathon-sticker.webp";
const STICKER_TEXT = "Built For Ostad Presents YUNet AIgnite Buildathon 2026";

export default function BuildathonSticker() {
  const [imageFailed, setImageFailed] = useState(false);

  if (imageFailed) {
    return (
      <span className="rounded border border-ink/60 px-2 py-0.5 text-center text-xs font-semibold leading-tight text-ink">
        {STICKER_TEXT}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={STICKER_PATH}
      alt={STICKER_TEXT}
      width={360}
      height={128}
      className="h-10 w-auto sm:h-12"
      onError={() => setImageFailed(true)}
    />
  );
}
