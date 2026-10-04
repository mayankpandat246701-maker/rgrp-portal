import { CircleAlert, CircleCheck } from "lucide-react";

export type FormMessage = { tone: "success" | "error"; text: string } | null;

export function FormAlert({ message }: { message: FormMessage }) {
  if (!message) return null;
  const success = message.tone === "success";
  return (
    <div
      role={success ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
        success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"
      }`}
    >
      {success ? <CircleCheck aria-hidden className="mt-0.5 size-4 shrink-0" /> : <CircleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />}
      <span>{message.text}</span>
    </div>
  );
}

export function StatusPill({ tone, children }: { tone: "green" | "gray" | "orange" | "red"; children: React.ReactNode }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    gray: "bg-stone-100 text-stone-700 ring-stone-200",
    orange: "bg-saffron-50 text-saffron-700 ring-saffron-200",
    red: "bg-red-50 text-red-800 ring-red-200",
  };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tones[tone]}`}>{children}</span>;
}

export const dashboardInputClass =
  "w-full rounded-xl border border-stone-200 bg-white/90 px-3.5 py-2.5 text-sm text-cocoa-900 shadow-sm outline-none transition placeholder:text-stone-400 hover:border-stone-300 focus:border-saffron-600 focus:ring-4 focus:ring-saffron-500/15 disabled:bg-stone-50 disabled:text-stone-500";

export const dashboardLabelClass = "mb-1.5 block text-sm font-semibold text-cocoa-900";
