import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { DocumentReviewActions } from "@/app/admin/applications/[id]/verify-documents/document-review-actions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "दस्तावेज़ सत्यापन",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function VerifyDocumentsPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/dashboard");

  const { id } = await params;
  const application = await prisma.karyakartaApplication.findUnique({
    where: { id },
    select: {
      id: true,
      applicationReference: true,
      fullName: true,
      photoPath: true,
      aadhaarPath: true,
      uploadStatus: true,
      documentReviewReason: true,
      verifiedAt: true,
    },
  });
  if (!application) notFound();

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href={`/admin/applications/${encodeURIComponent(id)}`}
      >
        आवेदन विवरण पर वापस जाएँ
      </Link>
      <h1 className="mt-5 text-3xl font-bold text-stone-950">
        दस्तावेज़ सत्यापन
      </h1>
      <p className="mt-2 text-sm text-stone-600">
        आवेदन संदर्भ: {application.applicationReference}
      </p>
      <p className="mt-1 text-sm text-stone-600">
        आवेदक: {application.fullName}
      </p>

      <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="font-bold text-stone-950">दस्तावेज़ स्थिति</h2>
        <p
          className={`mt-2 text-base font-semibold ${
            application.uploadStatus === "VERIFIED"
              ? "text-emerald-800"
              : application.uploadStatus === "REJECTED"
                ? "text-red-800"
                : "text-amber-800"
          }`}
        >
          {application.uploadStatus === "PENDING"
            ? "दस्तावेज़ लंबित"
            : application.uploadStatus === "VERIFIED"
              ? "दस्तावेज़ सत्यापित"
              : "दस्तावेज़ अस्वीकृत"}
        </p>
        {application.verifiedAt ? (
          <p className="mt-1 text-xs text-stone-500">
            निर्णय समय:{" "}
            {new Intl.DateTimeFormat("hi-IN", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "Asia/Kolkata",
            }).format(application.verifiedAt)}
          </p>
        ) : null}
        {application.uploadStatus === "REJECTED" &&
        application.documentReviewReason ? (
          <p className="mt-2 text-sm text-red-800">
            कारण: {application.documentReviewReason}
          </p>
        ) : null}
      </section>

      {application.uploadStatus === "VERIFIED" ||
      application.uploadStatus === "REJECTED" ? (
        <p
          className={`mt-5 rounded-xl p-4 text-sm font-semibold ${
            application.uploadStatus === "VERIFIED"
              ? "border border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border border-red-200 bg-red-50 text-red-900"
          }`}
          role="status"
        >
          {application.uploadStatus === "VERIFIED"
            ? "इन दस्तावेज़ों की समीक्षा पूरी हो चुकी है। अब कोई बदलाव नहीं किया जा सकता।"
            : "इन दस्तावेज़ों को अस्वीकार किया जा चुका है। अब कोई बदलाव नहीं किया जा सकता।"}
        </p>
      ) : admin.role === "SUPER_ADMIN" &&
        application.photoPath &&
        application.aadhaarPath ? (
        <>
          <div className="mt-7 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-stone-950">
                पासपोर्ट आकार का फोटो
              </h2>
              <Image
                alt="अपलोड किया गया पासपोर्ट आकार का फोटो"
                className="mt-4 max-h-[32rem] w-full rounded-xl border border-stone-200 bg-stone-50 object-contain"
                height={640}
                src={`/api/admin/applications/${encodeURIComponent(id)}/documents/photo`}
                unoptimized
                width={640}
              />
            </section>
            <section className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <h2 className="font-bold text-stone-950">आधार दस्तावेज़</h2>
              <iframe
                className="mt-4 h-[32rem] w-full rounded-xl border border-stone-200 bg-stone-50"
                src={`/api/admin/applications/${encodeURIComponent(id)}/documents/aadhaar`}
                title="अपलोड किया गया आधार दस्तावेज़"
              />
            </section>
          </div>
          <div className="mt-6">
            <DocumentReviewActions applicationId={id} />
          </div>
        </>
      ) : admin.role === "SUPER_ADMIN" ? (
        <p className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          समीक्षा शुरू करने से पहले आवेदक से फोटो और आधार दस्तावेज़ अपलोड करवाएँ।
        </p>
      ) : (
        <p className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm text-stone-600">
          दस्तावेज़ समीक्षा केवल Super Admin कर सकता है। निजी दस्तावेज़ देखने की
          अनुमति आपके खाते को नहीं है।
        </p>
      )}
    </section>
  );
}
