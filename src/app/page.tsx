import Link from "next/link";
import DemoCaseButton from "@/components/DemoCaseButton";
import { PROCEDURE } from "@/lib/law";

// The kinds of problems the Consumers' Right Protection Act covers, in everyday words.
const PROBLEMS = [
  {
    title: "Online orders",
    examples: [
      "You paid but the order never arrived",
      "Wrong, damaged or fake item delivered",
      "The page blocked you after you paid",
    ],
  },
  {
    title: "Shops and markets",
    examples: [
      "Charged more than the printed price (MRP)",
      "Less weight or quantity than you paid for",
      "Expired food, cosmetics or medicine",
    ],
  },
  {
    title: "Services",
    examples: [
      "Courier lost or damaged your parcel",
      "Repair or service not done as promised",
      "Careless service that cost you money",
    ],
  },
  {
    title: "Misleading ads",
    examples: [
      "“Original” that turned out to be a copy",
      "Product nothing like the photo or post",
      "Discounts or offers that were not real",
    ],
  },
];

const STEPS = [
  {
    title: "Tell us what happened",
    body: "Write or speak in Bangla, English or Banglish. Add photos or screenshots of the payment, the order or receipt, and any messages.",
  },
  {
    title: "Ask the seller to fix it",
    body: "Ovijog finds which part of the law was broken and writes a polite, firm message asking for a refund or replacement. If they reply with excuses, it helps you answer.",
  },
  {
    title: "File a formal complaint",
    body: "If the seller still won't fix it, Ovijog writes the official complaint letter in Bangla, ready to print, save as PDF or email to the consumer rights directorate.",
  },
];

const QUESTIONS = [
  {
    question: "Does Ovijog send the complaint for me?",
    answer:
      "No. Ovijog prepares the message and the letter. You read them, change anything you want, and send them yourself, so you stay in control.",
  },
  {
    question: "What do I need to start?",
    answer:
      "Just your story. Proof makes it stronger: the bKash or Nagad SMS or receipt, the order page or post, your messages with the seller, and photos of what you received.",
  },
  {
    question: "What if more than 30 days have passed?",
    answer:
      "The directorate may not accept a complaint after 30 days. You can still send the seller the message, and ask your bank or mobile wallet for help if you paid digitally.",
  },
  {
    question: "Will I really get 25% of the fine?",
    answer:
      "Only if the directorate investigates, fines the seller and collects the fine. That is the law, but it is not guaranteed, and it can take time.",
  },
  {
    question: "Where is my information kept?",
    answer:
      "Your cases are saved only in this browser on this device. Your story and screenshots are sent to an AI service to read them; Ovijog does not keep them on a server.",
  },
  {
    question: "Is this legal advice?",
    answer:
      "No. Ovijog helps you organise the facts and write clearly. For a court case or a large amount of money, talk to a lawyer.",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero: the problem in the visitor's words, and the case file it becomes */}
      <section className="grid items-center gap-10 py-12 md:grid-cols-[1.15fr_1fr] md:py-20">
        <div>
          <h1 className="display text-4xl text-ink md:text-6xl">Cheated on a purchase? Get your money back.</h1>
          <p className="mt-5 max-w-xl text-lg text-ink-soft">
            Tell Ovijog what went wrong. It writes the message to send the seller and, if they won&apos;t fix it, a
            formal complaint to the consumer rights directorate. Everything is in Bangla and ready to send.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/new" className="btn btn-primary">
              Start a case
            </Link>
            <DemoCaseButton label="See an example" />
          </div>
          <p className="mt-4 text-sm text-ink-soft">Free to use. No account. No lawyer needed to start.</p>
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

      {/* What it covers: four groups of everyday problems (not a sequence, so not numbered) */}
      <section className="border-t-2 border-ink py-12">
        <h2 className="display text-3xl">What Ovijog can help with</h2>
        <p className="mt-2 max-w-2xl text-ink-soft">
          Any time a business took your money and did not give you what it promised, at a shop, online or for a
          service.
        </p>
        <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {PROBLEMS.map((group) => (
            <div key={group.title} className="border-l-4 border-ink pl-4">
              <h3 className="text-xl font-semibold">{group.title}</h3>
              <ul className="mt-2 space-y-1.5 text-ink-soft">
                {group.examples.map((example) => (
                  <li key={example}>{example}</li>
                ))}
              </ul>
            </div>
          ))}
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

      {/* Rights: the three facts every buyer in Bangladesh should know */}
      <section className="border-t-2 border-ink py-12">
        <h2 className="display text-3xl">Know your rights</h2>
        <div className="mt-8 grid gap-8 md:grid-cols-3">
          <div>
            <p className="display text-5xl text-stamp">{PROCEDURE.deadlineDays} days</p>
            <p className="mt-2 text-ink-soft">
              to complain. File within {PROCEDURE.deadlineDays} days of the problem, or the directorate may not accept
              it.
            </p>
            <p className="mt-1 text-xs text-ink-soft">{PROCEDURE.deadlineSection}, Consumers&apos; Right Protection Act, 2009</p>
          </div>
          <div>
            <p className="display text-5xl text-green">{PROCEDURE.rewardPercent}%</p>
            <p className="mt-2 text-ink-soft">
              of any fine collected from the seller is paid to you, the person who complained.
            </p>
            <p className="mt-1 text-xs text-ink-soft">{PROCEDURE.rewardSection}, Consumers&apos; Right Protection Act, 2009</p>
          </div>
          <div>
            <p className="display text-5xl text-ink">{PROCEDURE.hotline}</p>
            <p className="mt-2 text-ink-soft">
              is the consumer rights hotline. You can complain yourself, by email, online or at their office.
            </p>
            <p className="mt-1 text-xs text-ink-soft">Directorate of National Consumer Rights Protection</p>
          </div>
        </div>
      </section>

      {/* Questions people ask before they start */}
      <section className="border-t-2 border-ink py-12">
        <h2 className="display text-3xl">Questions</h2>
        <div className="mt-6 max-w-3xl divide-y divide-paper-line border-y border-paper-line">
          {QUESTIONS.map((item) => (
            <details key={item.question} className="group py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                {item.question}
                <span className="text-2xl text-green transition-transform group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true">
                  +
                </span>
              </summary>
              <p className="mt-2 text-ink-soft">{item.answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-10">
          <Link href="/new" className="btn btn-primary">
            Start a case
          </Link>
        </div>
      </section>
    </div>
  );
}
