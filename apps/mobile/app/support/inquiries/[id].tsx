// 문의 상세 — 문의 본문·답변 확인. pending 상태 문의만 수정 진입 가능.

import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Screen } from '@/components/ios';
import {
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPE_LABEL,
  inquiryErrorMessage,
  inquiryStatusColor,
} from '@/constants/inquiries';
import { useInquiry } from '@/hooks/queries/inquiries';
import { ios, iosMetrics, iosType } from '@/theme';

export default function InquiryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: inquiry, isLoading, isError, error } = useInquiry(id);

  if (isLoading) {
    return (
      <Screen background="grouped">
        <Text style={styles.note}>불러오는 중…</Text>
      </Screen>
    );
  }

  if (isError || !inquiry) {
    return (
      <Screen scroll background="grouped" contentContainerStyle={styles.detailContent}>
        <Text style={styles.note}>{inquiryErrorMessage(error)}</Text>
        <Button title="목록으로" variant="tinted" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.detailContent}>
      <View style={styles.detailHeader}>
        <Text style={styles.badge} numberOfLines={1}>
          {INQUIRY_TYPE_LABEL[inquiry.inquiryType]}
        </Text>
        <Text style={[styles.status, { color: inquiryStatusColor(inquiry.status) }]}>
          {INQUIRY_STATUS_LABEL[inquiry.status]}
        </Text>
      </View>

      <Text style={styles.detailTitle}>{inquiry.title}</Text>

      <View style={styles.detailCard}>
        <Text style={styles.detailBody}>{inquiry.content}</Text>
      </View>

      <Text style={styles.sectionLabel}>답변</Text>
      <View style={styles.detailCard}>
        <Text style={inquiry.answer ? styles.detailBody : styles.detailMuted}>
          {inquiry.answer ?? '아직 답변이 등록되지 않았어요.'}
        </Text>
      </View>

      {inquiry.status === 'pending' ? (
        <Button
          title="문의 수정"
          variant="tinted"
          onPress={() => router.push({ pathname: '/support/inquiries/write', params: { id: inquiry.id } })}
        />
      ) : null}
      <Button title="목록으로" variant="plain" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[10],
  },
  detailContent: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[3],
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: iosMetrics.spacing[4],
  },
  badge: { ...iosType.footnote, color: ios.secondaryLabel },
  status: { ...iosType.footnote, fontWeight: '600' },
  detailTitle: { ...iosType.title3, fontWeight: '600', color: ios.label },
  sectionLabel: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginTop: iosMetrics.spacing[2],
    marginLeft: iosMetrics.spacing[1],
  },
  detailCard: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.lg,
    padding: iosMetrics.spacing[4],
  },
  detailBody: { ...iosType.body, color: ios.label },
  detailMuted: { ...iosType.body, color: ios.tertiaryLabel },
});
