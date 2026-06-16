"use client";

import type { RefObject } from "react";
import type { Area } from "react-easy-crop";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Button } from "@wara/ui";
import { BottomSheet } from "@wara/ui";
import { Chip } from "@wara/ui";
import { TemplateCard } from "@/components/domain";
import { InvitationCover } from "@/components/domain";
import { GifPicker } from "@/components/organisms/GifPicker";
import ImageCropEditor from "@/domain/Edit/InvitationCard/MainImageEditor/ImageCropEditor";
import { DEFAULT_COVER_KEY } from "@/domain/InvitationCreate/constants";
import type { Template } from "@/lib/api/templates";

export interface ImagePickerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /* 템플릿 */
  templates: Template[];
  selectedCategory: string;
  onCategoryChange: (c: string) => void;
  templateId: string;
  onSelectTemplate: (t: Template) => void;
  /* 업로드 / GIF 공통 */
  imageTab: "upload" | "gif";
  onImageTabChange: (t: "upload" | "gif") => void;
  imageError: boolean;
  localPreviewUrl: string | null;
  mainImageKey: string;
  /* 업로드 */
  fileInputRef: RefObject<HTMLInputElement | null>;
  onImageFile: (f: File) => void;
  cropSrc: string | null;
  cropAspect: number;
  croppedAreaPixels: Area | null;
  onCropAreaChange: (a: Area) => void;
  onCropCancel: () => void;
  onCropConfirm: () => void;
  imageUploading: boolean;
  imageUploadError: boolean;
  /* GIF */
  mainGifUrl: string;
  onRemoveGif: () => void;
  gifPickerOpen: boolean;
  onGifPickerOpenChange: (v: boolean) => void;
  onSelectGif: (url: string) => void;
}

