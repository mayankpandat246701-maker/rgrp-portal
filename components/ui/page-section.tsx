import type { ReactNode } from "react";

type PageSectionProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export function PageSection({
  eyebrow,
  title,
  description,
  children,
}: PageSectionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <div className="mb-8 max-w-3xl">
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-900/10 bg-emerald-900/[0.04] px-3 py-1.5 text-xs font-bold tracking-[0.12em] text-emerald-900 uppercase">
          <span className="size-1.5 rounded-full bg-orange-500" />
          {eyebrow}
        </p>
        <h1 className="mt-5 text-3xl leading-tight font-bold tracking-tight text-stone-950 sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
          {description}
        </p>
      </div>
      {children}
    </section>
  );
}
