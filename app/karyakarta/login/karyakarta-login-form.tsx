"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { ClientFormNotice } from "@/components/ui/client-form-notice";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";

export function KaryakartaLoginForm() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [requestShown, setRequestShown] = useState(false);

  function clearMockRequest() {
    setNotice("");
    setRequestShown(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
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
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      nextErrors.mobile = "कृपया 10 अंकों का सही मोबाइल नंबर दर्ज करें।";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setRequestShown(true);
    setNotice("OTP सुविधा सुरक्षित बैकएंड कनेक्शन के बाद सक्रिय होगी।");
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
              clearMockRequest();
            }}
            placeholder="RGRP-2026-001"
            required
          />
        </FormField>
        <FormField
          error={errors.mobile}
          hint="10 अंकों का मोबाइल नंबर दर्ज करें।"
          id="mobile"
          label="मोबाइल नंबर"
          required
        >
          <input
            aria-describedby={`mobile-hint${errors.mobile ? " mobile-error" : ""}`}
            aria-invalid={Boolean(errors.mobile)}
            autoComplete="tel-national"
            className={inputClassName}
            id="mobile"
            inputMode="numeric"
            maxLength={10}
            name="mobile"
            onChange={() => {
              setErrors((current) => ({ ...current, mobile: "" }));
              clearMockRequest();
            }}
            placeholder="उदाहरण: 9876543210"
            required
            type="tel"
          />
        </FormField>

        {requestShown ? (
          <FormField
            hint="यह UI नमूना है; OTP जारी या सत्यापित नहीं किया गया है।"
            id="otp"
            label="OTP"
          >
            <input
              aria-describedby="otp-hint"
              autoComplete="one-time-code"
              className={`${inputClassName} cursor-not-allowed bg-stone-100`}
              disabled
              id="otp"
              inputMode="numeric"
              placeholder="OTP सुविधा अभी उपलब्ध नहीं है"
              type="text"
            />
          </FormField>
        ) : null}

        <ClientFormNotice message={notice} tone="warning" />
        <button
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-900 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-950/10 transition hover:bg-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
          type="submit"
        >
          OTP प्राप्त करें
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
