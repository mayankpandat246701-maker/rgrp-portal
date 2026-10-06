import "server-only";

import { cookies } from "next/headers";
import { jwtVerify, SignJWT } from "jose";
import { z } from "zod";

export type KaryakartaSessionPayload = {
  regNo: string;
};

const SESSION_COOKIE_NAME = "rgrp_karyakarta_session";
const SESSION_DURATION_SECONDS = 4 * 60 * 60;

const verifiedSessionSchema = z.object({
  typ: z.literal("karyakarta"),
  regNo: z.string().min(1),
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

export async function createKaryakartaSession(
  session: KaryakartaSessionPayload,
): Promise<void> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);
  const token = await new SignJWT({
    typ: "karyakarta",
    regNo: session.regNo,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(session.regNo)
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

export async function verifyKaryakartaSession(): Promise<KaryakartaSessionPayload | null> {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const secret = getAuthSecret();
  try {
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });
    const result = verifiedSessionSchema.safeParse(payload);
    if (!result.success) return null;

    return { regNo: result.data.regNo };
  } catch {
    return null;
  }
}

export async function clearKaryakartaSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...cookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });
}
