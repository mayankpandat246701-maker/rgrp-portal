import { getCurrentKaryakarta } from "@/lib/auth/require-karyakarta";

export async function GET() {
  const user = await getCurrentKaryakarta();
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
          regNo: user.regNo,
          name: user.name,
        },
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
