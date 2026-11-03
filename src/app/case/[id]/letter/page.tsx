import { Suspense } from "react";
import LetterView from "@/views/LetterView";

export default function LetterPage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-3xl px-4 py-10 text-ink-soft">Opening the letter…</p>}>
      <LetterView />
    </Suspense>
  );
}
