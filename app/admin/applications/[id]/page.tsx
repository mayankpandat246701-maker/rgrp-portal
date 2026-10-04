import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplicationReviewActions } from "@/components/admin/application-review-actions";
import { ApplicationPrintButton } from "@/components/admin/application-print-button";
import { ApplicationStatusBadge } from "@/components/admin/application-status-badge";
import { requireAdmin } from "@/lib/auth/require-admin";
import { canViewApplications } from "@/lib/auth/admin-permissions";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "आवेदन विवरण",
};

type ApplicationDetailPageProps = {
  params: Promise<{ id: string }>;
};

function displayValue(value: string | null): string {
  return value?.trim() || "उपलब्ध नहीं";
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("hi-IN", {
    dateStyle: "long",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("hi-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
}

export default async function AdminApplicationDetailPage({
  params,
}: ApplicationDetailPageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canViewApplications(admin.role)) redirect("/admin/dashboard");

  const { id } = await params;
  const [application, latestDecision, activeTemplate] = await Promise.all([
    prisma.karyakartaApplication.findUnique({
      where: { id },
      select: {
        id: true,
        applicationReference: true,
        fullName: true,
        fatherName: true,
        motherName: true,
        dateOfBirth: true,
        gender: true,
        category: true,
        mobile: true,
        alternateMobile: true,
        email: true,
        address: true,
        pincode: true,
        district: true,
        state: true,
        constituency: true,
        education: true,
        occupation: true,
        organizationName: true,
        designation: true,
        joiningReason: true,
        socialMediaLinks: true,
        referenceBy: true,
        status: true,
        uploadStatus: true,
        photoPath: true,
        createdAt: true,
      },
    }),
    prisma.adminAuditLog.findFirst({
      where: { applicationId: id },
      orderBy: { createdAt: "desc" },
      select: {
        action: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.iDCardTemplate.findFirst({
      where: { isActive: true },
      select: { id: true },
    }),
  ]);

  if (!application) notFound();
  const cardRequirements = [
    {
      label: "आवेदन स्वीकृत",
      met: application.status === "APPROVED",
    },
    {
      label: "दस्तावेज़ सत्यापित",
      met: application.uploadStatus === "VERIFIED",
    },
    { label: "फोटो उपलब्ध", met: Boolean(application.photoPath) },
    {
      label: "सक्रिय पहचान-पत्र टेम्पलेट उपलब्ध",
      met: Boolean(activeTemplate),
    },
  ];
  const canOpenIdCard =
    application.status === "APPROVED" &&
    application.uploadStatus === "VERIFIED" &&
    Boolean(application.photoPath && activeTemplate);
  const auditMetadata =
    typeof latestDecision?.metadata === "object" &&
    latestDecision.metadata !== null &&
    !Array.isArray(latestDecision.metadata)
      ? latestDecision.metadata
      : null;
  const blockReason =
    application.status === "BLOCKED" &&
    auditMetadata &&
    typeof auditMetadata.blockReason === "string"
      ? auditMetadata.blockReason
      : null;

  const detailSections = [
    {
      title: "व्यक्तिगत विवरण",
      fields: [
        { label: "पूरा नाम", value: application.fullName },
        { label: "पिता का नाम", value: application.fatherName },
        { label: "माता का नाम", value: application.motherName },
        { label: "जन्म तिथि", value: formatDate(application.dateOfBirth) },
        { label: "लिंग", value: application.gender },
        { label: "श्रेणी", value: application.category },
      ],
    },
    {
      title: "संपर्क विवरण",
      fields: [
        { label: "मोबाइल", value: application.mobile },
        { label: "वैकल्पिक मोबाइल", value: application.alternateMobile },
        { label: "ईमेल", value: application.email },
      ],
    },
    {
      title: "पता",
      fields: [
        { label: "पूरा पता", value: application.address },
        { label: "पिन कोड", value: application.pincode },
        { label: "जिला", value: application.district },
        { label: "राज्य", value: application.state },
        { label: "विधानसभा क्षेत्र", value: application.constituency },
      ],
    },
    {
      title: "कार्य / संगठन विवरण",
      fields: [
        { label: "शिक्षा", value: application.education },
        { label: "व्यवसाय", value: application.occupation },
        { label: "संगठन का नाम", value: application.organizationName },
        { label: "पद", value: application.designation },
      ],
    },
    {
      title: "अन्य जानकारी",
      fields: [
        { label: "जुड़ने का कारण", value: application.joiningReason },
        {
          label: "सोशल मीडिया लिंक",
          value: application.socialMediaLinks,
        },
        { label: "संदर्भ", value: application.referenceBy },
        {
          label: "प्राप्ति समय",
          value: formatDateTime(application.createdAt),
        },
      ],
    },
  ];

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="no-print text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href="/admin/applications"
      >
        आवेदन सूची पर वापस जाएँ
      </Link>
      <div className="no-print mt-4 flex justify-end">
        <ApplicationPrintButton />
      </div>

      <article className="application-print-content mt-5 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
        <div className="print-only mb-6 text-center">
          <h1 className="text-2xl font-bold">राष्ट्रीय गौ रक्षा परिषद</h1>
          <p className="mt-1 text-sm">कार्यकर्ता आवेदन प्रपत्र</p>
        </div>

        <header className="mt-5 flex flex-col justify-between gap-4 rounded-2xl bg-emerald-950 p-6 text-white print:border-b print:border-black print:bg-white print:p-0 print:text-black sm:flex-row sm:items-center sm:p-8">
          <div>
            <p className="text-xs font-bold tracking-[0.14em] text-orange-200 uppercase print:text-black">
              आवेदन संदर्भ · {application.applicationReference}
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              कार्यकर्ता आवेदन प्रपत्र
            </h1>
            <p className="mt-2 text-sm text-emerald-100/80 print:text-black">
              जमा करने की तिथि: {formatDateTime(application.createdAt)}
            </p>
          </div>
          <ApplicationStatusBadge status={application.status} />
        </header>

        {detailSections.map((group) => (
          <section className="mt-6" key={group.title}>
            <h2 className="mb-3 border-b border-stone-200 pb-2 text-sm font-bold text-stone-900 print:border-black">
              {group.title}
            </h2>
            <dl className="grid gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 sm:grid-cols-2 print:grid-cols-2 print:rounded-none print:border-black print:bg-black">
              {group.fields.map((field) => (
                <div className="bg-white p-5 print:p-3" key={field.label}>
                  <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase print:text-black">
                    {field.label}
                  </dt>
                  <dd className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-stone-900 print:text-black">
                    {displayValue(field.value)}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
        <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-stone-200 bg-stone-200 sm:grid-cols-2 print:grid-cols-2 print:rounded-none print:border-black print:bg-black">
          <div className="bg-white p-5 print:p-3">
            <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase print:text-black">
              वर्तमान स्थिति
            </dt>
            <dd className="mt-2">
              <ApplicationStatusBadge status={application.status} />
            </dd>
          </div>
          {application.status !== "PENDING" ? (
            <div className="bg-white p-5 print:p-3">
              <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase print:text-black">
                निर्णय तिथि
              </dt>
              <dd className="mt-2 text-sm text-stone-900 print:text-black">
                {latestDecision
                  ? formatDateTime(latestDecision.createdAt)
                  : "उपलब्ध नहीं"}
              </dd>
            </div>
          ) : null}
          {application.status === "BLOCKED" ? (
            <div className="bg-white p-5 print:p-3">
              <dt className="text-xs font-semibold tracking-wide text-stone-500 uppercase print:text-black">
                अस्वीकृति का कारण
              </dt>
              <dd className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-stone-900 print:text-black">
                {displayValue(blockReason)}
              </dd>
            </div>
          ) : null}
        </dl>
        {application.status === "APPROVED" ? (
          <p className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-950 print:border-black print:bg-white print:text-black">
            यह आवेदन स्वीकृत किया जा चुका है।
          </p>
        ) : null}
        {application.status === "BLOCKED" ? (
          <p className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-950 print:border-black print:bg-white print:text-black">
            यह आवेदन अस्वीकृत किया जा चुका है।
          </p>
        ) : null}
      </article>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-950">
              दस्तावेज़ और पहचान पत्र
              <span className="ml-2 text-sm font-normal text-stone-500">
              </span>
            </h2>
            <p className="mt-2 text-sm text-stone-600">
              दस्तावेज़ स्थिति:{" "}
              {application.uploadStatus === "VERIFIED"
                ? "दस्तावेज़ सत्यापित"
                : application.uploadStatus === "REJECTED"
                  ? "दस्तावेज़ अस्वीकृत"
                  : "दस्तावेज़ लंबित"}
            </p>
          </div>
          {admin.role === "SUPER_ADMIN" ? (
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-emerald-800 px-4 py-2 text-sm font-bold text-emerald-900 transition hover:bg-emerald-50"
              href={`/admin/applications/${encodeURIComponent(application.id)}/verify-documents`}
            >
              <span>दस्तावेज़ सत्यापित करें</span>
            </Link>
          ) : null}
        </div>

        {admin.role === "SUPER_ADMIN" ? (
          <>
            <ul className="mt-5 grid gap-2 text-sm sm:grid-cols-2">
              {cardRequirements.map((requirement) => (
                <li
                  className={
                    requirement.met
                      ? "text-emerald-800"
                      : "text-amber-800"
                  }
                  key={requirement.label}
                >
                  <span aria-hidden="true" className="mr-2">
                    {requirement.met ? "✓" : "•"}
                  </span>
                  {requirement.label}:{" "}
                  {requirement.met ? "पूरा" : "लंबित"}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-stone-600">
              पहचान पत्र बनाने के लिए आवेदन स्वीकृत, दस्तावेज़ सत्यापित, फोटो और सक्रिय टेम्पलेट आवश्यक हैं।
            </p>
            {canOpenIdCard ? (
              <div className="mt-4">
                <Link
                  className="inline-flex min-h-11 items-center justify-center rounded-xl bg-emerald-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
                  href={`/admin/applications/${encodeURIComponent(application.id)}/id-card`}
                >
                  पहचान पत्र बनाएं / प्रिंट करें
                </Link>
              </div>
            ) : (
              <button
                aria-disabled="true"
                className="mt-4 inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl bg-stone-200 px-4 py-3 text-left text-sm font-semibold text-stone-600"
                disabled
                type="button"
              >
                पहचान पत्र बनाने के लिए आवेदन स्वीकृत, दस्तावेज़ सत्यापित, फोटो और सक्रिय टेम्पलेट आवश्यक हैं।
              </button>
            )}
          </>
        ) : (
          <p className="mt-4 text-sm text-stone-600">
            दस्तावेज़ स्थिति केवल-पठन के लिए उपलब्ध है। दस्तावेज़ समीक्षा और
            पहचान पत्र के लिए मुख्य प्रशासक से संपर्क करें।
          </p>
        )}
      </section>

      {admin.role === "SUPER_ADMIN" ? (
        <div className="no-print mt-6 space-y-5">
          <ApplicationReviewActions
            applicationId={application.id}
            applicationReference={application.applicationReference}
            status={application.status}
          />
        </div>
      ) : application.status === "PENDING" ? (
        <p className="no-print mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          केवल मुख्य प्रशासक इस आवेदन की स्थिति बदल सकता है।
        </p>
      ) : null}
    </section>
  );
}
