import "server-only";

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  randomUUID,
} from "node:crypto";
import {
  getPrivateStorageProvider,
  isPrivateStorageAvailable as isConfiguredPrivateStorageAvailable,
} from "@/lib/storage/provider";

const PRIVATE_FILE_HEADER = Buffer.from("RGRPENC1");

function getEncryptionKeys(): Buffer[] {
  const configuredKey = process.env.DOCUMENT_ENCRYPTION_KEY;
  const legacyKey = process.env.AUTH_SECRET;
  const sourceKeys = [
    configuredKey,
    ...(!configuredKey || process.env.NODE_ENV !== "production"
      ? [legacyKey]
      : []),
  ].filter(
    (key, index, keys): key is string =>
      Boolean(key) && keys.indexOf(key) === index,
  );

  if (sourceKeys.length === 0) {
    throw new Error("Private document encryption is not configured.");
  }

  if (sourceKeys.some((key) => Buffer.byteLength(key, "utf8") < 32)) {
    throw new Error("Private document encryption key is too weak.");
  }

  return sourceKeys.map((key) =>
    createHash("sha256").update(key, "utf8").digest(),
  );
}

export function isPrivateStorageAvailable(): boolean {
  return isConfiguredPrivateStorageAvailable();
}

export function createStorageKey(
  directory:
    | "applications"
    | "templates"
    | "qr"
    | "profiles"
    | "content"
    | "branding"
    | "certificates",
  fileExtension: "jpg" | "png" | "webp" | "pdf",
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
  if (safeReference) {
    keyParts.push(safeReference);
  }

  const filename = `${randomUUID()}.${fileExtension}${encrypted ? ".enc" : ""}`;
  keyParts.push(filename);

  return keyParts.join("/");
}

function encryptFile(data: Buffer): Buffer {
  const key = getEncryptionKeys()[0];
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

  return Buffer.concat([
    PRIVATE_FILE_HEADER,
    iv,
    cipher.getAuthTag(),
    encrypted,
  ]);
}

function decryptWithKey(data: Buffer, key: Buffer): Buffer {
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
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

function decryptFile(data: Buffer): Buffer {
  const keys = getEncryptionKeys();

  for (const key of keys) {
    try {
      return decryptWithKey(data, key);
    } catch {
      // Continue with the legacy development key during key migration.
    }
  }

  throw new Error("Unable to decrypt private file.");
}

export async function savePrivateFile(
  storageKey: string,
  contents: Buffer,
): Promise<void> {
  await getPrivateStorageProvider().save(storageKey, contents);
}

export async function saveEncryptedPrivateFile(
  storageKey: string,
  contents: Buffer,
): Promise<void> {
  await getPrivateStorageProvider().save(storageKey, encryptFile(contents));
}

export async function readPrivateFile(storageKey: string): Promise<Buffer> {
  return getPrivateStorageProvider().read(storageKey);
}

export async function readEncryptedPrivateFile(
  storageKey: string,
): Promise<Buffer> {
  return decryptFile(await readPrivateFile(storageKey));
}

export async function deletePrivateFile(storageKey: string): Promise<void> {
  await getPrivateStorageProvider().delete(storageKey);
}