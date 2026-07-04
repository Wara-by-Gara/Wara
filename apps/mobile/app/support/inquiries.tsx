// 내 문의 화면 — 목록 / 작성·수정 폼 / 상세(답변 확인)를 한 화면에서 로컬 상태로 전환.
// pending 상태 문의만 수정 가능(수정 시 INQUIRY_NOT_EDITABLE 매핑).

import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { WaraApiError } from '@/api';
import type { Inquiry, InquiryStatus, InquiryType } from '@/api/inquiries';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button, ListRow, ListSection, Screen, haptics } from '@/components/ios';
import { useCreateInquiry, useInquiry, useMyInquiries, useUpdateInquiry } from '@/hooks/queries/inquiries';
import { ios, iosMetrics, iosType } from '@/theme';

// ── 라벨/색상 매핑 ────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<InquiryType, string> = {
  invitation: '초대장',
  photo: '사진',
  notification: '알림',
  mission: '미션',
  bug: '오류 신고',
  feature: '기능 제안',
  general: '일반 문의',
};

const TYPE_ORDER: InquiryType[] = [
  'general',
  'invitation',
  'photo',
  'notification',
  'mission',
  'bug',
  'feature',
];

const STATUS_LABEL: Record<InquiryStatus, string> = {
  pending: '접수됨',
  in_progress: '처리 중',
  resolved: '답변 완료',
};

const INQUIRY_ERROR: Record<string, string> = {
  INQUIRY_NOT_FOUND: '문의를 찾을 수 없어요.',
  INQUIRY_FORBIDDEN: '본인 문의만 접근할 수 있어요.',
  INQUIRY_NOT_EDITABLE: '답변이 시작된 문의는 수정할 수 없어요.',
  VALIDATION_ERROR: '입력값을 확인해주세요.',
};

function inquiryErrorMessage(err: unknown): string {
  if (err instanceof WaraApiError) return INQUIRY_ERROR[err.code] ?? '오류가 발생했어요.';
  return '오류가 발생했어요.';
}

function statusColor(status: InquiryStatus) {
  if (status === 'resolved') return ios.systemGreen;
  if (status === 'in_progress') return ios.systemOrange;
  return ios.secondaryLabel;
}

// ── 화면 상태 ─────────────────────────────────────────────────────────────────

type ScreenView =
  | { mode: 'list' }
  | { mode: 'detail'; id: string }
  | { mode: 'form'; editing: Inquiry | null };

export default function InquiriesScreen() {
  const [view, setView] = useState<ScreenView>({ mode: 'list' });

  if (view.mode === 'form') {
    return (
      <InquiryForm
        editing={view.editing}
        onDone={() => setView({ mode: 'list' })}
        onCancel={() => setView({ mode: 'list' })}
      />
    );
  }

  if (view.mode === 'detail') {
    return (
      <InquiryDetail
        id={view.id}
        onBack={() => setView({ mode: 'list' })}
        onEdit={(inquiry) => setView({ mode: 'form', editing: inquiry })}
      />
    );
  }

  return (
    <InquiryList
      onNew={() => setView({ mode: 'form', editing: null })}
      onSelect={(id) => setView({ mode: 'detail', id })}
    />
  );
}

// ── 목록 ──────────────────────────────────────────────────────────────────────

function InquiryList({ onNew, onSelect }: { onNew: () => void; onSelect: (id: string) => void }) {
  const { data, isLoading, isError } = useMyInquiries();
  const items = data?.items ?? [];

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.listContent}>
      <Button title="새 문의 작성" onPress={onNew} style={styles.newButton} />

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
              subtitle={`${TYPE_LABEL[it.inquiryType]} · ${STATUS_LABEL[it.status]}`}
              accessory="chevron"
              onPress={() => onSelect(it.id)}
            />
          ))}
        </ListSection>
      )}
    </Screen>
  );
}

// ── 상세 ──────────────────────────────────────────────────────────────────────

function InquiryDetail({
  id,
  onBack,
  onEdit,
}: {
  id: string;
  onBack: () => void;
  onEdit: (inquiry: Inquiry) => void;
}) {
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
        <Button title="목록으로" variant="tinted" onPress={onBack} />
      </Screen>
    );
  }

  return (
    <Screen scroll background="grouped" contentContainerStyle={styles.detailContent}>
      <View style={styles.detailHeader}>
        <Text style={styles.badge} numberOfLines={1}>
          {TYPE_LABEL[inquiry.inquiryType]}
        </Text>
        <Text style={[styles.status, { color: statusColor(inquiry.status) }]}>
          {STATUS_LABEL[inquiry.status]}
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
        <Button title="문의 수정" variant="tinted" onPress={() => onEdit(inquiry)} />
      ) : null}
      <Button title="목록으로" variant="plain" onPress={onBack} />
    </Screen>
  );
}

