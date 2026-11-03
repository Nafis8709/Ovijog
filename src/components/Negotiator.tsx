"use client";

// Stage 1.5: the seller replied to the demand.
// The user pastes the reply (or a screenshot of it); Ovijog names the seller's
// tactic, recommends accept / counter / escalate and drafts the next message.
// Every round is saved in the case and later quoted in the formal complaint.

import { useState } from "react";
import CopyButton from "./CopyButton";
import { compressImage } from "@/lib/imageUtils";
import { formatDate } from "@/lib/deadline";
import type { Case, NegotiationTurn, ReplyAnalysis, SellerTactic } from "@/lib/types";

const TACTIC_LABELS: Record<SellerTactic, string> = {
  refund_offered: "Refund offered",
  replacement_offered: "Replacement offered",
  partial_offer: "Partial offer",
  stalling: "Stalling",
  denial: "Denial",
  blame_shifting: "Blaming someone else",
  threat_or_abuse: "Threat or abuse",
  asks_for_info: "Asking for information",
  other: "Unclear reply",
};

const MOVE_TEXT = {
  accept: { label: "Accept, but get it in writing", colour: "border-green text-green" },
  counter: { label: "Reply once more, firmly", colour: "border-stamp text-stamp" },
  escalate: { label: "Escalate: file the formal complaint", colour: "border-red text-red" },
};

function TurnCard({ turn, number }: { turn: NegotiationTurn; number: number }) {
  const [language, setLanguage] = useState<"bn" | "en">("bn");
  const analysis: ReplyAnalysis = turn.analysis;
  const move = MOVE_TEXT[analysis.nextMove];
  const reply = language === "bn" ? analysis.replyBn : analysis.replyEn;

  return (
    <article className="rounded border-2 border-ink bg-white p-4 md:p-5">
      <p className="text-sm text-ink-soft">
        Seller reply {number}, {formatDate(turn.at.slice(0, 10))}
      </p>
      <blockquote className="mt-2 border-l-4 border-paper-line pl-3 text-ink-soft">{turn.sellerSaid}</blockquote>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="stamp text-base">{TACTIC_LABELS[analysis.tactic]}</span>
        <span className={"rounded border-2 px-2 py-1 text-sm font-semibold " + move.colour}>{move.label}</span>
      </div>
      <p className="mt-3">{analysis.tacticExplainEn}</p>
      <p className="text-ink-soft">{analysis.tacticExplainBn}</p>
      {analysis.nextMoveReason && <p className="mt-2 text-sm">{analysis.nextMoveReason}</p>}

      {analysis.tactic === "threat_or_abuse" && (
        <p className="mt-3 rounded border-l-4 border-red bg-paper p-3 text-sm">
          Do not reply. Keep screenshots of every message. If you feel unsafe, go to your nearest police station, or call
          999 in an emergency.
        </p>
      )}

      {reply !== "" && (
        <div className="mt-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`btn py-1 text-sm ${language === "bn" ? "btn-primary" : "btn-quiet"}`}
              onClick={() => setLanguage("bn")}
            >
              বাংলা
            </button>
            <button
              type="button"
              className={`btn py-1 text-sm ${language === "en" ? "btn-primary" : "btn-quiet"}`}
              onClick={() => setLanguage("en")}
            >
              English
            </button>
          </div>
          <p className="ledger mt-3 whitespace-pre-wrap rounded border border-paper-line p-3 leading-8">{reply}</p>
          <div className="mt-3">
            <CopyButton text={reply} label="Copy reply" />
          </div>
        </div>
      )}
    </article>
  );
}

interface Props {
  item: Case;
  onUpdate: (changes: Partial<Case>) => void;
}

export default function Negotiator({ item, onUpdate }: Props) {
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  async function addImage(files: FileList | null) {
    if (files === null || files.length === 0) {
      return;
    }
    try {
      setImage(await compressImage(files[0]));
    } catch {
      setError("Could not read that image. Try a PNG or JPG screenshot.");
    }
  }

  async function analyseReply(event: React.FormEvent) {
    event.preventDefault();
    if (text.trim().length < 2 && image === "") {
      setError("Paste the seller's reply or add a screenshot of it.");
      return;
    }
    setError("");
    setWorking(true);

    const history = [];
    for (const turn of item.negotiation) {
      history.push({ sellerSaid: turn.sellerSaid, tactic: turn.analysis.tactic, reply: turn.analysis.replyEn });
    }

    try {
      const response = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis: item.analysis, history: history, sellerReply: text, image: image }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Could not read the reply. Try again.");
        setWorking(false);
        return;
      }
      const turn: NegotiationTurn = {
        at: new Date().toISOString(),
        sellerSaid: text.trim() !== "" ? text.trim() : "[screenshot of the seller's reply]",
        analysis: data.analysis as ReplyAnalysis,
      };
      onUpdate({ negotiation: [...item.negotiation, turn] });
      setText("");
      setImage("");
    } catch {
      setError("Could not reach the server. Check your internet connection.");
    }
    setWorking(false);
  }

  const latest = item.negotiation.length > 0 ? item.negotiation[item.negotiation.length - 1] : null;

  return (
    <div className="mt-6 border-t border-paper-line pt-5">
      <h3 className="text-xl font-semibold">Did the seller reply?</h3>
      <p className="text-sm text-ink-soft">
        Paste their message or add a screenshot. Ovijog tells you what they are doing and what to send next.
      </p>

      {item.negotiation.length > 0 && (
        <div className="mt-4 space-y-4">
          {item.negotiation.map((turn, index) => (
            <TurnCard key={turn.at} turn={turn} number={index + 1} />
          ))}
        </div>
      )}

      {latest !== null && latest.analysis.nextMove === "escalate" && (
        <a href="#stage-2" className="btn btn-primary mt-4">
          Go to the formal complaint
        </a>
      )}

      <form onSubmit={analyseReply} className="mt-4 space-y-3">
        <label htmlFor="seller-reply" className="sr-only">
          The seller&apos;s reply
        </label>
        <textarea
          id="seller-reply"
          className="field min-h-24"
          placeholder="Example: Bhai ektu wait koren, courier e problem hoise, next week dekhbo."
          value={text}
          maxLength={2000}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex flex-wrap items-center gap-3">
          <label className="btn btn-quiet cursor-pointer py-1.5 text-sm">
            {image ? "Screenshot added" : "Add a screenshot"}
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                addImage(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          {image && (
            <button type="button" className="text-sm text-red underline" onClick={() => setImage("")}>
              Remove screenshot
            </button>
          )}
          <button type="submit" className="btn btn-primary py-1.5" disabled={working}>
            {working ? "Reading the reply…" : "Analyse the reply"}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-red">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
