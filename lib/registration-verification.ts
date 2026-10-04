export type RegistrationVerificationStatus =
  | "ACTIVE"
  | "EXPIRED"
  | "SUSPENDED"
  | "REVOKED"
  | "NOT_FOUND";

export function resolveRegistrationVerificationStatus(input: {
  registrationStatus: string | null;
  profileStatus: string | null;
  isPublicProfile: boolean;
  isEmergencyHidden?: boolean;
  archivedAt: Date | null;
  expiryDate: Date | null;
  now?: Date;
}): RegistrationVerificationStatus {
  const publiclyIdentified =
    input.isPublicProfile &&
    !input.isEmergencyHidden &&
    input.archivedAt === null;
  if (!publiclyIdentified) return "NOT_FOUND";
  if (input.profileStatus === "SUSPENDED") return "SUSPENDED";
  if (input.profileStatus === "REVOKED") return "REVOKED";
  if (input.profileStatus === "EXPIRED") return "EXPIRED";
  if (input.profileStatus !== "ACTIVE" || !input.registrationStatus) {
    return "NOT_FOUND";
  }
  if (
    input.registrationStatus === "EXPIRED" ||
    Boolean(input.expiryDate && input.expiryDate <= (input.now ?? new Date()))
  ) {
    return "EXPIRED";
  }
  if (input.registrationStatus === "SUSPENDED") return "SUSPENDED";
  if (input.registrationStatus === "REVOKED") return "REVOKED";
  if (input.registrationStatus === "ACTIVE") return "ACTIVE";
  return "NOT_FOUND";
}
