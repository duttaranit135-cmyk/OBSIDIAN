"use client";

import SmoothScroll from "@/components/SmoothScroll";
import HeroSection from "@/components/HeroSection";
import StorySection from "@/components/StorySection";
import TypographySection from "@/components/TypographySection";
import DetailSection from "@/components/DetailSection";
import FinalSection from "@/components/FinalSection";
import SiteFooter from "@/components/SiteFooter";

export default function Home() {
  return (
    <SmoothScroll>
      {/* ── Page content ── */}
      <main>
        {/* Section 1 — Hero (sticky scroll experience) */}
        <HeroSection />

        {/* Section 2 — Story */}
        <StorySection />

        {/* Section 3 — Giant typography overlapping angel */}
        <TypographySection />

        {/* Section 4 — Detail close-up */}
        <DetailSection />

        {/* Section 5 — Final CTA */}
        <FinalSection />
      </main>

      <SiteFooter />
    </SmoothScroll>
  );
}
