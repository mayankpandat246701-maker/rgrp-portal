import "server-only";

import type { AuditActorType, AuditResult, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const AUDIT_ACTIONS = {
  ID_CARD_UPLOAD: "ID_CARD_UPLOAD",
  ID_CARD_REPLACE: "ID_CARD_REPLACE",
  ID_CARD_REMOVE: "ID_CARD_REMOVE",
  ID_CARD_DOWNLOAD: "ID_CARD_DOWNLOAD",
  KARYAKARTA_CREATE: "KARYAKARTA_CREATE",
  KARYAKARTA_UPDATE: "KARYAKARTA_UPDATE",
  KARYAKARTA_DEACTIVATE: "KARYAKARTA_DEACTIVATE",
  KARYAKARTA_DELETE: "KARYAKARTA_DELETE",
  KARYAKARTA_SELF_UPDATE: "KARYAKARTA_SELF_UPDATE",
  KARYAKARTA_LOGIN: "KARYAKARTA_LOGIN",
  LEADER_CREATE: "LEADER_CREATE",
  LEADER_UPDATE: "LEADER_UPDATE",
  LEADER_DELETE: "LEADER_DELETE",
  LEADER_REORDER: "LEADER_REORDER",
} as const;

export type AuditAction = (typeof AUDIT_ACTIONS)[keyof typeof AUDIT_ACTIONS];

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  ID_CARD_UPLOAD: "ID कार्ड अपलोड",
  ID_CARD_REPLACE: "ID कार्ड बदला गया",
  ID_CARD_REMOVE: "ID कार्ड हटाया गया",
  ID_CARD_DOWNLOAD: "ID कार्ड डाउनलोड",
  KARYAKARTA_CREATE: "कार्यकर्ता जोड़ा गया",
  KARYAKARTA_UPDATE: "कार्यकर्ता संपादित",
  KARYAKARTA_DEACTIVATE: "कार्यकर्ता निष्क्रिय",
  KARYAKARTA_DELETE: "कार्यकर्ता स्थायी रूप से हटाया गया",
  KARYAKARTA_SELF_UPDATE: "स्व-प्रोफ़ाइल अपडेट",
  KARYAKARTA_LOGIN: "कार्यकर्ता लॉगिन",
  LEADER_CREATE: "मुख्य व्यक्ति जोड़ा गया",
  LEADER_UPDATE: "मुख्य व्यक्ति संपादित",
  LEADER_DELETE: "मुख्य व्यक्ति हटाया गया",
  LEADER_REORDER: "क्रम बदला गया",
};

type AuditEntry = {
  actorType: AuditActorType;
  actorId?: string | null;
  actorLabel?: string | null;
  action: AuditAction;
  result: AuditResult;
  regNo?: string | null;
  entityId?: string | null;
  request?: Request;
  metadata?: Prisma.InputJsonValue;
};

export function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

/** Audit writes must never break the user-facing action, so failures are logged and swallowed. */
export async function writeAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorType: entry.actorType,
        actorId: entry.actorId ?? null,
        actorLabel: entry.actorLabel ?? null,
        action: entry.action,
        result: entry.result,
        regNo: entry.regNo ?? null,
        entityId: entry.entityId ?? null,
        ip: entry.request ? getRequestIp(entry.request) : null,
        metadata: entry.metadata,
      },
    });
  } catch (error) {
    console.error("Audit log write failed", {
      action: entry.action,
      reason: error instanceof Error ? error.name : "unknown",
    });
  }
}
