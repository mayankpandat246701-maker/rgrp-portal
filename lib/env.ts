import "server-only";

import { z } from "zod";

import { parseProductionEnvironment } from "./server-env-validation";

const developmentEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  AUTH_SECRET: z.string().optional(),
  ADMIN_BOOTSTRAP_EMAIL: z.string().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().optional(),
  DOCUMENT_ENCRYPTION_KEY: z.string().optional(),
  QR_SIGNING_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  STORAGE_PROVIDER: z.enum(["local", "supabase", "vercel-blob"]).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),
  BLOB_STORE_ID: z.string().min(1).optional(),
  BLOB_PUBLIC_READ_WRITE_TOKEN: z.string().min(1).optional(),
  BLOB_PUBLIC_STORE_ID: z.string().min(1).optional(),
  BLOB_PUBLIC__STORE_ID: z.string().min(1).optional(),
  RATE_LIMIT_PROVIDER: z.literal("upstash").optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test"]).default("development"),
});

export type ServerEnvironment =
  | ReturnType<typeof parseProductionEnvironment>
  | z.infer<typeof developmentEnvironmentSchema>;

function getEnvironmentValues() {
  return {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    AUTH_SECRET: process.env.AUTH_SECRET,
    ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL,
    ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD,
    DOCUMENT_ENCRYPTION_KEY: process.env.DOCUMENT_ENCRYPTION_KEY,
    QR_SIGNING_SECRET: process.env.QR_SIGNING_SECRET,
    APP_BASE_URL: process.env.APP_BASE_URL,
    STORAGE_PROVIDER: process.env.STORAGE_PROVIDER,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    BLOB_STORE_ID: process.env.BLOB_STORE_ID,
    BLOB_PUBLIC_READ_WRITE_TOKEN: process.env.BLOB_PUBLIC_READ_WRITE_TOKEN,
    BLOB_PUBLIC_STORE_ID: process.env.BLOB_PUBLIC_STORE_ID,
    BLOB_PUBLIC__STORE_ID: process.env.BLOB_PUBLIC__STORE_ID,
    RATE_LIMIT_PROVIDER: process.env.RATE_LIMIT_PROVIDER,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export function getServerEnv(): ServerEnvironment {
  const values = getEnvironmentValues();

  if (process.env.NODE_ENV === "production") {
    return parseProductionEnvironment(values);
  }

  const result = developmentEnvironmentSchema.safeParse(values);

  if (!result.success) {
    throw new Error("Server environment configuration is invalid.");
  }

  return result.data;
}

export function validateProductionEnvironment(): void {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  parseProductionEnvironment(getEnvironmentValues());
}