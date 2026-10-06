import "server-only";

import { prisma } from "@/lib/prisma";
import {
  type KaryakartaSessionPayload,
  verifyKaryakartaSession,
} from "@/lib/auth/karyakarta-session";
import { isSakshamKaryakartaEligible } from "@/lib/saksham-karyakarta-eligibility";

export type CurrentKaryakarta = {
  id: string;
  regNo: string;
  name: string;
  phone: string;
  profileStatus: "ACTIVE";
  status: "APPROVED";
};

export async function getCurrentKaryakarta(): Promise<CurrentKaryakarta | null> {
  const session: KaryakartaSessionPayload | null = await verifyKaryakartaSession();
  if (!session) return null;

  const karyakarta = await prisma.karyakarta.findUnique({
    where: { regNo: session.regNo },
    select: {
      id: true,
      regNo: true,
      name: true,
      phone: true,
      profileStatus: true,
      status: true,
      isPublicProfile: true,
      isEmergencyHidden: true,
      archivedAt: true,
      registrations: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { status: true, expiryDate: true },
      },
    },
  });

  const registration = karyakarta?.registrations[0] ?? null;
  if (
    !karyakarta ||
    !isSakshamKaryakartaEligible({
      profileStatus: karyakarta.profileStatus,
      memberStatus: karyakarta.status,
      isPublicProfile: karyakarta.isPublicProfile,
      isEmergencyHidden: karyakarta.isEmergencyHidden,
      archivedAt: karyakarta.archivedAt,
      registrationStatus: registration?.status ?? null,
      registrationExpiryDate: registration?.expiryDate ?? null,
    })
  ) {
    return null;
  }

  return {
    id: karyakarta.id,
    regNo: karyakarta.regNo,
    name: karyakarta.name,
    phone: karyakarta.phone,
    profileStatus: "ACTIVE",
    status: "APPROVED",
  };
}
