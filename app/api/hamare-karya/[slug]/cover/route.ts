import { NextResponse } from "next/server";
import { publishedGroundActivityWhere } from "@/lib/public-content";
import { isPrivateStorageAvailable, readEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const activity = await prisma.groundActivity.findFirst({
    where: { slug, ...publishedGroundActivityWhere() },
    select: { coverImageStorageKey: true },
  });
  if (!activity?.coverImageStorageKey || !isPrivateStorageAvailable()) return new NextResponse(null, { status: 404 });
  try {
    const image = await readEncryptedPrivateFile(activity.coverImageStorageKey);
    const contentType = activity.coverImageStorageKey.endsWith(".png.enc")
      ? "image/png"
      : activity.coverImageStorageKey.endsWith(".webp.enc")
        ? "image/webp"
        : "image/jpeg";
    return new NextResponse(new Uint8Array(image), {
      headers: { "Content-Type": contentType, "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    console.error("Published activity cover read failed", { route: "/api/hamare-karya/[slug]/cover", code: "GROUND_ACTIVITY_COVER_READ_FAILED" });
    return new NextResponse(null, { status: 404 });
  }
}
