import { imageSize } from "image-size";

export type SafeImage = {
  extension: "jpg" | "png" | "webp";
  mimeType: "image/jpeg" | "image/png" | "image/webp";
};

export type ImageDimensions = { width: number; height: number };

export function validateContentImage(
  mimeType: string,
  contents: Buffer,
): SafeImage | null {
  if (
    mimeType === "image/jpeg" &&
    contents.length >= 3 &&
    contents[0] === 0xff &&
    contents[1] === 0xd8 &&
    contents[2] === 0xff
  ) {
    return { extension: "jpg", mimeType };
  }
  if (
    mimeType === "image/png" &&
    contents.length >= 8 &&
    contents.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return { extension: "png", mimeType };
  }
  if (
    mimeType === "image/webp" &&
    contents.length >= 12 &&
    contents.toString("ascii", 0, 4) === "RIFF" &&
    contents.toString("ascii", 8, 12) === "WEBP"
  ) {
    return { extension: "webp", mimeType };
  }
  return null;
}

export function getContentImageDimensions(
  contents: Buffer,
): ImageDimensions | null {
  try {
    const { width, height } = imageSize(contents);
    return width && height ? { width, height } : null;
  } catch {
    return null;
  }
}

export function isContentImageDimensionsAllowed(
  dimensions: ImageDimensions,
): boolean {
  return (
    dimensions.width <= 6000 &&
    dimensions.height <= 6000 &&
    dimensions.width * dimensions.height <= 40_000_000
  );
}

export const MAX_CONTENT_IMAGE_BYTES = 5 * 1024 * 1024;
