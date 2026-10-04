"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Registration = {
  id: string;
  registrationNumber: string;
  status: string;
  issueDate: string | null;
  expiryDate: string | null;
  revokedReason: string | null;
  createdAt: string;
};

type Member = {
  id: string;
  slug: string;
  regNo: string;
  name: string;
  phone: string;
  email: string | null;
  daitva: string | null;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  cityOrVillage: string | null;
  publicBio: string | null;
  joiningDate: string | null;
  appointmentStartDate: string | null;
  appointmentEndDate: string | null;
  isPublicProfile: boolean;
  isEmergencyHidden: boolean;
  isFeatured: boolean;
  profileStatus: string;
  displayOrder: number;
  instagramUrl: string | null;
  facebookUrl: string | null;
  youtubeUrl: string | null;
  whatsappContactUrl: string | null;
  adminNotes: string | null;
  registrations: Registration[];
};

type Draft = {
  name: string;
  phone: string;
  email: string;
  daitva: string;
  state: string;
  district: string;
  tehsil: string;
  cityOrVillage: string;
  publicBio: string;
  joiningDate: string;
  appointmentStartDate: string;
  appointmentEndDate: string;
  isPublicProfile: boolean;
  isEmergencyHidden: boolean;
  isFeatured: boolean;
  profileStatus: string;
  displayOrder: number;
  instagramUrl: string;
  facebookUrl: string;
  youtubeUrl: string;
  whatsappContactUrl: string;
  adminNotes: string;
  registrationNumber: string;
  issueDate: string;
  expiryDate: string;
  registrationStatus: string;
  registrationAdminReason: string;
};

const emptyDraft: Draft = {
  name: "",
  phone: "",
  email: "",
  daitva: "",
  state: "",
  district: "",
  tehsil: "",
  cityOrVillage: "",
  publicBio: "",
  joiningDate: "",
  appointmentStartDate: "",
  appointmentEndDate: "",
  isPublicProfile: false,
  isEmergencyHidden: false,
  isFeatured: false,
  profileStatus: "PENDING",
  displayOrder: 0,
  instagramUrl: "",
  facebookUrl: "",
  youtubeUrl: "",
  whatsappContactUrl: "",
  adminNotes: "",
  registrationNumber: "",
  issueDate: "",
  expiryDate: "",
  registrationStatus: "PENDING",
  registrationAdminReason: "",
};

function asDate(value: string | null | undefined) {
  return value ? value.slice(0, 10) : "";
}

function memberDraft(member: Member): Draft {
  const currentRegistration = member.registrations[0];
  return {
    name: member.name,
    phone: member.phone,
    email: member.email ?? "",
    daitva: member.daitva ?? "",
    state: member.state ?? "",
    district: member.district ?? "",
    tehsil: member.tehsil ?? "",
    cityOrVillage: member.cityOrVillage ?? "",
    publicBio: member.publicBio ?? "",
    joiningDate: asDate(member.joiningDate),
    appointmentStartDate: asDate(member.appointmentStartDate),
    appointmentEndDate: asDate(member.appointmentEndDate),
    isPublicProfile: member.isPublicProfile,
    isEmergencyHidden: member.isEmergencyHidden,
    isFeatured: member.isFeatured,
    profileStatus: member.profileStatus,
    displayOrder: member.displayOrder,
    instagramUrl: member.instagramUrl ?? "",
    facebookUrl: member.facebookUrl ?? "",
    youtubeUrl: member.youtubeUrl ?? "",
    whatsappContactUrl: member.whatsappContactUrl ?? "",
    adminNotes: member.adminNotes ?? "",
    registrationNumber: member.regNo,
    issueDate: asDate(currentRegistration?.issueDate),
    expiryDate: asDate(currentRegistration?.expiryDate),
    registrationStatus: currentRegistration?.status ?? "PENDING",
    registrationAdminReason: currentRegistration?.revokedReason ?? "",
  };
}

async function responseError(response: Response): Promise<string> {
  const data: unknown = await response.json().catch(() => null);
  if (typeof data === "object" && data && "error" in data && typeof data.error === "string") return data.error;
  return "अनुरोध पूरा नहीं किया जा सका।";
}

