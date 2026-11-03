// The case id is only known in the browser (cases live in localStorage),
// so the real page is a client component wrapped in Suspense.

import { Suspense } from "react";
import CaseView from "@/views/CaseView";

export default function CasePage() {
  return (
    <Suspense fallback={<p className="mx-auto max-w-4xl px-4 py-10 text-ink-soft">Opening the case file…</p>}>
      <CaseView />
    </Suspense>
  );
}
