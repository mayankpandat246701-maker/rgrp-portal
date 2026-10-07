import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageEditorialContent, karyakartaScopeWhere } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatHindiDate } from "@/lib/i18n/hi";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "समाचार प्रबंधन", robots: { index: false, follow: false } };

export default async function AdminNewsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageEditorialContent(admin.role)) redirect("/admin/dashboard");
  const posts = await prisma.newsPost.findMany({
    where: karyakartaScopeWhere(admin),
    orderBy: { updatedAt: "desc" },
    take: 100,
    select: {
      id: true, slug: true, title: true, category: true, isPublished: true,
      scheduledPublishAt: true, archivedAt: true, updatedAt: true,
    },
  });
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline" href="/admin/dashboard">डैशबोर्ड पर वापस जाएँ</Link>
      <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold text-stone-950">समाचार प्रबंधन</h1><p className="mt-2 text-sm text-stone-600">समाचार जोड़ें, संपादित करें और प्रकाशन नियंत्रित करें।</p></div>
        <Link className="inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-5 font-semibold text-white" href="/admin/samachar/new">नया समाचार जोड़ें</Link>
      </header>
      {posts.length ? (
        <div className="mt-7 overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-stone-50 text-xs text-stone-600"><tr><th className="px-4 py-3">शीर्षक</th><th className="px-4 py-3">श्रेणी</th><th className="px-4 py-3">स्थिति</th><th className="px-4 py-3">अपडेट</th><th className="px-4 py-3">कार्रवाई</th></tr></thead>
            <tbody className="divide-y divide-stone-100">{posts.map((post) => <tr key={post.id}>
              <td className="px-4 py-3 font-semibold">{post.title}<span className="mt-1 block font-mono text-xs font-normal text-stone-500">{post.slug}</span></td>
              <td className="px-4 py-3">{post.category}</td>
              <td className="px-4 py-3">{post.archivedAt ? "संग्रहीत" : post.scheduledPublishAt && post.scheduledPublishAt > new Date() ? "निर्धारित" : post.isPublished ? "प्रकाशित" : "प्रारूप"}</td>
              <td className="px-4 py-3">{formatHindiDate(post.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className="px-4 py-3"><Link className="font-semibold text-emerald-900 underline" href={`/admin/samachar/${encodeURIComponent(post.id)}/edit`}>संपादित करें</Link></td>
            </tr>)}</tbody>
          </table>
        </div>
      ) : <p className="mt-7 rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-600">अभी कोई समाचार उपलब्ध नहीं है।</p>}
    </section>
  );
}
