"use client";

import { useId, useState } from "react";
import { ChevronDown, Quote, UserRound } from "lucide-react";

export type Leader = {
  id: string;
  name: string;
  designation: string;
  message: string;
  portraitUrl: string | null;
};

export function LeaderMessageCard({ leader }: { leader: Leader }) {
  const [expanded, setExpanded] = useState(false);
  const messageId = useId();
  const isLong = leader.message.length > 180;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-orange-100 bg-white/80 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5 sm:p-7">
      <span
        aria-hidden="true"
        className="absolute right-5 top-5 text-6xl font-black text-orange-900/[0.05]"
      >
        ”
      </span>

      <div className="flex items-center gap-4">
        {leader.portraitUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-20 w-20 shrink-0 rounded-2xl border-4 border-white object-cover shadow-md"
            height={80}
            loading="lazy"
            referrerPolicy="no-referrer"
            src={leader.portraitUrl}
            width={80}
          />
        ) : (
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/20">
            <UserRound aria-hidden className="h-10 w-10" />
          </div>
        )}

        <div className="min-w-0">
          <h3 className="truncate text-xl font-bold text-slate-900">
            {leader.name}
          </h3>
          <p className="mt-0.5 text-sm font-bold text-orange-700">
            {leader.designation}
          </p>
        </div>
      </div>

      <blockquote className="mt-6 flex-1">
        <Quote aria-hidden className="h-6 w-6 text-orange-400" />
        <p className="mt-3 text-base leading-relaxed font-medium text-slate-800">
          {isLong && !expanded
            ? `${leader.message.slice(0, 180).trimEnd()}…`
            : leader.message}
        </p>

        <div
          id={messageId}
          hidden={!expanded}
          className="mt-3 leading-relaxed text-slate-600"
        >
          {isLong ? leader.message : null}
        </div>
      </blockquote>

      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={messageId}
          className="mt-6 inline-flex items-center gap-2 self-start rounded-xl border border-orange-200 bg-orange-50 px-4 py-2 text-sm font-bold text-orange-800 transition hover:bg-orange-100"
        >
          {expanded ? "संदेश छोटा करें" : "पूरा संदेश पढ़ें"}
          <ChevronDown
            aria-hidden
            className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      ) : null}
    </article>
  );
}