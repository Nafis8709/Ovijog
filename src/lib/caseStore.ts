// Saves cases in the browser's localStorage.
// No account or database is needed for the MVP, and the user's evidence never
// leaves their device except when it is sent to the AI for analysis.
// Every access is wrapped in try/catch because storage can be blocked or full.

import type { Case } from "./types";

const STORAGE_KEY = "ovijog.cases.v1";

// Cases saved by an older version may lack newer fields; fill them in.
function normalize(item: Case): Case {
  return {
    ...item,
    images: Array.isArray(item.images) ? item.images : [],
    evidence: Array.isArray(item.evidence) ? item.evidence : [],
    trace: Array.isArray(item.trace) ? item.trace : [],
    negotiation: Array.isArray(item.negotiation) ? item.negotiation : [],
    complaint: item.complaint || null,
    complainant: item.complainant || null,
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
        cases.push(normalize(item as Case));
      }
      return cases;
    }
    return [];
  } catch {
    return [];
  }
}

// Returns true if saved. If storage is full we retry without screenshots.
function saveAll(cases: Case[]): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cases));
    return true;
  } catch {
    try {
      const withoutImages: Case[] = [];
      for (const item of cases) {
        withoutImages.push({ ...item, images: [] });
      }
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withoutImages));
      return true;
    } catch {
      return false;
    }
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

export function newCaseId(): string {
  const random = Math.random().toString(36).slice(2, 8);
  return `case-${Date.now().toString(36)}-${random}`;
}
