import "server-only";

import { z } from "zod";

const strongSecret = z
  .string()
  .min(32)
  .refine((value) => new Set(value).size >= 16);

const productionEnvironmentSchema = z
  .object({
    DATABASE_URL: z.string().min(1),
    DIRECT_URL: z.string().min(1),
    AUTH_SECRET: strongSecret,
    ADMIN_BOOTSTRAP_EMAIL: z.string().email(),
    ADMIN_BOOTSTRAP_PASSWORD: z
      .string()
      .min(16)
      .refine((value) => new Set(value).size >= 8),
    DOCUMENT_ENCRYPTION_KEY: strongSecret,
    QR_SIGNING_SECRET: strongSecret,
    APP_BASE_URL: z.string().url().startsWith("https://"),
    STORAGE_PROVIDER: z.literal("supabase"),
    SUPABASE_URL: z.string().url().startsWith("https://"),
    SUPABASE_SECRET_KEY: z.string().min(1),
    SUPABASE_STORAGE_BUCKET: z.string().min(1),
    RATE_LIMIT_PROVIDER: z.literal("upstash"),
    UPSTASH_REDIS_REST_URL: z.string().url().startsWith("https://"),
    UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
    NODE_ENV: z.literal("production"),
  })
  .superRefine((environment, context) => {
    const secrets = [
      environment.AUTH_SECRET,
      environment.DOCUMENT_ENCRYPTION_KEY,
      environment.QR_SIGNING_SECRET,
    ];

    if (new Set(secrets).size !== secrets.length) {
      context.addIssue({
        code: "custom",
        message: "Secrets must be independent.",
        path: ["AUTH_SECRET"],
      });
    }
  });

const developmentEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  AUTH_SECRET: z.string().optional(),
  ADMIN_BOOTSTRAP_EMAIL: z.string().optional(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().optional(),
  DOCUMENT_ENCRYPTION_KEY: z.string().optional(),
  QR_SIGNING_SECRET: z.string().optional(),
  APP_BASE_URL: z.string().url().optional(),
  STORAGE_PROVIDER: z.enum(["local", "supabase"]).optional(),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.string().optional(),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).optional(),
  RATE_LIMIT_PROVIDER: z.literal("upstash").optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  NODE_ENV: z.enum(["development", "test"]).default("development"),
});

export type ServerEnvironment =
  | z.infer<typeof productionEnvironmentSchema>
  | z.infer<typeof developmentEnvironmentSchema>;

function configurationError(): Error {
  return new Error(
    "Production server configuration is invalid. Set all required server environment variables and use secrets of at least 32 characters.",
  );
}

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
    RATE_LIMIT_PROVIDER: process.env.RATE_LIMIT_PROVIDER,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    NODE_ENV: process.env.NODE_ENV,
  };
}

export function getServerEnv(): ServerEnvironment {
  const values = getEnvironmentValues();

  if (process.env.NODE_ENV === "production") {
    const result = productionEnvironmentSchema.safeParse(values);

    if (!result.success) {
      throw configurationError();
    }

    return result.data;
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

  const result = productionEnvironmentSchema.safeParse(getEnvironmentValues());

  if (!result.success) {
    throw configurationError();
  }
}