/**
 * 초대장 템플릿 엔진 — 데이터 기반 4레이어(Background/Motion/Overlay/Content).
 * 템플릿 추가 = 데이터(메타) 1개 + registry 등록. 렌더러는 수정하지 않는다.
 * 새 표현이 필요하면 해당 preset 맵에 항목을 추가한다.
 */
import type { BackgroundPresetKey, BackgroundParams } from "./presets/backgroundPresets";
import type { MotionPresetKey, MotionParams } from "./presets/motionPresets";
import type { OverlayPresetKey, OverlayParams } from "./presets/overlayPresets";
import type { LayoutPresetKey } from "./presets/layoutPresets";
import type { TypographyPresetKey } from "./presets/typographyPresets";
import type { FontPresetKey } from "./presets/fontPresets";

export type InviteCategory =
  | "birthday"
  | "party"
  | "wedding"
  | "travel"
  | "casual"
  | "minimal"
  | "retro"
  | "seasonal";

/** 템플릿 색 팔레트 (전역 UI 토큰과 분리된 초대장 전용 색) */
export interface InvitePalette {
  /** 베이스 배경색 */
  base: string;
  /** 주 텍스트 색 */
  ink: string;
  /** 보조 텍스트 색 */
  inkMuted: string;
  /** 포인트 색 */
  accent: string;
  /** 배경/모션 효과에 쓰는 색 배열 */
  swatches: string[];
}

/** 초대장에 실제로 들어가는 내용 (템플릿과 분리) */
export interface InviteContent {
  title: string;
  hostName?: string;
  dateText?: string;
  locationText?: string;
  message?: string;
}

export interface BackgroundSpec {
  preset: BackgroundPresetKey;
  params?: BackgroundParams;
}
export interface MotionSpec {
  preset: MotionPresetKey;
  params?: MotionParams;
}
export interface OverlaySpec {
  preset: OverlayPresetKey;
  params?: OverlayParams;
}
export interface LayoutSpec {
  preset: LayoutPresetKey;
}
export interface TypographySpec {
  preset: TypographyPresetKey;
}

/**
 * 데이터 기반 템플릿 정의.
 * 초대장 커스터마이즈 3축(Partiful): **background(Theme) × font(Font) × motion(Effect)** 독립.
 */
export interface InviteTemplate {
  id: string;
  name: string;
  category: InviteCategory;
  palette: InvitePalette;
  /** Theme 축 */
  background: BackgroundSpec;
  /** Font 축 — 제목 글꼴 (생략 시 classic) */
  font?: FontPresetKey;
  /** Effect 축 — 모션(생략/null = 정적) */
  motion?: MotionSpec | null;
  overlay?: OverlaySpec | null;
  layout: LayoutSpec;
  typography: TypographySpec;
}
