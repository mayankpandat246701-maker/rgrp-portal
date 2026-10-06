import { createHmac, timingSafeEqual } from "node:crypto";

const CAPTCHA_TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not configured");
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex");
}

export function generateCaptcha(): { question: string; token: string } {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  const expiresAt = Date.now() + CAPTCHA_TTL_MS;
  const payload = `${a + b}.${expiresAt}`;
  return {
    question: `${a} + ${b} = ?`,
    token: `${payload}.${sign(payload)}`,
  };
}

export function verifyCaptcha(token: unknown, answer: unknown): boolean {
  if (typeof token !== "string" || typeof answer !== "string") return false;

  const parts = token.split(".");
  if (parts.length !== 3) return false;

  const [sum, expiresAt, signature] = parts;
  const payload = `${sum}.${expiresAt}`;
  const expected = sign(payload);

  if (signature.length !== expected.length) return false;
  if (!timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return false;
  if (Number(expiresAt) < Date.now()) return false;

  return answer.trim() === sum;
}
