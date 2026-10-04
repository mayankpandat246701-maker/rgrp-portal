import { NextResponse } from "next/server";
import { publishedNewsWhere } from "@/lib/public-content";
import { isPrivateStorageAvailable, readEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const post = await prisma.newsPost.findFirst({
    where: { slug, ...publishedNewsWhere() },
    select: { coverImageStorageKey: true },
  });
  if (!post?.coverImageStorageKey || !isPrivateStorageAvailable()) return new NextResponse(null, { status: 404 });
  try {
    const image = await readEncryptedPrivateFile(post.coverImageStorageKey);
    const contentType = post.coverImageStorageKey.endsWith(".png.enc")
      ? "image/png"
      : post.coverImageStorageKey.endsWith(".webp.enc")
        ? "image/webp"
        : "image/jpeg";
    return new NextResponse(new Uint8Array(image), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    console.error("Published news cover read failed", {
      route: "/api/samachar/[slug]/cover",
      code: "NEWS_COVER_READ_FAILED",
    });
    return new NextResponse(null, { status: 404 });
  }
}
