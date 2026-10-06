"use client";

import { useEffect, useState } from "react";

type Status = {
  available: boolean;
  hasBack: boolean;
  message?: string;
};

export function KaryakartaIdCardPanel() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/karyakarta/id-card?side=status", { cache: "no-store" })
      .then(async (response) => {
        const payload: unknown = await response.json().catch(() => null);
        if (!active) return;
        if (
          payload &&
          typeof payload === "object" &&
          "data" in payload &&
          payload.data &&
          typeof payload.data === "object" &&
          "available" in payload.data
        ) {
          const data = payload.data as Status;
          setStatus({ available: data.available === true, hasBack: data.hasBack === true, message: typeof data.message === "string" ? data.message : undefined });
        } else {
          setError("पहचान पत्र की स्थिति अभी उपलब्ध नहीं है।");
        }
      })
      .catch(() => {
        if (active) setError("पहचान पत्र की स्थिति अभी उपलब्ध नहीं है।");
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-bold text-stone-950">पहचान पत्र</h2>
      {error ? (
        <p className="mt-3 text-sm text-stone-600">{error}</p>
      ) : !status ? (
        <p className="mt-3 text-sm text-stone-600">स्थिति जाँची जा रही है…</p>
      ) : status.available ? (
        <div className="mt-3 flex flex-wrap gap-3">
          <a
            className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
            href="/api/karyakarta/id-card?side=front"
            rel="noreferrer"
            target="_blank"
          >
            iCard देखें (Front)
          </a>
          {status.hasBack ? (
            <a
              className="rounded-xl border border-emerald-800 px-5 py-3 text-sm font-bold text-emerald-900"
              href="/api/karyakarta/id-card?side=back"
              rel="noreferrer"
              target="_blank"
            >
              iCard देखें (Back)
            </a>
          ) : null}
          <a
            className="rounded-xl border border-stone-300 px-5 py-3 text-sm font-bold text-stone-800"
            href="/api/karyakarta/id-card?side=front"
            download
          >
            iCard डाउनलोड करें
          </a>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-stone-600">
          {status.message ??
            "आपका कार्यकर्ता प्रोफ़ाइल अभी प्रशासन द्वारा सत्यापित नहीं हुआ है। सत्यापन के बाद ही पहचान पत्र उपलब्ध होगा।"}
        </p>
      )}
    </section>
  );
}
