"use client";

import { useState, type FormEvent } from "react";

type CertificateResult =
  | {
      result: "verified";
      certificate: {
        certificateNumber: string;
        name: string;
        registrationNumber: string;
        daitva: string | null;
        state: string | null;
        district: string | null;
        issueDate: string;
        expiryDate: string | null;
      };
    }
  | { result: "expired" | "not_valid" | "not_found"; message: string };

function dateLabel(value: string | null) {
  return value
    ? new Intl.DateTimeFormat("hi-IN", {
        dateStyle: "medium",
        timeZone: "Asia/Kolkata",
      }).format(new Date(value))
    : null;
}

export function CertificateVerificationForm({
  initialCertificateNumber,
}: {
  initialCertificateNumber: string;
}) {
  const [certificateNumber, setCertificateNumber] = useState(initialCertificateNumber);
  const [result, setResult] = useState<CertificateResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
      const response = await fetch(
        `/api/verify-certificate?number=${encodeURIComponent(certificateNumber)}`,
        { cache: "no-store" },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "सत्यापन अभी उपलब्ध नहीं है। कृपया बाद में फिर प्रयास करें।";
        setError(message);
      } else {
        setResult(body as CertificateResult);
      }
    } catch {
      setError("सत्यापन अभी उपलब्ध नहीं है। कृपया बाद में फिर प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <form className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8" onSubmit={submit}>
        <label className="block text-sm font-semibold text-stone-800" htmlFor="certificate-number">प्रमाणपत्र संख्या</label>
        <input
          autoComplete="off"
          className="mt-2 min-h-12 w-full rounded-xl border border-stone-300 px-4 font-mono text-sm uppercase"
          id="certificate-number"
          maxLength={60}
          minLength={19}
          onChange={(event) => setCertificateNumber(event.target.value.toUpperCase())}
          pattern="RGRP-CERT-[0-9]{4}-[A-F0-9]{8}"
          required
          value={certificateNumber}
        />
        <button className="mt-4 min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:opacity-60" disabled={loading} type="submit">
          {loading ? "सत्यापन हो रहा है..." : "प्रमाणपत्र सत्यापित करें"}
        </button>
      </form>
      {error ? <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" role="alert">{error}</p> : null}
      {result?.result === "verified" ? (
        <section aria-live="polite" className="mt-5 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm">
          <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900">✓ प्रमाणपत्र सत्यापित</span>
          <h2 className="mt-4 text-2xl font-bold text-stone-950">{result.certificate.name}</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            {[
              ["प्रमाणपत्र संख्या", result.certificate.certificateNumber],
              ["पंजीकरण संख्या", result.certificate.registrationNumber],
              ["दायित्व", result.certificate.daitva],
              ["राज्य", result.certificate.state],
              ["जिला", result.certificate.district],
              ["जारी तिथि", dateLabel(result.certificate.issueDate)],
              ["वैधता समाप्ति", dateLabel(result.certificate.expiryDate)],
            ].filter((item): item is [string, string] => Boolean(item[1])).map(([label, value]) => (
              <div key={label}><dt className="text-xs font-semibold text-stone-500">{label}</dt><dd className="mt-1 text-sm font-medium text-stone-900">{value}</dd></div>
            ))}
          </dl>
          <p className="mt-6 border-t border-stone-100 pt-4 text-sm font-semibold text-emerald-900">राष्ट्रीय गौ रक्षा परिषद द्वारा सत्यापित</p>
        </section>
      ) : result ? (
        <section aria-live="polite" className="mt-5 rounded-2xl border border-stone-200 bg-white p-6 text-stone-700 shadow-sm">
          <h2 className="font-semibold text-stone-950">{result.result === "expired" ? "वैधता समाप्त" : "सक्रिय रिकॉर्ड उपलब्ध नहीं है"}</h2>
          <p className="mt-2 text-sm leading-6">{result.message}</p>
        </section>
      ) : null}
    </div>
  );
}
