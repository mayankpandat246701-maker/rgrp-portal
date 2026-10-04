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
