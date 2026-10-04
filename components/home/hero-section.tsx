import Image from "next/image";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { GlassLink } from "@/components/ui/glass-button";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="px-4 pt-8 pb-12 sm:px-6 sm:pt-12 lg:pb-20">
      <div className="glass-strong mx-auto grid w-full max-w-6xl items-center gap-10 rounded-[2rem] p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:p-14">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-saffron-700 uppercase">
            Rashtriya Gau Raksha Parishad
          </p>
          <h1
            id="hero-title"
            className="mt-4 font-serif text-4xl leading-tight font-bold text-balance text-cocoa-900 sm:text-5xl lg:text-6xl"
          >
            राष्ट्रीय गौ रक्षा परिषद
          </h1>
          <p className="mt-3 text-xl font-medium text-cocoa-700 sm:text-2xl">Rashtriya Gau Raksha Parishad</p>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-pretty text-cocoa-800">
            गौ माता की सेवा, संरक्षण और सम्मान के लिए समर्पित एक राष्ट्रव्यापी संगठन। कार्यकर्ता के रूप में जुड़ें और
            गौ रक्षा के इस अभियान का हिस्सा बनें।
          </p>

          <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/55 px-4 py-1.5 text-sm font-medium text-cocoa-800">
            <CheckCircle2 aria-hidden className="size-4 text-saffron-600" />
            RGRP Portal Foundation is Ready
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <GlassLink href="/join" size="lg" variant="primary">
              कार्यकर्ता आवेदन करें
              <ArrowRight aria-hidden className="size-5" />
            </GlassLink>
            <GlassLink href="/application-status" size="lg" variant="secondary">
              आवेदन स्थिति देखें
            </GlassLink>
          </div>
        </div>

        <div className="relative">
          <div className="overflow-hidden rounded-[1.5rem] border border-white/70 shadow-[0_25px_50px_-20px_rgba(120,60,15,0.45)]">
            <Image
              src="/images/hero-gau.png"
              alt="सूर्योदय के समय गौशाला में खड़ी गाय और बछड़ा"
              width={1024}
              height={1024}
              priority
              className="aspect-[4/3] h-auto w-full object-cover lg:aspect-square"
            />
          </div>
          <div className="glass absolute -bottom-5 left-4 rounded-2xl px-4 py-3 sm:left-6">
            <p className="font-serif text-lg font-bold text-cocoa-900">गौ सेवा · राष्ट्र सेवा</p>
            <p className="text-xs text-cocoa-700">सेवा, संरक्षण और जन जागरण</p>
          </div>
        </div>
      </div>
    </section>
  );
}
