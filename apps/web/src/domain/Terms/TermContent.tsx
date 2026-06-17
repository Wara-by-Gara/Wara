'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

type Variant = 'detail' | 'compact';

interface TermContentProps {
  content: string;
  variant?: Variant;
}

// 약관 본문(.md) 렌더링. detail = 단독 페이지, compact = agree 펼침 영역.
export function TermContent({ content, variant = 'detail' }: TermContentProps) {
  const styles =
    variant === 'compact'
      ? {
          h1: 'text-[12px] font-bold text-text mt-1 mb-1.5',
          h2: 'text-[11.5px] font-semibold text-text mt-2.5 mb-1',
          p: 'mb-1.5',
          ul: 'list-disc pl-4 mb-1.5 space-y-0.5',
          ol: 'list-decimal pl-4 mb-1.5 space-y-0.5',
          blockquote:
            'border-l-2 border-border pl-2 text-text-disabled italic mb-1.5',
        }
      : {
          h1: 'text-base font-bold text-text mt-2 mb-3',
          h2: 'text-sm font-semibold text-text mt-5 mb-2',
          p: 'mb-3',
          ul: 'list-disc pl-5 mb-3 space-y-1',
          ol: 'list-decimal pl-5 mb-3 space-y-1',
          blockquote:
            'border-l-2 border-border pl-3 text-text-disabled italic mb-3',
        };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkBreaks]}
      components={{
        h1: ({ children }) => <h1 className={styles.h1}>{children}</h1>,
        h2: ({ children }) => <h2 className={styles.h2}>{children}</h2>,
        p: ({ children }) => <p className={styles.p}>{children}</p>,
        ul: ({ children }) => <ul className={styles.ul}>{children}</ul>,
        ol: ({ children }) => <ol className={styles.ol}>{children}</ol>,
        blockquote: ({ children }) => (
          <blockquote className={styles.blockquote}>{children}</blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
