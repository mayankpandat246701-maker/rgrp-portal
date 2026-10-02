import { clearAdminSession } from "@/lib/auth/admin-session";

export async function POST() {
  await clearAdminSession();
  return Response.json(
    { success: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}
