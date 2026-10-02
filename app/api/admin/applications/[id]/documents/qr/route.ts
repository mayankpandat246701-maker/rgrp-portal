import { requireAdmin } from "@/lib/auth/require-admin";
import { readPrivateFile } from "@/lib/private-uploads";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
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

  const { id } = await context.params;
  const application = await prisma.karyakartaApplication.findUnique({
    where: { id },
    select: { qrCodePath: true },
  });
  if (!application?.qrCodePath) {
    return Response.json(
      { success: false, error: { message: "QR इमेज उपलब्ध नहीं है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const image = await readPrivateFile(application.qrCodePath);
    return new Response(new Uint8Array(image), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'; sandbox",
      },
    });
  } catch {
    console.error(
      JSON.stringify({
        event: "admin_qr_image_read_failed",
        category: "private_storage",
      }),
    );
    return Response.json(
      { success: false, error: { message: "QR इमेज उपलब्ध नहीं है।" } },
      { status: 404, headers: { "Cache-Control": "no-store" } },
    );
  }
}
