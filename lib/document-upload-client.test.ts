import assert from "node:assert/strict";
import { test } from "node:test";

import {
  acquireUploadLock,
  getUploadErrorMessage,
} from "./document-upload-client";

test("prevents duplicate submissions while upload is in progress", () => {
  const lock = { current: false };

  assert.equal(acquireUploadLock(lock), true);
  assert.equal(acquireUploadLock(lock), false);

  lock.current = false;
  assert.equal(acquireUploadLock(lock), true);
});

test("shows a Hindi-friendly rate-limit message with retry duration", () => {
  assert.equal(
    getUploadErrorMessage(429, {
      error: "Too many upload attempts. Please wait and try again.",
      code: "RATE_LIMITED",
      retryAfterSeconds: 125,
    }),
    "बहुत अधिक प्रयास किए गए हैं। कृपया कुछ समय बाद फिर से प्रयास करें। कृपया 2 मिनट 5 सेकंड बाद फिर से प्रयास करें।",
  );
});

test("shows a Hindi-friendly rate-limit message without retry duration", () => {
  assert.equal(
    getUploadErrorMessage(429, {
      error: "Too many upload attempts. Please wait and try again.",
      code: "RATE_LIMITED",
    }),
    "बहुत अधिक प्रयास किए गए हैं। कृपया कुछ समय बाद फिर से प्रयास करें।",
  );
});

test("maps an oversized file error to a clear Hindi message", () => {
  assert.equal(
    getUploadErrorMessage(413, {
      error: "File exceeds the allowed size",
      code: "FILE_TOO_LARGE",
    }),
    "फ़ाइल का आकार अनुमत सीमा (2 MB) से अधिक है।",
  );
});

test("maps an unsupported media type error to a clear Hindi message", () => {
  assert.equal(
    getUploadErrorMessage(415, {
      error: "Unsupported file type",
      code: "UNSUPPORTED_MEDIA_TYPE",
    }),
    "फ़ाइल का प्रकार समर्थित नहीं है। फोटो के लिए JPG/PNG और आधार दस्तावेज़ के लिए JPG/PNG/PDF चुनें।",
  );
});

test("maps a storage outage to a clear Hindi message", () => {
  assert.equal(
    getUploadErrorMessage(503, {
      error: "Upload service is temporarily unavailable",
      code: "UPLOAD_SERVICE_UNAVAILABLE",
    }),
    "अपलोड सेवा अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।",
  );
});
