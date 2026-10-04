import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatHindiDate, hi } from "@/lib/i18n/hi";
import { publishedGroundActivityWhere, publicActivityLocation } from "@/lib/public-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: hi.groundWork.title, description: hi.groundWork.subtitle, alternates: { canonical: "/hamare-karya" } };
type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function GroundWorkPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(10_000, requestedPage)) : 1;
  const where = {
    ...publishedGroundActivityWhere(),
    ...(query ? { OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { shortSummary: { contains: query, mode: "insensitive" as const } },
      { state: { contains: query, mode: "insensitive" as const } },
      { district: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [activities, total] = await prisma.$transaction([
    prisma.groundActivity.findMany({
      where, orderBy: [{ activityDate: "desc" }, { createdAt: "desc" }],
      take: 12, skip: (page - 1) * 12,
      select: {
        slug: true, title: true, shortSummary: true, activityType: true, activityDate: true,
        state: true, district: true, publicLocationLabel: true, exactLocationPublic: true,
        coverImageStorageKey: true, coverImageAltHindi: true,
      },
    }),
    prisma.groundActivity.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 12));
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="rounded-3xl bg-emerald-950 px-6 py-9 text-white sm:px-10"><h1 className="text-3xl font-bold sm:text-4xl">{hi.groundWork.title}</h1><p className="mt-3 text-emerald-100">{hi.groundWork.subtitle}</p></header>
      <form className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4" method="get"><label className="sr-only" htmlFor="activity-search">कार्य खोजें</label><input className="min-h-11 min-w-60 flex-1 rounded-lg border px-3" id="activity-search" maxLength={100} name="q" placeholder="शीर्षक, जिला या राज्य खोजें" defaultValue={query} /><button className="min-h-11 rounded-lg bg-emerald-900 px-5 font-semibold text-white" type="submit">{hi.common.filter}</button>{query ? <Link className="inline-flex min-h-11 items-center rounded-lg border px-4" href="/hamare-karya">{hi.common.resetFilters}</Link> : null}</form>
      {activities.length ? <ul className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{activities.map((item) => <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white" key={item.slug}>{item.coverImageStorageKey ? <Image alt={item.coverImageAltHindi || item.title} className="h-48 w-full object-cover" height={192} src={`/api/hamare-karya/${encodeURIComponent(item.slug)}/cover`} unoptimized width={500} /> : null}<article className="p-5"><p className="text-xs font-semibold text-emerald-800">{item.activityType} · {formatHindiDate(item.activityDate)}</p><h2 className="mt-2 text-xl font-bold">{item.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{item.shortSummary}</p><p className="mt-2 text-xs text-stone-500">{publicActivityLocation(item)}</p><Link className="mt-4 inline-flex font-semibold text-emerald-900 underline" href={`/hamare-karya/${encodeURIComponent(item.slug)}`}>कार्य का विवरण देखें</Link></article></li>)}</ul> : <p className="mt-7 rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-600">{query ? "इस खोज के लिए कोई कार्य नहीं मिला।" : hi.common.noRecords}</p>}
      <nav aria-label="कार्य पृष्ठ" className="mt-7 flex justify-center gap-5 text-sm">{page > 1 ? <Link href={{ pathname: "/hamare-karya", query: { q: query, page: String(page - 1) } }}>पिछला पृष्ठ</Link> : null}<span>पृष्ठ {page} / {pages}</span>{page < pages ? <Link href={{ pathname: "/hamare-karya", query: { q: query, page: String(page + 1) } }}>अगला पृष्ठ</Link> : null}</nav>
    </main>
  );
}
