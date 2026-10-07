"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogoutButton } from "@/components/admin/logout-button";

type AdminNavItem = {
  href: string;
  label: string;
  icon: string;
};

type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

const navigation: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [
      {
        href: "/admin/dashboard",
        label: "Dashboard",
        icon: "M3 12l9-9 9 9M5 10v10h14V10",
      },
    ],
  },
  {
    title: "Karyakarta",
    items: [
      {
        href: "/admin/karyakartas",
        label: "Karyakarta",
        icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1",
      },
      {
        href: "/admin/applications",
        label: "Applications",
        icon: "M9 12h6m-6 4h6M9 8h6M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z",
      },
      {
        href: "/admin/id-cards",
        label: "iCards",
        icon: "M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5M9 12h6",
      },
      {
        href: "/admin/certificates",
        label: "Certificates",
        icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
      },
    ],
  },
  {
    title: "Operations",
    items: [
      {
        href: "/admin/support-tickets",
        label: "Support Desk",
        icon: "M8 10h.01M12 10h.01M16 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
      },
      {
        href: "/admin/hamare-karya",
        label: "Hamare Karya",
        icon: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
      },
      {
        href: "/admin/samachar",
        label: "Samachar",
        icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4 4H7m4 4H7",
      },
      {
        href: "/admin/leadership-messages",
        label: "Leadership",
        icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
      },
      {
        href: "/admin/official-links",
        label: "Official Links",
        icon: "M13.828 10.172a4 4 0 010 5.656l-3 3a4 4 0 01-5.656-5.656l1.5-1.5m8.086-3.086l1.5-1.5a4 4 0 015.656 5.656l-3 3",
      },
    ],
  },
  {
    title: "System",
    items: [
      {
        href: "/admin/audit-logs",
        label: "Audit Logs",
        icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
      },
      {
        href: "/admin/management-audit",
        label: "Management Audit",
        icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
      },
      {
        href: "/admin/administrators",
        label: "Administrators",
        icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
      },
      {
        href: "/admin/settings",
        label: "Settings",
        icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
      },
      {
        href: "/admin/site-settings",
        label: "Site Settings",
        icon: "M12 6V4m0 16v-2m0-6a4 4 0 100-8 4 4 0 000 8zm0 0a4 4 0 100 8 4 4 0 000-8z",
      },
    ],
  },
];

export function AdminShell({
  children,
  adminName,
  adminRole,
}: {
  children: React.ReactNode;
  adminName: string;
  adminRole: string;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const currentLabel =
    navigation
      .flatMap((group) => group.items)
      .find(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      )?.label ?? "Admin";

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            R
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">RGRP Admin</p>
            <p className="text-xs text-slate-500">Control Center</p>
          </div>
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {navigation.map((group) => (
            <div key={group.title}>
              <p className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                        active
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                      }`}
                    >
                      <svg
                        className="h-5 w-5 shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.8}
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d={item.icon}
                        />
                      </svg>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">
                {adminName}
              </p>
              <p className="truncate text-xs text-slate-500">{adminRole}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/85 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
              aria-label="Open navigation"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>

            <div>
              <p className="text-xs text-slate-500">RGRP Administration</p>
              <p className="text-sm font-bold text-slate-900">
                {currentLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="hidden rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 sm:block"
            >
              View Website
            </Link>

            <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white sm:flex">
              {adminName.slice(0, 1).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
