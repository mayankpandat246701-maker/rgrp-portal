import "server-only";

import { prisma } from "@/lib/prisma";
import {
  type KaryakartaSessionPayload,
  verifyKaryakartaSession,
} from "@/lib/auth/karyakarta-session";

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
      archivedAt: true,
    },
  });

  if (!karyakarta) return null;
  if (karyakarta.profileStatus !== "ACTIVE") return null;
  if (karyakarta.status !== "APPROVED") return null;
  if (karyakarta.archivedAt !== null) return null;

  return {
    id: karyakarta.id,
    regNo: karyakarta.regNo,
    name: karyakarta.name,
    phone: karyakarta.phone,
    profileStatus: "ACTIVE",
    status: "APPROVED",
  };
}
