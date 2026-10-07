"use client";

import { useState, type FormEvent } from "react";
import { normalizeIndianMobile } from "@/lib/karyakarta-mobile";

type SearchResult = {
  id: string;
  name: string;
  regNo: string;
  daitva: string | null;
  state: string | null;
  district: string | null;
  registrationNumber: string;
  issueDate: string | null;
  expiryDate: string | null;
  hasFrontImage: boolean;
  hasBackImage: boolean;
  eligible: boolean;
  eligibilityMessage: string;
};

function displayDate(value: string | null): string {
  if (!value) return "उपलब्ध नहीं";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "उपलब्ध नहीं";
  return new Intl.DateTimeFormat("hi-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function errorMessage(payload: unknown): string {
  if (payload && typeof payload === "object" && "error" in payload) {
    const nested = (payload as { error?: unknown }).error;
    if (nested && typeof nested === "object" && "message" in nested) {
      const message = (nested as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) return message;
    }
  }
  return "खोज अभी उपलब्ध नहीं है। कृपया फिर से प्रयास करें।";
}

export function IdCardSearchForm() {
  const [regNo, setRegNo] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [result, setResult] = useState<SearchResult | null>(null);
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [uploadMessage, setUploadMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    const trimmedRegNo = regNo.trim();
    const trimmedMobile = mobile.trim();
    if (!trimmedRegNo) {
      setError("कृपया पंजीकरण संख्या दर्ज करें।");
      return;
    }
    if (!normalizeIndianMobile(trimmedMobile)) {
      setError("कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।");
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch("/api/admin/id-cards/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo: trimmedRegNo, mobile: trimmedMobile }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (
        !response.ok ||
        !payload ||
        typeof payload !== "object" ||
        !("data" in payload) ||
        !payload.data ||
        typeof payload.data !== "object"
      ) {
        setError(errorMessage(payload));
        setResult(null);
        return;
      }
      setResult(payload.data as SearchResult);
      setNotice("कार्यकर्ता मिल गया। पात्रता नीचे देखें।");
    } catch {
      setError("खोज अभी उपलब्ध नहीं है। कृपया फिर से प्रयास करें।");
      setResult(null);
    } finally {
      setIsSearching(false);
    }
  }


  async function handleUpload() {
    if (!result) return;
    setError("");
    setUploadMessage("");
    if (!frontFile) {
      setError("कृपया आगे की छवि (front) चुनें।");
      return;
    }
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.set("front", frontFile);
      if (backFile) formData.set("back", backFile);
      const response = await fetch(
        `/api/admin/id-cards/${encodeURIComponent(result.id)}/upload`,
        { method: "POST", body: formData },
      );
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        setError(errorMessage(payload));
        return;
      }
      setUploadMessage("पहचान पत्र अपलोड हो गया।");
      setResult({
        ...result,
        hasFrontImage: true,
        hasBackImage: Boolean(backFile) || result.hasBackImage,
      });
      setFrontFile(null);
      setBackFile(null);
    } catch {
      setError("अपलोड अभी उपलब्ध नहीं है। कृपया फिर से प्रयास करें।");
    } finally {
      setIsUploading(false);
    }
  }

  const frontPreview = result
    ? `/api/admin/id-cards/${encodeURIComponent(result.id)}/image/front`
    : "";
  const backPreview = result
    ? `/api/admin/id-cards/${encodeURIComponent(result.id)}/image/back`
    : "";

  return (
    <div className="space-y-6">
      <form
        className="rounded-2xl border border-stone-200 bg-white p-5"
        onSubmit={handleSubmit}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-800">
              पंजीकरण संख्या
            </span>
            <input
              autoCapitalize="characters"
              autoComplete="off"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 font-mono text-sm"
              onChange={(event) => setRegNo(event.currentTarget.value)}
              placeholder="RGRP-2026-001"
              value={regNo}
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-stone-800">
              पंजीकृत मोबाइल नंबर
            </span>
            <input
              autoComplete="tel-national"
              className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm"
              inputMode="numeric"
              onChange={(event) => setMobile(event.currentTarget.value)}
              placeholder="9876543210"
              type="tel"
              value={mobile}
            />
          </label>
        </div>
        {error ? (
          <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
            {error}
          </p>
        ) : null}
        {notice && !error ? (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
            {notice}
          </p>
        ) : null}
        <button
          className="mt-4 min-h-11 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSearching}
          type="submit"
        >
          {isSearching ? "खोज हो रही है…" : "कार्यकर्ता खोजें"}
        </button>
      </form>

      {result ? (
        <article className="rounded-2xl border border-stone-200 bg-white p-5">
          <h2 className="text-xl font-bold text-stone-950">{result.name}</h2>
          <p className="mt-1 font-mono text-xs text-stone-600">
            {result.registrationNumber}
          </p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold text-stone-500">दायित्व</dt>
              <dd className="mt-1 font-medium text-stone-900">
                {result.daitva?.trim() || "कार्यकर्ता"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-stone-500">क्षेत्र</dt>
              <dd className="mt-1 font-medium text-stone-900">
                {[result.district, result.state].filter(Boolean).join(", ") ||
                  "उपलब्ध नहीं"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-stone-500">जारी तिथि</dt>
              <dd className="mt-1 font-medium text-stone-900">
                {displayDate(result.issueDate)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-stone-500">
                वैधता समाप्ति
              </dt>
              <dd className="mt-1 font-medium text-stone-900">
                {displayDate(result.expiryDate)}
              </dd>
            </div>
          </dl>
          <p
            className={`mt-4 rounded-xl px-4 py-3 text-sm font-semibold ${
              result.eligible
                ? "bg-emerald-50 text-emerald-900"
                : "bg-amber-50 text-amber-900"
            }`}
          >
            {result.eligibilityMessage}
          </p>
          {result.eligible ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-stone-800">
                    आगे की छवि (front, आवश्यक)
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="w-full text-sm"
                    onChange={(event) =>
                      setFrontFile(event.currentTarget.files?.[0] ?? null)
                    }
                    type="file"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-stone-800">
                    पीछे की छवि (back, वैकल्पिक)
                  </span>
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="w-full text-sm"
                    onChange={(event) =>
                      setBackFile(event.currentTarget.files?.[0] ?? null)
                    }
                    type="file"
                  />
                </label>
              </div>
              {uploadMessage ? (
                <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">
                  {uploadMessage}
                </p>
              ) : null}
              <button
                className="min-h-11 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isUploading}
                onClick={handleUpload}
                type="button"
              >
                {isUploading ? "अपलोड हो रहा है…" : "पहचान पत्र सहेजें"}
              </button>
              <div className="flex flex-wrap gap-4">
                {result.hasFrontImage ? (
                  <a
                    className="font-semibold text-emerald-900 underline"
                    href={frontPreview}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Front पूर्वावलोकन
                  </a>
                ) : null}
                {result.hasBackImage ? (
                  <a
                    className="font-semibold text-emerald-900 underline"
                    href={backPreview}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Back पूर्वावलोकन
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}
        </article>
      ) : null}
    </div>
  );
}
