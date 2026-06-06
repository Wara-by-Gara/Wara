"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { Chip } from "@/components/primitives/Chip";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ROUTES } from "@/constants/routes";
import { usePublicInvitations } from "@/hooks/usePublicInvitations";
import type { PublicInvitationExplore } from "@/lib/api/invitations";
import { EventListSkeleton } from "@/components/organisms/Skeleton";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  formatExploreEventDate,
  type EventCategory,
  type ExploreCategory,
} from "@/lib/recommendedEvents";

interface RecommendedEventsSectionProps {
  limit?: number;
  showHeading?: boolean;
}

function isExploreCategory(value: string): value is ExploreCategory {
  return value !== "all" && value in EVENT_CATEGORY_LABELS;
}

function EventListItem({ event }: { event: PublicInvitationExplore }) {
  const categoryLabel = isExploreCategory(event.category)
    ? EVENT_CATEGORY_LABELS[event.category]
    : event.category;

  return (
    <Link
      href={ROUTES.INVITATIONS.DETAIL(event.id)}
      className="home-list-item-y flex items-center gap-3 transition-opacity active:opacity-70"
    >
      <div className="size-20 shrink-0 overflow-hidden rounded-sm bg-gray-100">
        {event.mainImageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={event.mainImageUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-text-tertiary">
            <Icon name="image" size="md" color="inactive" decorative />
          </div>
        )}
      </div>
      <div className="home-card-text min-w-0 flex-1">
        <span className="type-card-eyebrow">{categoryLabel}</span>
        <h3 className="type-card-title truncate">{event.title}</h3>
        <p className="home-meta-row type-meta">
          <Icon name="clock" size="xs" color="inactive" decorative />
          <span className="truncate">{formatExploreEventDate(event.eventStartAt)}</span>
        </p>
        <p className="home-meta-row type-meta-muted">
          <Icon name="map-pin" size="xs" color="inactive" decorative />
          <span className="truncate">{event.location?.trim() || "미정"}</span>
        </p>
      </div>
    </Link>
  );
}

export function RecommendedEventsSection({
  limit,
  showHeading = true,
}: RecommendedEventsSectionProps) {
  const [category, setCategory] = useState<EventCategory>("all");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicInvitations(category);

  const events = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const visible = useMemo(
    () => (limit ? events.slice(0, limit) : events),
    [events, limit],
  );

  const enableInfiniteScroll = limit == null;

  useEffect(() => {
    if (!enableInfiniteScroll) return;

    const el = sentinelRef.current;
    if (!el || !hasNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [enableInfiniteScroll, hasNextPage, isFetchingNextPage, fetchNextPage, category]);

  return (
    <section className="home-section">
      {showHeading ? <SectionHeader heading="추천 이벤트" /> : null}
      <div className="home-section-content">
      <div className="-mx-page flex gap-2 overflow-x-auto px-page pb-1 scrollbar-hide">
        {EVENT_CATEGORIES.map((key) => (
          <Chip
            key={key}
            variant="filter"
            selected={category === key}
            onClick={() => setCategory(key)}
            className="shrink-0"
          >
            {EVENT_CATEGORY_LABELS[key]}
          </Chip>
        ))}
      </div>
      <div className="home-section-list flex flex-col divide-y divide-border">
        {isLoading ? (
          <EventListSkeleton count={4} />
        ) : isError ? (
          <p className="type-empty py-8 text-center">
            이벤트를 불러오지 못했어요.
          </p>
        ) : visible.length === 0 ? (
          <p className="type-empty py-8 text-center">
            해당 카테고리의 공개 이벤트가 없어요.
          </p>
        ) : (
          <>
            {visible.map((event) => (
              <EventListItem key={event.id} event={event} />
            ))}
            {enableInfiniteScroll && hasNextPage ? (
              <div ref={sentinelRef} className="py-2">
                {isFetchingNextPage ? <EventListSkeleton count={2} /> : null}
              </div>
            ) : null}
          </>
        )}
      </div>
      </div>
    </section>
  );
}
