import { HeroSection } from "@/components/home/hero-section";
import { IntroSection } from "@/components/home/intro-section";
import { ServicesSection } from "@/components/home/services-section";
import { SanghSection } from "@/components/home/sangh-section";
import { ActivitiesSection } from "@/components/home/activities-section";
import { ContactSection } from "@/components/home/contact-section";
import { prisma } from "@/lib/prisma";
import { NewsSection } from "@/components/home/news-section";
import { GroundActivitySection } from "@/components/home/ground-activity-section";
import { publishedGroundActivityWhere, publishedNewsWhere } from "@/lib/public-content";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [leadershipMessages, newsPosts, groundActivities] = await Promise.all([
    prisma.leadershipMessage.findMany({
      where: { isPublished: true, showOnHomepage: true },
      orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }],
      take: 12,
      select: { id: true, name: true, designation: true, message: true, portraitUrl: true },
    }),
    prisma.newsPost.findMany({
      where: { ...publishedNewsWhere(), isFeatured: true },
      orderBy: [{ homepageDisplayOrder: "asc" }, { publishedAt: "desc" }],
      take: 3,
      select: { slug: true, title: true, shortSummary: true, category: true, publishedAt: true, coverImageStorageKey: true, coverImageAltHindi: true },
    }),
    prisma.groundActivity.findMany({
      where: { ...publishedGroundActivityWhere(), isFeaturedOnHomepage: true },
      orderBy: [{ homepageDisplayOrder: "asc" }, { activityDate: "desc" }],
      take: 6,
      select: {
        slug: true, title: true, shortSummary: true, activityDate: true, state: true,
        district: true, publicLocationLabel: true, exactLocationPublic: true,
        coverImageStorageKey: true, coverImageAltHindi: true,
      },
    }),
  ]);

  return (
    <>
      <HeroSection />
      <IntroSection />
      <ServicesSection />
      <SanghSection messages={leadershipMessages} />
      <ActivitiesSection />
      <NewsSection posts={newsPosts} />
      <GroundActivitySection activities={groundActivities} />
      <ContactSection />
    </>
  );
}
