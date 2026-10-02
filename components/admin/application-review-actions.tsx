"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { KaryakartaApplicationStatus } from "@prisma/client";

type ApplicationReviewActionsProps = {
  applicationId: string;
  applicationReference: string;
  status: KaryakartaApplicationStatus;
};

function getErrorMessage(value: unknown): string | null {
  if (
    typeof value !== "object" ||
    value === null ||
    !("error" in value) ||
    typeof value.error !== "object" ||
    value.error === null ||
    !("message" in value.error) ||
    typeof value.error.message !== "string"
  ) {
    return null;
  }
  return value.error.message;
}

export function ApplicationReviewActions({
  applicationId,
  applicationReference,
  status,
}: ApplicationReviewActionsProps) {
  const router = useRouter();
  const [blockReason, setBlockReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (status !== "PENDING") return null;

  async function transition(nextStatus: "APPROVED" | "BLOCKED") {
    const action = nextStatus === "APPROVED" ? "स्वीकृत" : "अस्वीकृत";
    if (
      !window.confirm(
        `क्या आप आवेदन ${applicationReference} को ${action} करना चाहते हैं?`,
      )
    ) {
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/admin/applications/${applicationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          ...(nextStatus === "BLOCKED" ? { blockReason } : {}),
        }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          getErrorMessage(result) ?? "आवेदन की स्थिति अपडेट नहीं हो सकी।",
        );
      }
      if (
        typeof result !== "object" ||
        result === null ||
        !("success" in result) ||
        result.success !== true
      ) {
        throw new Error("आवेदन की स्थिति अपडेट नहीं हो सकी।");
      }

      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "आवेदन की स्थिति अपडेट नहीं हो सकी।",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">समीक्षा कार्रवाई</h2>
      <p className="mt-1 text-sm text-stone-600">
        स्थिति बदलने के बाद इसे लंबित में वापस नहीं किया जा सकता।
      </p>
      <label className="mt-5 block">
        <span className="mb-2 block text-sm font-semibold text-stone-800">
          अस्वीकृति का कारण
        </span>
        <textarea
          className="w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-900 shadow-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-800 focus:ring-4 focus:ring-emerald-800/10"
          disabled={isSubmitting}
          maxLength={500}
          onChange={(event) => setBlockReason(event.target.value)}
          placeholder="अस्वीकृत करने पर कारण आवश्यक है"
          rows={3}
          value={blockReason}
        />
      </label>
      {error ? (
        <p className="mt-4 text-sm font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          onClick={() => void transition("APPROVED")}
          type="button"
        >
          {isSubmitting ? "निर्णय सहेजा जा रहा है…" : "स्वीकृत करें"}
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-800 transition hover:bg-red-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting || !blockReason.trim()}
          onClick={() => void transition("BLOCKED")}
          type="button"
        >
          {isSubmitting ? "निर्णय सहेजा जा रहा है…" : "अस्वीकृत करें"}
        </button>
      </div>
    </section>
  );
}