export function ImagePickerSheet(props: ImagePickerSheetProps) {
  const {
    open,
    onOpenChange,
    templates,
    selectedCategory,
    onCategoryChange,
    templateId,
    onSelectTemplate,
    imageTab,
    onImageTabChange,
    imageError,
    localPreviewUrl,
    mainImageKey,
    fileInputRef,
    onImageFile,
    cropSrc,
    cropAspect,
    croppedAreaPixels,
    onCropAreaChange,
    onCropCancel,
    onCropConfirm,
    imageUploading,
    imageUploadError,
    mainGifUrl,
    onRemoveGif,
    gifPickerOpen,
    onGifPickerOpenChange,
    onSelectGif,
  } = props;

  const categories = [...new Set(templates.map((t) => t.theme))].filter(Boolean);
  const filteredTemplates = selectedCategory
    ? templates.filter((t) => t.theme === selectedCategory)
    : templates;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title="대표 이미지">
        <div className="flex flex-col gap-5 pt-1">
          {/* 템플릿 */}
          <section>
            <p className="mb-2 text-[14px] font-semibold text-text">템플릿</p>
            {categories.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                <Chip selected={selectedCategory === ""} onClick={() => onCategoryChange("")}>
                  전체
                </Chip>
                {categories.map((c) => (
                  <Chip key={c} selected={selectedCategory === c} onClick={() => onCategoryChange(c)}>
                    {c}
                  </Chip>
                ))}
              </div>
            )}
            {filteredTemplates.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredTemplates.map((t) => (
                  <TemplateCard
                    key={t.id}
                    name={t.name}
                    imageUrl={t.previewImageKey}
                    variant={templateId === t.id ? "selected" : "basic"}
                    onClick={() => onSelectTemplate(t)}
                  />
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-text-disabled">사용 가능한 템플릿이 없어요. 직접 업로드해보세요.</p>
            )}
          </section>

          {/* 업로드 / GIF */}
          <section>
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                onClick={() => onImageTabChange("upload")}
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-semibold transition-colors",
                  imageTab === "upload" ? "bg-primary text-text-inverse" : "bg-gray-100 text-text-muted",
                )}
              >
                이미지 업로드
              </button>
              <button
                type="button"
                onClick={() => onImageTabChange("gif")}
                className={cn(
                  "rounded-full px-3 py-1 text-[13px] font-semibold transition-colors",
                  imageTab === "gif" ? "bg-primary text-text-inverse" : "bg-gray-100 text-text-muted",
                )}
              >
                GIF
              </button>
            </div>

            {imageTab === "upload" ? (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) onImageFile(f); e.target.value = ""; }}
                />
                {cropSrc ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-[13px] text-text-muted">
                      사진 비율이 표시 범위를 벗어나요. 드래그·확대로 맞춰주세요.
                    </p>
                    <ImageCropEditor
                      imageSrc={cropSrc}
                      aspect={cropAspect}
                      onCropComplete={onCropAreaChange}
                    />
                    <div className="flex gap-2">
                      <Button variant="secondary" className="flex-1" onClick={onCropCancel}>
                        취소
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={onCropConfirm}
                        disabled={imageUploading || !croppedAreaPixels}
                      >
                        {imageUploading ? "업로드 중..." : "적용"}
                      </Button>
                    </div>
                  </div>
                ) : imageUploading ? (
                  <div className="flex aspect-[4/5] w-full items-center justify-center rounded-lg bg-surface">
                    <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                  </div>
                ) : imageUploadError ? (
                  <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-lg bg-red-50">
                    <Icon name="alert-triangle" size="lg" color="danger" decorative />
                    <Button variant="text" size="sm" onClick={() => fileInputRef.current?.click()}>다시 시도</Button>
                  </div>
                ) : !localPreviewUrl && mainImageKey === DEFAULT_COVER_KEY ? (
                  <button
                    type="button"
                    className={cn(
                      "flex aspect-[4/5] w-full items-center justify-center rounded-lg border-2 border-dashed",
                      imageError ? "border-danger bg-danger-soft" : "border-border-strong bg-surface-muted",
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="flex flex-col items-center gap-2 text-text-disabled">
                      <Icon name="image" size="xl" color={imageError ? "danger" : "inactive"} decorative />
                      <span className={cn("text-[13px]", imageError && "text-danger")}>
                        {imageError ? "대표 이미지를 추가해주세요" : "사진을 추가해보세요"}
                      </span>
                    </div>
                  </button>
                ) : (
                  <button type="button" className="w-full" onClick={() => fileInputRef.current?.click()}>
                    <InvitationCover
                      imageUrl={localPreviewUrl ?? mainImageKey}
                      variant="image"
                      fitToImage
                    />
                  </button>
                )}
              </>
            ) : (
              <>
                {mainGifUrl ? (
                  <div className="relative w-full">
                    <button type="button" className="w-full" onClick={() => onGifPickerOpenChange(true)}>
                      <InvitationCover gifUrl={mainGifUrl} variant="image" fitToImage />
                    </button>
                    <button
                      type="button"
                      onClick={onRemoveGif}
                      className="absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-full bg-black/50 text-white"
                      aria-label="GIF 제거"
                    >
                      <Icon name="x" size="sm" color="currentColor" decorative />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={cn(
                      "flex aspect-[4/5] w-full items-center justify-center rounded-lg border-2 border-dashed",
                      imageError ? "border-danger bg-danger-soft" : "border-border-strong bg-surface-muted",
                    )}
                    onClick={() => onGifPickerOpenChange(true)}
                  >
                    <div className="flex flex-col items-center gap-2 text-text-disabled">
                      <span className={cn("text-[28px] font-bold", imageError && "text-danger")}>GIF</span>
                      <span className={cn("text-[13px]", imageError && "text-danger")}>
                        {imageError ? "대표 이미지를 추가해주세요" : "GIF를 선택해보세요"}
                      </span>
                    </div>
                  </button>
                )}
                {gifPickerOpen ? (
                  <div className="mt-2">
                    <GifPicker onSelect={onSelectGif} onClose={() => onGifPickerOpenChange(false)} />
                  </div>
                ) : null}
              </>
            )}
          </section>

          <Button variant="primary" size="lg" fullWidth onClick={() => onOpenChange(false)}>
            완료
          </Button>
        </div>
      </BottomSheet>
  );
}
