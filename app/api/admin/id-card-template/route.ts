import { AdminAuditAction } from "@prisma/client";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  createStorageKey,
  deletePrivateFile,
  savePrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

const MAX_TEMPLATE_SIZE = 5 * 1024 * 1024;

function isFile(value: FormDataEntryValue | null): value is File {
  return typeof value === "object" && value !== null && "arrayBuffer" in value;
}

function isAllowedImage(file: File, contents: Buffer): "png" | "jpg" | null {
  if (
    file.type === "image/png" &&
    contents.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "png";
  }
  if (
    file.type === "image/jpeg" &&
    contents.length >= 3 &&
    contents[0] === 0xff &&
    contents[1] === 0xd8 &&
    contents[2] === 0xff
  ) {
    return "jpg";
  }
  return null;
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { success: false, error: { message: "अनधिकृत अनुरोध।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (admin.role !== "SUPER_ADMIN") {
    return Response.json(
      { success: false, error: { message: "इस कार्रवाई की अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_TEMPLATE_SIZE + 32 * 1024) {
    return Response.json(
      { success: false, error: { message: "अमान्य टेम्पलेट फ़ाइल।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { success: false, error: { message: "अमान्य टेम्पलेट फ़ाइल।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const file = formData.get("template");
  if (!isFile(file) || file.size === 0 || file.size > MAX_TEMPLATE_SIZE) {
    return Response.json(
      { success: false, error: { message: "अमान्य टेम्पलेट फ़ाइल।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contents = Buffer.from(await file.arrayBuffer());
  const extension = isAllowedImage(file, contents);
  if (!extension) {
    return Response.json(
      { success: false, error: { message: "केवल PNG या JPEG टेम्पलेट स्वीकार्य है।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const templatePath = createStorageKey("templates", extension);
  try {
    await savePrivateFile(templatePath, contents);
    const template = await prisma.$transaction(async (transaction) => {
      await transaction.iDCardTemplate.updateMany({
        where: { isActive: true },
        data: { isActive: false },
      });
      const createdTemplate = await transaction.iDCardTemplate.create({
        data: {
          templatePath,
          uploadedByAdminId: admin.id,
        },
        select: { id: true, uploadedAt: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          adminId: admin.id,
          action: AdminAuditAction.ID_CARD_TEMPLATE_UPLOADED,
          metadata: { templateId: createdTemplate.id },
        },
      });
      return createdTemplate;
    });
    console.info(
      JSON.stringify({
        event: "id_card_template_uploaded",
        category: "private_storage",
      }),
    );

    return Response.json(
      { success: true, data: template },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    await deletePrivateFile(templatePath).catch(() => undefined);
    console.error(
      JSON.stringify({
        event: "id_card_template_upload_failed",
        category: "private_storage_or_database",
      }),
    );
    return Response.json(
      { success: false, error: { message: "टेम्पलेट सहेजा नहीं जा सका।" } },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
