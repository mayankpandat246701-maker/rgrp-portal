import "server-only";

import {
  isVercelBlobPrivateStorageAvailable,
  vercelBlobPrivateStorageProvider,
} from "@/lib/storage/vercel-blob-provider";
import {
  isLocalPrivateStorageAvailable,
  localPrivateStorageProvider,
} from "@/lib/storage/local-private-provider";
import {
  isSupabasePrivateStorageAvailable,
  supabasePrivateStorageProvider,
} from "@/lib/storage/supabase-private-provider";
import {
  StorageUnavailableError,
  type PrivateStorageProvider,
} from "@/lib/storage/types";

function selectedStorageProvider(): PrivateStorageProvider {
  const configuredProvider = process.env.STORAGE_PROVIDER?.trim().toLowerCase();

  if (configuredProvider === "supabase") {
    if (!isSupabasePrivateStorageAvailable()) {
      throw new StorageUnavailableError();
    }

    return supabasePrivateStorageProvider;
  }

  if (configuredProvider === "vercel-blob") {
    if (!isVercelBlobPrivateStorageAvailable()) {
      throw new StorageUnavailableError();
    }

    return vercelBlobPrivateStorageProvider;
  }

  if (configuredProvider === "local" || !configuredProvider) {
    if (!isLocalPrivateStorageAvailable()) {
      throw new StorageUnavailableError();
    }

    return localPrivateStorageProvider;
  }

  throw new StorageUnavailableError();
}

export function getPrivateStorageProvider(): PrivateStorageProvider {
  return selectedStorageProvider();
}

export function isPrivateStorageAvailable(): boolean {
  try {
    selectedStorageProvider();
    return true;
  } catch {
    return false;
  }
}