import { canManageKaryakarta, karyakartaScopeWhere } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { AdminSupportTicketPanel } from "./admin-support-ticket-panel";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Support Tickets | RGRP Admin",
};

export default async function AdminSupportTicketsPage() {
  const admin = await requireAdmin();

  if (!admin) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <p className="font-semibold">Admin login required</p>
        <p className="mt-1 text-sm">
          Support tickets dekhne ke liye admin account se login karein.
        </p>
      </div>
    );
  }

  if (!canManageKaryakarta(admin.role)) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-900">
        <p className="font-semibold">Permission required</p>
        <p className="mt-1 text-sm">
          Aapke paas support tickets manage karne ki permission nahi hai.
        </p>
      </div>
    );
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { karyakarta: karyakartaScopeWhere(admin) },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      category: true,
      subject: true,
      message: true,
      status: true,
      adminResponse: true,
      createdAt: true,
      resolvedAt: true,
      karyakarta: {
        select: {
          id: true,
          name: true,
          regNo: true,
          state: true,
          district: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Karyakarta Support
        </p>
        <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-sm text-slate-600">
          Members ke support requests dekhein, status update karein aur response dein.
        </p>
      </header>

      <AdminSupportTicketPanel initialTickets={tickets} />
    </div>
  );
}
