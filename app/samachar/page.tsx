import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { formatHindiDate, hi } from "@/lib/i18n/hi";
import { publishedNewsWhere } from "@/lib/public-content";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: hi.news.title, description: hi.news.subtitle, alternates: { canonical: "/samachar" } };

type PageProps = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function NewsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const requestedPage = Number(params.page);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(10_000, requestedPage)) : 1;
  const where = {
    ...publishedNewsWhere(),
    ...(query ? { OR: [
      { title: { contains: query, mode: "insensitive" as const } },
      { shortSummary: { contains: query, mode: "insensitive" as const } },
      { category: { contains: query, mode: "insensitive" as const } },
    ] } : {}),
  };
  const [posts, total] = await prisma.$transaction([
    prisma.newsPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      take: 12,
      skip: (page - 1) * 12,
      select: { slug: true, title: true, shortSummary: true, category: true, publishedAt: true, coverImageStorageKey: true, coverImageAltHindi: true },
    }),
    prisma.newsPost.count({ where }),
  ]);
  const pages = Math.max(1, Math.ceil(total / 12));
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="rounded-3xl bg-emerald-950 px-6 py-9 text-white sm:px-10"><h1 className="text-3xl font-bold sm:text-4xl">{hi.news.title}</h1><p className="mt-3 text-emerald-100">{hi.news.subtitle}</p></header>
      <form className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-stone-200 bg-white p-4" method="get"><label className="sr-only" htmlFor="news-search">समाचार खोजें</label><input className="min-h-11 min-w-60 flex-1 rounded-lg border px-3" id="news-search" maxLength={100} name="q" placeholder="समाचार खोजें" defaultValue={query} /><button className="min-h-11 rounded-lg bg-emerald-900 px-5 font-semibold text-white" type="submit">खोजें</button>{query ? <Link className="inline-flex min-h-11 items-center rounded-lg border px-4" href="/samachar">{hi.common.resetFilters}</Link> : null}</form>
      {posts.length ? <ul className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{posts.map((post) => <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white" key={post.slug}>{post.coverImageStorageKey ? <Image alt={post.coverImageAltHindi || post.title} className="h-48 w-full object-cover" height={192} src={`/api/samachar/${encodeURIComponent(post.slug)}/cover`} unoptimized width={500} /> : null}<article className="p-5"><p className="text-xs font-semibold text-emerald-800">{post.category}{post.publishedAt ? ` · ${formatHindiDate(post.publishedAt)}` : ""}</p><h2 className="mt-2 text-xl font-bold">{post.title}</h2><p className="mt-2 text-sm leading-6 text-stone-600">{post.shortSummary}</p><Link className="mt-4 inline-flex font-semibold text-emerald-900 underline" href={`/samachar/${encodeURIComponent(post.slug)}`}>पूरा समाचार पढ़ें</Link></article></li>)}</ul> : <p className="mt-7 rounded-2xl border border-stone-200 bg-white p-10 text-center text-stone-600">{query ? "इस खोज के लिए कोई समाचार नहीं मिला।" : hi.common.noRecords}</p>}
      <nav aria-label="समाचार पृष्ठ" className="mt-7 flex justify-center gap-5 text-sm">{page > 1 ? <Link href={{ pathname: "/samachar", query: { q: query, page: String(page - 1) } }}>पिछला पृष्ठ</Link> : null}<span>पृष्ठ {page} / {pages}</span>{page < pages ? <Link href={{ pathname: "/samachar", query: { q: query, page: String(page + 1) } }}>अगला पृष्ठ</Link> : null}</nav>
    </main>
  );
}
