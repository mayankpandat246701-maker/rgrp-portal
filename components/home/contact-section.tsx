import { ArrowRight } from "lucide-react";
import { GlassLink } from "@/components/ui/glass-button";

export function ContactSection() {
  return (
    <section id="contact" aria-labelledby="contact-title" className="scroll-mt-28 px-4 pt-6 pb-16 sm:px-6 lg:pb-24">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-saffron-500 via-saffron-600 to-saffron-700 p-8 text-white shadow-[0_30px_60px_-25px_rgba(120,60,15,0.6)] sm:p-12">
        <div aria-hidden className="pointer-events-none absolute -top-20 -right-20 size-72 rounded-full bg-white/15 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold tracking-[0.18em] text-saffron-100 uppercase">संपर्क एवं सहभागिता · Join Us</p>
            <h2 id="contact-title" className="mt-3 font-serif text-3xl leading-snug font-bold text-balance sm:text-4xl">
              गौ रक्षा के अभियान में आपका स्वागत है
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-pretty text-saffron-50">
              कार्यकर्ता के रूप में जुड़ें, अपने आवेदन की स्थिति जानें या किसी कार्यकर्ता की प्रामाणिकता सत्यापित करें।
              सहायता के लिए अपने ज़िला या प्रदेश कार्यकारिणी से संपर्क करें।
            </p>
          </div>
          <div className="flex flex-col gap-3 rounded-3xl border border-white/30 bg-white/15 p-5 backdrop-blur-md">
            <GlassLink
              href="/join"
              size="lg"
              variant="onDark"
              className="w-full"
            >
              कार्यकर्ता आवेदन करें
              <ArrowRight aria-hidden className="size-5" />
            </GlassLink>
            <GlassLink
              href="/application-status"
              variant="outlineOnDark"
              className="w-full"
            >
              आवेदन स्थिति देखें
            </GlassLink>
            <GlassLink
              href="/verify"
              variant="outlineOnDark"
              className="w-full"
            >
              कार्यकर्ता सत्यापन · Verify
            </GlassLink>
          </div>
        </div>
      </div>
    </section>
  );
}
