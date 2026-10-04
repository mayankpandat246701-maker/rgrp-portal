import { HandHeart, Megaphone, ShieldCheck } from "lucide-react";
import { GlassLink } from "@/components/ui/glass-button";
import { SectionHeading } from "@/components/home/section-heading";

const pillars = [
  { icon: HandHeart, title: "गौ सेवा", text: "गौशालाओं, बीमार एवं निराश्रित गौवंश की देखभाल और सहायता।" },
  { icon: ShieldCheck, title: "गौ संरक्षण", text: "गौवंश की सुरक्षा हेतु कानूनी जागरूकता और प्रशासन से समन्वय।" },
  { icon: Megaphone, title: "जन जागरण", text: "समाज में गौ माता के महत्व और भारतीय संस्कृति के प्रति जागरूकता।" },
];

export function IntroSection() {
  return (
    <section id="about" aria-labelledby="about-title" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto grid w-full max-w-6xl items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <SectionHeading
            id="about-title"
            eyebrow="संगठन परिचय · About"
            title="गौ रक्षा के लिए समर्पित संगठन"
            description="राष्ट्रीय गौ रक्षा परिषद देश भर के कार्यकर्ताओं को एक मंच पर जोड़कर गौ सेवा, संरक्षण और जन जागरण का कार्य करता है। यह पोर्टल कार्यकर्ता पंजीकरण, दस्तावेज़ सत्यापन और पहचान पत्र की प्रक्रिया को सरल और पारदर्शी बनाता है।"
            align="left"
          />
          <GlassLink href="/about" variant="secondary" className="mt-8">
            और जानें · About RGRP
          </GlassLink>
        </div>
        <ul className="grid gap-4">
          {pillars.map(({ icon: Icon, title, text }) => (
            <li key={title} className="glass flex items-start gap-4 rounded-2xl p-5">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-saffron-100 text-saffron-700">
                <Icon aria-hidden className="size-6" />
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-cocoa-900">{title}</h3>
                <p className="mt-1 leading-relaxed text-cocoa-700">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
