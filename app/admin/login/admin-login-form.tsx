"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/ui/auth-card";
import { ClientFormNotice } from "@/components/ui/client-form-notice";
import { FormField, inputClassName } from "@/components/ui/form-field";
import { Icon } from "@/components/ui/icon";

export function AdminLoginForm() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const nextErrors: Record<string, string> = {};

    if (!email) {
      nextErrors.email = "कृपया Admin ईमेल दर्ज करें।";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = "कृपया सही ईमेल पता दर्ज करें।";
    }
    if (!password) nextErrors.password = "कृपया पासवर्ड दर्ज करें।";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result: unknown = await response.json();
      const succeeded =
        typeof result === "object" &&
        result !== null &&
        "success" in result &&
        result.success === true;

      if (response.ok && succeeded) {
        router.replace("/admin/dashboard");
        router.refresh();
        return;
      }

      setNotice(
        response.status === 429
          ? "कई प्रयास किए गए हैं। कृपया कुछ देर बाद फिर कोशिश करें। Too many attempts; try again later."
          : "ईमेल या पासवर्ड अमान्य है। Invalid email or password.",
      );
    } catch {
      setNotice("लॉगिन अभी उपलब्ध नहीं है। कृपया फिर से प्रयास करें।");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthCard eyebrow="प्रशासनिक पोर्टल">
      <div className="mb-7">
        <span className="flex size-12 items-center justify-center rounded-2xl border border-emerald-900/10 bg-emerald-50 text-emerald-900 lg:hidden">
          <Icon name="shield" size={24} />
        </span>
        <p className="mt-5 text-xs font-bold tracking-[0.14em] text-orange-700 uppercase">
          अधिकृत टीम
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
          प्रशासनिक प्रवेश
        </h2>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          संगठन के सुरक्षित प्रशासनिक पोर्टल में प्रवेश करें।
        </p>
      </div>

      <form className="space-y-5" noValidate onSubmit={handleSubmit}>
        <FormField
          error={errors.email}
          id="email"
          label="Admin ईमेल"
          required
        >
          <input
            aria-describedby={errors.email ? "email-error" : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="username"
            className={inputClassName}
            id="email"
            name="email"
            placeholder="admin@example.org"
            required
            type="email"
          />
        </FormField>

        <FormField
          error={errors.password}
          id="password"
          label="पासवर्ड"
          required
        >
          <div className="relative">
            <input
              aria-describedby={errors.password ? "password-error" : undefined}
              aria-invalid={Boolean(errors.password)}
              autoComplete="current-password"
              className={`${inputClassName} pr-12`}
              id="password"
              name="password"
              placeholder="अपना पासवर्ड दर्ज करें"
              required
              type={passwordVisible ? "text" : "password"}
            />
            <button
              aria-label={passwordVisible ? "पासवर्ड छिपाएँ" : "पासवर्ड दिखाएँ"}
              aria-pressed={passwordVisible}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-stone-500 hover:text-emerald-900 focus-visible:outline-2 focus-visible:outline-emerald-800"
              onClick={() => setPasswordVisible((visible) => !visible)}
              type="button"
            >
              <Icon name={passwordVisible ? "eye-off" : "eye"} />
            </button>
          </div>
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
        <p className="text-center text-xs leading-5 text-stone-500">
          अधिकृत प्रशासनिक उपयोग के लिए בלבד
        </p>
      </form>

      <div className="mt-7 border-t border-stone-100 pt-5 text-center">
        <Link
          className="text-sm font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
          href="/"
        >
          मुख्य पृष्ठ पर वापस जाएँ
        </Link>
      </div>
    </AuthCard>
  );
}
