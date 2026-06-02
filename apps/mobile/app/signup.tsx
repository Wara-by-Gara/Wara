import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fetchMe, updateMe, userKeys } from '@/api/users';
import { colors, layout, radius, spacing, typography } from '@/constants/tokens';

const currentYear = new Date().getFullYear();

interface FormState {
  name: string;
  email: string;
  birthYear: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  birthYear?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) {
    errors.name = '이름을 입력해주세요';
  } else if (form.name.trim().length > 100) {
    errors.name = '이름은 100자 이하로 입력해주세요';
  }

  if (!form.email.trim()) {
    errors.email = '이메일을 입력해주세요';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = '유효한 이메일을 입력해주세요';
  }

  if (!form.birthYear.trim()) {
    errors.birthYear = '출생연도를 입력해주세요';
  } else if (!/^\d{4}$/.test(form.birthYear.trim())) {
    errors.birthYear = '4자리 연도를 입력해주세요';
  } else {
    const year = parseInt(form.birthYear, 10);
    if (year < 1900 || year > currentYear) {
      errors.birthYear = '올바른 출생연도를 입력해주세요';
    }
  }

  return errors;
}

export default function SignupScreen() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>({ name: '', email: '', birthYear: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: me, isLoading } = useQuery({
    queryKey: userKeys.me(),
    queryFn: ({ signal }) => fetchMe(signal),
    retry: false,
  });

  useEffect(() => {
    if (!me) return;
    if (me.name && me.email && me.birthYear) {
      router.replace('/(tabs)');
      return;
    }
    setForm({
      name: me.name ?? '',
      email: me.email ?? '',
      birthYear: me.birthYear ? String(me.birthYear) : '',
    });
  }, [me]);

  const { mutate, isPending } = useMutation({
    mutationFn: updateMe,
    onSuccess: (updated) => {
      queryClient.setQueryData(userKeys.me(), updated);
      router.replace('/(tabs)');
    },
    onError: () => {
      setSubmitError('정보 저장에 실패했어요. 다시 시도해주세요.');
    },
  });

  function handleChange(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (submitError) setSubmitError(null);
  }

  function handleSubmit() {
    const nextErrors = validate(form);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }
    mutate({
      name: form.name.trim(),
      email: form.email.trim(),
      birthYear: parseInt(form.birthYear, 10),
    });
  }

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingArea}>
          <Text style={styles.loadingText}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.title}>추가 정보를 입력해주세요</Text>
            <Text style={styles.subtitle}>서비스 이용을 위해 아래 정보가 필요해요</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>
                이름 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.name ? styles.inputError : null, isPending && styles.inputDisabled]}
                placeholder="이름을 입력해주세요"
                placeholderTextColor={colors.textTertiary}
                value={form.name}
                onChangeText={(v) => handleChange('name', v)}
                editable={!isPending}
                returnKeyType="next"
              />
              {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                이메일 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.email ? styles.inputError : null, isPending && styles.inputDisabled]}
                placeholder="이메일을 입력해주세요"
                placeholderTextColor={colors.textTertiary}
                value={form.email}
                onChangeText={(v) => handleChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isPending}
                returnKeyType="next"
              />
              {errors.email ? <Text style={styles.errorText}>{errors.email}</Text> : null}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>
                출생연도 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[styles.input, errors.birthYear ? styles.inputError : null, isPending && styles.inputDisabled]}
                placeholder="예) 1995"
                placeholderTextColor={colors.textTertiary}
                value={form.birthYear}
                onChangeText={(v) => handleChange('birthYear', v)}
                keyboardType="number-pad"
                maxLength={4}
                editable={!isPending}
                returnKeyType="done"
              />
              {errors.birthYear ? <Text style={styles.errorText}>{errors.birthYear}</Text> : null}
            </View>

            {submitError ? (
              <View style={styles.submitErrorBox}>
                <Text style={styles.submitErrorText}>{submitError}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{isPending ? '저장 중...' : '완료'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  loadingArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body2,
    color: colors.textTertiary,
  },
  scrollContent: {
    paddingHorizontal: layout.pagePadding,
    paddingTop: spacing[8],
    paddingBottom: spacing[6],
  },
  header: {
    marginBottom: spacing[8],
    gap: spacing[2],
  },
  title: {
    ...typography.heading2,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body3,
    color: colors.textSecondary,
  },
  form: {
    gap: spacing[5],
  },
  field: {
    gap: spacing[1],
  },
  label: {
    ...typography.caption1,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  required: {
    color: colors.primary,
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing[4],
    ...typography.body2,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputDisabled: {
    opacity: 0.6,
  },
  errorText: {
    ...typography.caption2,
    color: colors.danger,
  },
  submitErrorBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
  },
  submitErrorText: {
    ...typography.caption1,
    color: colors.danger,
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: layout.pagePadding,
    paddingBottom: spacing[4],
    paddingTop: spacing[2],
  },
  button: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    ...typography.buttonLarge,
    color: colors.textInverse,
  },
});
