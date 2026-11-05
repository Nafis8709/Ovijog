"use client";

import { useState } from "react";

// Copies text to the clipboard. Uses the modern Clipboard API, and falls back to a
// hidden text box for older phones and in-app browsers (e.g. Facebook's) that block it.
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the older method
  }
  try {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.top = "-1000px";
    document.body.appendChild(box);
    box.select();
    const copied = document.execCommand("copy");
    box.remove();
    return copied;
  } catch {
    return false;
  }
}

export default function CopyButton({ text, label }: { text: string; label: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    const copied = await copyText(text);
    setState(copied ? "copied" : "failed");
    setTimeout(() => setState("idle"), copied ? 2000 : 5000);
  }

  return (
    <>
      <button type="button" className="btn btn-quiet py-2" onClick={copy} aria-live="polite">
        {state === "copied" ? "Copied" : label}
      </button>
      {state === "failed" && (
        <span role="status" className="text-sm text-red">
          Your browser blocked copying. Press and hold the text to select and copy it.
        </span>
      )}
    </>
  );
}
