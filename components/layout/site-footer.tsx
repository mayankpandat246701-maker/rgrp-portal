import Link from "next/link";
import { OrganizationLogo } from "@/components/layout/organization-logo";

const footerLinks = [
  { href: "/about", label: "परिचय" },
  { href: "/join-us", label: "हमसे जुड़ें" },
  { href: "/application-status", label: "आवेदन स्थिति" },
  { href: "/saksham-karyakarta", label: "सक्षम कार्यकर्ता" },
  { href: "/verify-id", label: "पहचान पत्र सत्यापित करें" },
  { href: "/verify-certificate", label: "प्रमाणपत्र सत्यापित करें" },
  { href: "/official-links", label: "आधिकारिक लिंक" },
  { href: "/verify", label: "सत्यापन" },
  { href: "/verify-qr", label: "QR सत्यापन" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer px-3 pb-4 sm:px-6">
      <div className="glass mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-2xl px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <OrganizationLogo className="size-12" />
            <p className="font-serif text-base font-bold text-cocoa-900">
              राष्ट्रीय गौ रक्षा परिषद
            </p>
          </div>

          <p className="text-sm text-cocoa-700">
            राष्ट्र सेवा, गौ संरक्षण और संगठन
          </p>

          <p className="mt-3 text-xs text-cocoa-600">
            Website Developer:{" "}
            <Link
              href="/developer"
              className="font-semibold text-saffron-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-saffron-700"
            >
              Mayank Upadhyay
            </Link>
          </p>
        </div>

        <nav aria-label="फुटर नेविगेशन">
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-cocoa-800 underline-offset-4 hover:text-saffron-700 hover:underline focus-visible:outline-2 focus-visible:outline-saffron-700"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
