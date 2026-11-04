// Shows the agent's steps: live while it works (on the new-case page),
// and afterwards as "How Ovijog built this case" on the case page.
// (Each step also records whether the AI or plain code did it; see TraceStep.by.)

import type { TraceStep } from "@/lib/types";

function StatusMark({ status }: { status: TraceStep["status"] }) {
  if (status === "running") {
    return (
      <span className="mt-1 inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-green border-t-transparent motion-reduce:animate-none" aria-label="Working" />
    );
  }
  if (status === "done") {
    return (
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green text-xs font-bold text-white" aria-label="Done">
        ✓
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red text-xs font-bold text-white" aria-label="Failed">
        !
      </span>
    );
  }
  return <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded-full border-2 border-paper-line" aria-label="Skipped" />;
}

export default function AgentTrace({ steps }: { steps: TraceStep[] }) {
  return (
    <ol className="space-y-4" aria-live="polite">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3">
          <StatusMark status={step.status} />
          <div className="min-w-0">
            <p className="font-semibold">{step.label}</p>
            {step.details.length > 0 && (
              <ul className="mt-1 space-y-0.5 text-sm text-ink-soft">
                {step.details.map((detail, index) => (
                  <li key={index} className="break-words">
                    {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
