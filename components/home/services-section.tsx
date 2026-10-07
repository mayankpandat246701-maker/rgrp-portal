import Link from "next/link";
import {
  ArrowUpRight,
  BadgeCheck,
  FileSearch,
  FileUp,
  LogIn,
  QrCode,
  UserPlus,
} from "lucide-react";

const services = [
  {
    href: "/join",
    icon: UserPlus,
    title: "कार्यकर्ता आवेदन",
    subtitle: "Karyakarta Application",
    text: "परिषद से कार्यकर्ता के रूप में जुड़ने हेतु सरल ऑनलाइन आवेदन प्रक्रिया।",
  },
  {
    href: "/karyakarta/upload-documents",
    icon: FileUp,
    title: "दस्तावेज़ अपलोड",
    subtitle: "Upload Documents",
    text: "आवेदन हेतु आवश्यक दस्तावेज़ सुरक्षित एवं डिजिटल रूप से अपलोड करें।",
  },
  {
    href: "/application-status",
    icon: FileSearch,
    title: "आवेदन स्थिति",
    subtitle: "Application Status",
    text: "अपने आवेदन की वर्तमान स्थिति तुरंत जांचें और अपडेट देखें।",
  },
  {
    href: "/verify",
    icon: BadgeCheck,
    title: "सत्यापन",
    subtitle: "Verify",
    text: "पंजीकरण संख्या द्वारा कार्यकर्ता की प्रामाणिकता सत्यापित करें।",
  },
  {
    href: "/verify-qr",
    icon: QrCode,
    title: "QR सत्यापन",
    subtitle: "QR Verification",
    text: "पहचान पत्र का QR कोड स्कैन करके तुरंत सत्यापन करें।",
  },
  {
    href: "/karyakarta/login",
    icon: LogIn,
    title: "कार्यकर्ता लॉगिन",
    subtitle: "Karyakarta Login",
    text: "अपने डैशबोर्ड में लॉगिन करें और पहचान पत्र देखें।",
  },
];

export function ServicesSection() {
  return (
    <section
      id="services"
      className="relative overflow-hidden bg-gradient-to-b from-orange-50/70 via-white to-orange-50/40 py-16 sm:py-20"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-16 h-72 w-72 rounded-full bg-orange-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-amber-200/30 blur-3xl"
      />

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-800">
            Portal Services
          </span>

          <h2 className="mt-5 text-3xl font-black leading-tight tracking-tight text-slate-900 sm:text-4xl">
            कार्यकर्ता सेवाएँ
            <span className="mt-2 block bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              एक ही स्थान पर
            </span>
          </h2>

          <p className="mt-4 text-base leading-relaxed text-slate-600">
            आवेदन से लेकर सत्यापन तक—सभी महत्वपूर्ण सेवाएँ सरल, सुरक्षित एवं डिजिटल रूप से उपलब्ध।
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ href, icon: Icon, title, subtitle, text }, index) => (
            <Link
              key={href}
              href={href}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-orange-100 bg-white/80 p-6 shadow-sm backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg hover:shadow-orange-900/5"
            >
              <span
                aria-hidden="true"
                className="absolute right-5 top-5 text-5xl font-black text-orange-900/[0.05]"
              >
                {String(index + 1).padStart(2, "0")}
              </span>

              <div className="flex items-start justify-between">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-600 to-amber-500 text-white shadow-md shadow-orange-600/20">
                  <Icon aria-hidden className="h-7 w-7" />
                </span>

                <ArrowUpRight
                  aria-hidden
                  className="h-5 w-5 text-slate-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-orange-600"
                />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {title}
              </h3>

              <p className="mt-1 text-xs font-bold uppercase tracking-wide text-orange-700">
                {subtitle}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                {text}
              </p>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-600">
          प्रशासक हैं?{" "}
          <Link
            href="/admin/login"
            className="font-semibold text-orange-700 underline underline-offset-4 hover:text-orange-600"
          >
            Admin Login
          </Link>
        </p>
      </div>
    </section>
  );
}