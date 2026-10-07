import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const preferredNames = [
  "मयंक उपाध्याय",
  "उमंग शुक्ला",
  "बलविंदर सिंह",
];

export async function DirectoryPreviewSection() {
  const members = await prisma.karyakarta.findMany({
    where: {
      profileStatus: "ACTIVE",
      isPublicProfile: true,
      isEmergencyHidden: false,
      archivedAt: null,
      name: { in: preferredNames },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      daitva: true,
      state: true,
      district: true,
      profilePhotoPath: true,
    },
  });

  const orderedMembers = preferredNames
    .map((name) => members.find((member) => member.name === name))
    .filter((member): member is (typeof members)[number] => Boolean(member));

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-orange-50/60 to-white py-16 sm:py-20">
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
            <BadgeCheck className="h-4 w-4" />
            Saksham Karyakarta Directory
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            सत्यापित सक्षम कार्यकर्ताओं से करें
            <span className="mt-2 block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              सीधा संपर्क
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            राज्य और जिला अनुसार RGRP के सक्रिय सक्षम कार्यकर्ताओं को खोजें और उनकी प्रोफ़ाइल देखें।
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {orderedMembers.map((member) => (
            <article
              key={member.id}
              className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-white/80 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5"
            >
              <div className="flex items-center gap-4 p-6">
                {member.profilePhotoPath ? (
                  <Image
                    alt={`${member.name} का प्रोफ़ाइल चित्र`}
                    className="h-20 w-20 rounded-2xl object-cover"
                    height={80}
                    src={`/api/saksham-karyakarta/${encodeURIComponent(member.slug)}/photo`}
                    width={80}
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-2xl font-black text-white">
                    {member.name.slice(0, 1)}
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="truncate text-lg font-bold text-slate-900">
                    {member.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-orange-700">
                    {member.daitva || "कार्यकर्ता"}
                  </p>

                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {[member.district, member.state].filter(Boolean).join(", ") || "—"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-orange-100 px-6 py-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  सत्यापित
                </span>

                <Link
                  className="inline-flex items-center gap-2 text-sm font-bold text-orange-700 transition group-hover:text-orange-800"
                  href={`/saksham-karyakarta/${encodeURIComponent(member.slug)}`}
                >
                  प्रोफ़ाइल देखें
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/saksham-karyakarta"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            पूरी Saksham Directory देखें
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}