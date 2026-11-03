"use client";

// Required by the buildathon rules: the official sticker must be clearly
// visible near the top of the page.
// Put the official image at /public/buildathon-sticker.png and it is used
// automatically. Until then, a text badge with the same wording is shown.

import { useEffect, useState } from "react";

const STICKER_PATH = "/buildathon-sticker.png";

export default function BuildathonSticker() {
  const [hasImage, setHasImage] = useState(false);

  useEffect(() => {
    // Try to load the image in the background; switch only if it exists.
    const probe = new Image();
    probe.onload = () => setHasImage(true);
    probe.src = STICKER_PATH;
  }, []);

  if (hasImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={STICKER_PATH} alt="Built For Ostad Presents YUNet AIgnite Buildathon 2026" className="h-10 w-auto" />
    );
  }

  return (
    <span className="rounded-md border-2 border-ink bg-white px-2 py-1 text-xs font-semibold leading-tight text-ink">
      Built For Ostad Presents
      <br />
      YUNet AIgnite Buildathon 2026
    </span>
  );
}
