import { AdminAuditAction, UploadStatus } from "@prisma/client";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const decisionSchema = z
  .object({
    status: z.enum(["VERIFIED", "REJECTED"]),
    reason: z.preprocess(
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
    if (value.status === "REJECTED" && !value.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A rejection reason is required.",
      });
    }
    if (value.status === "VERIFIED" && value.reason) {
      context.addIssue({
        code: "custom",
        path: ["reason"],
        message: "A reason is only accepted for a rejection.",
      });
    }
  });

type RouteContext = {
  params: Promise<{ id: string }>;
};

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
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { success: false, error: { message: "कृपया निर्णय और आवश्यक कारण जाँचें।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id } = await context.params;
  try {
    const result = await prisma.$transaction(async (transaction) => {
      const current = await transaction.karyakartaApplication.findUnique({
        where: { id },
        select: { photoPath: true, aadhaarPath: true },
      });
      if (!current) return "not_found" as const;
      if (!current.photoPath || !current.aadhaarPath) {
        return "documents_missing" as const;
      }

      const status =
        parsed.data.status === "VERIFIED"
          ? UploadStatus.VERIFIED
          : UploadStatus.REJECTED;
      const updated = await transaction.karyakartaApplication.updateMany({
        where: { id, uploadStatus: UploadStatus.PENDING },
        data: {
          uploadStatus: status,
          documentReviewReason:
            parsed.data.status === "REJECTED" ? parsed.data.reason : null,
          verifiedByAdminId:
            parsed.data.status === "VERIFIED" ? admin.id : null,
          verifiedAt:
            parsed.data.status === "VERIFIED" ? new Date() : null,
        },
      });
      if (updated.count !== 1) return "already_reviewed" as const;

      await transaction.adminAuditLog.create({
        data: {
          adminId: admin.id,
          applicationId: id,
          action:
            parsed.data.status === "VERIFIED"
              ? AdminAuditAction.DOCUMENTS_VERIFIED
              : AdminAuditAction.DOCUMENTS_REJECTED,
          ...(parsed.data.status === "REJECTED"
            ? { metadata: { reason: parsed.data.reason } }
            : {}),
        },
      });
      return "updated" as const;
    });

    if (result !== "updated") {
      const status = result === "not_found" ? 404 : result === "documents_missing" ? 409 : 409;
      return Response.json(
        {
          success: false,
          error: {
            message:
              result === "not_found"
                ? "आवेदन नहीं मिला।"
                : result === "documents_missing"
                  ? "दोनों दस्तावेज़ अपलोड होने के बाद ही समीक्षा करें।"
                  : "दस्तावेज़ पहले ही जाँचे जा चुके हैं।",
          },
        },
        { status, headers: { "Cache-Control": "no-store" } },
      );
    }

    return Response.json(
      {
        success: true,
        data: {
          status: parsed.data.status,
          decisionAt: new Date().toISOString(),
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(
      JSON.stringify({
        event: "admin_document_review_failed",
        category: "database_operation",
      }),
    );
    return Response.json(
      { success: false, error: { message: "दस्तावेज़ की स्थिति सहेजी नहीं जा सकी।" } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
