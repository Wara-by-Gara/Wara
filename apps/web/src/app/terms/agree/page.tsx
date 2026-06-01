'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAgreeTerms, useMyAgreements, useTerms } from '@/hooks/useTerms';
import { useAuthStore } from '@/stores/authStore';
import type { ServiceTerm } from '@/lib/api/terms';

function TermItem({
  term,
  checked,
  onChange,
}: {
  term: ServiceTerm;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <label className="flex items-center gap-3 px-4 py-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-4 h-4 accent-primary shrink-0"
        />
        <span className="flex-1 text-sm">
          <span
            className={`mr-1 text-xs font-medium ${
              term.isRequired ? 'text-danger' : 'text-text-tertiary'
            }`}
          >
            {term.isRequired ? '[필수]' : '[선택]'}
          </span>
          {term.title}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setExpanded((v) => !v);
          }}
          className="text-xs text-text-tertiary hover:text-text-secondary shrink-0"
        >
          {expanded ? '닫기' : '보기'}
        </button>
      </label>
      {expanded && (
        <div className="px-4 py-3 border-t border-border bg-background-soft text-xs text-text-secondary whitespace-pre-wrap max-h-48 overflow-y-auto">
          {term.content}
        </div>
      )}
    </div>
  );
}

function TermsAgreeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') ?? '/';

  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);

  const { data: terms, isLoading: termsLoading } = useTerms();
  const { data: myAgreements, isLoading: agreementsLoading } = useMyAgreements();
  const { mutate: doAgreeTerms, isPending } = useAgreeTerms();

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState('');

  const pendingTerms = useMemo(
    () => terms?.filter((t) => !myAgreements?.some((a) => a.termId === t.id)) ?? [],
    [terms, myAgreements],
  );
  const pendingRequired = useMemo(
    () => pendingTerms.filter((t) => t.isRequired),
    [pendingTerms],
  );

  // No required terms pending → proceed to destination
  useEffect(() => {
    if (
      !termsLoading &&
      !agreementsLoading &&
      myAgreements !== undefined &&
      pendingRequired.length === 0
    ) {
      router.replace(returnTo);
    }
  }, [termsLoading, agreementsLoading, myAgreements, pendingRequired.length, returnTo, router]);

  // Sync checked state when pending terms change
  useEffect(() => {
    setChecked((prev) => {
      const next: Record<string, boolean> = {};
      for (const t of pendingTerms) {
        next[t.id] = prev[t.id] ?? false;
      }
      return next;
    });
  }, [pendingTerms]);

  const allChecked =
    pendingTerms.length > 0 && pendingTerms.every((t) => checked[t.id]);
  const requiredAllChecked = pendingRequired.every((t) => checked[t.id]);

  function handleToggleAll(v: boolean) {
    setChecked(Object.fromEntries(pendingTerms.map((t) => [t.id, v])));
  }

  function handleAgree() {
    if (!requiredAllChecked) {
      setSubmitError('필수 약관에 모두 동의해주세요.');
      return;
    }
    setSubmitError('');
    const termIds = pendingTerms.filter((t) => checked[t.id]).map((t) => t.id);
    if (termIds.length === 0) {
      router.replace(returnTo);
      return;
    }
    doAgreeTerms(termIds, {
      onSuccess: () => router.replace(returnTo),
      onError: () => setSubmitError('오류가 발생했습니다. 다시 시도해주세요.'),
    });
  }

  if (termsLoading || agreementsLoading) {
    return <p className="text-center text-text-tertiary py-10">불러오는 중...</p>;
  }

  if (pendingRequired.length === 0) return null;

  return (
    <main className="max-w-lg mx-auto px-4 pt-8 pb-6 flex flex-col min-h-[100dvh]">
      <div className="flex-1">
        <h1 className="text-xl font-bold mb-1">서비스 이용약관 동의</h1>
        <p className="text-sm text-text-secondary mb-6">
          서비스 이용을 위해 아래 약관에 동의해주세요.
        </p>

        <label className="flex items-center gap-3 p-4 border border-border rounded-lg mb-3 cursor-pointer bg-background-soft">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={(e) => handleToggleAll(e.target.checked)}
            className="w-4 h-4 accent-primary"
          />
          <span className="text-sm font-medium">전체 동의</span>
        </label>

        <div className="space-y-2">
          {pendingTerms.map((term) => (
            <TermItem
              key={term.id}
              term={term}
              checked={!!checked[term.id]}
              onChange={(v) => setChecked((prev) => ({ ...prev, [term.id]: v }))}
            />
          ))}
        </div>
      </div>

      <div className="pt-4">
        {submitError && <p className="text-sm text-danger mb-3">{submitError}</p>}
        {!isLoggedIn && (
          <p className="text-sm text-text-secondary mb-3 text-center">로그인 후 동의할 수 있습니다.</p>
        )}
        <button
          type="button"
          onClick={handleAgree}
          disabled={!isLoggedIn || !requiredAllChecked || isPending}
          className="w-full py-3 bg-primary text-white text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-primary-hover transition-colors"
        >
          {isPending ? '처리 중...' : '동의하고 시작하기'}
        </button>
      </div>
    </main>
  );
}

export default function TermsAgreePage() {
  return (
    <Suspense fallback={<p className="text-center text-text-tertiary py-10">불러오는 중...</p>}>
      <TermsAgreeContent />
    </Suspense>
  );
}
