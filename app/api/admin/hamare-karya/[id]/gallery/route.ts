import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { canManageEditorialContent, hasEditorialScope } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getContentImageDimensions,
  isContentImageDimensionsAllowed,
  MAX_CONTENT_IMAGE_BYTES,
  validateContentImage,
} from "@/lib/content-image";
import { createStorageKey, deletePrivateFile, saveEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

async function cleanupFile(storageKey: string) {
  try {
    await deletePrivateFile(storageKey);
  } catch {
    console.error("Ground activity gallery file cleanup failed", {
      route: "/api/admin/hamare-karya/[id]/gallery",
      code: "GROUND_ACTIVITY_GALLERY_FILE_CLEANUP_FAILED",
    });
  }
}

async function getAuthorizedActivity(id: string, admin: NonNullable<Awaited<ReturnType<typeof requireAdmin>>>) {
  if (!canManageEditorialContent(admin.role)) return null;
  const activity = await prisma.groundActivity.findUnique({
    where: { id },
    select: { id: true, slug: true, state: true, district: true },
  });
  return activity && hasEditorialScope(admin, activity.state, activity.district) ? activity : null;
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  const { id } = await context.params;
  const activity = await getAuthorizedActivity(id, admin);
  if (!activity) return errorResponse("आपको इस कार्य तक पहुँच की अनुमति नहीं है।", 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CONTENT_IMAGE_BYTES + 32 * 1024) return errorResponse("चित्र का आकार अनुमत सीमा से अधिक है।", 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("मान्य चित्र फ़ाइल चुनें।", 400);
  }
  const file = form.get("image");
  if (!(file instanceof File) || file.size < 1) return errorResponse("मान्य चित्र फ़ाइल चुनें।", 400);
  if (file.size > MAX_CONTENT_IMAGE_BYTES) return errorResponse("चित्र का आकार अनुमत सीमा से अधिक है।", 413);
  const contents = Buffer.from(await file.arrayBuffer());
  const image = validateContentImage(file.type, contents);
  if (!image) return errorResponse("केवल सही PNG, JPEG या WebP चित्र स्वीकार्य हैं।", 415);
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return errorResponse("चित्र फ़ाइल पढ़ी नहीं जा सकी।", 415);
  if (!isContentImageDimensionsAllowed(dimensions)) return errorResponse("चित्र का रिज़ॉल्यूशन अनुमत सीमा से अधिक है।", 413);
  const storageKey = createStorageKey("content", image.extension, true);
  try {
    await saveEncryptedPrivateFile(storageKey, contents);
    const created = await prisma.$transaction(async (tx) => {
      const saved = await tx.groundActivityImage.create({
        data: {
          groundActivityId: id,
          storageKey,
          altTextHindi: String(form.get("altText") ?? "").trim().slice(0, 180) || null,
          displayOrder: Math.max(0, Math.min(9999, Number(form.get("displayOrder") ?? 0) || 0)),
          isPublic: form.get("isPublic") === "true",
        },
        select: { id: true, displayOrder: true, isPublic: true },
      });
      await tx.adminActivity.create({
        data: { adminId: admin.id, action: "GROUND_ACTIVITY_IMAGE_ADDED", entity: "GroundActivity", entityId: id, metadata: { state: activity.state, district: activity.district, fileSize: file.size, fileType: file.type, isPublic: saved.isPublic } },
      });
      return saved;
    });
    revalidatePath("/");
    revalidatePath("/hamare-karya");
    revalidatePath(`/hamare-karya/${activity.slug}`);
    return NextResponse.json({ image: created }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    await cleanupFile(storageKey);
    console.error("Ground activity gallery upload failed", {
      route: "/api/admin/hamare-karya/[id]/gallery",
      code: "GROUND_ACTIVITY_GALLERY_UPLOAD_FAILED",
      fileSize: file.size,
      fileType: file.type,
    });
    return errorResponse("गैलरी चित्र सहेजा नहीं जा सका।", 500);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  const { id } = await context.params;
  const activity = await getAuthorizedActivity(id, admin);
  if (!activity) return errorResponse("आपको इस कार्य तक पहुँच की अनुमति नहीं है।", 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("गैलरी क्रम सही प्रारूप में भेजें।", 400);
  }
  if (typeof body !== "object" || body === null || !("images" in body) || !Array.isArray(body.images) || body.images.length > 40) return errorResponse("गैलरी क्रम सही प्रारूप में भेजें।", 400);
  const images = body.images;
  if (!images.every((item) => typeof item === "object" && item !== null && "id" in item && typeof item.id === "string" && /^[a-z0-9]+$/i.test(item.id) && "displayOrder" in item && Number.isInteger(item.displayOrder) && (item.displayOrder as number) >= 0 && (item.displayOrder as number) <= 9999 && "isPublic" in item && typeof item.isPublic === "boolean")) {
    return errorResponse("गैलरी क्रम जाँचें।", 400);
  }
  const stored = await prisma.groundActivityImage.findMany({ where: { groundActivityId: id }, select: { id: true } });
  if (stored.length !== images.length || stored.some((image) => !images.some((item) => item.id === image.id))) return errorResponse("गैलरी सूची बदल गई है; पृष्ठ ताज़ा करें।", 409);
  try {
    await prisma.$transaction([
      ...images.map((image) => prisma.groundActivityImage.update({
        where: { id: image.id },
        data: { displayOrder: image.displayOrder, isPublic: image.isPublic },
      })),
      prisma.adminActivity.create({
        data: { adminId: admin.id, action: "GROUND_ACTIVITY_GALLERY_REORDERED", entity: "GroundActivity", entityId: id, metadata: { state: activity.state, district: activity.district, imageCount: images.length } },
      }),
    ]);
    revalidatePath("/");
    revalidatePath("/hamare-karya");
    revalidatePath(`/hamare-karya/${activity.slug}`);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Ground activity gallery update failed", { route: "/api/admin/hamare-karya/[id]/gallery", code: "GROUND_ACTIVITY_GALLERY_UPDATE_FAILED" });
    return errorResponse("गैलरी अपडेट नहीं हो सकी।", 500);
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  const { id } = await context.params;
  const activity = await getAuthorizedActivity(id, admin);
  if (!activity) return errorResponse("आपको इस कार्य तक पहुँच की अनुमति नहीं है।", 403);
  const imageId = new URL(request.url).searchParams.get("imageId") ?? "";
  const image = await prisma.groundActivityImage.findFirst({
    where: { id: imageId, groundActivityId: id },
    select: { id: true, storageKey: true },
  });
  if (!image) return errorResponse("गैलरी चित्र उपलब्ध नहीं है।", 404);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.groundActivityImage.delete({ where: { id: image.id } });
      await tx.adminActivity.create({
        data: { adminId: admin.id, action: "GROUND_ACTIVITY_IMAGE_REMOVED", entity: "GroundActivity", entityId: id, metadata: { state: activity.state, district: activity.district } },
      });
    });
    await deletePrivateFile(image.storageKey).catch(() => {
      console.error("Ground activity image cleanup failed", { route: "/api/admin/hamare-karya/[id]/gallery", code: "GROUND_ACTIVITY_IMAGE_CLEANUP_FAILED" });
    });
    revalidatePath("/");
    revalidatePath("/hamare-karya");
    revalidatePath(`/hamare-karya/${activity.slug}`);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Ground activity image removal failed", { route: "/api/admin/hamare-karya/[id]/gallery", code: "GROUND_ACTIVITY_IMAGE_REMOVE_FAILED" });
    return errorResponse("गैलरी चित्र हटाया नहीं जा सका।", 500);
  }
}
