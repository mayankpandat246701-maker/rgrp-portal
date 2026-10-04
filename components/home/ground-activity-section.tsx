import Image from "next/image";
import Link from "next/link";
import { SectionHeading } from "@/components/home/section-heading";
import { formatHindiDate, hi } from "@/lib/i18n/hi";
import { publicActivityLocation } from "@/lib/public-content";

type ActivityCard = {
  slug: string;
  title: string;
  shortSummary: string;
  activityDate: Date;
  state: string;
  district: string;
  publicLocationLabel: string | null;
  exactLocationPublic: boolean;
  coverImageStorageKey: string | null;
  coverImageAltHindi: string | null;
};

export function GroundActivitySection({ activities }: { activities: ActivityCard[] }) {
  return (
    <section aria-labelledby="ground-work-title" className="px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading id="ground-work-title" eyebrow="मैदानी सेवा" title={hi.groundWork.title} description={hi.groundWork.subtitle} />
        {activities.length ? (
          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{activities.map((activity) => (
            <li className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" key={activity.slug}>
              {activity.coverImageStorageKey ? <Image alt={activity.coverImageAltHindi || activity.title} className="h-48 w-full object-cover" height={192} src={`/api/hamare-karya/${encodeURIComponent(activity.slug)}/cover`} unoptimized width={480} /> : null}
              <article className="p-5"><p className="text-xs font-semibold text-emerald-800">{formatHindiDate(activity.activityDate)} · {publicActivityLocation(activity)}</p><h3 className="mt-2 text-lg font-bold text-stone-950">{activity.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">{activity.shortSummary}</p><Link className="mt-4 inline-flex font-semibold text-emerald-900 underline" href={`/hamare-karya/${encodeURIComponent(activity.slug)}`}>कार्य का विवरण देखें</Link></article>
            </li>
          ))}</ul>
        ) : <p className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">अभी कोई प्रकाशित कार्य उपलब्ध नहीं है।</p>}
        <p className="mt-7 text-center"><Link className="inline-flex min-h-11 items-center rounded-xl border border-emerald-800 px-5 font-semibold text-emerald-900" href="/hamare-karya">{hi.groundWork.all}</Link></p>
      </div>
    </section>
  );
}
