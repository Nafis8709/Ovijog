// The 30-day complaint window (Section 60) is calculated in plain code,
// never by the AI. Dates are handled as calendar days (YYYY-MM-DD).

import { PROCEDURE } from "./law";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseIsoDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  return new Date(Date.UTC(year, month - 1, day));
}

// Today's calendar date in Bangladesh (UTC+6), as a UTC-midnight Date.
function todayInDhaka(): Date {
  const now = new Date();
  const dhakaMs = now.getTime() + 6 * 60 * 60 * 1000;
  const dhaka = new Date(dhakaMs);
  return new Date(Date.UTC(dhaka.getUTCFullYear(), dhaka.getUTCMonth(), dhaka.getUTCDate()));
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return toIsoDate(todayInDhaka());
}

// The Bangladesh calendar date (YYYY-MM-DD) of a timestamp such as "2026-11-04T19:30:00.000Z"
// (which is already 5 Nov in Dhaka). Returns "" for anything that is not a valid timestamp.
export function dhakaDateOf(timestamp: string): string {
  if (typeof timestamp !== "string" || timestamp === "") {
    return "";
  }
  const time = new Date(timestamp).getTime();
  if (Number.isNaN(time)) {
    return "";
  }
  return new Date(time + 6 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export interface DeadlineInfo {
  known: boolean; // false when we have no usable date
  startDate: string; // the date the 30 days are counted from
  lastDate: string; // last day to file
  daysLeft: number; // negative when the window has passed
  expired: boolean;
}

// incidentDate (from the AI) is preferred; purchaseDate (from the form) is the fallback.
export function computeDeadline(incidentDate: string, purchaseDate: string): DeadlineInfo {
  let start = parseIsoDate(incidentDate || "");
  if (start === null) {
    start = parseIsoDate(purchaseDate || "");
  }
  if (start === null) {
    return { known: false, startDate: "", lastDate: "", daysLeft: 0, expired: false };
  }

  const last = new Date(start.getTime() + PROCEDURE.deadlineDays * MS_PER_DAY);
  const today = todayInDhaka();
  const daysLeft = Math.round((last.getTime() - today.getTime()) / MS_PER_DAY);

  return {
    known: true,
    startDate: toIsoDate(start),
    lastDate: toIsoDate(last),
    daysLeft: daysLeft,
    expired: daysLeft < 0,
  };
}

// "2026-11-03" -> "3 Nov 2026"
export function formatDate(iso: string): string {
  const date = parseIsoDate(iso);
  if (date === null) {
    return iso || "Unknown";
  }
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatTaka(amount: number | null): string {
  if (amount === null || Number.isNaN(amount)) {
    return "Unknown";
  }
  return "৳" + amount.toLocaleString("en-IN");
}
