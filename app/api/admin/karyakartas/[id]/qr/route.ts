import { NextResponse } from "next/server";
import QRCode from "qrcode";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("Not authorized.", 403);
  }
  const { id } = await context.params;
  let member;
  try {
    member = await prisma.karyakarta.findUnique({
      where: { id },
      select: {
        id: true,
        state: true,
        district: true,
        profileStatus: true,
        isPublicProfile: true,
        isEmergencyHidden: true,
        registrations: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { registrationNumber: true, expiryDate: true },
        },
      },
    });
  } catch {
    console.error("Karyakarta QR lookup failed", {
      route: "/api/admin/karyakartas/[id]/qr",
      code: "KARYAKARTA_QR_LOOKUP_FAILED",
    });
    return jsonError("Unable to load this member right now.", 500);
  }
  if (!member) return jsonError("Member not found.", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return jsonError("Not authorized.", 403);
  }
  const registration = member.registrations[0];
  if (
    !registration ||
    member.profileStatus !== "ACTIVE" ||
    !member.isPublicProfile ||
    member.isEmergencyHidden ||
    (registration.expiryDate && registration.expiryDate < new Date())
  ) {
    return jsonError("An active verified registration is required.", 409);
  }

  const verificationUrl = new URL(
    "/verify-id",
    process.env.APP_BASE_URL?.trim() || "http://localhost:3000",
  );
  verificationUrl.searchParams.set("reg", registration.registrationNumber);
  try {
    const dataUrl = await QRCode.toDataURL(verificationUrl.toString(), {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 320,
    });
    return NextResponse.json({ dataUrl }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Karyakarta QR generation failed", {
      route: "/api/admin/karyakartas/[id]/qr",
      code: "KARYAKARTA_QR_GENERATION_FAILED",
    });
    return jsonError("Unable to generate the verification QR.", 500);
  }
}
