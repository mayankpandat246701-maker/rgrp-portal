"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Certificate = {
  id: string;
  certificateNumber: string;
  status: "ACTIVE" | "REVOKED" | "SUPERSEDED";
  issueDate: string;
  generatedAt: string;
  revokedAt: string | null;
};

const statusLabels: Record<Certificate["status"], string> = {
  ACTIVE: "सक्रिय",
  REVOKED: "रद्द",
  SUPERSEDED: "पुनः जारी",
};

function dateLabel(value: string) {
  return new Intl.DateTimeFormat("hi-IN", {
    dateStyle: "medium",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
}

export function JoiningCertificatePanel({
  memberId,
  certificates,
}: {
  memberId: string;
  certificates: Certificate[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const activeCertificate = certificates.some((item) => item.status === "ACTIVE");

  async function issue() {
    if (
      activeCertificate &&
      !window.confirm("नया प्रमाणपत्र जारी करने पर वर्तमान प्रमाणपत्र इतिहास में पुनः जारी के रूप में सुरक्षित होगा। जारी रखें?")
    ) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/karyakartas/${encodeURIComponent(memberId)}/certificates`,
        { method: "POST" },
      );
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "प्रमाणपत्र जारी नहीं किया जा सका।";
        throw new Error(message);
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "प्रमाणपत्र जारी नहीं किया जा सका।");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(certificateId: string) {
    const reason = window.prompt("प्रमाणपत्र रद्द करने का कारण लिखें (5 से 500 अक्षर):");
    if (reason === null) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/certificates/${encodeURIComponent(certificateId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const message =
          typeof body === "object" &&
          body !== null &&
          "error" in body &&
          typeof body.error === "string"
            ? body.error
            : "प्रमाणपत्र रद्द नहीं किया जा सका।";
        throw new Error(message);
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "प्रमाणपत्र रद्द नहीं किया जा सका।");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-stone-950">नियुक्ति प्रमाणपत्र</h2>
          <p className="mt-1 text-sm text-stone-600">सदस्य लॉगिन उपलब्ध होने तक प्रमाणपत्र डाउनलोड केवल अधिकृत प्रशासकों के लिए है।</p>
        </div>
        <button
          className="min-h-11 rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={busy}
          onClick={issue}
          type="button"
        >
          {busy ? "कृपया प्रतीक्षा करें..." : activeCertificate ? "पुनः प्रमाणपत्र जारी करें" : "प्रमाणपत्र जारी करें"}
        </button>
      </div>
      {error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-800" role="alert">{error}</p> : null}
      {certificates.length ? (
        <ul className="mt-5 divide-y divide-stone-100">
          {certificates.map((certificate) => (
            <li className="flex flex-wrap items-center justify-between gap-3 py-4" key={certificate.id}>
              <div>
                <p className="font-mono text-sm font-semibold text-stone-900">{certificate.certificateNumber}</p>
                <p className="mt-1 text-xs text-stone-600">{statusLabels[certificate.status]} · जारी तिथि {dateLabel(certificate.issueDate)}</p>
              </div>
              <div className="flex gap-4 text-sm font-semibold">
                {certificate.status === "ACTIVE" ? (
                  <>
                    <a className="text-emerald-900 underline" href={`/api/admin/certificates/${encodeURIComponent(certificate.id)}/download`}>PDF डाउनलोड करें</a>
                    <button className="text-red-800 underline disabled:opacity-50" disabled={busy} onClick={() => void revoke(certificate.id)} type="button">रद्द करें</button>
                  </>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-5 text-sm text-stone-600">अभी कोई प्रमाणपत्र जारी नहीं हुआ है।</p>
      )}
    </section>
  );
}
