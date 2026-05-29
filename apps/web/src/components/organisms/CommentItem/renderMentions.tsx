import type { ReactNode } from 'react';

export function renderMentions(content: string): ReactNode {
  const parts = content.split(/(@\S+)/g);
  return parts.map((part, i) =>
    part.startsWith('@') ? (
      <span key={i} className="rounded bg-primary/10 px-0.5 font-medium text-primary">
        {part}
      </span>
    ) : (
      part
    ),
  );
}
