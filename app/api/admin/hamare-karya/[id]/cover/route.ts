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

async function cleanupFile(storageKey: string, code: string) {
  try {
    await deletePrivateFile(storageKey);
  } catch {
    console.error("Ground activity cover file cleanup failed", {
      route: "/api/admin/hamare-karya/[id]/cover",
      code,
    });
  }
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageEditorialContent(admin.role)) return errorResponse("आपको कार्य-चित्र बदलने की अनुमति नहीं है।", 403);
  const { id } = await context.params;
  const activity = await prisma.groundActivity.findUnique({
    where: { id },
    select: { id: true, slug: true, state: true, district: true, coverImageStorageKey: true },
  });
  if (!activity) return errorResponse("कार्य उपलब्ध नहीं है।", 404);
  if (!hasEditorialScope(admin, activity.state, activity.district)) return errorResponse("आपको इस कार्य तक पहुँच की अनुमति नहीं है।", 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_CONTENT_IMAGE_BYTES + 32 * 1024) return errorResponse("चित्र का आकार अनुमत सीमा से अधिक है।", 413);
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("मान्य चित्र फ़ाइल चुनें।", 400);
  }
  const file = form.get("cover");
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
    await prisma.$transaction(async (tx) => {
      await tx.groundActivity.update({ where: { id }, data: { coverImageStorageKey: storageKey, coverImageAltHindi: String(form.get("altText") ?? "").trim().slice(0, 180) || null } });
      await tx.adminActivity.create({
        data: { adminId: admin.id, action: "GROUND_ACTIVITY_COVER_UPDATED", entity: "GroundActivity", entityId: id, metadata: { state: activity.state, district: activity.district, fileSize: file.size, fileType: file.type } },
      });
    });
    if (activity.coverImageStorageKey) await cleanupFile(activity.coverImageStorageKey, "GROUND_OLD_COVER_CLEANUP_FAILED");
    revalidatePath("/");
    revalidatePath("/hamare-karya");
    revalidatePath(`/hamare-karya/${activity.slug}`);
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await cleanupFile(storageKey, "GROUND_NEW_COVER_CLEANUP_FAILED");
    console.error("Ground activity cover upload failed", {
      route: "/api/admin/hamare-karya/[id]/cover",
      code: "GROUND_ACTIVITY_COVER_UPLOAD_FAILED",
      fileSize: file.size,
      fileType: file.type,
    });
    return errorResponse("कार्य-चित्र सहेजा नहीं जा सका।", 500);
  }
}
