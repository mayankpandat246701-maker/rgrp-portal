import type { AdminRole, Prisma } from "@prisma/client";
import type { AdminSessionPayload } from "@/lib/auth/admin-session";

export function canManageLeadership(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "CONTENT_ADMIN" ||
    role === "CONTENT_EDITOR"
  );
}

export function canPublishContent(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "CONTENT_ADMIN"
  );
}

export function canManageEditorialContent(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "STATE_ADMIN" ||
    role === "DISTRICT_ADMIN" ||
    role === "CONTENT_ADMIN" ||
    role === "CONTENT_EDITOR"
  );
}

export function hasEditorialScope(
  admin: AdminSessionPayload,
  state: string | null | undefined,
  district: string | null | undefined,
): boolean {
  if (
    admin.role === "SUPER_ADMIN" ||
    admin.role === "NATIONAL_ADMIN" ||
    admin.role === "CONTENT_ADMIN" ||
    admin.role === "CONTENT_EDITOR"
  ) {
    return true;
  }
  return hasKaryakartaScope(admin, state, district);
}

export function canPublishScopedContent(
  admin: AdminSessionPayload,
  state: string | null | undefined,
  district: string | null | undefined,
): boolean {
  if (canPublishContent(admin.role)) return true;
  return (
    (admin.role === "STATE_ADMIN" || admin.role === "DISTRICT_ADMIN") &&
    hasKaryakartaScope(admin, state, district)
  );
}

export function canManageCertificates(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "STATE_ADMIN" ||
    role === "DISTRICT_ADMIN"
  );
}

export function canManageOfficialLinks(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "STATE_ADMIN" ||
    role === "DISTRICT_ADMIN"
  );
}

export function canManageOfficialLink(
  admin: AdminSessionPayload,
  level: "NATIONAL" | "STATE" | "DISTRICT",
  state: string | null | undefined,
  district: string | null | undefined,
): boolean {
  if (level === "NATIONAL") {
    return admin.role === "SUPER_ADMIN" || admin.role === "NATIONAL_ADMIN";
  }
  return hasKaryakartaScope(admin, state, district);
}

export function officialLinkManagementWhere(
  admin: AdminSessionPayload,
): Prisma.OfficialSocialLinkWhereInput {
  if (admin.role === "SUPER_ADMIN" || admin.role === "NATIONAL_ADMIN") {
    return {};
  }
  if (admin.role === "STATE_ADMIN" && admin.assignedState) {
    return {
      state: admin.assignedState,
      level: { in: ["STATE", "DISTRICT"] },
    };
  }
  if (
    admin.role === "DISTRICT_ADMIN" &&
    admin.assignedState &&
    admin.assignedDistrict
  ) {
    return {
      state: admin.assignedState,
      district: admin.assignedDistrict,
      level: "DISTRICT",
    };
  }
  return { id: { in: [] } };
}

export function canViewApplications(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "CONTENT_ADMIN" ||
    role === "VIEWER"
  );
}

export function canManageKaryakarta(role: AdminRole): boolean {
  return (
    role === "SUPER_ADMIN" ||
    role === "NATIONAL_ADMIN" ||
    role === "STATE_ADMIN" ||
    role === "DISTRICT_ADMIN"
  );
}

export function hasKaryakartaScope(
  admin: AdminSessionPayload,
  state: string | null | undefined,
  district: string | null | undefined,
): boolean {
  if (admin.role === "SUPER_ADMIN" || admin.role === "NATIONAL_ADMIN") {
    return true;
  }
  if (admin.role === "STATE_ADMIN") {
    return Boolean(admin.assignedState && state === admin.assignedState);
  }
  if (admin.role === "DISTRICT_ADMIN") {
    return Boolean(
      admin.assignedState &&
        admin.assignedDistrict &&
        state === admin.assignedState &&
        district === admin.assignedDistrict,
    );
  }
  return false;
}

export function karyakartaScopeWhere(admin: AdminSessionPayload) {
  if (admin.role === "STATE_ADMIN" && admin.assignedState) {
    return { state: admin.assignedState };
  }
  if (
    admin.role === "DISTRICT_ADMIN" &&
    admin.assignedState &&
    admin.assignedDistrict
  ) {
    return {
      state: admin.assignedState,
      district: admin.assignedDistrict,
    };
  }
  if (admin.role === "STATE_ADMIN" || admin.role === "DISTRICT_ADMIN") {
    return { id: { in: [] } };
  }
  return {};
}
