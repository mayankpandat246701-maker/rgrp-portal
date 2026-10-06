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

/**
 * OIDC-connected stores expose a store id instead of a token
 * (e.g. BLOB_STORE_ID / BLOB_PUBLIC__STORE_ID). The SDK accepts either the
 * `store_<id>` or the bare `<id>` form and strips the prefix when building
 * blob URLs, so do the same here.
 */
export function normalizeStoreId(
  storeId: string | undefined | null,
): string | null {
  const trimmed = storeId?.trim();
  if (!trimmed) return null;
  const bare = trimmed.startsWith("store_")
    ? trimmed.slice("store_".length)
    : trimmed;
  return bare && /^[A-Za-z0-9]+$/.test(bare) ? bare : null;
}

/**
 * Exact https host of the public image store, or null when neither a
 * read-write token nor a store id is configured. Pass either auth form.
 */
export function publicImageStoreHost(
  token: string | undefined | null,
  storeId: string | undefined | null,
): string | null {
  const idFromToken = parseStoreIdFromBlobToken(token);
  if (idFromToken) return `${idFromToken}${PUBLIC_IMAGE_HOST_SUFFIX}`;
  const idFromStoreId = normalizeStoreId(storeId);
  return idFromStoreId
    ? `${idFromStoreId}${PUBLIC_IMAGE_HOST_SUFFIX}`
    : null;
}
