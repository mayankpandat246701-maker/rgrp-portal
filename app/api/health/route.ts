import { getServerEnv } from "@/lib/env";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    getServerEnv();
    await prisma.$queryRaw`SELECT 1`;

    return Response.json({
      success: true,
      data: {
        service: "RGRP Portal",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
    });
  } catch {
    console.error("Database health check failed.");

    return Response.json(
      {
        success: false,
        error: {
          code: "DATABASE_UNAVAILABLE",
          message: "Database connection is currently unavailable.",
        },
      },
      { status: 503 },
    );
  }
}
