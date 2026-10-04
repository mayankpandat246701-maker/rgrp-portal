import bcrypt from "bcryptjs";
import { AdminRole, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const roleSchema = z.enum(Object.values(AdminRole) as [AdminRole, ...AdminRole[]]);
const accessSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  role: roleSchema,
  assignedState: z.string().trim().max(120).nullable().optional(),
  assignedDistrict: z.string().trim().max(120).nullable().optional(),
  isActive: z.boolean(),
});
const createSchema = accessSchema.extend({
  password: z.string().min(12).max(1024),
}).superRefine(validateScope);

function validateScope(
  value: z.infer<typeof accessSchema>,
  context: z.RefinementCtx,
) {
  if (value.role === "STATE_ADMIN" && !value.assignedState?.trim()) {
    context.addIssue({ code: "custom", path: ["assignedState"], message: "State is required for a State Admin." });
  }
  if (value.role === "DISTRICT_ADMIN") {
    if (!value.assignedState?.trim()) {
      context.addIssue({ code: "custom", path: ["assignedState"], message: "State is required for a District Admin." });
    }
    if (!value.assignedDistrict?.trim()) {
      context.addIssue({ code: "custom", path: ["assignedDistrict"], message: "District is required for a District Admin." });
    }
  }
  if (value.role !== "STATE_ADMIN" && value.role !== "DISTRICT_ADMIN" && (value.assignedState || value.assignedDistrict)) {
    context.addIssue({ code: "custom", path: ["assignedState"], message: "Territory scope is only valid for State and District Admins." });
  }
  if (value.role === "STATE_ADMIN" && value.assignedDistrict) {
    context.addIssue({ code: "custom", path: ["assignedDistrict"], message: "District scope is only valid for a District Admin." });
  }
}

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function requireSuperAdmin(role: AdminRole) {
  return role === "SUPER_ADMIN";
}

function parsedScope<T extends z.infer<typeof accessSchema>>(value: T) {
  return {
    ...value,
    assignedState: value.role === "STATE_ADMIN" || value.role === "DISTRICT_ADMIN"
      ? value.assignedState?.trim() || null
      : null,
    assignedDistrict: value.role === "DISTRICT_ADMIN"
      ? value.assignedDistrict?.trim() || null
      : null,
  };
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!requireSuperAdmin(admin.role)) return jsonError("Not authorized.", 403);
  try {
    const administrators = await prisma.admin.findMany({
      orderBy: [{ role: "asc" }, { name: "asc" }],
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
    return NextResponse.json({ administrators }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Administrator list failed", {
      route: "/api/admin/administrators",
      code: "ADMINISTRATOR_LIST_FAILED",
    });
    return jsonError("Unable to load administrators.", 500);
  }
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!requireSuperAdmin(admin.role)) return jsonError("Not authorized.", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = createSchema.safeParse(body);
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
  try {
    const { password, ...access } = parsed.data;
    const user = parsedScope(access);
    const passwordHash = await bcrypt.hash(password, 12);
    const created = await prisma.$transaction(async (tx) => {
      const createdAdmin = await tx.admin.create({
        data: { ...user, passwordHash },
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
          action: "ADMIN_CREATED",
          entity: "Admin",
          entityId: createdAdmin.id,
          metadata: {
            after: {
              role: createdAdmin.role,
              assignedState: createdAdmin.assignedState,
              assignedDistrict: createdAdmin.assignedDistrict,
              isActive: createdAdmin.isActive,
            },
          },
        },
      });
      return createdAdmin;
    });
    return NextResponse.json(
      { administrator: created },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return jsonError("An administrator with this email already exists.", 409);
    }
    console.error("Administrator creation failed", {
      route: "/api/admin/administrators",
      code: "ADMINISTRATOR_CREATE_FAILED",
    });
    return jsonError("Unable to create this administrator.", 500);
  }
}
