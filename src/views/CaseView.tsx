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
import NextStep from "@/components/NextStep";
import AddEvidence from "@/components/AddEvidence";
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
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-6 sm:space-y-10 sm:py-10">
      {/* File cover: what, who, how much, and the deadline stamp */}
      <section className="file-cover p-2 shadow-[4px_4px_0_var(--ink)] sm:p-4 md:p-6 md:shadow-[6px_6px_0_var(--ink)]">
        <div className="sheet flex flex-wrap items-start justify-between gap-6 rounded-sm p-4 sm:p-5 md:flex-nowrap md:p-7">
          <div className="min-w-0 max-w-xl md:flex-1">
            <p className="text-sm text-ink-soft">Case opened {formatDate(item.createdAt.slice(0, 10))}</p>
            <h1 className="display mt-1 text-3xl break-words md:text-4xl">
              {analysis.productOrService || "Your case"}
              {analysis.amountPaid !== null && <span className="text-green">, {formatTaka(analysis.amountPaid)}</span>}
            </h1>
            <p className="mt-3 sm:text-lg">{analysis.summary}</p>
            <p className="mt-2 text-ink-soft">{analysis.summaryBn}</p>
            <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              <dt className="text-ink-soft">Seller</dt>
              <dd className="break-words">{analysis.sellerName || "Not found yet"}</dd>
              <dt className="text-ink-soft">Contact</dt>
              <dd className="break-all">{analysis.sellerContact || "Not found yet"}</dd>
              <dt className="text-ink-soft">Payment</dt>
              <dd className="break-words">
                {analysis.paymentMethod || "Unknown"}
                {analysis.transactionId && `, TrxID ${analysis.transactionId}`}
              </dd>
            </dl>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3">
            <DeadlineStamp deadline={deadline} animate={true} />
            {deadline.known && !deadline.expired && item.status !== "resolved" && (
              <button
                type="button"
                className="btn btn-quiet py-1.5 text-sm"
                onClick={() => downloadDeadline(deadline.lastDate, analysis.productOrService || "your case")}
              >
                Add deadline to my calendar
              </button>
            )}
          </div>
        </div>
      </section>

      {/* One clear action, so nobody has to scroll to find what to do */}
      <NextStep item={item} deadline={deadline} score={evidenceScore} canAct={canAct} />

      <StatusSteps status={item.status} />

      {!analysis.isConsumerCase && (
        <section className="rounded border-l-4 border-red bg-white p-4 sm:p-5">
          <h2 className="text-xl font-semibold">This may not be a consumer-rights case</h2>
          <p className="mt-2 text-ink-soft">{analysis.notConsumerReason}</p>
          <p className="mt-2 text-ink-soft">
            Ovijog only drafts complaints under the Consumers&apos; Right Protection Act. For hacking, harassment or
            other fraud, contact the police or the relevant authority.
          </p>
        </section>
      )}

      {/* Stage 1 */}
      {canAct && (
        <section id="stage-1" className="rounded border-2 border-green bg-white p-4 sm:p-5 md:p-7">
          <h2 className="display text-2xl text-green">Stage 1: send this to the seller</h2>
          <p className="mt-1 text-ink-soft">
            Send it by Messenger, WhatsApp or SMS, or show it at the shop. Many sellers fix the problem once they see the law and a deadline.
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
          <p className="ledger mt-4 whitespace-pre-wrap break-words rounded border border-paper-line p-3 leading-8 sm:p-4">{demandMessage}</p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
        <section id="stage-2" className="rounded border-2 border-stamp bg-white p-4 sm:p-5 md:p-7">
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
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
                <input
                  className="field mt-1"
                  autoComplete="name"
                  value={complainant.name}
                  onChange={(e) => setComplainant({ ...complainant, name: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Mobile number</span>
                <input
                  className="field mt-1"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="01XXXXXXXXX"
                  value={complainant.phone}
                  onChange={(e) => setComplainant({ ...complainant, phone: e.target.value })}
                />
              </label>
              <label className="block">
                <span className="text-sm font-semibold">Email (optional)</span>
                <input
                  className="field mt-1"
                  type="email"
                  autoComplete="email"
                  value={complainant.email}
                  onChange={(e) => setComplainant({ ...complainant, email: e.target.value })}
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-semibold">Address</span>
                <textarea
                  className="field mt-1 min-h-20"
                  autoComplete="street-address"
                  value={complainant.address}
                  onChange={(e) => setComplainant({ ...complainant, address: e.target.value })}
                />
              </label>
              {error && (
                <p role="alert" className="text-red md:col-span-2">
                  {error}
                </p>
              )}
              <div className="md:col-span-2">
                <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={drafting}>
                  {drafting ? "Drafting the complaint…" : "Draft my complaint"}
                </button>
              </div>
            </form>
          )}

          <p className="mt-6 border-t border-paper-line pt-5 text-sm text-ink-soft">
            If the seller is fined, {PROCEDURE.rewardPercent}% of the collected fine is paid to you ({PROCEDURE.rewardSection}).
          </p>
        </section>
      )}

      {item.status !== "resolved" && (
        <div id="where">
          <EscalationRoutes routes={routes} />
        </div>
      )}

      {/* Proof: strength, what is missing, the photos, and adding more */}
      {analysis.isConsumerCase && (
        <section id="evidence" className="space-y-6">
          <EvidenceMeter score={evidenceScore} />

          {analysis.missingInfo.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold">Questions that would make your case stronger</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-soft">
                {analysis.missingInfo.map((question) => (
                  <li key={question}>{question}</li>
                ))}
              </ul>
            </div>
          )}

          {item.images.length > 0 && (
            <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {item.images.map((image, index) => (
                <li key={index} className="min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image} alt={`Photo ${index + 1}`} className="w-full rounded border border-ink-soft" />
                  <p className="mt-1 text-sm font-semibold">Photo {index + 1}</p>
                  {item.evidence[index] && (
                    <div className="break-words text-sm text-ink-soft">
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
          )}

          {item.status !== "resolved" && <AddEvidence item={item} onUpdate={update} />}
        </section>
      )}

      {/* The law: section text always from our verified list */}
      {analysis.matchedSections.length > 0 && (
        <section>
          <h2 className="display text-2xl">The law the seller broke</h2>
          <p className="mt-1 text-sm text-ink-soft">From the Consumers&apos; Right Protection Act, 2009.</p>
          <div className="mt-4 space-y-4">
            {analysis.matchedSections.map((match) => {
              const law = findSection(match.section);
              if (!law) {
                return null;
              }
              return (
                <article key={match.section} className="rounded border-2 border-ink bg-white p-4 sm:p-5">
                  <h3 className="text-lg font-semibold sm:text-xl">
                    Section {law.section}: {law.titleEn}
                  </h3>
                  <p className="text-ink-soft">{law.titleBn}</p>
                  <p className="mt-3">
                    <span className="font-semibold">Why it applies: </span>
                    {match.reason}
                  </p>
                  <p className="mt-1 text-ink-soft">{match.reasonBn}</p>
                  <p className="mt-2 text-sm">
                    Maximum penalty: <strong>{law.maxPenalty}</strong>
                  </p>
                  <details className="mt-2">
                    <summary className="inline-flex min-h-11 cursor-pointer items-center text-sm font-semibold text-stamp">
                      Read the exact text of the law
                    </summary>
                    <blockquote className="mt-1 border-l-4 border-stamp pl-4 text-sm text-ink-soft">{law.textEn}</blockquote>
                  </details>
                </article>
              );
            })}
          </div>
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
                <p className="break-words">{event.event}</p>
                <p className="text-sm text-stamp">Proof: {event.evidence || "none"}</p>
              </li>
            ))}
          </ol>
        </section>
      )}

      {item.trace.length > 0 && (
        <details className="rounded border border-paper-line bg-white px-4">
          <summary className="flex min-h-12 cursor-pointer items-center font-semibold">How Ovijog built this case</summary>
          <div className="pb-4 pt-2">
            <AgentTrace steps={item.trace} />
          </div>
        </details>
      )}

      <section className="border-t border-paper-line pt-6">
        <p className="text-sm text-ink-soft">Your story, as you wrote it:</p>
        <p className="mt-1 whitespace-pre-wrap break-words">{item.story}</p>
        <button type="button" className="mt-4 inline-flex min-h-11 items-center text-sm text-red underline" onClick={removeCase}>
          Delete this case
        </button>
      </section>
    </div>
  );
}
