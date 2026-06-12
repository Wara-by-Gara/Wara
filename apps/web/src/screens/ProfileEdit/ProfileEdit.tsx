"use client";

import { Icon } from "@/components/icons";
import { Avatar } from "@/components/primitives/Avatar";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { FormField } from "@/components/molecules/FormField";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { ConfirmModal } from "@/components/molecules/Modal";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { useState, useRef } from "react";

export type ProfileEditState =
  | "default"
  | "nicknameFocus"
  | "nicknameDuplicateError"
  | "imageChange"
  | "imageDeleteModal"
  | "saveLoading"
  | "saveComplete"
  | "saveFailed";

export interface ProfileEditProps {
  state?: ProfileEditState;
  defaultName?: string;
  defaultNickname?: string;
  avatarUrl?: string;
  onBack?: () => void;
  onSave?: (nickname: string) => void;
  onImageSelect?: (file: File) => void;
  onImageDelete?: () => void;
  onRetry?: () => void;
}

export const ProfileEdit = ({
  state = "default",
  defaultName,
  defaultNickname = "김와라",
  avatarUrl,
  onBack,
  onSave,
  onImageSelect,
  onImageDelete,
  onRetry,
}: ProfileEditProps) => {
  const [modalOpen, setModalOpen] = useState(state === "imageDeleteModal");
  const [nickname, setNickname] = useState(defaultNickname);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      <main className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-page py-6">
        <section className="flex flex-col items-center gap-3">
          <button type="button" className="relative" onClick={() => fileInputRef.current?.click()}>
            <Avatar size="xl" src={avatarUrl} alt={defaultNickname} name={defaultName ?? defaultNickname} className="size-28" />
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
          counter={{ current: (nickname ?? '').length, max: 20 }}
        >
          <TextInput
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={20}
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
