import Link from "next/link";
import { ArrowUpRight, BadgeCheck, FileSearch, FileUp, LogIn, QrCode, UserPlus } from "lucide-react";
import { SectionHeading } from "@/components/home/section-heading";

const services = [
  {
    href: "/join",
    icon: UserPlus,
    title: "कार्यकर्ता आवेदन",
    subtitle: "Karyakarta Application",
    text: "परिषद से कार्यकर्ता के रूप में जुड़ने के लिए ऑनलाइन आवेदन करें।",
  },
  {
    href: "/karyakarta/upload-documents",
    icon: FileUp,
    title: "कार्यकर्ता दस्तावेज़ अपलोड",
    subtitle: "Upload Documents",
    text: "आवेदन हेतु आवश्यक दस्तावेज़ सुरक्षित रूप से अपलोड करें।",
  },
  {
    href: "/application-status",
    icon: FileSearch,
    title: "आवेदन स्थिति देखें",
    subtitle: "Application Status",
    text: "अपने आवेदन की वर्तमान स्थिति तुरंत जाँचें।",
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
    <section id="services" aria-labelledby="services-title" className="scroll-mt-28 px-4 py-14 sm:px-6 lg:py-20">
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="services-title"
          eyebrow="पोर्टल सेवाएँ · Services"
          title="कार्यकर्ता सेवाएँ एक ही स्थान पर"
          description="आवेदन से लेकर सत्यापन तक, सभी महत्वपूर्ण सेवाएँ सरल और सुरक्षित रूप में।"
        />
        <ul className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map(({ href, icon: Icon, title, subtitle, text }) => (
            <li key={href}>
              <Link
                href={href}
                className="glass group flex h-full flex-col rounded-2xl p-6 transition-all duration-200 hover:-translate-y-1 hover:bg-white/80 hover:shadow-[0_20px_40px_-18px_rgba(120,60,15,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-saffron-700"
              >
                <div className="flex items-start justify-between">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-gradient-to-br from-saffron-500 to-saffron-700 text-white shadow-md">
                    <Icon aria-hidden className="size-6" />
                  </span>
                  <ArrowUpRight
                    aria-hidden
                    className="size-5 text-cocoa-700 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-saffron-700"
                  />
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-cocoa-900">{title}</h3>
                <p className="text-sm font-medium text-saffron-700">{subtitle}</p>
                <p className="mt-3 leading-relaxed text-cocoa-700">{text}</p>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-center text-sm text-cocoa-700">
          प्रशासक हैं?{" "}
          <Link
            href="/admin/login"
            className="font-semibold text-saffron-700 underline underline-offset-4 hover:text-saffron-600 focus-visible:outline-2 focus-visible:outline-saffron-700"
          >
            Admin Login / एडमिन लॉगिन
          </Link>
        </p>
      </div>
    </section>
  );
}
