import assert from "node:assert/strict";
import test from "node:test";
import {
  getContentImageDimensions,
  isContentImageDimensionsAllowed,
  validateContentImage,
} from "./content-image";

test("accepts recognized image signatures only when MIME agrees", () => {
  assert.equal(
    validateContentImage("image/png", Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))?.extension,
    "png",
  );
  assert.equal(
    validateContentImage("image/webp", Buffer.from("RIFF0000WEBP"))?.extension,
    "webp",
  );
  assert.equal(validateContentImage("image/jpeg", Buffer.from("RIFF0000WEBP")), null);
  assert.equal(validateContentImage("image/svg+xml", Buffer.from("<svg/>")), null);
});

test("reads supported dimensions and rejects excessive image resolutions", () => {
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/lH0AAAAASUVORK5CYII=",
    "base64",
  );
  const dimensions = getContentImageDimensions(onePixelPng);
  assert.deepEqual(dimensions, { width: 1, height: 1 });
  assert.equal(
    isContentImageDimensionsAllowed({ width: 6000, height: 7000 }),
    false,
  );
  assert.equal(
    isContentImageDimensionsAllowed({ width: 6000, height: 1000 }),
    true,
  );
});
