import type { Decorator } from "@storybook/react";
import React from "react";

/** 디자인 시스템 스토리 공용 래퍼 — 테마 배경/텍스트/폰트 적용 + 패딩 */
export const dsWrap: Decorator = (Story) => (
  <div
    className="bg-background text-text"
    style={{
      minHeight: "100%",
      width: "100%",
      padding: 24,
      fontFamily: "var(--font-sans)",
    }}
  >
    <Story />
  </div>
);

/** 섹션 제목 헬퍼 */
export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
      <h3 className="type-bodySmall" style={{ color: "var(--text-muted)", fontWeight: 600 }}>
        {title}
      </h3>
      {children}
    </section>
  );
}
