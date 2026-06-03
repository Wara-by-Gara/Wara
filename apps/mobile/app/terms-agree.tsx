import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  agreeTerms,
  fetchMyAgreements,
  fetchTerms,
  termsKeys,
  type ServiceTerm,
  type TermAgreement,
} from '@/api/terms';
import { WaraApiError } from '@/api';
import { border, colors, layout, radius, spacing, typography } from '@/constants/tokens';

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
    <View style={styles.termCard}>
      <View style={styles.termRow}>
        <TouchableOpacity
          style={styles.termCheckArea}
          onPress={() => onChange(!checked)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
            {checked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text
            style={[
              styles.termBadge,
              term.isRequired ? styles.badgeRequired : styles.badgeOptional,
            ]}
          >
            {term.isRequired ? '[필수]' : '[선택]'}
          </Text>
          <Text style={styles.termTitle} numberOfLines={2}>
            {term.title}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setExpanded((v) => !v)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.expandToggle}>{expanded ? '닫기' : '보기'}</Text>
        </TouchableOpacity>
      </View>
      {expanded && (
        <View style={styles.termContent}>
          <ScrollView nestedScrollEnabled style={styles.termContentScroll}>
            <Text style={styles.termContentText}>{term.content}</Text>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

export default function TermsAgreeScreen() {
  const queryClient = useQueryClient();

  const { data: terms, isLoading: termsLoading, isError: isTermsError } = useQuery({
    queryKey: termsKeys.list(),
    queryFn: ({ signal }) => fetchTerms(signal),
  });
  const {
    data: myAgreements,
    isLoading: agreementsLoading,
    isError: isAgreementsError,
  } = useQuery({
    queryKey: termsKeys.myAgreements(),
    queryFn: ({ signal }) => fetchMyAgreements(signal),
    retry: false,
  });

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState('');

  const pendingTerms = useMemo(
    () =>
      terms?.filter((t) => !myAgreements?.some((a) => a.termId === t.id)) ?? [],
    [terms, myAgreements],
  );

  const pendingRequired = useMemo(
    () => pendingTerms.filter((t) => t.isRequired),
    [pendingTerms],
  );

  useEffect(() => {
    setChecked((prev) => {
      const next: Record<string, boolean> = {};
      for (const t of pendingTerms) {
        next[t.id] = prev[t.id] ?? false;
      }
      return next;
    });
  }, [pendingTerms]);

  // 미동의 필수 약관이 없으면 탭으로 자동 이동 (terms 로드 실패 시엔 이동하지 않음)
  useEffect(() => {
    if (
      !termsLoading &&
      !agreementsLoading &&
      terms !== undefined &&
      myAgreements !== undefined &&
      pendingRequired.length === 0
    ) {
      router.replace('/(tabs)');
    }
  }, [termsLoading, agreementsLoading, terms, myAgreements, pendingRequired.length]);

  const { mutate: doAgree, isPending } = useMutation({
    mutationFn: (termIds: string[]) => agreeTerms(termIds),
    onSuccess: (newAgreements) => {
      // 즉시 캐시 갱신 → guard가 네비게이션 직후 stale 데이터를 보는 것 방지
      queryClient.setQueryData<TermAgreement[]>(
        termsKeys.myAgreements(),
        (old) => [...(old ?? []), ...newAgreements],
      );
      // 백그라운드 재검증 (fire-and-forget)
      void queryClient.invalidateQueries({ queryKey: termsKeys.myAgreements() });
      router.replace('/(tabs)');
    },
    onError: (error) => {
      // 이미 동의된 경우(네트워크 재시도 등) → 성공과 동일 처리
      if (error instanceof WaraApiError && error.code === 'TERM_AGREEMENT_ALREADY_EXISTS') {
        router.replace('/(tabs)');
        return;
      }
      setSubmitError('오류가 발생했습니다. 다시 시도해주세요.');
    },
  });

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
    doAgree(termIds);
  }

  if (termsLoading || agreementsLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isTermsError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>
            약관을 불러오지 못했습니다.{'\n'}앱을 다시 실행해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>서비스 이용약관 동의</Text>
        <Text style={styles.subtitle}>
          서비스 이용을 위해 아래 약관에 동의해주세요.
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.allAgreeRow}
          onPress={() => handleToggleAll(!allChecked)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, allChecked && styles.checkboxChecked]}>
            {allChecked && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.allAgreeText}>전체 동의</Text>
        </TouchableOpacity>

        <View style={styles.termsList}>
          {pendingTerms.map((term) => (
            <TermItem
              key={term.id}
              term={term}
              checked={!!checked[term.id]}
              onChange={(v) =>
                setChecked((prev) => ({ ...prev, [term.id]: v }))
              }
            />
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {isAgreementsError && (
          <Text style={styles.errorText}>
            로그인이 필요해요. 로그인 후 다시 진행해 주세요.
          </Text>
        )}
        {submitError !== '' && (
          <Text style={styles.errorText}>{submitError}</Text>
        )}
        {isAgreementsError ? (
          <TouchableOpacity
            style={styles.agreeButton}
            onPress={() => router.replace('/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.agreeButtonText}>로그인하러 가기</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.agreeButton,
              (!requiredAllChecked || isPending) && styles.agreeButtonDisabled,
            ]}
            onPress={handleAgree}
            disabled={!requiredAllChecked || isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.agreeButtonText}>
              {isPending ? '처리 중...' : '동의하고 시작하기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.textTertiary,
  },
  header: {
    paddingHorizontal: layout.pagePadding,
    paddingTop: spacing[6],
    paddingBottom: spacing[4],
  },
  title: {
    ...typography.heading3,
    color: colors.textPrimary,
    marginBottom: spacing[1],
  },
  subtitle: {
    ...typography.body3,
    color: colors.textSecondary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: layout.pagePadding,
    paddingBottom: spacing[4],
  },
  allAgreeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    padding: spacing[4],
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundSoft,
    marginBottom: spacing[3],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: radius.xs,
    borderWidth: border.thin,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkmark: {
    ...typography.caption2,
    color: colors.textInverse,
    fontWeight: '700',
  },
  allAgreeText: {
    ...typography.body2,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  termsList: {
    gap: spacing[2],
  },
  termCard: {
    borderWidth: border.thin,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  termRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    gap: spacing[2],
  },
  termCheckArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  termBadge: {
    ...typography.caption2,
    fontWeight: '600',
  },
  badgeRequired: {
    color: colors.danger,
  },
  badgeOptional: {
    color: colors.textTertiary,
  },
  termTitle: {
    flex: 1,
    ...typography.body3,
    color: colors.textPrimary,
  },
  expandToggle: {
    ...typography.caption1,
    color: colors.textTertiary,
  },
  termContent: {
    borderTopWidth: border.thin,
    borderTopColor: colors.border,
    backgroundColor: colors.backgroundSoft,
    maxHeight: 192,
  },
  termContentScroll: {
    padding: spacing[4],
  },
  termContentText: {
    ...typography.caption1,
    color: colors.textSecondary,
  },
  footer: {
    paddingHorizontal: layout.pagePadding,
    paddingBottom: spacing[4],
    paddingTop: spacing[3],
    gap: spacing[2],
  },
  errorText: {
    ...typography.caption1,
    color: colors.danger,
    textAlign: 'center',
  },
  agreeButton: {
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreeButtonDisabled: {
    opacity: 0.5,
  },
  agreeButtonText: {
    ...typography.buttonLarge,
    color: colors.textInverse,
  },
});
