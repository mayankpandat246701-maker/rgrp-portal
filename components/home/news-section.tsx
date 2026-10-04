import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/home/section-heading";
import { hi, formatHindiDate } from "@/lib/i18n/hi";

type NewsCard = {
  slug: string;
  title: string;
  shortSummary: string;
  category: string;
  publishedAt: Date | null;
  coverImageStorageKey: string | null;
  coverImageAltHindi: string | null;
};

export function NewsSection({ posts }: { posts: NewsCard[] }) {
  return (
    <section aria-labelledby="news-title" className="px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading id="news-title" eyebrow="सूचनाएँ" title={hi.news.title} description={hi.news.subtitle} />
        {posts.length ? (
          <ul className="mt-10 grid gap-5 md:grid-cols-3">{posts.map((post) => (
            <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" key={post.slug}>
              {post.coverImageStorageKey ? <Image alt={post.coverImageAltHindi || post.title} className="h-48 w-full object-cover" height={192} src={`/api/samachar/${encodeURIComponent(post.slug)}/cover`} unoptimized width={480} /> : null}
              <article className="p-5"><p className="text-xs font-semibold text-emerald-800">{post.category}{post.publishedAt ? ` · ${formatHindiDate(post.publishedAt)}` : ""}</p><h3 className="mt-2 text-lg font-bold text-stone-950">{post.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{post.shortSummary}</p><Link className="mt-4 inline-flex font-semibold text-emerald-900 underline" href={`/samachar/${encodeURIComponent(post.slug)}`}>पूरा समाचार पढ़ें</Link></article>
            </li>
          ))}</ul>
        ) : <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">अभी कोई प्रकाशित समाचार उपलब्ध नहीं है।</p>}
        <p className="mt-7 text-center"><Link className="inline-flex min-h-11 items-center rounded-xl border border-emerald-800 px-5 font-semibold text-emerald-900" href="/samachar">{hi.news.all}</Link></p>
      </div>
    </section>
  );
}
