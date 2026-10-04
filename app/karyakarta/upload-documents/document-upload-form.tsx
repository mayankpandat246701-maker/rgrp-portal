"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function DocumentUploadForm() {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setIsUploading(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/karyakarta/upload", {
        method: "POST",
        body: new FormData(form),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        if (
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
        ) {
          setIsError(true);
          setMessage(body.error);
          return;
        }
        throw new Error("upload_failed");
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("success" in body) ||
        body.success !== true
      ) {
        throw new Error("upload_failed");
      }
      form.reset();
      setMessage("आपके दस्तावेज़ समीक्षा के लिए भेज दिए गए हैं।");
    } catch {
      setIsError(true);
      setMessage(
        "दस्तावेज़ अपलोड नहीं हो सके। कृपया जानकारी और फ़ाइलें जाँचकर फिर प्रयास करें।",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <form
      className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
    >
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-stone-800">
          Application Reference / आवेदन संदर्भ संख्या
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
          Registered Mobile Number / आवेदन में पंजीकृत मोबाइल नंबर
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
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-stone-800">
          फोटो (JPG/PNG, अधिकतम 2 MB)
        </span>
        <input
          accept="image/jpeg,image/png"
          className="block w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700"
          name="photo"
          type="file"
        />
      </label>
      <label className="block">
        <span className="mb-2 block text-sm font-semibold text-stone-800">
          Aadhaar Document / आधार दस्तावेज़ (JPG/PNG/PDF, अधिकतम 2 MB)
        </span>
        <input
          accept="image/jpeg,image/png,application/pdf"
          className="block w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700"
          name="aadhaar"
          type="file"
        />
      </label>
      {isUploading ? (
        <div
          aria-label="दस्तावेज़ अपलोड प्रगति"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuetext="दस्तावेज़ अपलोड हो रहे हैं"
          className="h-2 overflow-hidden rounded-full bg-emerald-100"
          role="progressbar"
        >
          <div className="h-full w-1/2 animate-pulse rounded-full bg-emerald-800" />
        </div>
      ) : null}
      <p className="text-xs leading-5 text-stone-500">
        केवल अपने आवेदन के दस्तावेज़ चुनें। आवेदन संदर्भ या स्थिति की जानकारी के
        लिए{" "}
        <Link
          className="font-semibold text-emerald-800 underline underline-offset-2"
          href="/application-status"
        >
          आवेदन स्थिति देखें
        </Link>{" "}
        पृष्ठ पर जाएँ।
      </p>
      {message ? (
        <p
          className={`text-sm ${isError ? "text-red-700" : "text-emerald-800"}`}
          role={isError ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
      <button
        className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        disabled={isUploading}
        type="submit"
      >
        {isUploading ? "दस्तावेज़ अपलोड हो रहे हैं…" : "दस्तावेज़ अपलोड करें"}
      </button>
    </form>
  );
}
