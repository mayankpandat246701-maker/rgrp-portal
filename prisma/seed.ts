import bcrypt from "bcryptjs";
import { AdminRole, PrismaClient } from "@prisma/client";
import { z } from "zod";

const bootstrapEnvironmentSchema = z.object({
  ADMIN_BOOTSTRAP_EMAIL: z.string().email(),
  ADMIN_BOOTSTRAP_PASSWORD: z.string().min(1),
});

const databaseEnvironmentSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
});

async function main() {
  const bootstrapEnvironment = bootstrapEnvironmentSchema.safeParse({
    ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL || undefined,
    ADMIN_BOOTSTRAP_PASSWORD: process.env.ADMIN_BOOTSTRAP_PASSWORD || undefined,
  });
  if (!bootstrapEnvironment.success) {
    throw new Error(
      "ADMIN_BOOTSTRAP_EMAIL and ADMIN_BOOTSTRAP_PASSWORD must be configured.",
    );
  }

  const databaseEnvironment = databaseEnvironmentSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
  });
  if (!databaseEnvironment.success) {
    throw new Error(
      "DATABASE_URL and DIRECT_URL must be configured before running the admin bootstrap.",
    );
  }

  const { ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD } =
    bootstrapEnvironment.data;

  const prisma = new PrismaClient({
    log: ["error"],
  });

  try {
    const passwordHash = await bcrypt.hash(ADMIN_BOOTSTRAP_PASSWORD, 12);

    await prisma.admin.upsert({
      where: { email: ADMIN_BOOTSTRAP_EMAIL },
      create: {
        name: "RGRP Super Admin",
        email: ADMIN_BOOTSTRAP_EMAIL,
        passwordHash,
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
      },
      update: {
        name: "RGRP Super Admin",
        passwordHash,
        role: AdminRole.SUPER_ADMIN,
        isActive: true,
      },
    });

    console.log("Bootstrap admin is ready.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (
    error instanceof Error &&
    (error.message.startsWith("ADMIN_BOOTSTRAP_") ||
      error.message.startsWith("DATABASE_URL"))
  ) {
    console.error(error.message);
  } else {
    console.error(
      "Admin bootstrap failed. Check the server environment and database configuration.",
    );
  }
  process.exitCode = 1;
});