// ── 작성 / 수정 폼 ─────────────────────────────────────────────────────────────

function InquiryForm({
  editing,
  onDone,
  onCancel,
}: {
  editing: Inquiry | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    inquiryType: editing?.inquiryType ?? ('general' as InquiryType),
    title: editing?.title ?? '',
    content: editing?.content ?? '',
  });
  const [submitError, setSubmitError] = useState('');

  const create = useCreateInquiry();
  const update = useUpdateInquiry(editing?.id ?? '');
  const isPending = create.isPending || update.isPending;

  const canSubmit = form.title.trim().length > 0 && form.content.trim().length > 0;

  function handleSubmit() {
    if (!canSubmit || isPending) return;
    setSubmitError('');
    const onError = (err: unknown) => setSubmitError(inquiryErrorMessage(err));

    if (editing) {
      update.mutate(
        { title: form.title.trim(), content: form.content.trim() },
        { onSuccess: onDone, onError },
      );
    } else {
      create.mutate(
        { inquiryType: form.inquiryType, title: form.title.trim(), content: form.content.trim() },
        { onSuccess: onDone, onError },
      );
    }
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen scroll background="grouped" keyboardShouldPersistTaps="handled" contentContainerStyle={styles.formContent}>
        {!editing ? (
          <ListSection header="유형">
            {TYPE_ORDER.map((type) => (
              <TypeRow
                key={type}
                label={TYPE_LABEL[type]}
                selected={form.inquiryType === type}
                onPress={() => setForm((p) => ({ ...p, inquiryType: type }))}
              />
            ))}
          </ListSection>
        ) : null}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>제목</Text>
          <TextInput
            style={styles.input}
            placeholder="제목을 입력하세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={form.title}
            onChangeText={(v) => setForm((p) => ({ ...p, title: v }))}
            editable={!isPending}
            maxLength={200}
            returnKeyType="next"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>내용</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            placeholder="문의 내용을 자세히 적어주세요"
            placeholderTextColor={ios.tertiaryLabel}
            value={form.content}
            onChangeText={(v) => setForm((p) => ({ ...p, content: v }))}
            editable={!isPending}
            maxLength={5000}
            multiline
            textAlignVertical="top"
          />
        </View>

        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}

        <Button
          title={editing ? '수정 완료' : '문의 보내기'}
          onPress={handleSubmit}
          disabled={!canSubmit}
          loading={isPending}
        />
        <Button title="취소" variant="plain" onPress={onCancel} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

/** 유형 선택 행 — iOS 피커 스타일(선택 시 우측 체크마크). ListSection이 isLast 주입. */
function TypeRow({
  label,
  selected,
  onPress,
  isLast = false,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <View>
      <Pressable
        onPress={() => {
          haptics.selection();
          onPress();
        }}
        style={({ pressed }) => [styles.typeRow, pressed && styles.typeRowPressed]}>
        <Text style={styles.typeLabel} numberOfLines={1}>
          {label}
        </Text>
        {selected ? <IconSymbol name="checkmark" size={16} color={ios.tint} weight="semibold" /> : null}
      </Pressable>
      {!isLast ? <View style={styles.typeSeparator} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
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

  formContent: {
    paddingHorizontal: iosMetrics.pagePadding,
    paddingBottom: iosMetrics.spacing[10],
    gap: iosMetrics.spacing[4],
  },
  field: { gap: iosMetrics.spacing[2] },
  fieldLabel: {
    ...iosType.footnote,
    color: ios.secondaryLabel,
    marginLeft: iosMetrics.spacing[1],
  },
  input: {
    backgroundColor: ios.secondarySystemGroupedBackground,
    borderRadius: iosMetrics.radius.md,
    paddingHorizontal: iosMetrics.spacing[4],
    paddingVertical: iosMetrics.spacing[3],
    ...iosType.body,
    color: ios.label,
  },
  multiline: { minHeight: 140 },
  errorText: { ...iosType.footnote, color: ios.systemRed, marginLeft: iosMetrics.spacing[1] },

  typeRow: {
    minHeight: iosMetrics.rowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: iosMetrics.spacing[4],
  },
  typeRowPressed: { backgroundColor: ios.systemFill },
  typeLabel: { ...iosType.body, color: ios.label, flex: 1 },
  typeSeparator: {
    height: iosMetrics.hairline,
    backgroundColor: ios.separator,
    marginLeft: iosMetrics.spacing[4],
  },
});
