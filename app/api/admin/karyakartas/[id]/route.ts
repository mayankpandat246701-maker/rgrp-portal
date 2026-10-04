import { NextResponse } from "next/server";
import {
  KaryakartaProfileStatus,
  Prisma,
  RegistrationCardStatus,
} from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  canManageKaryakarta,
  canPublishContent,
  hasKaryakartaScope,
} from "@/lib/auth/admin-permissions";
import {
  createKaryakartaSlug,
  karyakartaInputSchema,
} from "@/lib/karyakarta-validation";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ id: string }> };
const selectMember = {
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

function refresh(slug: string) {
  revalidatePath("/saksham-karyakarta");
  revalidatePath(`/saksham-karyakarta/${slug}`);
  revalidatePath("/admin/karyakartas");
  revalidatePath("/admin/dashboard");
}

export async function GET(_request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("You are not authorized to manage karyakartas.", 403);
  }
  const { id } = await context.params;
  let member;
  try {
    member = await prisma.karyakarta.findUnique({
      where: { id },
      select: selectMember,
    });
  } catch {
    console.error("Karyakarta read failed", {
      route: "/api/admin/karyakartas/[id]",
      code: "KARYAKARTA_READ_FAILED",
    });
    return jsonError("Unable to load this member right now.", 500);
  }
  if (!member) return jsonError("Member not found.", 404);
  if (!hasKaryakartaScope(admin, member.state, member.district)) {
    return jsonError("You are not authorized to manage this member.", 403);
  }
  return NextResponse.json({ member }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const admin = await requireAdmin();
  if (!admin) return jsonError("Authentication is required.", 401);
  if (!canManageKaryakarta(admin.role)) {
    return jsonError("You are not authorized to manage karyakartas.", 403);
  }
  const { id } = await context.params;
  let current;
  try {
    current = await prisma.karyakarta.findUnique({
      where: { id },
      select: {
        id: true,
        slug: true,
        state: true,
        district: true,
        regNo: true,
        profileStatus: true,
        isPublicProfile: true,
        isEmergencyHidden: true,
        registrations: {
          select: { registrationNumber: true, status: true },
        },
      },
    });
  } catch {
    console.error("Karyakarta update lookup failed", {
      route: "/api/admin/karyakartas/[id]",
      code: "KARYAKARTA_UPDATE_LOOKUP_FAILED",
    });
    return jsonError("Unable to update the member right now.", 500);
  }
  if (!current) return jsonError("Member not found.", 404);
  if (!hasKaryakartaScope(admin, current.state, current.district)) {
    return jsonError("You are not authorized to manage this member.", 403);
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
    input.isPublicProfile &&
    input.profileStatus !== "ACTIVE" &&
    !current.isPublicProfile
  ) {
    return jsonError("Only previously public profiles may retain visibility while inactive.", 400);
  }

  const submittedRegistrationNumber = input.registrationNumber || current.regNo;
  const registrationNumber =
    submittedRegistrationNumber.toUpperCase() === current.regNo.toUpperCase()
      ? current.regNo
      : submittedRegistrationNumber;
  const shouldReissue = registrationNumber !== current.regNo;
  const currentRegistration = current.registrations.find(
    (registration) => registration.registrationNumber === current.regNo,
  );
  if (
    !canPublishContent(admin.role) &&
    (["SUSPENDED", "REVOKED"].includes(input.profileStatus) ||
      input.profileStatus === "REJECTED" ||
      ["SUSPENDED", "REVOKED"].includes(input.registrationStatus) ||
      (input.profileStatus === "ACTIVE" && current.profileStatus !== "ACTIVE") ||
      (input.registrationStatus === "ACTIVE" &&
        currentRegistration?.status !== "ACTIVE") ||
      (shouldReissue && input.registrationStatus === "ACTIVE"))
  ) {
    return jsonError("This status change requires authorized approval.", 403);
  }
  if (
    input.registrationStatus === "ACTIVE" &&
    input.profileStatus !== "ACTIVE"
  ) {
    return jsonError("An active registration requires an active profile.", 400);
  }
  const slug = shouldReissue
    ? createKaryakartaSlug(input.name, registrationNumber)
    : current.slug;
  const action = shouldReissue
    ? "KARYAKARTA_REGISTRATION_REISSUED"
    : current.profileStatus !== input.profileStatus
      ? input.profileStatus === "ACTIVE"
        ? "KARYAKARTA_APPROVED"
        : input.profileStatus === "REJECTED"
          ? "KARYAKARTA_REJECTED"
          : input.profileStatus === "ARCHIVED"
            ? "KARYAKARTA_ARCHIVED"
            : input.profileStatus === "SUSPENDED"
              ? "KARYAKARTA_SUSPENDED"
              : current.profileStatus === "ARCHIVED"
                ? "KARYAKARTA_RESTORED"
                : "KARYAKARTA_STATUS_CHANGED"
      : current.isPublicProfile !== input.isPublicProfile
        ? input.isPublicProfile
          ? "KARYAKARTA_PUBLISHED"
          : "KARYAKARTA_UNPUBLISHED"
        : current.isEmergencyHidden !== input.isEmergencyHidden
          ? input.isEmergencyHidden
            ? "KARYAKARTA_EMERGENCY_HIDDEN"
            : "KARYAKARTA_EMERGENCY_UNHIDDEN"
        : currentRegistration?.status !== input.registrationStatus
          ? input.registrationStatus === "ACTIVE"
            ? "KARYAKARTA_REGISTRATION_ACTIVATED"
            : `KARYAKARTA_REGISTRATION_${input.registrationStatus}`
          : "KARYAKARTA_UPDATED";
  try {
    const member = await prisma.$transaction(async (tx) => {
      if (shouldReissue) {
        await tx.registrationCard.updateMany({
          where: {
            karyakartaId: id,
            registrationNumber: current.regNo,
            status: { not: "REVOKED" },
          },
          data: { status: "REISSUED" },
        });
        await tx.registrationCard.create({
          data: {
            karyakartaId: id,
            registrationNumber,
            status: input.registrationStatus as RegistrationCardStatus,
            issueDate: input.issueDate,
            expiryDate: input.expiryDate,
            ...(input.registrationAdminReason
              ? { revokedReason: input.registrationAdminReason }
              : {}),
            reissuedFromId:
              (await tx.registrationCard.findFirst({
                where: { karyakartaId: id, registrationNumber: current.regNo },
                select: { id: true },
              }))?.id ?? null,
            createdById: admin.id,
          },
        });
      } else {
        const activeRegistration = await tx.registrationCard.findFirst({
          where: { karyakartaId: id, registrationNumber: current.regNo },
          select: { id: true },
        });
        if (activeRegistration) {
          await tx.registrationCard.update({
            where: { id: activeRegistration.id },
            data: {
              status: input.registrationStatus as RegistrationCardStatus,
              issueDate: input.issueDate,
              expiryDate: input.expiryDate,
              ...(input.registrationAdminReason
                ? { revokedReason: input.registrationAdminReason }
                : {}),
            },
          });
        } else {
          await tx.registrationCard.create({
            data: {
              karyakartaId: id,
              registrationNumber,
              status: input.registrationStatus as RegistrationCardStatus,
              issueDate: input.issueDate,
              expiryDate: input.expiryDate,
              revokedReason: input.registrationAdminReason || null,
              createdById: admin.id,
            },
          });
        }
      }
      const updated = await tx.karyakarta.update({
        where: { id },
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
            (input.profileStatus === "ACTIVE" && input.isPublicProfile) ||
            (current.isPublicProfile &&
              input.isPublicProfile &&
              ["INACTIVE", "SUSPENDED", "REVOKED", "EXPIRED"].includes(
                input.profileStatus,
              )),
          profileStatus: input.profileStatus as KaryakartaProfileStatus,
          displayOrder: input.displayOrder,
          instagramUrl: input.instagramUrl,
          facebookUrl: input.facebookUrl,
          youtubeUrl: input.youtubeUrl,
          whatsappContactUrl: input.whatsappContactUrl,
          adminNotes: input.adminNotes || null,
          archivedAt:
            input.profileStatus === "ARCHIVED" ? new Date() : null,
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
        },
        select: selectMember,
      });
      await tx.adminActivity.create({
        data: {
          adminId: admin.id,
          action,
          entity: "Karyakarta",
          entityId: id,
          metadata: {
            before: {
              profileStatus: current.profileStatus,
              isEmergencyHidden: current.isEmergencyHidden,
              registrationStatus: currentRegistration?.status ?? "UNKNOWN",
              state: current.state,
              district: current.district,
            },
            after: {
              profileStatus: input.profileStatus,
              isEmergencyHidden: input.isEmergencyHidden,
              registrationStatus: input.registrationStatus,
              state: input.state,
              district: input.district,
            },
            profileStatus: input.profileStatus,
            registrationStatus: input.registrationStatus,
            registrationReissued: shouldReissue,
          },
        },
      });
      return updated;
    });
    refresh(current.slug);
    refresh(member.slug);
    return NextResponse.json({ member }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return jsonError("Phone, email, or registration number is already in use.", 409);
    }
    console.error("Karyakarta update failed", {
      route: "/api/admin/karyakartas/[id]",
      code: "KARYAKARTA_UPDATE_FAILED",
    });
    return jsonError("Unable to update the member right now.", 500);
  }
}
