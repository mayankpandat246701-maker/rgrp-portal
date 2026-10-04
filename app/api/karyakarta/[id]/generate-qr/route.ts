import { AdminAuditAction, KaryakartaApplicationStatus, UploadStatus } from "@prisma/client";
import QRCode from "qrcode";
import { SignJWT } from "jose";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  deletePrivateFile,
  isPrivateStorageAvailable,
  savePrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function getQrSigningSecret(): Uint8Array {
  const secret =
    process.env.QR_SIGNING_SECRET ??
    (process.env.NODE_ENV !== "production" ? process.env.AUTH_SECRET : undefined);
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("QR signing is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export async function POST(_request: Request, context: RouteContext) {
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
  if (!isPrivateStorageAvailable()) {
    return Response.json(
      {
        success: false,
        error: {
          message: "यह सेवा अभी उपलब्ध नहीं है। कृपया प्रशासक से संपर्क करें।",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
          "Retry-After": "60",
        },
      },
    );
  }

  const { id } = await context.params;
  if (!/^[a-z0-9]+$/i.test(id)) {
    return Response.json(
      { success: false, error: { message: "आवेदन नहीं मिला।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  const application = await prisma.karyakartaApplication.findUnique({
    where: { id },
    select: {
      applicationReference: true,
      fullName: true,
      status: true,
      uploadStatus: true,
      photoPath: true,
      aadhaarPath: true,
      verifiedAt: true,
    },
  });
  if (!application) {
    return Response.json(
      { success: false, error: { message: "आवेदन नहीं मिला।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (
    application.status !== KaryakartaApplicationStatus.APPROVED ||
    application.uploadStatus !== UploadStatus.VERIFIED ||
    !application.photoPath ||
    !application.aadhaarPath ||
    !application.verifiedAt
  ) {
    return Response.json(
      {
        success: false,
        error: {
          message: "स्वीकृत आवेदन और सत्यापित दस्तावेज़ आवश्यक हैं।",
        },
      },
      { status: 409, headers: { "Cache-Control": "no-store" } },
    );
  }

  const verificationTimestamp = application.verifiedAt.toISOString();
  const token = await new SignJWT({
    applicationReference: application.applicationReference,
    name: application.fullName,
    status: application.status,
    verificationTimestamp,
    tokenType: "rgrp-application-verification",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("rgrp-portal")
    .setAudience("rgrp-qr-verification")
    .sign(getQrSigningSecret());

  const qrImage = await QRCode.toBuffer(token, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    width: 512,
  });
  const qrCodePath = `qr/${id}.png`;
  try {
    await deletePrivateFile(qrCodePath);
    await savePrivateFile(qrCodePath, qrImage);
    await prisma.$transaction(async (transaction) => {
      await transaction.karyakartaApplication.update({
        where: { id },
        data: {
          qrCodePath,
          idCardGeneratedAt: new Date(),
        },
      });
      await transaction.adminAuditLog.create({
        data: {
          adminId: admin.id,
          applicationId: id,
          action: AdminAuditAction.QR_GENERATED,
        },
      });
    });

    return Response.json(
      {
        success: true,
        data: { qrImagePath: `/api/admin/applications/${id}/documents/qr` },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    await deletePrivateFile(qrCodePath).catch(() => undefined);
    console.error(
      JSON.stringify({
        event: "application_qr_generation_failed",
        category: "private_storage_or_database",
      }),
    );
    return Response.json(
      { success: false, error: { message: "QR कोड तैयार नहीं हो सका।" } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
