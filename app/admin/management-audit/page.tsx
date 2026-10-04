import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "प्रबंधन ऑडिट",
  robots: { index: false, follow: false },
};

const safeMetadataKeys = [
  "profileStatus",
  "registrationStatus",
  "state",
  "district",
  "level",
  "platform",
  "isPublished",
  "showOnHomepage",
  "displayOrder",
  "isPublic",
  "isActive",
  "visibility",
  "registrationReissued",
  "fileSize",
  "fileType",
] as const;
const metadataLabels: Record<(typeof safeMetadataKeys)[number], string> = {
  profileStatus: "प्रोफ़ाइल स्थिति",
  registrationStatus: "पंजीकरण स्थिति",
  state: "राज्य",
  district: "जिला",
  level: "स्तर",
  platform: "मंच",
  isPublished: "प्रकाशित",
  showOnHomepage: "होमपेज पर दिखाएँ",
  displayOrder: "प्रदर्शन क्रम",
  isPublic: "सार्वजनिक",
  isActive: "सक्रिय",
  visibility: "दृश्यता",
  registrationReissued: "पंजीकरण पुनः जारी",
  fileSize: "फ़ाइल आकार",
  fileType: "फ़ाइल प्रकार",
};
const actionLabels: Record<string, string> = {
  ADMIN_CREATED: "प्रशासक बनाया गया",
  ADMIN_ACCESS_UPDATED: "प्रशासक पहुँच अपडेट की गई",
  KARYAKARTA_CREATED: "कार्यकर्ता बनाया गया",
  KARYAKARTA_REGISTRATION_NUMBER_GENERATED: "पंजीकरण संख्या बनाई गई",
  KARYAKARTA_PHOTO_UPDATED: "कार्यकर्ता का चित्र अपडेट किया गया",
  OFFICIAL_LINK_CREATED: "आधिकारिक लिंक जोड़ा गया",
  OFFICIAL_LINK_UPDATED: "आधिकारिक लिंक अपडेट किया गया",
  OFFICIAL_LINK_ARCHIVED: "आधिकारिक लिंक संग्रहीत किया गया",
  NEWS_CREATED: "समाचार जोड़ा गया",
  NEWS_ARCHIVED: "समाचार संग्रहीत किया गया",
  NEWS_UPDATED_OR_PUBLISHED: "समाचार अपडेट या प्रकाशित किया गया",
  NEWS_UPDATED_OR_UNPUBLISHED: "समाचार अपडेट या अप्रकाशित किया गया",
  NEWS_COVER_UPDATED: "समाचार का आवरण चित्र अपडेट किया गया",
  GROUND_ACTIVITY_CREATED: "जमीनी कार्य जोड़ा गया",
  GROUND_ACTIVITY_ARCHIVED: "जमीनी कार्य संग्रहीत किया गया",
  GROUND_ACTIVITY_UPDATED_OR_PUBLISHED: "जमीनी कार्य अपडेट या प्रकाशित किया गया",
  GROUND_ACTIVITY_IMAGE_ADDED: "जमीनी कार्य का चित्र जोड़ा गया",
  GROUND_ACTIVITY_GALLERY_REORDERED: "जमीनी कार्य चित्र क्रम अपडेट किया गया",
  GROUND_ACTIVITY_IMAGE_REMOVED: "जमीनी कार्य का चित्र हटाया गया",
  GROUND_ACTIVITY_COVER_UPDATED: "जमीनी कार्य का आवरण चित्र अपडेट किया गया",
  JOINING_CERTIFICATE_ISSUED: "नियुक्ति प्रमाणपत्र जारी किया गया",
  JOINING_CERTIFICATE_REISSUED: "नियुक्ति प्रमाणपत्र पुनः जारी किया गया",
  JOINING_CERTIFICATE_REVOKED: "नियुक्ति प्रमाणपत्र रद्द किया गया",
  LEADERSHIP_MESSAGE_CREATED: "मुख्य व्यक्ति का संदेश जोड़ा गया",
  LEADERSHIP_MESSAGE_UPDATED: "मुख्य व्यक्ति का संदेश अपडेट किया गया",
  LEADERSHIP_MESSAGE_DELETED: "मुख्य व्यक्ति का संदेश हटाया गया",
  SITE_LOGO_UPDATED: "वेबसाइट लोगो अपडेट किया गया",
  SITE_LOGO_REMOVED: "वेबसाइट लोगो हटाया गया",
  ID_CARD_TEMPLATE_UPLOADED: "पहचान पत्र टेम्पलेट अपलोड किया गया",
};
const entityLabels: Record<string, string> = {
  Admin: "प्रशासक",
  Karyakarta: "कार्यकर्ता",
  OfficialSocialLink: "आधिकारिक लिंक",
  NewsPost: "समाचार",
  GroundActivity: "जमीनी कार्य",
  JoiningCertificate: "नियुक्ति प्रमाणपत्र",
  LeadershipMessage: "मुख्य व्यक्ति का संदेश",
  SiteSettings: "वेबसाइट सेटिंग",
  IDCardTemplate: "पहचान पत्र टेम्पलेट",
};
const enumLabels: Record<string, string> = {
  DRAFT: "प्रारूप",
  PENDING: "लंबित",
  ACTIVE: "सक्रिय",
  INACTIVE: "निष्क्रिय",
  SUSPENDED: "निलंबित",
  REVOKED: "रद्द",
  REJECTED: "अस्वीकृत",
  EXPIRED: "समाप्त",
  ARCHIVED: "संग्रहीत",
  NATIONAL: "राष्ट्रीय",
  STATE: "राज्य",
  DISTRICT: "जिला",
  PUBLIC: "सार्वजनिक",
  MEMBERS_ONLY: "केवल सदस्य",
  HIDDEN: "छिपा हुआ",
};

