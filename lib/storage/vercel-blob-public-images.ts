import "server-only";

import { del, put } from "@vercel/blob";

import { publicImageStoreHost } from "@/lib/storage/public-image-host";
import { StorageUnavailableError } from "@/lib/storage/types";

const PUBLIC_IMAGE_TOKEN_ENV = "BLOB_PUBLIC_READ_WRITE_TOKEN";

function getRequiredToken(): string {
  const token = process.env[PUBLIC_IMAGE_TOKEN_ENV]?.trim();
  if (!token) {
    throw new StorageUnavailableError();
  }
  return token;
}

function assertValidImagePathname(pathname: string): void {
  if (
    pathname.length === 0 ||
    pathname.includes("\\") ||
    pathname.startsWith("/") ||
    pathname.split("/").some(
      (segment) =>
        segment === "" ||
        segment === "." ||
        segment === ".." ||
        !/^[A-Za-z0-9._-]+$/.test(segment),
    )
  ) {
    throw new Error("Invalid public image pathname.");
  }
}

export function isPublicImageStorageAvailable(): boolean {
  return Boolean(process.env[PUBLIC_IMAGE_TOKEN_ENV]?.trim());
}

/** True only for URLs served by this project's exact public image store. */
export function isPublicImageUrl(value: string): boolean {
  const host = publicImageStoreHost(process.env[PUBLIC_IMAGE_TOKEN_ENV]);
  if (!host) return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.host === host;
  } catch {
    return false;
  }
}

/**
 * Uploads an image to the public Blob store and returns its https URL.
 * Only non-sensitive display images belong here; server-side authorization
 * and validation must happen before calling this.
 */
export async function putPublicImage(
  pathname: string,
  contents: Buffer,
  contentType: string,
): Promise<string> {
  assertValidImagePathname(pathname);
  const token = getRequiredToken();

  const blob = await put(pathname, contents, {
    access: "public",
    allowOverwrite: false,
    addRandomSuffix: true,
    contentType,
    token,
  });
  return blob.url;
}

/**
 * Best-effort deletion of an image previously uploaded by this project.
 * Returns true when the blob was removed (or nothing needed removal),
 * false when cleanup failed and the caller should log it.
 */
export async function deletePublicImageByUrl(url: string): Promise<boolean> {
  if (!isPublicImageUrl(url)) return true;
  try {
    await del(url, { token: getRequiredToken() });
    return true;
  } catch {
    return false;
  }
}
