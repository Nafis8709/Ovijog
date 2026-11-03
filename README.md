# Ovijog (অভিযোগ)

**An AI agent that helps Bangladeshi shoppers get their money back from sellers who cheated them.**

You tell Ovijog what happened and add screenshots. It reads the evidence, finds the section of the
Consumers' Right Protection Act, 2009 that the seller broke, and gives you two things:

1. **Stage 1, a demand message for the seller.** A firm, polite message in Bangla and English that cites the law and asks for a refund within 3 days. Many sellers settle at this point.
2. **Stage 2, a formal complaint.** If the seller ignores you, Ovijog drafts the written complaint to the Director General of the Directorate of National Consumer Rights Protection (DNCRP), with a numbered evidence list, ready to print, save as PDF or email.

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

- **Story in any language:** Bangla, English or Banglish, typed or spoken (voice input uses the browser's speech recognition, Chrome or Edge).
- **Screenshot reading:** the AI reads order pages, bKash or Nagad SMS, chats and product photos.
- **Evidence-linked timeline:** every event says which screenshot or statement it came from.
- **Grounded law matching:** the AI can only choose from a fixed list of sections; the legal text shown always comes from the app's own data.
- **30-day countdown:** calculated in code, shown as an office-style stamp.
- **Two-stage escalation:** demand message first, formal complaint second.
- **Bangla complaint letter:** A4 print layout, numbered evidence, screenshots attached as pages.
- **Case dashboard:** money at stake and money recovered across all your cases.
- **Sample case:** works with no API key, for judges and live demos.
- **Private by default:** cases are saved only in the user's browser (localStorage). No accounts, no database.

---

## How the AI agent works

```
User story + screenshots
        │
        ▼
POST /api/analyze ──► Gemini (vision + JSON schema)
        │                 extracts facts, timeline, picks sections,
        │                 writes the Stage 1 demand message
        ▼
Guardrails (src/lib/validate.ts)
  • drops any section number not in src/lib/law.ts
  • max 3 sections, dates must be YYYY-MM-DD
  • no sections → confidence forced to "low"
  • not a consumer case → no demand message
        │
        ▼
Case page: law text from law.ts, deadline from deadline.ts (never from the AI)
        │
        ▼  (if the seller ignores the demand)
POST /api/complaint ──► Gemini writes subject, body, relief, evidence list in Bangla
        │                 (header, address and signature are added by the app)
        ▼
Letter page ──► print / save as PDF / email
```

### Reliability choices (worth mentioning in the pitch)

1. **The model never writes law.** It returns section numbers only; anything outside the allowed list is dropped by the server.
2. **The model never calculates deadlines.** Dates are computed in plain code in Bangladesh time.
3. **Facts must be traceable.** Each timeline event names its evidence; unknown facts stay blank and become "make your case stronger" questions.
4. **Data from the browser is re-validated.** `/api/complaint` cleans the analysis again before using it.
5. **Honesty reminder.** Users must confirm their story is true; Section 54 punishes false complaints.

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
    api/analyze/route.ts     AI step 1: facts, sections, demand message
    api/complaint/route.ts   AI step 2: formal complaint in Bangla
  views/
    CaseView.tsx             Case file UI (Stage 1 and Stage 2)
    LetterView.tsx           Printable letter
  components/                Navbar, sticker, stamp, voice input, etc.
  lib/
    law.ts                   CRPA 2009 sections (the grounding data)
    prompts.ts               All AI prompts and JSON schemas
    validate.ts              Guardrails on AI output
    gemini.ts                Gemini client wrapper (server only)
    deadline.ts              30-day calculation and formatting
    caseStore.ts             localStorage save/load
    imageUtils.ts            Screenshot compression in the browser
    demoCase.ts              Built-in sample case
    types.ts                 Shared types
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
npm run lint    # ESLint
npm run build   # production build
npm run start   # run the production build
```

---

## Deploy (Vercel, free)

1. Push this repo to GitHub.
2. Go to https://vercel.com/new and import the repo.
3. Add the environment variable `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`).
4. Deploy. Use the URL as your **Live Web App** link on Devpost.

---

## Buildathon checklist

- [ ] Put the official sticker image at `public/buildathon-sticker.png` (it replaces the text badge in the navbar automatically).
- [ ] Deploy and test the live link on a phone.
- [ ] Run 5–10 real cases from friends and note the total amount at stake for the deck.
- [ ] Check every entry in `src/lib/law.ts` against the official text at bdlaws.minlaw.gov.bd.
- [ ] Make the 5-slide deck (outline in `docs/PITCH.md`).
- [ ] Optional: record an English demo video and upload it to YouTube.

---

## Legal sources

- Consumers' Right Protection Act, 2009 (Act No. 26 of 2009), official text: bdlaws.minlaw.gov.bd
- English text of Chapter IV used in `law.ts`: lawyersnjurists.com (that page numbers sections 32–51; the official numbers are 37–56, cross-checked for s.44 and s.45 with The Daily Star and BSS)
- Section 60 (30 days) and Section 76(4) (25% of fine): The Daily Star; ITV BD; DNCRP district portals
- DNCRP contact: hotline 16121, info@dncrp.gov.bd

## Disclaimer

Ovijog is not a law firm and does not give legal advice. It helps people organise facts and draft messages. Users should read every line before sending or filing anything.

## License

MIT
