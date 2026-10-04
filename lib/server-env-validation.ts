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

function configurationError(issues: z.ZodError["issues"]): Error {
  const invalidNames = new Set(
    issues
      .map((issue) => issue.path[0])
      .filter((path): path is string => typeof path === "string"),
  );
  const invalidVariables = Object.keys(productionEnvironmentSchema.shape).filter(
    (name) => invalidNames.has(name),
  );

  return new Error(
    `Invalid production server configuration: missing or invalid variables: ${invalidVariables.join(", ")}`,
  );
}

export function parseProductionEnvironment(
  values: Record<string, string | undefined>,
) {
  const result = productionEnvironmentSchema.safeParse(values);

  if (!result.success) {
    throw configurationError(result.error.issues);
  }

  return result.data;
}
