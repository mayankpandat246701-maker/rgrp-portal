import Link from "next/link";
import {
  Globe,
  HandHeart,
  Megaphone,
  MessageCircle,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const pillars = [
  {
    icon: HandHeart,
    title: "गौ सेवा",
    text: "गौशालाओं, बीमार एवं निराश्रित गौवंश की देखभाल, उपचार एवं सहायता।",
  },
  {
    icon: ShieldCheck,
    title: "गौ संरक्षण",
    text: "गौवंश की सुरक्षा हेतु कानूनी जागरूकता, प्रशासनिक समन्वय एवं संरक्षण अभियान।",
  },
  {
    icon: Megaphone,
    title: "जन जागरण",
    text: "समाज में गौ माता के महत्व, भारतीय संस्कृति एवं संवेदनशीलता के प्रति जागरूकता।",
  },
];

function getSocialIcon(platform: string) {
  const value = platform.toLowerCase();

  if (value.includes("whatsapp")) return MessageCircle;
  return Globe;
}

export async function IntroSection() {
  const officialLinks = await prisma.officialSocialLink.findMany({
    where: {
      isPublic: true,
      isActive: true,
      visibility: "PUBLIC",
    },
    orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
    take: 8,
    select: {
      id: true,
      title: true,
      platform: true,
      url: true,
    },
  });

  return (
    <section
      id="about"
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
        <div className="grid items-start gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
              <Sparkles className="h-4 w-4" />
              संगठन परिचय
            </span>

            <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
              राष्ट्रीय गौ रक्षा परिषद भारत
              <span className="mt-2 block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                सेवा · संरक्षण · जागरण
              </span>
            </h2>

            <p className="mt-6 text-base leading-relaxed text-slate-600">
              राष्ट्रीय गौ रक्षा परिषद भारत देशभर के कार्यकर्ताओं को एक संगठित मंच पर जोड़कर गौ सेवा, गौ संरक्षण एवं जन जागरण का कार्य करती है।
            </p>

            <p className="mt-4 text-base leading-relaxed text-slate-600">
              हमारा उद्देश्य गौवंश की सुरक्षा, सम्मान एवं कल्याण सुनिश्चित करना है। यह पोर्टल कार्यकर्ता पंजीकरण, दस्तावेज़ सत्यापन, पहचान पत्र तथा नियुक्ति पत्र की प्रक्रिया को सरल, पारदर्शी एवं डिजिटल बनाता है।
            </p>

            <div className="mt-8">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                आधिकारिक लिंक
              </p>

              <div className="mt-4 flex flex-wrap gap-3">
                {officialLinks.map((link) => {
                  const Icon = getSocialIcon(link.platform);
                  const isWhatsApp = link.platform
                    .toLowerCase()
                    .includes("whatsapp");

                  return (
                    <Link
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={
                        isWhatsApp
                          ? "group inline-flex min-h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:-translate-y-0.5"
                          : "group inline-flex min-h-11 items-center gap-2 rounded-2xl border border-orange-200 bg-white/70 px-5 py-2.5 text-sm font-semibold text-slate-800 backdrop-blur transition hover:-translate-y-0.5 hover:border-orange-300 hover:bg-white"
                      }
                    >
                      <Icon aria-hidden className="h-4 w-4" />
                      {link.title}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {pillars.map(({ icon: Icon, title, text }) => (
              <div
                key={title}
                className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-white/80 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5"
              >
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-5 text-5xl font-black text-orange-900/[0.05]"
                >
                  {String(pillars.indexOf(pillars.find((p) => p.title === title)!) + 1).padStart(2, "0")}
                </span>

                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/20">
                  <Icon aria-hidden className="h-7 w-7" />
                </span>

                <h3 className="mt-5 text-xl font-bold text-slate-900">
                  {title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}