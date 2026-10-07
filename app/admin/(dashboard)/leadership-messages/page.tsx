import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LeadershipMessageManager } from "@/app/admin/(dashboard)/leadership-messages/leadership-message-manager";
import { canManageLeadership } from "@/lib/auth/admin-permissions";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "संघ के मुख्य व्यक्ति और उनके संदेश",
};

export default async function LeadershipMessagesPage() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin/login");
  if (!canManageLeadership(admin.role)) {
    redirect("/admin/dashboard");
  }

  const messages = await prisma.leadershipMessage.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      designation: true,
      message: true,
      portraitUrl: true,
      sortOrder: true,
      displayOrder: true,
      showOnHomepage: true,
      state: true,
      district: true,
      isPublished: true,
      createdAt: true,
    },
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-8 sm:py-14">
      <Link
        className="text-sm font-semibold text-emerald-800 underline underline-offset-4"
        href="/admin/dashboard"
      >
        डैशबोर्ड पर वापस जाएँ
      </Link>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-stone-950">
        संघ के मुख्य व्यक्ति और उनके संदेश
      </h1>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">
        प्रकाशित संदेश वेबसाइट के होमपेज पर क्रम के अनुसार दिखेंगे। ड्राफ़्ट
        केवल एडमिन पैनल में दिखते हैं।
      </p>
      <LeadershipMessageManager
        initialMessages={messages.map((message) => ({
          ...message,
          createdAt: message.createdAt.toISOString(),
        }))}
      />
    </section>
  );
}
