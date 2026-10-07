"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Administrator = {
  id: string;
  name: string;
  email: string;
  role: string;
  assignedState: string | null;
  assignedDistrict: string | null;
  isActive: boolean;
};

type Draft = Omit<Administrator, "id">;

const roles = [
  "SUPER_ADMIN",
  "NATIONAL_ADMIN",
  "STATE_ADMIN",
  "DISTRICT_ADMIN",
  "CONTENT_ADMIN",
  "CONTENT_EDITOR",
  "VIEWER",
];
const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "मुख्य प्रशासक",
  NATIONAL_ADMIN: "राष्ट्रीय प्रशासक",
  STATE_ADMIN: "राज्य प्रशासक",
  DISTRICT_ADMIN: "जिला प्रशासक",
  CONTENT_ADMIN: "सामग्री प्रशासक",
  CONTENT_EDITOR: "सामग्री संपादक",
  VIEWER: "दर्शक",
};
const emptyDraft: Draft = {
  name: "",
  email: "",
  role: "VIEWER",
  assignedState: "",
  assignedDistrict: "",
  isActive: true,
};

function hasAdministrator(value: unknown): value is Administrator {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "email" in value &&
    typeof value.email === "string" &&
    "role" in value &&
    typeof value.role === "string" &&
    "isActive" in value &&
    typeof value.isActive === "boolean"
  );
}

function getError(body: unknown): string {
  return typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error
    : "अनुरोध पूरा नहीं किया जा सका।";
}

