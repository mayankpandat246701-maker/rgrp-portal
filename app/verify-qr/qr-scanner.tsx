"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";

const verificationResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    applicationReference: z.string(),
    name: z.string(),
    status: z.literal("APPROVED"),
    verificationTimestamp: z.coerce.date(),
  }),
});

type VerificationResult = z.infer<
  typeof verificationResponseSchema
>["data"];

export function QrScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerificationResult | null>(null);

  useEffect(
    () => () => {
      controlsRef.current?.stop();
    },
    [],
  );

  async function verifyToken(token: string) {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/verify-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const payload: unknown = await response.json();
      const parsedResponse = verificationResponseSchema.safeParse(payload);
      if (!response.ok || !parsedResponse.success) {
        throw new Error("अमान्य QR");
      }
      setResult(parsedResponse.data.data);
    } catch {
      setError("QR सत्यापित नहीं हो सका। कृपया सही परिषद QR स्कैन करें।");
    } finally {
      setBusy(false);
    }
  }

  async function startCamera() {
    if (!videoRef.current) return;
    setError("");
    try {
      readerRef.current ??= new BrowserQRCodeReader();
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (decoded) => {
          if (decoded) {
            controlsRef.current?.stop();
            void verifyToken(decoded.getText());
          }
        },
      );
    } catch {
      setError("कैमरा शुरू नहीं हो सका। कृपया QR इमेज अपलोड करें।");
    }
  }

  async function decodeFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) {
      setError("कृपया 5 MB से छोटी QR इमेज चुनें।");
      return;
    }
    setError("");
    try {
      const url = URL.createObjectURL(file);
      try {
        const reader = new BrowserQRCodeReader();
        const decoded = await reader.decodeFromImageUrl(url);
        await verifyToken(decoded.getText());
      } finally {
        URL.revokeObjectURL(url);
      }
    } catch {
      setError("इमेज से QR पढ़ा नहीं जा सका।");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          className="rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
          onClick={() => void startCamera()}
          type="button"
        >
          कैमरे से स्कैन करें
        </button>
        <label className="cursor-pointer rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-bold text-stone-800">
          QR इमेज चुनें
          <input
            accept="image/*"
            className="sr-only"
            onChange={(event) => void decodeFile(event.target.files?.[0])}
            type="file"
          />
        </label>
      </div>
      <video
        className="mt-5 aspect-video w-full max-w-xl rounded-xl bg-stone-950"
        ref={videoRef}
      />
      {busy ? <p className="mt-4 text-sm">QR सत्यापित हो रहा है…</p> : null}
      {error ? (
        <p className="mt-4 text-sm text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      {result ? (
        <section className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <h2 className="text-lg font-bold text-emerald-950">
            सत्यापित कार्यकर्ता
          </h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-stone-600">आवेदन संदर्भ</dt>
              <dd className="mt-1 font-semibold">{result.applicationReference}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-600">नाम</dt>
              <dd className="mt-1 font-semibold">{result.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-600">स्थिति</dt>
              <dd className="mt-1 font-semibold">स्वीकृत</dd>
            </div>
            <div>
              <dt className="text-xs text-stone-600">दस्तावेज़ सत्यापन</dt>
              <dd className="mt-1 font-semibold">
                {new Intl.DateTimeFormat("hi-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(result.verificationTimestamp)}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}
    </div>
  );
}
