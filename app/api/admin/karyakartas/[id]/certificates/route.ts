import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageCertificates,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createJoiningCertificatePdf } from "@/lib/joining-certificate-pdf";
import { isJoiningCertificateEligible } from "@/lib/joining-certificate";
import {
  createStorageKey,
  deletePrivateFile,
  saveEncryptedPrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function certificateNumber(now: Date) {
  return `RGRP-CERT-${now.getFullYear()}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

async function cleanupFile(storageKey: string) {
  try {
    await deletePrivateFile(storageKey);
  } catch {
    console.error("Joining certificate file cleanup failed", {
      route: "/api/admin/karyakartas/[id]/certificates",
      code: "JOINING_CERTIFICATE_FILE_CLEANUP_FAILED",
    });
  }
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageCertificates(admin.role)) {
    return errorResponse("आपको प्रमाणपत्र प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  let member;
  try {
    member = await prisma.karyakarta.findUnique({
      where: { id },
      select: { id: true, state: true, district: true },
    });
    if (!member) return errorResponse("कार्यकर्ता उपलब्ध नहीं है।", 404);
    if (!hasKaryakartaScope(admin, member.state, member.district)) {
      return errorResponse("आपको इस कार्यकर्ता तक पहुँच की अनुमति नहीं है।", 403);
    }
    const certificates = await prisma.joiningCertificate.findMany({
      where: { karyakartaId: id },
      orderBy: [{ generatedAt: "desc" }, { id: "desc" }],
      take: 50,
      select: {
        id: true,
        certificateNumber: true,
        status: true,
        issueDate: true,
        generatedAt: true,
        revokedAt: true,
      },
    });
    return NextResponse.json(
      { certificates },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error("Joining certificate history lookup failed", {
      route: "/api/admin/karyakartas/[id]/certificates",
      code: "JOINING_CERTIFICATE_HISTORY_FAILED",
    });
    return errorResponse("प्रमाणपत्र इतिहास अभी उपलब्ध नहीं है।", 500);
  }
}

export async function POST(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageCertificates(admin.role)) {
    return errorResponse("आपको प्रमाणपत्र जारी करने की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  let member;
  try {
    member = await prisma.karyakarta.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        name: true,
        daitva: true,
        state: true,
        district: true,
        profileStatus: true,
        registrations: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            id: true,
            registrationNumber: true,
            status: true,
            expiryDate: true,
          },
        },
      },
    });
  } catch {
    console.error("Joining certificate member lookup failed", {
      route: "/api/admin/karyakartas/[id]/certificates",
      code: "JOINING_CERTIFICATE_MEMBER_LOOKUP_FAILED",
    });
    return errorResponse("कार्यकर्ता जानकारी अभी उपलब्ध नहीं है।", 500);
  }
  if (!member) return errorResponse("कार्यकर्ता उपलब्ध नहीं है।", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return errorResponse("आपको इस कार्यकर्ता तक पहुँच की अनुमति नहीं है।", 403);
  }
  if (!member.daitva?.trim() || !member.state?.trim() || !member.district?.trim()) {
    return errorResponse(
      "प्रमाणपत्र जारी करने से पहले कार्यकर्ता का दायित्व, राज्य और जिला दर्ज करें।",
      409,
    );
  }
  const registration = member.registrations[0];
  const issueDate = new Date();
  if (
    !registration ||
    !isJoiningCertificateEligible({
      profileStatus: member.profileStatus,
      registrationStatus: registration.status,
      registrationExpiryDate: registration.expiryDate,
      now: issueDate,
    })
  ) {
    return errorResponse(
      "प्रमाणपत्र के लिए सक्रिय और वैध पंजीकरण आवश्यक है।",
      409,
    );
  }

  const number = certificateNumber(issueDate);
  let pdf: Buffer;
  try {
    pdf = await createJoiningCertificatePdf({
      certificateNumber: number,
      name: member.name,
      daitva: member.daitva,
      state: member.state,
      district: member.district,
      registrationNumber: registration.registrationNumber,
      issueDate,
      expiryDate: registration.expiryDate,
    });
  } catch {
    console.error("Joining certificate PDF generation failed", {
      route: "/api/admin/karyakartas/[id]/certificates",
      code: "JOINING_CERTIFICATE_PDF_GENERATION_FAILED",
    });
    return errorResponse("प्रमाणपत्र तैयार नहीं किया जा सका।", 500);
  }

  const storageKey = createStorageKey("certificates", "pdf", true);
  try {
    await saveEncryptedPrivateFile(storageKey, pdf);
    const certificate = await prisma.$transaction(
      async (tx) => {
        const previous = await tx.joiningCertificate.findFirst({
          where: { karyakartaId: id, status: "ACTIVE" },
          orderBy: { generatedAt: "desc" },
          select: { id: true },
        });
        if (previous) {
          await tx.joiningCertificate.update({
            where: { id: previous.id },
            data: { status: "SUPERSEDED" },
          });
        }
        const created = await tx.joiningCertificate.create({
          data: {
            certificateNumber: number,
            karyakartaId: id,
            registrationCardId: registration.id,
            issueDate,
            generatedByAdminId: admin.id,
            fileStorageKey: storageKey,
            reissuedFromId: previous?.id ?? null,
          },
          select: {
            id: true,
            certificateNumber: true,
            status: true,
            issueDate: true,
          },
        });
        await tx.adminActivity.create({
          data: {
            adminId: admin.id,
            action: previous
              ? "JOINING_CERTIFICATE_REISSUED"
              : "JOINING_CERTIFICATE_ISSUED",
            entity: "JoiningCertificate",
            entityId: created.id,
            metadata: {
              state: member.state,
              district: member.district,
              registrationStatus: registration.status,
              reissuedFromId: previous?.id ?? null,
            },
          },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    revalidatePath("/admin/certificates");
    revalidatePath(`/admin/karyakartas/${encodeURIComponent(id)}/edit`);
    revalidatePath(`/verify-certificate`);
    return NextResponse.json(
      { certificate },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    await cleanupFile(storageKey);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      ["P2002", "P2034"].includes(error.code)
    ) {
      return errorResponse(
        "प्रमाणपत्र एक साथ अपडेट हुआ है। कृपया पृष्ठ रीफ़्रेश करके फिर प्रयास करें।",
        409,
      );
    }
    console.error("Joining certificate issue failed", {
      route: "/api/admin/karyakartas/[id]/certificates",
      code: "JOINING_CERTIFICATE_ISSUE_FAILED",
    });
    return errorResponse("प्रमाणपत्र जारी नहीं किया जा सका।", 500);
  }
}
