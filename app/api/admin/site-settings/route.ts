import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  getContentImageDimensions,
  isContentImageDimensionsAllowed,
  MAX_CONTENT_IMAGE_BYTES,
  validateContentImage,
} from "@/lib/content-image";
import { createStorageKey, deletePrivateFile, saveEncryptedPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });
}

function invalidateBranding() {
  revalidatePath("/");
  revalidatePath("/", "layout");
  revalidatePath("/admin/site-settings");
}

async function cleanupFile(storageKey: string, code: string) {
  try {
    await deletePrivateFile(storageKey);
  } catch {
    console.error("Site logo file cleanup failed", {
      route: "/api/admin/site-settings",
      code,
    });
  }
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (admin.role !== "SUPER_ADMIN") return errorResponse("केवल मुख्य प्रशासक वेबसाइट का लोगो बदल सकता है।", 403);
  const settings = await prisma.siteSettings.findUnique({
    where: { id: "global" },
    select: { logoMimeType: true, updatedAt: true },
  });
  return NextResponse.json({ settings }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (admin.role !== "SUPER_ADMIN") return errorResponse("केवल मुख्य प्रशासक वेबसाइट का लोगो बदल सकता है।", 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_LOGO_BYTES + 32 * 1024) return errorResponse("लोगो का आकार 2 MB से कम होना चाहिए।", 413);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("मान्य लोगो चित्र चुनें।", 400);
  }
  const file = form.get("logo");
  if (!(file instanceof File) || file.size < 1) return errorResponse("मान्य लोगो चित्र चुनें।", 400);
  if (file.size > MAX_LOGO_BYTES || file.size > MAX_CONTENT_IMAGE_BYTES) return errorResponse("लोगो का आकार 2 MB से कम होना चाहिए।", 413);

  const contents = Buffer.from(await file.arrayBuffer());
  const image = validateContentImage(file.type, contents);
  if (!image) return errorResponse("केवल सही PNG, JPEG या WebP लोगो स्वीकार्य है।", 415);
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return errorResponse("लोगो चित्र फ़ाइल पढ़ी नहीं जा सकी।", 415);
  if (!isContentImageDimensionsAllowed(dimensions)) return errorResponse("लोगो का रिज़ॉल्यूशन अनुमत सीमा से अधिक है।", 413);
  if (dimensions.width < 256 || dimensions.height < 256) return errorResponse("लोगो का रिज़ॉल्यूशन कम-से-कम 256 × 256 पिक्सेल होना चाहिए।", 400);
  const storageKey = createStorageKey("branding", image.extension, true);
  let oldStorageKey: string | null = null;
  try {
    await saveEncryptedPrivateFile(storageKey, contents);
    await prisma.$transaction(async (tx) => {
      const current = await tx.siteSettings.findUnique({
        where: { id: "global" },
        select: { logoStorageKey: true },
      });
      oldStorageKey = current?.logoStorageKey ?? null;
      await tx.siteSettings.upsert({
        where: { id: "global" },
        create: { id: "global", logoStorageKey: storageKey, logoMimeType: image.mimeType, updatedById: admin.id },
        update: { logoStorageKey: storageKey, logoMimeType: image.mimeType, updatedById: admin.id },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "SITE_LOGO_UPDATED",
          entity: "SiteSettings",
          entityId: "global",
          metadata: { fileSize: file.size, fileType: file.type },
        },
      });
    });
    if (oldStorageKey) await cleanupFile(oldStorageKey, "SITE_OLD_LOGO_CLEANUP_FAILED");
    invalidateBranding();
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await cleanupFile(storageKey, "SITE_NEW_LOGO_CLEANUP_FAILED");
    console.error("Site logo update failed", {
      route: "/api/admin/site-settings",
      code: "SITE_LOGO_UPDATE_FAILED",
      fileSize: file.size,
      fileType: file.type,
    });
    return errorResponse("लोगो सहेजा नहीं जा सका।", 500);
  }
}

export async function DELETE() {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (admin.role !== "SUPER_ADMIN") return errorResponse("केवल मुख्य प्रशासक वेबसाइट का लोगो बदल सकता है।", 403);
  try {
    const settings = await prisma.$transaction(async (tx) => {
      const existing = await tx.siteSettings.findUnique({
        where: { id: "global" },
        select: { logoStorageKey: true },
      });
      await tx.siteSettings.upsert({
        where: { id: "global" },
        create: { id: "global", updatedById: admin.id },
        update: { logoStorageKey: null, logoMimeType: null, updatedById: admin.id },
      });
      await tx.adminActivity.create({
        data: { adminId: admin.id, action: "SITE_LOGO_REMOVED", entity: "SiteSettings", entityId: "global" },
      });
      return existing;
    });
    if (settings?.logoStorageKey) await cleanupFile(settings.logoStorageKey, "SITE_REMOVED_LOGO_CLEANUP_FAILED");
    invalidateBranding();
    return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Site logo removal failed", { route: "/api/admin/site-settings", code: "SITE_LOGO_REMOVE_FAILED" });
    return errorResponse("लोगो हटाया नहीं जा सका।", 500);
  }
}
