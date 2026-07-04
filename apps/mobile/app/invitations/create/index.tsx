/**
 * 초대장 생성 1단계 — 템플릿 선택.
 * 진입 시 플로우 상태를 리셋하고, 템플릿 카드 2열 그리드에서 하나를 고른다.
 * (템플릿 미리보기 이미지 공개 URL 규칙이 확실치 않아 이름/테마 카드로 표시.)
 */

import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, haptics } from '@/components/ios';
import { useTemplates } from '@/hooks/queries/templates';
import { useCreateInvitationFlow } from '@/hooks/useCreateInvitationFlow';
import type { Template } from '@/api';
import { ios, iosMetrics, iosType } from '@/theme';

export default function TemplateStep() {
  const router = useRouter();
  const [state, patch, reset] = useCreateInvitationFlow();

  // 앱 재마운트 대비 — 플로우 진입 시 상태 초기화.
  useEffect(() => {
    reset();
  }, [reset]);

  const { data: templates, isPending, error } = useTemplates();

  function selectTemplate(template: Template) {
    haptics.selection();
    patch({
      templateId: template.id,
      bgColor: template.bgColor ?? undefined,
      font: template.font,
      animation: template.animation ?? undefined,
    });
    router.push('/invitations/create/basics');
  }

  function startBlank() {
    patch({ templateId: undefined });
    router.push('/invitations/create/basics');
  }

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.content}>
      <Text style={styles.intro}>마음에 드는 템플릿을 골라 시작하세요. 나중에 디자인을 바꿀 수 있어요.</Text>

      {isPending ? (
        <ActivityIndicator style={styles.loader} color={ios.tint} />
      ) : error ? (
        <Text style={styles.errorText}>템플릿을 불러오지 못했어요.</Text>
      ) : (
        <View style={styles.grid}>
          {(templates ?? [])
            .filter((t) => t.isActive)
            .map((template) => {
              const selected = state.templateId === template.id;
              return (
                <Pressable
                  key={template.id}
                  onPress={() => selectTemplate(template)}
                  style={({ pressed }) => [
                    styles.card,
                    selected && styles.cardSelected,
                    pressed && styles.cardPressed,
                  ]}>
                  <View style={styles.cardPreview}>
                    <Text style={styles.cardPreviewText}>{template.theme}</Text>
                  </View>
                  <Text style={styles.cardName} numberOfLines={1}>
                    {template.name}
                  </Text>
                </Pressable>
              );
            })}
        </View>
      )}

      <Button title="템플릿 없이 시작" variant="tinted" onPress={startBlank} style={styles.blankButton} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
  },
  intro: {
    ...iosType.subhead,
    color: ios.secondaryLabel,
    marginBottom: iosMetrics.spacing[5],
  },
  loader: {
    marginTop: iosMetrics.spacing[10],
  },
  errorText: {
    ...iosType.body,
    color: ios.systemRed,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[10],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: iosMetrics.spacing[4],
  },
  card: {
    width: '48%',
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    padding: iosMetrics.spacing[3],
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardSelected: {
    borderColor: ios.tint,
  },
  cardPressed: {
    opacity: 0.6,
  },
  cardPreview: {
    aspectRatio: 3 / 4,
    borderRadius: iosMetrics.radius.md,
    backgroundColor: ios.tertiarySystemFill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: iosMetrics.spacing[2],
  },
  cardPreviewText: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
  },
  cardName: {
    ...iosType.subhead,
    color: ios.label,
    fontWeight: '600',
  },
  blankButton: {
    marginTop: iosMetrics.spacing[8],
  },
});
