import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, MapPin, Activity } from "lucide-react";
import { formatHindiDate } from "@/lib/i18n/hi";
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
    <section
      id="ground-activities"
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
            <Activity className="h-4 w-4" />
            Ground Activities
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            जमीनी स्तर के
            <span className="block text-orange-600">कार्य</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            गाँव-गाँव, शहर-शहर चल रही गौ सेवा, संरक्षण एवं जन जागरण की सक्रियता।
          </p>
        </div>

        {activities.length ? (
          <div className="mt-12">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-semibold text-slate-500">
                नवीनतम गतिविधियाँ
              </p>
              <Link
                href="/hamare-karya"
                className="group inline-flex items-center gap-2 text-sm font-bold text-orange-700 hover:text-orange-800"
              >
                सभी कार्य देखें
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="mt-6 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:thin] [scrollbar-color:theme(colors.orange.300)_transparent]">
              {activities.map((activity) => (
                <article
                  key={activity.slug}
                  className="group relative w-[300px] shrink-0 overflow-hidden rounded-2xl border border-orange-100 bg-white/80 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg sm:w-[340px]"
                >
                  {activity.coverImageStorageKey ? (
                    <div className="relative h-44 w-full overflow-hidden">
                      <Image
                        alt={activity.coverImageAltHindi || activity.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        height={176}
                        src={`/api/hamare-karya/${encodeURIComponent(activity.slug)}/cover`}
                        unoptimized
                        width={480}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
                    </div>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                      <Activity className="h-10 w-10 text-orange-500" />
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-800">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatHindiDate(activity.activityDate)}
                      </span>

                      <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {publicActivityLocation(activity)}
                      </span>
                    </div>

                    <h3 className="mt-3 line-clamp-2 text-lg font-bold text-slate-900">
                      {activity.title}
                    </h3>

                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-600">
                      {activity.shortSummary}
                    </p>

                    <Link
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-orange-700 transition group-hover:text-orange-800"
                      href={`/hamare-karya/${encodeURIComponent(activity.slug)}`}
                    >
                      कार्य का विवरण देखें
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-12 rounded-2xl border border-orange-100 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
            <Activity className="mx-auto h-10 w-10 text-orange-400" />
            <p className="mt-4 text-base font-semibold text-slate-700">
              अभी कोई प्रकाशित कार्य उपलब्ध नहीं है।
            </p>
            <p className="mt-1 text-sm text-slate-500">
              नई गतिविधियाँ जल्द ही यहाँ उपलब्ध होंगी।
            </p>
          </div>
        )}

        <div className="mt-10 text-center">
          <Link
            href="/hamare-karya"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            सभी कार्य देखें
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}