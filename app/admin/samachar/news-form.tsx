"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { newsCategories } from "@/lib/news-validation";

type NewsPost = {
  id?: string;
  slug: string;
  title: string;
  shortSummary: string;
  fullContent: string;
  category: string;
  tags: string[];
  state: string | null;
  district: string | null;
  isPublished: boolean;
  isFeatured: boolean;
  homepageDisplayOrder: number | null;
  scheduledPublishAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  coverImageAltHindi: string | null;
};

const blankPost: NewsPost = {
  slug: "", title: "", shortSummary: "", fullContent: "", category: "अन्य",
  tags: [], state: null, district: null, isPublished: false, isFeatured: false,
  homepageDisplayOrder: null, scheduledPublishAt: null, expiresAt: null,
  archivedAt: null, coverImageAltHindi: null,
};

function datetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function NewsForm({
  initialPost,
  canPublish,
}: {
  initialPost: NewsPost | null;
  canPublish: boolean;
}) {
  const router = useRouter();
  const [post, setPost] = useState<NewsPost>(initialPost ?? blankPost);
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const patch = (key: keyof NewsPost, value: NewsPost[keyof NewsPost]) => setPost((current) => ({ ...current, [key]: value }));

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const payload = {
        ...post,
        state: post.state || null,
        district: post.district || null,
        tags: post.tags,
        homepageDisplayOrder: post.homepageDisplayOrder ?? null,
        scheduledPublishAt: toIso(String(post.scheduledPublishAt ?? "")),
        expiresAt: toIso(String(post.expiresAt ?? "")),
        archivedAt: toIso(String(post.archivedAt ?? "")),
      };
      const response = await fetch(
        post.id ? `/api/admin/samachar/${encodeURIComponent(post.id)}` : "/api/admin/samachar",
        { method: post.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) },
      );
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== "object" || body === null || !("post" in body) || typeof body.post !== "object" || body.post === null || !("id" in body.post) || typeof body.post.id !== "string") {
        throw new Error(typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "समाचार सहेजा नहीं जा सका।");
      }
      const savedId = body.post.id;
      if (cover) {
        const formData = new FormData();
        formData.set("cover", cover);
        formData.set("altText", post.coverImageAltHindi ?? "");
        const upload = await fetch(`/api/admin/samachar/${encodeURIComponent(savedId)}/cover`, { method: "POST", body: formData });
        const uploadBody: unknown = await upload.json();
        if (!upload.ok) throw new Error(typeof uploadBody === "object" && uploadBody && "error" in uploadBody && typeof uploadBody.error === "string" ? uploadBody.error : "चित्र सहेजा नहीं जा सका।");
      }
      setNotice("समाचार सहेज दिया गया है।");
      router.push(`/admin/samachar/${encodeURIComponent(savedId)}/edit`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "समाचार सहेजा नहीं जा सका।");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!post.id || !window.confirm("क्या आप इस समाचार को संग्रहीत करना चाहते हैं? यह सार्वजनिक पृष्ठ से हट जाएगा।")) return;
    setPost((current) => ({ ...current, archivedAt: new Date().toISOString(), isPublished: false }));
    window.setTimeout(() => {
      const form = document.getElementById("news-form");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }, 0);
  }

  return (
    <form id="news-form" className="mt-7 space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">शीर्षक<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={180} onChange={(e) => patch("title", e.target.value)} required value={post.title} /></label>
        <label className="text-sm font-semibold">URL पहचान (अंग्रेज़ी अक्षर)<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-mono font-normal" maxLength={120} onChange={(e) => patch("slug", e.target.value)} pattern="[a-z0-9]+(-[a-z0-9]+)*" required value={post.slug} /></label>
        <label className="text-sm font-semibold sm:col-span-2">संक्षिप्त विवरण<textarea className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2 font-normal" maxLength={600} onChange={(e) => patch("shortSummary", e.target.value)} required value={post.shortSummary} /></label>
        <label className="text-sm font-semibold sm:col-span-2">पूरा समाचार<textarea className="mt-1 min-h-56 w-full rounded-lg border px-3 py-2 font-normal" maxLength={20000} onChange={(e) => patch("fullContent", e.target.value)} required value={post.fullContent} /></label>
        <label className="text-sm font-semibold">श्रेणी<select className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("category", e.target.value)} value={post.category}>{newsCategories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="text-sm font-semibold">टैग (अल्पविराम से अलग करें)<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("tags", e.target.value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12))} value={post.tags.join(", ")} /></label>
        <label className="text-sm font-semibold">राज्य<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => patch("state", e.target.value || null)} value={post.state ?? ""} /></label>
        <label className="text-sm font-semibold">जिला<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => patch("district", e.target.value || null)} value={post.district ?? ""} /></label>
        <label className="text-sm font-semibold">प्रकाशन समय<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("scheduledPublishAt", e.target.value || null)} type="datetime-local" value={datetimeLocal(post.scheduledPublishAt)} /></label>
        <label className="text-sm font-semibold">समाप्ति समय<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("expiresAt", e.target.value || null)} type="datetime-local" value={datetimeLocal(post.expiresAt)} /></label>
        <label className="text-sm font-semibold">मुखपृष्ठ प्रदर्शन क्रम<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" max={9999} min={0} onChange={(e) => patch("homepageDisplayOrder", e.target.value ? Number(e.target.value) : null)} type="number" value={post.homepageDisplayOrder ?? ""} /></label>
        <label className="text-sm font-semibold">चित्र का वैकल्पिक पाठ (हिंदी)<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={180} onChange={(e) => patch("coverImageAltHindi", e.target.value || null)} value={post.coverImageAltHindi ?? ""} /></label>
        <label className="text-sm font-semibold sm:col-span-2">कवर चित्र (PNG, JPEG या WebP; अधिकतम 5 MB)<input accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full text-sm" onChange={(e) => setCover(e.target.files?.[0] ?? null)} type="file" /></label>
      </div>
      {canPublish ? <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input checked={post.isPublished} onChange={(e) => patch("isPublished", e.target.checked)} type="checkbox" /> प्रकाशित करें</label><label className="flex items-center gap-2"><input checked={post.isFeatured} onChange={(e) => patch("isFeatured", e.target.checked)} type="checkbox" /> मुखपृष्ठ पर प्रमुख दिखाएँ</label></div> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">आप समाचार प्रारूप सहेज सकते हैं; प्रकाशन अधिकृत प्रशासक करेगा।</p>}
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      {notice ? <p className="text-sm text-emerald-800" role="status">{notice}</p> : null}
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "सहेजा जा रहा है..." : post.id ? "अपडेट करें" : "प्रारूप सहेजें"}</button>{post.id && !post.archivedAt ? <button className="min-h-11 rounded-xl border border-amber-700 px-5 text-sm font-semibold text-amber-900" onClick={archive} type="button">संग्रहीत करें</button> : null}<a className="inline-flex min-h-11 items-center rounded-xl border px-5 text-sm font-semibold" href="/admin/samachar">वापस जाएँ</a></div>
    </form>
  );
}
