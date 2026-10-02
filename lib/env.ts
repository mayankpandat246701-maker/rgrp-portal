import "server-only";

import { z } from "zod";

const serverEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  AUTH_SECRET: z.string().optional(),
});

const publicEnvironmentSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
});

export type ServerEnvironment = z.infer<typeof serverEnvironmentSchema>;
export type PublicEnvironment = z.infer<typeof publicEnvironmentSchema>;

function parseSafely<T extends z.ZodType>(
  schema: T,
  values: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(values);
  if (!result.success) {
    const invalidVariables = [
      ...new Set(
        result.error.issues.flatMap((issue) =>
          issue.path.length > 0 ? [String(issue.path[0])] : [],
        ),
      ),
    ];
    throw new Error(
      `Invalid environment configuration for: ${invalidVariables.join(", ")}.`,
    );
  }

  return result.data;
}

export function getServerEnv(): ServerEnvironment {
  const { DATABASE_URL, DIRECT_URL, AUTH_SECRET } = process.env;

  return parseSafely(serverEnvironmentSchema, {
    DATABASE_URL,
    DIRECT_URL,
    AUTH_SECRET,
  });
}

export function getPublicEnv(): PublicEnvironment {
  return parseSafely(publicEnvironmentSchema, {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  });
}
