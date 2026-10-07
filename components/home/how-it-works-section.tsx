import Link from "next/link";
import { ArrowRight, Search, ShieldCheck, Users } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Search,
    title: "कार्यकर्ता खोजें",
    description:
      "राज्य एवं जिला अनुसार सत्यापित सक्षम कार्यकर्ताओं को Saksham Directory में खोजें।",
  },
  {
    number: "02",
    icon: ShieldCheck,
    title: "पहचान सत्यापित करें",
    description:
      "iCard या नियुक्ति प्रमाणपत्र के QR/नंबर से सत्यापन करें और वैधता जांचें।",
  },
  {
    number: "03",
    icon: Users,
    title: "संगठन से जुड़ें",
    description:
      "समाचार, गतिविधियाँ, अधिकारिक अपडेट एवं नेतृत्व संदेशों से जुड़े रहें।",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-10 h-72 w-72 rounded-full bg-orange-200/25 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/25 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
            How It Works
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            RGRP से जुड़ना है
            <span className="mt-2 block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              बेहद आसान
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            सत्यापित कार्यकर्ता खोजें, पहचान सत्यापित करें और संगठन की गतिविधियों से जुड़ें—सब कुछ सरल डिजिटल प्रक्रिया से।
          </p>
        </div>

        <div className="relative mt-12 grid gap-6 md:grid-cols-3">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-[16%] right-[16%] top-24 hidden h-0.5 bg-gradient-to-r from-orange-200 via-orange-300 to-orange-200 md:block"
          />

          {steps.map(({ icon: Icon, number, title, description }, index) => (
            <div
              key={number}
              className="group relative rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50/80 to-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5"
            >
              <div className="flex items-center justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/20">
                  <Icon aria-hidden className="h-7 w-7" />
                </span>

                <span className="text-4xl font-black text-orange-900/[0.08]">
                  {number}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-slate-900">
                {title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {description}
              </p>

              {index < steps.length - 1 ? (
                <ArrowRight
                  aria-hidden
                  className="absolute -right-3 top-24 hidden h-6 w-6 text-orange-400 md:block"
                />
              ) : null}
            </div>
          ))}
        </div>


      </div>
    </section>
  );
}