export function AdministratorManager({
  initialAdministrators,
  currentAdminId,
}: {
  initialAdministrators: Administrator[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [administrators, setAdministrators] = useState(initialAdministrators);
  const [draft, setDraft] = useState(emptyDraft);
  const [password, setPassword] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  async function createAdministrator(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const response = await fetch("/api/admin/administrators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...draft, password }),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(getError(body));
      const createdAdministrator =
        typeof body === "object" && body !== null && "administrator" in body
          ? body.administrator
          : null;
      if (!hasAdministrator(createdAdministrator)) {
        throw new Error("प्रशासक बनाया गया, लेकिन सर्वर से मान्य उत्तर नहीं मिला।");
      }
      setAdministrators((current) => [...current, createdAdministrator]);
      setDraft(emptyDraft);
      setPassword("");
      setFeedback("प्रशासक खाता बनाया गया। अस्थायी पासवर्ड सुरक्षित रूप से संबंधित व्यक्ति को दें।");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "प्रशासक खाता नहीं बनाया जा सका।");
    } finally {
      setSaving(false);
    }
  }

  async function updateAdministrator(id: string, value: Draft) {
    setSaving(true);
    setError("");
    setFeedback("");
    try {
      const response = await fetch(`/api/admin/administrators/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(getError(body));
      const updatedAdministrator =
        typeof body === "object" && body !== null && "administrator" in body
          ? body.administrator
          : null;
      if (!hasAdministrator(updatedAdministrator)) {
        throw new Error("प्रशासक की जानकारी अपडेट नहीं की जा सकी।");
      }
      setAdministrators((current) => current.map((item) => item.id === id ? updatedAdministrator : item));
      setEditingId(null);
      setFeedback("प्रशासक की पहुँच अपडेट कर दी गई है।");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "प्रशासक की पहुँच अपडेट नहीं की जा सकी।");
    } finally {
      setSaving(false);
    }
  }

  function editor(item: Administrator) {
    const value = item.id === editingId
      ? draft
      : {
          name: item.name,
          email: item.email,
          role: item.role,
          assignedState: item.assignedState,
          assignedDistrict: item.assignedDistrict,
          isActive: item.isActive,
        };
    return (
      <form
        className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
        key={item.id}
        onSubmit={(event) => {
          event.preventDefault();
          void updateAdministrator(item.id, value);
        }}
      >
        <label className="text-xs font-semibold text-stone-600">नाम<input className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm font-normal text-stone-900" disabled={item.id !== editingId || item.id === currentAdminId} maxLength={120} onChange={(event) => setDraft({ ...value, name: event.target.value })} required value={value.name} /></label>
        <label className="text-xs font-semibold text-stone-600">ईमेल<input className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm font-normal text-stone-900" disabled maxLength={254} type="email" value={value.email} /></label>
        <label className="text-xs font-semibold text-stone-600">भूमिका<select className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm font-normal text-stone-900" disabled={item.id !== editingId || item.id === currentAdminId} onChange={(event) => setDraft({ ...value, role: event.target.value, assignedState: "", assignedDistrict: "" })} value={value.role}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
        {["STATE_ADMIN", "DISTRICT_ADMIN"].includes(value.role) ? <label className="text-xs font-semibold text-stone-600">आवंटित राज्य<input className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm font-normal text-stone-900" disabled={item.id !== editingId || item.id === currentAdminId} maxLength={120} onChange={(event) => setDraft({ ...value, assignedState: event.target.value })} required value={value.assignedState ?? ""} /></label> : null}
        {value.role === "DISTRICT_ADMIN" ? <label className="text-xs font-semibold text-stone-600">आवंटित जिला<input className="mt-1 min-h-10 w-full rounded-lg border px-2 text-sm font-normal text-stone-900" disabled={item.id !== editingId || item.id === currentAdminId} maxLength={120} onChange={(event) => setDraft({ ...value, assignedDistrict: event.target.value })} required value={value.assignedDistrict ?? ""} /></label> : null}
        <label className="flex items-center gap-2 self-end pb-2 text-sm font-medium text-stone-700"><input checked={value.isActive} disabled={item.id !== editingId || item.id === currentAdminId} onChange={(event) => setDraft({ ...value, isActive: event.target.checked })} type="checkbox" />सक्रिय</label>
        <div className="flex items-end gap-2">
          {item.id === editingId ? <><button className="min-h-10 rounded-lg bg-emerald-900 px-4 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">सहेजें</button><button className="min-h-10 rounded-lg border px-3 text-sm" onClick={() => setEditingId(null)} type="button">रद्द करें</button></> : <button className="min-h-10 rounded-lg border px-4 text-sm font-semibold" disabled={item.id === currentAdminId || saving} onClick={() => { setEditingId(item.id); setDraft(value); }} type="button">पहुँच संपादित करें</button>}
        </div>
      </form>
    );
  }

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <form className="h-fit space-y-4 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={createAdministrator}>
        <h2 className="text-lg font-bold text-stone-950">नया प्रशासक जोड़ें</h2>
        <label className="block text-sm font-semibold">नाम<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required value={draft.name} /></label>
        <label className="block text-sm font-semibold">ईमेल<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={254} onChange={(event) => setDraft({ ...draft, email: event.target.value })} required type="email" value={draft.email} /></label>
        <label className="block text-sm font-semibold">अस्थायी पासवर्ड (कम से कम 12 अक्षर)<input autoComplete="new-password" className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={1024} minLength={12} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></label>
        <label className="block text-sm font-semibold">भूमिका<select className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" onChange={(event) => setDraft({ ...draft, role: event.target.value, assignedState: "", assignedDistrict: "" })} value={draft.role}>{roles.map((role) => <option key={role} value={role}>{roleLabels[role]}</option>)}</select></label>
        {["STATE_ADMIN", "DISTRICT_ADMIN"].includes(draft.role) ? <label className="block text-sm font-semibold">आवंटित राज्य<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(event) => setDraft({ ...draft, assignedState: event.target.value })} required value={draft.assignedState ?? ""} /></label> : null}
        {draft.role === "DISTRICT_ADMIN" ? <label className="block text-sm font-semibold">आवंटित जिला<input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-normal" maxLength={120} onChange={(event) => setDraft({ ...draft, assignedDistrict: event.target.value })} required value={draft.assignedDistrict ?? ""} /></label> : null}
        <label className="flex items-center gap-2 text-sm font-medium"><input checked={draft.isActive} onChange={(event) => setDraft({ ...draft, isActive: event.target.checked })} type="checkbox" />सक्रिय</label>
        {error ? <p className="text-sm text-red-700" role="alert">{error}</p> : null}
        {feedback ? <p className="text-sm text-emerald-800" role="status">{feedback}</p> : null}
        <button className="min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "बनाया जा रहा है..." : "प्रशासक जोड़ें"}</button>
      </form>
      <section className="space-y-4">
        <div><h2 className="text-lg font-bold text-stone-950">प्रशासक पहुँच</h2><p className="mt-1 text-sm text-stone-600">मुख्य प्रशासक अपनी पहुँच बदल या निष्क्रिय नहीं कर सकता। कम से कम एक मुख्य प्रशासक सक्रिय रहना चाहिए।</p></div>
        {administrators.map(editor)}
      </section>
    </div>
  );
}
