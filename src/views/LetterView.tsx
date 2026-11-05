"use client";

// The formal complaint letter in Bangla, laid out for A4 printing.
// "Save as PDF" uses the browser's print dialog, which renders Bangla script
// correctly (most JavaScript PDF libraries break Bangla conjunct letters).

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getCase } from "@/lib/caseStore";
import { todayIso } from "@/lib/deadline";
import { PROCEDURE } from "@/lib/law";
import { toBanglaNumber } from "@/components/DeadlineStamp";
import CopyButton, { copyText } from "@/components/CopyButton";
import type { Case } from "@/lib/types";

function banglaDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${toBanglaNumber(Number(day))}/${toBanglaNumber(Number(month))}/${toBanglaNumber(Number(year))}`;
}

// Plain-text version of the whole letter, for copying or email.
function letterAsText(item: Case, dateText: string): string {
  if (item.complaint === null || item.complainant === null) {
    return "";
  }
  const c = item.complaint;
  const p = item.complainant;
  const lines: string[] = [];
  lines.push(`তারিখ: ${dateText}`);
  lines.push("");
  lines.push("বরাবর,");
  lines.push("মহাপরিচালক,");
  lines.push("জাতীয় ভোক্তা-অধিকার সংরক্ষণ অধিদপ্তর,");
  lines.push("ঢাকা।");
  lines.push("");
  lines.push(c.subjectBn);
  lines.push("");
  lines.push("জনাব,");
  for (const paragraph of c.bodyParagraphsBn) {
    lines.push(paragraph);
    lines.push("");
  }
  lines.push(c.reliefBn);
  lines.push("");
  lines.push("আমি এই মর্মে ঘোষণা করছি যে, উপরে বর্ণিত সকল তথ্য আমার জানা মতে সত্য।");
  lines.push("");
  lines.push("সংযুক্তি:");
  for (let i = 0; i < c.evidenceListBn.length; i++) {
    lines.push(`${toBanglaNumber(i + 1)}. ${c.evidenceListBn[i]}`);
  }
  lines.push("");
  lines.push("বিনীত নিবেদক,");
  lines.push(p.name);
  if (p.fatherName) {
    lines.push(`পিতার নাম: ${p.fatherName}`);
  }
  if (p.motherName) {
    lines.push(`মাতার নাম: ${p.motherName}`);
  }
  if (p.occupation) {
    lines.push(`পেশা: ${p.occupation}`);
  }
  lines.push(`মোবাইল: ${p.phone}`);
  if (p.email) {
    lines.push(`ই-মেইল: ${p.email}`);
  }
  lines.push(`ঠিকানা: ${p.address}`);
  return lines.join("\n");
}

export default function LetterView() {
  const params = useParams<{ id: string }>();
  const [item, setItem] = useState<Case | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [emailNote, setEmailNote] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setItem(getCase(params.id));
    setLoaded(true);
  }, [params.id]);

  if (!loaded) {
    return <p className="mx-auto max-w-3xl px-4 py-10 text-ink-soft">Opening the letter…</p>;
  }

  if (item === null || item.complaint === null || item.complainant === null) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="display text-3xl">No complaint drafted yet</h1>
        <p className="mt-3 text-ink-soft">Open the case and fill in Stage 2 to draft the complaint.</p>
        <Link href={item ? `/case/${item.id}` : "/cases"} className="btn btn-primary mt-6">
          Back to the case
        </Link>
      </div>
    );
  }

  const complaint = item.complaint;
  const person = item.complainant;
  const dateText = banglaDate(todayIso());
  const fullText = letterAsText(item, dateText);
  const subject = encodeURIComponent(complaint.subjectBn.replace(/^বিষয়:\s*/, ""));
  const fullBody = encodeURIComponent(fullText);

  // Many phones and email apps cut off long mailto links (Bangla text becomes very long once encoded).
  // So the letter is always copied first; it is put in the email only when it is short enough.
  async function emailLetter() {
    const copied = await copyText(fullText);
    const fits = fullBody.length < 1800;
    const body = fits
      ? fullBody
      : encodeURIComponent(
          copied
            ? "(আমার অভিযোগপত্রটি কপি করা হয়েছে। এখানে পেস্ট করুন এবং PDF ও স্ক্রিনশট সংযুক্ত করুন।)"
            : "(অভিযোগপত্রটি এখানে পেস্ট করুন এবং PDF ও স্ক্রিনশট সংযুক্ত করুন।)",
        );
    setEmailNote(
      copied
        ? fits
          ? "Your email app is opening. Attach the PDF and your photos before sending."
          : "The letter is copied. Paste it into the email, then attach the PDF and your photos."
        : "Your email app is opening. Use “Copy letter text” first, then paste it into the email.",
    );
    window.location.href = `mailto:${PROCEDURE.email}?subject=${subject}&body=${body}`;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:py-8">
      <Link
        href={`/case/${item.id}`}
        className="no-print mb-3 inline-flex min-h-11 items-center font-semibold text-green underline-offset-4 hover:underline"
      >
        ← Back to the case
      </Link>
      <div className="no-print mb-6 grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button type="button" className="btn btn-primary py-2" onClick={() => window.print()}>
          Print or save as PDF
        </button>
        <CopyButton text={fullText} label="Copy letter text" />
        <button type="button" className="btn btn-quiet py-2" onClick={emailLetter}>
          Email to the directorate
        </button>
      </div>
      {emailNote && (
        <p role="status" className="no-print -mt-3 mb-6 text-sm font-semibold text-green">
          {emailNote}
        </p>
      )}
      <p className="no-print mb-6 text-sm text-ink-soft">
        Read every line before you file. If you email it, attach the PDF and your photos too. Sign the printed copy if
        you submit it in person, and keep a copy for yourself.
      </p>

      <article lang="bn" className="letter rounded border border-paper-line p-5 shadow-[4px_4px_0_var(--ink)] sm:p-8 md:p-12 md:shadow-[6px_6px_0_var(--ink)]">
        <p className="text-right">তারিখ: {dateText}</p>

        <div className="mt-6">
          <p>বরাবর,</p>
          <p>মহাপরিচালক,</p>
          <p>জাতীয় ভোক্তা-অধিকার সংরক্ষণ অধিদপ্তর,</p>
          <p>ঢাকা।</p>
        </div>

        <p className="mt-6 font-semibold">{complaint.subjectBn}</p>

        <p className="mt-6">জনাব,</p>
        {complaint.bodyParagraphsBn.map((paragraph, index) => (
          <p key={index} className="mt-3 sm:text-justify">
            {paragraph}
          </p>
        ))}
        <p className="mt-3 sm:text-justify">{complaint.reliefBn}</p>

        <p className="mt-6">আমি এই মর্মে ঘোষণা করছি যে, উপরে বর্ণিত সকল তথ্য আমার জানা মতে সত্য।</p>

        {complaint.evidenceListBn.length > 0 && (
          <div className="mt-6">
            <p className="font-semibold">সংযুক্তি:</p>
            <ol className="mt-1 list-none">
              {complaint.evidenceListBn.map((evidence, index) => (
                <li key={index}>
                  {toBanglaNumber(index + 1)}. {evidence}
                </li>
              ))}
            </ol>
          </div>
        )}

        <div className="mt-10">
          <p>বিনীত নিবেদক,</p>
          <div className="mt-10 w-48 border-t border-black pt-1 text-sm">স্বাক্ষর</div>
          <p className="mt-2 font-semibold">{person.name}</p>
          {person.fatherName && <p>পিতার নাম: {person.fatherName}</p>}
          {person.motherName && <p>মাতার নাম: {person.motherName}</p>}
          {person.occupation && <p>পেশা: {person.occupation}</p>}
          <p>মোবাইল: {person.phone}</p>
          {person.email && <p>ই-মেইল: {person.email}</p>}
          <p className="whitespace-pre-wrap">ঠিকানা: {person.address}</p>
        </div>

        {/* Screenshots as numbered attachments on the following pages */}
        {item.images.length > 0 && (
          <div className="mt-12 break-before-page">
            <p className="font-semibold">সংযুক্ত প্রমাণ (স্ক্রিনশট)</p>
            {item.images.map((image, index) => (
              <figure key={index} className="mt-6 break-inside-avoid">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={`প্রমাণ ${index + 1}`} className="max-h-[230mm] w-auto border border-black/30" />
                <figcaption className="mt-1 text-sm">স্ক্রিনশট {toBanglaNumber(index + 1)}</figcaption>
              </figure>
            ))}
          </div>
        )}
      </article>
    </div>
  );
}
