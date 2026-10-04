import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { KaryakartaForm } from "@/app/admin/karyakartas/karyakarta-form";
import { canManageKaryakarta, canPublishContent } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "नया कार्यकर्ता जोड़ें" };

export default async function NewKaryakartaPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageKaryakarta(admin.role)) redirect("/admin/dashboard");
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/karyakartas">कार्यकर्ता सूची पर लौटें</Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">नया कार्यकर्ता जोड़ें</h1>
      <p className="mt-2 text-sm text-stone-600">अधिकृत स्वीकृति मिलने तक नई प्रोफ़ाइल लंबित रहेगी।</p>
      <KaryakartaForm canApprove={canPublishContent(admin.role)} initialMember={null} />
    </section>
  );
}
