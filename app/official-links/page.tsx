import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "आधिकारिक लिंक",
  description: "राष्ट्रीय गौ रक्षा परिषद के आधिकारिक संपर्क और सोशल लिंक।",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const platformLabel: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
  X: "X / Twitter",
  WHATSAPP_CHANNEL: "WhatsApp चैनल",
  WHATSAPP_GROUP: "WhatsApp समूह",
  WHATSAPP_CONTACT: "WhatsApp संपर्क",
  TELEGRAM: "Telegram",
  WEBSITE: "वेबसाइट",
  EMAIL: "ईमेल",
};

export default async function OfficialLinksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const state = typeof params.state === "string" ? params.state.trim().slice(0, 120) : "";
  const district = typeof params.district === "string" ? params.district.trim().slice(0, 120) : "";
  const where = {
    isPublic: true,
    isActive: true,
    visibility: "PUBLIC" as const,
    ...(state ? { OR: [{ level: "NATIONAL" as const }, { state }] } : {}),
    ...(district ? { district } : {}),
  };
  const [links, stateOptions, districtOptions] = await Promise.all([
    prisma.officialSocialLink.findMany({
      where,
      select: {
        id: true,
        title: true,
        platform: true,
        url: true,
        level: true,
        state: true,
        district: true,
        description: true,
        displayOrder: true,
      },
      orderBy: [{ level: "asc" }, { state: "asc" }, { district: "asc" }, { displayOrder: "asc" }],
    }),
    prisma.officialSocialLink.findMany({
      where: { isPublic: true, isActive: true, visibility: "PUBLIC", state: { not: null } },
      distinct: ["state"],
      select: { state: true },
      orderBy: { state: "asc" },
    }),
    prisma.officialSocialLink.findMany({
      where: { isPublic: true, isActive: true, visibility: "PUBLIC", district: { not: null } },
      distinct: ["district"],
      select: { district: true },
      orderBy: { district: "asc" },
    }),
  ]);
  const national = links.filter((link) => link.level === "NATIONAL");
  const local = links.filter((link) => link.level !== "NATIONAL");
  const group = (label: string, list: typeof links) =>
    list.length ? (
      <section className="mt-8" key={label}>
        <h2 className="text-xl font-bold text-stone-950">{label}</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {list.map((link) => (
            <article className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm" key={link.id}>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                {platformLabel[link.platform] ?? "आधिकारिक लिंक"}
                {link.state ? ` · ${link.state}` : ""}
                {link.district ? ` · ${link.district}` : ""}
              </p>
              <h3 className="mt-2 text-lg font-bold text-stone-950">{link.title}</h3>
              {link.description ? <p className="mt-2 text-sm text-stone-600">{link.description}</p> : null}
              {link.platform === "WHATSAPP_GROUP" ? (
                <p className="mt-2 text-xs text-stone-500">समूह के नियमों और अनुमति के अधीन जुड़ें। इस सार्वजनिक लिंक को अन्य लोग आगे साझा कर सकते हैं।</p>
              ) : null}
              <a className="mt-4 inline-flex rounded-lg bg-emerald-900 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800" href={link.url} rel="noopener noreferrer" target="_blank">
                {platformLabel[link.platform] ?? "लिंक"} खोलें
              </a>
            </article>
          ))}
        </div>
      </section>
    ) : null;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="rounded-3xl bg-emerald-950 px-6 py-9 text-white sm:px-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-200">राष्ट्रीय गौ रक्षा परिषद</p>
        <h1 className="mt-3 text-3xl font-bold sm:text-4xl">आधिकारिक लिंक</h1>
        <p className="mt-3 text-sm text-emerald-100/85">परिषद के आधिकारिक सोशल मीडिया और संपर्क माध्यम।</p>
      </header>
      <form className="mt-6 grid gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto_auto]" method="get">
        <label className="sr-only" htmlFor="state-filter">राज्य</label>
        <select className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm" defaultValue={state} id="state-filter" name="state">
          <option value="">सभी राज्य</option>
          {stateOptions.flatMap((item) => item.state ? [<option key={item.state} value={item.state}>{item.state}</option>] : [])}
        </select>
        <label className="sr-only" htmlFor="district-filter">जिला</label>
        <select className="min-h-11 rounded-xl border border-stone-300 px-3 text-sm" defaultValue={district} id="district-filter" name="district">
          <option value="">सभी जिले</option>
          {districtOptions.flatMap((item) => item.district ? [<option key={item.district} value={item.district}>{item.district}</option>] : [])}
        </select>
        <button className="min-h-11 rounded-xl bg-emerald-900 px-4 text-sm font-semibold text-white" type="submit">फ़िल्टर करें</button>
        <Link className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 px-4 text-sm font-semibold text-stone-700" href="/official-links">फ़िल्टर हटाएँ</Link>
      </form>
      {group("राष्ट्रीय लिंक", national)}
      {group("राज्य स्तरीय लिंक", local.filter((link) => link.level === "STATE"))}
      {group("जिला स्तरीय लिंक", local.filter((link) => link.level === "DISTRICT"))}
      {links.length === 0 ? <div className="mt-8 rounded-2xl border border-stone-200 bg-white p-8 text-center text-stone-600">इन फ़िल्टर के लिए अभी कोई आधिकारिक लिंक उपलब्ध नहीं है।</div> : null}
    </main>
  );
}
