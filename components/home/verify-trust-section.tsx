import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  FileCheck,
  Globe,
  QrCode,
  ShieldCheck,
} from "lucide-react";

const trustItems = [
  {
    icon: BadgeCheck,
    title: "सत्यापित सक्षम कार्यकर्ता",
    description: "प्रमाणित सदस्यों की जानकारी सत्यापित रजिस्ट्रेशन पर आधारित है।",
  },
  {
    icon: FileCheck,
    title: "पारदर्शी प्रक्रिया",
    description: "हर आवेदन, दस्तावेज़ और प्रमाणपत्र की स्पष्ट स्थिति उपलब्ध है।",
  },
  {
    icon: QrCode,
    title: "सुरक्षित डिजिटल पहचान",
    description: "iCard और प्रमाणपत्र QR verification के साथ सत्यापित होते हैं।",
  },
  {
    icon: Globe,
    title: "पूरे भारत में नेटवर्क",
    description: "राज्य और जिला स्तर पर संगठन की उपस्थिति।",
  },
];

export function VerifyTrustSection() {
  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-amber-50 p-8 shadow-lg shadow-orange-900/5 sm:p-10">
            <span
              aria-hidden="true"
              className="absolute right-6 top-6 text-7xl font-black text-orange-900/[0.05]"
            >
              01
            </span>

            <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
              <ShieldCheck className="h-4 w-4" />
              Instant Verification
            </span>

            <h2 className="mt-6 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
              iCard या Certificate
              <span className="mt-2 block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                तुरंत सत्यापित करें
              </span>
            </h2>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
              RGRP के किसी भी सदस्य का पहचान पत्र या नियुक्ति प्रमाणपत्र सत्यापित करें। सत्यापन पूरी तरह पारदर्शी और सुरक्षित है।
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/verify-id"
                className="group inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-500 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-600/25 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                iCard Verify करें
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/verify-certificate"
                className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-orange-200 bg-white/80 px-6 py-3.5 text-sm font-bold text-slate-800 backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white"
              >
                Certificate Verify करें
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-orange-100 bg-white/80 p-8 shadow-sm backdrop-blur sm:p-10">
            <h3 className="text-2xl font-black text-slate-900">
              भरोसा और पारदर्शिता
            </h3>

            <div className="mt-7 space-y-4">
              {trustItems.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group flex items-start gap-4 rounded-2xl border border-orange-100 bg-orange-50/50 p-5 transition duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:bg-white"
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/20">
                    <Icon aria-hidden className="h-5 w-5" />
                  </span>

                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {title}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-600">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}