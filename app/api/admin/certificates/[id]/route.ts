import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageCertificates,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageCertificates(admin.role)) {
    return errorResponse("आपको प्रमाणपत्र प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("निरस्तीकरण का कारण सही प्रारूप में भेजें।", 400);
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("reason" in body) ||
    typeof body.reason !== "string"
  ) {
    return errorResponse("निरस्तीकरण का कारण आवश्यक है।", 400);
  }
  const reason = body.reason.trim();
  if (reason.length < 5 || reason.length > 500) {
    return errorResponse("निरस्तीकरण का कारण 5 से 500 अक्षरों में लिखें।", 400);
  }

  try {
    const certificate = await prisma.joiningCertificate.findUnique({
      where: { id },
      select: {
        id: true,
        certificateNumber: true,
        status: true,
        karyakartaId: true,
        karyakarta: { select: { state: true, district: true } },
      },
    });
    if (!certificate) return errorResponse("प्रमाणपत्र उपलब्ध नहीं है।", 404);
    if (
      !hasKaryakartaScope(
        admin,
        certificate.karyakarta.state,
        certificate.karyakarta.district,
      )
    ) {
      return errorResponse("आपको इस प्रमाणपत्र तक पहुँच की अनुमति नहीं है।", 403);
    }
    if (certificate.status !== "ACTIVE") {
      return errorResponse("केवल सक्रिय प्रमाणपत्र रद्द किया जा सकता है।", 409);
    }
    await prisma.$transaction(async (tx) => {
      await tx.joiningCertificate.update({
        where: { id },
        data: { status: "REVOKED", revokedAt: new Date(), revokedReasonAdminOnly: reason },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "JOINING_CERTIFICATE_REVOKED",
          entity: "JoiningCertificate",
          entityId: id,
          metadata: {
            certificateNumber: certificate.certificateNumber,
            state: certificate.karyakarta.state,
            district: certificate.karyakarta.district,
            reason,
          },
        },
      });
    });
    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/karyakartas/${encodeURIComponent(certificate.karyakartaId)}/edit`);
    revalidatePath("/verify-certificate");
    return NextResponse.json(
      { success: true },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Joining certificate revocation failed", {
      route: "/api/admin/certificates/[id]",
      code: "JOINING_CERTIFICATE_REVOKE_FAILED",
    });
    return errorResponse("प्रमाणपत्र रद्द नहीं किया जा सका।", 500);
  }
}
