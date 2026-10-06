// Pure helper (no "server-only") so `next.config.ts` can import it to build a
// narrow Content-Security-Policy source for public image hosts.

export const PUBLIC_IMAGE_HOST_SUFFIX = ".public.blob.vercel-storage.com";

/**
 * Vercel Blob read-write tokens have the shape `vercel_blob_rw_<storeId>_<secret>`.
 * The store id is the fourth underscore-separated segment and determines the
 * exact store host: `<storeId>.public.blob.vercel-storage.com`.
 */
export function parseStoreIdFromBlobToken(
  token: string | undefined | null,
): string | null {
  const trimmed = token?.trim();
  if (!trimmed) return null;
  const storeId = trimmed.split("_")[3];
  return storeId && /^[A-Za-z0-9]+$/.test(storeId) ? storeId : null;
}

/** Exact https host of the public image store, or null when no token is set. */
export function publicImageStoreHost(
  token: string | undefined | null,
): string | null {
  const storeId = parseStoreIdFromBlobToken(token);
  return storeId ? `${storeId}${PUBLIC_IMAGE_HOST_SUFFIX}` : null;
}
