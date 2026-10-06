import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: Promise<{ slug: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { slug } = await context.params;

  const member = await prisma.karyakarta.findFirst({
    where: {
      slug,
      profileStatus: "ACTIVE",
      isPublicProfile: true,
      isEmergencyHidden: false,
      archivedAt: null,
      registrations: {
        some: {
          status: "ACTIVE",
          OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        },
      },
    },
    select: { appointmentDocumentPath: true },
  });

  if (!member?.appointmentDocumentPath) {
    return new NextResponse(null, { status: 404 });
  }

  try {
    const { readEncryptedPrivateFile } = await import("@/lib/private-uploads");
    const document = await readEncryptedPrivateFile(member.appointmentDocumentPath);

    return new NextResponse(new Uint8Array(document), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="niyukti-patra.pdf"',
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
