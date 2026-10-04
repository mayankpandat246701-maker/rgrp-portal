import { jwtVerify, type JWTPayload } from "jose";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const bodySchema = z
  .object({ token: z.string().min(1).max(4000) })
  .strict();

const tokenPayloadSchema = z.object({
  applicationReference: z.string().regex(/^RGRP-\d{8}-\d{5}$/),
  name: z.string().min(1).max(150),
  status: z.literal("APPROVED"),
  verificationTimestamp: z.string().datetime(),
  tokenType: z.literal("rgrp-application-verification"),
});

const invalidResponse = {
  success: false,
  error: { message: "QR सत्यापन नहीं हो सका।" },
};

function getQrVerificationSecrets(): Uint8Array[] {
  const configuredSecret = process.env.QR_SIGNING_SECRET;
  const keys = [
    configuredSecret,
    ...(process.env.NODE_ENV !== "production"
      ? [process.env.AUTH_SECRET]
      : []),
  ].filter(
    (secret, index, secrets): secret is string =>
      Boolean(secret) && secrets.indexOf(secret) === index,
  );
  if (
    keys.length === 0 ||
    keys.some((secret) => new TextEncoder().encode(secret).byteLength < 32)
  ) {
    throw new Error("QR verification is not configured.");
  }
  return keys.map((secret) => new TextEncoder().encode(secret));
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(invalidResponse, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }
  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return Response.json(invalidResponse, {
      status: 400,
      headers: { "Cache-Control": "no-store" },
    });
  }

  let applicationReference: string;
  let name: string;
  let verificationTimestamp: string;
  try {
    let verified: { payload: JWTPayload } | undefined;
    for (const secret of getQrVerificationSecrets()) {
      try {
        verified = await jwtVerify(parsedBody.data.token, secret, {
          algorithms: ["HS256"],
          issuer: "rgrp-portal",
          audience: "rgrp-qr-verification",
        });
        break;
      } catch {
        continue;
      }
    }
    if (!verified) throw new Error("QR token is invalid.");
    const parsedPayload = tokenPayloadSchema.safeParse(verified.payload);
    if (
      !parsedPayload.success ||
      verified.payload.sub !== parsedPayload.data.applicationReference
    ) {
      return Response.json(invalidResponse, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }
    applicationReference = parsedPayload.data.applicationReference;
    name = parsedPayload.data.name;
    verificationTimestamp = parsedPayload.data.verificationTimestamp;
  } catch {
    return Response.json(invalidResponse, {
      status: 404,
      headers: { "Cache-Control": "no-store" },
    });
  }

  try {
    const application = await prisma.karyakartaApplication.findFirst({
      where: {
        applicationReference,
        fullName: name,
        status: "APPROVED",
        uploadStatus: "VERIFIED",
        verifiedAt: new Date(verificationTimestamp),
        qrCodePath: { not: null },
      },
      select: {
        applicationReference: true,
        fullName: true,
        status: true,
        verifiedAt: true,
      },
    });
    if (!application || !application.verifiedAt) {
      return Response.json(invalidResponse, {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      });
    }

    return Response.json(
      {
        success: true,
        data: {
          applicationReference: application.applicationReference,
          name: application.fullName,
          status: application.status,
          verificationTimestamp: application.verifiedAt,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    console.error(
      JSON.stringify({
        event: "public_qr_verification_failed",
        category: "database_operation",
      }),
    );
    return Response.json(invalidResponse, {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
