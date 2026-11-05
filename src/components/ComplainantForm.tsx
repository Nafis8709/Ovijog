"use client";

// The complainant's details for the formal letter. The directorate asks for the
// full name, father's and mother's names, address, phone, email (if any) and occupation.
// These details are added to the letter by the app; they are never sent to the AI.

import type { Complainant } from "@/lib/types";

export const EMPTY_COMPLAINANT: Complainant = {
  name: "",
  fatherName: "",
  motherName: "",
  occupation: "",
  phone: "",
  email: "",
  address: "",
};

// Bangladeshi mobile number: 01XXXXXXXXX, optionally with +88 / 88 in front.
export function normalisePhone(phone: string): string {
  return phone.replace(/[\s-]/g, "");
}

export function isValidPhone(phone: string): boolean {
  return /^(?:\+?88)?01[3-9]\d{8}$/.test(normalisePhone(phone));
}

export function isValidEmail(email: string): boolean {
  return email.trim() === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

// Returns a message saying what to fix, or "" when the details are complete.
export function complainantProblem(person: Complainant): string {
  if (person.name.trim().length < 3) {
    return "Enter your full name.";
  }
  if (!isValidPhone(person.phone)) {
    return "Enter your 11-digit mobile number, starting with 01.";
  }
  if (!isValidEmail(person.email)) {
    return "Check your email address, or leave it empty.";
  }
  if (person.address.trim().length < 5) {
    return "Enter your address.";
  }
  return "";
}

interface Props {
  value: Complainant;
  onChange: (value: Complainant) => void;
  idPrefix: string;
}

export default function ComplainantForm({ value, onChange, idPrefix }: Props) {
  function field(key: keyof Complainant, text: string) {
    onChange({ ...value, [key]: text });
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <label className="block">
        <span className="text-sm font-semibold">Full name</span>
        <input
          id={`${idPrefix}-name`}
          className="field mt-1"
          autoComplete="name"
          maxLength={100}
          value={value.name}
          onChange={(e) => field("name", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Mobile number</span>
        <input
          id={`${idPrefix}-phone`}
          className="field mt-1"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="01XXXXXXXXX"
          maxLength={20}
          value={value.phone}
          onChange={(e) => field("phone", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Father&apos;s name</span>
        <input
          id={`${idPrefix}-father`}
          className="field mt-1"
          maxLength={100}
          value={value.fatherName}
          onChange={(e) => field("fatherName", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Mother&apos;s name</span>
        <input
          id={`${idPrefix}-mother`}
          className="field mt-1"
          maxLength={100}
          value={value.motherName}
          onChange={(e) => field("motherName", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Occupation</span>
        <input
          id={`${idPrefix}-occupation`}
          className="field mt-1"
          autoComplete="organization-title"
          placeholder="e.g. Student"
          maxLength={80}
          value={value.occupation}
          onChange={(e) => field("occupation", e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Email (optional)</span>
        <input
          id={`${idPrefix}-email`}
          className="field mt-1"
          type="email"
          autoComplete="email"
          maxLength={120}
          value={value.email}
          onChange={(e) => field("email", e.target.value)}
        />
      </label>
      <label className="block md:col-span-2">
        <span className="text-sm font-semibold">Address</span>
        <textarea
          id={`${idPrefix}-address`}
          className="field mt-1 min-h-20"
          autoComplete="street-address"
          maxLength={300}
          value={value.address}
          onChange={(e) => field("address", e.target.value)}
        />
      </label>
      <p className="text-sm text-ink-soft md:col-span-2">
        The directorate asks for your father&apos;s and mother&apos;s names and your occupation. Fill them in if you can.
        These details go only on your letter; they are not sent to the AI.
      </p>
    </div>
  );
}
