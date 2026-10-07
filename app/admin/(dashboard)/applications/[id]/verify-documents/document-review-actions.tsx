"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DocumentReviewActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function decide(status: "VERIFIED" | "REJECTED") {
    const label = status === "VERIFIED" ? "सत्यापित" : "अस्वीकृत";
    if (!window.confirm(`क्या आप दस्तावेज़ों को ${label} करना चाहते हैं?`)) {
      return;
    }

    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/applications/${applicationId}/verify-documents`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status,
            ...(status === "REJECTED" ? { reason } : {}),
          }),
        },
      );
      if (!response.ok) {
        throw new Error("दस्तावेज़ों की स्थिति अपडेट नहीं हो सकी।");
      }
      router.refresh();
    } catch {
      setError("दस्तावेज़ों की स्थिति अपडेट नहीं हो सकी। कृपया फिर प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">दस्तावेज़ निर्णय</h2>
      <label className="mt-4 block">
        <span className="mb-2 block text-sm font-semibold text-stone-800">
          अस्वीकृति का कारण
        </span>
        <textarea
          className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-800 focus:outline-none focus:ring-4 focus:ring-emerald-800/10"
          disabled={busy}
          maxLength={500}
          onChange={(event) => setReason(event.target.value)}
          rows={3}
          value={reason}
        />
      </label>
      {error ? (
        <p className="mt-3 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
          disabled={busy}
          onClick={() => void decide("VERIFIED")}
          type="button"
        >
          {busy ? "सहेजा जा रहा है…" : "दस्तावेज़ सत्यापित करें"}
        </button>
        <button
          className="rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-bold text-red-800 disabled:opacity-60"
          disabled={busy || !reason.trim()}
          onClick={() => void decide("REJECTED")}
          type="button"
        >
          {busy ? "सहेजा जा रहा है…" : "दस्तावेज़ अस्वीकार करें"}
        </button>
      </div>
    </section>
  );
}
