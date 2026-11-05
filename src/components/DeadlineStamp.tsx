// The violet "rubber stamp" showing how many days are left to file.
// Bangla digits are used because the stamp imitates an office seal.

import type { DeadlineInfo } from "@/lib/deadline";
import { formatDate } from "@/lib/deadline";

const BANGLA_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBanglaNumber(value: number): string {
  const text = String(value);
  let result = "";
  for (const char of text) {
    const digit = Number(char);
    if (char >= "0" && char <= "9") {
      result += BANGLA_DIGITS[digit];
    } else {
      result += char;
    }
  }
  return result;
}

export default function DeadlineStamp({ deadline, animate }: { deadline: DeadlineInfo; animate: boolean }) {
  const animation = animate ? " stamp-animate" : "";

  if (!deadline.known) {
    return (
      <span className={"stamp text-xl" + animation}>
        তারিখ দিন
        <span className="block text-xs font-semibold">add the purchase date</span>
      </span>
    );
  }

  if (deadline.expired) {
    return (
      <span className={"stamp red text-xl" + animation}>
        সময় শেষ
        <span className="block text-xs font-semibold">30 days passed on {formatDate(deadline.lastDate)}</span>
      </span>
    );
  }

  if (deadline.daysLeft === 0) {
    return (
      <span className={"stamp red text-2xl" + animation}>
        আজই শেষ দিন
        <span className="block text-xs font-semibold">today is the last day to file</span>
      </span>
    );
  }

  const urgent = deadline.daysLeft <= 5;
  return (
    <span className={"stamp text-3xl" + (urgent ? " red" : "") + animation}>
      {toBanglaNumber(deadline.daysLeft)} দিন বাকি
      <span className="block text-xs font-semibold">file by {formatDate(deadline.lastDate)}</span>
    </span>
  );
}
