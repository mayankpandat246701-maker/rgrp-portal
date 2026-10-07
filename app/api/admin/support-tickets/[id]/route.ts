import { NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageKaryakarta,
  karyakartaScopeWhere,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  status: z.enum(["OPEN", "IN_REVIEW", "RESOLVED", "REJECTED"]),
  adminResponse: z.string().trim().max(2000).optional(),
});

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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
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

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid request." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "Invalid status or response." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const existingTicket = await prisma.supportTicket.findFirst({
    where: {
      id,
      karyakarta: karyakartaScopeWhere(admin),
    },
    select: { id: true },
  });

  if (!existingTicket) {
    return NextResponse.json(
      { success: false, error: { message: "Support ticket not found." } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const ticket = await prisma.supportTicket.update({
    where: { id },
    data: {
      status: parsed.data.status,
      adminResponse: parsed.data.adminResponse ?? null,
      resolvedAt:
        parsed.data.status === "RESOLVED" || parsed.data.status === "REJECTED"
          ? new Date()
          : null,
    },
    select: {
      id: true,
      status: true,
      adminResponse: true,
      resolvedAt: true,
    },
  });

  return NextResponse.json(
    { success: true, data: { ticket } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