async function responseDetails(response: Response): Promise<{
  message: string;
  fieldErrors: Record<string, string>;
}> {
  const data: unknown = await response.json().catch(() => null);
  if (typeof data !== "object" || data === null) {
    return { message: "अनुरोध पूरा नहीं किया जा सका।", fieldErrors: {} };
  }
  const message =
    "error" in data && typeof data.error === "string"
      ? data.error
      : "अनुरोध पूरा नहीं किया जा सका।";
  const fieldErrors: Record<string, string> = {};
  if ("fieldErrors" in data && typeof data.fieldErrors === "object" && data.fieldErrors !== null) {
    for (const [field, value] of Object.entries(data.fieldErrors)) {
      if (typeof value === "string") fieldErrors[field] = value;
    }
  }
  return { message, fieldErrors };
}

const fieldLabels: Record<string, string> = {
  name: "पूरा नाम",
  phone: "मोबाइल नंबर",
  email: "ईमेल",
  daitva: "दायित्व",
  state: "राज्य",
  district: "जिला",
  tehsil: "तहसील / ब्लॉक",
  cityOrVillage: "गाँव / शहर",
  publicBio: "सार्वजनिक परिचय",
  joiningDate: "संगठन से जुड़ने की तिथि",
  appointmentStartDate: "नियुक्ति आरंभ तिथि",
  appointmentEndDate: "नियुक्ति समाप्ति तिथि",
  displayOrder: "प्रदर्शन क्रम",
  instagramUrl: "Instagram लिंक",
  facebookUrl: "Facebook लिंक",
  youtubeUrl: "YouTube लिंक",
  whatsappContactUrl: "WhatsApp संपर्क लिंक",
  profileStatus: "प्रोफ़ाइल स्थिति",
  registrationNumber: "पंजीकरण संख्या",
  issueDate: "जारी करने की तिथि",
  expiryDate: "समाप्ति तिथि",
  registrationStatus: "सत्यापन स्थिति",
  registrationAdminReason: "केवल प्रशासक के लिए पंजीकरण कारण",
};

const profileStatusLabels: Record<string, string> = {
  DRAFT: "प्रारूप",
  PENDING: "लंबित",
  ACTIVE: "सक्रिय",
  INACTIVE: "निष्क्रिय",
  SUSPENDED: "निलंबित",
  REVOKED: "रद्द",
  REJECTED: "अस्वीकृत",
  EXPIRED: "समाप्त",
  ARCHIVED: "संग्रहीत",
};
const registrationStatusLabels: Record<string, string> = {
  PENDING: "लंबित",
  ACTIVE: "सक्रिय",
  INACTIVE: "निष्क्रिय",
  EXPIRED: "समाप्त",
  SUSPENDED: "निलंबित",
  REVOKED: "रद्द",
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-stone-800"><span>{label}</span>{children}</label>;
}

