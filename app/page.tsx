import { HeroSection } from "@/components/home/hero-section";
import { IntroSection } from "@/components/home/intro-section";
import { ServicesSection } from "@/components/home/services-section";
import { SanghSection } from "@/components/home/sangh-section";
import { ActivitiesSection } from "@/components/home/activities-section";
import { ContactSection } from "@/components/home/contact-section";

export default function Home() {
  return (
    <>
      <HeroSection />
      <IntroSection />
      <ServicesSection />
      <SanghSection />
      <ActivitiesSection />
      <ContactSection />
    </>
  );
}
