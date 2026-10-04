import { NextResponse } from "next/server";
import { KaryakartaProfileStatus, Prisma, RegistrationCardStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  canManageKaryakarta,
  canPublishContent,
  hasKaryakartaScope,
  karyakartaScopeWhere,
} from "@/lib/auth/admin-permissions";
import {
  createKaryakartaSlug,
  generateRegistrationNumber,
  karyakartaInputSchema,
} from "@/lib/karyakarta-validation";
import { prisma } from "@/lib/prisma";

const selection = {
  id: true,
  slug: true,
  regNo: true,
  name: true,
  phone: true,
  email: true,
  designation: true,
  daitva: true,
  state: true,
  district: true,
  tehsil: true,
  cityOrVillage: true,
  photoUrl: true,
  publicBio: true,
  joiningDate: true,
  appointmentStartDate: true,
  appointmentEndDate: true,
  isPublicProfile: true,
  isEmergencyHidden: true,
  isFeatured: true,
  profileStatus: true,
  displayOrder: true,
  instagramUrl: true,
  facebookUrl: true,
  youtubeUrl: true,
  whatsappContactUrl: true,
  adminNotes: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  registrations: {
    orderBy: { createdAt: "desc" as const },
    select: {
      id: true,
      registrationNumber: true,
      status: true,
      issueDate: true,
      expiryDate: true,
      revokedReason: true,
      createdAt: true,
    },
  },
};

function jsonError(error: string, status: number) {
  return NextResponse.json(
    { error },
    { status, headers: { "Cache-Control": "no-store" } },
  );
}

function validationError(issues: Array<{ path: PropertyKey[]; message: string }>) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string" && !fieldErrors[field]) {
      fieldErrors[field] = issue.message;
    }
  }
  return NextResponse.json(
    { error: "Check the member details and try again.", fieldErrors },
    { status: 400, headers: { "Cache-Control": "no-store" } },
  );
}

function publicPaths(slug: string) {
  revalidatePath("/saksham-karyakarta");
  revalidatePath(`/saksham-karyakarta/${slug}`);
  revalidatePath("/admin/karyakartas");
  revalidatePath("/admin/dashboard");
}

