// 초대장 만들기 공유 상수 — 컨테이너에서 분리

export const DEFAULT_COVER_KEY = "defaults/cover.jpg";

/* ---------- 배경: 단색 ---------- */
export const DESIGN_BG_SOLIDS = [
  { cls: "bg-pink-200", hex: "#FBCFE8" },
  { cls: "bg-yellow-200", hex: "#FEF08A" },
  { cls: "bg-blue-200", hex: "#BFDBFE" },
  { cls: "bg-green-200", hex: "#BBF7D0" },
  { cls: "bg-purple-200", hex: "#E9D5FF" },
  { cls: "bg-orange-200", hex: "#FED7AA" },
  { cls: "bg-red-200", hex: "#FECACA" },
  { cls: "bg-teal-200", hex: "#99F6E4" },
  { cls: "bg-indigo-200", hex: "#C7D2FE" },
  { cls: "bg-white", hex: "#FFFFFF" },
] as const;

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
] as const;

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
