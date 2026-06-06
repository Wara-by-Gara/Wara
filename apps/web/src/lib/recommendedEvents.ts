import { formatInvitationEventDate } from "@/utils/formatInvitationEventDate";

export type EventCategory =
  | "all"
  | "tech"
  | "fitness"
  | "food"
  | "art"
  | "culture"
  | "health";

export const EVENT_CATEGORY_LABELS: Record<EventCategory, string> = {
  all: "전체",
  tech: "테크",
  fitness: "피트니스",
  food: "푸드",
  art: "예술",
  culture: "문화",
  health: "건강",
};

export const EVENT_CATEGORIES: EventCategory[] = [
  "all",
  "tech",
  "fitness",
  "food",
  "art",
  "culture",
  "health",
];

const INVITATION_CARD_SUBJECT_KEYS = new Set(
  EVENT_CATEGORIES.filter((c): c is Exclude<EventCategory, "all"> => c !== "all"),
);

const INVITATION_CARD_SUBJECT_LABELS = new Set(
  Object.values(EVENT_CATEGORY_LABELS).filter((label) => label !== "전체"),
);

/** 초대장 카드 주제 라벨 — 추천 이벤트 카테고리만 표시 (bloom·minimal 등 디자인 테마 제외) */
export function resolveInvitationCardSubject(
  theme?: string | null,
): string | undefined {
  if (!theme?.trim()) return undefined;

  const trimmed = theme.trim();
  const key = trimmed.toLowerCase() as EventCategory;
  if (INVITATION_CARD_SUBJECT_KEYS.has(key as Exclude<EventCategory, "all">)) {
    return EVENT_CATEGORY_LABELS[key];
  }
  if (INVITATION_CARD_SUBJECT_LABELS.has(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export interface RecommendedEvent {
  id: string;
  title: string;
  category: Exclude<EventCategory, "all">;
  date: string;
  location: string;
  imageUrl: string;
}

/** API eventStartAt → "6월 3일(수), 오후 7시 30분" */
export function formatExploreEventDate(iso: string | null | undefined): string {
  return formatInvitationEventDate(iso, "일정 미정");
}

export function filterEventsByCategory(
  events: RecommendedEvent[],
  category: EventCategory,
): RecommendedEvent[] {
  if (category === "all") return events;
  return events.filter((e) => e.category === category);
}

export type ExploreCategory = Exclude<EventCategory, "all">;
