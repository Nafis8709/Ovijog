"use client";

// Loads the built-in sample case (no AI call) and opens it.
// Useful for judges and as a safe fallback during a live demo.

import { useRouter } from "next/navigation";
import { buildDemoCase } from "@/lib/demoCase";
import { saveCase } from "@/lib/caseStore";

export default function DemoCaseButton({ label }: { label: string }) {
  const router = useRouter();

  function openDemo() {
    const demo = buildDemoCase();
    saveCase(demo);
    router.push(`/case/${demo.id}`);
  }

  return (
    <button type="button" className="btn btn-quiet" onClick={openDemo}>
      {label}
    </button>
  );
}
