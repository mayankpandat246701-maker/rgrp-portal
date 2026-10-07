"use client";

import Image from "next/image";
import { OrganizationLogo } from "@/components/layout/organization-logo";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function LogoSettingsForm() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  function selectFile(selected: File | null) {
    setFile(selected);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return selected ? URL.createObjectURL(selected) : null;
    });
    setError("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("पहले नया लोगो चित्र चुनें।");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const form = new FormData();
      form.set("logo", file);
      const response = await fetch("/api/admin/site-settings", { method: "POST", body: form });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "लोगो सहेजा नहीं जा सका।");
      selectFile(null);
      setNotice("नया लोगो सहेज दिया गया है।");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "लोगो सहेजा नहीं जा सका।");
    } finally {
      setBusy(false);
    }
  }

  async function removeLogo() {
    if (!window.confirm("क्या आप कस्टम लोगो हटाकर मूल चिह्न पुनर्स्थापित करना चाहते हैं?")) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/site-settings", { method: "DELETE" });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "लोगो हटाया नहीं जा सका।");
      setNotice("मूल चिह्न पुनर्स्थापित कर दिया गया है।");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "लोगो हटाया नहीं जा सका।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-7 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <section><h2 className="font-bold">वर्तमान लोगो</h2><div className="mt-3"><OrganizationLogo className="h-28 w-28" /></div></section>
        <section><h2 className="font-bold">नया लोगो पूर्वावलोकन</h2>{preview ? <Image alt="राष्ट्रीय गौ रक्षा परिषद का आधिकारिक लोगो" className="mt-3 h-28 w-28 rounded-xl border object-contain p-2" height={112} src={preview} unoptimized width={112} /> : <p className="mt-3 text-sm text-stone-500">लोगो चुनने पर पूर्वावलोकन दिखेगा।</p>}</section>
      </div>
      <form className="mt-7 space-y-4" onSubmit={save}>
        <label className="block text-sm font-semibold">लोगो अपलोड करें (PNG, JPEG या WebP; अधिकतम 2 MB)<input accept="image/png,image/jpeg,image/webp" className="mt-2 block w-full text-sm" onChange={(event) => selectFile(event.target.files?.[0] ?? null)} type="file" /></label>
        <p className="text-xs leading-5 text-stone-600">अनुशंसित: पारदर्शी PNG या WebP, वर्गाकार अनुपात और कम-से-कम 256 × 256 पिक्सेल। SVG स्वीकार नहीं है।</p>
        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        {notice ? <p className="text-sm text-emerald-800" role="status">{notice}</p> : null}
        <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-xl bg-emerald-900 px-5 font-semibold text-white disabled:opacity-50" disabled={busy} type="submit">लोगो सहेजें</button><button className="min-h-11 rounded-xl border border-stone-300 px-5 font-semibold text-stone-700 disabled:opacity-50" disabled={busy} onClick={() => void removeLogo()} type="button">मूल चिह्न पुनर्स्थापित करें</button></div>
      </form>
    </div>
  );
}
