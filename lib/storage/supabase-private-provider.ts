import "server-only";

import { createClient } from "@supabase/supabase-js";
import {
  StorageUnavailableError,
  type PrivateStorageProvider,
} from "@/lib/storage/types";

function getRequiredEnv(
  name:
    | "SUPABASE_URL"
    | "SUPABASE_SECRET_KEY"
    | "SUPABASE_STORAGE_BUCKET",
): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new StorageUnavailableError();
  }

  return value;
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

function getSupabaseStorage() {
  const url = getRequiredEnv("SUPABASE_URL");
  const secretKey = getRequiredEnv("SUPABASE_SECRET_KEY");
  const bucket = getRequiredEnv("SUPABASE_STORAGE_BUCKET");

  const client = createClient(url, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return { client, bucket };
}

function toStorageUnavailableError(): StorageUnavailableError {
  return new StorageUnavailableError();
}

export const supabasePrivateStorageProvider: PrivateStorageProvider = {
  name: "supabase-private",

  async save(storageKey, contents) {
    assertValidStorageKey(storageKey);

    try {
      const { client, bucket } = getSupabaseStorage();

      const { error } = await client.storage
        .from(bucket)
        .upload(storageKey, contents, {
          contentType: "application/octet-stream",
          upsert: false,
        });

      if (error) {
        throw error;
      }
    } catch {
      throw toStorageUnavailableError();
    }
  },

  async read(storageKey) {
    assertValidStorageKey(storageKey);

    try {
      const { client, bucket } = getSupabaseStorage();
      const { data, error } = await client.storage
        .from(bucket)
        .download(storageKey);

      if (error || !data) {
        throw error ?? new Error("Private storage returned no file.");
      }

      return Buffer.from(await data.arrayBuffer());
    } catch {
      throw toStorageUnavailableError();
    }
  },

  async delete(storageKey) {
    assertValidStorageKey(storageKey);

    try {
      const { client, bucket } = getSupabaseStorage();
      const { error } = await client.storage.from(bucket).remove([storageKey]);

      if (error) {
        throw error;
      }
    } catch {
      throw toStorageUnavailableError();
    }
  },
};

export function isSupabasePrivateStorageAvailable(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SECRET_KEY?.trim() &&
      process.env.SUPABASE_STORAGE_BUCKET?.trim(),
  );
}