function safeSummary(value: unknown, prefix = ""): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return [];
  }
  const metadata = value as Record<string, unknown>;
  return safeMetadataKeys.flatMap((key) => {
    const item = metadata[key];
    if (item === undefined || item === null) return [];
    if (typeof item === "object") return safeSummary(item, `${key} `);
    const value =
      typeof item === "string"
        ? enumLabels[item] ?? item
        : typeof item === "boolean"
          ? item
            ? "हाँ"
            : "नहीं"
          : String(item);
    return [`${prefix}${metadataLabels[key]}: ${String(value)}`];
  });
}

export default async function ManagementAuditPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!["SUPER_ADMIN", "NATIONAL_ADMIN"].includes(admin.role)) {
    redirect("/admin/dashboard");
  }
  const entries = await prisma.adminActivity.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      action: true,
      entity: true,
      createdAt: true,
      metadata: true,
      admin: { select: { name: true, email: true } },
    },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
          <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/dashboard">डैशबोर्ड पर लौटें</Link>
      <header className="mt-5">
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">प्रबंधन ऑडिट</h1>
            <p className="mt-2 text-sm text-stone-600">हाल की प्रशासनिक कार्रवाइयाँ। संवेदनशील व्यक्तिगत जानकारी यहाँ नहीं दिखाई जाती।</p>
      </header>
      {entries.length ? (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-600"><tr><th className="px-4 py-3">समय</th><th className="px-4 py-3">कार्रवाई</th><th className="px-4 py-3">रिकॉर्ड</th><th className="px-4 py-3">प्रशासक</th><th className="px-4 py-3">सुरक्षित सारांश</th></tr></thead>
            <tbody className="divide-y divide-stone-100">{entries.map((entry, index) => {
              const summary = safeSummary(entry.metadata);
              const timestamp = new Intl.DateTimeFormat("hi-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }).format(entry.createdAt);
              return (
                <tr key={`${entry.action}-${entry.createdAt.toISOString()}-${index}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-stone-600"><time dateTime={entry.createdAt.toISOString()}>{timestamp}</time></td>
                  <td className="px-4 py-3 font-semibold">{actionLabels[entry.action] ?? "अन्य प्रशासनिक कार्रवाई"}</td>
                  <td className="px-4 py-3">{entry.entity ? entityLabels[entry.entity] ?? "रिकॉर्ड" : "—"}</td>
                  <td className="px-4 py-3">{entry.admin ? <><span className="block">{entry.admin.name}</span><span className="text-xs text-stone-500">{entry.admin.email}</span></> : "पूर्व प्रशासक"}</td>
                  <td className="px-4 py-3 text-xs text-stone-600">{summary.join(" · ") || "—"}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>
      ) : <p className="mt-6 rounded-2xl border border-stone-200 bg-white p-8 text-center text-sm text-stone-600">अभी तक कोई प्रशासनिक गतिविधि दर्ज नहीं हुई है।</p>}
    </section>
  );
}
