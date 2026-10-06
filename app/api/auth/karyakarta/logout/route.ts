import { clearKaryakartaSession } from "@/lib/auth/karyakarta-session";

export async function POST() {
  await clearKaryakartaSession();

  return Response.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
