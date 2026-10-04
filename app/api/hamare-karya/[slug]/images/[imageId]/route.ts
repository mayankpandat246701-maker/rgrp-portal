import { NextResponse } from "next/server";
import { publishedGroundActivityWhere } from "@/lib/public-content";
import { isPrivateStorageAvailable, readEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string; imageId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug, imageId } = await context.params;
  const image = await prisma.groundActivityImage.findFirst({
    where: {
      id: imageId,
      isPublic: true,
      groundActivity: { slug, ...publishedGroundActivityWhere() },
    },
    select: { storageKey: true },
  });
  if (!image || !isPrivateStorageAvailable()) return new NextResponse(null, { status: 404 });
  try {
    const contents = await readEncryptedPrivateFile(image.storageKey);
    const contentType = image.storageKey.endsWith(".png.enc")
      ? "image/png"
      : image.storageKey.endsWith(".webp.enc")
        ? "image/webp"
        : "image/jpeg";
    return new NextResponse(new Uint8Array(contents), {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    console.error("Published activity gallery read failed", { route: "/api/hamare-karya/[slug]/images/[imageId]", code: "GROUND_ACTIVITY_GALLERY_READ_FAILED" });
    return new NextResponse(null, { status: 404 });
  }
}
