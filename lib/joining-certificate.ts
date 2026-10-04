export function isJoiningCertificateEligible(input: {
  profileStatus: string;
  registrationStatus: string;
  registrationExpiryDate: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();
  return (
    input.profileStatus === "ACTIVE" &&
    input.registrationStatus === "ACTIVE" &&
    (!input.registrationExpiryDate || input.registrationExpiryDate > now)
  );
}

export function isCertificateRegistrationEligible(input: {
  profileStatus: string;
  certificateStatus: string;
  registrationStatus: string;
  registrationExpiryDate: Date | null;
  now?: Date;
}): boolean {
  return (
    input.certificateStatus === "ACTIVE" &&
    isJoiningCertificateEligible(input)
  );
}
