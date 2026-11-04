# Ovijog pitch kit

## One line

61% of consumer complaints in Bangladesh are about online fraud, but most victims never complain because they don't know how, or they miss the 30-day deadline. Ovijog is an AI agent that gets your money back.

## 5-slide deck (the buildathon limit)

### Slide 1: Problem statement
- 61% of all complaints to DNCRP last fiscal year were about online shopping fraud (ITV BD, Oct 2026).
- The law already protects buyers: complaints within 30 days (Section 60), and 25% of any fine goes to the complainant (Section 76(4)).
- But people don't know the law, can't write a formal complaint, and miss the deadline.
- Visual: a real-looking angry Messenger chat ending in "You have been blocked."

### Slide 2: Proposed solution
- Ovijog: tell your story, add screenshots, get a refund demand and a ready-to-file complaint.
- Two stages: demand to the seller first, formal complaint only if ignored.
- Visual: the case file screen with the "২২ দিন বাকি" stamp.

### Slide 3: How the solution works
- A visible 5-step agent: 2 AI steps (read screenshots, understand the case) and 3 code checks (law, deadline, evidence score). Judges can watch it work.
- Then a 3-stage escalation: demand → negotiation (tactic detection and the next reply) → formal Bangla complaint and the right channels (DNCRP, bKash, Bangladesh Bank).
- Guardrails: no invented law or phone numbers, deadline and score computed in code, safety rules override the AI, Section 54 honesty check.
- Measured: "Eval: X/11 consumer-case detection, Y/9 correct section" (fill in from `npm run eval`).
- Stack: Next.js, Gemini API (vision + structured JSON), no database, data stays in the user's browser.

### Slide 4: Your introduction
- Your name, university and program.
- Why you built it (a personal or friend's story of being cheated online works best).

### Slide 5: Proof and what's next
- Real users: "X real cases from friends, ৳Y at stake, Z sellers refunded after Stage 1." (fill in after testing)
- Next: direct submission to DNCRP's portal, bank and telecom complaints (Bangladesh Bank, BTRC), shared scam-seller warnings.

## 60-second live demo script

1. "Rafi paid 2,400 taka for a jacket. It came torn, wrong size, and the page blocked him."
2. Start a case: paste the story (or speak it in Bangla), add 2–3 screenshots, tick the honesty box, click **Analyse my case**.
3. While the agent works, narrate the steps: "Reading and understanding are the AI. Checking the law, the deadline and the evidence score are plain code the AI can't change."
4. On the case: the evidence meter, the stamp with days left, and the law text that comes from the Act, not the AI.
5. Stage 1: copy the demand, click **I sent it**.
6. Negotiation: paste "Bhai courier er problem, ektu wait koren". Ovijog says **Stalling** and drafts a firm 48-hour reply. Paste a threat and it says **stop replying, escalate**.
7. Stage 2: fill name and address, **Draft my complaint**, show the Bangla letter, **Print or save as PDF**.

Backup: if the internet or the AI is slow on stage, click **Open a sample case** on the home page, or run the app with `npm run dev:offline`.

## Questions judges may ask

- **"What if the AI cites the wrong law?"** It can only choose from a fixed list; the server drops anything else, and the text shown is from the Act itself. The eval suite measures how often it picks the right section.
- **"Is it really an agent or one prompt?"** Two separate AI steps (extract, then reason) plus code checks, streamed live, then a negotiation loop that remembers earlier replies.
- **"Does anyone actually get money back?"** Stage 1 is designed for that: sellers often refund once they see the law and a deadline. If they don't, the law pays 25% of any fine to the complainant.
- **"What about privacy?"** No accounts, no database. Evidence stays in the user's browser except when it is sent to the AI for analysis.
- **"What about fake complaints?"** Users must confirm their story is true, and the app shows that Section 54 punishes false complaints.
