import type { Metadata } from "next";
import { KaryakartaIdCardPanel } from "@/app/karyakarta/dashboard/karyakarta-id-card-panel";
import { getCurrentKaryakarta } from "@/lib/auth/require-karyakarta";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "कार्यकर्ता डैशबोर्ड",
};

export default async function KaryakartaDashboardPage() {
  const member = await getCurrentKaryakarta();
  if (!member) redirect("/karyakarta/login");

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <header>
        <p className="text-xs font-bold tracking-[0.14em] text-orange-700 uppercase">
          सदस्य डैशबोर्ड
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
          नमस्ते, {member.name}
        </h1>
        <p className="mt-2 font-mono text-xs text-stone-600">{member.regNo}</p>
      </header>
      <div className="mt-6">
        <KaryakartaIdCardPanel />
      </div>
    </main>
  );
}

