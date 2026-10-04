"use client";

import { useId, useState } from "react";
import { ChevronDown, Quote, UserRound } from "lucide-react";
import { GlassButton } from "@/components/ui/glass-button";

export type Leader = {
  name: string;
  designation: string;
  quote: string;
  message: string;
};

export function LeaderMessageCard({ leader }: { leader: Leader }) {
  const [expanded, setExpanded] = useState(false);
  const messageId = useId();

  return (
    <article className="glass flex h-full flex-col rounded-3xl p-6 sm:p-7">
      <div className="flex items-center gap-4">
        <div
          role="img"
          aria-label={`${leader.name} का फ़ोटो (शीघ्र उपलब्ध)`}
          className="flex size-20 shrink-0 items-center justify-center rounded-full border-4 border-white/80 bg-gradient-to-br from-saffron-200 to-saffron-300 text-saffron-700 shadow-md"
        >
          <UserRound aria-hidden className="size-10" />
        </div>
        <div>
          <h3 className="font-serif text-xl font-bold text-cocoa-900">{leader.name}</h3>
          <p className="mt-0.5 text-sm font-medium text-saffron-700">{leader.designation}</p>
        </div>
      </div>

      <blockquote className="mt-6 flex-1">
        <Quote aria-hidden className="size-6 text-saffron-500" />
        <p className="mt-2 text-lg leading-relaxed font-medium text-cocoa-900">{leader.quote}</p>
        <div
          id={messageId}
          hidden={!expanded}
          className="mt-3 leading-relaxed text-cocoa-700"
        >
          {leader.message}
        </div>
      </blockquote>

      <GlassButton
        variant="secondary"
        className="mt-6 self-start"
        aria-expanded={expanded}
        aria-controls={messageId}
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded ? "संदेश छोटा करें" : "पूरा संदेश पढ़ें"}
        <ChevronDown aria-hidden className={`size-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </GlassButton>
    </article>
  );
}
