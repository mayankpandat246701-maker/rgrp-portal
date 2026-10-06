import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type PageProps = { params: Promise<{ slug: string }> };

async function findPublicMember(slug: string) {
  return prisma.karyakarta.findFirst({
    where: {
      slug,
      profileStatus: "ACTIVE",
      isPublicProfile: true,
      isEmergencyHidden: false,
      archivedAt: null,
      registrations: {
        some: {
          status: "ACTIVE",
          OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        },
      },
    },
    select: {
      slug: true,
      name: true,
      daitva: true,
      state: true,
      district: true,
      publicBio: true,
      profilePhotoPath: true,
      appointmentStartDate: true,
      appointmentEndDate: true,
      appointmentDocumentPath: true,
      instagramUrl: true,
      facebookUrl: true,
      youtubeUrl: true,
      whatsappContactUrl: true,
      registrations: {
        where: {
          status: "ACTIVE",
          OR: [{ expiryDate: null }, { expiryDate: { gt: new Date() } }],
        },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { registrationNumber: true, expiryDate: true },
      },
    },
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await findPublicMember(slug);
  if (!member) return { title: "à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾ à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤‰à¤ªà¤²à¤¬à¥à¤§ à¤¨à¤¹à¥€à¤‚ à¤¹à¥ˆ", robots: { index: false, follow: false } };
  return {
    title: `${member.name} | à¤¸à¤•à¥à¤·à¤® à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾`,
    alternates: { canonical: `/saksham-karyakarta/${encodeURIComponent(member.slug)}` },
    description: [
      member.daitva,
      [member.district, member.state].filter(Boolean).join(", "),
    ].filter(Boolean).join(" â€” "),
  };
}

export default async function KaryakartaProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const member = await findPublicMember(slug);
  if (!member) notFound();
  const registration = member.registrations.find(
    (item) => !item.expiryDate || item.expiryDate > new Date(),
  );
  const socials = [
    ["Instagram", member.instagramUrl],
    ["Facebook", member.facebookUrl],
    ["YouTube", member.youtubeUrl],
    ["WhatsApp Contact", member.whatsappContactUrl],
  ].filter((item): item is [string, string] => Boolean(item[1]));

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-900 underline-offset-4 hover:underline" href="/saksham-karyakarta">â† à¤¸à¤­à¥€ à¤¸à¤•à¥à¤·à¤® à¤•à¤¾à¤°à¥à¤¯à¤•à¤°à¥à¤¤à¤¾</Link>
      <article className="mt-6 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm">
        <div className="bg-emerald-950 px-6 py-8 text-white sm:px-10">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            {member.profilePhotoPath ? (
              <Image
                alt={`${member.name} à¤•à¤¾ à¤ªà¥à¤°à¥‹à¤«à¤¼à¤¾à¤‡à¤² à¤šà¤¿à¤¤à¥à¤°`}
                className="h-28 w-28 rounded-full border-4 border-white/20 object-cover"
                height={112}
                src={`/api/saksham-karyakarta/${encodeURIComponent(member.slug)}/photo`}
                width={112}
              />
            ) : (
              <div aria-hidden="true" className="flex h-28 w-28 items-center justify-center rounded-full bg-emerald-800 text-4xl font-bold text-white">{member.name.slice(0, 1)}</div>
            )}
            <div>
              <span className="inline-flex rounded-full bg-emerald-800 px-3 py-1 text-xs font-semibold text-emerald-100">âœ“ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤</span>
              <h1 className="mt-3 text-3xl font-bold">{member.name}</h1>
              <p className="mt-2 text-emerald-100">{member.daitva}</p>
              <p className="mt-1 text-sm text-emerald-100/80">{[member.district, member.state].filter(Boolean).join(", ")}</p>
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          {member.publicBio ? <p className="whitespace-pre-wrap leading-7 text-stone-700">{member.publicBio}</p> : null}
          {socials.length > 0 ? (
            <div className="mt-6 flex flex-wrap gap-3">
              {socials.map(([label, url]) => (
                <a className="rounded-xl border border-stone-200 px-4 py-2 text-sm font-semibold text-emerald-900 hover:bg-emerald-50" href={url} key={label} rel="noopener noreferrer" target="_blank">{label}</a>
              ))}
            </div>
          ) : null}
          {member.appointmentStartDate || member.appointmentEndDate || member.appointmentDocumentPath ? (
            <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <h2 className="text-base font-bold text-emerald-950">नियुक्ति जानकारी</h2>
              {member.appointmentStartDate || member.appointmentEndDate ? (
                <p className="mt-2 text-sm text-emerald-900">
                  नियुक्ति अवधि:{" "}
                  {[
                    member.appointmentStartDate
                      ? new Date(member.appointmentStartDate).toLocaleDateString("hi-IN")
                      : null,
                    member.appointmentEndDate
                      ? new Date(member.appointmentEndDate).toLocaleDateString("hi-IN")
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" से ")}
                </p>
              ) : null}
              {member.appointmentDocumentPath ? (
                <a
                  className="mt-3 inline-flex rounded-xl bg-emerald-800 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-700"
                  href={`/api/saksham-karyakarta/${encodeURIComponent(member.slug)}/appointment`}
                  rel="noreferrer"
                  target="_blank"
                >
                  नियुक्ति पत्र देखें
                </a>
              ) : null}
            </div>
          ) : null}
          <div className="mt-8 border-t border-stone-200 pt-6">
            {registration ? (
              <Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-900 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-800" href={`/verify-id?reg=${encodeURIComponent(registration.registrationNumber)}`}>à¤ªà¤‚à¤œà¥€à¤•à¤°à¤£ à¤¸à¤¤à¥à¤¯à¤¾à¤ªà¤¿à¤¤ à¤•à¤°à¥‡à¤‚</Link>
            ) : (
              <p className="text-sm text-stone-600">à¤ªà¤‚à¤œà¥€à¤•à¤°à¤£ à¤•à¥€ à¤œà¤¾à¤¨à¤•à¤¾à¤°à¥€ à¤†à¤§à¤¿à¤•à¤¾à¤°à¤¿à¤• à¤ªà¥à¤°à¤¶à¤¾à¤¸à¤¨ à¤¸à¥‡ à¤ªà¥à¤°à¤¾à¤ªà¥à¤¤ à¤•à¤°à¥‡à¤‚à¥¤</p>
            )}
          </div>
        </div>
      </article>
    </main>
  );
}

