"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { activityTypes } from "@/lib/ground-activity-validation";

type GalleryImage = { id: string; altTextHindi: string | null; displayOrder: number; isPublic: boolean };
type Activity = {
  id?: string;
  slug: string;
  title: string;
  shortSummary: string;
  fullDescription: string;
  activityType: string;
  activityDate: string;
  state: string;
  district: string;
  tehsilOrBlock: string | null;
  cityOrVillage: string | null;
  publicLocationLabel: string | null;
  exactLocationPublic: boolean;
  mapLink: string | null;
  isPublished: boolean;
  isFeaturedOnHomepage: boolean;
  homepageDisplayOrder: number | null;
  scheduledPublishAt: string | null;
  expiresAt: string | null;
  archivedAt: string | null;
  coverImageAltHindi: string | null;
  images: GalleryImage[];
};

const blankActivity: Activity = {
  slug: "", title: "", shortSummary: "", fullDescription: "", activityType: "अन्य",
  activityDate: new Date().toISOString().slice(0, 10), state: "", district: "",
  tehsilOrBlock: null, cityOrVillage: null, publicLocationLabel: null,
  exactLocationPublic: false, mapLink: null, isPublished: false,
  isFeaturedOnHomepage: false, homepageDisplayOrder: null, scheduledPublishAt: null,
  expiresAt: null, archivedAt: null, coverImageAltHindi: null, images: [],
};

function datetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function toIso(value: string) {
  return value ? new Date(value).toISOString() : "";
}

