import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageKaryakarta } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { IdCardSearchForm } from "@/app/admin/(dashboard)/id-cards/id-card-search-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "पहचान पत्र",
  robots: { index: false, follow: false },
};

export default async function AdminIdCardsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageKaryakarta(admin.role)) redirect("/admin/dashboard");

  return (
    <section className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href="/admin/dashboard"
      >
        डैशबोर्ड पर वापस जाएँ
      </Link>
      <header className="mt-5">
        <h1 className="text-3xl font-bold tracking-tight text-stone-950">
          कार्यकर्ता पहचान पत्र
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          पंजीकरण संख्या और पंजीकृत मोबाइल नंबर से कार्यकर्ता खोजें, पात्रता
          देखें और पहचान पत्र का पूर्वावलोकन या डाउनलोड करें।
        </p>
      </header>
      <div className="mt-6">
        <IdCardSearchForm />
      </div>
    </section>
  );
}
