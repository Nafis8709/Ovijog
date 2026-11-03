// Ovijog evaluation: runs the real agent on labelled sample cases and reports
// how often it gets the right answer.
//
//   npm run eval                 uses the Gemini API (needs GEMINI_API_KEY in .env.local)
//   OVIJOG_MOCK=1 npm run eval   uses the offline rules (checks the script itself)
//
// What is measured for each case:
//   - consumer: did the agent correctly decide whether this is a consumer-rights case?
//   - section:  for consumer cases, did it pick at least one expected section?
//   - extra:    sections it picked that were not expected (shown, not failed)
// Invented section numbers cannot appear: the validator removes them before this point.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { runCaseAgent } from "../src/lib/agent";

interface EvalCase {
  id: string;
  story: string;
  consumer: boolean;
  expectAny: number[];
}

// Loads .env.local so `npm run eval` works like `npm run dev`.
function loadEnvFile() {
  try {
    const text = readFileSync(join(process.cwd(), ".env.local"), "utf8");
    for (const line of text.split("\n")) {
      const match = /^\s*([A-Z_]+)\s*=\s*(.*)\s*$/.exec(line);
      if (match && !process.env[match[1]] && match[2] !== "") {
        process.env[match[1]] = match[2];
      }
    }
  } catch {
    // no .env.local: rely on the shell environment
  }
}

async function main() {
  loadEnvFile();
  const mock = process.env.OVIJOG_MOCK === "1";
  if (!mock && !process.env.GEMINI_API_KEY) {
    console.error("Set GEMINI_API_KEY in .env.local, or run with OVIJOG_MOCK=1 to test the offline rules.");
    process.exit(1);
  }

  const cases: EvalCase[] = JSON.parse(readFileSync(join(process.cwd(), "scripts", "eval-cases.json"), "utf8"));
  console.log(`Ovijog eval: ${cases.length} cases, ${mock ? "OFFLINE RULES" : "model " + (process.env.GEMINI_MODEL || "default")}\n`);

  let consumerCorrect = 0;
  let sectionCorrect = 0;
  let sectionTotal = 0;
  let failures = 0;

  for (const testCase of cases) {
    const started = Date.now();
    try {
      const result = await runCaseAgent({ story: testCase.story, purchaseDate: "", images: [] }, () => {});
      const picked = result.analysis.matchedSections.map((item) => item.section);
      const consumerOk = result.analysis.isConsumerCase === testCase.consumer;
      if (consumerOk) {
        consumerCorrect += 1;
      }

      let sectionText = "n/a";
      if (testCase.consumer) {
        sectionTotal += 1;
        let hit = false;
        for (const section of picked) {
          if (testCase.expectAny.includes(section)) {
            hit = true;
          }
        }
        if (hit) {
          sectionCorrect += 1;
        }
        const extra = picked.filter((section) => !testCase.expectAny.includes(section));
        sectionText = `${hit ? "PASS" : "FAIL"} picked [${picked.join(", ")}] expected any of [${testCase.expectAny.join(", ")}]` +
          (extra.length > 0 ? ` extra [${extra.join(", ")}]` : "");
      }

      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`${testCase.id.padEnd(28)} consumer ${consumerOk ? "PASS" : "FAIL"}  section ${sectionText}  (${seconds}s)`);
    } catch (error) {
      failures += 1;
      console.log(`${testCase.id.padEnd(28)} ERROR ${(error as Error).message}`);
    }
  }

  console.log("");
  console.log(`Consumer-case detection: ${consumerCorrect}/${cases.length}`);
  console.log(`Correct section of the Act: ${sectionCorrect}/${sectionTotal}`);
  console.log(`Errors: ${failures}`);
}

main();
