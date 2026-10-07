import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageEditorialContent, karyakartaScopeWhere } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatHindiDate } from "@/lib/i18n/hi";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "मैदानी कार्य प्रबंधन", robots: { index: false, follow: false } };

export default async function AdminGroundActivityPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageEditorialContent(admin.role)) redirect("/admin/dashboard");
  const activities = await prisma.groundActivity.findMany({
    where: karyakartaScopeWhere(admin),
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: { id: true, slug: true, title: true, activityType: true, state: true, district: true, isPublished: true, archivedAt: true, activityDate: true },
  });
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline" href="/admin/dashboard">डैशबोर्ड पर वापस जाएँ</Link>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-bold">जमीनी कार्य प्रबंधन</h1><p className="mt-2 text-sm text-stone-600">मैदानी गतिविधियाँ जोड़ें, संपादित करें और प्रकाशित करें।</p></div><Link className="inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-5 font-semibold text-white" href="/admin/hamare-karya/new">नया कार्य जोड़ें</Link></header>
      {activities.length ? <div className="mt-7 overflow-x-auto rounded-2xl border bg-white"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-stone-50 text-xs text-stone-600"><tr><th className="px-4 py-3">कार्य</th><th className="px-4 py-3">प्रकार</th><th className="px-4 py-3">स्थान</th><th className="px-4 py-3">तिथि</th><th className="px-4 py-3">स्थिति</th><th className="px-4 py-3">कार्रवाई</th></tr></thead><tbody className="divide-y">{activities.map((item) => <tr key={item.id}><td className="px-4 py-3 font-semibold">{item.title}<span className="mt-1 block font-mono text-xs font-normal text-stone-500">{item.slug}</span></td><td className="px-4 py-3">{item.activityType}</td><td className="px-4 py-3">{item.district}, {item.state}</td><td className="px-4 py-3">{formatHindiDate(item.activityDate)}</td><td className="px-4 py-3">{item.archivedAt ? "संग्रहीत" : item.isPublished ? "प्रकाशित" : "प्रारूप"}</td><td className="px-4 py-3"><Link className="font-semibold text-emerald-900 underline" href={`/admin/hamare-karya/${encodeURIComponent(item.id)}/edit`}>संपादित करें</Link></td></tr>)}</tbody></table></div> : <p className="mt-7 rounded-2xl border bg-white p-10 text-center text-stone-600">अभी कोई मैदानी कार्य उपलब्ध नहीं है।</p>}
    </section>
  );
}
