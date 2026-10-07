import type { Metadata } from "next";
import Link from "next/link";
import { AdminAuditAction } from "@prisma/client";
import { z } from "zod";
import {
  ADMIN_AUDIT_PAGE_SIZE,
  listSafeAdminAuditLogs,
} from "@/lib/admin-audit-log-view";
import { requireAdmin } from "@/lib/auth/require-admin";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "ऑडिट लॉग",
  robots: { index: false, follow: false },
};

const actionValues = Object.values(AdminAuditAction) as [
  AdminAuditAction,
  ...AdminAuditAction[],
];

const searchSchema = z.object({
  action: z.enum(actionValues).optional(),
  page: z.coerce.number().int().min(1).max(10_000).optional(),
});

const actionLabels: Record<AdminAuditAction, string> = {
  APPLICATION_APPROVED: "आवेदन स्वीकृत",
  APPLICATION_BLOCKED: "आवेदन अस्वीकृत",
  DOCUMENTS_VERIFIED: "दस्तावेज़ सत्यापित",
  DOCUMENTS_REJECTED: "दस्तावेज़ अस्वीकृत",
  ID_CARD_TEMPLATE_UPLOADED: "टेम्पलेट अपलोड",
  QR_GENERATED: "QR तैयार",
  ID_CARD_GENERATED: "पहचान पत्र खोज",
  ID_CARD_DOWNLOADED: "पहचान पत्र डाउनलोड",
};

type PageProps = {
  searchParams: Promise<{ action?: string; page?: string }>;
};

function pageHref(page: number, action?: AdminAuditAction): string {
  const params = new URLSearchParams({ page: String(page) });
  if (action) params.set("action", action);
  return `/admin/audit-logs?${params.toString()}`;
}

export default async function AdminAuditLogsPage({
  searchParams,
}: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/dashboard");

  const rawSearch = await searchParams;
  const parsedSearch = searchSchema.safeParse(rawSearch);
  const action = parsedSearch.success ? parsedSearch.data.action : undefined;
  const page = parsedSearch.success ? (parsedSearch.data.page ?? 1) : 1;
  const { entries, hasMore } = await listSafeAdminAuditLogs({ action, page });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href="/admin/dashboard"
      >
        डैशबोर्ड पर वापस जाएँ
      </Link>
      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-stone-950">
          ऑडिट लॉग
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          नवीनतम {ADMIN_AUDIT_PAGE_SIZE} प्रशासनिक गतिविधियाँ। संवेदनशील
          मेटाडेटा इस सूची में नहीं दिखाया जाता।
        </p>
      </header>

      <form
        className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-stone-200 bg-white p-5"
        method="get"
      >
        <label className="min-w-64">
          <span className="mb-2 block text-sm font-semibold text-stone-800">
            कार्रवाई के अनुसार फ़िल्टर
          </span>
          <select
            className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm"
            defaultValue={action ?? ""}
            name="action"
          >
            <option value="">सभी कार्रवाइयाँ</option>
            {actionValues.map((value) => (
              <option key={value} value={value}>
                {actionLabels[value]}
              </option>
            ))}
          </select>
        </label>
        <button
          className="min-h-11 rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white"
          type="submit"
        >
          फ़िल्टर लागू करें
        </button>
      </form>

      {entries.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[850px] border-collapse text-left text-sm">
            <thead className="bg-stone-50 text-xs text-stone-600">
              <tr>
                <th className="px-5 py-4 font-semibold">समय</th>
                <th className="px-5 py-4 font-semibold">कार्रवाई</th>
                <th className="px-5 py-4 font-semibold">व्यवस्थापक</th>
                <th className="px-5 py-4 font-semibold">आवेदन संदर्भ</th>
                <th className="px-5 py-4 font-semibold">पंजीकरण संख्या</th>
                <th className="px-5 py-4 font-semibold">सुरक्षित सारांश</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap px-5 py-4 text-stone-700">
                    {new Intl.DateTimeFormat("hi-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(entry.createdAt)}
                  </td>
                  <td className="px-5 py-4 font-semibold text-stone-900">
                    {actionLabels[entry.action]}
                  </td>
                  <td className="px-5 py-4 text-stone-700">
                    <span className="block font-medium">{entry.actingAdmin.name}</span>
                    <span className="text-xs text-stone-500">
                      {entry.actingAdmin.email}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-stone-700">
                    {entry.applicationReference ?? "उपलब्ध नहीं"}
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-stone-700">
                    {entry.karyakartaRegNo ?? "उपलब्ध नहीं"}
                  </td>
                  <td className="px-5 py-4 text-stone-700">{entry.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-6 rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">
          इस फ़िल्टर के लिए कोई ऑडिट प्रविष्टि उपलब्ध नहीं है।
        </p>
      )}

      <nav
        aria-label="ऑडिट लॉग पृष्ठ"
        className="mt-5 flex items-center justify-between"
      >
        {page > 1 ? (
          <Link
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800"
            href={pageHref(page - 1, action)}
          >
            पिछला पृष्ठ
          </Link>
        ) : (
          <span />
        )}
        <span className="text-sm text-stone-600">पृष्ठ {page}</span>
        {hasMore ? (
          <Link
            className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-800"
            href={pageHref(page + 1, action)}
          >
            अगला पृष्ठ
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </section>
  );
}
