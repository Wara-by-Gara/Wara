import type { ReactNode } from "react";

/** "@핸들" 토큰을 핑크 강조로 렌더 (댓글·답글 공용). */
export function renderMentions(content: string, isDarkBg = false): ReactNode {
  const parts = content.split(/(@\S+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span
        key={i}
        className={
          isDarkBg
            ? "mention-highlight rounded bg-pink-500/20 px-0.5 font-medium text-pink-300"
            : "mention-highlight rounded bg-pink-500/10 px-0.5 font-medium text-pink-500"
        }
      >
        {part}
      </span>
    ) : (
      part
    ),
  );
}
