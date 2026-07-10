/**
 * 초대장 생성 3단계 — 디자인(배경색/폰트).
 * bgColor는 웹과 정합하는 배경 클래스 값(`bg-*`)을 저장하고, iOS 톤 스와치로 미리보기한다.
 * (초대장 콘텐츠 색상이라 hex 스와치는 허용 — CLAUDE.md 예외.)
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Screen, SegmentedControl, haptics } from '@/components/ios';
import { useCreateInvitationFlow } from '@/hooks/useCreateInvitationFlow';
import { ios, iosMetrics, iosType } from '@/theme';

/** 배경 프리셋 — value는 웹 배경 클래스, swatch는 iOS 톤 미리보기 hex. */
const BG_PRESETS: { label: string; value: string; swatch: string }[] = [
  { label: '화이트', value: 'bg-white', swatch: '#FFFFFF' },
  { label: '미니멀', value: 'bg-invite-minimal', swatch: '#F2F2F7' },
  { label: '파스텔', value: 'bg-invite-pastel', swatch: '#FCE7F1' },
  { label: '스카이', value: 'bg-invite-sky', swatch: '#D6ECFB' },
  { label: '오로라', value: 'bg-invite-aurora', swatch: '#E3D9FA' },
  { label: '플라워', value: 'bg-invite-flower', swatch: '#FBE4D6' },
];

/** 폰트 프리셋 — 라벨/저장값. 렌더러가 모르는 값이면 기본 폰트로 폴백. */
const FONT_LABELS = ['기본', '세리프', '라운드'];
const FONT_VALUES = ['default', 'serif', 'rounded'];

export default function DesignStep() {
  const router = useRouter();
  const [state, patch] = useCreateInvitationFlow();

  const fontIndex = Math.max(0, FONT_VALUES.indexOf(state.font ?? 'default'));

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.label}>배경색</Text>
        <View style={styles.swatchGrid}>
          {BG_PRESETS.map((preset) => {
            const selected = state.bgColor === preset.value;
            return (
              <Pressable
                key={preset.value}
                onPress={() => {
                  haptics.selection();
                  patch({ bgColor: preset.value });
                }}
                style={styles.swatchItem}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: preset.swatch },
                    selected && styles.swatchSelected,
                  ]}
                />
                <Text style={styles.swatchLabel} numberOfLines={1}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>폰트</Text>
        <SegmentedControl
          values={FONT_LABELS}
          selectedIndex={fontIndex}
          onChange={(index) => patch({ font: FONT_VALUES[index] })}
        />
      </View>

      <Button
        title="다음"
        onPress={() => router.push('/invitations/create/ai-cover')}
        style={styles.nextButton}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[8],
  },
  section: { gap: iosMetrics.spacing[3] },
  label: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginLeft: iosMetrics.spacing[1],
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: iosMetrics.spacing[4],
  },
  swatchItem: {
    alignItems: 'center',
    gap: iosMetrics.spacing[1],
    width: 64,
  },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: iosMetrics.radius.full,
    borderWidth: iosMetrics.hairline,
    borderColor: ios.separator,
  },
  swatchSelected: {
    borderWidth: 3,
    borderColor: ios.tint,
  },
  swatchLabel: {
    ...iosType.caption1,
    color: ios.secondaryLabel,
  },
  nextButton: {
    marginTop: iosMetrics.spacing[2],
  },
});
