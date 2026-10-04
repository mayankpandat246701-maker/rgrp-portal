import { NextResponse } from "next/server";
import { isPrivateStorageAvailable, readEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "global" },
    select: { logoStorageKey: true, logoMimeType: true },
  });
  if (!settings?.logoStorageKey || !settings.logoMimeType || !isPrivateStorageAvailable()) return new NextResponse(null, { status: 404 });
  try {
    const contents = await readEncryptedPrivateFile(settings.logoStorageKey);
    return new NextResponse(new Uint8Array(contents), {
      headers: {
        "Content-Type": settings.logoMimeType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("Public organization logo read failed", { route: "/api/site-settings/logo", code: "SITE_LOGO_READ_FAILED" });
    return new NextResponse(null, { status: 404 });
  }
}
