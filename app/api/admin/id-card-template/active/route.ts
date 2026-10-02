import { requireAdmin } from "@/lib/auth/require-admin";
import { readPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

export async function GET() {
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

  const template = await prisma.iDCardTemplate.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: "desc" },
    select: { templatePath: true },
  });
  if (!template) {
    return Response.json(
      { success: false, error: { message: "टेम्पलेट उपलब्ध नहीं है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const image = await readPrivateFile(template.templatePath);
    const contentType = template.templatePath.endsWith(".png")
      ? "image/png"
      : "image/jpeg";
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    console.error(
      JSON.stringify({
        event: "id_card_template_read_failed",
        category: "private_storage",
      }),
    );
    return Response.json(
      { success: false, error: { message: "टेम्पलेट उपलब्ध नहीं है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
}
