import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canManageLeadership } from "@/lib/auth/admin-permissions";
import {
  getContentImageDimensions,
  isContentImageDimensionsAllowed,
  validateContentImage,
} from "@/lib/content-image";
import { prisma } from "@/lib/prisma";
import { StorageUnavailableError } from "@/lib/storage/types";
import {
  deletePublicImageByUrl,
  isPublicImageStorageAvailable,
  putPublicImage,
} from "@/lib/storage/vercel-blob-public-images";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_PORTRAIT_SIZE = 3 * 1024 * 1024;

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { success: false, error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("अनधिकृत अनुरोध।", 401);
  if (!canManageLeadership(admin.role)) {
    return jsonError("इस कार्रवाई की अनुमति नहीं है।", 403);
  }
  if (!isPublicImageStorageAvailable()) {
    return jsonError("छवि सेवा अभी उपलब्ध नहीं है।", 503);
  }

  const { id } = await context.params;
  let message;
  try {
    message = await prisma.leadershipMessage.findUnique({
      where: { id },
      select: { id: true, portraitUrl: true },
    });
  } catch {
    console.error(
      JSON.stringify({
        event: "leadership_portrait_lookup_failed",
        route: "/api/admin/leadership-messages/[id]/photo",
        code: "LEADERSHIP_PORTRAIT_LOOKUP_FAILED",
      }),
    );
    return jsonError("मुख्य व्यक्ति की जानकारी अभी नहीं मिली।", 500);
  }
  if (!message) return jsonError("संदेश नहीं मिला।", 404);

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_PORTRAIT_SIZE + 32 * 1024) {
    return jsonError("छवि का आकार अनुमत सीमा (3 MB) से अधिक है।", 413);
  }

  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return jsonError("एक वैध छवि फ़ाइल आवश्यक है।", 400);
  }
  const file = data.get("portrait");
  if (!(file instanceof File) || file.size < 1) {
    return jsonError("एक वैध छवि फ़ाइल आवश्यक है।", 400);
  }
  if (file.size > MAX_PORTRAIT_SIZE) {
    return jsonError("छवि का आकार अनुमत सीमा (3 MB) से अधिक है।", 413);
  }

  const contents = Buffer.from(await file.arrayBuffer());
  const image = validateContentImage(file.type, contents);
  if (!image) {
    return jsonError(
      "केवल JPG, JPEG, PNG और WEBP छवियाँ समर्थित हैं।",
      415,
    );
  }
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return jsonError("चयनित छवि पढ़ी नहीं जा सकी।", 415);
  if (!isContentImageDimensionsAllowed(dimensions)) {
    return jsonError("छवि का रिज़ॉल्यूशन अनुमत सीमा से अधिक है।", 413);
  }

  const pathname = `leadership/${id}/${randomUUID()}.${image.extension}`;
  let portraitUrl: string;
  try {
    portraitUrl = await putPublicImage(pathname, contents, image.mimeType);
  } catch (error) {
    if (error instanceof StorageUnavailableError) {
      return jsonError("छवि सेवा अभी उपलब्ध नहीं है।", 503);
    }
    console.error(
      JSON.stringify({
        event: "leadership_portrait_upload_failed",
        route: "/api/admin/leadership-messages/[id]/photo",
        code: "LEADERSHIP_PORTRAIT_UPLOAD_FAILED",
        fileSize: file.size,
        fileType: file.type,
      }),
    );
    return jsonError("छवि अपलोड नहीं हो सकी। कृपया फिर प्रयास करें।", 500);
  }

  try {
    await prisma.leadershipMessage.update({
      where: { id },
      data: { portraitUrl },
    });
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "LEADERSHIP_MESSAGE_UPDATED",
        entity: "LeadershipMessage",
        entityId: id,
        metadata: {
          portraitChanged: true,
          fileSize: file.size,
          fileType: file.type,
        },
      },
    });
  } catch {
    await deletePublicImageByUrl(portraitUrl);
    console.error(
      JSON.stringify({
        event: "leadership_portrait_save_failed",
        route: "/api/admin/leadership-messages/[id]/photo",
        code: "LEADERSHIP_PORTRAIT_SAVE_FAILED",
      }),
    );
    return jsonError("छवि सहेजी नहीं जा सकी। कृपया फिर प्रयास करें।", 500);
  }

  if (message.portraitUrl && message.portraitUrl !== portraitUrl) {
    const removed = await deletePublicImageByUrl(message.portraitUrl);
    if (!removed) {
      console.error(
        JSON.stringify({
          event: "leadership_portrait_cleanup_failed",
          route: "/api/admin/leadership-messages/[id]/photo",
          code: "LEADERSHIP_PORTRAIT_CLEANUP_FAILED",
        }),
      );
    }
  }

  revalidatePath("/");
  revalidatePath("/saksham-karyakarta");
  revalidatePath("/admin/leadership-messages");
  return NextResponse.json(
    { success: true, data: { portraitUrl } },
    { headers: { "Cache-Control": "no-store" } },
  );
}
