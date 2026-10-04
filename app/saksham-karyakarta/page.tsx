import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { DirectoryFilters } from "@/app/saksham-karyakarta/directory-filters";
import { hi } from "@/lib/i18n/hi";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "सक्षम कार्यकर्ता",
  description: "राष्ट्रीय गौ रक्षा परिषद के सत्यापित कार्यकर्ता",
  alternates: { canonical: "/saksham-karyakarta" },
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SakshamKaryakartaPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const value = (key: string) =>
    typeof params[key] === "string" ? (params[key] as string).trim() : "";
  const q = value("q").slice(0, 100);
  const state = value("state").slice(0, 120);
  const district = value("district").slice(0, 120);
  const daitva = value("daitva").slice(0, 120);
  const sort = value("sort") === "recent" ? "recent" : "name";
  const page = Math.max(1, Math.min(10000, Number(value("page")) || 1));
  const pageSize = 24;
  const publicEligibility = {
    profileStatus: "ACTIVE" as const,
    isPublicProfile: true,
    isEmergencyHidden: false,
    archivedAt: null,
    registrations: {
      some: {
        status: "ACTIVE" as const,
        OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
      },
    },
  };
  const where = {
    ...publicEligibility,
    ...(state ? { state } : {}),
    ...(district ? { district } : {}),
    ...(daitva ? { daitva } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { regNo: { contains: q.toUpperCase(), mode: "insensitive" as const } },
            { daitva: { contains: q, mode: "insensitive" as const } },
            { state: { contains: q, mode: "insensitive" as const } },
            { district: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  let members: Array<{
    id: string;
    slug: string;
    name: string;
    daitva: string | null;
    state: string | null;
    district: string | null;
    profilePhotoPath: string | null;
  }> = [];
  let total = 0;
  let states: string[] = [];
  let districts: Array<{ state: string; district: string }> = [];
  let daitvas: string[] = [];
  let failed = false;
  try {
    const [results, count, stateOptions, districtOptions, dutyOptions] =
      await prisma.$transaction([
        prisma.karyakarta.findMany({
          where,
          select: {
            id: true,
            slug: true,
            name: true,
            daitva: true,
            state: true,
            district: true,
            profilePhotoPath: true,
          },
          orderBy:
            sort === "name"
              ? [{ name: "asc" }, { displayOrder: "asc" }]
              : [{ updatedAt: "desc" }],
          take: pageSize,
          skip: (page - 1) * pageSize,
        }),
        prisma.karyakarta.count({ where }),
        prisma.karyakarta.findMany({
          where: { ...publicEligibility, state: { not: null } },
          distinct: ["state"],
          select: { state: true },
          orderBy: { state: "asc" },
        }),
        prisma.karyakarta.findMany({
          where: { ...publicEligibility, state: { not: null }, district: { not: null } },
          distinct: ["state", "district"],
          select: { state: true, district: true },
          orderBy: [{ state: "asc" }, { district: "asc" }],
        }),
        prisma.karyakarta.findMany({
          where: { ...publicEligibility, daitva: { not: null } },
          distinct: ["daitva"],
          select: { daitva: true },
          orderBy: { daitva: "asc" },
        }),
      ]);
    members = results;
    total = count;
    states = stateOptions.flatMap((item) => item.state ? [item.state] : []);
    districts = districtOptions.flatMap((item) =>
      item.state && item.district ? [{ state: item.state, district: item.district }] : [],
    );
    daitvas = dutyOptions.flatMap((item) => item.daitva ? [item.daitva] : []);
  } catch {
    failed = true;
    console.error("Public karyakarta directory read failed", {
      route: "/saksham-karyakarta",
      code: "PUBLIC_KARYAKARTA_DIRECTORY_FAILED",
    });
  }

  const filters = { q, state, district, daitva, sort };
  const totalPages = Math.ceil(total / pageSize);
  const profileHref = (slug: string) => `/saksham-karyakarta/${encodeURIComponent(slug)}`;
  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="mb-8 rounded-3xl bg-emerald-950 px-6 py-10 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">राष्ट्रीय गौ रक्षा परिषद</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">सक्षम कार्यकर्ता</h1>
        <p className="mt-3 max-w-2xl text-sm text-emerald-100/85">राष्ट्रीय गौ रक्षा परिषद के सत्यापित कार्यकर्ता</p>
      </header>
      <DirectoryFilters states={states} districts={districts} daitvas={daitvas} values={filters} />

      {failed ? (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950" role="status">
          कार्यकर्ता सूची अभी उपलब्ध नहीं है। कृपया कुछ देर बाद फिर प्रयास करें।
        </div>
      ) : members.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-10 text-center">
          <h2 className="text-xl font-semibold text-stone-900">कोई कार्यकर्ता नहीं मिला</h2>
          <p className="mt-2 text-stone-600">खोज या फ़िल्टर बदलकर देखें।</p>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-stone-600">{total.toLocaleString("hi-IN")} सत्यापित कार्यकर्ता</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <article className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm" key={member.id}>
                <div className="flex items-center gap-4 p-5">
                  {member.profilePhotoPath ? (
                    <Image
                      alt={`${member.name} का प्रोफ़ाइल चित्र`}
                      className="h-20 w-20 rounded-full object-cover"
                      height={80}
                      src={`/api/saksham-karyakarta/${encodeURIComponent(member.slug)}/photo`}
                      width={80}
                    />
                  ) : (
                    <div aria-hidden="true" className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-900">
                      {member.name.slice(0, 1)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-stone-950">{member.name}</h2>
                    <p className="mt-1 text-sm text-stone-700">{member.daitva}</p>
                    <p className="mt-1 text-sm text-stone-500">{[member.district, member.state].filter(Boolean).join(", ")}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-stone-100 px-5 py-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
                    <span aria-hidden="true">✓</span> {hi.common.verified}
                  </span>
                  <Link className="text-sm font-semibold text-emerald-900 underline-offset-4 hover:underline" href={profileHref(member.slug)}>प्रोफ़ाइल देखें</Link>
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 ? (
            <nav aria-label="कार्यकर्ता सूची पृष्ठ" className="mt-8 flex justify-center gap-3">
              {page > 1 ? <Link className="rounded-lg border px-4 py-2 text-sm font-semibold" href={{ pathname: "/saksham-karyakarta", query: { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page: String(page - 1) } }}>पिछला पृष्ठ</Link> : null}
              <span className="px-3 py-2 text-sm text-stone-600">पृष्ठ {page} / {totalPages}</span>
              {page < totalPages ? <Link className="rounded-lg border px-4 py-2 text-sm font-semibold" href={{ pathname: "/saksham-karyakarta", query: { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page: String(page + 1) } }}>अगला पृष्ठ</Link> : null}
            </nav>
          ) : null}
        </>
      )}
    </main>
  );
}
