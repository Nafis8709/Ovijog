# Ovijog (অভিযোগ)

**An AI agent that helps Bangladeshi shoppers get their money back from sellers who cheated them.**

You tell Ovijog what happened and add screenshots. You watch its agent read each screenshot, build the
facts, check the Consumers' Right Protection Act, 2009, count your 30 days and score your evidence. Then it
takes you through three stages:

1. **Stage 1, a demand to the seller.** A firm, polite message in Bangla and English that cites the law and asks for a refund within 3 days.
2. **Stage 1.5, negotiation.** Paste the seller's reply. Ovijog names their tactic (stalling, blaming the courier, a partial offer, a threat), tells you whether to accept, push back or escalate, and drafts your answer.
3. **Stage 2, a formal complaint.** If the seller won't fix it, Ovijog drafts the written complaint to the Director General of the Directorate of National Consumer Rights Protection (DNCRP), quoting how the seller responded, ready to print, save as PDF or email. It also shows the other channels that fit your case, such as bKash and Bangladesh Bank.

Built for **Ostad Presents YUNet AIgnite Buildathon 2026**.

---

## Why this matters

| Fact | Source |
|---|---|
| About **61%** of all complaints to DNCRP last fiscal year were about online shopping fraud. | ITV BD, October 2026 |
| A complaint must be filed within **30 days** of the cause of action. | Section 60, CRPA 2009 |
| If the seller is fined, **25%** of the realised fine is paid to the complainant. | Section 76(4), CRPA 2009 |

Most people never complain because they don't know the law, don't know how to write a complaint, or miss the 30-day deadline. Ovijog fixes all three.

---

## Features

