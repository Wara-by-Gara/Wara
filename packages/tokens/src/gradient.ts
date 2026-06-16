/**
 * 그라데이션 토큰 — 브랜드 정체성의 핵심.
 * 레퍼런스(무지개 파스텔 메쉬: 핫핑크→오렌지→옐로우→민트→시안→라벤더)를 기준.
 * 화이트/글래스 베이스 위에 그라데이션을 포인트로 사용한다.
 *  - brand:   주 CTA·강조 (보라→핫핑크, 흰 텍스트 대비 확보)
 *  - vibrant: 화려한 무지개 메쉬 포인트 — 히어로·초대장 진입
 *  - app-bg:  은은한 무지개 메쉬 배경 (채도 낮춰 UI 가독성 유지)
 *  - glow:    버튼 바닥에 까는 얇은 수평 무지개 띠 (Partiful 버튼 언더글로우)
 */
import type { ThemeMode } from "./colors.ts";

export const gradient: Record<ThemeMode, Record<string, string>> = {
  light: {
    "gradient-brand": "linear-gradient(135deg, #7C5CFF 0%, #FF3DAE 100%)",
    "gradient-glow":
      "linear-gradient(90deg, #FF6FA3 0%, #FF3DAE 16%, #C77DFF 36%, #7C5CFF 52%, #5BC8F5 76%, #7DE2B8 100%)",
    "gradient-vibrant": [
      "radial-gradient(at 14% 12%, #FF3DAE 0%, transparent 50%)",
      "radial-gradient(at 88% 8%, #FFB14D 0%, transparent 46%)",
      "radial-gradient(at 97% 26%, #FFD93D 0%, transparent 36%)",
      "radial-gradient(at 12% 90%, #A78BFA 0%, transparent 50%)",
      "radial-gradient(at 50% 98%, #5BC8F5 0%, transparent 50%)",
      "radial-gradient(at 93% 92%, #7DE2B8 0%, transparent 50%)",
      "#F5EAF2",
    ].join(", "),
    "gradient-app-bg": [
      "radial-gradient(at 14% 10%, rgba(255,61,174,0.34) 0%, transparent 44%)",
      "radial-gradient(at 90% 8%, rgba(255,177,77,0.30) 0%, transparent 42%)",
      "radial-gradient(at 97% 26%, rgba(255,217,61,0.28) 0%, transparent 34%)",
      "radial-gradient(at 10% 92%, rgba(167,139,250,0.30) 0%, transparent 44%)",
      "radial-gradient(at 50% 99%, rgba(91,200,245,0.28) 0%, transparent 44%)",
      "radial-gradient(at 94% 92%, rgba(125,226,184,0.28) 0%, transparent 44%)",
      "#FFFFFF",
    ].join(", "),
  },
  dark: {
    "gradient-brand": "linear-gradient(135deg, #8B62FF 0%, #FF4D9E 100%)",
    "gradient-glow":
      "linear-gradient(90deg, #FF4D9E 0%, #D14FB0 18%, #8B62FF 40%, #6E4FD8 56%, #2F86C9 78%, #2FA98A 100%)",
    "gradient-vibrant": [
      "radial-gradient(at 14% 12%, #C2348A 0%, transparent 50%)",
      "radial-gradient(at 90% 10%, #C77A3A 0%, transparent 46%)",
      "radial-gradient(at 12% 90%, #6E4FD8 0%, transparent 50%)",
      "radial-gradient(at 52% 98%, #2F86C9 0%, transparent 50%)",
      "radial-gradient(at 93% 92%, #2FA98A 0%, transparent 50%)",
      "#16131F",
    ].join(", "),
    "gradient-app-bg": [
      "radial-gradient(at 16% 8%, rgba(255,61,174,0.20) 0%, transparent 46%)",
      "radial-gradient(at 88% 6%, rgba(255,177,77,0.14) 0%, transparent 44%)",
      "radial-gradient(at 12% 92%, rgba(139,98,255,0.20) 0%, transparent 46%)",
      "radial-gradient(at 90% 90%, rgba(91,200,245,0.14) 0%, transparent 46%)",
      "#0C0A12",
    ].join(", "),
  },
};
