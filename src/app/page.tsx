import Link from "next/link";
import DemoCaseButton from "@/components/DemoCaseButton";
import { PROCEDURE, FALSE_CASE_WARNING } from "@/lib/law";

const STEPS = [
  {
    title: "Tell us what happened",
    body: "Type or speak your story in Bangla, English or Banglish, and add screenshots of the order, the payment and the chat.",
  },
  {
    title: "Send the seller a demand",
    body: "Watch Ovijog read your evidence and find the section of the Act the seller broke. It writes a firm refund demand, and if the seller replies with excuses, it tells you what they are doing and what to send back.",
  },
  {
    title: "File a formal complaint",
    body: "If the seller ignores you, Ovijog drafts the written complaint to the consumer rights directorate with a numbered evidence list, ready to print or submit.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero: the story on one side, the case file it becomes on the other */}
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:py-20">
        <div>
          <h1 className="display text-4xl text-ink md:text-6xl">
            Cheated by an online seller? Make it a legal complaint.
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Ovijog is an AI agent for Bangladeshi shoppers. It turns your story and screenshots into a demand
            message for the seller and, if needed, a formal complaint under the Consumers&apos; Right Protection
            Act, 2009. If the seller is fined, the law gives {PROCEDURE.rewardPercent}% of the fine to you.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/new" className="btn btn-primary">
              Start a case
            </Link>
            <DemoCaseButton label="Open a sample case" />
          </div>
        </div>

        {/* A static preview of what a case looks like */}
        <div className="file-cover p-5 shadow-[6px_6px_0_var(--ink)]" aria-hidden="true">
          <div className="ledger rounded-sm p-5">
            <p className="text-sm text-ink-soft">Case file</p>
            <p className="mt-1 text-xl font-semibold">Leather jacket, ৳2,400</p>
            <p className="mt-2 text-base text-ink-soft">
              Paid by bKash. Received a torn rexine jacket in the wrong size. Seller blocked the buyer.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm">
                <p>Section 45: promised goods not delivered</p>
                <p>Section 44: false advertisement</p>
              </div>
              <span className="stamp text-2xl">
                ২২ দিন বাকি
                <span className="block text-xs font-semibold">to file</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* How it works: a real sequence, so it is numbered */}
      <section className="border-t-2 border-ink py-12">
        <h2 className="display text-3xl">How it works</h2>
        <ol className="mt-8 grid gap-8 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="border-l-4 border-green pl-4">
              <span className="display text-4xl text-green">{index + 1}</span>
              <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
              <p className="mt-2 text-ink-soft">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Why: the facts that make the problem real */}
      <section className="border-t-2 border-ink py-12">
        <h2 className="display text-3xl">Why most people never complain</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div>
            <p className="display text-5xl text-red">61%</p>
            <p className="mt-2 text-ink-soft">
              of all complaints to the consumer rights directorate last fiscal year were about online shopping
              fraud.
            </p>
            <p className="mt-1 text-xs text-ink-soft">Source: ITV BD, October 2026</p>
          </div>
          <div>
            <p className="display text-5xl text-stamp">{PROCEDURE.deadlineDays} days</p>
            <p className="mt-2 text-ink-soft">
              is all you get. A complaint must be filed within {PROCEDURE.deadlineDays} days of the problem, or it
              may be rejected.
            </p>
            <p className="mt-1 text-xs text-ink-soft">{PROCEDURE.deadlineSection}, Consumers&apos; Right Protection Act 2009</p>
          </div>
          <div>
            <p className="display text-5xl text-green">{PROCEDURE.rewardPercent}%</p>
            <p className="mt-2 text-ink-soft">
              of any fine collected from the seller is paid to the person who complained. Few people know this.
            </p>
            <p className="mt-1 text-xs text-ink-soft">{PROCEDURE.rewardSection}, Consumers&apos; Right Protection Act 2009</p>
          </div>
        </div>
      </section>

      {/* Trust: how the AI is kept honest */}
      <section className="border-t-2 border-ink py-12">
        <h2 className="display text-3xl">How Ovijog stays honest</h2>
        <ul className="mt-6 max-w-3xl list-disc space-y-3 pl-5 text-ink-soft">
          <li>The AI can only cite sections from a fixed list of the Act. The legal text you see always comes from that list, never from the AI.</li>
          <li>You can see every step the agent took, marked AI or Code. The 30-day deadline and the evidence score are calculated by the app, not guessed by the AI.</li>
          <li>Phone numbers and offices are never written by the AI. They come from a list checked by hand.</li>
          <li>Every fact in the timeline points to the screenshot or statement it came from. Missing facts are left blank and turned into questions for you.</li>
          <li>
            Section {FALSE_CASE_WARNING.section} of the Act punishes false or harassing complaints, so Ovijog reminds you
            to file only what is true.
          </li>
        </ul>
      </section>
    </div>
  );
}
