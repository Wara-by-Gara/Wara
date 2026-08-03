"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Area } from "react-easy-crop";
import { Icon, Avatar, FormField, Input, Button } from "@wara/ui";
import { useMe, useUpdateMe } from "@/hooks/useUsers";
import { getProfileImagePresignedUrl } from "@/lib/api/users";
import { getCroppedImageBlob } from "@/utils/cropImage";
import { SignupFormSkeleton } from "@/components/domain/Skeleton";
import { ProfileImageCropScreen } from "@/components/domain/ProfileImageCropScreen";
import { ROUTES } from "@/constants/routes";

const currentYear = new Date().getFullYear();

const NAME_PATTERN = /^(?=.{2,30}$)[가-힣A-Za-z][가-힣A-Za-z\s'-]*[가-힣A-Za-z]$/;

const schema = z.object({
  name: z
    .string()
    .min(1, "이름을 입력해주세요")
    .refine(
      (v) => NAME_PATTERN.test(v.trim()),
      "한글 또는 영문으로 2자 이상 입력해주세요",
    ),
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: me, isLoading } = useMe();
  const { mutate: updateMe, isPending, error } = useUpdateMe();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  // 사진 미설정 상태로 저장 시도 시 사용자에게 기본 이미지로 진행됨을 알리는 확인 모달.
  const [pendingSubmit, setPendingSubmit] = useState<FormValues | null>(null);
  const randomAvatarSeed = useMemo(
    () => `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    [],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!me) return;
    if (me.name && me.email && me.birthYear) {
      const dest = localStorage.getItem("wara_onboarding_done") ? ROUTES.HOME : "/onboarding";
      router.replace(dest);
      return;
    }
    reset({
      name: me.name ?? "",
      email: me.email ?? "",
      birthYear: me.birthYear ? String(me.birthYear) : "",
    });
    if (me.profileImageUrl) {
      setProfileImageUrl(me.profileImageUrl);
      setProfileImagePreview(me.profileImageUrl);
    }
  }, [me, router, reset]);

  function handleImageSelect(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      setCropImageSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleCropConfirm(croppedAreaPixels: Area) {
    if (!cropImageSrc) return;
    setIsUploadingImage(true);
    try {
      const blob = await getCroppedImageBlob(cropImageSrc, croppedAreaPixels);
      const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
      const { presignedUrl, key } = await getProfileImagePresignedUrl(file.name, "image/jpeg");
      const putRes = await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: file });
      // fetch는 4xx/5xx에 throw하지 않음 — 실패해도 진행하면 S3 객체 없는 key가 프로필에 저장됨
      if (!putRes.ok) throw new Error("IMAGE_UPLOAD_FAILED");
      setProfileImageUrl(key);
      setProfileImagePreview(URL.createObjectURL(blob));
      setCropImageSrc(null);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function submitProfile(data: FormValues) {
    updateMe(
      {
        name: data.name.trim().replace(/\s+/g, " "),
        email: data.email,
        birthYear: parseInt(data.birthYear, 10),
        ...(profileImageUrl ? { profileImageUrl } : {}),
      },
      {
        onSuccess: () => {
          const dest = localStorage.getItem("wara_onboarding_done") ? ROUTES.HOME : "/onboarding";
          router.push(dest);
        },
      },
    );
  }

  function onSubmit(data: FormValues) {
    // 사진 없으면 기본 아바타로 진행됨을 명시적으로 확인받은 뒤 저장.
    if (!profileImageUrl) {
      setPendingSubmit(data);
      return;
    }
    submitProfile(data);
  }

  if (isLoading) {
    return (
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background">
        <main className="relative z-10 flex flex-1">
          <SignupFormSkeleton />
        </main>
      </div>
    );
  }

  const isSaving = isPending || isUploadingImage;

  if (cropImageSrc) {
    return (
      <ProfileImageCropScreen
        imageSrc={cropImageSrc}
        isConfirming={isUploadingImage}
        onBack={() => setCropImageSrc(null)}
        onConfirm={handleCropConfirm}
      />
    );
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden bg-background">
      <main className="relative z-10 flex flex-1 flex-col px-page py-8">
        <section className="flex flex-col items-center gap-5">
          <button
            type="button"
            className="relative"
            disabled={isSaving}
            onClick={() => fileInputRef.current?.click()}
          >
            <Avatar
              size="xl"
              src={profileImagePreview ?? undefined}
              name={randomAvatarSeed}
              className="size-28"
            />
            <span className="absolute right-0 bottom-0 inline-flex size-9 items-center justify-center rounded-full bg-primary text-text-inverse shadow-sm">
              <Icon name="camera" size="sm" color="currentColor" decorative />
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImageSelect(file);
              e.target.value = "";
            }}
          />

          <div className="flex w-full flex-col gap-1.5 text-center">
            <h1 className="text-[22px] font-extrabold text-text">프로필 설정</h1>
            <p className="text-[14px] text-text-muted">
              나를 소개하는 내용을 입력해주세요.
            </p>
          </div>
        </section>

        <form
          id="signup-form"
          onSubmit={handleSubmit(onSubmit)}
          className="mt-8 flex flex-col gap-5"
        >
          <FormField label="이름" required error={errors.name?.message}>
            <Input
              {...register("name")}
              placeholder="이름을 입력해주세요"
              disabled={isSaving}
              invalid={!!errors.name}
            />
          </FormField>

          <FormField label="이메일" required error={errors.email?.message}>
            <Input
              {...register("email")}
              type="email"
              placeholder="이메일을 입력해주세요"
              disabled={isSaving}
              invalid={!!errors.email}
            />
          </FormField>

          <FormField label="출생연도" required error={errors.birthYear?.message}>
            <Input
              {...register("birthYear")}
              type="number"
              placeholder="예) 1995"
              disabled={isSaving}
              invalid={!!errors.birthYear}
            />
          </FormField>

          {error && (
            <p
              role="alert"
              className="rounded-md bg-red-50 px-3 py-2 text-center text-[13px] font-medium text-danger"
            >
              정보 저장에 실패했어요. 다시 시도해주세요.
            </p>
          )}
        </form>
      </main>

      <footer className="relative z-10 px-page pb-[calc(env(safe-area-inset-bottom)+16px)]">
        <Button
          type="submit"
          form="signup-form"
          variant="primary"
          size="lg"
          fullWidth
          disabled={isSaving}
        >
          {isSaving ? "저장 중..." : "저장하기"}
        </Button>
      </footer>

      {pendingSubmit && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="default-avatar-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-lg">
            <p id="default-avatar-title" className="mb-1 text-lg font-semibold">
              프로필 사진 없이 진행할까요?
            </p>
            <p className="mb-6 text-sm text-text-muted">
              사진을 설정하지 않으면 기본 이미지로 가입돼요. 언제든지 마이페이지에서 바꿀 수 있어요.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingSubmit(null)}
                className="flex-1 rounded-xs border border-border-strong bg-transparent px-4 py-2 text-sm hover:bg-surface-muted"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => {
                  const data = pendingSubmit;
                  setPendingSubmit(null);
                  submitProfile(data);
                }}
                className="flex-1 rounded-xs bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                계속하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
