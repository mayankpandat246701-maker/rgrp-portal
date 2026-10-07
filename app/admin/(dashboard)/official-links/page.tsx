import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { OfficialLinksManager } from "@/app/admin/(dashboard)/official-links/official-links-manager";
import {
  canManageOfficialLinks,
  officialLinkManagementWhere,
} from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "आधिकारिक लिंक प्रबंधन" };

export default async function AdminOfficialLinksPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageOfficialLinks(admin.role)) redirect("/admin/dashboard");
  const links = await prisma.officialSocialLink.findMany({
    where: officialLinkManagementWhere(admin),
    orderBy: [{ level: "asc" }, { displayOrder: "asc" }, { title: "asc" }],
  });
  const allowedLevels =
    admin.role === "SUPER_ADMIN" || admin.role === "NATIONAL_ADMIN"
      ? (["NATIONAL", "STATE", "DISTRICT"] as const)
      : admin.role === "STATE_ADMIN"
        ? (["STATE", "DISTRICT"] as const)
        : (["DISTRICT"] as const);
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/dashboard">डैशबोर्ड पर वापस जाएँ</Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">आधिकारिक लिंक प्रबंधन</h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">राष्ट्रीय, राज्य और जिला स्तर के सार्वजनिक माध्यम प्रबंधित करें। संपर्क व्यक्ति का नाम केवल प्रशासकों को दिखेगा।</p>
      <OfficialLinksManager allowedLevels={[...allowedLevels]} initialLinks={links} />
    </section>
  );
}
