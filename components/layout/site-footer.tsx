import Link from "next/link";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/join", label: "कार्यकर्ता आवेदन" },
  { href: "/application-status", label: "आवेदन स्थिति" },
  { href: "/verify", label: "Verify" },
  { href: "/verify-qr", label: "QR सत्यापन" },
];

export function SiteFooter() {
  return (
    <footer className="site-footer px-3 pb-4 sm:px-6">
      <div className="glass mx-auto flex w-full max-w-6xl flex-col gap-4 rounded-2xl px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-serif text-base font-bold text-cocoa-900">राष्ट्रीय गौ रक्षा परिषद</p>
          <p className="text-sm text-cocoa-700">Rashtriya Gau Raksha Parishad</p>
        </div>
        <nav aria-label="फ़ुटर नेविगेशन">
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
