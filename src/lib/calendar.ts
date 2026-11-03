// Builds a calendar file (.ics) for the 30-day deadline, so the user's phone
// reminds them before the window closes. Works with Google Calendar, iPhone and Outlook.

function compactDate(iso: string): string {
  return iso.replace(/-/g, ""); // 2026-11-25 -> 20261125
}

function nextDay(iso: string): string {
  const date = new Date(iso + "T00:00:00Z");
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

// Escapes text for the iCalendar format.
function escapeText(text: string): string {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export function buildDeadlineIcs(lastDateIso: string, caseTitle: string, caseUrl: string): string {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Ovijog//Deadline//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:ovijog-${compactDate(lastDateIso)}-${Math.random().toString(36).slice(2, 10)}@ovijog`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compactDate(lastDateIso)}`,
    `DTEND;VALUE=DATE:${compactDate(nextDay(lastDateIso))}`,
    `SUMMARY:${escapeText("Last day to file consumer complaint: " + caseTitle)}`,
    `DESCRIPTION:${escapeText("File with the Directorate of National Consumer Rights Protection today (30-day limit, Section 60). Open your case: " + caseUrl)}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeText("3 days left to file your consumer complaint")}`,
    "TRIGGER:-P3D",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function downloadDeadline(lastDateIso: string, caseTitle: string): void {
  const text = buildDeadlineIcs(lastDateIso, caseTitle, window.location.href);
  const blob = new Blob([text], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "ovijog-deadline.ics";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
