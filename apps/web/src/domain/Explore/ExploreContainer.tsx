"use client";

import Link from "next/link";
import { Icon } from "@/components/icons";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { stickyMainTopSpacious } from "@/lib/mobilePageLayout";
import { RecommendedEventsSection } from "@/domain/Home/RecommendedEventsSection";
import { ROUTES } from "@/constants/routes";

export default function ExploreContainer() {
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-surface-muted lg:max-w-none">
      <StickyHeader
        title="탐색"
        rightSlot={
          <Link
            href={ROUTES.EXPLORE.MAP}
            aria-label="지도로 보기"
            className="inline-flex size-11 items-center justify-center text-text-muted"
          >
            <Icon name="map-pin" size="lg" color="currentColor" decorative />
          </Link>
        }
      />
      <main className={`relative z-10 min-h-0 flex-1 overflow-y-auto px-page pb-6 lg:mx-auto lg:w-full lg:max-w-5xl ${stickyMainTopSpacious}`}>
        <RecommendedEventsSection showHeading={false} />
      </main>
    </div>
  );
}
