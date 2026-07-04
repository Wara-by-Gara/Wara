// 문의 작성/수정 폼 — id 파라미터가 있으면 수정 모드(pending 문의만, INQUIRY_NOT_EDITABLE 매핑).

import { useState } from 'react';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { Inquiry, InquiryType } from '@/api/inquiries';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Button, ListSection, Screen, haptics } from '@/components/ios';
import {
  INQUIRY_TYPE_LABEL,
  INQUIRY_TYPE_ORDER,
  inquiryErrorMessage,
} from '@/constants/inquiries';
import { useCreateInquiry, useInquiry, useUpdateInquiry } from '@/hooks/queries/inquiries';
import { ios, iosMetrics, iosType } from '@/theme';

export default function InquiryWriteScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { data: editing, isLoading, isError, error } = useInquiry(id ?? '');

  const screenTitle = <Stack.Screen options={{ title: id ? '문의 수정' : '문의하기' }} />;

  if (id && isLoading) {
    return (
      <Screen background="grouped">
        {screenTitle}
        <Text style={styles.note}>불러오는 중…</Text>
      </Screen>
    );
  }

  if (id && (isError || !editing)) {
    return (
      <Screen scroll background="grouped" contentContainerStyle={styles.formContent}>
        {screenTitle}
        <Text style={styles.note}>{inquiryErrorMessage(error)}</Text>
        <Button title="뒤로" variant="tinted" onPress={() => router.back()} />
      </Screen>
    );
  }

  return (
    <>
      {screenTitle}
      <InquiryForm editing={id ? (editing ?? null) : null} onDone={() => router.back()} onCancel={() => router.back()} />
    </>
  );
}

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
            {INQUIRY_TYPE_ORDER.map((type) => (
              <TypeRow
                key={type}
                label={INQUIRY_TYPE_LABEL[type]}
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
  note: {
    ...iosType.body,
    color: ios.secondaryLabel,
    textAlign: 'center',
    marginTop: iosMetrics.spacing[10],
  },
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
