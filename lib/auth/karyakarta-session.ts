import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "rgrp_karyakarta_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;
const TOKEN_TYPE = "karyakarta";

const sessionSchema = z.object({
  sub: z.string().min(1),
  typ: z.literal(TOKEN_TYPE),
});

function getAuthSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("AUTH_SECRET must be configured with at least 32 characters.");
  }
  return new TextEncoder().encode(secret);
}

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export async function createKaryakartaSession(karyakartaId: string): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await new SignJWT({ typ: TOKEN_TYPE })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(karyakartaId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getAuthSecret());

  (await cookies()).set(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    expires: expiresAt,
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function clearKaryakartaSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}

async function verifyKaryakartaSessionId(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getAuthSecret(), {
      algorithms: ["HS256"],
    });
    const result = sessionSchema.safeParse(payload);
    return result.success ? result.data.sub : null;
  } catch {
    return null;
  }
}

export type CurrentKaryakarta = {
  id: string;
  regNo: string;
  name: string;
};

/**
 * Resolves the signed-in karyakarta from the database on every call so that
 * deactivation takes effect immediately, regardless of the token lifetime.
 */
export async function getCurrentKaryakarta(): Promise<CurrentKaryakarta | null> {
  const id = await verifyKaryakartaSessionId();
  if (!id) return null;

  return prisma.karyakarta.findFirst({
    where: { id, status: "APPROVED", passwordHash: { not: null } },
    select: { id: true, regNo: true, name: true },
  });
}
