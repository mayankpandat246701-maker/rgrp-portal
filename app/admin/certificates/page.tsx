import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageCertificates, karyakartaScopeWhere } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "नियुक्ति प्रमाणपत्र" };

const statusLabels: Record<string, string> = {
  ACTIVE: "सक्रिय",
  REVOKED: "रद्द",
  SUPERSEDED: "पुनः जारी",
};

export default async function AdminCertificatesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageCertificates(admin.role)) redirect("/admin/dashboard");
  const certificates = await prisma.joiningCertificate.findMany({
    where: { karyakarta: karyakartaScopeWhere(admin) },
    orderBy: [{ generatedAt: "desc" }, { id: "desc" }],
    take: 100,
    select: {
      id: true,
      certificateNumber: true,
      status: true,
      issueDate: true,
      karyakarta: {
        select: {
          id: true,
          name: true,
          state: true,
          district: true,
        },
      },
    },
  });
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/dashboard">डैशबोर्ड पर लौटें</Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">नियुक्ति प्रमाणपत्र</h1>
      <p className="mt-2 text-sm text-stone-600">प्रमाणपत्र इतिहास और वर्तमान स्थिति देखें। निजी डाउनलोड केवल अधिकृत प्रशासकों के लिए है।</p>
      <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[700px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-stone-600">
            <tr>
              <th className="px-4 py-3">प्रमाणपत्र संख्या</th>
              <th className="px-4 py-3">कार्यकर्ता</th>
              <th className="px-4 py-3">क्षेत्र</th>
              <th className="px-4 py-3">स्थिति</th>
              <th className="px-4 py-3">जारी तिथि</th>
              <th className="px-4 py-3">कार्यवाही</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {certificates.map((certificate) => (
              <tr key={certificate.id}>
                <td className="px-4 py-3 font-mono text-xs">{certificate.certificateNumber}</td>
                <td className="px-4 py-3 font-semibold">{certificate.karyakarta.name}</td>
                <td className="px-4 py-3">{[certificate.karyakarta.district, certificate.karyakarta.state].filter(Boolean).join(", ")}</td>
                <td className="px-4 py-3">{statusLabels[certificate.status] ?? certificate.status}</td>
                <td className="px-4 py-3">{new Intl.DateTimeFormat("hi-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" }).format(certificate.issueDate)}</td>
                <td className="px-4 py-3">
                  <Link className="font-semibold text-emerald-900 underline" href={`/admin/karyakartas/${encodeURIComponent(certificate.karyakarta.id)}/edit`}>कार्यकर्ता देखें</Link>
                  {certificate.status === "ACTIVE" ? <a className="ml-4 font-semibold text-emerald-900 underline" href={`/api/admin/certificates/${encodeURIComponent(certificate.id)}/download`}>PDF डाउनलोड करें</a> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {certificates.length === 0 ? <p className="p-8 text-center text-stone-600">कोई प्रमाणपत्र उपलब्ध नहीं है।</p> : null}
      </div>
    </main>
  );
}
