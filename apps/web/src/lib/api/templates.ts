import { apiGet } from "./client";

export interface Template {
  id: string;
  name: string;
  previewImageKey: string;
  theme: string;
  font: string;
  effect: string | null;
  /** 생성 폼 프리필용 — 배경 cls(`bg-invite-*`)·애니메이션 id */
  bgColor: string | null;
  animation: string | null;
  isActive: boolean;
}

export function getTemplates(): Promise<Template[]> {
  return apiGet<Template[]>("/invitation/templates");
}
