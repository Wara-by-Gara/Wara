"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/icons";
import { TextInput } from "@/components/primitives/TextInput";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/primitives/Chip";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { InvitationCard } from "@/components/organisms/InvitationCard";
import { ROUTES } from "@/constants/routes";
import { usePublicInvitations } from "@/hooks/usePublicInvitations";
import type { ExploreSort, PublicInvitationExplore } from "@/lib/api/invitations";
import { EventListSkeleton } from "@/components/organisms/Skeleton";
import {
  EVENT_CATEGORIES,
  EVENT_CATEGORY_LABELS,
  formatExploreEventDate,
  type EventCategory,
  type ExploreCategory,
} from "@/lib/recommendedEvents";
import { resolveInvitationCardStatus } from "@/utils/resolveInvitationCardStatus";

interface RecommendedEventsSectionProps {
  limit?: number;
  showHeading?: boolean;
}

function isExploreCategory(value: string): value is ExploreCategory {
  return value !== "all" && value in EVENT_CATEGORY_LABELS;
}

function EventListItem({ event }: { event: PublicInvitationExplore }) {
  const router = useRouter();
  const categoryLabel = isExploreCategory(event.category)
    ? EVENT_CATEGORY_LABELS[event.category]
    : event.category;
  const chip = resolveInvitationCardStatus({
    eventStartAt: event.eventStartAt,
  });

  return (
    <InvitationCard
      layout="horizontal"
      variant={chip?.variant ?? "default"}
      ddayLabel={chip?.ddayLabel}
      imageUrl={event.mainImageUrl ?? undefined}
      subject={chip ? undefined : categoryLabel}
      title={event.title}
      date={formatExploreEventDate(event.eventStartAt)}
      location={event.location ?? undefined}
      onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(event.id))}
      className="w-full"
    />
  );
}

const SORT_OPTIONS: { key: ExploreSort; label: string }[] = [
  { key: "latest", label: "최신순" },
  { key: "deadline", label: "마감순" },
  { key: "views", label: "조회순" },
];

export function RecommendedEventsSection({
  limit,
  showHeading = true,
}: RecommendedEventsSectionProps) {
  const [category, setCategory] = useState<EventCategory>("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<ExploreSort>("latest");
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 검색어 디바운스 (300ms) — 입력마다 쿼리 날리지 않도록
  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicInvitations(category, query, sort);

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
  }, [enableInfiniteScroll, hasNextPage, isFetchingNextPage, fetchNextPage, category, query, sort]);

  return (
    <section className="home-section">
      {showHeading ? <SectionHeader heading="추천 이벤트" /> : null}
      <div className="home-section-content">
      <div className="mb-3 flex flex-col gap-2">
        <TextInput
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="초대장 제목 검색"
          maxLength={100}
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as EventCategory)}
            aria-label="카테고리"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-text-primary"
          >
            {EVENT_CATEGORIES.map((key) => (
              <option key={key} value={key}>
                {EVENT_CATEGORY_LABELS[key]}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as ExploreSort)}
            aria-label="정렬"
            className="flex-1 rounded-md border border-border bg-surface px-3 py-2 text-[14px] text-text-primary"
          >
            {SORT_OPTIONS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
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
            조건에 맞는 공개 이벤트가 없어요.
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
