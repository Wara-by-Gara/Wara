"use client";

import { StickyHeader } from "@/components/layout/StickyHeader";
import { stickyMainTopSpacious } from "@/lib/mobilePageLayout";
import { RecommendedEventsSection } from "@/domain/Home/RecommendedEventsSection";

export default function ExploreContainer() {
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader title="탐색" />
      <main className={`relative z-10 min-h-0 flex-1 overflow-y-auto px-page pb-6 ${stickyMainTopSpacious}`}>
        <RecommendedEventsSection showHeading={false} />
      </main>
    </div>
  );
}
