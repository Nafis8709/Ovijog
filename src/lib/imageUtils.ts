// Shrinks a screenshot in the browser before upload.
// Phone screenshots are often 3-5 MB; after this they are ~100-250 KB,
// which keeps the AI call fast and fits in localStorage.

const MAX_SIDE = 1400; // px, enough for the AI to read small text
const QUALITY = 0.72;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };
    image.src = url;
  });
}

export async function compressImage(file: File): Promise<string> {
  const image = await loadImage(file);

  let width = image.naturalWidth;
  let height = image.naturalHeight;
  const longestSide = Math.max(width, height);
  if (longestSide > MAX_SIDE) {
    const scale = MAX_SIDE / longestSide;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) {
    throw new Error("Your browser cannot process images.");
  }
  context.fillStyle = "#ffffff"; // transparent PNGs become white, not black
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", QUALITY);
}
