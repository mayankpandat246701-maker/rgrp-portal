"use client";

import Image from "next/image";
import { useState } from "react";

export function OrganizationLogo({ className = "size-10" }: { className?: string }) {
  const [customLogoFailed, setCustomLogoFailed] = useState(false);
  if (!customLogoFailed) {
    return (
      <Image
        alt="राष्ट्रीय गौ रक्षा परिषद का आधिकारिक लोगो"
        className={`${className} rounded-xl border border-white/40 bg-white object-contain p-1`}
        height={64}
        onError={() => setCustomLogoFailed(true)}
        src="/api/site-settings/logo"
        unoptimized
        width={64}
      />
    );
  }
  return (
    <span
      aria-hidden
      className={`${className} flex items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 font-serif text-lg font-bold text-white shadow-md`}
    >
      गौ
    </span>
  );
}
