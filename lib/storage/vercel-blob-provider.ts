import "server-only";

import { del, get, put } from "@vercel/blob";

import {
  StorageUnavailableError,
  type PrivateStorageProvider,
} from "@/lib/storage/types";

function getRequiredToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!token) {
    throw new StorageUnavailableError();
  }
  return token;
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

    try {
      await put(storageKey, contents, {
        access: "private",
        allowOverwrite: true,
        addRandomSuffix: false,
        contentType: "application/octet-stream",
        token: getRequiredToken(),
      });
    } catch {
      throw new StorageUnavailableError();
    }
  },

  async read(storageKey) {
    assertValidStorageKey(storageKey);

    let result;
    try {
      result = await get(storageKey, {
        access: "private",
        useCache: false,
        token: getRequiredToken(),
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

    try {
      await del(storageKey, { token: getRequiredToken() });
    } catch {
      throw new StorageUnavailableError();
    }
  },
};

export function isVercelBlobPrivateStorageAvailable(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim());
}
