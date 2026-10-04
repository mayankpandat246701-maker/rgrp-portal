"use client";

import { useState } from "react";

type VerificationResult =
  | {
      result: "verified";
      member: {
        name: string;
        registrationNumber: string;
        daitva: string | null;
        state: string | null;
        district: string | null;
        issueDate: string | null;
        expiryDate: string | null;
      };
    }
  | { result: "expired" | "not_valid" | "not_found"; message: string };

function displayDate(value: string | null): string | null {
  return value
    ? new Intl.DateTimeFormat("hi-IN", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(value))
    : null;
}

export function VerifyIdForm({ initialRegistrationNumber }: { initialRegistrationNumber: string }) {
  const [registrationNumber, setRegistrationNumber] = useState(initialRegistrationNumber);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch("/api/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(typeof data.error === "string" ? data.error : "सत्यापन अभी उपलब्ध नहीं है।");
      } else {
        setResult(data as VerificationResult);
      }
    } catch {
      setError("सत्यापन अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8" onSubmit={submit}>
        <label className="block text-sm font-semibold text-stone-800" htmlFor="registration-number">
          पहचान पत्र पर अंकित पंजीकरण संख्या
        </label>
        <input
          autoCapitalize="characters"
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-4 font-mono text-sm uppercase"
          id="registration-number"
          maxLength={60}
          minLength={12}
          onChange={(event) => setRegistrationNumber(event.target.value.toUpperCase())}
          pattern="RGRP-[A-Z0-9-]+"
          required
          value={registrationNumber}
        />
        <button className="mt-4 min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "सत्यापन हो रहा है..." : "पहचान पत्र सत्यापित करें"}
        </button>
      </form>

      {error ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">{error}</p> : null}
      {result?.result === "verified" ? (
        <section aria-live="polite" className="mt-5 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">✓ सत्यापित कार्यकर्ता</span>
          <h2 className="mt-4 text-2xl font-bold text-stone-950">{result.member.name}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["पंजीकरण संख्या", result.member.registrationNumber],
              ["दायित्व", result.member.daitva],
              ["राज्य", result.member.state],
              ["जिला", result.member.district],
              ["जारी करने की तिथि", displayDate(result.member.issueDate)],
              ["समाप्ति तिथि", displayDate(result.member.expiryDate)],
            ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, value]) => (
              <div key={label}><dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</dt><dd className="mt-1 text-sm font-medium text-stone-900">{value}</dd></div>
            ))}
          </dl>
          <p className="mt-6 border-t border-stone-100 pt-4 text-sm font-semibold text-emerald-900">राष्ट्रीय गौ रक्षा परिषद द्वारा सत्यापित</p>
        </section>
      ) : result ? (
        <section aria-live="polite" className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 text-stone-700 shadow-sm">
          <h2 className="font-semibold text-stone-950">{result.result === "expired" ? "पंजीकरण की वैधता समाप्त" : "रिकॉर्ड वर्तमान में सक्रिय नहीं है"}</h2>
          <p className="mt-2 text-sm leading-6">{result.message}</p>
        </section>
      ) : null}
    </div>
  );
}