export function KaryakartaForm({
  initialMember,
  canApprove,
}: {
  initialMember: Member | null;
  canApprove: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(initialMember ? memberDraft(initialMember) : emptyDraft);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [qrData, setQrData] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState("");
  const [qrError, setQrError] = useState("");

  function update<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  async function generateNumber() {
    setError("");
    setGenerating(true);
    try {
      const response = await fetch("/api/admin/karyakartas/registration-number", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: draft.state, district: draft.district }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      const data: unknown = await response.json();
      if (typeof data !== "object" || !data || !("registrationNumber" in data) || typeof data.registrationNumber !== "string") {
        throw new Error("पंजीकरण संख्या नहीं बनाई जा सकी।");
      }
      update("registrationNumber", data.registrationNumber);
      setFeedback("पंजीकरण संख्या बना दी गई है।");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "पंजीकरण संख्या नहीं बनाई जा सकी।");
    } finally {
      setGenerating(false);
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      initialMember &&
      draft.registrationNumber.toUpperCase() !== initialMember.regNo.toUpperCase() &&
      !window.confirm("क्या यह पहचान पत्र पुनः जारी करें? पिछला पंजीकरण इतिहास में सुरक्षित रहेगा।")
    ) {
      return;
    }
    if (
      initialMember &&
      ["SUSPENDED", "REVOKED"].includes(draft.registrationStatus) &&
      !initialMember.registrations.some(
        (registration) =>
          registration.registrationNumber === initialMember.regNo &&
          registration.status === draft.registrationStatus,
      ) &&
      !window.confirm(`क्या पंजीकरण स्थिति "${registrationStatusLabels[draft.registrationStatus] ?? draft.registrationStatus}" करें?`)
    ) {
      return;
    }
    setSaving(true);
    setError("");
    setFieldErrors({});
    setFeedback("");
    if (!initialMember && !draft.registrationNumber) {
      setError("सहेजने से पहले पंजीकरण संख्या बनाएँ।");
      setSaving(false);
      return;
    }
    try {
      const payload = {
        ...draft,
        email: draft.email,
        registrationNumber: draft.registrationNumber,
        registrationAdminReason: draft.registrationAdminReason || null,
      };
      const response = await fetch(
        initialMember
          ? `/api/admin/karyakartas/${encodeURIComponent(initialMember.id)}`
          : "/api/admin/karyakartas",
        {
          method: initialMember ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const details = await responseDetails(response);
        setFieldErrors(details.fieldErrors);
        throw new Error(details.message);
      }
      const data: unknown = await response.json();
      if (typeof data !== "object" || !data || !("member" in data) || typeof data.member !== "object" || !data.member || !("id" in data.member) || typeof data.member.id !== "string") {
        throw new Error("जानकारी सहेजी गई, लेकिन सर्वर से मान्य उत्तर नहीं मिला।");
      }
      const memberId = data.member.id;
      if (photo) {
        const form = new FormData();
        form.set("photo", photo);
        const photoResponse = await fetch(`/api/admin/karyakartas/${encodeURIComponent(memberId)}/photo`, { method: "POST", body: form });
        if (!photoResponse.ok) throw new Error(await responseError(photoResponse));
      }
      setFeedback("कार्यकर्ता की जानकारी सफलतापूर्वक सहेजी गई।");
      router.push(`/admin/karyakartas/${encodeURIComponent(memberId)}/edit`);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "कार्यकर्ता की जानकारी सहेजी नहीं जा सकी।");
    } finally {
      setSaving(false);
    }
  }

  async function archive() {
    if (!initialMember || !window.confirm("क्या इस कार्यकर्ता को संग्रहीत करें? पंजीकरण इतिहास सुरक्षित रहेगा।")) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/karyakartas/${encodeURIComponent(initialMember.id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          profileStatus: "ARCHIVED",
          isPublicProfile: false,
          registrationStatus: "INACTIVE",
        }),
      });
      if (!response.ok) throw new Error(await responseError(response));
      router.push("/admin/karyakartas");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "कार्यकर्ता को संग्रहीत नहीं किया जा सका।");
    } finally {
      setSaving(false);
    }
  }

  async function loadQr() {
    if (!initialMember) return;
    setQrError("");
    try {
      const response = await fetch(`/api/admin/karyakartas/${encodeURIComponent(initialMember.id)}/qr`);
      if (!response.ok) throw new Error(await responseError(response));
      const data: unknown = await response.json();
      if (typeof data !== "object" || !data || !("dataUrl" in data) || typeof data.dataUrl !== "string") throw new Error("QR कोड उपलब्ध नहीं है।");
      setQrData(data.dataUrl);
    } catch (cause) {
      setQrError(cause instanceof Error ? cause.message : "QR कोड उपलब्ध नहीं है।");
    }
  }

  return (
    <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
      <form className="space-y-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8" id="karyakarta-form" onSubmit={save}>
        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="text-lg font-bold text-stone-950 sm:col-span-2">कार्यकर्ता प्रोफ़ाइल</h2>
          <Field label="पूरा नाम"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={150} onChange={(e) => update("name", e.target.value)} required value={draft.name} /></Field>
          <Field label="मोबाइल नंबर (निजी)"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={24} onChange={(e) => update("phone", e.target.value)} required value={draft.phone} /></Field>
          <Field label="ईमेल (निजी)"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={254} onChange={(e) => update("email", e.target.value)} type="email" value={draft.email} /></Field>
          <Field label="दायित्व"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={120} onChange={(e) => update("daitva", e.target.value)} required value={draft.daitva} /></Field>
          <Field label="राज्य"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={120} onChange={(e) => update("state", e.target.value)} required value={draft.state} /></Field>
          <Field label="जिला"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={120} onChange={(e) => update("district", e.target.value)} required value={draft.district} /></Field>
          <Field label="तहसील / ब्लॉक"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={120} onChange={(e) => update("tehsil", e.target.value)} value={draft.tehsil} /></Field>
          <Field label="गाँव / शहर"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" maxLength={120} onChange={(e) => update("cityOrVillage", e.target.value)} value={draft.cityOrVillage} /></Field>
          <Field label="संगठन से जुड़ने की तिथि"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("joiningDate", e.target.value)} type="date" value={draft.joiningDate} /></Field>
          <Field label="नियुक्ति आरंभ तिथि"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("appointmentStartDate", e.target.value)} type="date" value={draft.appointmentStartDate} /></Field>
          <Field label="नियुक्ति समाप्ति तिथि"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("appointmentEndDate", e.target.value)} type="date" value={draft.appointmentEndDate} /></Field>
          <Field label="प्रदर्शन क्रम"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" max={9999} min={0} onChange={(e) => update("displayOrder", Number(e.target.value))} type="number" value={draft.displayOrder} /></Field>
          <Field label="प्रोफ़ाइल चित्र (JPG/PNG, अधिकतम 3 MB)"><input accept="image/jpeg,image/png" className="mt-1 block min-h-11 w-full rounded-lg border px-3 py-2" onChange={(e) => { const selected = e.target.files?.[0] ?? null; setPhoto(selected); setPhotoPreview((current) => { if (current) URL.revokeObjectURL(current); return selected ? URL.createObjectURL(selected) : null; }); }} type="file" />{photoPreview ? <Image alt="चयनित प्रोफ़ाइल चित्र का पूर्वावलोकन" className="mt-3 h-20 w-20 rounded-full object-cover" height={80} src={photoPreview} unoptimized width={80} /> : null}</Field>
          <Field label="प्रोफ़ाइल स्थिति"><select className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("profileStatus", e.target.value)} value={draft.profileStatus}>{["DRAFT", "PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "REVOKED", "REJECTED", "EXPIRED", "ARCHIVED"].map((status) => <option disabled={!canApprove && ["ACTIVE", "SUSPENDED", "REVOKED", "REJECTED"].includes(status)} key={status} value={status}>{profileStatusLabels[status]}</option>)}</select></Field>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold"><input checked={draft.isPublicProfile} disabled={draft.profileStatus !== "ACTIVE"} onChange={(e) => update("isPublicProfile", e.target.checked)} type="checkbox" />सार्वजनिक प्रोफ़ाइल (केवल सक्रिय स्थिति में)</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input checked={draft.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} type="checkbox" />भविष्य में चयनित कार्यकर्ता के रूप में उपयोग करें</label>
          <label className="flex items-center gap-2 text-sm font-semibold text-red-800"><input checked={draft.isEmergencyHidden} onChange={(e) => { if (e.target.checked && !window.confirm("यह प्रोफ़ाइल और संबंधित सार्वजनिक पहचान सत्यापन को तुरंत छिपा देगा। जारी रखें?")) return; update("isEmergencyHidden", e.target.checked); }} type="checkbox" />सार्वजनिक निर्देशिका और सत्यापन से तुरंत छिपाएँ</label>
        </section>
        <section className="grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold text-stone-950 sm:col-span-2">सार्वजनिक परिचय और आधिकारिक सोशल लिंक</h2>
          <Field label="संक्षिप्त सार्वजनिक परिचय"><textarea className="mt-1 min-h-24 w-full rounded-lg border px-3 py-2" maxLength={1000} onChange={(e) => update("publicBio", e.target.value)} value={draft.publicBio} /></Field>
          <Field label="Instagram लिंक"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("instagramUrl", e.target.value)} type="url" value={draft.instagramUrl} /></Field>
          <Field label="Facebook लिंक"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("facebookUrl", e.target.value)} type="url" value={draft.facebookUrl} /></Field>
          <Field label="YouTube लिंक"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("youtubeUrl", e.target.value)} type="url" value={draft.youtubeUrl} /></Field>
          <Field label="WhatsApp संपर्क लिंक"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("whatsappContactUrl", e.target.value)} type="url" value={draft.whatsappContactUrl} /></Field>
        </section>
        <section className="grid gap-4 border-t border-stone-100 pt-5 sm:grid-cols-2">
          <h2 className="text-lg font-bold text-stone-950 sm:col-span-2">पंजीकरण / पहचान पत्र</h2>
          <Field label="पंजीकरण संख्या"><input className="mt-1 min-h-11 w-full rounded-lg border px-3 font-mono uppercase" maxLength={50} onChange={(e) => update("registrationNumber", e.target.value.toUpperCase())} required value={draft.registrationNumber} /></Field>
          <div className="flex items-end"><button className="min-h-11 rounded-lg border px-4 text-sm font-semibold disabled:opacity-50" disabled={generating || !draft.state || !draft.district} onClick={generateNumber} type="button">{generating ? "बनाई जा रही है..." : "पंजीकरण संख्या बनाएँ"}</button></div>
          <Field label="सत्यापन स्थिति"><select className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("registrationStatus", e.target.value)} value={draft.registrationStatus}>{["PENDING", "ACTIVE", "INACTIVE", "EXPIRED", "SUSPENDED", "REVOKED"].map((status) => <option disabled={!canApprove && status === "ACTIVE"} key={status} value={status}>{registrationStatusLabels[status]}</option>)}</select></Field>
          <Field label="जारी करने की तिथि"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("issueDate", e.target.value)} type="date" value={draft.issueDate} /></Field>
          <Field label="समाप्ति तिथि"><input className="mt-1 min-h-11 w-full rounded-lg border px-3" onChange={(e) => update("expiryDate", e.target.value)} type="date" value={draft.expiryDate} /></Field>
          {["SUSPENDED", "REVOKED"].includes(draft.registrationStatus) ? <Field label="केवल प्रशासक के लिए निलंबन / रद्दीकरण का कारण"><textarea className="mt-1 min-h-20 w-full rounded-lg border px-3 py-2" maxLength={500} onChange={(e) => update("registrationAdminReason", e.target.value)} required value={draft.registrationAdminReason} /></Field> : null}
          {initialMember?.registrations.length ? <div className="sm:col-span-2"><h3 className="mb-2 text-sm font-semibold text-stone-700">पंजीकरण इतिहास</h3><ul className="space-y-2">{initialMember.registrations.map((registration) => <li className="flex flex-wrap justify-between gap-2 rounded-lg bg-stone-50 p-3 text-xs" key={registration.id}><span className="font-mono">{registration.registrationNumber}</span><span>{registrationStatusLabels[registration.status] ?? registration.status}</span><span>{registration.issueDate ? asDate(registration.issueDate) : "जारी तिथि उपलब्ध नहीं"}{registration.expiryDate ? ` → ${asDate(registration.expiryDate)}` : ""}</span></li>)}</ul></div> : null}
        </section>
        <section className="grid gap-4 border-t border-stone-100 pt-5">
          <h2 className="text-lg font-bold text-stone-950">केवल प्रशासक के लिए टिप्पणी</h2>
          <textarea className="min-h-24 w-full rounded-lg border px-3 py-2" maxLength={2000} onChange={(e) => update("adminNotes", e.target.value)} value={draft.adminNotes} />
        </section>
        {error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
        {Object.entries(fieldErrors).map(([field, message]) => (
          <p className="text-xs text-red-700" key={field}>
            <strong>{fieldLabels[field] ?? "जानकारी"}:</strong> {message}
          </p>
        ))}
        {feedback ? <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900" role="status">{feedback}</p> : null}
        <div className="flex flex-wrap gap-3"><button className="min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:opacity-50" disabled={saving} type="submit">{saving ? "सहेजा जा रहा है..." : "कार्यकर्ता की जानकारी सहेजें"}</button>{initialMember ? <button className="min-h-11 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-800" onClick={archive} type="button">कार्यकर्ता संग्रहीत करें</button> : null}</div>
      </form>
      <aside className="h-fit space-y-5">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-stone-950">पहचान सत्यापन QR</h2>
          <p className="mt-2 text-sm text-stone-600">QR में केवल सार्वजनिक सत्यापन लिंक शामिल है।</p>
          {qrData ? <Image alt="सार्वजनिक पंजीकरण सत्यापन से जुड़ा QR कोड" className="mt-4 h-64 w-64 max-w-full rounded bg-white p-2" height={256} src={qrData} unoptimized width={256} /> : null}
          {qrError ? <p className="mt-3 text-sm text-amber-800">{qrError}</p> : null}
          <button className="mt-4 min-h-10 rounded-lg border px-4 text-sm font-semibold disabled:opacity-50" disabled={!initialMember || draft.profileStatus !== "ACTIVE" || draft.registrationStatus !== "ACTIVE" || draft.isEmergencyHidden} onClick={loadQr} type="button">QR कोड देखें</button>
          {qrData ? <a className="ml-3 text-sm font-semibold text-emerald-900 underline" download={`${draft.registrationNumber}.png`} href={qrData}>डाउनलोड करें</a> : null}
        </section>
        <section className="rounded-2xl border border-stone-200 bg-white p-5 text-sm text-stone-600 shadow-sm">
          <h2 className="font-bold text-stone-950">गोपनीयता स्मरण</h2>
          <p className="mt-2">मोबाइल नंबर, ईमेल और प्रशासक टिप्पणियाँ निजी रहती हैं। सूची में केवल सक्रिय सत्यापित सार्वजनिक प्रोफ़ाइल दिखाई जाती हैं।</p>
        </section>
      </aside>
    </div>
  );
}
