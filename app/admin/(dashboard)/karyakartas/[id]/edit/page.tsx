import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { KaryakartaForm } from "@/app/admin/(dashboard)/karyakartas/karyakarta-form";
import { JoiningCertificatePanel } from "@/app/admin/(dashboard)/karyakartas/certificate-panel";
import { canManageKaryakarta, canPublishContent, hasKaryakartaScope } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "कार्यकर्ता की जानकारी अपडेट करें" };

type PageProps = { params: Promise<{ id: string }> };

export default async function EditKaryakartaPage({ params }: PageProps) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageKaryakarta(admin.role)) redirect("/admin/dashboard");
  const { id } = await params;
  const member = await prisma.karyakarta.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      regNo: true,
      name: true,
      phone: true,
      email: true,
      daitva: true,
      state: true,
      district: true,
      tehsil: true,
      cityOrVillage: true,
      publicBio: true,
      joiningDate: true,
      appointmentStartDate: true,
      appointmentEndDate: true,
      isPublicProfile: true,
      isEmergencyHidden: true,
      isFeatured: true,
      profileStatus: true,
      displayOrder: true,
      instagramUrl: true,
      facebookUrl: true,
      youtubeUrl: true,
      whatsappContactUrl: true,
      adminNotes: true,
      registrations: {
        orderBy: { createdAt: "desc" },
        select: { id: true, registrationNumber: true, status: true, issueDate: true, expiryDate: true, revokedReason: true, createdAt: true },
      },
      certificates: {
        orderBy: [{ generatedAt: "desc" }, { id: "desc" }],
        take: 20,
        select: {
          id: true,
          certificateNumber: true,
          status: true,
          issueDate: true,
          generatedAt: true,
          revokedAt: true,
        },
      },
    },
  });
  if (!member) notFound();
  if (!hasKaryakartaScope(admin, member.state, member.district)) redirect("/admin/karyakartas");
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-14">
      <Link className="text-sm font-semibold text-emerald-800 underline underline-offset-4" href="/admin/karyakartas">कार्यकर्ता सूची पर लौटें</Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">{member.name} की जानकारी अपडेट करें</h1>
      <p className="mt-2 text-sm text-stone-600">संग्रहित करने या पहचान पत्र पुनः जारी करने पर प्रोफ़ाइल और पंजीकरण इतिहास सुरक्षित रहता है।</p>
      <KaryakartaForm
        canApprove={canPublishContent(admin.role)}
        initialMember={{
          ...member,
          joiningDate: member.joiningDate?.toISOString() ?? null,
          appointmentStartDate: member.appointmentStartDate?.toISOString() ?? null,
          appointmentEndDate: member.appointmentEndDate?.toISOString() ?? null,
          registrations: member.registrations.map((registration) => ({
            ...registration,
            issueDate: registration.issueDate?.toISOString() ?? null,
            expiryDate: registration.expiryDate?.toISOString() ?? null,
            createdAt: registration.createdAt.toISOString(),
          })),
        }}
      />
      <JoiningCertificatePanel
        memberId={member.id}
        certificates={member.certificates.map((certificate) => ({
          ...certificate,
          issueDate: certificate.issueDate.toISOString(),
          generatedAt: certificate.generatedAt.toISOString(),
          revokedAt: certificate.revokedAt?.toISOString() ?? null,
        }))}
      />
    </section>
  );
}
