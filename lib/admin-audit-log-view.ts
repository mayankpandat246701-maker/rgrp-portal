import "server-only";

import { AdminAuditAction } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const ADMIN_AUDIT_PAGE_SIZE = 100;

export type SafeAdminAuditLog = {
  id: string;
  createdAt: Date;
  action: AdminAuditAction;
  actingAdmin: { name: string; email: string };
  applicationReference: string | null;
  karyakartaRegNo: string | null;
  summary: string;
};

const summaries: Record<AdminAuditAction, string> = {
  APPLICATION_APPROVED: "आवेदन स्वीकृत किया गया",
  APPLICATION_BLOCKED: "आवेदन अस्वीकृत किया गया",
  DOCUMENTS_VERIFIED: "दस्तावेज़ सत्यापित किए गए",
  DOCUMENTS_REJECTED: "दस्तावेज़ अस्वीकृत किए गए",
  ID_CARD_TEMPLATE_UPLOADED: "पहचान-पत्र टेम्पलेट सक्रिय किया गया",
  QR_GENERATED: "सत्यापन QR तैयार किया गया",
  ID_CARD_GENERATED: "पहचान पत्र खोजा गया",
  ID_CARD_DOWNLOADED: "पहचान पत्र डाउनलोड किया गया",
};

export async function listSafeAdminAuditLogs(options: {
  action?: AdminAuditAction;
  page?: number;
}): Promise<{ entries: SafeAdminAuditLog[]; hasMore: boolean }> {
  const page = Math.max(1, Math.min(options.page ?? 1, 10_000));
  const logs = await prisma.adminAuditLog.findMany({
    where: options.action ? { action: options.action } : undefined,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * ADMIN_AUDIT_PAGE_SIZE,
    take: ADMIN_AUDIT_PAGE_SIZE + 1,
    select: {
      id: true,
      createdAt: true,
      action: true,
      applicationId: true,
      karyakartaId: true,
      admin: { select: { name: true, email: true } },
    },
  });

  const visibleLogs = logs.slice(0, ADMIN_AUDIT_PAGE_SIZE);
  const applicationIds = [
    ...new Set(
      visibleLogs
        .map((log) => log.applicationId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const applications = applicationIds.length
    ? await prisma.karyakartaApplication.findMany({
        where: { id: { in: applicationIds } },
        select: { id: true, applicationReference: true },
      })
    : [];
  const referencesById = new Map(
    applications.map((application) => [
      application.id,
      application.applicationReference,
    ]),
  );
  const karyakartaIds = [
    ...new Set(
      visibleLogs
        .map((log) => log.karyakartaId)
        .filter((id): id is string => id !== null),
    ),
  ];
  const karyakartas = karyakartaIds.length
    ? await prisma.karyakarta.findMany({
        where: { id: { in: karyakartaIds } },
        select: { id: true, regNo: true },
      })
    : [];
  const regNoById = new Map(
    karyakartas.map((karyakarta) => [karyakarta.id, karyakarta.regNo]),
  );

  return {
    entries: visibleLogs.map((log) => ({
      id: log.id,
      createdAt: log.createdAt,
      action: log.action,
      actingAdmin: log.admin,
      applicationReference: log.applicationId
        ? (referencesById.get(log.applicationId) ?? null)
        : null,
      karyakartaRegNo: log.karyakartaId
        ? (regNoById.get(log.karyakartaId) ?? null)
        : null,
      summary: summaries[log.action],
    })),
    hasMore: logs.length > ADMIN_AUDIT_PAGE_SIZE,
  };
}
