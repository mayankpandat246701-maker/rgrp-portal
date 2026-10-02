import type { ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

type AuthCardProps = {
  eyebrow: string;
  children: ReactNode;
};

export function AuthCard({ eyebrow, children }: AuthCardProps) {
  return (
    <div className="mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/80 bg-white/80 shadow-[0_24px_80px_-36px_rgba(6,78,59,0.28)] backdrop-blur-xl lg:grid-cols-[0.85fr_1.15fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-emerald-950 p-10 text-white lg:flex">
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 size-72 rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="absolute -right-8 -bottom-28 size-64 rounded-full border border-orange-300/20"
        />
        <div className="relative">
          <span className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-orange-200">
            <Icon name="shield" size={28} />
          </span>
          <p className="mt-8 text-xs font-bold tracking-[0.18em] text-orange-200 uppercase">
            {eyebrow}
          </p>
          <p className="mt-3 text-2xl leading-snug font-semibold">
            राष्ट्रीय गौ रक्षा परिषद
          </p>
          <p className="mt-3 text-sm text-emerald-100/75">
            सुरक्षित और सरल संगठन पोर्टल
          </p>
        </div>
        <p className="relative text-xs leading-5 text-emerald-100/65">
          सेवा · समर्पण · संगठन
        </p>
      </aside>
      <div className="p-6 sm:p-9 lg:p-12">{children}</div>
    </div>
  );
}
