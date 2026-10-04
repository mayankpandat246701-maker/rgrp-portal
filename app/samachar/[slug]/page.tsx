import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatHindiDate, hi } from "@/lib/i18n/hi";
import { publishedNewsWhere } from "@/lib/public-content";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

async function findPost(slug: string) {
  return prisma.newsPost.findFirst({
    where: { slug, ...publishedNewsWhere() },
    select: { slug: true, title: true, shortSummary: true, fullContent: true, category: true, publishedAt: true, updatedAt: true, coverImageStorageKey: true, coverImageAltHindi: true },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) return { title: hi.news.title, robots: { index: false, follow: false } };
  return { title: post.title, description: post.shortSummary, alternates: { canonical: `/samachar/${encodeURIComponent(post.slug)}` } };
}

export default async function NewsArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const post = await findPost(slug);
  if (!post) notFound();
  return <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
    <Link className="font-semibold text-emerald-900 underline" href="/samachar">← सभी समाचार</Link>
    <article className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">{post.coverImageStorageKey ? <Image alt={post.coverImageAltHindi || post.title} className="max-h-[28rem] w-full object-cover" height={448} src={`/api/samachar/${encodeURIComponent(post.slug)}/cover`} unoptimized width={1200} /> : null}<div className="p-6 sm:p-10"><p className="text-sm font-semibold text-emerald-800">{post.category}{post.publishedAt ? ` · ${formatHindiDate(post.publishedAt)}` : ""}</p><h1 className="mt-3 text-3xl font-bold leading-tight text-stone-950 sm:text-4xl">{post.title}</h1><p className="mt-4 text-lg leading-8 text-stone-600">{post.shortSummary}</p><div className="mt-7 whitespace-pre-wrap break-words border-t border-stone-100 pt-6 leading-8 text-stone-800">{post.fullContent}</div><p className="mt-8 text-xs text-stone-500">अंतिम अपडेट: {formatHindiDate(post.updatedAt)}</p></div></article>
  </main>;
}
