export type ApiResult<T = Record<string, unknown>> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const FALLBACK_MESSAGE = "कुछ गलत हो गया। कृपया फिर से प्रयास करें।";

export async function callApi<T = Record<string, unknown>>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<ApiResult<T>> {
  const { json, headers, ...rest } = init;
  try {
    const response = await fetch(url, {
      ...rest,
      headers: json !== undefined ? { "Content-Type": "application/json", ...headers } : headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    });
    const payload: unknown = await response.json().catch(() => null);
    const record = (payload ?? {}) as { success?: boolean; error?: { message?: string } };
    if (!response.ok || record.success !== true) {
      return { ok: false, message: record.error?.message || FALLBACK_MESSAGE };
    }
    return { ok: true, data: payload as T };
  } catch {
    return { ok: false, message: "नेटवर्क त्रुटि। कृपया इंटरनेट कनेक्शन जाँचें।" };
  }
}

export function formatDate(value: string | Date | null | undefined, withTime = false): string {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}
