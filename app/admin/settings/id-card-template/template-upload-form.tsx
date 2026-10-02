"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function TemplateUploadForm({
  hasActiveTemplate,
}: {
  hasActiveTemplate: boolean;
}) {
  const router = useRouter();
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
      const response = await fetch("/api/admin/id-card-template", {
        method: "POST",
        body: new FormData(form),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        throw new Error("टेम्पलेट अपलोड नहीं हो सका। फ़ाइल जाँचकर फिर प्रयास करें।");
      }
      if (
        typeof body !== "object" ||
        body === null ||
        !("success" in body) ||
        body.success !== true
      ) {
        throw new Error("टेम्पलेट अपलोड नहीं हो सका। फ़ाइल जाँचकर फिर प्रयास करें।");
      }
      form.reset();
      setMessage("नया ID कार्ड टेम्पलेट सक्रिय कर दिया गया है।");
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "टेम्पलेट अपलोड नहीं हो सका।",
      );
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-stone-950">ID कार्ड टेम्पलेट</h2>
      <p className="mt-2 text-sm leading-6 text-stone-600">
        PNG या JPEG इमेज, अधिकतम 5 MB। नया टेम्पलेट पुराने सक्रिय टेम्पलेट को
        बदल देगा।
      </p>
      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            टेम्पलेट इमेज
          </span>
          <input
            accept="image/png,image/jpeg"
            className="block w-full rounded-xl border border-stone-200 bg-white p-3 text-sm text-stone-700 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:font-semibold file:text-emerald-900"
            name="template"
            required
            type="file"
          />
        </label>
        {message ? (
          <p
            className={`text-sm ${isError ? "text-red-700" : "text-emerald-800"}`}
            role={isError ? "alert" : "status"}
          >
            {message}
          </p>
        ) : null}
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-950 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isUploading}
          type="submit"
        >
          {isUploading
            ? "टेम्पलेट अपलोड हो रहा है…"
            : hasActiveTemplate
              ? "टेम्पलेट बदलें"
              : "टेम्पलेट अपलोड करें"}
        </button>
      </form>
    </div>
  );
}
