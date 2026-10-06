export type SakshamKaryakartaEligibilityInput = {
  profileStatus: string;
  memberStatus: string;
  isPublicProfile: boolean;
  isEmergencyHidden: boolean;
  archivedAt: Date | null;
  registrationStatus: string | null;
  registrationExpiryDate: Date | null;
  now?: Date;
};

export function isSakshamKaryakartaEligible(
  input: SakshamKaryakartaEligibilityInput,
): boolean {
  const now = input.now ?? new Date();

  return (
    input.profileStatus === "ACTIVE" &&
    input.memberStatus === "APPROVED" &&
    input.isPublicProfile === true &&
    input.isEmergencyHidden === false &&
    input.archivedAt === null &&
    input.registrationStatus === "ACTIVE" &&
    (!input.registrationExpiryDate || input.registrationExpiryDate > now)
  );
}
