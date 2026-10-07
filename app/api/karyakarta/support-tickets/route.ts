import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentKaryakarta } from "@/lib/auth/require-karyakarta";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  category: z.enum([
    "PROFILE_CORRECTION",
    "ID_CARD_ISSUE",
    "CERTIFICATE_ISSUE",
    "REGISTRATION_RENEWAL",
    "MOBILE_NUMBER_CHANGE",
    "DOCUMENT_REUPLOAD",
    "OTHER",
  ]),
  subject: z.string().trim().min(5).max(120),
  message: z.string().trim().min(20).max(2000),
});

export async function GET() {
  const member = await getCurrentKaryakarta();
  if (!member) {
    return NextResponse.json(
      { success: false, error: { message: "Pehle karyakarta ke roop mein pravesh karein." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { karyakartaId: member.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      category: true,
      subject: true,
      message: true,
      status: true,
      adminResponse: true,
      createdAt: true,
      resolvedAt: true,
    },
  });

  return NextResponse.json(
    { success: true, data: { tickets } },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: Request) {
  const member = await getCurrentKaryakarta();
  if (!member) {
    return NextResponse.json(
      { success: false, error: { message: "Pehle karyakarta ke roop mein pravesh karein." } },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { message: "Invalid request." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: { message: "Please provide a valid category, subject, and message." } },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      karyakartaId: member.id,
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
    },
    select: {
      id: true,
      category: true,
      subject: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json(
    { success: true, data: { ticket } },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}
