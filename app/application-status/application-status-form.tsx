"use client";

import { useState, type FormEvent } from "react";

type SafeStatusResult = {
  applicationReference: string;
  fullName: string;
  status: "PENDING" | "APPROVED" | "BLOCKED";
  createdAt: string;
};

type StatusApiResponse = {
  success: true;
  data: SafeStatusResult;
};

function isStatusApiResponse(value: unknown): value is StatusApiResponse {
  if (typeof value !== "object" || value === null) return false;
  if (
    !("success" in value) ||
    value.success !== true ||
    !("data" in value) ||
    typeof value.data !== "object" ||
    value.data === null
  ) {
    return false;
  }
  const data = value.data;
  return (
    "applicationReference" in data &&
    typeof data.applicationReference === "string" &&
    "fullName" in data &&
    typeof data.fullName === "string" &&
    "createdAt" in data &&
    typeof data.createdAt === "string" &&
    "status" in data &&
    (data.status === "PENDING" ||
      data.status === "APPROVED" ||
      data.status === "BLOCKED")
  );
}

const statusLabels: Record<SafeStatusResult["status"], string> = {
  PENDING: "लंबित",
  APPROVED: "स्वीकृत",
  BLOCKED: "अस्वीकृत",
};

export function ApplicationStatusForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SafeStatusResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setResult(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/application-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applicationReference: formData.get("applicationReference"),
          mobile: formData.get("mobile"),
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok || !isStatusApiResponse(body)) {
        throw new Error(
          response.status === 404
            ? "आवेदन विवरण सत्यापित नहीं हो सके। कृपया जानकारी जाँचें।"
            : response.status === 429
              ? "बहुत अधिक प्रयास किए गए। कृपया कुछ देर बाद फिर प्रयास करें।"
              : "स्थिति की जानकारी प्राप्त नहीं हो सकी। कृपया फिर प्रयास करें।",
        );
      }
      setResult(body.data);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "स्थिति की जानकारी प्राप्त नहीं हो सकी। कृपया फिर प्रयास करें।",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <form
        className="no-print space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
        onSubmit={handleSubmit}
      >
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            आवेदन संदर्भ संख्या
          </span>
          <input
            autoComplete="off"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10"
            maxLength={20}
            name="applicationReference"
            placeholder="RGRP-YYYYMMDD-12345"
            required
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            आवेदन में दिया गया मोबाइल नंबर
          </span>
          <input
            autoComplete="tel"
            className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10"
            inputMode="tel"
            maxLength={16}
            name="mobile"
            required
            type="tel"
          />
        </label>
        {error ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {error}
          </p>
        ) : null}
        <button
          className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? "जाँच हो रही है…" : "आवेदन स्थिति देखें"}
        </button>
      </form>

      {result ? (
        <section className="application-status-print mt-6 rounded-2xl border border-emerald-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="text-center">
            <p className="text-sm font-bold tracking-wide text-emerald-900">
              राष्ट्रीय गौ रक्षा परिषद
            </p>
            <h2 className="mt-2 text-2xl font-bold text-stone-950">
              आवेदन प्राप्ति पावती
            </h2>
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-stone-500">
                आवेदन संदर्भ संख्या
              </dt>
              <dd className="mt-1 font-mono text-sm font-bold text-stone-950">
                {result.applicationReference}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-stone-500">आवेदक</dt>
              <dd className="mt-1 text-sm font-semibold text-stone-950">
                {result.fullName}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-stone-500">
                आवेदन की स्थिति
              </dt>
              <dd className="mt-1 text-sm font-bold text-stone-950">
                {statusLabels[result.status]}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-stone-500">
                आवेदन प्राप्ति तिथि
              </dt>
              <dd className="mt-1 text-sm text-stone-950">
                {new Intl.DateTimeFormat("hi-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(new Date(result.createdAt))}
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-xs leading-5 text-stone-500">
            यह आवेदन स्थिति पावती है। इसमें आपकी अन्य व्यक्तिगत जानकारी शामिल
            नहीं है।
          </p>
          <button
            className="no-print mt-5 inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-5 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            onClick={() => window.print()}
            type="button"
          >
            स्थिति प्रिंट करें
          </button>
        </section>
      ) : null}
    </div>
  );
}
