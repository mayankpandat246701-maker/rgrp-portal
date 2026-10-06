import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KaryakartaApplicationStatus } from "@prisma/client";
import { LogoutButton } from "@/components/admin/logout-button";
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
  title: "प्रशासक डैशबोर्ड",
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
  const [totalApplications, approved, pending, blocked] = await Promise.all([
    canViewApplications(admin.role) ? prisma.karyakartaApplication.count() : Promise.resolve(0),
    canViewApplications(admin.role) ? prisma.karyakartaApplication.count({
      where: { status: KaryakartaApplicationStatus.APPROVED },
    }) : Promise.resolve(0),
    canViewApplications(admin.role) ? prisma.karyakartaApplication.count({
      where: { status: KaryakartaApplicationStatus.PENDING },
    }) : Promise.resolve(0),
    canViewApplications(admin.role) ? prisma.karyakartaApplication.count({
      where: { status: KaryakartaApplicationStatus.BLOCKED },
    }) : Promise.resolve(0),
  ]);

  const [
    activeKaryakartas,
    pendingKaryakartas,
    homepageLeaders,
    expiring30,
    expiring60,
    expired,
    suspendedRevoked,
    officialLinks,
    newsDrafts,
    groundWorkDrafts,
    certificates,
    stateCounts,
    districtCounts,
    recentActivity,
  ] = await Promise.all([
    prisma.karyakarta.count({ where: { ...scope, profileStatus: "ACTIVE" } }),
    prisma.karyakarta.count({ where: { ...scope, profileStatus: "PENDING" } }),
    prisma.leadershipMessage.count({ where: { isPublished: true, showOnHomepage: true } }),
    prisma.registrationCard.count({ where: { status: "ACTIVE", expiryDate: { gte: now, lte: in30Days }, karyakarta: scope } }),
    prisma.registrationCard.count({ where: { status: "ACTIVE", expiryDate: { gt: in30Days, lte: in60Days }, karyakarta: scope } }),
    prisma.registrationCard.count({ where: { OR: [{ status: "EXPIRED" }, { status: "ACTIVE", expiryDate: { lt: now } }], karyakarta: scope } }),
    prisma.registrationCard.count({ where: { status: { in: ["SUSPENDED", "REVOKED"] }, karyakarta: scope } }),
    canManageOfficialLinks(admin.role) ? prisma.officialSocialLink.count({ where: officialLinkManagementWhere(admin) }) : Promise.resolve(0),
    canManageEditorialContent(admin.role) ? prisma.newsPost.count({ where: { ...editorialScope, isPublished: false, archivedAt: null } }) : Promise.resolve(0),
    canManageEditorialContent(admin.role) ? prisma.groundActivity.count({ where: { ...editorialScope, isPublished: false, archivedAt: null } }) : Promise.resolve(0),
    canManageCertificates(admin.role) ? prisma.joiningCertificate.count({ where: { status: "ACTIVE", karyakarta: scope } }) : Promise.resolve(0),
    prisma.karyakarta.groupBy({ by: ["state"], where: { ...scope, profileStatus: "ACTIVE", state: { not: null } }, _count: { _all: true }, orderBy: { state: "asc" } }),
    prisma.karyakarta.groupBy({ by: ["state", "district"], where: { ...scope, profileStatus: "ACTIVE", state: { not: null }, district: { not: null } }, _count: { _all: true }, orderBy: [{ state: "asc" }, { district: "asc" }] }),
    prisma.adminActivity.findMany({ orderBy: { createdAt: "desc" }, take: 5, select: { id: true, action: true, entity: true, createdAt: true } }),
  ]);

  const stats = [
    {
      label: "कुल आवेदन",
      value: totalApplications,
      accentClassName: "bg-emerald-600",
    },
    { label: "स्वीकृत", value: approved, accentClassName: "bg-blue-600" },
    { label: "लंबित", value: pending, accentClassName: "bg-orange-600" },
    { label: "अवरुद्ध", value: blocked, accentClassName: "bg-red-600" },
    { label: "सक्रिय कार्यकर्ता", value: activeKaryakartas, accentClassName: "bg-emerald-600" },
    { label: "लंबित कार्यकर्ता", value: pendingKaryakartas, accentClassName: "bg-orange-600" },
    { label: "अगले 30 दिनों में समाप्त", value: expiring30, accentClassName: "bg-amber-500" },
    { label: "अगले 31–60 दिनों में समाप्त", value: expiring60, accentClassName: "bg-yellow-500" },
    { label: "समाप्त पंजीकरण", value: expired, accentClassName: "bg-stone-500" },
    { label: "निलंबित / रद्द पंजीकरण", value: suspendedRevoked, accentClassName: "bg-red-600" },
    { label: "होमपेज के मुख्य व्यक्ति", value: homepageLeaders, accentClassName: "bg-blue-600" },
    ...(canManageOfficialLinks(admin.role) ? [{ label: "आधिकारिक लिंक", value: officialLinks, accentClassName: "bg-teal-600" }] : []),
    ...(canManageEditorialContent(admin.role) ? [
      { label: "समाचार प्रारूप", value: newsDrafts, accentClassName: "bg-blue-600" },
      { label: "जमीनी कार्य प्रारूप", value: groundWorkDrafts, accentClassName: "bg-orange-600" },
    ] : []),
    ...(canManageCertificates(admin.role) ? [{ label: "सक्रिय नियुक्ति प्रमाणपत्र", value: certificates, accentClassName: "bg-emerald-600" }] : []),
  ];

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="flex flex-col justify-between gap-6 rounded-3xl bg-emerald-950 p-7 text-white shadow-xl shadow-emerald-950/10 sm:p-10 md:flex-row md:items-center">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-orange-200 uppercase">
            RGRP प्रशासन
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            स्वागत है, {admin.name}
          </h1>
          <p className="mt-3 text-sm text-emerald-100/80">{admin.email}</p>
          <p className="mt-1 text-xs font-semibold tracking-wide text-emerald-100/65">
            भूमिका: {{
              SUPER_ADMIN: "मुख्य प्रशासक",
              NATIONAL_ADMIN: "राष्ट्रीय प्रशासक",
              STATE_ADMIN: "राज्य प्रशासक",
              DISTRICT_ADMIN: "जिला प्रशासक",
              CONTENT_ADMIN: "सामग्री प्रशासक",
              CONTENT_EDITOR: "सामग्री संपादक",
              VIEWER: "दर्शक",
            }[admin.role]}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-9">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-stone-950">{canViewApplications(admin.role) ? "आवेदन और पोर्टल स्थिति" : "पोर्टल स्थिति"}</h2>
          <p className="mt-1 text-sm text-stone-600">
            स्थिति के अनुसार कुल आवेदन संख्या
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <article
              className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm"
              key={stat.label}
            >
              <p className="text-sm font-semibold text-stone-600">
                {stat.label}
              </p>
              <p className="mt-4 text-4xl font-bold tracking-tight text-stone-950">
                {stat.value.toLocaleString("hi-IN")}
              </p>
              <div
                aria-hidden="true"
                className={`mt-5 h-1 w-12 rounded-full ${stat.accentClassName}`}
              />
            </article>
          ))}
        </div>
      </div>
      <div className="mt-8">
        <div className="flex flex-wrap gap-3">
          {canViewApplications(admin.role) ? <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-stone-200 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            href="/admin/applications"
          >
            <span className="text-base font-bold">आवेदन प्रबंधन</span>
            <span className="ml-2 text-sm font-normal text-emerald-800">
              आवेदनों की समीक्षा करें
            </span>
          </Link> : null}
          {canManageKaryakarta(admin.role) ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/karyakartas"
              >
                कार्यकर्ता प्रबंधन
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/karyakartas/new"
              >
                नया कार्यकर्ता जोड़ें
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/id-cards"
              >
                पहचान पत्र बनाएँ
              </Link>
            </>
          ) : null}
          {canManageOfficialLinks(admin.role) ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
              href="/admin/official-links"
            >
              आधिकारिक लिंक
            </Link>
          ) : null}
          {canManageEditorialContent(admin.role) ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/samachar"
              >
                समाचार प्रबंधन
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/hamare-karya"
              >
                जमीनी कार्य प्रबंधन
              </Link>
            </>
          ) : null}
          {canManageCertificates(admin.role) ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
              href="/admin/certificates"
            >
              नियुक्ति प्रमाणपत्र
            </Link>
          ) : null}
          {canManageLeadership(admin.role) ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
              href="/admin/leadership-messages"
            >
              मुख्य व्यक्ति प्रबंधन
            </Link>
          ) : null}
          {admin.role === "SUPER_ADMIN" || admin.role === "NATIONAL_ADMIN" ? (
            <>
              {admin.role === "SUPER_ADMIN" ? <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/settings/id-card-template"
              >
                पहचान पत्र टेम्पलेट सेटिंग
              </Link> : null}
              {admin.role === "SUPER_ADMIN" ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/site-settings"
              >
                वेबसाइट सेटिंग्स
              </Link>
              ) : null}
              {admin.role === "SUPER_ADMIN" ? (
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/audit-logs"
              >
                ऑडिट लॉग
              </Link>
              ) : null}
              {admin.role === "SUPER_ADMIN" ? (
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                  href="/admin/administrators"
                >
                  प्रशासक भूमिकाएँ और क्षेत्र
                </Link>
              ) : null}
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/management-audit"
              >
                प्रबंधन ऑडिट
              </Link>
            </>
          ) : null}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-950">सक्रिय कार्यकर्ता — राज्य अनुसार</h2>
            <ul className="mt-4 space-y-2 text-sm">{stateCounts.map((row) => <li className="flex justify-between border-b border-stone-100 pb-2" key={row.state ?? "unknown"}><span>{row.state ?? "आवंटित नहीं"}</span><strong>{row._count._all.toLocaleString("hi-IN")}</strong></li>)}</ul>
            <h3 className="mt-5 font-semibold text-stone-800">जिला अनुसार</h3>
            <ul className="mt-3 max-h-64 space-y-2 overflow-auto text-sm">{districtCounts.map((row) => <li className="flex justify-between border-b border-stone-100 pb-2" key={`${row.state}-${row.district}`}><span>{[row.district, row.state].filter(Boolean).join(", ")}</span><strong>{row._count._all.toLocaleString("hi-IN")}</strong></li>)}</ul>
          </section>
          <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-stone-950">हाल की गतिविधि</h2>
            {recentActivity.length ? <ul className="mt-4 space-y-3">{recentActivity.map((activity) => <li className="flex flex-col justify-between gap-1 border-b border-stone-100 pb-3 text-sm sm:flex-row" key={activity.id}><span className="font-semibold">प्रशासनिक गतिविधि</span><time className="text-xs text-stone-500" dateTime={activity.createdAt.toISOString()}>{new Intl.DateTimeFormat("hi-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(activity.createdAt)}</time></li>)}</ul> : <p className="mt-4 text-sm text-stone-600">हाल की कोई गतिविधि उपलब्ध नहीं है।</p>}
          </section>
        </div>
      </div>
    </section>
  );
}
