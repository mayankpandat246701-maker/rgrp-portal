import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatHindiDate, hi } from "@/lib/i18n/hi";
import { publishedGroundActivityWhere, publicActivityLocation } from "@/lib/public-content";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

async function findActivity(slug: string) {
  return prisma.groundActivity.findFirst({
    where: { slug, ...publishedGroundActivityWhere() },
    select: {
      slug: true, title: true, shortSummary: true, fullDescription: true,
      activityType: true, activityDate: true, state: true, district: true,
      tehsilOrBlock: true, cityOrVillage: true, publicLocationLabel: true,
      exactLocationPublic: true, mapLink: true, updatedAt: true,
      coverImageStorageKey: true, coverImageAltHindi: true,
      images: { where: { isPublic: true }, orderBy: [{ displayOrder: "asc" }], select: { id: true, altTextHindi: true } },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const activity = await findActivity(slug);
  if (!activity) return { title: hi.groundWork.title, robots: { index: false, follow: false } };
  return { title: activity.title, description: activity.shortSummary, alternates: { canonical: `/hamare-karya/${encodeURIComponent(activity.slug)}` } };
}

export default async function GroundActivityDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const activity = await findActivity(slug);
  if (!activity) notFound();
  const location = publicActivityLocation(activity);
  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="font-semibold text-emerald-900 underline" href="/hamare-karya">← सभी कार्य</Link>
      <article className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        {activity.coverImageStorageKey ? <Image alt={activity.coverImageAltHindi || activity.title} className="max-h-[28rem] w-full object-cover" height={448} src={`/api/hamare-karya/${encodeURIComponent(activity.slug)}/cover`} unoptimized width={1200} /> : null}
        <div className="p-6 sm:p-10"><p className="text-sm font-semibold text-emerald-800">{activity.activityType} · {formatHindiDate(activity.activityDate)}</p><h1 className="mt-3 text-3xl font-bold sm:text-4xl">{activity.title}</h1><p className="mt-4 text-lg leading-8 text-stone-600">{activity.shortSummary}</p><p className="mt-3 text-sm font-semibold text-stone-600">{location}</p>{activity.exactLocationPublic && activity.mapLink ? <a className="mt-3 inline-flex font-semibold text-emerald-900 underline" href={activity.mapLink} rel="noopener noreferrer" target="_blank">मानचित्र पर देखें</a> : null}<div className="mt-7 whitespace-pre-wrap break-words border-t border-stone-100 pt-6 leading-8 text-stone-800">{activity.fullDescription}</div>
          {activity.images.length ? <section className="mt-8 border-t pt-6"><h2 className="text-xl font-bold">कार्य की झलकियाँ</h2><ul className="mt-4 grid gap-4 sm:grid-cols-2">{activity.images.map((image) => <li key={image.id}><Image alt={image.altTextHindi || activity.title} className="h-56 w-full rounded-xl object-cover" height={224} src={`/api/hamare-karya/${encodeURIComponent(activity.slug)}/images/${encodeURIComponent(image.id)}`} unoptimized width={480} /></li>)}</ul></section> : null}
          <p className="mt-8 text-xs text-stone-500">अंतिम अपडेट: {formatHindiDate(activity.updatedAt)}</p>
        </div>
      </article>
    </main>
  );
}
