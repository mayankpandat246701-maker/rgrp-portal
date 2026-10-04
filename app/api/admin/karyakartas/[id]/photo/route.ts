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

function isAllowedPhoto(type: string, bytes: Buffer): "jpg" | "png" | null {
  if (
    type === "image/jpeg" &&
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "jpg";
  }
  if (
    type === "image/png" &&
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  ) {
    return "png";
  }
  return null;
}

export async function POST(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return jsonError("Authentication is required.", 401);
  }
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("Not authorized.", 403);
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
    return jsonError("Unable to load this member right now.", 500);
  }
  if (!member) return jsonError("Member not found.", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return jsonError("Not authorized.", 403);
  }

  if (Number(request.headers.get("content-length") ?? 0) > MAX_PHOTO_SIZE + 32 * 1024) {
    return jsonError("Image exceeds the allowed size.", 413);
  }
  let data: FormData;
  try {
    data = await request.formData();
  } catch {
    return jsonError("A valid image file is required.", 400);
  }
  const file = data.get("photo");
  if (!(file instanceof File) || file.size < 1) {
    return jsonError("A valid image file is required.", 400);
  }
  if (file.size > MAX_PHOTO_SIZE) {
    return jsonError("Image exceeds the allowed size.", 413);
  }
  const contents = Buffer.from(await file.arrayBuffer());
  const extension = isAllowedPhoto(file.type, contents);
  if (!extension) {
    return jsonError("Only JPG and PNG photos are supported.", 415);
  }
  const dimensions = getContentImageDimensions(contents);
  if (!dimensions) return jsonError("The selected image could not be read.", 415);
  if (!isContentImageDimensionsAllowed(dimensions)) return jsonError("Image resolution exceeds the allowed limit.", 413);

  const storageKey = createStorageKey("profiles", extension, true);
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
    return jsonError("Unable to save the profile photo.", 500);
  }
}
