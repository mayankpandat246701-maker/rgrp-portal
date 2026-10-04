import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KaryakartaApplicationStatus } from "@prisma/client";
import { LogoutButton } from "@/components/admin/logout-button";
import { getCurrentAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Dashboard",
};

export default async function AdminDashboardPage() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const [totalApplications, approved, pending, blocked] = await Promise.all([
    prisma.karyakartaApplication.count(),
    prisma.karyakartaApplication.count({
      where: { status: KaryakartaApplicationStatus.APPROVED },
    }),
    prisma.karyakartaApplication.count({
      where: { status: KaryakartaApplicationStatus.PENDING },
    }),
    prisma.karyakartaApplication.count({
      where: { status: KaryakartaApplicationStatus.BLOCKED },
    }),
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
            भूमिका: {admin.role.replaceAll("_", " ")}
          </p>
        </div>
        <LogoutButton />
      </div>

      <div className="mt-9">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-stone-950">आवेदन स्थिति</h2>
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
                {stat.value.toLocaleString("en-IN")}
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
          <Link
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm ring-1 ring-stone-200 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
            href="/admin/applications"
          >
            <span className="text-base font-bold">आवेदन प्रबंधन</span>
            <span className="ml-2 text-sm font-normal text-emerald-800">
              Review Applications
            </span>
          </Link>
          {admin.role === "SUPER_ADMIN" || admin.role === "CONTENT_ADMIN" ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
              href="/admin/leadership-messages"
            >
              संघ के मुख्य व्यक्ति और उनके संदेश
            </Link>
          ) : null}
          {admin.role === "SUPER_ADMIN" ? (
            <>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/settings/id-card-template"
              >
                ID कार्ड टेम्पलेट सेटिंग
              </Link>
              <Link
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-5 py-2.5 text-sm font-semibold text-emerald-950 ring-1 ring-stone-200 transition hover:bg-emerald-50"
                href="/admin/audit-logs"
              >
                ऑडिट लॉग
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
