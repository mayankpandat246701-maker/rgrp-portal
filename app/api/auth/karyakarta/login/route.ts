import bcrypt from "bcryptjs";
import { z } from "zod";
import { AUDIT_ACTIONS, getRequestIp, writeAuditLog } from "@/lib/audit-log";
import { GENERIC_ERROR, jsonError, jsonOk } from "@/lib/api-response";
import { createKaryakartaSession } from "@/lib/auth/karyakarta-session";
import { prisma } from "@/lib/prisma";
import {
  checkAdminLoginRateLimit,
  clearAdminLoginFailures,
  recordAdminLoginFailure,
} from "@/lib/rate-limit/admin-login";

const loginSchema = z.object({
  regNo: z.string().trim().min(1).max(40),
  password: z.string().min(1).max(72),
});

const INVALID_MESSAGE = "पंजीकरण संख्या या पासवर्ड गलत है।";

let dummyHash: string | null = null;
function getDummyHash(): string {
  dummyHash ??= bcrypt.hashSync("rgrp-timing-equaliser", 10);
  return dummyHash;
}

export async function POST(request: Request) {
  const rateKey = `karyakarta:${getRequestIp(request)}`;

  try {
    const limit = await checkAdminLoginRateLimit(rateKey);
    if (!limit.allowed) {
      return jsonError("बहुत अधिक प्रयास। कृपया कुछ समय बाद फिर प्रयास करें।", 429);
    }

    const body: unknown = await request.json().catch(() => null);
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) return jsonError("कृपया पंजीकरण संख्या और पासवर्ड भरें।", 400);

    const regNo = parsed.data.regNo.toUpperCase();
    const karyakarta = await prisma.karyakarta.findFirst({
      where: { regNo: { equals: regNo, mode: "insensitive" } },
      select: { id: true, regNo: true, name: true, status: true, passwordHash: true },
    });

    const passwordMatches = await bcrypt.compare(
      parsed.data.password,
      karyakarta?.passwordHash ?? getDummyHash(),
    );

    if (!karyakarta || !karyakarta.passwordHash || !passwordMatches) {
      await recordAdminLoginFailure(rateKey);
      await writeAuditLog({
        actorType: "ANONYMOUS",
        action: AUDIT_ACTIONS.KARYAKARTA_LOGIN,
        result: "DENIED",
        regNo,
        request,
      });
      return jsonError(INVALID_MESSAGE, 401);
    }

    if (karyakarta.status !== "APPROVED") {
      await writeAuditLog({
        actorType: "KARYAKARTA",
        actorId: karyakarta.id,
        actorLabel: karyakarta.name,
        action: AUDIT_ACTIONS.KARYAKARTA_LOGIN,
        result: "DENIED",
        regNo: karyakarta.regNo,
        request,
        metadata: { reason: "status", status: karyakarta.status },
      });
      return jsonError("आपका खाता अभी सक्रिय नहीं है। कृपया संगठन कार्यालय से संपर्क करें।", 403);
    }

    await clearAdminLoginFailures(rateKey);
    await prisma.karyakarta.update({
      where: { id: karyakarta.id },
      data: { lastLoginAt: new Date() },
    });
    await createKaryakartaSession(karyakarta.id);
    await writeAuditLog({
      actorType: "KARYAKARTA",
      actorId: karyakarta.id,
      actorLabel: karyakarta.name,
      action: AUDIT_ACTIONS.KARYAKARTA_LOGIN,
      result: "SUCCESS",
      regNo: karyakarta.regNo,
      request,
    });

    return jsonOk();
  } catch (error) {
    console.error("Karyakarta login failed", { reason: error instanceof Error ? error.name : "unknown" });
    return jsonError(GENERIC_ERROR, 500);
  }
}
