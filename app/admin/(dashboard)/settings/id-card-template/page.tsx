import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { TemplateUploadForm } from "@/app/admin/(dashboard)/settings/id-card-template/template-upload-form";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "पहचान पत्र टेम्पलेट",
};

export default async function IdCardTemplateSettingsPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.role !== "SUPER_ADMIN") redirect("/admin/dashboard");

  const template = await prisma.iDCardTemplate.findFirst({
    where: { isActive: true },
    orderBy: { uploadedAt: "desc" },
    select: { id: true, uploadedAt: true },
  });

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href="/admin/dashboard"
      >
        डैशबोर्ड पर वापस जाएँ
      </Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">
        पहचान पत्र सेटिंग
      </h1>
      <div className="mt-7 grid gap-6 lg:grid-cols-2">
        <TemplateUploadForm hasActiveTemplate={Boolean(template)} />
        <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-stone-950">
            सक्रिय टेम्पलेट पूर्वावलोकन
          </h2>
          {template ? (
            <>
              <div className="mt-4 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                <Image
                  alt="सक्रिय पहचान पत्र टेम्पलेट"
                  className="max-h-96 w-full object-contain"
                  height={600}
                  src="/api/admin/id-card-template/active"
                  unoptimized
                  width={900}
                />
              </div>
              <p className="mt-3 text-xs text-stone-500">
                अपलोड समय:{" "}
                {new Intl.DateTimeFormat("hi-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "Asia/Kolkata",
                }).format(template.uploadedAt)}
              </p>
            </>
          ) : (
            <p className="mt-4 rounded-xl bg-stone-50 p-5 text-sm text-stone-600">
              अभी कोई सक्रिय टेम्पलेट नहीं है।
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
