"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type PanelNavItem = { href: string; label: string; hint?: string };

export function PanelNav({ items }: { items: PanelNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav aria-label="पैनल नेविगेशन" className="mt-3">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col rounded-xl px-3 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700 ${
                  active
                    ? "bg-gradient-to-b from-saffron-500 to-saffron-600 font-semibold text-white shadow-sm"
                    : "font-medium text-cocoa-800 hover:bg-white/70"
                }`}
              >
                <span>{item.label}</span>
                {item.hint ? (
                  <span className={`text-xs ${active ? "text-white/85" : "text-cocoa-700/80"}`}>{item.hint}</span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
