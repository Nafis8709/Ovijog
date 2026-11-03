"use client";

// The case file: everything the agent found, plus the two stages of action.
// Data comes from localStorage (see caseStore.ts), so this is a client page.

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { deleteCase, getCase, saveCase } from "@/lib/caseStore";
import { computeDeadline, formatDate, formatTaka } from "@/lib/deadline";
import { findSection, PROCEDURE } from "@/lib/law";
import type { Case, Complainant } from "@/lib/types";
import DeadlineStamp from "@/components/DeadlineStamp";
import StatusSteps from "@/components/StatusSteps";
import CopyButton from "@/components/CopyButton";
import AgentTrace from "@/components/AgentTrace";
import EvidenceMeter from "@/components/EvidenceMeter";
import Negotiator from "@/components/Negotiator";
import EscalationRoutes from "@/components/EscalationRoutes";
import { scoreEvidence } from "@/lib/evidence";
import { escalationRoutes } from "@/lib/escalation";
import { downloadDeadline } from "@/lib/calendar";

const EMPTY_COMPLAINANT: Complainant = { name: "", phone: "", email: "", address: "" };

export default function CaseView() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [item, setItem] = useState<Case | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [messageLanguage, setMessageLanguage] = useState<"bn" | "en">("bn");
  const [complainant, setComplainant] = useState<Complainant>(EMPTY_COMPLAINANT);
  const [drafting, setDrafting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const found = getCase(params.id);
    // Reading localStorage must happen after mount (it does not exist on the server).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItem(found);
    if (found !== null && found.complainant !== null) {
      setComplainant(found.complainant);
    }
    setLoaded(true);
  }, [params.id]);

  function update(changes: Partial<Case>) {
    if (item === null) {
      return;
    }
    const updated: Case = { ...item, ...changes };
    saveCase(updated);
    setItem(updated);
  }

  async function draftComplaint(event: React.FormEvent) {
    event.preventDefault();
    if (item === null) {
      return;
    }
    if (complainant.name.trim() === "" || complainant.phone.trim() === "" || complainant.address.trim() === "") {
      setError("Name, phone and address are needed on a formal complaint.");
      return;
    }
    setError("");
    setDrafting(true);
    try {
      const response = await fetch("/api/complaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          story: item.story,
          purchaseDate: item.purchaseDate,
          analysis: item.analysis,
          demandSentAt: item.demandSentAt,
          imageCount: item.images.length,
          evidenceSummaries: item.images.map((_, index) => (item.evidence[index] ? item.evidence[index].summary : "")),
          sellerResponses: item.negotiation.map((turn) => `${turn.analysis.tactic}: ${turn.sellerSaid}`),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not draft the complaint. Try again.");
        setDrafting(false);
        return;
      }
      const updated: Case = { ...item, complainant: complainant, complaint: data.complaint, status: "complaint_ready" };
      saveCase(updated);
      setItem(updated);
      router.push(`/case/${item.id}/letter`);
    } catch {
      setError("Could not reach the server. Check your internet connection.");
      setDrafting(false);
    }
  }

  function removeCase() {
    if (item === null) {
      return;
    }
    if (window.confirm("Delete this case from this browser? This cannot be undone.")) {
      deleteCase(item.id);
      router.push("/cases");
    }
  }

  if (!loaded) {
    return <p className="mx-auto max-w-4xl px-4 py-10 text-ink-soft">Opening the case file…</p>;
  }

  if (item === null) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="display text-3xl">Case not found</h1>
        <p className="mt-3 text-ink-soft">
          Cases are saved in the browser where you created them. This one is not in this browser.
        </p>
        <Link href="/new" className="btn btn-primary mt-6">
          Start a new case
        </Link>
      </div>
    );
  }

  const analysis = item.analysis;
  const deadline = computeDeadline(analysis.incidentDate, item.purchaseDate);
  const demandMessage = messageLanguage === "bn" ? analysis.demandMessageBn : analysis.demandMessageEn;
  const canAct = analysis.isConsumerCase && analysis.matchedSections.length > 0;
  const evidenceScore = scoreEvidence(item);
  const routes = escalationRoutes(analysis);

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10">
      {/* File cover: what, who, how much, and the deadline stamp */}
      <section className="file-cover p-4 shadow-[6px_6px_0_var(--ink)] md:p-6">
        <div className="ledger flex flex-wrap items-start justify-between gap-6 rounded-sm p-5 md:p-7">
          <div className="max-w-xl">
            <p className="text-sm text-ink-soft">Case opened {formatDate(item.createdAt.slice(0, 10))}</p>
            <h1 className="display mt-1 text-3xl md:text-4xl">
              {analysis.productOrService || "Your case"}
              {analysis.amountPaid !== null && <span className="text-green">, {formatTaka(analysis.amountPaid)}</span>}
            </h1>
            <p className="mt-3 text-lg">{analysis.summary}</p>
            <p className="mt-2 text-ink-soft">{analysis.summaryBn}</p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-soft">Seller</dt>
              <dd>{analysis.sellerName || "Not found in evidence"}</dd>
              <dt className="text-ink-soft">Contact</dt>
              <dd className="break-all">{analysis.sellerContact || "Not found in evidence"}</dd>
              <dt className="text-ink-soft">Payment</dt>
              <dd>
                {analysis.paymentMethod || "Unknown"}
                {analysis.transactionId && `, TrxID ${analysis.transactionId}`}
              </dd>
            </dl>
          </div>
          <div className="flex flex-col items-start gap-3">
            <DeadlineStamp deadline={deadline} animate={true} />
            {deadline.known && !deadline.expired && item.status !== "resolved" && (
              <button
                type="button"
                className="text-sm font-semibold text-stamp underline underline-offset-4"
                onClick={() => downloadDeadline(deadline.lastDate, analysis.productOrService || "your case")}
              >
                Add deadline to my calendar
              </button>
            )}
          </div>
        </div>
      </section>

      <StatusSteps status={item.status} />

      {item.trace.length > 0 && (
        <details className="rounded border border-paper-line bg-white p-4">
          <summary className="cursor-pointer font-semibold">How Ovijog reached this</summary>
          <div className="mt-4">
            <AgentTrace steps={item.trace} />
          </div>
        </details>
      )}

      {analysis.isConsumerCase && <EvidenceMeter score={evidenceScore} />}

      {!analysis.isConsumerCase && (
        <section className="rounded border-l-4 border-red bg-white p-5">
          <h2 className="text-xl font-semibold">This may not be a consumer-rights case</h2>
          <p className="mt-2 text-ink-soft">{analysis.notConsumerReason}</p>
          <p className="mt-2 text-ink-soft">
            Ovijog only drafts complaints under the Consumers&apos; Right Protection Act. For hacking, harassment or
            other fraud, contact the police or the relevant authority.
          </p>
        </section>
      )}

      {/* Strengthen the case */}
      {analysis.missingInfo.length > 0 && (
        <section>
          <h2 className="display text-2xl">Make your case stronger</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Evidence confidence: <strong className="text-ink">{analysis.confidence}</strong>. Answering these will help.
          </p>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {analysis.missingInfo.map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ul>
        </section>
      )}

      {/* Timeline: every event points to its evidence */}
      {analysis.timeline.length > 0 && (
        <section>
          <h2 className="display text-2xl">What happened, in order</h2>
          <ol className="mt-4 border-l-2 border-ink">
            {analysis.timeline.map((event, index) => (
              <li key={index} className="relative pb-5 pl-6">
                <span className="absolute -left-[7px] top-2 h-3 w-3 rounded-full bg-ink" />
                <p className="text-sm font-semibold text-ink-soft">{event.date ? formatDate(event.date) : "Date unknown"}</p>
                <p>{event.event}</p>
                <p className="text-sm text-stamp">Evidence: {event.evidence || "none"}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* The law: section text always from our verified list */}
      {analysis.matchedSections.length > 0 && (
        <section>
          <h2 className="display text-2xl">The law the seller broke</h2>
          <p className="mt-1 text-sm text-ink-soft">Consumers&apos; Right Protection Act, 2009. The quoted text comes from the Act, not from the AI.</p>
          <div className="mt-4 space-y-5">
            {analysis.matchedSections.map((match) => {
              const law = findSection(match.section);
              if (!law) {
                return null;
              }
              return (
                <article key={match.section} className="rounded border-2 border-ink bg-white p-5">
                  <h3 className="text-xl font-semibold">
                    Section {law.section}: {law.titleEn}
                  </h3>
                  <p className="text-ink-soft">{law.titleBn}</p>
                  <p className="mt-3">
                    <span className="font-semibold">Why it applies: </span>
                    {match.reason}
                  </p>
                  <p className="mt-1 text-ink-soft">{match.reasonBn}</p>
                  <blockquote className="mt-4 border-l-4 border-stamp pl-4 text-sm text-ink-soft">
                    {law.textEn}
                  </blockquote>
                  <p className="mt-2 text-sm">
                    Maximum penalty: <strong>{law.maxPenalty}</strong>
                  </p>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* Stage 1 */}
      {canAct && (
        <section className="rounded border-2 border-green bg-white p-5 md:p-7">
          <h2 className="display text-2xl text-green">Stage 1: send this to the seller</h2>
          <p className="mt-1 text-ink-soft">
            Paste it into Messenger or WhatsApp. Many sellers refund once they see the law and the deadline.
          </p>
          <div className="mt-4 flex gap-2" role="tablist" aria-label="Message language">
            <button
              type="button"
              role="tab"
              aria-selected={messageLanguage === "bn"}
              className={`btn py-1.5 ${messageLanguage === "bn" ? "btn-primary" : "btn-quiet"}`}
              onClick={() => setMessageLanguage("bn")}
            >
              বাংলা
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={messageLanguage === "en"}
              className={`btn py-1.5 ${messageLanguage === "en" ? "btn-primary" : "btn-quiet"}`}
              onClick={() => setMessageLanguage("en")}
            >
              English
            </button>
          </div>
          <p className="ledger mt-4 whitespace-pre-wrap rounded border border-paper-line p-4 leading-8">{demandMessage}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <CopyButton text={demandMessage} label="Copy message" />
            {item.status === "new" && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => update({ status: "demand_sent", demandSentAt: new Date().toISOString() })}
              >
                I sent it
              </button>
            )}
          </div>

          {item.status === "demand_sent" && (
            <div className="mt-6 border-t border-paper-line pt-5">
              <p>
                Sent on {formatDate(item.demandSentAt.slice(0, 10))}. Give the seller 3 days. What happened?
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <button type="button" className="btn btn-quiet" onClick={() => update({ status: "resolved" })}>
                  Seller fixed it
                </button>
                <a href="#stage-2" className="btn btn-primary">
                  Seller ignored me
                </a>
              </div>
            </div>
          )}

          {item.status !== "new" && <Negotiator item={item} onUpdate={update} />}
        </section>
      )}

      {/* Stage 2 */}
      {canAct && item.status !== "resolved" && (
        <section id="stage-2" className="rounded border-2 border-stamp bg-white p-5 md:p-7">
          <h2 className="display text-2xl text-stamp">Stage 2: formal complaint</h2>
          <p className="mt-1 text-ink-soft">
            A written complaint to the Director General, Directorate of National Consumer Rights Protection. Your
            details appear on the letter and stay in this browser.
          </p>

          {deadline.expired && (
            <p className="mt-3 rounded border-l-4 border-red bg-paper p-3 text-red">
              The 30-day window ({PROCEDURE.deadlineSection}) has passed, so the directorate may not accept this complaint.
              You can still draft it and ask them.
            </p>
          )}

          {item.complaint !== null ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <Link href={`/case/${item.id}/letter`} className="btn btn-primary">
                Open the complaint letter
              </Link>
              {item.status !== "complaint_filed" && (
                <button type="button" className="btn btn-quiet" onClick={() => update({ status: "complaint_filed" })}>
                  I filed it
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={draftComplaint} className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-semibold">Full name</span>
                <input className="field mt-1" value={complainant.name} onChange={(e) => setComplainant({ ...complainant, name: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Mobile number</span>
                <input className="field mt-1" inputMode="tel" value={complainant.phone} onChange={(e) => setComplainant({ ...complainant, phone: e.target.value })} />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Email (optional)</span>
                <input className="field mt-1" type="email" value={complainant.email} onChange={(e) => setComplainant({ ...complainant, email: e.target.value })} />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold">Address</span>
                <textarea className="field mt-1 min-h-20" value={complainant.address} onChange={(e) => setComplainant({ ...complainant, address: e.target.value })} />
              </label>
              {error && (
                <p role="alert" className="text-red md:col-span-2">
                  {error}
                </p>
              )}
              <div className="md:col-span-2">
                <button type="submit" className="btn btn-primary" disabled={drafting}>
                  {drafting ? "Drafting the complaint…" : "Draft my complaint"}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-paper-line pt-5 text-sm text-ink-soft">
            <p className="font-semibold text-ink">Where to file</p>
            <p>
              Online at {PROCEDURE.website}, by email to {PROCEDURE.email}, or in person at the directorate&apos;s
              office. Questions: hotline {PROCEDURE.hotline}.
            </p>
            <p className="mt-1">
              If the seller is fined, {PROCEDURE.rewardPercent}% of the collected fine is paid to you ({PROCEDURE.rewardSection}).
            </p>
          </div>
        </section>
      )}

      {item.status !== "resolved" && <EscalationRoutes routes={routes} />}

      {/* Evidence */}
      {item.images.length > 0 && (
        <section>
          <h2 className="display text-2xl">Evidence</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">
            {item.images.map((image, index) => (
              <li key={index}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={`Screenshot ${index + 1}`} className="w-full rounded border border-ink-soft" />
                <p className="mt-1 text-sm font-semibold">Screenshot {index + 1}</p>
                {item.evidence[index] && (
                  <div className="text-sm text-ink-soft">
                    <p>{item.evidence[index].summary}</p>
                    {item.evidence[index].facts.length > 0 && (
                      <ul className="mt-1 list-disc pl-4">
                        {item.evidence[index].facts.map((fact) => (
                          <li key={fact}>{fact}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="border-t border-paper-line pt-6">
        <p className="text-sm text-ink-soft">Your story, as you wrote it:</p>
        <p className="mt-1 whitespace-pre-wrap">{item.story}</p>
        <button type="button" className="mt-6 text-sm text-red underline" onClick={removeCase}>
          Delete this case
        </button>
      </section>
    </div>
  );
}
