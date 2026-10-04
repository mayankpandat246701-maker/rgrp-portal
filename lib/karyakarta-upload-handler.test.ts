import assert from "node:assert/strict";
import { test } from "node:test";

import {
  handleDocumentUpload,
  type UploadDependencies,
} from "./karyakarta-upload-handler";

const APPLICATION_REFERENCE = "RGRP-20261004-12345";
const MOBILE = "9876543210";

function createDependencies(
  overrides: Partial<UploadDependencies> = {},
): UploadDependencies {
  return {
    isRateLimitProviderAvailable: () => true,
    isPrivateStorageAvailable: () => true,
    checkRateLimit: async () => ({
      allowed: true,
      retryAfterSeconds: 60,
    }),
    findApplication: async () => ({
      id: "synthetic-application-id",
      photoPath: null,
      aadhaarPath: null,
    }),
    createStorageKey: (extension) => `applications/synthetic.${extension}.enc`,
    saveEncryptedPrivateFile: async () => {},
    updateApplication: async (_id, updates) => ({
      photoPath: updates.photoPath ?? null,
      aadhaarPath: updates.aadhaarPath ?? null,
      uploadStatus: "PENDING",
    }),
    deletePrivateFile: async () => {},
    logUnexpectedError: () => {},
    ...overrides,
  };
}

function createFormData(options: {
  applicationReference?: string;
  mobile?: string;
  photo?: File | string;
  aadhaar?: File | string;
} = {}): FormData {
  const formData = new FormData();
  if (options.applicationReference !== undefined) {
    formData.set("applicationReference", options.applicationReference);
  }
  if (options.mobile !== undefined) {
    formData.set("mobile", options.mobile);
  }
  if (options.photo !== undefined) {
    formData.set("photo", options.photo);
  }
  if (options.aadhaar !== undefined) {
    formData.set("aadhaar", options.aadhaar);
  }
  return formData;
}

function createRequest(
  formData: FormData,
  headers: HeadersInit = {},
): Request {
  return new Request("https://example.test/api/karyakarta/upload", {
    method: "POST",
    body: formData,
    headers,
  });
}

function createValidFormData(
  file?: File,
  applicationReference = APPLICATION_REFERENCE,
  mobile = MOBILE,
): FormData {
  return createFormData({
    applicationReference,
    mobile,
    ...(file ? { photo: file } : {}),
  });
}

async function assertErrorResponse(
  response: Response,
  status: number,
  code: string,
  error: string,
): Promise<void> {
  assert.equal(response.status, status);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
  assert.deepEqual(await response.json(), { error, code });
}

