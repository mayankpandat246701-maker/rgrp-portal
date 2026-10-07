import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";
import { GenerateQrButton } from "../generate-qr-button";
import { IdCardPrintButton } from "./print-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "कार्यकर्ता ID कार्ड",
};

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function IdCardPage({ params }: PageProps) {
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
      status: true,
      uploadStatus: true,
      photoPath: true,
      aadhaarPath: true,
      qrCodePath: true,
      idCardGeneratedAt: true,
      verifiedAt: true,
    },
  });
  if (!application) notFound();

  const template = await prisma.iDCardTemplate.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: "desc" },
    select: { id: true },
  });
  const canGenerateQr =
    application.status === "APPROVED" &&
    application.uploadStatus === "VERIFIED" &&
    Boolean(
      application.photoPath &&
        application.aadhaarPath &&
        application.verifiedAt &&
        template,
    );
  const eligible =
    application.status === "APPROVED" &&
    application.uploadStatus === "VERIFIED" &&
    Boolean(application.photoPath && application.qrCodePath && template);

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="no-print text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href={`/admin/applications/${encodeURIComponent(id)}`}
      >
        आवेदन विवरण पर वापस जाएँ
      </Link>
      <div className="no-print mt-5 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-stone-950">कार्यकर्ता ID कार्ड</h1>
        {eligible ? <IdCardPrintButton /> : null}
      </div>

      {eligible ? (
        <article className="id-card-print mt-8">
          <div className="id-card-canvas">
            <Image
              alt=""
              className="id-card-template"
              height={536}
              src="/api/admin/id-card-template/active"
              unoptimized
              width={850}
            />
            <Image
              alt="कार्यकर्ता फोटो"
              className="id-card-photo"
              height={251}
              src={`/api/admin/applications/${encodeURIComponent(id)}/documents/photo`}
              unoptimized
              width={170}
            />
            <div className="id-card-name">{application.fullName}</div>
            <div className="id-card-reference">
              {application.applicationReference}
            </div>
            {application.idCardGeneratedAt ? (
              <div className="id-card-verified">
                सत्यापन:{" "}
                {new Intl.DateTimeFormat("hi-IN", {
                  dateStyle: "medium",
                  timeZone: "Asia/Kolkata",
                }).format(application.verifiedAt ?? application.idCardGeneratedAt)}
              </div>
            ) : null}
            <Image
              alt="सत्यापन QR कोड"
              className="id-card-qr"
              height={150}
              src={`/api/admin/applications/${encodeURIComponent(id)}/documents/qr`}
              unoptimized
              width={150}
            />
          </div>
        </article>
      ) : (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
          <p>
            ID कार्ड के लिए सक्रिय टेम्पलेट, स्वीकृत आवेदन, सत्यापित दस्तावेज़,
            फोटो और QR कोड आवश्यक हैं।
          </p>
          {canGenerateQr && !application.qrCodePath ? (
            <div className="mt-4">
              <GenerateQrButton applicationId={application.id} />
            </div>
          ) : null}
        </div>
      )}

      <style>{`
        .id-card-canvas {
          position: relative;
          width: min(100%, 850px);
          aspect-ratio: 1.586;
          margin: 0 auto;
          overflow: hidden;
          background: #fff;
          border: 1px solid #d6d3d1;
          border-radius: 16px;
        }
        .id-card-template { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: fill; }
        .id-card-photo { position: absolute; left: 8%; top: 22%; width: 20%; height: 47%; object-fit: cover; border: 3px solid white; }
        .id-card-name { position: absolute; left: 32%; top: 34%; width: 44%; font-size: clamp(14px, 3vw, 30px); font-weight: 700; overflow-wrap: anywhere; color: #17221b; }
        .id-card-reference { position: absolute; left: 32%; top: 48%; font-size: clamp(9px, 1.5vw, 15px); font-weight: 600; color: #17221b; }
        .id-card-verified { position: absolute; left: 32%; top: 57%; font-size: clamp(8px, 1.2vw, 12px); color: #17221b; }
        .id-card-qr { position: absolute; right: 7%; bottom: 10%; width: 18%; aspect-ratio: 1; padding: 3px; background: white; }
        @media print {
          @page { size: A4 portrait; margin: 18mm; }
          body { background: white !important; }
          body * { visibility: hidden !important; }
          .id-card-print, .id-card-print * { visibility: visible !important; }
          .id-card-print { position: absolute; inset: 0 auto auto 0; width: 100%; margin: 0; }
          .id-card-canvas { width: 100%; border-radius: 0; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
      `}</style>
    </section>
  );
}
