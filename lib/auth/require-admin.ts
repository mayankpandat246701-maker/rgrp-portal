import "server-only";

import { prisma } from "@/lib/prisma";
import {
  type AdminSessionPayload,
  verifyAdminSession,
} from "@/lib/auth/admin-session";

export async function getCurrentAdmin(): Promise<AdminSessionPayload | null> {
  const session = await verifyAdminSession();
  if (!session) return null;

  const admin = await prisma.admin.findUnique({
    where: { id: session.id, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return admin;
}

export async function requireAdmin(): Promise<AdminSessionPayload | null> {
  return getCurrentAdmin();
}
