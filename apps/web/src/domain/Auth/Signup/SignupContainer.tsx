"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Area } from "react-easy-crop";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { FormField } from "@/components/molecules/FormField";
import { TextInput } from "@/components/primitives/TextInput";
import { Button } from "@/components/primitives/Button";
import { useMe, useUpdateMe } from "@/hooks/useUsers";
import { getProfileImagePresignedUrl } from "@/lib/api/users";
import { getCroppedImageBlob } from "@/utils/cropImage";
import { SignupFormSkeleton } from "@/components/organisms/Skeleton";
import { ProfileImageCropScreen } from "@/components/organisms/ProfileImageCropScreen";
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
      await fetch(presignedUrl, { method: "PUT", headers: { "Content-Type": "image/jpeg" }, body: file });
      setProfileImageUrl(key);
      setProfileImagePreview(URL.createObjectURL(blob));
      setCropImageSrc(null);
    } finally {
      setIsUploadingImage(false);
    }
  }

  function onSubmit(data: FormValues) {
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
            <h1 className="text-[22px] font-extrabold text-text-primary">프로필 설정</h1>
            <p className="text-[14px] text-text-secondary">
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
            <TextInput
              {...register("name")}
              placeholder="이름을 입력해주세요"
              disabled={isSaving}
              error={errors.name?.message}
            />
          </FormField>

          <FormField label="이메일" required error={errors.email?.message}>
            <TextInput
              {...register("email")}
              type="email"
              placeholder="이메일을 입력해주세요"
              disabled={isSaving}
              error={errors.email?.message}
            />
          </FormField>

          <FormField label="출생연도" required error={errors.birthYear?.message}>
            <TextInput
              {...register("birthYear")}
              type="number"
              placeholder="예) 1995"
              disabled={isSaving}
              error={errors.birthYear?.message}
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
    </div>
  );
}
