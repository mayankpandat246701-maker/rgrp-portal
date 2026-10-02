import { z } from "zod";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

const statusSchema = z.enum(["PENDING", "APPROVED", "BLOCKED"]);

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json(
      { success: false, error: { message: "अनधिकृत अनुरोध।" } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const statusParam = new URL(request.url).searchParams.get("status");
  const statusResult =
    statusParam === null || statusParam === "ALL"
      ? null
      : statusSchema.safeParse(statusParam);

  if (statusResult && !statusResult.success) {
    return Response.json(
      { success: false, error: { message: "अमान्य अनुरोध।" } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const applications = await prisma.karyakartaApplication.findMany({
    where:
      statusResult?.success && statusResult.data
        ? { status: statusResult.data }
        : undefined,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      applicationReference: true,
      fullName: true,
      mobile: true,
      district: true,
      state: true,
      status: true,
      createdAt: true,
    },
  });

  return Response.json(
    { success: true, data: applications },
    { headers: { "Cache-Control": "no-store" } },
  );
}
