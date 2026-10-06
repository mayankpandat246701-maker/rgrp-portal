"use client";

import { useEffect, useState } from "react";

type Member = {
  name: string;
  registrationNumber: string;
  daitva: string | null;
  state: string | null;
  district: string | null;
  issueDate: string | null;
  expiryDate: string | null;
};

type VerifyResponse = {
  result?: "verified" | "expired" | "not_valid" | "not_found";
  message?: string;
  member?: Member;
};

export function VerifyIdForm({ initialRegistrationNumber }: { initialRegistrationNumber: string }) {
  const [registrationNumber, setRegistrationNumber] = useState(initialRegistrationNumber);
  const [captcha, setCaptcha] = useState<{ question: string; token: string } | null>(null);
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [result, setResult] = useState<VerifyResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadCaptcha = () => {
    setCaptchaAnswer("");
    fetch("/api/captcha", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setCaptcha(data))
      .catch(() => setError("कैप्चा लोड नहीं हो सका। पेज रीफ्रेश करें।"));
  };

  useEffect(loadCaptcha, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);

    try {
      const response = await fetch("/api/verify-id", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber, captchaToken: captcha?.token, captchaAnswer }),
      });
      const data: VerifyResponse = await response.json().catch(() => ({}));

      if (!response.ok) {
        setError(data.message ?? "सत्यापन विफल रहा। कृपया पुनः प्रयास करें।");
        loadCaptcha();
        return;
      }
      setResult(data);
    } catch {
      setError("नेटवर्क त्रुटि। कृपया पुनः प्रयास करें।");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-6">
        <div>
          <label htmlFor="registrationNumber" className="block text-sm font-medium text-stone-800">
            पंजीकरण संख्या
          </label>
          <input
            id="registrationNumber"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            placeholder="RGRP-XXXX-XXXX"
          />
        </div>

        <div>
          <label htmlFor="captchaAnswer" className="block text-sm font-medium text-stone-800">
            कैप्चा: {captcha?.question ?? "लोड हो रहा है…"}
          </label>
          <input
            id="captchaAnswer"
            value={captchaAnswer}
            onChange={(e) => setCaptchaAnswer(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2"
            placeholder="उत्तर दर्ज करें"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !captcha}
          className="w-full rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"
        >
          {loading ? "सत्यापित हो रहा है…" : "सत्यापित करें"}
        </button>
      </form>

      {result && (
        <div className="rounded-2xl border border-stone-200 bg-white p-6">
          {result.result === "verified" && result.member ? (
            <div className="space-y-2">
              <p className="text-lg font-bold text-emerald-800">✓ सत्यापित कार्यकर्ता</p>
              <p className="font-semibold text-stone-950">{result.member.name}</p>
              <p className="font-mono text-xs text-stone-600">{result.member.registrationNumber}</p>
              {result.member.daitva && <p className="text-sm text-stone-700">दायित्व: {result.member.daitva}</p>}
              {(result.member.state || result.member.district) && (
                <p className="text-sm text-stone-700">
                  क्षेत्र: {[result.member.district, result.member.state].filter(Boolean).join(", ")}
                </p>
              )}
              {result.member.expiryDate && (
                <p className="text-sm text-stone-700">
                  वैध तिथि: {new Date(result.member.expiryDate).toLocaleDateString("hi-IN")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-stone-700">{result.message ?? "रिकॉर्ड उपलब्ध नहीं है।"}</p>
          )}
        </div>
      )}
    </div>
  );
}
