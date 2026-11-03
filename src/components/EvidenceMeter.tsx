// Evidence strength (0-100), computed in code from what the agent read.
// Each of the four proofs shows whether it is proved, only stated, or missing.

import type { EvidenceScore } from "@/lib/evidence";

const LEVEL_TEXT: Record<EvidenceScore["level"], string> = {
  strong: "Strong",
  fair: "Fair",
  weak: "Weak",
};

const LEVEL_COLOUR: Record<EvidenceScore["level"], string> = {
  strong: "bg-green",
  fair: "bg-stamp",
  weak: "bg-red",
};

const STATE_TEXT = {
  proved: "Proved",
  stated: "Only in your story",
  missing: "Missing",
};

export default function EvidenceMeter({ score }: { score: EvidenceScore }) {
  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="display text-2xl">Evidence strength</h2>
        <p className="text-lg">
          <span className="display text-3xl">{score.total}</span>
          <span className="text-ink-soft">/100, {LEVEL_TEXT[score.level]}</span>
        </p>
      </div>
      <div
        className="mt-3 h-3 w-full overflow-hidden rounded-full bg-paper-line"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={score.total}
        aria-label="Evidence strength"
      >
        <div className={"h-full rounded-full " + LEVEL_COLOUR[score.level]} style={{ width: `${score.total}%` }} />
      </div>
      <ul className="mt-4 grid gap-3 md:grid-cols-2">
        {score.checks.map((check) => (
          <li
            key={check.key}
            className={
              "rounded border-2 bg-white p-3 " +
              (check.state === "proved" ? "border-green" : check.state === "stated" ? "border-paper-line" : "border-red/50")
            }
          >
            <p className="flex items-baseline justify-between gap-2 font-semibold">
              {check.label}
              <span
                className={
                  "text-sm " + (check.state === "proved" ? "text-green" : check.state === "stated" ? "text-ink-soft" : "text-red")
                }
              >
                {STATE_TEXT[check.state]}
              </span>
            </p>
            {check.source && <p className="text-sm text-stamp">{check.source}</p>}
            {check.tip && <p className="mt-1 text-sm text-ink-soft">{check.tip}</p>}
          </li>
        ))}
      </ul>
    </section>
  );
}
