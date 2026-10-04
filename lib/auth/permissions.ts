import type { AdminRole } from "@prisma/client";

export type AdminCapability =
  | "view"
  | "manageLeaders"
  | "manageKaryakarta"
  | "manageIdCards"
  | "deleteRecords";

const capabilityRoles: Record<AdminCapability, readonly AdminRole[]> = {
  view: ["SUPER_ADMIN", "NATIONAL_ADMIN", "CONTENT_ADMIN", "VIEWER"],
  manageLeaders: ["SUPER_ADMIN", "NATIONAL_ADMIN", "CONTENT_ADMIN"],
  manageKaryakarta: ["SUPER_ADMIN", "NATIONAL_ADMIN"],
  manageIdCards: ["SUPER_ADMIN", "NATIONAL_ADMIN"],
  deleteRecords: ["SUPER_ADMIN"],
};

export function adminCan(role: AdminRole, capability: AdminCapability): boolean {
  return capabilityRoles[capability].includes(role);
}
