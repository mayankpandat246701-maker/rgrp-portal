"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { ClientFormNotice } from "@/components/ui/client-form-notice";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";
import { normalizeIndianMobile } from "@/lib/karyakarta-mobile";

export function KaryakartaLoginForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const registrationNumber = String(
      formData.get("registrationNumber") ?? "",
    ).trim();
    const mobile = String(formData.get("mobile") ?? "").trim();
    const nextErrors: Record<string, string> = {};

    if (!registrationNumber) {
      nextErrors.registrationNumber = "कृपया पंजीकरण संख्या दर्ज करें।";
    }
    if (!mobile) {
      nextErrors.mobile = "कृपया मोबाइल नंबर दर्ज करें।";
    } else if (!normalizeIndianMobile(mobile)) {
      nextErrors.mobile = "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/karyakarta/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ regNo: registrationNumber, mobile }),
      });
      const result: unknown = await response.json();
      const succeeded =
        typeof result === "object" &&
        result !== null &&
        "success" in result &&
        result.success === true;

      if (response.ok && succeeded) {
        router.replace("/karyakarta/dashboard");
        router.refresh();
        return;
      }

      setNotice(
        response.status === 429
          ? "कई प्रयास किए गए हैं। कृपया कुछ देर बाद फिर कोशिश करें।"
          : response.status === 401
            ? "पंजीकरण संख्या या मोबाइल नंबर गलत है।"
            : "लॉगिन अभी उपलब्ध नहीं है। कृपया फिर से प्रयास करें।",
      );
    } catch {
      setNotice("लॉगिन अभी उपलब्ध नहीं है। कृपया फिर से प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="कार्यकर्ता पोर्टल">
      <div className="mb-7">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-emerald-900/10 bg-emerald-50 text-emerald-900 lg:hidden">
          <Icon name="user" size={24} />
        </span>
        <p className="mt-5 text-xs font-bold tracking-[0.14em] text-orange-700 uppercase">
          सदस्य प्रवेश
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
          कार्यकर्ता पोर्टल प्रवेश
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          अपनी पंजीकरण संख्या और पंजीकृत मोबाइल नंबर दर्ज करें।
        </p>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <FormField
          error={errors.registrationNumber}
          hint="उदाहरण: RGRP-2026-001"
          id="registrationNumber"
          label="पंजीकरण संख्या"
          required
        >
          <input
            aria-describedby={`registrationNumber-hint${errors.registrationNumber ? " registrationNumber-error" : ""}`}
            aria-invalid={Boolean(errors.registrationNumber)}
            autoCapitalize="characters"
            autoComplete="off"
            className={`${inputClassName} font-mono tracking-wide`}
            id="registrationNumber"
            name="registrationNumber"
            onChange={() => {
              setErrors((current) => ({
                ...current,
                registrationNumber: "",
              }));
            }}
            placeholder="RGRP-2026-001"
            required
          />
        </FormField>
        <FormField
          error={errors.mobile}
          hint="पंजीकृत 10 अंकों का मोबाइल नंबर दर्ज करें।"
          id="mobile"
          label="पंजीकृत मोबाइल नंबर"
          required
        >
          <input
            aria-describedby={`mobile-hint${errors.mobile ? " mobile-error" : ""}`}
            aria-invalid={Boolean(errors.mobile)}
            autoComplete="tel-national"
            className={inputClassName}
            id="mobile"
            inputMode="numeric"
            maxLength={15}
            name="mobile"
            onChange={() => {
              setErrors((current) => ({ ...current, mobile: "" }));
            }}
            placeholder="उदाहरण: 9876543210"
            required
            type="tel"
          />
        </FormField>

        <ClientFormNotice message={notice} tone="warning" />
        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <Icon name="lock" size={18} />
          {isSubmitting ? "प्रवेश हो रहा है…" : "सुरक्षित लॉगिन"}
        </button>
      </form>

      <div className="mt-7 space-y-4 border-t border-stone-100 pt-5">
        <p className="text-center text-sm text-stone-600">
          नए सदस्य हैं?{" "}
          <Link
            className="font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
            href="/join"
          >
            पंजीकरण करें
          </Link>
        </p>
        <p className="text-center text-sm">
          <Link
            className="font-semibold text-stone-600 underline decoration-stone-300 underline-offset-4 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
            href="/verify"
          >
            पहचान सत्यापित करें
          </Link>
        </p>
      </div>
    </AuthCard>
  );
}
