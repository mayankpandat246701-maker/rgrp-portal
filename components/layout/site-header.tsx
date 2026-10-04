"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { GlassLink } from "@/components/ui/glass-button";
import { SoundToggle } from "@/components/layout/sound-toggle";

const primaryLinks = [
  { href: "/", label: "Home", hindi: "मुख्य पृष्ठ" },
  { href: "/about", label: "About", hindi: "परिचय" },
  { href: "/#sangh", label: "Sangh", hindi: "संघ" },
  { href: "/#activities", label: "Activities", hindi: "गतिविधियाँ" },
  { href: "/#contact", label: "Contact", hindi: "संपर्क" },
];

const portalLinks = [
  { href: "/application-status", label: "आवेदन स्थिति देखें" },
  { href: "/karyakarta/upload-documents", label: "कार्यकर्ता दस्तावेज़ अपलोड · Upload Documents" },
  { href: "/verify-qr", label: "QR सत्यापन" },
  { href: "/karyakarta/login", label: "Karyakarta Login" },
  { href: "/admin/login", label: "Admin Login / एडमिन लॉगिन" },
];

const navLinkClass =
  "rounded-full px-3.5 py-2 text-sm font-medium text-cocoa-800 transition-colors hover:bg-white/60 hover:text-saffron-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700";

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const portalRef = useRef<HTMLDetailsElement>(null);
  const closePortal = () => portalRef.current?.removeAttribute("open");

  return (
    <header className="site-header sticky top-0 z-50 px-3 pt-3 sm:px-6">
      <div className="glass-strong mx-auto flex w-full max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5 sm:px-5">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700"
        >
          <span
            aria-hidden
            className="flex size-10 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 font-serif text-lg font-bold text-white shadow-md"
          >
            गौ
          </span>
          <span className="leading-tight">
            <span className="block font-serif text-base font-bold text-cocoa-900">राष्ट्रीय गौ रक्षा परिषद</span>
            <span className="block text-xs font-medium tracking-wide text-cocoa-700">RGRP India</span>
          </span>
        </Link>

        <nav aria-label="मुख्य नेविगेशन" className="hidden items-center gap-1 lg:flex">
          {primaryLinks.map((link) => (
            <Link key={link.href} href={link.href} className={navLinkClass}>
              {link.label}
            </Link>
          ))}
          <details ref={portalRef} className="group relative">
            <summary className={`${navLinkClass} flex cursor-pointer list-none items-center gap-1 [&::-webkit-details-marker]:hidden`}>
              Portal
              <ChevronDown aria-hidden className="size-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="glass-strong absolute right-0 mt-2 w-72 rounded-2xl p-2">
              {portalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closePortal}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-cocoa-800 hover:bg-white/70 hover:text-saffron-700 focus-visible:outline-2 focus-visible:outline-saffron-700"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </details>
        </nav>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <GlassLink href="/join" variant="primary" className="hidden md:inline-flex">
            कार्यकर्ता आवेदन
          </GlassLink>
          <button
            type="button"
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "मेनू बंद करें" : "मेनू खोलें"}
            onClick={() => setMobileOpen((open) => !open)}
            className="glass inline-flex size-10 items-center justify-center rounded-full text-cocoa-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700 lg:hidden"
          >
            {mobileOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          id="mobile-menu"
          aria-label="मोबाइल नेविगेशन"
          className="glass-strong mx-auto mt-2 w-full max-w-6xl rounded-2xl p-3 lg:hidden"
        >
          <ul className="grid gap-1">
            {primaryLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-cocoa-900 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-saffron-700"
                >
                  {link.label}
                  <span className="text-sm text-cocoa-700">{link.hindi}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 border-t border-saffron-200 px-3 pt-3 text-xs font-semibold tracking-wider text-saffron-700 uppercase">
            Portal
          </p>
          <ul className="mt-1 grid gap-1">
            {portalLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-xl px-3 py-2.5 text-sm font-medium text-cocoa-800 hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-saffron-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <GlassLink href="/join" variant="primary" className="mt-3 w-full md:hidden" onClick={() => setMobileOpen(false)}>
            कार्यकर्ता आवेदन
          </GlassLink>
        </nav>
      )}
    </header>
  );
}
