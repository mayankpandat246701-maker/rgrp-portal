import Link from "next/link";
import { HandHeart, Megaphone, Stethoscope, Users } from "lucide-react";

const activities = [
  {
    icon: HandHeart,
    title: "गौशाला सहायता",
    text: "स्थानीय गौशालाओं को चारा, पानी, आश्रय एवं आवश्यक संसाधनों की व्यवस्था में सहयोग।",
  },
  {
    icon: Stethoscope,
    title: "पशु चिकित्सा सेवा",
    text: "बीमार और घायल गौवंश के उपचार हेतु चिकित्सा शिविर, दवा सहायता एवं आपातकालीन सेवा।",
  },
  {
    icon: Megaphone,
    title: "जन जागरण अभियान",
    text: "गाँव-गाँव गौ संरक्षण, भारतीय संस्कृति एवं संवेदनशीलता के प्रति जागरूकता कार्यक्रम।",
  },
  {
    icon: Users,
    title: "कार्यकर्ता प्रशिक्षण",
    text: "नए कार्यकर्ताओं हेतु संगठन, अनुशासन, सेवा कार्य एवं जिम्मेदारी का व्यावहारिक प्रशिक्षण।",
  },
];

export function ActivitiesSection() {
  return (
    <section
      id="activities"
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
            Our Initiatives
          </span>

          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
            हमारी पहल
            <span className="block text-orange-600">और सेवा कार्य</span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            गौ सेवा, संरक्षण, जन जागरण और कार्यकर्ता निर्माण—हमारी सेवा की दिशा
            समाज कल्याण और राष्ट्रहित में समर्पित है।
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {activities.map(({ icon: Icon, title, text }, index) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-2xl border border-orange-100 bg-white/70 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5"
            >
              <span
                aria-hidden="true"
                className="absolute right-5 top-5 text-5xl font-black text-orange-900/[0.05]"
              >
                {String(index + 1).padStart(2, "0")}
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

        <div className="mt-10 text-center">
          <Link
            href="/join"
            className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
          >
            अभियान से जुड़ें
            <span className="transition group-hover:translate-x-0.5">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}