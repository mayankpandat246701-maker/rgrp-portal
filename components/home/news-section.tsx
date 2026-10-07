import Image from "next/image";
import Link from "next/link";
import { CalendarDays, ArrowRight, Newspaper } from "lucide-react";
import { formatHindiDate } from "@/lib/i18n/hi";

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
    <section
      aria-labelledby="news-title"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-orange-50/40 py-16 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
            <Newspaper className="h-4 w-4" />
            News & Updates
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            समाचार
            <span className="block text-orange-600">और सूचनाएँ</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            परिषद की ताजा गतिविधियाँ, घोषणाएँ, सेवा कार्य और महत्वपूर्ण अपडेट।
          </p>
        </div>

        {posts.length ? (
          <div className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-500">
                नवीनतम अपडेट
              </p>
              <Link
                href="/samachar"
                className="group inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800"
              >
                सभी समाचार देखें
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.orange.300)_transparent]">
              {posts.map((post) => (
                <article
                  key={post.slug}
                  className="group relative w-[300px] shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-white/80 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg sm:w-[340px]"
                >
                  {post.coverImageStorageKey ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        alt={post.coverImageAltHindi || post.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        height={176}
                        src={`/api/samachar/${encodeURIComponent(post.slug)}/cover`}
                        unoptimized
                        width={480}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                      <Newspaper className="h-10 w-10 text-orange-500" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                        {post.category}
                      </span>

                      {post.publishedAt ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {formatHindiDate(post.publishedAt)}
                        </span>
                      ) : null}
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">
                      {post.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {post.shortSummary}
                    </p>

                    <Link
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-700 transition group-hover:text-orange-800"
                      href={`/samachar/${encodeURIComponent(post.slug)}`}
                    >
                      पूरा समाचार पढ़ें
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-orange-100 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
            <Newspaper className="mx-auto h-10 w-10 text-orange-400" />
            <p className="mt-4 text-base font-semibold text-slate-700">
              अभी कोई प्रकाशित समाचार उपलब्ध नहीं है।
            </p>
            <p className="mt-1 text-sm text-slate-500">
              नए अपडेट जल्द ही यहाँ उपलब्ध होंगे।
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/samachar"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            सभी समाचार देखें
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}