"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type LinkItem = {
  id: string;
  title: string;
  platform: string;
  url: string;
  level: "NATIONAL" | "STATE" | "DISTRICT";
  state: string | null;
  district: string | null;
  description: string | null;
  contactPersonName: string | null;
  isPublic: boolean;
  isActive: boolean;
  visibility: "PUBLIC" | "MEMBERS_ONLY" | "HIDDEN";
  displayOrder: number;
};

type Draft = Omit<LinkItem, "id">;
const emptyDraft: Draft = {
  title: "",
  platform: "INSTAGRAM",
  url: "",
  level: "NATIONAL",
  state: "",
  district: "",
  description: "",
  contactPersonName: "",
  isPublic: true,
  isActive: true,
  visibility: "PUBLIC",
  displayOrder: 0,
};
const draftForLevel = (level: Draft["level"]) => ({ ...emptyDraft, level });
const platforms = ["INSTAGRAM", "FACEBOOK", "YOUTUBE", "X", "WHATSAPP_CHANNEL", "WHATSAPP_GROUP", "WHATSAPP_CONTACT", "TELEGRAM", "WEBSITE", "EMAIL"];
const platformLabels: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
  X: "X / Twitter",
  WHATSAPP_CHANNEL: "WhatsApp चैनल",
  WHATSAPP_GROUP: "WhatsApp समूह",
  WHATSAPP_CONTACT: "WhatsApp संपर्क",
  TELEGRAM: "Telegram",
  WEBSITE: "वेबसाइट",
  EMAIL: "ईमेल",
};
const levelLabels: Record<Draft["level"], string> = {
  NATIONAL: "राष्ट्रीय",
  STATE: "राज्य",
  DISTRICT: "जिला",
};

