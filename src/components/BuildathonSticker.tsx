"use client";

// Required by the buildathon rules: the official sticker must be clearly
// visible near the top of the page. It sits in the slim strip above the navbar.
// Put the official image at /public/buildathon-sticker.png and it is used
// automatically. Until then, a text badge with the same wording is shown.

import { useEffect, useState } from "react";

const STICKER_PATH = "/buildathon-sticker.png";
const STICKER_TEXT = "Built For Ostad Presents YUNet AIgnite Buildathon 2026";

export default function BuildathonSticker() {
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    // Try to load the image in the background; switch only if it exists.
    const probe = new Image();
    probe.onload = () => setHasImage(true);
    probe.src = STICKER_PATH;
  }, []);

  if (hasImage) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={STICKER_PATH} alt={STICKER_TEXT} className="h-8 w-auto" />;
  }

  return (
    <span className="rounded border border-ink/60 px-2 py-0.5 text-center text-xs font-semibold leading-tight text-ink">
      {STICKER_TEXT}
    </span>
  );
}
