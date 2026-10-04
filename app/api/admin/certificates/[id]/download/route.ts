import { NextResponse } from "next/server";
import { canManageCertificates, hasKaryakartaScope } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isJoiningCertificateEligible } from "@/lib/joining-certificate";
import { readEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageCertificates(admin.role)) {
    return errorResponse("आपको प्रमाणपत्र डाउनलोड करने की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  try {
    const certificate = await prisma.joiningCertificate.findUnique({
      where: { id },
      select: {
        certificateNumber: true,
        status: true,
        fileStorageKey: true,
        karyakarta: {
          select: {
            state: true,
            district: true,
            profileStatus: true,
          },
        },
        registrationCard: {
          select: { status: true, expiryDate: true },
        },
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
    if (
      !isJoiningCertificateEligible({
        profileStatus: certificate.karyakarta.profileStatus,
        registrationStatus: certificate.registrationCard.status,
        registrationExpiryDate: certificate.registrationCard.expiryDate,
      }) ||
      certificate.status !== "ACTIVE"
    ) {
      return errorResponse("यह प्रमाणपत्र वर्तमान में डाउनलोड के लिए मान्य नहीं है।", 409);
    }
    const pdf = await readEncryptedPrivateFile(certificate.fileStorageKey);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${certificate.certificateNumber}.pdf"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("Joining certificate download failed", {
      route: "/api/admin/certificates/[id]/download",
      code: "JOINING_CERTIFICATE_DOWNLOAD_FAILED",
    });
    return errorResponse("प्रमाणपत्र डाउनलोड नहीं किया जा सका।", 500);
  }
}
