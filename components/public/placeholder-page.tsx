import Link from "next/link";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

export function PlaceholderPage({
  title,
  description,
}: PlaceholderPageProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16 sm:px-10">
      <p className="text-sm font-semibold tracking-[0.16em] text-emerald-800 uppercase">
        RGRP Portal
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-950 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600">
        {description}
      </p>
      <Link
        className="mt-8 w-fit font-semibold text-emerald-800 underline decoration-emerald-300 underline-offset-4 hover:text-emerald-950 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-800"
        href="/"
      >
        Back to home
      </Link>
    </section>
  );
}
