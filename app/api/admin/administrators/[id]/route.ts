import { AdminRole, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const roleSchema = z.enum(Object.values(AdminRole) as [AdminRole, ...AdminRole[]]);
const accessSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: roleSchema,
  assignedState: z.string().trim().max(120).nullable().optional(),
  assignedDistrict: z.string().trim().max(120).nullable().optional(),
  isActive: z.boolean(),
}).superRefine((value, context) => {
  if (value.role === "STATE_ADMIN" && !value.assignedState?.trim()) {
    context.addIssue({ code: "custom", path: ["assignedState"], message: "State is required for a State Admin." });
  }
  if (value.role === "DISTRICT_ADMIN" && !value.assignedState?.trim()) {
    context.addIssue({ code: "custom", path: ["assignedState"], message: "State is required for a District Admin." });
  }
  if (value.role === "DISTRICT_ADMIN" && !value.assignedDistrict?.trim()) {
    context.addIssue({ code: "custom", path: ["assignedDistrict"], message: "District is required for a District Admin." });
  }
  if (value.role === "STATE_ADMIN" && value.assignedDistrict) {
    context.addIssue({ code: "custom", path: ["assignedDistrict"], message: "District scope is only valid for a District Admin." });
  }
  if (!["STATE_ADMIN", "DISTRICT_ADMIN"].includes(value.role) && (value.assignedState || value.assignedDistrict)) {
    context.addIssue({ code: "custom", path: ["assignedState"], message: "Territory scope is only valid for State and District Admins." });
  }
});

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (admin.role !== "SUPER_ADMIN") return jsonError("Not authorized.", 403);
  const { id } = await context.params;
  if (id === admin.id) return jsonError("You cannot change your own administrator access.", 409);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = accessSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Check the administrator details and territory scope.",
        fieldErrors: Object.fromEntries(
          parsed.error.issues.flatMap((issue) =>
            typeof issue.path[0] === "string"
              ? [[issue.path[0], issue.message]]
              : [],
          ),
        ),
      },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const input = parsed.data;
  const normalized = {
    ...input,
    assignedState: ["STATE_ADMIN", "DISTRICT_ADMIN"].includes(input.role)
      ? input.assignedState?.trim() || null
      : null,
    assignedDistrict: input.role === "DISTRICT_ADMIN"
      ? input.assignedDistrict?.trim() || null
      : null,
  };
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.admin.findUnique({
        where: { id },
        select: { id: true, role: true, assignedState: true, assignedDistrict: true, isActive: true },
      });
      if (!before) return null;
      if (
        before.role === "SUPER_ADMIN" &&
        (!normalized.isActive || normalized.role !== "SUPER_ADMIN")
      ) {
        const activeSuperAdmins = await tx.admin.count({
          where: { role: "SUPER_ADMIN", isActive: true },
        });
        if (activeSuperAdmins <= 1) throw new Error("LAST_ACTIVE_SUPER_ADMIN");
      }
      const result = await tx.admin.update({
        where: { id },
        data: normalized,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          assignedState: true,
          assignedDistrict: true,
          isActive: true,
        },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "ADMIN_ACCESS_UPDATED",
          entity: "Admin",
          entityId: id,
          metadata: {
            before: {
              role: before.role,
              assignedState: before.assignedState,
              assignedDistrict: before.assignedDistrict,
              isActive: before.isActive,
            },
            after: {
              role: result.role,
              assignedState: result.assignedState,
              assignedDistrict: result.assignedDistrict,
              isActive: result.isActive,
            },
          },
        },
      });
      return result;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (!updated) return jsonError("Administrator not found.", 404);
    return NextResponse.json(
      { administrator: updated },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Error && error.message === "LAST_ACTIVE_SUPER_ADMIN") {
      return jsonError("At least one active Super Admin must remain.", 409);
    }
    console.error("Administrator access update failed", {
      route: "/api/admin/administrators/[id]",
      code: "ADMINISTRATOR_ACCESS_UPDATE_FAILED",
    });
    return jsonError("Unable to update administrator access.", 500);
  }
}
