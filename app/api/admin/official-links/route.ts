import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import {
  canManageOfficialLink,
  canManageOfficialLinks,
  officialLinkManagementWhere,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { officialLinkSchema } from "@/lib/official-link-validation";
import { prisma } from "@/lib/prisma";

function errorResponse(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function invalidate() {
  revalidatePath("/official-links");
  revalidatePath("/admin/official-links");
  revalidatePath("/admin/dashboard");
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageOfficialLinks(admin.role)) {
    return errorResponse("आपको आधिकारिक लिंक प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  let links;
  try {
    links = await prisma.officialSocialLink.findMany({
      where: officialLinkManagementWhere(admin),
      orderBy: [{ level: "asc" }, { displayOrder: "asc" }, { title: "asc" }],
    });
  } catch {
    console.error("Official link list failed", {
      route: "/api/admin/official-links",
      code: "OFFICIAL_LINK_LIST_FAILED",
    });
    return errorResponse("Unable to load official links.", 500);
  }
  return NextResponse.json({ links }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return errorResponse("पहले प्रशासक के रूप में प्रवेश करें।", 401);
  if (!canManageOfficialLinks(admin.role)) {
    return errorResponse("आपको आधिकारिक लिंक प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("अनुरोध का प्रारूप मान्य नहीं है।", 400);
  }
  const parsed = officialLinkSchema.safeParse(body);
  if (!parsed.success) return errorResponse("आधिकारिक लिंक की जानकारी जाँचें।", 400);
  if (!canManageOfficialLink(admin, parsed.data.level, parsed.data.state, parsed.data.district)) {
    return errorResponse("आपको इस क्षेत्र का आधिकारिक लिंक प्रबंधित करने की अनुमति नहीं है।", 403);
  }
  try {
    const link = await prisma.officialSocialLink.create({
      data: {
        ...parsed.data,
        createdById: admin.id,
      },
    });
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "OFFICIAL_LINK_CREATED",
        entity: "OfficialSocialLink",
        entityId: link.id,
        metadata: {
          level: link.level,
          platform: link.platform,
          state: link.state,
          district: link.district,
        },
      },
    });
    invalidate();
    return NextResponse.json(
      { link },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return errorResponse("यह आधिकारिक लिंक पहले से पंजीकृत है।", 409);
    }
    console.error("Official link creation failed", {
      route: "/api/admin/official-links",
      code: "OFFICIAL_LINK_CREATE_FAILED",
    });
    return errorResponse("आधिकारिक लिंक सहेजा नहीं जा सका।", 500);
  }
}
