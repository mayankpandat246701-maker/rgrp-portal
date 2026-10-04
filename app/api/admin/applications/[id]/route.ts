import { AdminAuditAction, KaryakartaApplicationStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canViewApplications } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/prisma";

const transitionSchema = z
  .object({
    status: z.enum(["APPROVED", "BLOCKED"]),
    blockReason: z.preprocess(
      (value) =>
        typeof value === "string" && value.trim() === ""
          ? undefined
          : typeof value === "string"
            ? value.trim()
            : value,
      z.string().max(500).optional(),
    ),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.status === "BLOCKED" && !value.blockReason) {
      context.addIssue({
        code: "custom",
        path: ["blockReason"],
        message: "A block reason is required.",
      });
    }
    if (value.status === "APPROVED" && value.blockReason) {
      context.addIssue({
        code: "custom",
        path: ["blockReason"],
        message: "A block reason is only valid when blocking.",
      });
    }
  });

const safeApplicationSelect = {
  id: true,
  applicationReference: true,
  fullName: true,
  fatherName: true,
  motherName: true,
  dateOfBirth: true,
  gender: true,
  category: true,
  mobile: true,
  alternateMobile: true,
  email: true,
  address: true,
  pincode: true,
  district: true,
  state: true,
  constituency: true,
  education: true,
  occupation: true,
  organizationName: true,
  designation: true,
  joiningReason: true,
  socialMediaLinks: true,
  referenceBy: true,
  status: true,
  createdAt: true,
} as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { success: false, error: { message: "अनधिकृत अनुरोध।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!canViewApplications(admin.role)) {
    return Response.json(
      { success: false, error: { message: "इस पृष्ठ की अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;
  const application = await prisma.karyakartaApplication.findUnique({
    where: { id },
    select: safeApplicationSelect,
  });

  if (!application) {
    return Response.json(
      { success: false, error: { message: "आवेदन नहीं मिला।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { success: true, data: application },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { success: false, error: { message: "अनधिकृत अनुरोध।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (admin.role !== "SUPER_ADMIN") {
    return Response.json(
      { success: false, error: { message: "इस कार्रवाई की अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { success: false, error: { message: "अमान्य अनुरोध।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = transitionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { message: "कृपया स्थिति और आवश्यक कारण जाँचें।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;
  const nextStatus =
    parsed.data.status === "APPROVED"
      ? KaryakartaApplicationStatus.APPROVED
      : KaryakartaApplicationStatus.BLOCKED;
  const action =
    parsed.data.status === "APPROVED"
      ? AdminAuditAction.APPLICATION_APPROVED
      : AdminAuditAction.APPLICATION_BLOCKED;

  try {
    const application = await prisma.$transaction(async (transaction) => {
      const transition = await transaction.karyakartaApplication.updateMany({
        where: {
          id,
          status: KaryakartaApplicationStatus.PENDING,
        },
        data: { status: nextStatus },
      });

      if (transition.count !== 1) return null;

      const updatedApplication =
        await transaction.karyakartaApplication.findUnique({
          where: { id },
          select: safeApplicationSelect,
        });
      if (!updatedApplication) return null;

      await transaction.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action,
          applicationId: id,
          ...(parsed.data.status === "BLOCKED"
            ? { metadata: { blockReason: parsed.data.blockReason } }
            : {}),
        },
      });

      return updatedApplication;
    });

    if (!application) {
      const exists = await prisma.karyakartaApplication.findUnique({
        where: { id },
        select: { id: true },
      });
      return Response.json(
        {
          success: false,
          error: {
            message: exists
              ? "यह आवेदन अब लंबित नहीं है।"
              : "आवेदन नहीं मिला।",
          },
        },
        {
          status: exists ? 409 : 404,
          headers: { "Cache-Control": "no-store" },
        },
      );
    }

    return Response.json(
      { success: true, data: application },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(
      JSON.stringify({
        event: "admin_application_transition_failed",
        category: "database_operation",
      }),
    );
    return Response.json(
      { success: false, error: { message: "आवेदन अपडेट नहीं हो सका।" } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
