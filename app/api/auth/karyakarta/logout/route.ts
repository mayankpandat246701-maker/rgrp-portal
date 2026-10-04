import { jsonOk } from "@/lib/api-response";
import { clearKaryakartaSession } from "@/lib/auth/karyakarta-session";

export async function POST() {
  await clearKaryakartaSession();
  return jsonOk();
}
