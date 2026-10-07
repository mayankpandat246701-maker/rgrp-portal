import { NextResponse } from "next/server";
import {
  canManageKaryakarta,
  karyakartaScopeWhere,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: { message: "Admin login required." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!canManageKaryakarta(admin.role)) {
    return NextResponse.json(
      { success: false, error: { message: "You do not have permission to manage support tickets." } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
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

  return NextResponse.json(
    { success: true, data: { tickets } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
