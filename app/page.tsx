import Link from "next/link";

const navigationLinks = [
  { href: "/join", label: "Join" },
  { href: "/verify", label: "Verify" },
  { href: "/admin/login", label: "Admin Login" },
  { href: "/karyakarta/login", label: "Karyakarta Login" },
];

export default function Home() {
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-20 sm:px-10">
      <div className="max-w-3xl">
        <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-emerald-800 uppercase">
          Rashtriya Gau Raksha Parishad
        </p>
        <h1 className="text-4xl leading-tight font-bold tracking-tight text-stone-950 sm:text-6xl">
          राष्ट्रीय गौ रक्षा परिषद
        </h1>
        <p className="mt-4 text-xl font-medium text-stone-700 sm:text-2xl">
          Rashtriya Gau Raksha Parishad
        </p>
        <p className="mt-8 text-lg text-stone-600">
          RGRP Portal Foundation is Ready
        </p>
        <nav aria-label="Main navigation" className="mt-10 flex flex-wrap gap-3">
          {navigationLinks.map(({ href, label }) => (
            <Link
              className="rounded-md border border-emerald-800 px-5 py-3 text-sm font-semibold text-emerald-900 transition-colors hover:bg-emerald-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              href={href}
              key={href}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
