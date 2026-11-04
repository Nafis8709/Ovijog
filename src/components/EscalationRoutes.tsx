// "Where else you can go": channels chosen by rules in lib/escalation.ts.

import type { EscalationRoute } from "@/lib/escalation";

export default function EscalationRoutes({ routes }: { routes: EscalationRoute[] }) {
  if (routes.length === 0) {
    return null;
  }
  return (
    <section>
      <h2 className="display text-2xl">Where to take this</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Based on how you paid and what happened.
      </p>
      <ul className="mt-4 space-y-4">
        {routes.map((route) => (
          <li key={route.id} className="border-l-4 border-ink bg-white p-4">
            <h3 className="text-lg font-semibold">{route.title}</h3>
            <p className="text-ink-soft">{route.when}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {route.how.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
