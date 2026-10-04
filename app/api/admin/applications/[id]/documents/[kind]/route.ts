import { requireAdmin } from "@/lib/auth/require-admin";
import {
  isPrivateStorageAvailable,
  readEncryptedPrivateFile,
} from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string; kind: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { success: false, error: { message: "अनधिकृत अनुरोध।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (admin.role !== "SUPER_ADMIN") {
    return Response.json(
      { success: false, error: { message: "इस फ़ाइल की अनुमति नहीं है।" } },
      { status: 403, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (!isPrivateStorageAvailable()) {
    return Response.json(
      { success: false, error: { message: "फ़ाइल सेवा अभी उपलब्ध नहीं है।" } },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  const { id, kind } = await context.params;
  if (kind !== "photo" && kind !== "aadhaar") {
    return Response.json(
      { success: false, error: { message: "फ़ाइल नहीं मिली।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  const application = await prisma.karyakartaApplication.findUnique({
    where: { id },
    select: { photoPath: true, aadhaarPath: true },
  });
  const storageKey =
    kind === "photo" ? application?.photoPath : application?.aadhaarPath;
  if (!storageKey) {
    return Response.json(
      { success: false, error: { message: "फ़ाइल नहीं मिली।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const file = await readEncryptedPrivateFile(storageKey);
    const contentType = storageKey.endsWith(".pdf.enc")
      ? "application/pdf"
      : storageKey.endsWith(".png.enc")
        ? "image/png"
        : "image/jpeg";
    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${kind === "photo" ? "photo" : "document"}"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch {
    console.error(
      JSON.stringify({
        event: "admin_private_document_read_failed",
        category: "private_storage",
      }),
    );
    return Response.json(
      { success: false, error: { message: "फ़ाइल उपलब्ध नहीं है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
}
