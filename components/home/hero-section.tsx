import Link from "next/link";
import Image from "next/image";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-orange-300/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-amber-300/25 blur-3xl"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <Image
          src="/images/rgrp-logo.png"
          alt=""
          width={640}
          height={640}
          priority={false}
          className="h-auto w-[70%] max-w-[640px] opacity-[0.12] mix-blend-multiply sm:w-[45%]"
        />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl p-7 text-center sm:p-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            राष्ट्रीय गौ रक्षा परिषद भारत
          </span>

          <h1 className="mt-6 text-4xl font-black leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            सशक्त कार्यकर्ता,
            <span className="block bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 bg-clip-text text-transparent">
              सशक्त संगठन
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
            RGRP के सत्यापित सक्षम कार्यकर्ताओं को खोजें, पहचान पत्र और
            प्रमाणपत्र सत्यापित करें, तथा संगठन की गतिविधियों से जुड़ें।
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/saksham-karyakarta"
              className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-orange-600/30 sm:w-auto"
            >
              Saksham Directory देखें
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>

            <Link
              href="/#ground-activities"
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/70 px-7 py-3.5 text-sm font-bold text-slate-800 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white sm:w-auto"
            >
              हमारी गतिविधियाँ देखें
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                ✓
              </span>
              Verified Karyakarta
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                ✓
              </span>
              Transparent Process
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-black text-emerald-700">
                ✓
              </span>
              PAN India Network
            </span>
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          <GlassCard
            title="सक्षम कार्यकर्ता"
            description="राज्य और जिला अनुसार सत्यापित कार्यकर्ता खोजें।"
            href="/saksham-karyakarta"
          />
          <GlassCard
            title="पहचान सत्यापन"
            description="iCard या प्रमाणपत्र की वैधता तुरंत जांचें।"
            href="/#ground-activities"
          />
          <GlassCard
            title="संगठन से जुड़ें"
            description="समाचार, गतिविधियां और अधिकारिक अपडेट देखें।"
            href="/#news"
          />
        </div>
      </div>
    </section>
  );
}

function GlassCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-white/60 bg-white/60 p-5 shadow-sm backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:bg-white/80 hover:shadow-lg hover:shadow-orange-900/5"
    >
      <h3 className="text-base font-bold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-600">
        {description}
      </p>
      <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-orange-700">
        जानें
        <span className="transition group-hover:translate-x-0.5">→</span>
      </span>
    </Link>
  );
}