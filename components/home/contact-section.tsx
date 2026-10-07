import Link from "next/link";
import { ArrowRight, BadgeCheck, FileSearch, UserPlus } from "lucide-react";

export function ContactSection() {
  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-orange-50/40 px-4 py-16 sm:px-6 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-orange-100 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-8 shadow-2xl shadow-orange-900/20 sm:p-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl"
          />

          <div className="relative grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white backdrop-blur">
                संपर्क एवं सहभागिता · Join Us
              </span>

              <h2 className="mt-6 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                गौ रक्षा के अभियान में
                <span className="block">आपका स्वागत है</span>
              </h2>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-orange-50">
                कार्यकर्ता के रूप में जुड़ें, अपने आवेदन की स्थिति जानें या किसी कार्यकर्ता की प्रामाणिकता सत्यापित करें। सहायता के लिए अपने जिला या प्रदेश कार्यकारिणी से संपर्क करें।
              </p>
            </div>

            <div className="flex flex-col gap-3 rounded-3xl border border-white/30 bg-white/15 p-6 backdrop-blur-md">
              <Link
                href="/join"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-orange-700 shadow-lg transition duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                <UserPlus className="h-4 w-4" />
                कार्यकर्ता आवेदन करें
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>

              <Link
                href="/application-status"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/20"
              >
                <FileSearch className="h-4 w-4" />
                आवेदन स्थिति देखें
              </Link>

              <Link
                href="/verify"
                className="group inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-bold text-white backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:bg-white/20"
              >
                <BadgeCheck className="h-4 w-4" />
                कार्यकर्ता सत्यापन · Verify
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}