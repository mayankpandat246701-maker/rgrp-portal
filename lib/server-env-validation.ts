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
    STORAGE_PROVIDER: z.enum(["supabase", "vercel-blob"]),
    SUPABASE_URL: z.string().optional(),
    SUPABASE_SECRET_KEY: z.string().optional(),
    SUPABASE_STORAGE_BUCKET: z.string().optional(),
    BLOB_READ_WRITE_TOKEN: z.string().optional(),
    BLOB_PUBLIC_READ_WRITE_TOKEN: z.string().optional(),
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

    function requireValue(
      name:
        | "SUPABASE_URL"
        | "SUPABASE_SECRET_KEY"
        | "SUPABASE_STORAGE_BUCKET"
        | "BLOB_READ_WRITE_TOKEN"
        | "BLOB_PUBLIC_READ_WRITE_TOKEN",
    ): void {
      if (!environment[name] || environment[name].trim() === "") {
        context.addIssue({
          code: "custom",
          message: `${name} is required.`,
          path: [name],
        });
      }
    }

    if (environment.STORAGE_PROVIDER === "supabase") {
      requireValue("SUPABASE_URL");
      requireValue("SUPABASE_SECRET_KEY");
      requireValue("SUPABASE_STORAGE_BUCKET");
      if (
        environment.SUPABASE_URL &&
        !z.string().url().startsWith("https://").safeParse(environment.SUPABASE_URL)
          .success
      ) {
        context.addIssue({
          code: "custom",
          message: "SUPABASE_URL must be an https URL.",
          path: ["SUPABASE_URL"],
        });
      }
    } else if (environment.STORAGE_PROVIDER === "vercel-blob") {
      requireValue("BLOB_READ_WRITE_TOKEN");
      requireValue("BLOB_PUBLIC_READ_WRITE_TOKEN");
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
