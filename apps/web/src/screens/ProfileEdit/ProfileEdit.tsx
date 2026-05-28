"use client";

import Cropper from "react-easy-crop";
import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { FormField } from "@/components/molecules/FormField";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { ConfirmModal } from "@/components/molecules/Modal";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { useState, useRef, useCallback } from "react";
import type { Area } from "react-easy-crop";

export type ProfileEditState =
  | "default"
  | "nicknameFocus"
  | "nicknameDuplicateError"
  | "imageChange"
  | "imageCrop"
  | "imageDeleteModal"
  | "saveLoading"
  | "saveComplete"
  | "saveFailed";

export interface ProfileEditProps {
  state?: ProfileEditState;
  defaultNickname?: string;
  avatarUrl?: string;
  cropImageSrc?: string;
  isUploading?: boolean;
  onBack?: () => void;
  onSave?: (nickname: string) => void;
  onImageSelect?: (file: File) => void;
  onCropComplete?: (croppedAreaPixels: Area) => void;
  onImageDelete?: () => void;
  onRetry?: () => void;
}

export const ProfileEdit = ({
  state = "default",
  defaultNickname = "김와라",
  avatarUrl,
  cropImageSrc,
  isUploading = false,
  onBack,
  onSave,
  onImageSelect,
  onCropComplete,
  onImageDelete,
  onRetry,
}: ProfileEditProps) => {
  const [modalOpen, setModalOpen] = useState(state === "imageDeleteModal");
  const [nickname, setNickname] = useState(defaultNickname);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const croppedAreaPixelsRef = useRef<Area | null>(null);

  const handleCropAreaChange = useCallback((_: Area, croppedAreaPixels: Area) => {
    croppedAreaPixelsRef.current = croppedAreaPixels;
  }, []);

  if (state === "imageCrop" && cropImageSrc) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-black text-white">
        <TopAppBar className="shrink-0" title="이미지 자르기" onBack={onBack} variant="transparent" />
        <main className="relative flex-1">
          <Cropper
            image={cropImageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropAreaChange}
          />
        </main>
        <footer className="shrink-0 p-5">
          <input
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mb-4 w-full accent-white"
          />
          <Button
            variant="primary"
            fullWidth
            loading={isUploading}
            onClick={() => {
              if (croppedAreaPixelsRef.current) {
                onCropComplete?.(croppedAreaPixelsRef.current);
              }
            }}
          >
            맞췄어요
          </Button>
        </footer>
      </div>
    );
  }

  if (state === "saveComplete") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="프로필 수정" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <Icon name="badge-check" size="xl" color="success" decorative />
          <p className="text-[18px] font-bold text-text-primary">프로필이 저장됐어요</p>
        </main>
      </div>
    );
  }

  if (state === "saveFailed") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="프로필 수정" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <Icon name="alert-triangle" size="xl" color="danger" decorative />
          <p className="text-[18px] font-bold text-text-primary">저장에 실패했어요</p>
          <Button variant="outline" onClick={onRetry}>다시 시도</Button>
        </main>
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="프로필 수정" onBack={onBack} />
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-6">
        <section className="flex flex-col items-center gap-3">
          <button type="button" className="relative" onClick={() => fileInputRef.current?.click()}>
            <Avatar size="xl" src={avatarUrl} alt={defaultNickname} initial={defaultNickname[0]} className="size-24" />
            <span className="absolute right-0 bottom-0 inline-flex size-9 items-center justify-center rounded-full bg-primary text-text-inverse">
              <Icon name="camera" size="sm" color="currentColor" decorative />
            </span>
          </button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>사진 변경</Button>
            {avatarUrl ? (
              <Button variant="text" size="sm" onClick={() => setModalOpen(true)}>삭제</Button>
            ) : null}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onImageSelect?.(file);
              e.target.value = '';
            }}
          />
        </section>

        <FormField
          label="닉네임"
          required
          error={state === "nicknameDuplicateError" ? "이미 사용 중인 닉네임이에요" : undefined}
          counter={{ current: (nickname ?? '').length, max: 8 }}
        >
          <TextInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={8}
            autoFocus={state === "nicknameFocus"}
            error={state === "nicknameDuplicateError" ? "dup" : undefined}
          />
        </FormField>
      </main>
      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: "저장",
            loading: state === "saveLoading",
            disabled: state === "nicknameDuplicateError" || !nickname,
            onClick: () => onSave?.(nickname ?? ''),
          }}
        />
      </div>

      <ConfirmModal contained
        open={modalOpen}
        onOpenChange={setModalOpen}
        title="사진을 삭제할까요?"
        description="기본 이미지로 바뀝니다"
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={() => { onImageDelete?.(); setModalOpen(false); }}
      />
    </div>
  );
};
