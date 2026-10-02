import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import {
  lstat,
  mkdir,
  readFile,
  unlink,
  writeFile,
} from "node:fs/promises";
import path from "node:path";

const PRIVATE_UPLOAD_ROOT = path.resolve(process.cwd(), "uploads");
const PRIVATE_FILE_HEADER = Buffer.from("RGRPENC1");

function assertPrivateRoot(): void {
  const publicDirectory = path.resolve(process.cwd(), "public");
  const relativeToPublic = path.relative(publicDirectory, PRIVATE_UPLOAD_ROOT);
  if (
    relativeToPublic === "" ||
    (!relativeToPublic.startsWith("..") && !path.isAbsolute(relativeToPublic))
  ) {
    throw new Error("Private upload root must be outside the public directory.");
  }
}

function getEncryptionKey(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret || Buffer.byteLength(secret, "utf8") < 32) {
    throw new Error("AUTH_SECRET is not configured for private file encryption.");
  }
  return createHash("sha256").update(secret, "utf8").digest();
}

function resolveStorageKey(storageKey: string): string {
  assertPrivateRoot();
  if (
    storageKey.length === 0 ||
    storageKey.includes("\\") ||
    storageKey.startsWith("/") ||
    storageKey.split("/").some((segment) =>
      segment === "" || segment === "." || segment === ".." ||
      !/^[A-Za-z0-9._-]+$/.test(segment),
    )
  ) {
    throw new Error("Invalid private storage key.");
  }

  const resolvedPath = path.resolve(PRIVATE_UPLOAD_ROOT, ...storageKey.split("/"));
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

export function createStorageKey(
  directory: "applications" | "templates" | "qr",
  fileExtension: "jpg" | "png" | "pdf",
  encrypted = false,
  applicationReference?: string,
): string {
  const safeReference = applicationReference
    ? applicationReference.match(/^RGRP-\d{8}-\d{5}$/)?.[0]
    : undefined;
  if (applicationReference && !safeReference) {
    throw new Error("Invalid application reference for private storage.");
  }

  const keyParts: string[] = [directory];
  if (safeReference) keyParts.push(safeReference);
  const filename = `${randomUUID()}.${fileExtension}${encrypted ? ".enc" : ""}`;
  keyParts.push(filename);
  return keyParts.join("/");
}

function encryptFile(data: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([
    PRIVATE_FILE_HEADER,
    iv,
    cipher.getAuthTag(),
    encrypted,
  ]);
}

function decryptFile(data: Buffer): Buffer {
  const headerLength = PRIVATE_FILE_HEADER.length;
  if (
    data.length < headerLength + 12 + 16 ||
    !data.subarray(0, headerLength).equals(PRIVATE_FILE_HEADER)
  ) {
    throw new Error("Invalid encrypted private file.");
  }

  const iv = data.subarray(headerLength, headerLength + 12);
  const authTag = data.subarray(headerLength + 12, headerLength + 28);
  const encrypted = data.subarray(headerLength + 28);
  const decipher = createDecipheriv("aes-256-gcm", getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

async function writePrivateFile(
  storageKey: string,
  contents: Buffer,
): Promise<void> {
  const filePath = resolveStorageKey(storageKey);
  await ensureSafeParentDirectory(filePath);
  await writeFile(filePath, contents, { flag: "wx", mode: 0o600 });
}

export async function savePrivateFile(
  storageKey: string,
  contents: Buffer,
): Promise<void> {
  await writePrivateFile(storageKey, contents);
}

export async function saveEncryptedPrivateFile(
  storageKey: string,
  contents: Buffer,
): Promise<void> {
  await writePrivateFile(storageKey, encryptFile(contents));
}

export async function readPrivateFile(storageKey: string): Promise<Buffer> {
  const filePath = resolveStorageKey(storageKey);
  const fileStat = await lstat(filePath);
  if (fileStat.isSymbolicLink() || !fileStat.isFile()) {
    throw new Error("Private upload is not a regular file.");
  }
  return readFile(filePath);
}

export async function readEncryptedPrivateFile(
  storageKey: string,
): Promise<Buffer> {
  return decryptFile(await readPrivateFile(storageKey));
}

export async function deletePrivateFile(storageKey: string): Promise<void> {
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
}
