// 초대장 만들기 공유 상수 — 컨테이너에서 분리

export const DEFAULT_COVER_KEY = "defaults/cover.jpg";

/* ---------- 배경: 테마 (CSS 근사, globals.css의 .bg-invite-* 와 1:1) ---------- */
export const DESIGN_BG_THEMES = [
  { id: "minimal", label: "미니멀", cls: "bg-invite-minimal" },
  { id: "pastel", label: "파스텔", cls: "bg-invite-pastel" },
  { id: "sky", label: "하늘·구름", cls: "bg-invite-sky" },
  { id: "glass", label: "글래스", cls: "bg-invite-glass" },
  { id: "y2k", label: "Y2K", cls: "bg-invite-y2k" },
  { id: "flower", label: "플라워", cls: "bg-invite-flower" },
  { id: "film", label: "필름", cls: "bg-invite-film" },
  { id: "aurora", label: "오로라", cls: "bg-invite-aurora" },
  { id: "checkdot", label: "도트", cls: "bg-invite-checkdot" },
  { id: "starry", label: "밤하늘", cls: "bg-invite-starry" },
  { id: "dreamy", label: "몽환", cls: "bg-invite-dreamy" },
  { id: "galaxy", label: "갤럭시", cls: "bg-invite-galaxy" },
  { id: "water", label: "워터", cls: "bg-invite-water" },
  { id: "hologram", label: "홀로그램", cls: "bg-invite-hologram" },
  { id: "lasershow", label: "레이저쇼", cls: "bg-invite-lasershow" },
] as const;

export type DesignBgColor =
  | (typeof DESIGN_BG_THEMES)[number]["cls"]
  | `bg-invite-grad-${string}`;

export const DEFAULT_BG_COLOR: DesignBgColor = DESIGN_BG_THEMES[1].cls;

/* ---------- 배경: 애니메이션 그라데이션 변형 ----------
 * 색쌍(c1/c2)을 추가하면 자동으로 배경 옵션·렌더에 반영된다.
 * 저장값은 `bg-invite-grad-<id>` 문자열 (DB/DTO 변경 불필요).
 * 색은 GradientScene에서 --c1/--c2 CSS 변수로 주입된다. */
export const GRADIENT_BG_VARIANTS = [
  { id: "sunset", label: "선셋", c1: "#ff7e5f", c2: "#feb47b" },
  { id: "ocean", label: "바다", c1: "#87ceeb", c2: "#0288d1" },
  { id: "lightning", label: "번개", c1: "#191c38", c2: "#23294e" },
  { id: "soccer", label: "축구", c1: "#2e8020", c2: "#1d5a12" },
] as const;

export type GradientVariant = (typeof GRADIENT_BG_VARIANTS)[number];

export const gradientCls = (id: string): `bg-invite-grad-${string}` =>
  `bg-invite-grad-${id}`;

/** 피커용 — 기존 DESIGN_BG_THEMES와 동일 형태({id,label,cls})에 색을 더한 목록 */
export const GRADIENT_BG_THEMES = GRADIENT_BG_VARIANTS.map((v) => ({
  id: v.id,
  label: v.label,
  cls: gradientCls(v.id),
  c1: v.c1,
  c2: v.c2,
}));

/** bgColor 문자열 → 그라데이션 변형 (아니면 undefined) */
export function getGradientVariant(bg?: string | null): GradientVariant | undefined {
  const prefix = "bg-invite-grad-";
  if (!bg?.startsWith(prefix)) return undefined;
  const id = bg.slice(prefix.length);
  return GRADIENT_BG_VARIANTS.find((v) => v.id === id);
}

/* ---------- 제목 폰트 (기본 Pretendard + docs/font.md 8종) ---------- */
export const DESIGN_FONTS = [
  { id: "pretendard", label: "프리텐다드", style: "font-pretendard" },
  { id: "elegant-serif", label: "우아한 셰리프", style: "font-elegant-serif" },
  { id: "jiptokki", label: "집토끼", style: "font-jiptokki" },
  { id: "partial-sans", label: "파셜산스", style: "font-partial-sans" },
  { id: "silla", label: "신라고딕", style: "font-silla" },
  { id: "highteen", label: "하이틴", style: "font-highteen" },
  { id: "dos", label: "도스필기", style: "font-dos" },
  { id: "moonhalo", label: "달무리", style: "font-moonhalo" },
] as const;

export type DesignFont = (typeof DESIGN_FONTS)[number]["id"];
export const DEFAULT_FONT: DesignFont = "pretendard";

export function fontStyle(id: string): string {
  return DESIGN_FONTS.find((f) => f.id === id)?.style ?? "font-pretendard";
}

/* ---------- 애니메이션 (생성·미리보기 전용) ---------- */
export const ANIMATIONS = [
  { id: "none", label: "없음", emoji: "🚫" },
  { id: "cherry", label: "벚꽃", emoji: "🌸" },
  { id: "cloud", label: "구름", emoji: "☁️" },
  { id: "star", label: "별빛", emoji: "✨" },
  { id: "baseball", label: "야구공", emoji: "⚾️" },
  { id: "heart", label: "하트", emoji: "💕" },
  { id: "balloon", label: "풍선", emoji: "🎈" },
  { id: "plane", label: "종이비행기", emoji: "✈️" },
  { id: "bubble", label: "비눗방울", emoji: "🫧" },
  { id: "leaf", label: "낙엽", emoji: "🍂" },
  { id: "confetti", label: "컨페티", emoji: "🎉" },
  { id: "paper", label: "색종이", emoji: "🎊" },
  { id: "crystal", label: "크리스탈", emoji: "💎" },
  { id: "bokeh", label: "빛망울", emoji: "✨" },
  { id: "stream", label: "보라빛 라인", emoji: "🌌" },
  { id: "firework", label: "폭죽", emoji: "🎆" },
] as const;

export type AnimationId = (typeof ANIMATIONS)[number]["id"];

/* ---------- 참석(RSVP) 꾸미기 ---------- */
export type RsvpType = "attending" | "maybe" | "declined";

export interface RsvpOption {
  emoji: string;
  label: string;
}

export const DEFAULT_RSVP: Record<RsvpType, RsvpOption> = {
  attending: { emoji: "🎉", label: "참석" },
  maybe: { emoji: "🤔", label: "미정" },
  declined: { emoji: "😭", label: "불참" },
};

export const RSVP_DEFAULT_LABELS: Record<RsvpType, string> = {
  attending: "참석",
  maybe: "미정",
  declined: "불참",
};

export const RSVP_PACKS: {
  id: string;
  name: string;
  attending: string;
  maybe: string;
  declined: string;
}[] = [
  { id: "default", name: "기본", attending: "🎉", maybe: "🤔", declined: "😭" },
  { id: "heart", name: "하트", attending: "❤️", maybe: "❤️‍🩹", declined: "💔" },
  { id: "bloom", name: "꽃", attending: "💐", maybe: "🌷", declined: "🥀" },
  { id: "flirty", name: "설레임", attending: "😘", maybe: "👄", declined: "🤐" },
  { id: "weather", name: "날씨", attending: "☀️", maybe: "⛅", declined: "🌧️" },
  { id: "hands", name: "손짓", attending: "👍", maybe: "🤷", declined: "👎" },
  { id: "face", name: "표정", attending: "😊", maybe: "😶", declined: "😞" },
];
