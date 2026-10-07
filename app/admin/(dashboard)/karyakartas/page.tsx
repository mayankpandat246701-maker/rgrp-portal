import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canManageKaryakarta, karyakartaScopeWhere } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "कार्यकर्ता प्रबंधन" };

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminKaryakartaListPage({ searchParams }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageKaryakarta(admin.role)) redirect("/admin/dashboard");
  const params = await searchParams;
  const get = (key: string) => typeof params[key] === "string" ? (params[key] as string).trim() : "";
  const q = get("q").slice(0, 100);
  const status = get("status");
  const state = get("state").slice(0, 120);
  const district = get("district").slice(0, 120);
  const requestedPage = Number(get("page"));
  const page = Math.max(
    1,
    Math.min(10_000, Number.isSafeInteger(requestedPage) ? requestedPage : 1),
  );
  const filters = {
    ...(status && ["DRAFT", "PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "REVOKED", "REJECTED", "EXPIRED", "ARCHIVED"].includes(status) ? { profileStatus: status as "DRAFT" | "PENDING" | "ACTIVE" | "INACTIVE" | "SUSPENDED" | "REVOKED" | "REJECTED" | "EXPIRED" | "ARCHIVED" } : {}),
    ...(q ? { OR: [
      { name: { contains: q, mode: "insensitive" as const } },
      { regNo: { contains: q.toUpperCase(), mode: "insensitive" as const } },
      { state: { contains: q, mode: "insensitive" as const } },
      { district: { contains: q, mode: "insensitive" as const } },
      { daitva: { contains: q, mode: "insensitive" as const } },
    ] } : {}),
    ...(state ? { state } : {}),
    ...(district ? { district } : {}),
  };
  const where = { AND: [karyakartaScopeWhere(admin), filters] };
  const [members, total] = await prisma.$transaction([
    prisma.karyakarta.findMany({
      where,
      select: { id: true, slug: true, regNo: true, name: true, daitva: true, state: true, district: true, profileStatus: true, isPublicProfile: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
      skip: (page - 1) * 50,
    }),
    prisma.karyakarta.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / 50));
  const statusLabels: Record<string, string> = {
    DRAFT: "प्रारूप",
    PENDING: "लंबित",
    ACTIVE: "सक्रिय",
    INACTIVE: "निष्क्रिय",
    SUSPENDED: "निलंबित",
    REVOKED: "रद्द",
    REJECTED: "अस्वीकृत",
    EXPIRED: "समाप्त",
    ARCHIVED: "संग्रहीत",
  };
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/dashboard">डैशबोर्ड पर लौटें</Link>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-3xl font-bold tracking-tight text-stone-950">कार्यकर्ता प्रबंधन</h1><p className="mt-2 text-sm text-stone-600">कार्यकर्ता प्रोफ़ाइल और पंजीकरण रिकॉर्ड खोजें और प्रबंधित करें।</p></div>
        <Link className="inline-flex min-h-11 items-center rounded-xl bg-emerald-900 px-5 text-sm font-semibold text-white" href="/admin/karyakartas/new">नया कार्यकर्ता जोड़ें</Link>
      </div>
      <form className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_12rem_12rem_14rem_auto]" method="get">
        <label className="sr-only" htmlFor="member-search">कार्यकर्ता खोजें</label>
        <input className="min-h-11 rounded-lg border px-3 text-sm" defaultValue={q} id="member-search" maxLength={100} name="q" placeholder="नाम, पंजीकरण संख्या, राज्य, जिला या दायित्व" />
        <label className="sr-only" htmlFor="member-state">राज्य</label><input className="min-h-11 rounded-lg border px-3 text-sm" defaultValue={state} id="member-state" maxLength={120} name="state" placeholder="राज्य" />
        <label className="sr-only" htmlFor="member-district">जिला</label><input className="min-h-11 rounded-lg border px-3 text-sm" defaultValue={district} id="member-district" maxLength={120} name="district" placeholder="जिला" />
        <label className="sr-only" htmlFor="member-status">स्थिति</label>
        <select className="min-h-11 rounded-lg border px-3 text-sm" defaultValue={status} id="member-status" name="status"><option value="">सभी स्थितियाँ</option>{["DRAFT", "PENDING", "ACTIVE", "INACTIVE", "SUSPENDED", "REVOKED", "REJECTED", "EXPIRED", "ARCHIVED"].map((value) => <option key={value}>{value}</option>)}</select>
        <button className="min-h-11 rounded-lg bg-emerald-900 px-5 text-sm font-semibold text-white" type="submit">खोजें</button>
      </form>
      <div className="mt-5 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
        <table className="w-full min-w-[760px] border-collapse text-left text-sm">
          <thead className="bg-stone-50 text-xs tracking-wide text-stone-600"><tr><th className="px-4 py-3">कार्यकर्ता</th><th className="px-4 py-3">पंजीकरण</th><th className="px-4 py-3">दायित्व</th><th className="px-4 py-3">क्षेत्र</th><th className="px-4 py-3">स्थिति</th><th className="px-4 py-3">सार्वजनिक</th><th className="px-4 py-3">कार्यवाही</th></tr></thead>
          <tbody className="divide-y divide-stone-100">{members.map((member) => <tr key={member.id}><td className="px-4 py-3 font-semibold text-stone-950">{member.name}</td><td className="px-4 py-3 font-mono text-xs">{member.regNo}</td><td className="px-4 py-3">{member.daitva}</td><td className="px-4 py-3">{[member.district, member.state].filter(Boolean).join(", ")}</td><td className="px-4 py-3"><span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold">{statusLabels[member.profileStatus] ?? member.profileStatus}</span></td><td className="px-4 py-3">{member.isPublicProfile ? "हाँ" : "नहीं"}</td><td className="px-4 py-3"><Link className="font-semibold text-emerald-900 underline" href={`/admin/karyakartas/${encodeURIComponent(member.id)}/edit`}>संपादित करें</Link></td></tr>)}</tbody>
        </table>
        {members.length === 0 ? <p className="p-8 text-center text-stone-600">इन फ़िल्टर से कोई कार्यकर्ता नहीं मिला।</p> : null}
      </div>
      <nav aria-label="कार्यकर्ता सूची पृष्ठ" className="mt-5 flex justify-center gap-4 text-sm">{page > 1 ? <Link href={{ pathname: "/admin/karyakartas", query: { q, status, page: String(page - 1) } }}>पिछला पृष्ठ</Link> : null}<span>पृष्ठ {page} / {totalPages} · कुल {total} रिकॉर्ड</span>{page < totalPages ? <Link href={{ pathname: "/admin/karyakartas", query: { q, status, page: String(page + 1) } }}>अगला पृष्ठ</Link> : null}</nav>
    </section>
  );
}
