// "What to do now": one clear next action at the top of the case page,
// so nobody has to scroll through the whole file to find it.

import Link from "next/link";
import type { Case } from "@/lib/types";
import type { DeadlineInfo } from "@/lib/deadline";
import type { EvidenceScore } from "@/lib/evidence";

interface Props {
  item: Case;
  deadline: DeadlineInfo;
  score: EvidenceScore;
  canAct: boolean;
}

interface Action {
  label: string;
  href: string;
  primary: boolean;
}

function showEvidenceTipFor(item: Case, score: EvidenceScore, canAct: boolean): boolean {
  return canAct && score.level === "weak" && item.status !== "resolved" && item.status !== "complaint_filed";
}

export default function NextStep({ item, deadline, score, canAct }: Props) {
  let title = "";
  let body = "";
  const actions: Action[] = [];

  if (!canAct) {
    title = "This may not be something Ovijog can help with";
    body = "Read the note below. Ovijog only prepares complaints about goods or services you paid a business for.";
  } else if (item.status === "new") {
    title = "Next: send the seller a message";
    body = "Copy the message Ovijog wrote, send it to the seller, then tap “I sent it”. Many sellers fix the problem at this point.";
    actions.push({ label: "Go to the message", href: "#stage-1", primary: true });
  } else if (item.status === "demand_sent") {
    title = "Next: give the seller up to 3 days";
    body = "If they reply, paste their answer and Ovijog will help you respond. If they ignore you or refuse, write the formal complaint.";
    actions.push({ label: "Paste their reply", href: "#negotiation", primary: true });
    actions.push({ label: "Write the complaint", href: "#stage-2", primary: false });
  } else if (item.status === "complaint_ready") {
    title = "Next: submit your complaint";
    body = "Read the letter, then print it, save it as PDF or email it to the consumer rights directorate. Tap “I filed it” when it is done.";
    actions.push({ label: "Open the letter", href: `/case/${item.id}/letter`, primary: true });
    actions.push({ label: "Where to file", href: "#where", primary: false });
  } else if (item.status === "complaint_filed") {
    title = "Complaint filed";
    body = "Keep any complaint number you were given. The directorate may call you, so keep your phone close and your proof saved.";
  } else if (item.status === "resolved") {
    title = "Resolved";
    body = "The seller fixed the problem. Keep your proof for a few weeks in case anything goes wrong again.";
  }

  const showEvidenceTip = showEvidenceTipFor(item, score, canAct);
  if (showEvidenceTipFor(item, score, canAct)) {
    actions.push({ label: "Add photos", href: "#evidence", primary: false });
  }

  const showDeadlineWarning = canAct && deadline.known && item.status !== "resolved" && item.status !== "complaint_filed";

  return (
    <section className="rounded-lg border-2 border-ink bg-white p-4 sm:p-5" aria-label="What to do now">
      <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
      <p className="mt-1 text-ink-soft">{body}</p>

      {showDeadlineWarning && deadline.expired && (
        <p className="mt-3 text-red">The 30 days to complain have passed. The directorate may not accept a complaint now.</p>
      )}
      {showDeadlineWarning && !deadline.expired && deadline.daysLeft <= 5 && (
        <p className="mt-3 font-semibold text-red">Only {deadline.daysLeft} days left to file. Do not wait too long for the seller.</p>
      )}
      {showEvidenceTip && (
        <p className="mt-3 text-sm">
          Your proof is weak ({score.total}/100). Adding photos makes your complaint harder to dismiss.
        </p>
      )}

      {actions.length > 0 && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {actions.map((action) =>
            action.href.startsWith("/") ? (
              <Link key={action.label} href={action.href} className={"btn " + (action.primary ? "btn-primary" : "btn-quiet")}>
                {action.label}
              </Link>
            ) : (
              <a key={action.label} href={action.href} className={"btn " + (action.primary ? "btn-primary" : "btn-quiet")}>
                {action.label}
              </a>
            ),
          )}
        </div>
      )}
    </section>
  );
}
