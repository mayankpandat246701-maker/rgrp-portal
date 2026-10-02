"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function GenerateQrButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function generate() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/karyakarta/${encodeURIComponent(applicationId)}/generate-qr`,
        { method: "POST" },
      );
      if (!response.ok) throw new Error("QR कोड तैयार नहीं हो सका।");
      router.refresh();
    } catch {
      setError("QR कोड तैयार नहीं हो सका। कृपया फिर प्रयास करें।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="no-print">
      <button
        className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-60"
        disabled={busy}
        onClick={() => void generate()}
        type="button"
      >
        {busy ? "तैयार हो रहा है…" : "सत्यापन QR तैयार करें"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
