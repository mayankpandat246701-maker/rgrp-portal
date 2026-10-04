import "server-only";

import type { AdminSessionPayload } from "@/lib/auth/admin-session";
import { type AdminCapability, adminCan } from "@/lib/auth/permissions";
import { getCurrentAdmin } from "@/lib/auth/require-admin";

const noStoreHeaders = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
};

export function jsonOk(data: Record<string, unknown> = {}, status = 200): Response {
  return Response.json({ success: true, ...data }, { status, headers: noStoreHeaders });
}

export function jsonError(message: string, status: number): Response {
  return Response.json(
    { success: false, error: { message } },
    { status, headers: noStoreHeaders },
  );
}

export const GENERIC_ERROR = "कुछ गलत हो गया। कृपया कुछ देर बाद फिर प्रयास करें।";

/** Returns the authorised admin, or a ready-to-return error Response. */
export async function authorizeAdmin(
  capability: AdminCapability,
): Promise<{ admin: AdminSessionPayload } | { response: Response }> {
  const admin = await getCurrentAdmin();
  if (!admin) {
    return { response: jsonError("कृपया पहले लॉगिन करें।", 401) };
  }
  if (!adminCan(admin.role, capability)) {
    return { response: jsonError("आपको यह कार्य करने की अनुमति नहीं है।", 403) };
  }
  return { admin };
}
