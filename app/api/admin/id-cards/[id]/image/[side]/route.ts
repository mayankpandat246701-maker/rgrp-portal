import { NextResponse } from "next/server";
import { z } from "zod";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { readEncryptedPrivateFile } from "@/lib/private-uploads";

type RouteContext = { params: Promise<{ id: string; side: string }> };

const paramsSchema = z.object({
  id: z.string().min(1).max(64),
  side: z.enum(["front", "back"]),
});

function contentTypeFor(path: string): string {
  if (path.endsWith(".png.enc")) return "image/png";
  if (path.endsWith(".webp.enc")) return "image/webp";
  return "image/jpeg";
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json(
      { success: false, error: { message: "पहले प्रशासक के रूप में प्रवेश करें।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!canManageKaryakarta(admin.role)) {
    return NextResponse.json(
      { success: false, error: { message: "अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = paramsSchema.safeParse(await context.params);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "अनुरोध अमान्य है।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const member = await prisma.karyakarta.findUnique({
    where: { id: parsed.data.id },
    select: {
      state: true,
      district: true,
      idCardFrontPath: true,
      idCardBackPath: true,
    },
  });
  if (!member) {
    return NextResponse.json(
      { success: false, error: { message: "कार्यकर्ता उपलब्ध नहीं है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return NextResponse.json(
      { success: false, error: { message: "अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const storagePath =
    parsed.data.side === "front" ? member.idCardFrontPath : member.idCardBackPath;
  if (!storagePath) return new NextResponse(null, { status: 404 });

  try {
    const image = await readEncryptedPrivateFile(storagePath);
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
