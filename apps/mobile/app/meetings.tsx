// 모임 내역 화면 — 웹 /meetings 미러 (F-MPBPAP 내 모임/참여 내역).
// 웹 IA: 월 달력(날짜 탭 = 날짜 필터, 재탭 = 전체 모임) + 모임 카드 리스트.
// 앱 크롬 — theme 토큰 + components/ios 킷만 사용. 카드 탭 → /invitations/[id].

import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';

import { WaraApiError, type Invitation } from '@/api';
import { Button, haptics, ListSection, Screen } from '@/components/ios';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useMyInvitations } from '@/hooks/queries/invitations';
import { ios, iosHex, iosMetrics, iosType } from '@/theme';

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

// ── 날짜 유틸 (웹 screens/Meetings/Meetings.tsx 미러) ─────────────────────────

function toKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dateKeyOf(iso: string): string {
  const d = new Date(iso);
  return toKey(d.getFullYear(), d.getMonth() + 1, d.getDate());
}

function keyToDate(key: string): Date {
  const [y, m, d] = key.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

function formatDayHeader(key: string): string {
  const d = keyToDate(key);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DAY_LABELS[d.getDay()]}요일`;
}

/** 초대장 일시 — 웹 utils/formatInvitationEventDate 미러. 예: 6월 3일(수), 오후 7시 30분 */
function formatEventDate(eventStartAt: string | null | undefined): string {
  if (!eventStartAt) return '미정';
  const d = new Date(eventStartAt);
  if (Number.isNaN(d.getTime())) return '미정';
  const datePart = `${d.getMonth() + 1}월 ${d.getDate()}일(${DAY_LABELS[d.getDay()]})`;
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 || 12;
  const timePart = m === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}시 ${m}분`;
  return `${datePart}, ${timePart}`;
}

/** 웹 domain/Home/homeUtils.sortInvitationsByEventDate 미러 — active만, 시간순 + 날짜 미정 말미. */
function sortByEventDate(invitations: Invitation[]): Invitation[] {
  const active = invitations.filter((inv) => inv.status !== 'closed');
  const dated = active
    .filter((inv) => inv.eventStartAt)
    .sort(
      (a, b) => new Date(a.eventStartAt ?? 0).getTime() - new Date(b.eventStartAt ?? 0).getTime(),
    );
  const undated = active.filter((inv) => !inv.eventStartAt);
  return [...dated, ...undated];
}

function messageForError(err: unknown): string {
  if (err instanceof WaraApiError) return '모임 내역을 불러오지 못했어요';
  return '네트워크 오류가 발생했어요';
}

type ListMode = 'all' | 'date';

// ── 화면 ──────────────────────────────────────────────────────────────────────

export default function MeetingsScreen() {
  const query = useMyInvitations();

  const today = new Date();
  const todayKey = toKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [listMode, setListMode] = useState<ListMode>('all');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const invitations = query.data;

  const eventsByDay = useMemo(() => {
    const map = new Map<string, Invitation[]>();
    (invitations ?? []).forEach((inv) => {
      if (!inv.eventStartAt) return;
      // 불참(absent) 응답한 모임은 달력 일정에서 제외 (웹과 동일)
      if (inv.myRsvpStatus === 'absent') return;
      const key = dateKeyOf(inv.eventStartAt);
      const arr = map.get(key) ?? [];
      arr.push(inv);
      map.set(key, arr);
    });
    return map;
  }, [invitations]);

  const allEventsSorted = useMemo(() => sortByEventDate(invitations ?? []), [invitations]);
  const markedKeys = useMemo(() => new Set(eventsByDay.keys()), [eventsByDay]);

  const listEvents =
    listMode === 'date' && selectedKey ? (eventsByDay.get(selectedKey) ?? []) : allEventsSorted;

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

  const handleDayPress = (key: string) => {
    haptics.selection();
    if (listMode === 'date' && selectedKey === key) {
      setListMode('all');
      setSelectedKey(null);
      return;
    }
    setSelectedKey(key);
    setListMode('date');
    const d = keyToDate(key);
    setYear(d.getFullYear());
    setMonth(d.getMonth() + 1);
  };

  const screenHeader = <Stack.Screen options={{ title: '모임 내역', headerLargeTitle: true }} />;

  if (query.isPending) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (query.error) {
    return (
      <View style={styles.center}>
        {screenHeader}
        <Text style={styles.errorTitle}>불러오지 못했어요</Text>
        <Text style={styles.errorBody}>{messageForError(query.error)}</Text>
        <Button title="다시 시도" onPress={() => query.refetch()} />
      </View>
    );
  }

  const hasAnyEvent = allEventsSorted.length > 0;

  return (
    <>
      {screenHeader}
      <Screen
        background="grouped"
        scroll
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        {!hasAnyEvent ? (
          <View style={styles.empty}>
            <IconSymbol name="calendar" size={44} color={ios.tertiaryLabel} />
            <Text style={styles.emptyTitle}>아직 일정이 없어요</Text>
            <Text style={styles.emptySub}>초대장을 만들거나 참여하면 여기에 표시돼요</Text>
          </View>
        ) : (
          <>
            <MonthCalendar
              year={year}
              month={month}
              selectedKey={listMode === 'date' ? selectedKey : null}
              todayKey={todayKey}
              markedKeys={markedKeys}
              onDayPress={handleDayPress}
              onPrev={prevMonth}
              onNext={nextMonth}
              onToday={goToday}
            />
            <ListSection
              header={listMode === 'date' && selectedKey ? formatDayHeader(selectedKey) : '전체 모임'}>
              {listEvents.length === 0 ? (
                <EmptyRow
                  text={listMode === 'date' ? '이 날 일정이 없어요' : '표시할 모임이 없어요'}
                />
              ) : (
                listEvents.map((ev) => <MeetingRow key={ev.id} invitation={ev} />)
              )}
            </ListSection>
          </>
        )}
      </Screen>
    </>
  );
}