test("returns JSON for malformed multipart requests", async () => {
  const request = new Request("https://example.test/api/karyakarta/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const response = await handleDocumentUpload(request, createDependencies());
  await assertErrorResponse(
    response,
    400,
    "MALFORMED_FORM_DATA",
    "Invalid upload request",
  );
});

test("returns safe 429 JSON and matching retry metadata", async () => {
  const response = await handleDocumentUpload(
    createRequest(createValidFormData()),
    createDependencies({
      checkRateLimit: async () => ({
        allowed: false,
        retryAfterSeconds: 75,
      }),
    }),
  );

  assert.equal(response.status, 429);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
  assert.equal(response.headers.get("retry-after"), "75");
  assert.deepEqual(await response.json(), {
    error: "Too many upload attempts. Please wait and try again.",
    code: "RATE_LIMITED",
    retryAfterSeconds: 75,
  });
});

test("rejects request bodies above the request-size limit", async () => {
  const response = await handleDocumentUpload(
    createRequest(createValidFormData(), { "content-length": "5000000" }),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    413,
    "FILE_TOO_LARGE",
    "File exceeds the allowed size",
  );
});

test("requires the application reference", async () => {
  const response = await handleDocumentUpload(
    createRequest(createFormData({ mobile: MOBILE })),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "APPLICATION_REFERENCE_REQUIRED",
    "Application ID is required",
  );
});

test("rejects a blank application reference", async () => {
  const response = await handleDocumentUpload(
    createRequest(createFormData({ applicationReference: "", mobile: MOBILE })),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "APPLICATION_REFERENCE_REQUIRED",
    "Application ID is required",
  );
});

test("rejects an invalid application reference format", async () => {
  const response = await handleDocumentUpload(
    createRequest(createValidFormData(undefined, "private-app-id")),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "INVALID_APPLICATION_REFERENCE",
    "Invalid application reference",
  );
});

test("requires the registered mobile number", async () => {
  const response = await handleDocumentUpload(
    createRequest(createFormData({ applicationReference: APPLICATION_REFERENCE })),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "MOBILE_REQUIRED",
    "Registered mobile number is required",
  );
});

test("rejects an invalid registered mobile number", async () => {
  const response = await handleDocumentUpload(
    createRequest(createValidFormData(undefined, APPLICATION_REFERENCE, "123")),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "INVALID_MOBILE_NUMBER",
    "Invalid registered mobile number",
  );
});

test("requires at least one document type", async () => {
  const response = await handleDocumentUpload(
    createRequest(createValidFormData()),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "DOCUMENT_TYPE_REQUIRED",
    "Document type is required",
  );
});

test("rejects a document field that is not a file", async () => {
  const response = await handleDocumentUpload(
    createRequest(
      createFormData({
        applicationReference: APPLICATION_REFERENCE,
        mobile: MOBILE,
        photo: "not-a-file",
      }),
    ),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "INVALID_FILE_INPUT",
    "Invalid file input",
  );
});

test("rejects an empty file", async () => {
  const response = await handleDocumentUpload(
    createRequest(
      createValidFormData(new File([], "empty.jpg", { type: "image/jpeg" })),
    ),
    createDependencies(),
  );
  await assertErrorResponse(response, 400, "EMPTY_FILE", "File is empty");
});

test("rejects a file above the allowed upload size", async () => {
  const contents = Buffer.alloc(2 * 1024 * 1024 + 1);
  contents.set([0xff, 0xd8, 0xff]);
  const response = await handleDocumentUpload(
    createRequest(
      createValidFormData(new File([contents], "large.jpg", { type: "image/jpeg" })),
    ),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    413,
    "FILE_TOO_LARGE",
    "File exceeds the allowed size",
  );
});

test("rejects an unsupported media type", async () => {
  const response = await handleDocumentUpload(
    createRequest(
      createValidFormData(
        new File(["synthetic"], "unsupported.gif", { type: "image/gif" }),
      ),
    ),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    415,
    "UNSUPPORTED_MEDIA_TYPE",
    "Unsupported file type",
  );
});

test("rejects a file with a mismatched signature", async () => {
  const response = await handleDocumentUpload(
    createRequest(
      createValidFormData(
        new File(["synthetic"], "invalid.jpg", { type: "image/jpeg" }),
      ),
    ),
    createDependencies(),
  );
  await assertErrorResponse(
    response,
    400,
    "INVALID_FILE_CONTENT",
    "Invalid file content",
  );
});

test("does not reveal whether the submitted application identity exists", async () => {
  const response = await handleDocumentUpload(
    createRequest(
      createValidFormData(
        new File([Buffer.from([0xff, 0xd8, 0xff])], "photo.jpg", {
          type: "image/jpeg",
        }),
      ),
    ),
    createDependencies({ findApplication: async () => null }),
  );
  await assertErrorResponse(
    response,
    400,
    "INVALID_APPLICATION_REFERENCE",
    "Invalid application reference",
  );
});

test("uploads valid documents using storage and database dependencies", async () => {
  const saved: Array<{ key: string; byteLength: number }> = [];
  let updatedId = "";
  const formData = createFormData({
    applicationReference: APPLICATION_REFERENCE,
    mobile: MOBILE,
    photo: new File([Buffer.from([0xff, 0xd8, 0xff])], "photo.jpg", {
      type: "image/jpeg",
    }),
    aadhaar: new File([Buffer.from("%PDF-synthetic")], "identity.pdf", {
      type: "application/pdf",
    }),
  });
  const response = await handleDocumentUpload(
    createRequest(formData),
    createDependencies({
      saveEncryptedPrivateFile: async (key, contents) => {
        saved.push({ key, byteLength: contents.length });
      },
      updateApplication: async (id, updates) => {
        updatedId = id;
        return {
          photoPath: updates.photoPath ?? null,
          aadhaarPath: updates.aadhaarPath ?? null,
          uploadStatus: "PENDING",
        };
      },
    }),
  );

  assert.equal(response.status, 201);
  assert.match(response.headers.get("content-type") ?? "", /^application\/json\b/);
  assert.deepEqual(await response.json(), {
    success: true,
    data: {
      photoUploaded: true,
      aadhaarUploaded: true,
      status: "PENDING",
    },
  });
  assert.equal(updatedId, "synthetic-application-id");
  assert.equal(saved.length, 2);
  assert.ok(saved.every(({ byteLength }) => byteLength > 0));
});

test("logs unexpected failures with only safe metadata", async () => {
  let logged: unknown;
  const response = await handleDocumentUpload(
    createRequest(
      createValidFormData(
        new File([Buffer.from([0xff, 0xd8, 0xff])], "photo.jpg", {
          type: "image/jpeg",
        }),
      ),
    ),
    createDependencies({
      findApplication: async () => {
        throw new Error("secret connection details");
      },
      logUnexpectedError: (metadata) => {
        logged = metadata;
      },
    }),
  );

  await assertErrorResponse(response, 500, "UPLOAD_FAILED", "Upload failed");
  assert.deepEqual(logged, { fileSize: 3, fileType: "image/jpeg" });
  assert.doesNotMatch(JSON.stringify(logged), /secret|RGRP-|9876543210/);
});
