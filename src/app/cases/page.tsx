"use client";

// Dashboard: every case saved in this browser, with deadline and status.

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadCases } from "@/lib/caseStore";
import { computeDeadline, formatTaka } from "@/lib/deadline";
import DeadlineStamp from "@/components/DeadlineStamp";
import DemoCaseButton from "@/components/DemoCaseButton";
import type { Case, CaseStatus } from "@/lib/types";

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "Analysed",
  demand_sent: "Demand sent",
  resolved: "Resolved",
  complaint_ready: "Complaint ready",
  complaint_filed: "Filed",
};

function totalAtStake(cases: Case[]): number {
  let total = 0;
  for (const item of cases) {
    if (item.status !== "resolved" && item.analysis.amountPaid !== null) {
      total += item.analysis.amountPaid;
    }
  }
  return total;
}

function totalRecovered(cases: Case[]): number {
  let total = 0;
  for (const item of cases) {
    if (item.status === "resolved" && item.analysis.amountPaid !== null) {
      total += item.analysis.amountPaid;
    }
  }
  return total;
}

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCases(loadCases());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return <p className="mx-auto max-w-5xl px-4 py-10 text-ink-soft">Loading your cases…</p>;
  }

  if (cases.length === 0) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <h1 className="display text-4xl">My cases</h1>
        <p className="mt-4 max-w-xl text-ink-soft">
          No cases yet. Start one with your story and screenshots, or open the sample case to see how it works.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/new" className="btn btn-primary">
            Start a case
          </Link>
          <DemoCaseButton label="Open a sample case" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <h1 className="display text-4xl">My cases</h1>
        <dl className="flex gap-8">
          <div>
            <dt className="text-sm text-ink-soft">Money at stake</dt>
            <dd className="display text-3xl text-red">{formatTaka(totalAtStake(cases))}</dd>
          </div>
          <div>
            <dt className="text-sm text-ink-soft">Recovered</dt>
            <dd className="display text-3xl text-green">{formatTaka(totalRecovered(cases))}</dd>
          </div>
        </dl>
      </div>

      <ul className="mt-8 space-y-5">
        {cases.map((item) => {
          const deadline = computeDeadline(item.analysis.incidentDate, item.purchaseDate);
          return (
            <li key={item.id}>
              <Link
                href={`/case/${item.id}`}
                className="file-cover block p-3 transition-transform hover:-translate-y-0.5"
              >
                <div className="ledger flex flex-wrap items-center justify-between gap-4 rounded-sm p-4">
                  <div>
                    <p className="text-xl font-semibold">
                      {item.analysis.productOrService || "Untitled case"}
                      {item.analysis.amountPaid !== null && `, ${formatTaka(item.analysis.amountPaid)}`}
                    </p>
                    <p className="text-ink-soft">{item.analysis.sellerName || "Unknown seller"}</p>
                    <p className="mt-1 text-sm font-semibold text-green">{STATUS_LABELS[item.status]}</p>
                  </div>
                  {item.status !== "resolved" && <DeadlineStamp deadline={deadline} animate={false} />}
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
