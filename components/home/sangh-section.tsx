import Link from "next/link";
import { ArrowRight, Users } from "lucide-react";
import { LeaderMessageCard, type Leader } from "@/components/home/leader-message-card";

export function SanghSection({ messages }: { messages: Leader[] }) {
  return (
    <section
      id="sangh"
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
            <Users className="h-4 w-4" />
            Leadership Messages
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            संगठन के मुख्य व्यक्ति
            <span className="mt-2 block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              और उनके संदेश
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            संगठन के प्रमुख पदाधिकारियों के प्रेरणादायक संदेश, जो हमारे कार्य और संकल्प को दिशा देते हैं।
          </p>
        </div>

        {messages.length > 0 ? (
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {messages.map((leader) => (
              <LeaderMessageCard key={leader.id} leader={leader} />
            ))}
          </div>
        ) : (
          <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-orange-100 bg-white/80 p-10 text-center shadow-sm backdrop-blur">
            <Users className="mx-auto h-10 w-10 text-orange-400" />
            <p className="mt-4 text-base font-semibold text-slate-700">
              संगठन के मुख्य व्यक्तियों के संदेश शीघ्र प्रकाशित किए जाएंगे।
            </p>
            <p className="mt-1 text-sm text-slate-500">
              नेतृत्व संदेश जोड़ने के लिए admin panel का उपयोग करें।
            </p>
          </div>
        )}


      </div>
    </section>
  );
}