export function OfficialLinksManager({
  initialLinks,
  allowedLevels,
}: {
  initialLinks: LinkItem[];
  allowedLevels: Draft["level"][];
}) {
  const router = useRouter();
  const [links, setLinks] = useState(initialLinks);
  const [draft, setDraft] = useState<Draft>(
    draftForLevel(allowedLevels[0] ?? "NATIONAL"),
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const response = await fetch(editingId ? `/api/admin/official-links/${encodeURIComponent(editingId)}` : "/api/admin/official-links", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          state: draft.state || null,
          district: draft.district || null,
          description: draft.description || null,
          contactPersonName: draft.contactPersonName || null,
        }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message = typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "आधिकारिक लिंक सहेजा नहीं जा सका।";
        throw new Error(message);
      }
      if (!body || typeof body !== "object" || !("link" in body) || typeof body.link !== "object" || !body.link) {
        throw new Error("आधिकारिक लिंक सहेजा नहीं जा सका।");
      }
      const saved = body.link as LinkItem;
      setLinks((current) => editingId ? current.map((link) => link.id === editingId ? saved : link) : [saved, ...current]);
      setDraft(draftForLevel(allowedLevels[0] ?? "NATIONAL"));
      setEditingId(null);
      setFeedback("आधिकारिक लिंक सहेजा गया।");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "आधिकारिक लिंक सहेजा नहीं जा सका।");
    } finally {
      setSaving(false);
    }
  }

  async function archive(link: LinkItem) {
    if (!window.confirm(`क्या "${link.title}" को सार्वजनिक लिंक पृष्ठ से छिपाएँ?`)) return;
    try {
      const response = await fetch(`/api/admin/official-links/${encodeURIComponent(link.id)}`, { method: "DELETE" });
      if (!response.ok) throw new Error("आधिकारिक लिंक छिपाया नहीं जा सका।");
      setLinks((current) => current.filter((item) => item.id !== link.id));
      if (editingId === link.id) {
        setEditingId(null);
        setDraft(draftForLevel(allowedLevels[0] ?? "NATIONAL"));
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "आधिकारिक लिंक छिपाया नहीं जा सका।");
    }
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <form className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={save}>
        <h2 className="text-lg font-bold text-stone-950">{editingId ? "आधिकारिक लिंक अपडेट करें" : "नया आधिकारिक लिंक जोड़ें"}</h2>
        <label className="block text-sm font-semibold">शीर्षक<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => setDraft({ ...draft, title: e.target.value })} required value={draft.title} /></label>
        <label className="block text-sm font-semibold">मंच<select className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => setDraft({ ...draft, platform: e.target.value })} value={draft.platform}>{platforms.map((platform) => <option key={platform} value={platform}>{platformLabels[platform]}</option>)}</select></label>
        <label className="block text-sm font-semibold">URL<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={2048} onChange={(e) => setDraft({ ...draft, url: e.target.value })} placeholder="https://" required type={draft.platform === "EMAIL" ? "text" : "url"} value={draft.url} /></label>
        <label className="block text-sm font-semibold">स्तर<select className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => setDraft({ ...draft, level: e.target.value as Draft["level"] })} value={draft.level}>{allowedLevels.map((level) => <option key={level} value={level}>{levelLabels[level]}</option>)}</select></label>
        {draft.level !== "NATIONAL" ? <label className="block text-sm font-semibold">राज्य<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => setDraft({ ...draft, state: e.target.value })} required value={draft.state ?? ""} /></label> : null}
        {draft.level === "DISTRICT" ? <label className="block text-sm font-semibold">जिला<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => setDraft({ ...draft, district: e.target.value })} required value={draft.district ?? ""} /></label> : null}
        <label className="block text-sm font-semibold">विवरण<textarea className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2 font-normal" maxLength={500} onChange={(e) => setDraft({ ...draft, description: e.target.value })} value={draft.description ?? ""} /></label>
        <label className="block text-sm font-semibold">संपर्क व्यक्ति (केवल प्रशासक)<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => setDraft({ ...draft, contactPersonName: e.target.value })} value={draft.contactPersonName ?? ""} /></label>
        <label className="block text-sm font-semibold">दृश्यता<select className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => setDraft({ ...draft, visibility: e.target.value as Draft["visibility"] })} value={draft.visibility}><option value="PUBLIC">सार्वजनिक</option><option value="MEMBERS_ONLY">केवल सदस्य</option><option value="HIDDEN">छिपा हुआ</option></select></label>
        <label className="block text-sm font-semibold">प्रदर्शन क्रम<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" max={9999} min={0} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })} type="number" value={draft.displayOrder} /></label>
        <label className="flex items-center gap-2 text-sm font-medium"><input checked={draft.isPublic} onChange={(e) => setDraft({ ...draft, isPublic: e.target.checked })} type="checkbox" /> सार्वजनिक लिंक</label>
        <label className="flex items-center gap-2 text-sm font-medium"><input checked={draft.isActive} onChange={(e) => setDraft({ ...draft, isActive: e.target.checked })} type="checkbox" /> सक्रिय</label>
        {draft.platform === "WHATSAPP_GROUP" ? <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-900">इस लिंक को प्राप्त करने वाला व्यक्ति इसे आगे साझा कर सकता है। सार्वजनिक सूचना के लिए WhatsApp चैनल या जुड़ने के अनुरोध वाला संपर्क विकल्प बेहतर है।</p> : null}
        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        {feedback ? <p className="text-sm text-emerald-800" role="status">{feedback}</p> : null}
        <div className="flex gap-2"><button className="min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "सहेजा जा रहा है..." : "लिंक सहेजें"}</button>{editingId ? <button className="rounded-xl border px-4 text-sm font-semibold" onClick={() => { setEditingId(null); setDraft(draftForLevel(allowedLevels[0] ?? "NATIONAL")); }} type="button">रद्द करें</button> : null}</div>
      </form>
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-stone-950">प्रबंधित लिंक</h2>
        {links.length === 0 ? <p className="rounded-xl border border-stone-200 bg-white p-5 text-sm text-stone-600">अभी कोई आधिकारिक लिंक नहीं जोड़ा गया है।</p> : links.map((link) => (
          <article className="flex flex-col justify-between gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center" key={link.id}>
            <div className="min-w-0"><h3 className="font-semibold text-stone-950">{link.title}</h3><p className="mt-1 truncate text-xs text-stone-500">{platformLabels[link.platform] ?? link.platform} · {levelLabels[link.level]}{link.state ? ` · ${link.state}` : ""}{link.district ? ` · ${link.district}` : ""}</p></div>
            <div className="flex shrink-0 gap-2"><button className="rounded-lg border px-3 py-2 text-sm font-semibold" onClick={() => { setEditingId(link.id); setDraft({ ...link }); setFeedback(""); setError(""); }}>संपादित करें</button><button className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-800" onClick={() => archive(link)}>छिपाएँ</button></div>
          </article>
        ))}
      </section>
    </div>
  );
}
