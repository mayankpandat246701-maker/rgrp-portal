import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AdministratorManager } from "@/app/admin/(dashboard)/administrators/administrator-manager";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "प्रशासक पहुँच",
  robots: { index: false, follow: false },
};

export default async function AdministratorManagementPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/dashboard");
  const administrators = await prisma.admin.findMany({
    orderBy: [{ role: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      assignedState: true,
      assignedDistrict: true,
      isActive: true,
    },
  });
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/dashboard">डैशबोर्ड पर लौटें</Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">प्रशासक पहुँच</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">भूमिकाएँ और क्षेत्रीय अधिकार निर्धारित करें। पासवर्ड संग्रहित करने से पहले हैश किए जाते हैं और बनाने के बाद दोबारा नहीं दिखाए जाते।</p>
      <AdministratorManager currentAdminId={admin.id} initialAdministrators={administrators} />
    </section>
  );
}
