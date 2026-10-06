import assert from "node:assert/strict";
import { test } from "node:test";

import { parseProductionEnvironment } from "./server-env-validation";

const validProductionEnvironment = {
  DATABASE_URL: "postgresql://user:password@database.example.test:5432/app",
  DIRECT_URL: "postgresql://user:password@database.example.test:5432/app",
  AUTH_SECRET: "auth-test-secret-0123456789-ABCDE",
  ADMIN_BOOTSTRAP_EMAIL: "admin@example.test",
  ADMIN_BOOTSTRAP_PASSWORD: "test-password-0123456789",
  DOCUMENT_ENCRYPTION_KEY: "document-test-key-0123456789-ABCDE",
  QR_SIGNING_SECRET: "qr-test-secret-0123456789-ABCDEF",
  APP_BASE_URL: "https://app.example.test",
  STORAGE_PROVIDER: "supabase",
  SUPABASE_URL: "https://project.example.test",
  SUPABASE_SECRET_KEY: "synthetic-test-key",
  SUPABASE_STORAGE_BUCKET: "synthetic-test-bucket",
  RATE_LIMIT_PROVIDER: "upstash",
  UPSTASH_REDIS_REST_URL: "https://redis.example.test",
  UPSTASH_REDIS_REST_TOKEN: "synthetic-test-token",
  NODE_ENV: "production",
} satisfies Record<string, string>;

type EnvironmentKey = keyof typeof validProductionEnvironment;

function assertInvalidConfiguration(
  overrides: Partial<Record<EnvironmentKey, string | undefined>>,
  invalidVariables: string,
): void {
  assert.throws(
    () =>
      parseProductionEnvironment({
        ...validProductionEnvironment,
        ...overrides,
      }),
    new Error(
      `Invalid production server configuration: missing or invalid variables: ${invalidVariables}`,
    ),
  );
}

test("reports missing production variables by name", () => {
  assertInvalidConfiguration(
    { DATABASE_URL: undefined, DIRECT_URL: undefined },
    "DATABASE_URL, DIRECT_URL",
  );
});

test("reports blank required values by name", () => {
  assertInvalidConfiguration(
    { DATABASE_URL: "", SUPABASE_STORAGE_BUCKET: "" },
    "DATABASE_URL, SUPABASE_STORAGE_BUCKET",
  );
});

test("reports a short cryptographic secret by name", () => {
  assertInvalidConfiguration({ AUTH_SECRET: "short" }, "AUTH_SECRET");
});

test("reports an invalid storage provider by name", () => {
  assertInvalidConfiguration({ STORAGE_PROVIDER: "local" }, "STORAGE_PROVIDER");
});

test("reports missing Supabase storage variables by name", () => {
  assertInvalidConfiguration(
    {
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_STORAGE_BUCKET: undefined,
    },
    "SUPABASE_URL, SUPABASE_SECRET_KEY, SUPABASE_STORAGE_BUCKET",
  );
});

test("reports missing Vercel Blob tokens by name", () => {
  assertInvalidConfiguration(
    { STORAGE_PROVIDER: "vercel-blob" },
    "BLOB_READ_WRITE_TOKEN, BLOB_PUBLIC_READ_WRITE_TOKEN",
  );
});

test("accepts a valid Vercel Blob production configuration", () => {
  assert.doesNotThrow(() =>
    parseProductionEnvironment({
      ...validProductionEnvironment,
      STORAGE_PROVIDER: "vercel-blob",
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEY: undefined,
      SUPABASE_STORAGE_BUCKET: undefined,
      BLOB_READ_WRITE_TOKEN: "vercel_blob_rw_store1234567890_synthetic",
      BLOB_PUBLIC_READ_WRITE_TOKEN: "vercel_blob_rw_store0987654321_synthetic",
    }),
  );
});

test("reports an invalid rate-limit provider by name", () => {
  assertInvalidConfiguration(
    { RATE_LIMIT_PROVIDER: "memory" },
    "RATE_LIMIT_PROVIDER",
  );
});

test("reports an invalid URL by name", () => {
  assertInvalidConfiguration({ SUPABASE_URL: "not-a-url" }, "SUPABASE_URL");
});

test("accepts a valid production configuration", () => {
  assert.doesNotThrow(() =>
    parseProductionEnvironment(validProductionEnvironment),
  );
});
