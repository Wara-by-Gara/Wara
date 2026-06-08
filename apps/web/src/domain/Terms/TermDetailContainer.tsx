'use client';

import { useRouter } from 'next/navigation';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { TextContentSkeleton } from '@/components/organisms/Skeleton';
import { useTerms } from '@/hooks/useTerms';
import { TermContent } from './TermContent';

export type TermDetailType = 'service' | 'privacy' | 'location';

const TITLES: Record<TermDetailType, string> = {
  service: '이용약관',
  privacy: '개인정보처리방침',
  location: '위치기반서비스 이용약관',
};

interface TermDetailContainerProps {
  termType: TermDetailType;
}

export function TermDetailContainer({ termType }: TermDetailContainerProps) {
  const router = useRouter();
  const { data: terms, isLoading, isError, refetch } = useTerms();
  const term = terms?.find((t) => t.termType === termType && t.isActive);

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title={TITLES[termType]} onBack={() => router.back()} />
      <main className="min-h-0 flex-1 overflow-y-auto px-page py-6 text-[13px] leading-relaxed text-text-secondary">
        {isLoading ? (
          <TextContentSkeleton />
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-10">
            <p className="text-text-tertiary">약관을 불러올 수 없어요</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-xs underline text-text-secondary"
            >
              다시 시도
            </button>
          </div>
        ) : !term ? (
          <p className="text-center text-text-tertiary py-10">
            등록된 약관이 없어요
          </p>
        ) : (
          <article className="leading-relaxed">
            <TermContent content={term.content} variant="detail" />
          </article>
        )}
      </main>
    </div>
  );
}
