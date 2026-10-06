import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentKaryakarta } from "@/lib/auth/require-karyakarta";
import { isIdCardEligible } from "@/lib/id-card-eligibility";
import { prisma } from "@/lib/prisma";
import {
  checkIdCardLimit,
  isIdCardRateLimitAvailable,
} from "@/lib/rate-limit/id-cards";

function requestIp(request: Request): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim().slice(0, 64) || "unknown";
}

const sideSchema = z.object({
  side: z.enum(["front", "back", "status"]).default("status"),
});

function contentTypeFor(path: string): string {
  if (path.endsWith(".png.enc")) return "image/png";
  if (path.endsWith(".webp.enc")) return "image/webp";
  return "image/jpeg";
}

export async function GET(request: Request) {
  const member = await getCurrentKaryakarta();
  if (!member) {
    return NextResponse.json(
      { success: false, error: { message: "पहले प्रवेश करें।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  if (!isIdCardRateLimitAvailable()) {
    return NextResponse.json(
      { success: false, error: { message: "सेवा अभी उपलब्ध नहीं है।" } },
      { status: 503, headers: { "Retry-After": "60", "Cache-Control": "no-store" } },
    );
  }
  const limit = await checkIdCardLimit(`member:${member.id}:${requestIp(request)}`);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, error: { message: "बहुत अधिक प्रयास किए गए।" } },
      {
        status: 429,
        headers: {
          "Retry-After": String(limit.retryAfterSeconds),
          "Cache-Control": "no-store",
        },
      },
    );
  }

  const query = sideSchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries()),
  );
  if (!query.success) {
    return NextResponse.json(
      { success: false, error: { message: "अनुरोध अमान्य है।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const record = await prisma.karyakarta.findUnique({
    where: { id: member.id },
    select: {
      profileStatus: true,
      archivedAt: true,
      idCardFrontPath: true,
      idCardBackPath: true,
      registrations: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, expiryDate: true },
      },
    },
  });
  const registration = record?.registrations[0] ?? null;
  const eligible = Boolean(
    record &&
      registration &&
      isIdCardEligible({
        profileStatus: record.profileStatus,
        archivedAt: record.archivedAt,
        registrationStatus: registration.status,
        registrationExpiryDate: registration.expiryDate,
      }),
  );
  if (!eligible || !record?.idCardFrontPath) {
    return NextResponse.json(
      {
        success: true,
        data: {
          available: false,
          message:
            "आपका कार्यकर्ता प्रोफ़ाइल अभी प्रशासन द्वारा सत्यापित नहीं हुआ है। सत्यापन के बाद ही पहचान पत्र उपलब्ध होगा।",
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  if (query.data.side === "status") {
    return NextResponse.json(
      {
        success: true,
        data: {
          available: true,
          hasBack: record.idCardBackPath !== null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const { readEncryptedPrivateFile } = await import("@/lib/private-uploads");
  const storagePath =
    query.data.side === "back" ? record.idCardBackPath : record.idCardFrontPath;
  if (!storagePath) return new NextResponse(null, { status: 404 });

  try {
    const image = await readEncryptedPrivateFile(storagePath);
    await prisma.adminAuditLog.create({
      data: {
        adminId: member.id,
        action: "ID_CARD_DOWNLOADED",
        karyakartaId: member.id,
      },
    }).catch(() => undefined);
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": contentTypeFor(storagePath),
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
