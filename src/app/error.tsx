"use client";

// Shown if something on a page crashes (for example, damaged saved data).
// The user can try again; their other cases are not affected.

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="display text-4xl">Something went wrong</h1>
      <p className="mt-3 text-ink-soft">
        This page could not be shown. Try again. If it keeps happening, go back to My cases and open the case again.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>
          Try again
        </button>
        <Link href="/cases" className="btn btn-quiet">
          My cases
        </Link>
      </div>
    </div>
  );
}
