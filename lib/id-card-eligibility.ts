import { isJoiningCertificateEligible } from "@/lib/joining-certificate";

export type IdCardEligibilityInput = {
  profileStatus: string;
  archivedAt: Date | null;
  registrationStatus: string;
  registrationExpiryDate: Date | null;
  now?: Date;
};

export function isIdCardEligible(input: IdCardEligibilityInput): boolean {
  if (input.archivedAt !== null) return false;

  return isJoiningCertificateEligible({
    profileStatus: input.profileStatus,
    registrationStatus: input.registrationStatus,
    registrationExpiryDate: input.registrationExpiryDate,
    now: input.now,
  });
}
