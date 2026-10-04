import type { Metadata } from "next";
import Link from "next/link";
import { KaryakartaApplicationStatus } from "@prisma/client";
import { redirect } from "next/navigation";
import { ApplicationStatusBadge } from "@/components/admin/application-status-badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canViewApplications } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "आवेदन समीक्षा",
};

type ApplicationsPageProps = {
  searchParams: Promise<{ status?: string }>;
};

const statusOptions = [
  { value: "ALL", label: "सभी" },
  { value: "PENDING", label: "लंबित" },
  { value: "APPROVED", label: "स्वीकृत" },
  { value: "BLOCKED", label: "अस्वीकृत" },
] as const;

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function maskMobile(mobile: string): string {
  return `${"*".repeat(Math.max(0, mobile.length - 4))}${mobile.slice(-4)}`;
}

export default async function AdminApplicationsPage({
  searchParams,
}: ApplicationsPageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canViewApplications(admin.role)) redirect("/admin/dashboard");

  const { status: requestedStatus } = await searchParams;
  const filter = statusOptions.some((option) => option.value === requestedStatus)
    ? requestedStatus!
    : "ALL";
  const where =
    filter === "ALL"
      ? undefined
      : { status: filter as KaryakartaApplicationStatus };

  const applications = await prisma.karyakartaApplication.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      applicationReference: true,
      fullName: true,
      mobile: true,
      district: true,
      state: true,
      status: true,
      createdAt: true,
    },
  });

  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <Link
            className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
            href="/admin/dashboard"
          >
            डैशबोर्ड पर वापस जाएँ
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-stone-950">
            कार्यकर्ता आवेदन प्रबंधन
          </h1>
          <p className="mt-2 text-sm text-stone-600">
            कुल {applications.length.toLocaleString("en-IN")} आवेदन
          </p>
        </div>
        <nav aria-label="आवेदन स्थिति फ़िल्टर" className="no-print flex flex-wrap gap-2">
            {statusOptions.map((option) => (
              <Link
                aria-current={filter === option.value ? "page" : undefined}
                className={`rounded-xl border px-4 py-2.5 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 ${
                  filter === option.value
                    ? "border-emerald-900 bg-emerald-900 text-white"
                    : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
                }`}
                href={
                  option.value === "ALL"
                    ? "/admin/applications"
                    : `/admin/applications?status=${option.value}`
                }
                key={option.value}
              >
                {option.label}
              </Link>
            ))}
        </nav>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
        {applications.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h2 className="text-lg font-bold text-stone-900">
              कोई आवेदन नहीं मिला
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              इस स्थिति के लिए अभी कोई आवेदन उपलब्ध नहीं है।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-stone-50 text-xs tracking-wide text-stone-600 uppercase">
                <tr>
                  <th className="px-5 py-4 font-semibold">आवेदन संदर्भ</th>
                  <th className="px-5 py-4 font-semibold">नाम</th>
                  <th className="px-5 py-4 font-semibold">मोबाइल</th>
                  <th className="px-5 py-4 font-semibold">जिला</th>
                  <th className="px-5 py-4 font-semibold">राज्य</th>
                  <th className="px-5 py-4 font-semibold">स्थिति</th>
                  <th className="px-5 py-4 font-semibold">प्राप्ति समय</th>
                  <th className="px-5 py-4 font-semibold">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {applications.map((application) => (
                  <tr
                    className="transition hover:bg-emerald-50/40"
                    key={application.id}
                  >
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        className="font-semibold text-emerald-900 underline decoration-emerald-200 underline-offset-4 hover:text-emerald-700"
                        href={`/admin/applications/${application.id}`}
                      >
                        {application.applicationReference}
                      </Link>
                    </td>
                    <td className="px-5 py-4 font-medium text-stone-900">
                      {application.fullName}
                    </td>
                    <td
                      className="whitespace-nowrap px-5 py-4 text-stone-700"
                      title="सूची में मोबाइल नंबर सुरक्षित रूप से छिपाया गया है"
                    >
                      {maskMobile(application.mobile)}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {application.district}
                    </td>
                    <td className="px-5 py-4 text-stone-700">
                      {application.state}
                    </td>
                    <td className="px-5 py-4">
                      <ApplicationStatusBadge status={application.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-stone-600">
                      {formatDate(application.createdAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-lg border border-emerald-800 px-3 py-2 text-sm font-bold text-emerald-900 transition hover:bg-emerald-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                        href={`/admin/applications/${application.id}`}
                      >
                        पूर्ण विवरण देखें
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}
