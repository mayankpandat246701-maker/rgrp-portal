import "server-only";

import { del, get, put } from "@vercel/blob";

import {
  StorageUnavailableError,
  type PrivateStorageProvider,
} from "@/lib/storage/types";

/**
 * Auth for the PRIVATE document store.
 * - Local development: an explicit `BLOB_READ_WRITE_TOKEN` (e.g. from
 *   .env.local) always wins, matching the SDK's token-first priority.
 * - Vercel (OIDC): `BLOB_STORE_ID` injected by the connected store; the SDK
 *   then signs requests with `VERCEL_OIDC_TOKEN` automatically.
 */
function getPrivateBlobAuth(): { token?: string; storeId?: string } {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (token) return { token };

  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (storeId) return { storeId };

  throw new StorageUnavailableError();
}

function assertValidStorageKey(storageKey: string): void {
  if (
    storageKey.length === 0 ||
    storageKey.includes("\\") ||
    storageKey.startsWith("/") ||
    storageKey.split("/").some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._-]+$/.test(segment),
    )
  ) {
    throw new Error("Invalid private storage key.");
  }
}

async function readStreamToBuffer(
  stream: ReadableStream<Uint8Array>,
): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  return Buffer.concat(chunks, total);
}

/**
 * Private Vercel Blob store provider. Files are only readable with the
 * store's read-write token (via the SDK), never through a public URL, so
 * sensitive documents stay inaccessible to anonymous clients.
 */
export const vercelBlobPrivateStorageProvider: PrivateStorageProvider = {
  name: "vercel-blob-private",

  async save(storageKey, contents) {
    assertValidStorageKey(storageKey);
    const auth = getPrivateBlobAuth();

    try {
      await put(storageKey, contents, {
        access: "private",
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/octet-stream",
        ...auth,
      });
    } catch {
      throw new StorageUnavailableError();
    }
  },

  async read(storageKey) {
    assertValidStorageKey(storageKey);
    const auth = getPrivateBlobAuth();

    let result;
    try {
      result = await get(storageKey, {
        access: "private",
        useCache: false,
        ...auth,
      });
    } catch {
      throw new StorageUnavailableError();
    }

    if (!result || result.statusCode !== 200) {
      throw new Error("Private storage file not found.");
    }

    try {
      return await readStreamToBuffer(result.stream);
    } catch {
      throw new StorageUnavailableError();
    }
  },

  async delete(storageKey) {
    assertValidStorageKey(storageKey);
    const auth = getPrivateBlobAuth();

    try {
      await del(storageKey, auth);
    } catch {
      throw new StorageUnavailableError();
    }
  },
};

export function isVercelBlobPrivateStorageAvailable(): boolean {
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim(),
  );
}
