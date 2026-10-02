import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ApplicationReviewActions } from "@/components/admin/application-review-actions";
import { ApplicationPrintButton } from "@/components/admin/application-print-button";
import { ApplicationStatusBadge } from "@/components/admin/application-status-badge";
import { requireAdmin } from "@/lib/auth/require-admin";
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

  const { id } = await params;
  const [application, latestDecision] = await Promise.all([
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
  ]);

  if (!application) notFound();
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
          label: "सोशल मीडिया लिंक (JSON)",
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

      {admin.role === "SUPER_ADMIN" ? (
        <div className="no-print mt-6">
          <ApplicationReviewActions
            applicationId={application.id}
            applicationReference={application.applicationReference}
            status={application.status}
          />
        </div>
      ) : application.status === "PENDING" ? (
        <p className="no-print mt-6 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          केवल Super Admin इस आवेदन की स्थिति बदल सकता है।
        </p>
      ) : null}
    </section>
  );
}
