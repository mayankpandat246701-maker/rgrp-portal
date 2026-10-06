import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import {
  canManageKaryakarta,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createStorageKey,
  deletePrivateFile,
  saveEncryptedPrivateFile,
} from "@/lib/private-uploads";
import {
  getContentImageDimensions,
  isContentImageDimensionsAllowed,
  validateContentImage,
} from "@/lib/content-image";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const MAX_PHOTO_SIZE = 3 * 1024 * 1024;

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return jsonError("अनधिकृत अनुरोध।", 401);
  }
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("इस कार्रवाई की अनुमति नहीं है।", 403);
  }
  const { id } = await context.params;
  let member;
  try {
    member = await prisma.karyakarta.findUnique({
      where: { id },
      select: { id: true, slug: true, state: true, district: true, profilePhotoPath: true },
    });
  } catch {
    console.error("Karyakarta photo lookup failed", {
      route: "/api/admin/karyakartas/[id]/photo",
      code: "KARYAKARTA_PHOTO_LOOKUP_FAILED",
    });
    return jsonError("कार्यकर्ता की जानकारी अभी नहीं मिली।", 500);
  }
  if (!member) return jsonError("कार्यकर्ता नहीं मिला।", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return jsonError("इस कार्रवाई की अनुमति नहीं है।", 403);
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_PHOTO_SIZE + 32 * 1024) {
    return jsonError("छवि का आकार अनुमत सीमा (3 MB) से अधिक है।", 413);
  }
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return jsonError("एक वैध छवि फ़ाइल आवश्यक है।", 400);
  }
  const file = data.get("photo");
  if (!(file instanceof File) || file.size < 1) {
    return jsonError("एक वैध छवि फ़ाइल आवश्यक है।", 400);
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return jsonError("छवि का आकार अनुमत सीमा (3 MB) से अधिक है।", 413);
  }
  const contents = Buffer.from(await file.arrayBuffer());
  const image = validateContentImage(file.type, contents);
  if (!image) {
    return jsonError("केवल JPG, JPEG, PNG और WEBP छवियाँ समर्थित हैं।", 415);
  }
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return jsonError("चयनित छवि पढ़ी नहीं जा सकी।", 415);
  if (!isContentImageDimensionsAllowed(dimensions)) return jsonError("छवि का रिज़ॉल्यूशन अनुमत सीमा से अधिक है।", 413);

  const storageKey = createStorageKey("profiles", image.extension, true);
  try {
    await saveEncryptedPrivateFile(storageKey, contents);
    await prisma.$transaction(async (tx) => {
      await tx.karyakarta.update({
        where: { id },
        data: { profilePhotoPath: storageKey, updatedById: admin.id },
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "KARYAKARTA_PHOTO_UPDATED",
          entity: "Karyakarta",
          entityId: id,
          metadata: {
            state: member.state,
            district: member.district,
            fileSize: file.size,
            fileType: file.type,
          },
        },
      });
    });
    if (member.profilePhotoPath) {
      try {
        await deletePrivateFile(member.profilePhotoPath);
      } catch {
        console.error("Karyakarta old profile photo cleanup failed", {
          route: "/api/admin/karyakartas/[id]/photo",
          code: "KARYAKARTA_OLD_PHOTO_CLEANUP_FAILED",
        });
      }
    }
    revalidatePath("/saksham-karyakarta");
    revalidatePath(`/saksham-karyakarta/${member.slug}`);
    return NextResponse.json(
      { photoUrl: `/api/saksham-karyakarta/${member.slug}/photo` },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    await deletePrivateFile(storageKey).catch(() => {
      console.error("Karyakarta profile photo cleanup failed", {
        route: "/api/admin/karyakartas/[id]/photo",
        code: "KARYAKARTA_PHOTO_CLEANUP_FAILED",
      });
    });
    console.error("Karyakarta profile photo update failed", {
      route: "/api/admin/karyakartas/[id]/photo",
      code: "KARYAKARTA_PHOTO_UPDATE_FAILED",
      fileSize: file.size,
      fileType: file.type,
    });
    return jsonError("प्रोफ़ाइल फ़ोटो सहेजा नहीं जा सका। कृपया फिर प्रयास करें।", 500);
  }
}