export async function GET(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("You are not authorized to manage karyakartas.", 403);
  }

  const params = new URL(request.url).searchParams;
  const requestedPage = Number(params.get("page"));
  const page = Math.max(
    1,
    Math.min(10_000, Number.isSafeInteger(requestedPage) ? requestedPage : 1),
  );
  const search = params.get("q")?.trim().slice(0, 100);
  const status = params.get("status");
  const state = params.get("state")?.trim();
  const district = params.get("district")?.trim();
  const filters: Prisma.KaryakartaWhereInput = {
    ...(status && Object.values(KaryakartaProfileStatus).includes(status as KaryakartaProfileStatus)
      ? { profileStatus: status as KaryakartaProfileStatus }
      : {}),
    ...(state ? { state } : {}),
    ...(district ? { district } : {}),
    ...(search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { regNo: { contains: search.toUpperCase(), mode: "insensitive" } },
            { state: { contains: search, mode: "insensitive" } },
            { district: { contains: search, mode: "insensitive" } },
            { daitva: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
  };
  const where: Prisma.KaryakartaWhereInput = {
    AND: [karyakartaScopeWhere(admin), filters],
  };
  let members;
  let total;
  try {
    [members, total] = await prisma.$transaction([
      prisma.karyakarta.findMany({
        where,
        select: selection,
        orderBy: [{ updatedAt: "desc" }],
        take: 50,
        skip: (page - 1) * 50,
      }),
      prisma.karyakarta.count({ where }),
    ]);
  } catch {
    console.error("Karyakarta list failed", {
      route: "/api/admin/karyakartas",
      code: "KARYAKARTA_LIST_FAILED",
    });
    return jsonError("Unable to load karyakartas right now.", 500);
  }

  return NextResponse.json(
    { members, total, page, pageSize: 50 },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("You are not authorized to manage karyakartas.", 403);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body.", 400);
  }
  const parsed = karyakartaInputSchema.safeParse(body);
  if (!parsed.success) return validationError(parsed.error.issues);

  const input = parsed.data;
  if (!hasKaryakartaScope(admin, input.state, input.district)) {
    return jsonError("You are not authorized to manage this territory.", 403);
  }
  if (
    (!canPublishContent(admin.role) &&
      (input.profileStatus === "ACTIVE" ||
        input.registrationStatus === "ACTIVE" ||
        ["SUSPENDED", "REVOKED"].includes(input.profileStatus) ||
        input.profileStatus === "REJECTED" ||
        ["SUSPENDED", "REVOKED"].includes(input.registrationStatus))) ||
    (input.registrationStatus === "ACTIVE" &&
      input.profileStatus !== "ACTIVE")
  ) {
    return jsonError("This member requires authorized approval before activation.", 403);
  }
  if (
    input.isPublicProfile &&
    input.profileStatus !== "ACTIVE"
  ) {
    return jsonError("Only active member profiles can be marked public.", 400);
  }

  const registrationNumber =
    input.registrationNumber ||
    generateRegistrationNumber(input.state, input.district);
  const slug = createKaryakartaSlug(input.name, registrationNumber);
  try {
    const created = await prisma.$transaction(async (tx) => {
      const member = await tx.karyakarta.create({
        data: {
          regNo: registrationNumber,
          slug,
          name: input.name,
          phone: input.phone,
          email: input.email || null,
          designation: input.daitva,
          daitva: input.daitva,
          state: input.state,
          district: input.district,
          tehsil: input.tehsil || null,
          cityOrVillage: input.cityOrVillage || null,
          publicBio: input.publicBio || null,
          joiningDate: input.joiningDate,
          appointmentStartDate: input.appointmentStartDate,
          appointmentEndDate: input.appointmentEndDate,
          isEmergencyHidden: input.isEmergencyHidden,
          isFeatured: input.isFeatured,
          isPublicProfile:
            input.profileStatus === "ACTIVE" && input.isPublicProfile,
          profileStatus: input.profileStatus,
          displayOrder: input.displayOrder,
          instagramUrl: input.instagramUrl,
          facebookUrl: input.facebookUrl,
          youtubeUrl: input.youtubeUrl,
          whatsappContactUrl: input.whatsappContactUrl,
          adminNotes: input.adminNotes || null,
          createdById: admin.id,
          updatedById: admin.id,
          status:
            input.profileStatus === "ACTIVE"
              ? "APPROVED"
              : ["SUSPENDED", "REVOKED"].includes(input.profileStatus)
                ? "BLOCKED"
                : input.profileStatus === "REJECTED"
                  ? "REJECTED"
                : ["INACTIVE", "EXPIRED", "ARCHIVED"].includes(input.profileStatus)
                  ? "INACTIVE"
                  : "PENDING",
          approvedAt: input.profileStatus === "ACTIVE" ? new Date() : null,
          registrations: {
            create: {
              registrationNumber,
              status: input.registrationStatus as RegistrationCardStatus,
              issueDate: input.issueDate,
              expiryDate: input.expiryDate,
              revokedReason: input.registrationAdminReason || null,
              createdById: admin.id,
            },
          },
        },
        select: selection,
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action: "KARYAKARTA_CREATED",
          entity: "Karyakarta",
          entityId: member.id,
          metadata: {
            profileStatus: input.profileStatus,
            isEmergencyHidden: input.isEmergencyHidden,
            isFeatured: input.isFeatured,
            state: input.state,
            district: input.district,
          },
        },
      });
      return member;
    });
    publicPaths(created.slug);
    return NextResponse.json(
      { member: created },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Phone, email, or registration number is already in use.", 409);
    }
    console.error("Karyakarta create failed", {
      route: "/api/admin/karyakartas",
      code: "KARYAKARTA_CREATE_FAILED",
    });
    return jsonError("Unable to save the member right now.", 500);
  }
}
