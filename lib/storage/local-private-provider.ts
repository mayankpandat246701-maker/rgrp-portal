import "server-only";

import {
  lstat,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import {
  StorageUnavailableError,
  type PrivateStorageProvider,
} from "@/lib/storage/types";

const PRIVATE_UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");

function assertLocalStorageAllowed(): void {
  if (process.env.NODE_ENV === "production") {
    throw new StorageUnavailableError();
  }
}

function resolveStorageKey(storageKey: string): string {
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relativeToPublic = path.relative(publicDirectory, PRIVATE_UPLOAD_ROOT);
  if (
    relativeToPublic === "" ||
    (!relativeToPublic.startsWith("..") && !path.isAbsolute(relativeToPublic))
  ) {
    throw new Error("Private upload root must be outside the public directory.");
  }

  if (
    storageKey.length === 0 ||
    storageKey.includes("\\") ||
    storageKey.startsWith("/") ||
    storageKey.split("/").some((segment) =>
      segment === "" ||
      segment === "." ||
      segment === ".." ||
      !/^[A-Za-z0-9._-]+$/.test(segment),
    )
  ) {
    throw new Error("Invalid private storage key.");
  }

  const resolvedPath = path.resolve(
    PRIVATE_UPLOAD_ROOT,
    ...storageKey.split("/"),
  );
  const relativePath = path.relative(PRIVATE_UPLOAD_ROOT, resolvedPath);
  if (
    relativePath === "" ||
    relativePath.startsWith("..") ||
    path.isAbsolute(relativePath)
  ) {
    throw new Error("Private storage path escaped the upload root.");
  }
  return resolvedPath;
}

async function ensureSafeParentDirectory(filePath: string): Promise<void> {
  await mkdir(PRIVATE_UPLOAD_ROOT, { recursive: true, mode: 0o700 });
  const rootStat = await lstat(PRIVATE_UPLOAD_ROOT);
  if (rootStat.isSymbolicLink() || !rootStat.isDirectory()) {
    throw new Error("Private upload root is not a regular directory.");
  }

  const parent = path.dirname(filePath);
  const relativeParent = path.relative(PRIVATE_UPLOAD_ROOT, parent);
  let current = PRIVATE_UPLOAD_ROOT;
  for (const segment of relativeParent.split(path.sep).filter(Boolean)) {
    current = path.join(/* turbopackIgnore: true */ current, segment);
    await mkdir(current, { mode: 0o700 }).catch((error: unknown) => {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "EEXIST"
      ) {
        return;
      }
      throw error;
    });
    const stat = await lstat(current);
    if (stat.isSymbolicLink() || !stat.isDirectory()) {
      throw new Error("Private upload directory is not a regular directory.");
    }
  }
}

export const localPrivateStorageProvider: PrivateStorageProvider = {
  name: "local-private",
  async save(storageKey, contents) {
    assertLocalStorageAllowed();
    const filePath = resolveStorageKey(storageKey);
    await ensureSafeParentDirectory(filePath);
    await writeFile(filePath, contents, { flag: "wx", mode: 0o600 });
  },
  async read(storageKey) {
    assertLocalStorageAllowed();
    const filePath = resolveStorageKey(storageKey);
    const fileStat = await lstat(filePath);
    if (fileStat.isSymbolicLink() || !fileStat.isFile()) {
      throw new Error("Private upload is not a regular file.");
    }
    return readFile(filePath);
  },
  async delete(storageKey) {
    assertLocalStorageAllowed();
    const filePath = resolveStorageKey(storageKey);
    try {
      const fileStat = await lstat(filePath);
      if (fileStat.isSymbolicLink() || !fileStat.isFile()) {
        throw new Error("Private upload is not a regular file.");
      }
      await unlink(filePath);
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return;
      }
      throw error;
    }
  },
};

export function isLocalPrivateStorageAvailable(): boolean {
  return process.env.NODE_ENV !== "production";
}
