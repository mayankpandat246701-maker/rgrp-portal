import { NextResponse } from "next/server";
import { canManageKaryakarta, hasKaryakartaScope } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { generateRegistrationNumber } from "@/lib/karyakarta-validation";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Authentication is required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!canManageKaryakarta(admin.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "State and district are required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  if (
    typeof body !== "object" ||
    body === null ||
    !("state" in body) ||
    typeof body.state !== "string" ||
    !("district" in body) ||
    typeof body.district !== "string" ||
    !body.state.trim() ||
    !body.district.trim()
  ) {
    return NextResponse.json({ error: "State and district are required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  const state = body.state.trim().slice(0, 120);
  const district = body.district.trim().slice(0, 120);
  if (!hasKaryakartaScope(admin, state, district)) {
    return NextResponse.json({ error: "Not authorized for this territory." }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const registrationNumber = generateRegistrationNumber(state, district);
    await prisma.adminActivity.create({
      data: {
        adminId: admin.id,
        action: "KARYAKARTA_REGISTRATION_NUMBER_GENERATED",
        entity: "Karyakarta",
        metadata: { state, district },
      },
    });
    return NextResponse.json({ registrationNumber }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Registration-number generation failed", {
      route: "/api/admin/karyakartas/registration-number",
      code: "KARYAKARTA_REGISTRATION_NUMBER_FAILED",
    });
    return NextResponse.json({ error: "Unable to generate a registration number." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
