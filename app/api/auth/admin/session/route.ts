import { getCurrentAdmin } from "@/lib/auth/require-admin";

export async function GET() {
  const user = await getCurrentAdmin();
  if (!user) {
    return Response.json(
      {
        success: true,
        data: { authenticated: false, user: null },
      },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    {
      success: true,
      data: {
        authenticated: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
