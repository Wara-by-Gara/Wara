"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { FormField } from "@/components/molecules/FormField";
import { TextInput } from "@/components/primitives/TextInput";
import { Button } from "@/components/primitives/Button";
import { useMe, useUpdateMe } from "@/hooks/useUsers";
import { ROUTES } from "@/constants/routes";

const currentYear = new Date().getFullYear();

const schema = z.object({
  name: z.string().min(1, "이름을 입력해주세요").max(100),
  email: z.string().email("유효한 이메일을 입력해주세요"),
  birthYear: z
    .string()
    .min(1, "출생연도를 입력해주세요")
    .refine((v) => /^\d{4}$/.test(v), "4자리 연도를 입력해주세요")
    .refine(
      (v) => { const n = parseInt(v, 10); return n >= 1900 && n <= currentYear; },
      "올바른 출생연도를 입력해주세요",
    ),
});

type FormValues = z.infer<typeof schema>;

export function SignupContainer() {
  const router = useRouter();
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending, error } = useUpdateMe();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!me) return;
    if (me.name && me.email && me.birthYear) {
      router.replace(ROUTES.HOME);
      return;
    }
    reset({
      name: me.name ?? "",
      email: me.email ?? "",
      birthYear: me.birthYear ? String(me.birthYear) : "",
    });
  }, [me, router, reset]);

  function onSubmit(data: FormValues) {
    updateMe(
      { name: data.name, email: data.email, birthYear: parseInt(data.birthYear, 10) },
      { onSuccess: () => router.push(ROUTES.HOME) },
    );
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
        <TopAppBar title="추가 정보 입력" />
        <main className="flex flex-1 items-center justify-center">
          <p className="text-[14px] text-text-tertiary">불러오는 중...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <TopAppBar title="추가 정보 입력" />

      <main className="flex-1 px-6 py-6">
        <section className="flex flex-col gap-4">
          <h1 className="text-[22px] font-extrabold text-text-primary">
            추가 정보를 입력해주세요
          </h1>
          <p className="text-[14px] text-text-secondary">
            서비스 이용을 위해 아래 정보가 필요해요
          </p>

          <form
            id="signup-form"
            onSubmit={handleSubmit(onSubmit)}
            className="mt-2 flex flex-col gap-5"
          >
            <FormField label="이름" required error={errors.name?.message}>
              <TextInput
                {...register("name")}
                placeholder="이름을 입력해주세요"
                disabled={isPending}
                error={errors.name?.message}
              />
            </FormField>

            <FormField label="이메일" required error={errors.email?.message}>
              <TextInput
                {...register("email")}
                type="email"
                placeholder="이메일을 입력해주세요"
                disabled={isPending}
                error={errors.email?.message}
              />
            </FormField>

            <FormField label="출생연도" required error={errors.birthYear?.message}>
              <TextInput
                {...register("birthYear")}
                type="number"
                placeholder="예) 1995"
                disabled={isPending}
                error={errors.birthYear?.message}
              />
            </FormField>

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-red-50 px-3 py-2 text-center text-[13px] font-medium text-danger"
              >
                정보 저장에 실패했어요. 다시 시도해주세요.
              </p>
            )}
          </form>
        </section>
      </main>

      <footer className="px-5 pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <Button
          type="submit"
          form="signup-form"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isPending}
        >
          {isPending ? "저장 중..." : "완료"}
        </Button>
      </footer>
    </div>
  );
}
