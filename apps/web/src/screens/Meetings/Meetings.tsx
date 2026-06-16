"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { StickyHeader } from "@/components/layout/StickyHeader";
import { Icon, IconButton, BottomSheet, EmptyState } from "@wara/ui";
import { InviteCard, MonthCalendar } from "@/components/domain";
import { useHideInvitation } from "@/hooks/useParticipants";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import { sortInvitationsByEventDate } from "@/domain/Home/homeUtils";
import { getInvitationCoverImageUrl } from "@/domain/InvitationList/invitationListUtils";
import { useMyInvitations } from "@/hooks/useInvitations";
import type { Invitation } from "@/lib/api/invitations";
import { stickyMainTopSpacious } from "@/lib/mobilePageLayout";
import { getTemplates } from "@/lib/api/templates";
import { resolveInvitationCardSubject } from "@/lib/recommendedEvents";
import { formatInvitationEventDate } from "@/utils/formatInvitationEventDate";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function dateKeyOf(iso: string): string {
  const d = new Date(iso);
  return toKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function formatDayHeader(key: string): string {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[d.getDay()]}요일`;
}

type ListMode = "all" | "date";

export function Meetings() {
  const router = useRouter();
  const { data: invitations, isLoading } = useMyInvitations();
  const { data: templates = [] } = useQuery({
    queryKey: QUERY_KEYS.templates.all(),
    queryFn: getTemplates,
  });
  const themeByTemplateId = useMemo(
    () => new Map(templates.map((t) => [t.id, t.theme])),
    [templates],
  );

  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [listMode, setListMode] = useState<ListMode>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [moreMenuInvId, setMoreMenuInvId] = useState<string | null>(null);
  const hideInvitation = useHideInvitation();

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Invitation[]>();
    (invitations ?? []).forEach((inv) => {
      if (!inv.eventStartAt) return;
      const key = dateKeyOf(inv.eventStartAt);
      const arr = map.get(key) ?? [];
      arr.push(inv);
      map.set(key, arr);
    });
    return map;
  }, [invitations]);

  const allEventsSorted = useMemo(
    () => sortInvitationsByEventDate(invitations ?? []),
    [invitations],
  );

  const hasAnyEvent = allEventsSorted.length > 0;

  const listEvents = useMemo(() => {
    if (listMode === "date" && selectedKey) {
      return eventsByDay.get(selectedKey) ?? [];
    }
    return allEventsSorted;
  }, [listMode, selectedKey, eventsByDay, allEventsSorted]);

  const prevMonth = () => {
    if (month === 1) {
      setYear((y) => y - 1);
      setMonth(12);
    } else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) {
      setYear((y) => y + 1);
      setMonth(1);
    } else setMonth((m) => m + 1);
  };
  const goToday = () => {
    setYear(today.getFullYear());
    setMonth(today.getMonth() + 1);
  };

  const handleDayClick = (key: string) => {
    if (listMode === "date" && selectedKey === key) {
      setListMode("all");
      setSelectedKey(null);
      return;
    }
    setSelectedKey(key);
    setListMode("date");
    const d = keyToDate(key);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const markedKeys = useMemo(() => new Set(eventsByDay.keys()), [eventsByDay]);

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <StickyHeader title="나의 모임" onBack={() => router.back()} />

      {!isLoading && !hasAnyEvent ? (
        <main className="relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-page">
          <EmptyState
            icon="calendar"
            title="아직 일정이 없어요"
            description="초대장을 만들거나 참여하면 여기에 표시돼요"
          />
        </main>
      ) : (
        <main className={`relative z-10 flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-page pb-4 ${stickyMainTopSpacious}`}>
          <MonthCalendar
            year={year}
            month={month}
            selectedKeys={selectedKey ? new Set([selectedKey]) : new Set()}
            onDayClick={handleDayClick}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            onToday={goToday}
            markedKeys={markedKeys}
          />

          <section className="rounded-md border border-border bg-surface p-4">
            <h2 className="mb-3 text-[15px] font-bold text-text-primary">
              {listMode === "date" && selectedKey
                ? formatDayHeader(selectedKey)
                : "전체 모임"}
            </h2>

            {listEvents.length === 0 ? (
              <p className="py-6 text-center text-[14px] text-text-tertiary">
                {listMode === "date" ? "이 날 일정이 없어요" : "표시할 모임이 없어요"}
              </p>
            ) : (
              <div className="flex flex-col divide-y divide-border">
                {listEvents.map((ev) => (
                  <div key={ev.id} className="flex items-center">
                    <InviteCard
                      layout="horizontal"
                      imageUrl={getInvitationCoverImageUrl(ev) || undefined}
                      subject={resolveInvitationCardSubject(
                        ev.templateId
                          ? themeByTemplateId.get(ev.templateId)
                          : undefined,
                      )}
                      title={ev.title}
                      dateText={formatInvitationEventDate(ev.eventStartAt)}
                      locationText={ev.eventLocation?.placeName ?? ev.eventLocation?.address ?? ""}
                      onClick={() => router.push(ROUTES.INVITATIONS.DETAIL(ev.id))}
                      className="flex-1 min-w-0"
                    />
                    {ev.myRole === 'GUEST' && (
                      <IconButton
                        icon="more-horizontal"
                        variant="ghost"
                        size="sm"
                        label="더보기"
                        disabled={hideInvitation.isPending}
                        onClick={() => setMoreMenuInvId(ev.id)}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
      <BottomSheet
        open={!!moreMenuInvId}
        onOpenChange={(open) => { if (!open) setMoreMenuInvId(null); }}
        title="모임 더보기"
        hideTitle
      >
        <div className="flex flex-col">
          <button
            type="button"
            className="flex w-full items-center gap-3 py-4 text-left text-[15px] text-text-primary active:bg-gray-50"
            disabled={hideInvitation.isPending}
            onClick={() => {
              if (moreMenuInvId) hideInvitation.mutate({ invitationId: moreMenuInvId, isHidden: true });
              setMoreMenuInvId(null);
            }}
          >
            <Icon name="eye-off" size="sm" color="currentColor" decorative />
            초대장 숨기기
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
