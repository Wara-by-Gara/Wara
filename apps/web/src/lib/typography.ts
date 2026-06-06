import { cn } from "@/lib/cn";

/**
 * 홈·리스트 UI 타이포 위계 (globals.css @layer utilities)
 * @see globals.css — .type-* / .home-*
 */
export const typeScale = {
  sectionTitle: "type-section-title",
  sectionDesc: "type-section-desc",
  cardTitle: "type-card-title",
  cardEyebrow: "type-card-eyebrow",
  meta: "type-meta",
  metaMuted: "type-meta-muted",
  empty: "type-empty",
  templateName: "type-template-name",
} as const;

export const layoutRhythm = {
  pageSections: "home-page-sections",
  section: "home-section",
  cardText: "home-card-text",
  metaRow: "home-meta-row",
  listItemY: "home-list-item-y",
} as const;

export function metaRowClass(muted = false) {
  return cn(layoutRhythm.metaRow, muted ? typeScale.metaMuted : typeScale.meta);
}
