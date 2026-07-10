// 내 문의 목록 — 새 문의 작성(/support/inquiries/write)·상세(/support/inquiries/[id]) 진입.

import { useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button, ListRow, ListSection, Screen } from '@/components/ios';
import {
  INQUIRY_STATUS_LABEL,
  INQUIRY_TYPE_LABEL,
} from '@/constants/inquiries';
import { useMyInquiries } from '@/hooks/queries/inquiries';
import { ios, iosMetrics, iosType } from '@/theme';

export default function InquiriesScreen() {
  const router = useRouter();
  const { data, isLoading, isError } = useMyInquiries();
  const items = data?.items ?? [];

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.listContent}>
      <Button
        title="새 문의 작성"
        onPress={() => router.push('/support/inquiries/write')}
        style={styles.newButton}
      />

      {isLoading ? (
        <Text style={styles.note}>불러오는 중…</Text>
      ) : isError ? (
        <Text style={styles.note}>문의를 불러오지 못했어요.</Text>
      ) : items.length === 0 ? (
        <Text style={styles.note}>아직 남긴 문의가 없어요.</Text>
      ) : (
        <ListSection>
          {items.map((it) => (
            <ListRow
              key={it.id}
              title={it.title}
              subtitle={`${INQUIRY_TYPE_LABEL[it.inquiryType]} · ${INQUIRY_STATUS_LABEL[it.status]}`}
              accessory="chevron"
              onPress={() => router.push(`/support/inquiries/${it.id}`)}
            />
          ))}
        </ListSection>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
  },
  newButton: { marginTop: iosMetrics.spacing[4] },
  note: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[10],
  },
});