export function ActivityForm({ initialActivity, canPublish }: { initialActivity: Activity | null; canPublish: boolean }) {
  const router = useRouter();
  const [activity, setActivity] = useState<Activity>(initialActivity ?? blankActivity);
  const [cover, setCover] = useState<File | null>(null);
  const [galleryFile, setGalleryFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const patch = (key: keyof Activity, value: Activity[keyof Activity]) => setActivity((current) => ({ ...current, [key]: value }));

  async function uploadGallery(activityId: string): Promise<GalleryImage | null> {
    if (!galleryFile) return null;
    const form = new FormData();
    form.set("image", galleryFile);
    form.set("altText", galleryFile.name.replace(/\.[^.]+$/, "").slice(0, 180));
    form.set("displayOrder", String(activity.images.length));
    form.set("isPublic", "true");
    const response = await fetch(`/api/admin/hamare-karya/${encodeURIComponent(activityId)}/gallery`, { method: "POST", body: form });
    const body: unknown = await response.json();
    if (!response.ok) throw new Error(typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "गैलरी चित्र सहेजा नहीं जा सका।");
    if (
      typeof body !== "object" ||
      body === null ||
      !("image" in body) ||
      typeof body.image !== "object" ||
      body.image === null ||
      !("id" in body.image) ||
      typeof body.image.id !== "string" ||
      !("displayOrder" in body.image) ||
      typeof body.image.displayOrder !== "number" ||
      !("isPublic" in body.image) ||
      typeof body.image.isPublic !== "boolean"
    ) {
      throw new Error("गैलरी चित्र का उत्तर मान्य नहीं है।");
    }
    return {
      id: body.image.id,
      displayOrder: body.image.displayOrder,
      isPublic: body.image.isPublic,
      altTextHindi: null,
    };
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const slug = activity.slug?.trim() || "";
      const payload = {
        ...activity,
        slug: slug || undefined,
        images: undefined,
        tehsilOrBlock: activity.tehsilOrBlock || null,
        cityOrVillage: activity.cityOrVillage || null,
        publicLocationLabel: activity.publicLocationLabel || null,
        mapLink: activity.mapLink || "",
        scheduledPublishAt: toIso(String(activity.scheduledPublishAt ?? "")),
        expiresAt: toIso(String(activity.expiresAt ?? "")),
        archivedAt: toIso(String(activity.archivedAt ?? "")),
      };
      const response = await fetch(activity.id ? `/api/admin/hamare-karya/${encodeURIComponent(activity.id)}` : "/api/admin/hamare-karya", {
        method: activity.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body: unknown = await response.json();
      if (!response.ok || typeof body !== "object" || !body || !("activity" in body) || typeof body.activity !== "object" || !body.activity || !("id" in body.activity) || typeof body.activity.id !== "string") {
        throw new Error(typeof body === "object" && body && "error" in body && typeof body.error === "string" ? body.error : "कार्य सहेजा नहीं जा सका।");
      }
      const savedId = body.activity.id;
      if (cover) {
        const form = new FormData();
        form.set("cover", cover);
        form.set("altText", activity.coverImageAltHindi ?? "");
        const upload = await fetch(`/api/admin/hamare-karya/${encodeURIComponent(savedId)}/cover`, { method: "POST", body: form });
        const uploadBody: unknown = await upload.json();
        if (!upload.ok) throw new Error(typeof uploadBody === "object" && uploadBody && "error" in uploadBody && typeof uploadBody.error === "string" ? uploadBody.error : "कवर चित्र सहेजा नहीं जा सका।");
      }
      const uploadedImage = await uploadGallery(savedId);
      if (uploadedImage) {
        setActivity((current) => ({
          ...current,
          images: [...current.images, uploadedImage],
        }));
      }
      const imagesToReorder = [
        ...activity.images,
        ...(uploadedImage ? [uploadedImage] : []),
      ];
      const reorder = await fetch(`/api/admin/hamare-karya/${encodeURIComponent(savedId)}/gallery`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imagesToReorder.map(({ id, displayOrder, isPublic }) => ({ id, displayOrder, isPublic })) }),
      });
      if (!reorder.ok) throw new Error("गैलरी क्रम सहेजा नहीं जा सका।");
      router.push(`/admin/hamare-karya/${encodeURIComponent(savedId)}/edit`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "कार्य सहेजा नहीं जा सका।");
    } finally {
      setSaving(false);
    }
  }

  async function removeImage(imageId: string) {
    if (!activity.id || !window.confirm("क्या आप इस गैलरी चित्र को हटाना चाहते हैं?")) return;
    const response = await fetch(`/api/admin/hamare-karya/${encodeURIComponent(activity.id)}/gallery?imageId=${encodeURIComponent(imageId)}`, { method: "DELETE" });
    if (!response.ok) {
      setError("गैलरी चित्र हटाया नहीं जा सका।");
      return;
    }
    setActivity((current) => ({ ...current, images: current.images.filter((image) => image.id !== imageId) }));
    router.refresh();
  }

  async function archive() {
    if (!activity.id || !window.confirm("क्या आप इस कार्य को संग्रहीत करना चाहते हैं?")) return;
    setActivity((current) => ({ ...current, archivedAt: new Date().toISOString(), isPublished: false }));
    window.setTimeout(() => {
      const form = document.getElementById("activity-form");
      if (form instanceof HTMLFormElement) form.requestSubmit();
    }, 0);
  }

  return (
    <form id="activity-form" className="mt-7 space-y-5 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8" onSubmit={save}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">कार्य का शीर्षक<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={180} onChange={(e) => patch("title", e.target.value)} required value={activity.title} /></label>
        <label className="text-sm font-semibold">URL पहचान (अंग्रेज़ी अक्षर)<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-mono font-normal" maxLength={120} onChange={(e) => patch("slug", e.target.value)} pattern="[a-z0-9]+(-[a-z0-9]+)*" required value={activity.slug} /></label>
        <label className="text-sm font-semibold sm:col-span-2">संक्षिप्त विवरण<textarea className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2 font-normal" maxLength={600} onChange={(e) => patch("shortSummary", e.target.value)} required value={activity.shortSummary} /></label>
        <label className="text-sm font-semibold sm:col-span-2">विस्तृत विवरण<textarea className="mt-1 min-h-52 w-full rounded-lg border px-3 py-2 font-normal" maxLength={20000} onChange={(e) => patch("fullDescription", e.target.value)} required value={activity.fullDescription} /></label>
        <label className="text-sm font-semibold">कार्य का प्रकार<select className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("activityType", e.target.value)} value={activity.activityType}>{activityTypes.map((type) => <option key={type}>{type}</option>)}</select></label>
        <label className="text-sm font-semibold">कार्य की तिथि<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("activityDate", e.target.value)} required type="date" value={activity.activityDate.slice(0, 10)} /></label>
        <label className="text-sm font-semibold">राज्य<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => patch("state", e.target.value)} required value={activity.state} /></label>
        <label className="text-sm font-semibold">जिला<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(e) => patch("district", e.target.value)} required value={activity.district} /></label>
        <label className="text-sm font-semibold">तहसील / ब्लॉक<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={160} onChange={(e) => patch("tehsilOrBlock", e.target.value || null)} value={activity.tehsilOrBlock ?? ""} /></label>
        <label className="text-sm font-semibold">नगर / गाँव<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={160} onChange={(e) => patch("cityOrVillage", e.target.value || null)} value={activity.cityOrVillage ?? ""} /></label>
        <label className="text-sm font-semibold">व्यापक सार्वजनिक स्थान<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={180} onChange={(e) => patch("publicLocationLabel", e.target.value || null)} value={activity.publicLocationLabel ?? ""} /></label>
        <label className="text-sm font-semibold">मानचित्र लिंक (केवल HTTPS)<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("mapLink", e.target.value || null)} type="url" value={activity.mapLink ?? ""} /></label>
        <label className="text-sm font-semibold">प्रकाशन समय<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("scheduledPublishAt", e.target.value || null)} type="datetime-local" value={datetimeLocal(activity.scheduledPublishAt)} /></label>
        <label className="text-sm font-semibold">समाप्ति समय<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(e) => patch("expiresAt", e.target.value || null)} type="datetime-local" value={datetimeLocal(activity.expiresAt)} /></label>
        <label className="text-sm font-semibold">मुखपृष्ठ प्रदर्शन क्रम<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" max={9999} min={0} onChange={(e) => patch("homepageDisplayOrder", e.target.value ? Number(e.target.value) : null)} type="number" value={activity.homepageDisplayOrder ?? ""} /></label>
        <label className="text-sm font-semibold">कवर चित्र का वैकल्पिक पाठ<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={180} onChange={(e) => patch("coverImageAltHindi", e.target.value || null)} value={activity.coverImageAltHindi ?? ""} /></label>
        <label className="text-sm font-semibold sm:col-span-2">कवर चित्र (PNG, JPEG या WebP; अधिकतम 5 MB)<input accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full text-sm" onChange={(e) => setCover(e.target.files?.[0] ?? null)} type="file" /></label>
        <label className="text-sm font-semibold sm:col-span-2">गैलरी चित्र (एक समय में एक; अधिकतम 5 MB)<input accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full text-sm" onChange={(e) => setGalleryFile(e.target.files?.[0] ?? null)} type="file" /></label>
      </div>
      <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">सटीक बचाव-स्थान सार्वजनिक न करें। तहसील, गाँव और मानचित्र लिंक केवल स्पष्ट अनुमति पर दिखेंगे।</p>
      <label className="flex items-center gap-2 text-sm"><input checked={activity.exactLocationPublic} onChange={(e) => patch("exactLocationPublic", e.target.checked)} type="checkbox" /> सटीक स्थान और मानचित्र लिंक सार्वजनिक दिखाएँ</label>
      {activity.images.length ? <section className="rounded-xl border p-4"><h2 className="font-bold">गैलरी प्रबंधन</h2><ul className="mt-3 space-y-3">{activity.images.map((image) => <li className="flex flex-wrap items-center gap-3 border-t pt-3" key={image.id}><span className="font-mono text-xs">{image.id.slice(0, 8)}</span><label className="flex items-center gap-2 text-sm">क्रम<input className="w-20 rounded border px-2 py-1" max={9999} min={0} onChange={(e) => setActivity((current) => ({ ...current, images: current.images.map((item) => item.id === image.id ? { ...item, displayOrder: Number(e.target.value) } : item) }))} type="number" value={image.displayOrder} /></label><label className="flex items-center gap-2 text-sm"><input checked={image.isPublic} onChange={(e) => setActivity((current) => ({ ...current, images: current.images.map((item) => item.id === image.id ? { ...item, isPublic: e.target.checked } : item) }))} type="checkbox" /> सार्वजनिक</label><button className="text-sm font-semibold text-red-700 underline" onClick={() => void removeImage(image.id)} type="button">चित्र हटाएँ</button></li>)}</ul></section> : null}
      {canPublish ? <div className="flex flex-wrap gap-5 text-sm"><label className="flex items-center gap-2"><input checked={activity.isPublished} onChange={(e) => patch("isPublished", e.target.checked)} type="checkbox" /> प्रकाशित करें</label><label className="flex items-center gap-2"><input checked={activity.isFeaturedOnHomepage} onChange={(e) => patch("isFeaturedOnHomepage", e.target.checked)} type="checkbox" /> मुखपृष्ठ पर प्रमुख दिखाएँ</label></div> : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">आप प्रारूप सहेज सकते हैं; प्रकाशन अधिकृत प्रशासक करेगा।</p>}
      {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
      <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-xl bg-emerald-900 px-5 font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "सहेजा जा रहा है..." : "सहेजें"}</button>{activity.id && !activity.archivedAt ? <button className="min-h-11 rounded-xl border border-amber-700 px-5 font-semibold text-amber-900" onClick={archive} type="button">संग्रहीत करें</button> : null}<a className="inline-flex min-h-11 items-center rounded-xl border px-5 font-semibold" href="/admin/hamare-karya">वापस जाएँ</a></div>
    </form>
  );
}