- **Visible agent:** the steps stream live to the screen in plain language and stay on the case as "How Ovijog built this case". Each step records whether the AI or plain code did it (`TraceStep.by`).
- **Story in any language:** Bangla, English or Banglish, typed or spoken (voice input uses the browser's speech recognition, Chrome or Edge).
- **Screenshot reading:** the AI classifies each screenshot (payment proof, order or ad, chat, product photo) and copies out amounts, TrxIDs, dates and promises.
- **Clear next step:** every case opens with one "what to do now" card that changes as the case moves on.
- **Add proof later:** photos can be added to a case at any time; Ovijog reads them and the evidence score updates.
- **Phone-first layout:** tested at 320, 360, 768 and 1280 px wide with no sideways scrolling and 44 px tap targets.
- **Evidence strength meter:** a 0–100 score computed in code from four proofs (you paid, what was promised, what went wrong, you tried to fix it), with tips for what to add.
- **Evidence-linked timeline:** every event says which screenshot or statement it came from.
- **Grounded law matching:** the AI can only choose from a fixed list of sections; the legal text shown always comes from the app's own data.
- **Seller-reply negotiator:** names the seller's tactic and recommends accept, counter or escalate, with safety rules enforced in code.
- **Smart escalation routes:** DNCRP, bKash, Nagad or Rocket, card disputes, and Bangladesh Bank's Customer Interest Protection Centre, picked by rules from how you paid. Every number was checked by hand.
- **30-day countdown:** calculated in code, shown as an office-style stamp, and downloadable as a calendar reminder (.ics).
- **Bangla complaint letter:** A4 print layout, numbered evidence, screenshots attached as pages.
- **Case dashboard:** money at stake and money recovered across all your cases.
- **Sample case and offline mode:** the sample case needs no API key; `OVIJOG_MOCK=1` runs the whole app without the AI.
- **Evaluation suite:** `npm run eval` scores the agent on 11 labelled cases in English, Bangla and Banglish.
- **Private by default:** cases are saved only in the user's browser (localStorage). No accounts, no database.

---

## How the AI agent works

```
User story + screenshots
        │
        ▼
POST /api/analyze  (streams each step to the browser as NDJSON)
  1. AI    Read the screenshots        → kind + facts per screenshot
  2. AI    Understand the case          → facts, timeline, sections, demand message
                                          (uses step 1's findings as its evidence)
  3. Code  Check the law                → drop any section not in law.ts, report rejections
  4. Code  Calculate the deadline       → 30 days from the incident (Bangladesh time)
  5. Code  Score the evidence           → 0–100 from four proofs
        │
        ▼
Case page ── Stage 1: demand message
        │
        ▼  seller replies
POST /api/reply ──► AI names the tactic, drafts the next message
                    Code forces: threat/abuse → stop replying + escalate;
                                 denial → escalate; 3rd round of excuses → escalate
        │
        ▼  seller won't fix it
POST /api/complaint ──► AI writes subject, body, relief, evidence list in Bangla,
        │               including how the seller responded
        ▼
Letter page ──► print / save as PDF / email      Escalation routes ──► rules in escalation.ts
```

### Reliability choices (worth mentioning in the pitch)

1. **The model never writes law.** It returns section numbers only; anything outside the allowed list is dropped by the server, and the trace says how many were rejected.
2. **The model never calculates deadlines or scores.** The deadline and the evidence score are plain code.
3. **Extract, then reason.** Step 1 reads the screenshots; step 2 reasons only over those findings and the story, so every fact has a source.
4. **Safety rules beat the model.** In negotiation, threats always mean "stop replying and escalate", whatever the AI suggests.
5. **Phone numbers are never generated.** Escalation channels come from a hand-checked list in `escalation.ts`.
6. **Data from the browser is re-validated** on every API call.
7. **Measured, not assumed.** `npm run eval` reports consumer-case detection and correct-section accuracy.
8. **Honesty reminder.** Users must confirm their story is true; Section 54 punishes false complaints.

---

## Tech stack

- [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS 4
- Google Gemini API via `@google/genai` (vision + structured JSON output)
- Self-hosted fonts: Anek Bangla (UI) and Noto Serif Bengali (letter)
- No database: `localStorage`

---

## Project structure

```
src/
  app/
    page.tsx                 Landing page
    new/page.tsx             Start a case (story, voice, screenshots)
    cases/page.tsx           Dashboard of saved cases
    case/[id]/page.tsx       Case file (wraps views/CaseView)
    case/[id]/letter/page.tsx  Complaint letter (wraps views/LetterView)
    api/analyze/route.ts     The agent, streamed step by step
    api/reply/route.ts       Negotiator: reads the seller's reply
    api/evidence/route.ts    Reads photos added to an existing case
    api/complaint/route.ts   Formal complaint in Bangla
  views/
    CaseView.tsx             Case file UI (Stage 1 and Stage 2)
    LetterView.tsx           Printable letter
  components/                AgentTrace, EvidenceMeter, Negotiator, EscalationRoutes, stamp, voice input, etc.
  lib/
    agent.ts                 The 5-step agent pipeline (used by the API and the eval)
    evidence.ts              Evidence strength score (code)
    escalation.ts            Escalation channels (hand-checked rules)
    calendar.ts              Deadline calendar file (.ics)
    mockAi.ts                Offline rules used when OVIJOG_MOCK=1
    law.ts                   CRPA 2009 sections (the grounding data)
    prompts.ts               All AI prompts and JSON schemas
    validate.ts              Guardrails on AI output
    gemini.ts                Gemini client wrapper (server only)
    deadline.ts              30-day calculation and formatting
    caseStore.ts             localStorage save/load
    imageUtils.ts            Screenshot compression in the browser
    demoCase.ts              Built-in sample case
    types.ts                 Shared types
scripts/
  eval.ts, eval-cases.json   Evaluation suite (npm run eval)
docs/
  PITCH.md                   5-slide deck outline and demo script
```

---

## Run it locally

Requirements: Node.js 20 or newer.

```bash
git clone https://github.com/<your-username>/ovijog.git
cd ovijog
npm install
cp .env.example .env.local     # then paste your Gemini API key into .env.local
npm run dev
```

Open http://localhost:3000. Click **Open a sample case** to see the full flow without an API key.

Get a free Gemini API key at https://aistudio.google.com/apikey. If the default model is not available on your key, set `GEMINI_MODEL=gemini-flash-latest` in `.env.local`.

Other commands:

```bash
npm run dev:offline   # run without the AI (keyword rules), for demos with no internet
npm run eval          # score the real agent on 11 labelled cases (needs GEMINI_API_KEY)
npm run lint          # ESLint
npm run build         # production build
npm run start         # run the production build
```

### Evaluation

`npm run eval` runs the full agent on the cases in `scripts/eval-cases.json` (English, Bangla and Banglish; including two cases that are not consumer cases) and prints, for each case, whether it detected a consumer case correctly and picked an expected section of the Act. Run it after any prompt change and put the score in your deck. Running it with `OVIJOG_MOCK=1` only checks that the script works; the offline rules were written for these cases, so that score means nothing.

---

## Deploy (Vercel, free)

1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Add the environment variable `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`).
4. Deploy. Use the URL as your **Live Web App** link on Devpost.

---

## Buildathon checklist

- [x] Official sticker image at `public/buildathon-sticker.webp`, shown in the strip above the navbar (a text badge appears if it fails to load).
- [x] Deployed on Vercel; full flow tested at 320, 390, 768 and 1280 px.
- [ ] Run `npm run eval` with your key and note the score for the deck.
- [ ] Run 5–10 real cases from friends and note the total amount at stake for the deck.
- [x] Check every section number in `src/lib/law.ts` against the official numbering (done 5 Nov 2026).
- [ ] Make the 5-slide deck (outline in `docs/PITCH.md`).
- [ ] Optional: record an English demo video and upload it to YouTube.

---

## Legal sources

- Consumers' Right Protection Act, 2009 (Act No. 26 of 2009), official text: bdlaws.minlaw.gov.bd
- English text of Chapter IV used in `law.ts`: lawyersnjurists.com (that page numbers sections 32–51; the official numbers are 37–56, cross-checked for s.44 and s.45 with The Daily Star and BSS)
- Section 60 (30 days) and Section 76(4) (25% of fine): The Daily Star; ITV BD; DNCRP district portals
- DNCRP contact: hotline 16121, info@dncrp.gov.bd
- Digital Commerce Operation Guidelines 2021 (delivery in 5/10 days; refund within 72 hours after a 48-hour notice): The Daily Star
- bKash helpline 16247 / 02-55663001: bkash.com
- Bangladesh Bank Customer Interest Protection Centre, hotline 16236, bb.cipc@bb.org.bd: bb.org.bd

## Disclaimer

Ovijog is not a law firm and does not give legal advice. It helps people organise facts and draft messages. Users should read every line before sending or filing anything.

## License

MIT
