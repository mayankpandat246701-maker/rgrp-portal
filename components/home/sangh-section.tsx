import { SectionHeading } from "@/components/home/section-heading";
import {
  LeaderMessageCard,
  type Leader,
} from "@/components/home/leader-message-card";

export function SanghSection({ messages }: { messages: Leader[] }) {
  return (
    <section id="sangh" aria-labelledby="sangh-title" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="sangh-title"
          eyebrow="संघ · Sangh"
          title="संघ के मुख्य व्यक्ति और उनके संदेश"
          description="इस खंड में संघ के प्रमुख पदाधिकारियों के प्रेरणादायक संदेश प्रस्तुत हैं, जो हमारे कार्य और संकल्प को दिशा देते हैं।"
        />
        {messages.length > 0 ? (
          <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {messages.map((leader) => (
              <li key={leader.id}>
                <LeaderMessageCard leader={leader} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="glass mt-12 rounded-3xl p-6 text-center leading-relaxed text-cocoa-700 sm:p-8">
            संघ के मुख्य व्यक्तियों के संदेश शीघ्र प्रकाशित किए जाएँगे।
          </p>
        )}
      </div>
    </section>
  );
}
