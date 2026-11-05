// Saves cases in the browser's localStorage.
// No account or database is needed for the MVP, and the user's evidence never
// leaves their device except when it is sent to the AI for analysis.
// Every access is wrapped in try/catch because storage can be blocked or full.

import type { Case } from "./types";

const STORAGE_KEY = "ovijog.cases.v1";

// Cases saved by an older version may lack newer fields; fill them in.
function normalize(item: Case): Case {
  const analysis = item.analysis;
  return {
    ...item,
    story: typeof item.story === "string" ? item.story : "",
    purchaseDate: typeof item.purchaseDate === "string" ? item.purchaseDate : "",
    analysis: {
      ...analysis,
      timeline: Array.isArray(analysis.timeline) ? analysis.timeline : [],
      matchedSections: Array.isArray(analysis.matchedSections) ? analysis.matchedSections : [],
      missingInfo: Array.isArray(analysis.missingInfo) ? analysis.missingInfo : [],
      demandMessageBn: analysis.demandMessageBn || "",
      demandMessageEn: analysis.demandMessageEn || "",
    },
    images: Array.isArray(item.images) ? item.images : [],
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
    trace: Array.isArray(item.trace) ? item.trace : [],
    negotiation: Array.isArray(item.negotiation) ? item.negotiation : [],
    complaint: item.complaint || null,
    complainant: item.complainant
      ? {
          name: item.complainant.name || "",
          fatherName: item.complainant.fatherName || "",
          motherName: item.complainant.motherName || "",
          occupation: item.complainant.occupation || "",
          phone: item.complainant.phone || "",
          email: item.complainant.email || "",
          address: item.complainant.address || "",
        }
      : null,
    demandSentAt: item.demandSentAt || "",
  };
}

export function loadCases(): Case[] {
  try {
    const text = window.localStorage.getItem(STORAGE_KEY);
    if (!text) {
      return [];
    }
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) {
      const cases: Case[] = [];
      for (const item of parsed) {
        // Skip anything damaged instead of crashing the page.
        if (item && typeof item.id === "string" && item.analysis && typeof item.analysis === "object") {
          cases.push(normalize(item as Case));
        }
      }
      return cases;
    }
    return [];
  } catch {
    return [];
  }
}

// Returns true if saved, false if the browser refused (storage full or blocked).
// Nothing is dropped silently: the caller tells the user what to do.
function saveAll(cases: Case[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  } catch {
    return false;
  }
}

export function getCase(id: string): Case | null {
  const cases = loadCases();
  for (const item of cases) {
    if (item.id === id) {
      return item;
    }
  }
  return null;
}

// Inserts a new case or replaces the one with the same id.
export function saveCase(updated: Case): boolean {
  const cases = loadCases();
  let replaced = false;
  for (let i = 0; i < cases.length; i++) {
    if (cases[i].id === updated.id) {
      cases[i] = updated;
      replaced = true;
      break;
    }
  }
  if (!replaced) {
    cases.unshift(updated); // newest first
  }
  return saveAll(cases);
}

export function deleteCase(id: string): void {
  const cases = loadCases();
  const remaining: Case[] = [];
  for (const item of cases) {
    if (item.id !== id) {
      remaining.push(item);
    }
  }
  saveAll(remaining);
}

// The built-in example case uses ids starting with this, so it can be replaced
// instead of piling up, and left out of the dashboard totals.
export const EXAMPLE_PREFIX = "example-";

export function isExampleCase(item: Case): boolean {
  return item.id.startsWith(EXAMPLE_PREFIX);
}

// Saves a fresh example case, removing any older copy first.
export function saveExampleCase(example: Case): boolean {
  const others: Case[] = [];
  for (const item of loadCases()) {
    if (!isExampleCase(item)) {
      others.push(item);
    }
  }
  others.unshift(example);
  return saveAll(others);
}

export const STORAGE_FULL_MESSAGE =
  "Your browser's storage for this site is full, so this could not be saved. Delete an old case in My cases and try again.";

export function newCaseId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `case-${Date.now().toString(36)}-${random}`;
}