// ── 월 달력 ───────────────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  selectedKey,
  todayKey,
  markedKeys,
  onDayPress,
  onPrev,
  onNext,
  onToday,
}: {
  year: number;
  month: number;
  selectedKey: string | null;
  todayKey: string;
  markedKeys: Set<string>;
  onDayPress: (key: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  const cells = useMemo(() => {
    const blanks = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const arr: (number | null)[] = [
      ...Array.from({ length: blanks }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (arr.length % 7 !== 0) arr.push(null);
    return arr;
  }, [year, month]);

  return (
    <View style={styles.calendarCard}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>{`${year}년 ${month}월`}</Text>
        <View style={styles.calendarNav}>
          <Pressable onPress={onToday} hitSlop={8}>
            <Text style={styles.todayButton}>오늘</Text>
          </Pressable>
          <Pressable onPress={onPrev} hitSlop={8}>
            <IconSymbol name="chevron.left" size={17} color={ios.tint} weight="semibold" />
          </Pressable>
          <Pressable onPress={onNext} hitSlop={8}>
            <IconSymbol name="chevron.right" size={17} color={ios.tint} weight="semibold" />
          </Pressable>
        </View>
      </View>

      <View style={styles.calendarGrid}>
        {DAY_LABELS.map((label) => (
          <View key={label} style={styles.dayCell}>
            <Text style={styles.weekdayLabel}>{label}</Text>
          </View>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <View key={`blank-${i}`} style={styles.dayCell} />;
          const key = toKey(year, month, day);
          const isSelected = key === selectedKey;
          const isToday = key === todayKey;
          return (
            <Pressable key={key} style={styles.dayCell} onPress={() => onDayPress(key)}>
              <View style={[styles.dayCircle, isSelected && styles.dayCircleSelected]}>
                <Text
                  style={[
                    styles.dayText,
                    isToday && !isSelected && styles.dayTextToday,
                    isSelected && styles.dayTextSelected,
                  ]}>
                  {day}
                </Text>
              </View>
              <View style={[styles.dayDot, markedKeys.has(key) && styles.dayDotOn]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ── 리스트 행 ─────────────────────────────────────────────────────────────────

const RSVP_BADGE: Record<string, { label: string; color: (typeof ios)[keyof typeof ios] }> = {
  attending: { label: '참여', color: ios.systemGreen },
  undecided: { label: '미정', color: ios.systemOrange },
  absent: { label: '불참', color: ios.systemRed },
};

function Badge({ label, color }: { label: string; color: (typeof ios)[keyof typeof ios] }) {
  return (
    <View style={styles.badge}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

function MeetingRow({
  invitation,
  isLast = false,
}: {
  invitation: Invitation;
  isLast?: boolean;
}) {
  const router = useRouter();
  const location =
    invitation.eventLocation?.placeName || invitation.eventLocation?.address || '미정';
  const rsvpBadge =
    invitation.myRole !== 'HOST' && invitation.myRsvpStatus
      ? RSVP_BADGE[invitation.myRsvpStatus]
      : null;

  return (
    <View>
      <Pressable
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
        onPress={() => {
          haptics.selection();
          router.push(`/invitations/${invitation.id}`);
        }}>
        <View style={styles.rowText}>
          <View style={styles.rowTitleLine}>
            <Text style={styles.rowTitle} numberOfLines={1}>
              {invitation.title}
            </Text>
            {invitation.myRole === 'HOST' ? <Badge label="호스트" color={ios.tint} /> : null}
            {rsvpBadge ? <Badge label={rsvpBadge.label} color={rsvpBadge.color} /> : null}
          </View>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {formatEventDate(invitation.eventStartAt)}
          </Text>
          <Text style={styles.rowMeta} numberOfLines={1}>
            {location}
          </Text>
        </View>
        <IconSymbol name="chevron.right" size={14} color={ios.tertiaryLabel} weight="semibold" />
      </Pressable>
      {!isLast ? <View style={styles.separator} /> : null}
    </View>
  );
}

function EmptyRow({ text }: { text: string; isLast?: boolean }) {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyRowText}>{text}</Text>
    </View>
  );
}

// ── 스타일 ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: iosMetrics.spacing[3],
    padding: iosMetrics.spacing[6],
    backgroundColor: ios.systemGroupedBackground,
  },
  errorTitle: { ...iosType.headline, color: ios.label },
  errorBody: { ...iosType.subhead, color: ios.secondaryLabel, textAlign: 'center' },

  empty: {
    alignItems: 'center',
    paddingVertical: iosMetrics.spacing[16],
    gap: iosMetrics.spacing[2],
  },
  emptyTitle: { ...iosType.headline, color: ios.label, marginTop: iosMetrics.spacing[2] },
  emptySub: { ...iosType.footnote, color: ios.secondaryLabel },

  calendarCard: {
    marginTop: iosMetrics.spacing[4],
    marginHorizontal: iosMetrics.groupedInset,
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    paddingHorizontal: iosMetrics.spacing[3],
    paddingVertical: iosMetrics.spacing[3],
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosMetrics.spacing[1],
    marginBottom: iosMetrics.spacing[2],
  },
  calendarTitle: { ...iosType.headline, color: ios.label },
  calendarNav: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[5] },
  todayButton: { ...iosType.subhead, color: ios.tint },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  weekdayLabel: { ...iosType.caption1, color: ios.secondaryLabel },
  dayCircle: {
    width: 32,
    height: 32,
    borderRadius: iosMetrics.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleSelected: { backgroundColor: ios.tint },
  dayText: { ...iosType.callout, color: ios.label },
  dayTextToday: { color: ios.tint, fontWeight: '600' },
  // 틴트 원 위 글자 — 다크모드에서도 흰색 유지 (theme hex fallback)
  dayTextSelected: { color: iosHex.light.systemBackground, fontWeight: '600' },
  dayDot: { width: 5, height: 5, borderRadius: iosMetrics.radius.full },
  dayDotOn: { backgroundColor: ios.tint },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: iosMetrics.spacing[3],
    minHeight: iosMetrics.rowMinHeight,
    paddingVertical: iosMetrics.spacing[3],
    paddingHorizontal: iosMetrics.spacing[4],
  },
  rowPressed: { backgroundColor: ios.systemFill },
  rowText: { flex: 1, gap: 2 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: iosMetrics.spacing[2] },
  rowTitle: { ...iosType.body, color: ios.label, flexShrink: 1 },
  rowMeta: { ...iosType.footnote, color: ios.secondaryLabel },
  badge: {
    paddingHorizontal: iosMetrics.spacing[2],
    paddingVertical: 2,
    borderRadius: iosMetrics.radius.full,
    backgroundColor: ios.tertiarySystemFill,
  },
  badgeText: { ...iosType.caption1, fontWeight: '600' },
  emptyRow: {
    alignItems: 'center',
    paddingVertical: iosMetrics.spacing[6],
    paddingHorizontal: iosMetrics.spacing[4],
  },
  emptyRowText: { ...iosType.subhead, color: ios.tertiaryLabel },
  separator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: iosMetrics.spacing[4],
  },
});
