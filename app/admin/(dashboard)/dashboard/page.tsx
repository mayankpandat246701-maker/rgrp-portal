import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KaryakartaApplicationStatus } from "@prisma/client";
import {
  canManageCertificates,
  canManageEditorialContent,
  canManageKaryakarta,
  canManageLeadership,
  canManageOfficialLinks,
  canViewApplications,
  karyakartaScopeWhere,
  officialLinkManagementWhere,
} from "@/lib/auth/admin-permissions";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "प्रशासक डैशबोर्ड | RGRP",
};

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "मुख्य प्रशासक",
  NATIONAL_ADMIN: "राष्ट्रीय प्रशासक",
  STATE_ADMIN: "राज्य प्रशासक",
  DISTRICT_ADMIN: "जिला प्रशासक",
  CONTENT_ADMIN: "सामग्री प्रशासक",
  CONTENT_EDITOR: "सामग्री संपादक",
  VIEWER: "दर्शक",
};

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const scope = karyakartaScopeWhere(admin);
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const editorialScope =
    admin.role === "STATE_ADMIN" || admin.role === "DISTRICT_ADMIN"
      ? scope
      : {};

  const [
    totalApplications,
    approved,
    pending,
    blocked,
    activeKaryakartas,
    pendingKaryakartas,
    expiring30,
    expiring60,
    expired,
    suspendedRevoked,
    openTickets,
    certificates,
    stateCounts,
    districtCounts,
    recentActivity,
  ] = await Promise.all([
    canViewApplications(admin.role)
      ? prisma.karyakartaApplication.count()
      : Promise.resolve(0),
    canViewApplications(admin.role)
      ? prisma.karyakartaApplication.count({
          where: { status: KaryakartaApplicationStatus.APPROVED },
        })
      : Promise.resolve(0),
    canViewApplications(admin.role)
      ? prisma.karyakartaApplication.count({
          where: { status: KaryakartaApplicationStatus.PENDING },
        })
      : Promise.resolve(0),
    canViewApplications(admin.role)
      ? prisma.karyakartaApplication.count({
          where: { status: KaryakartaApplicationStatus.BLOCKED },
        })
      : Promise.resolve(0),
    prisma.karyakarta.count({
      where: { ...scope, profileStatus: "ACTIVE" },
    }),
    prisma.karyakarta.count({
      where: { ...scope, profileStatus: "PENDING" },
    }),
    prisma.registrationCard.count({
      where: {
        status: "ACTIVE",
        expiryDate: { gte: now, lte: in30Days },
        karyakarta: scope,
      },
    }),
    prisma.registrationCard.count({
      where: {
        status: "ACTIVE",
        expiryDate: { gt: in30Days, lte: in60Days },
        karyakarta: scope,
      },
    }),
    prisma.registrationCard.count({
      where: {
        OR: [
          { status: "EXPIRED" },
          { status: "ACTIVE", expiryDate: { lt: now } },
        ],
        karyakarta: scope,
      },
    }),
    prisma.registrationCard.count({
      where: {
        status: { in: ["SUSPENDED", "REVOKED"] },
        karyakarta: scope,
      },
    }),
    prisma.supportTicket.count({
      where: { status: "OPEN", karyakarta: scope },
    }),
    canManageCertificates(admin.role)
      ? prisma.joiningCertificate.count({
          where: { status: "ACTIVE", karyakarta: scope },
        })
      : Promise.resolve(0),
    prisma.karyakarta.groupBy({
      by: ["state"],
      where: {
        ...scope,
        profileStatus: "ACTIVE",
        state: { not: null },
      },
      _count: { _all: true },
      orderBy: { state: "asc" },
    }),
    prisma.karyakarta.groupBy({
      by: ["state", "district"],
      where: {
        ...scope,
        profileStatus: "ACTIVE",
        state: { not: null },
        district: { not: null },
      },
      _count: { _all: true },
      orderBy: [{ state: "asc" }, { district: "asc" }],
    }),
    prisma.adminActivity.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
      },
    }),
  ]);

  const priorityStats = [
    {
      label: "सक्रिय कार्यकर्ता",
      value: activeKaryakartas,
      href: "/admin/karyakartas",
      accent: "from-emerald-500 to-teal-600",
    },
    {
      label: "लंबित आवेदन",
      value: pending,
      href: "/admin/applications",
      accent: "from-amber-500 to-orange-600",
    },
    {
      label: "Open Support Tickets",
      value: openTickets,
      href: "/admin/support-tickets",
      accent: "from-blue-500 to-indigo-600",
    },
    {
      label: "30 दिनों में समाप्त",
      value: expiring30,
      href: "/admin/karyakartas",
      accent: "from-rose-500 to-red-600",
    },
  ];

  const secondaryStats = [
    { label: "कुल आवेदन", value: totalApplications },
    { label: "स्वीकृत आवेदन", value: approved },
    { label: "अवरुद्ध आवेदन", value: blocked },
    { label: "लंबित कार्यकर्ता", value: pendingKaryakartas },
    { label: "31–60 दिनों में समाप्त", value: expiring60 },
    { label: "समाप्त पंजीकरण", value: expired },
    { label: "निलंबित / रद्द", value: suspendedRevoked },
    { label: "सक्रिय नियुक्ति पत्र", value: certificates },
  ];

  const quickActions = [
    canViewApplications(admin.role)
      ? { href: "/admin/applications", label: "आवेदन समीक्षा" }
      : null,
    canManageKaryakarta(admin.role)
      ? { href: "/admin/karyakartas/new", label: "नया कार्यकर्ता" }
      : null,
    canManageKaryakarta(admin.role)
      ? { href: "/admin/id-cards", label: "iCard बनाएँ" }
      : null,
    canManageCertificates(admin.role)
      ? { href: "/admin/certificates", label: "नियुक्ति पत्र" }
      : null,
    canManageEditorialContent(admin.role)
      ? { href: "/admin/samachar/new", label: "नया समाचार" }
      : null,
    canManageEditorialContent(admin.role)
      ? { href: "/admin/hamare-karya/new", label: "नया कार्य जोड़ें" }
      : null,
  ].filter(Boolean) as Array<{ href: string; label: string }>;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-300">
              RGRP Administration
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              स्वागत है, {admin.name}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {roleLabels[admin.role] ?? admin.role} • {admin.email}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/applications"
              className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
            >
              आवेदन देखें
            </Link>
            <Link
              href="/admin/support-tickets"
              className="rounded-xl border border-white/25 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Support Desk
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {priorityStats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div
              className={`mb-4 h-1.5 w-14 rounded-full bg-gradient-to-r ${stat.accent}`}
            />
            <p className="text-sm font-semibold text-slate-600">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {stat.value.toLocaleString("hi-IN")}
            </p>
            <p className="mt-3 text-xs font-semibold text-indigo-600 opacity-0 transition group-hover:opacity-100">
              देखें →
            </p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-900">Action Center</h2>
          <p className="mt-1 text-sm text-slate-600">
            जिन कार्यों पर तुरंत ध्यान देना है।
          </p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <ActionCard
              title="लंबित आवेदन"
              value={pending}
              description="नए आवेदनों की समीक्षा करें"
              href="/admin/applications"
            />
            <ActionCard
              title="Open Tickets"
              value={openTickets}
              description="सदस्य support requests का निपटारा करें"
              href="/admin/support-tickets"
            />
            <ActionCard
              title="30 दिनों में समाप्त"
              value={expiring30}
              description="रजिस्ट्रेशन रिन्यूअल याद दिलाएँ"
              href="/admin/karyakartas"
            />
            <ActionCard
              title="समाप्त पंजीकरण"
              value={expired}
              description="समाप्त registrations की समीक्षा करें"
              href="/admin/karyakartas"
            />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">Quick Actions</h2>
          <div className="mt-4 space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                {action.label}
                <span className="text-slate-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {secondaryStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-xs font-semibold text-slate-500">
              {stat.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-900">
              {stat.value.toLocaleString("hi-IN")}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            राज्य अनुसार सक्रिय कार्यकर्ता
          </h2>

          <div className="mt-4 max-h-72 space-y-2 overflow-y-auto">
            {stateCounts.length ? (
              stateCounts.map((row) => (
                <div
                  key={row.state ?? "unknown"}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="font-medium text-slate-700">
                    {row.state ?? "अनुपलब्ध"}
                  </span>
                  <span className="font-bold text-slate-900">
                    {row._count._all.toLocaleString("hi-IN")}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">कोई डेटा उपलब्ध नहीं है।</p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900">
            हाल की गतिविधि
          </h2>

          <div className="mt-4 space-y-3">
            {recentActivity.length ? (
              recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {activity.action}
                    </p>
                    <p className="text-xs text-slate-500">{activity.entity}</p>
                  </div>
                  <time
                    className="whitespace-nowrap text-xs text-slate-500"
                    dateTime={activity.createdAt.toISOString()}
                  >
                    {new Intl.DateTimeFormat("hi-IN", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Asia/Kolkata",
                    }).format(activity.createdAt)}
                  </time>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                हाल की कोई गतिविधि उपलब्ध नहीं है।
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function ActionCard({
  title,
  value,
  description,
  href,
}: {
  title: string;
  value: number;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:bg-indigo-50/40"
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">
        {value.toLocaleString("hi-IN")}
      </p>
      <p className="mt-1 text-xs text-slate-600">{description}</p>
    </Link>
  );
}