// Shows where the case is in the two-stage process.

import type { CaseStatus } from "@/lib/types";

const STEPS: { key: string; label: string }[] = [
  { key: "analysed", label: "Case analysed" },
  { key: "demand", label: "Demand sent to seller" },
  { key: "complaint", label: "Complaint ready" },
  { key: "filed", label: "Filed with the directorate" },
];

function stepsDone(status: CaseStatus): number {
  if (status === "new") return 1;
  if (status === "demand_sent") return 2;
  if (status === "complaint_ready") return 3;
  if (status === "complaint_filed") return 4;
  return 2; // resolved after the demand
}

export default function StatusSteps({ status }: { status: CaseStatus }) {
  if (status === "resolved") {
    return (
      <p className="rounded border-l-4 border-green bg-green-soft p-3 font-semibold text-green">
        Resolved: the seller fixed the problem after your demand.
      </p>
    );
  }

  const done = stepsDone(status);
  return (
    <ol className="grid grid-cols-2 gap-2 md:grid-cols-4">
      {STEPS.map((step, index) => {
        const isDone = index < done;
        return (
          <li
            key={step.key}
            className={
              "rounded border-2 px-3 py-2 text-sm " +
              (isDone ? "border-green bg-green-soft text-green" : "border-paper-line bg-white text-ink-soft")
            }
          >
            <span className="font-semibold">{index + 1}.</span> {step.label}
          </li>
        );
      })}
    </ol>
  );
}
