import "server-only";

import { AdminRole } from "@prisma/client";
import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

export type AdminSessionPayload = {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
};

const SESSION_COOKIE_NAME = "rgrp_admin_session";
const SESSION_DURATION_SECONDS = 8 * 60 * 60;

const verifiedSessionSchema = z.object({
  sub: z.string().min(1),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(["SUPER_ADMIN", "NATIONAL_ADMIN", "CONTENT_ADMIN", "VIEWER"]),
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

export async function createAdminSession(
  admin: AdminSessionPayload,
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await new SignJWT({
    name: admin.name,
    email: admin.email,
    role: admin.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getAuthSecret());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    ...cookieOptions(),
    expires: expiresAt,
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function verifyAdminSession(): Promise<AdminSessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = getAuthSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    const result = verifiedSessionSchema.safeParse(payload);
    if (!result.success) return null;

    return {
      id: result.data.sub,
      name: result.data.name,
      email: result.data.email,
      role: result.data.role,
    };
  } catch {
    return null;
  }
}

export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
