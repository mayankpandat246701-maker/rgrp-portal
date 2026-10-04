import { HeroSection } from "@/components/home/hero-section";
import { IntroSection } from "@/components/home/intro-section";
import { ServicesSection } from "@/components/home/services-section";
import { SanghSection } from "@/components/home/sangh-section";
import { ActivitiesSection } from "@/components/home/activities-section";
import { ContactSection } from "@/components/home/contact-section";
import { LeadershipMessagesSection } from "@/components/public/leadership-messages-section";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const leadershipMessages = await prisma.leadershipMessage.findMany({
    where: { isPublished: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      designation: true,
      message: true,
      portraitUrl: true,
    },
  });

  return (
    <>
      <HeroSection />
      <IntroSection />
      <ServicesSection />
      <SanghSection />
      <ActivitiesSection />
      <ContactSection />
      <LeadershipMessagesSection messages={leadershipMessages} />
    </>
  );
}
