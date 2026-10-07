import type { Metadata } from "next";
import { KaryakartaIdCardPanel } from "@/app/karyakarta/dashboard/karyakarta-id-card-panel";
import { SupportTicketPanel } from "@/app/karyakarta/dashboard/support-ticket-panel";
import { getCurrentKaryakarta } from "@/lib/auth/require-karyakarta";
import { isSakshamKaryakartaEligible } from "@/lib/saksham-karyakarta-eligibility";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "कार्यकर्ता डैशबोर्ड",
};

function text(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function KaryakartaDashboardPage() {
  const member = await getCurrentKaryakarta();
  if (!member) redirect("/karyakarta/login");

  const record = await prisma.karyakarta.findUnique({
    where: { id: member.id },
    select: {
      name: true,
      regNo: true,
      phone: true,
      email: true,
      daitva: true,
      state: true,
      district: true,
      photoUrl: true,
      profilePhotoPath: true,
      publicBio: true,
      profileStatus: true,
      status: true,
      isPublicProfile: true,
      isEmergencyHidden: true,
      archivedAt: true,
      registrations: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          registrationNumber: true,
          status: true,
          issueDate: true,
          expiryDate: true,
        },
      },
    },
  });

  if (!record) redirect("/karyakarta/login");

  const registration = record.registrations[0] ?? null;
  const now = new Date();

  const notices = await prisma.notice.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 5,
    select: {
      id: true,
      title: true,
      content: true,
      publishedAt: true,
    },
  });

  const profileFields = [
    record.name,
    record.phone,
    record.email,
    record.daitva,
    record.state,
    record.district,
    record.photoUrl ?? record.profilePhotoPath,
    record.publicBio,
  ];

  const completedFields = profileFields.filter((value) => text(value)).length;
  const profileCompletion = Math.round((completedFields / profileFields.length) * 100);

  const sakshamEligible = Boolean(
    registration &&
      isSakshamKaryakartaEligible({
        profileStatus: record.profileStatus,
        memberStatus: record.status,
        isPublicProfile: record.isPublicProfile,
        isEmergencyHidden: record.isEmergencyHidden,
        archivedAt: record.archivedAt,
        registrationStatus: registration.status,
        registrationExpiryDate: registration.expiryDate,
        now,
      }),
  );

  let sakshamMessage = "आप साक्षम कार्यकर्ता सूची के लिए पात्र हैं।";

  if (record.profileStatus !== "ACTIVE") {
    sakshamMessage = "आपकी प्रोफ़ाइल अभी सक्रिय/सत्यापित नहीं है। कृपया प्रशासन द्वारा सत्यापन की प्रतीक्षा करें।";
  } else if (record.status !== "APPROVED") {
    sakshamMessage = "आपकी सदस्यता अभी स्वीकृत नहीं है।";
  } else if (!record.isPublicProfile) {
    sakshamMessage = "आपकी प्रोफ़ाइल सार्वजनिक रूप से उपलब्ध नहीं है।";
  } else if (record.isEmergencyHidden) {
    sakshamMessage = "आपकी प्रोफ़ाइल आपातकालीन रूप से छिपाई गई है।";
  } else if (record.archivedAt) {
    sakshamMessage = "आपकी प्रोफ़ाइल संग्रहित (archived) है।";
  } else if (!registration) {
    sakshamMessage = "सक्रिय पंजीकरण उपलब्ध नहीं है।";
  } else if (registration.status !== "ACTIVE") {
    sakshamMessage = "आपका पंजीकरण सक्रिय नहीं है।";
  } else if (registration.expiryDate && registration.expiryDate <= now) {
    sakshamMessage = "आपका पंजीकरण समाप्त हो गया है। कृपया नवीनीकरण के लिए प्रशासन से संपर्क करें।";
  }

  const daysRemaining = registration?.expiryDate
    ? Math.max(
        0,
        Math.ceil(
          (registration.expiryDate.getTime() - now.getTime()) /
            (24 * 60 * 60 * 1000),
        ),
      )
    : null;

  const membershipLabel =
    record.status === "APPROVED" && record.profileStatus === "ACTIVE"
      ? "सक्रिय सदस्य"
      : "सत्यापन / स्वीकृति लंबित";

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <header className="rounded-3xl bg-emerald-950 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-orange-200">
          सदस्य डैशबोर्ड
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
          नमस्ते, {record.name}
        </h1>
        <p className="mt-2 font-mono text-xs text-emerald-100/80">
          {record.regNo}
        </p>
        <span className="mt-4 inline-flex rounded-full bg-emerald-800/70 px-4 py-1.5 text-xs font-semibold text-emerald-50">
          {membershipLabel}
        </span>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">प्रोफ़ाइल पूर्णता</h2>
          <p className="mt-1 text-sm text-stone-600">
            बेहतर सत्यापन और पहचान पत्र के लिए प्रोफ़ाइल पूरी रखें।
          </p>
          <div className="mt-4 flex items-center justify-between text-sm font-semibold text-stone-800">
            <span>पूर्णता</span>
            <span>{profileCompletion}%</span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-all"
              style={{ width: `${profileCompletion}%` }}
            />
          </div>
          <p className="mt-3 text-xs text-stone-500">
            {completedFields} / {profileFields.length} आवश्यक विवरण उपलब्ध हैं।
          </p>
        </section>

        <section
          className={`rounded-2xl border p-5 shadow-sm ${
            sakshamEligible
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <h2 className="text-lg font-bold text-stone-950">साक्षम स्थिति</h2>
          <p
            className={`mt-2 text-sm font-semibold ${
              sakshamEligible ? "text-emerald-800" : "text-amber-800"
            }`}
          >
            {sakshamEligible ? "पात्र" : "कार्यवाही आवश्यक"}
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            {sakshamMessage}
          </p>
        </section>

        <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:col-span-2">
          <h2 className="text-lg font-bold text-stone-950">पंजीकरण विवरण</h2>
          {registration ? (
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs font-semibold text-stone-500">
                  पंजीकरण संख्या
                </p>
                <p className="mt-1 font-mono text-sm text-stone-900">
                  {registration.registrationNumber}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">स्थिति</p>
                <p className="mt-1 text-sm font-semibold text-emerald-800">
                  {registration.status === "ACTIVE" ? "सक्रिय" : registration.status}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-stone-500">वैधता</p>
                <p className="mt-1 text-sm font-semibold text-stone-900">
                  {daysRemaining === null
                    ? "स्थायी / समाप्ति तिथि उपलब्ध नहीं"
                    : daysRemaining > 0
                      ? `${daysRemaining} दिन बाकी`
                      : "समाप्त"}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-3 text-sm text-stone-600">
              अभी कोई सक्रिय पंजीकरण उपलब्ध नहीं है। कृपया प्रशासन से संपर्क करें।
            </p>
          )}
        </section>
      </div>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-bold text-stone-950">सूचनाएँ और घोषणाएँ</h2>
        <p className="mt-1 text-sm text-stone-600">
          प्रशासन द्वारा जारी नवीनतम सूचनाएँ देखें।
        </p>

        {notices.length ? (
          <ul className="mt-4 divide-y divide-stone-100">
            {notices.map((notice) => (
              <li className="py-4" key={notice.id}>
                <p className="text-sm font-bold text-stone-900">
                  {notice.title}
                </p>
                <p className="mt-1 whitespace-pre-line text-sm leading-6 text-stone-600">
                  {notice.content}
                </p>
                {notice.publishedAt ? (
                  <p className="mt-2 text-xs text-stone-500">
                    प्रकाशित:{" "}
                    {new Intl.DateTimeFormat("hi-IN", {
                      dateStyle: "medium",
                      timeZone: "Asia/Kolkata",
                    }).format(notice.publishedAt)}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            अभी कोई सूचना उपलब्ध नहीं है।
          </p>
        )}
      </section>

      <div className="mt-6">
        <KaryakartaIdCardPanel />
      </div>

      <div className="mt-6">
        <SupportTicketPanel />
      </div>
    </main>
  );
}
