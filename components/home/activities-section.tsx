import { Home, Stethoscope, Tent, Users } from "lucide-react";
import { GlassLink } from "@/components/ui/glass-button";
import { SectionHeading } from "@/components/home/section-heading";

const activities = [
  {
    icon: Home,
    title: "गौशाला सहायता",
    text: "स्थानीय गौशालाओं को चारा, पानी और आश्रय की व्यवस्था में सहयोग।",
  },
  {
    icon: Stethoscope,
    title: "पशु चिकित्सा सेवा",
    text: "बीमार और घायल गौवंश के उपचार हेतु चिकित्सा शिविर एवं सहायता।",
  },
  {
    icon: Tent,
    title: "जन जागरण शिविर",
    text: "गाँव-गाँव में गौ संरक्षण और भारतीय संस्कृति पर जागरूकता कार्यक्रम।",
  },
  {
    icon: Users,
    title: "कार्यकर्ता प्रशिक्षण",
    text: "नए कार्यकर्ताओं के लिए संगठन, अनुशासन और सेवा कार्य का प्रशिक्षण।",
  },
];

export function ActivitiesSection() {
  return (
    <section id="activities" aria-labelledby="activities-title" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            id="activities-title"
            eyebrow="गतिविधियाँ · Activities"
            title="हमारी पहल और सेवा कार्य"
            description="परिषद के कार्यकर्ता देश भर में निरंतर इन सेवा कार्यों में जुटे हैं।"
            align="left"
          />
          <GlassLink href="/join" variant="secondary" className="self-start md:self-auto">
            अभियान से जुड़ें
          </GlassLink>
        </div>
        <ul className="mt-10 grid gap-5 sm:grid-cols-2">
          {activities.map(({ icon: Icon, title, text }, index) => (
            <li key={title} className="glass flex gap-5 rounded-2xl p-6">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700">
                <Icon aria-hidden className="size-7" />
              </span>
              <div>
                <p className="text-xs font-semibold tracking-widest text-saffron-600">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-1 font-serif text-xl font-bold text-cocoa-900">{title}</h3>
                <p className="mt-2 leading-relaxed text-cocoa-700">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
