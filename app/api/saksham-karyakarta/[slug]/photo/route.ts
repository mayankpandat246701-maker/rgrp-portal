import { NextResponse } from "next/server";
import {
  isPrivateStorageAvailable,
  readEncryptedPrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const member = await prisma.karyakarta.findFirst({
    where: {
      slug,
      profileStatus: "ACTIVE",
      isPublicProfile: true,
      isEmergencyHidden: false,
      archivedAt: null,
      profilePhotoPath: { not: null },
      registrations: {
        some: {
          status: "ACTIVE",
          OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        },
      },
    },
    select: { profilePhotoPath: true },
  });
  if (!member?.profilePhotoPath || !isPrivateStorageAvailable()) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const photo = await readEncryptedPrivateFile(member.profilePhotoPath);
    const contentType = member.profilePhotoPath.endsWith(".png.enc")
      ? "image/png"
      : "image/jpeg";
    return new NextResponse(new Uint8Array(photo), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("Public karyakarta photo read failed", {
      route: "/api/saksham-karyakarta/[slug]/photo",
      code: "KARYAKARTA_PUBLIC_PHOTO_FAILED",
    });
    return new NextResponse(null, { status: 404 });
  }
}
