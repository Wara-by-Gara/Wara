import type { IconName } from "@wara/ui";

export interface BadgeDef {
  key: string;
  label: string;
  description: string;
  icon: IconName;
  /** 획득 임계값 */
  threshold: number;
  metric: "hosted" | "participated" | "likes";
}

/** 업적 배지 정의 — 사용자 집계(stats)에서 도출 */
export const BADGE_DEFS: BadgeDef[] = [
  { key: "first_host", label: "첫 호스트", description: "첫 모임을 열었어요", icon: "party-popper", threshold: 1, metric: "hosted" },
  { key: "host_5", label: "모임 마스터", description: "모임 5회 개최", icon: "crown", threshold: 5, metric: "hosted" },
  { key: "host_10", label: "모임의 달인", description: "모임 10회 개최", icon: "sparkles", threshold: 10, metric: "hosted" },
  { key: "first_join", label: "첫 참여", description: "첫 모임에 참여했어요", icon: "user-check", threshold: 1, metric: "participated" },
  { key: "join_10", label: "단골 참석러", description: "모임 10회 참여", icon: "users", threshold: 10, metric: "participated" },
  { key: "likes_50", label: "인기쟁이", description: "좋아요 50개 달성", icon: "heart", threshold: 50, metric: "likes" },
];

export interface BadgeStats {
  hosted: number;
  participated: number;
  likes: number;
}

export interface ResolvedBadge extends BadgeDef {
  earned: boolean;
  current: number;
}

export function resolveBadges(stats: BadgeStats): ResolvedBadge[] {
  return BADGE_DEFS.map((def) => {
    const current = stats[def.metric];
    return { ...def, current, earned: current >= def.threshold };
  });
}
