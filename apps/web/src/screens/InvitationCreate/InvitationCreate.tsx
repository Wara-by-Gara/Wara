"use client";

import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Chip } from "@/components/primitives/Chip";
import { Switch } from "@/components/primitives/Switch";
import { Radio, RadioGroup } from "@/components/primitives/Radio";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { FormField } from "@/components/molecules/FormField";
import { DateTimeSelector } from "@/components/molecules/DateTimeSelector";
import { LocationSelector } from "@/components/molecules/LocationSelector";
import { ConfirmModal } from "@/components/molecules/Modal";
import { ShareOptionItem } from "@/components/molecules/ShareOptionItem";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { AutoSlide } from "@/components/molecules/AutoSlide";
import { TemplateCard } from "@/components/organisms/TemplateCard";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { toast } from "@/components/molecules/Toast";
import { mockTemplates, mockInvitation, mockTemplateSlides } from "@/lib/mockData";

export type CreateStep =
  | "start"
  | "templateCategory"
  | "templateList"
  | "templatePreview"
  | "templateSelected"
  | "blankTemplate"
  | "basicInfoEmpty"
  | "basicInfoFilled"
  | "basicInfoError"
  | "titleFocused"
  | "descriptionFocused"
  | "coverImageEmpty"
  | "coverImageSelected"
  | "coverImageCrop"
  | "coverImageUploading"
  | "coverImageUploadFailed"
  | "coverImageDeleteModal"
  | "dateTimeEmpty"
  | "datePickerOpen"
  | "timePickerOpen"
  | "dateTimeSelected"
  | "dateUnknownToggleOn"
  | "timeUnknownToggleOn"
  | "dateVotePropose"
  | "rsvpDeadlineSelect"
  | "pastDateError"
  | "dateRequiredError"
  | "locationEmpty"
  | "locationSearch"
  | "locationSearchResults"
  | "locationSearchEmpty"
  | "locationSelected"
  | "locationManualInput"
  | "onlineMeetingLink"
  | "locationUnknownToggleOn"
  | "mapPreview"
  | "locationPermissionGuide"
  | "rsvpSettingDefault"
  | "rsvpToggleOff"
  | "rsvpToggleOn"
  | "capacityLimit"
  | "companionAllowed"
  | "companionNotAllowed"
  | "rsvpDeadline"
  | "additionalQuestionList"
  | "addTextQuestion"
  | "addSingleChoiceQuestion"
  | "addMultipleChoiceQuestion"
  | "requiredQuestionToggle"
  | "questionDeleteModal"
  | "privacyPublic"
  | "privacyLinkOnly"
  | "privacyPasswordProtected"
  | "privacyPasswordInput"
  | "participantListPublicToggle"
  | "commentToggle"
  | "albumToggle"
  | "searchExposureToggle"
  | "designStyle"
  | "backgroundColor"
  | "fontSelect"
  | "buttonColor"
  | "stickerSelect"
  | "stickerPosition"
  | "layoutSelect"
  | "posterType"
  | "cardType"
  | "feedType"
  | "y2kStyle"
  | "minimalStyle"
  | "preview"
  | "fullscreenPreview"
  | "draftSavedToast"
  | "leaveWithoutSaveModal"
  | "requiredFieldsError"
  | "savingLoading"
  | "saveFailed"
  | "publishConfirm"
  | "publishingLoading"
  | "publishComplete"
  | "shareCta"
  | "linkCopiedToast"
  | "qrGenerated"
  | "instagramImageSaved";

export interface InvitationCreateProps {
  step?: CreateStep;
  onBack?: () => void;
  onNext?: () => void;
}

const stepTitle = (step: CreateStep): string => {
  if (step.startsWith("template")) return "템플릿";
  if (step.startsWith("basic") || step.startsWith("title") || step.startsWith("description") || step.startsWith("cover")) return "기본 정보";
  if (step.startsWith("date") || step.startsWith("time") || step.includes("rsvpDeadline")) return "날짜·시간";
  if (step.startsWith("location") || step === "onlineMeetingLink" || step === "mapPreview") return "장소";
  if (step.startsWith("rsvp") || step === "capacityLimit" || step.startsWith("companion") || step.includes("Question")) return "RSVP 설정";
  if (step.startsWith("privacy") || step.includes("Toggle") || step.includes("Exposure")) return "공개 범위";
  if (step.startsWith("design") || step.startsWith("background") || step.startsWith("font") || step.startsWith("button") || step.startsWith("sticker") || step.startsWith("layout") || step.endsWith("Style") || step.endsWith("Type") || step === "preview" || step === "fullscreenPreview") return "디자인";
  if (step === "publishConfirm" || step === "publishingLoading" || step === "publishComplete" || step === "shareCta" || step === "linkCopiedToast" || step === "qrGenerated" || step === "instagramImageSaved") return "만들기";
  return "초대장 만들기";
};

export const InvitationCreate = ({ step = "start", onBack, onNext }: InvitationCreateProps) => {
  if (step === "start") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 overflow-y-auto px-6 text-center">
          <Icon name="send" size="xl" color="primary" decorative />
          <h1 className="text-[22px] font-extrabold text-text-primary">어떻게 시작할까요?</h1>
          <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={onNext}>템플릿으로 시작</Button>
            <Button variant="outline" size="lg" fullWidth>빈 화면에서 시작</Button>
          </div>
        </main>
      </div>
    );
  }

  // Template steps
  if (step === "templateCategory") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="템플릿 카테고리" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
          {["Y2K", "Minimal", "Birthday", "Floral", "Premium"].map((c) => (
            <Button key={c} variant="outline" size="lg" fullWidth>{c}</Button>
          ))}
        </main>
      </div>
    );
  }

  if (step === "templateList" || step === "templatePreview" || step === "templateSelected" || step === "blankTemplate") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="템플릿" onBack={onBack} />
        <main
          className={
            step === "blankTemplate"
              ? "flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-4 text-center"
              : "min-h-0 flex-1 overflow-y-auto px-5 py-4"
          }
        >
          {step === "blankTemplate" ? (
            <div className="flex flex-col items-center gap-3">
              <Icon name="palette" size="xl" color="inactive" decorative />
              <p className="text-[15px] font-semibold text-text-primary">빈 화면에서 시작</p>
              <p className="text-[13px] text-text-tertiary">처음부터 직접 디자인할 수 있어요</p>
            </div>
          ) : step === "templatePreview" ? (
            <div className="flex flex-col gap-4">
              <AutoSlide slides={[...mockTemplateSlides]} intervalMs={4000} />
              <p className="text-center text-[13px] text-text-tertiary">
                Y2K · 레트로 · 콜라주 스타일을 둘러보세요
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {mockTemplates.map((t, i) => (
                <TemplateCard
                  key={t.id}
                  name={t.name}
                  imageUrl={t.imageUrl}
                  variant={step === "templateSelected" && i === 0 ? "selected" : t.premium ? "premium" : "basic"}
                />
              ))}
            </div>
          )}
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: step === "templateSelected" ? "이 템플릿으로 시작" : "다음", disabled: step === "templateList", onClick: onNext }} />
      </div>
      </div>
    );
  }

  // Basic info
  if (step.startsWith("basic") || step === "titleFocused" || step === "descriptionFocused" || step.startsWith("cover")) {
    const titleFilled = step !== "basicInfoEmpty";
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title={stepTitle(step)} onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <FormField label="대표 이미지">
            {step === "coverImageEmpty" ? (
              <button type="button" className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl border-2 border-dashed border-border-strong bg-background-soft">
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <Icon name="image" size="xl" color="inactive" decorative />
                  <span className="text-[13px]">사진을 추가해보세요</span>
                </div>
              </button>
            ) : step === "coverImageUploading" ? (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-surface">
                <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              </div>
            ) : step === "coverImageUploadFailed" ? (
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-3xl bg-danger-soft">
                <Icon name="alert-triangle" size="lg" color="danger" decorative />
                <Button variant="text" size="sm">다시 시도</Button>
              </div>
            ) : step === "coverImageCrop" ? (
              <div className="aspect-[4/5] w-full rounded-3xl bg-gray-900" />
            ) : (
              <InvitationCover imageUrl={mockInvitation.coverImageUrl} variant="image" />
            )}
          </FormField>
          <FormField
            label="제목"
            required
            counter={{ current: titleFilled ? 9 : 0, max: 30 }}
            error={step === "basicInfoError" ? "제목을 입력해주세요" : undefined}
          >
            <TextInput
              defaultValue={titleFilled ? "와라의 생일 파티" : ""}
              autoFocus={step === "titleFocused"}
              placeholder="예: 와라의 생일 파티"
            />
          </FormField>
          <FormField label="설명" counter={{ current: titleFilled ? 22 : 0, max: 500 }}>
            <Textarea
              defaultValue={titleFilled ? "함께 모여 즐겁게 보내요" : ""}
              autoFocus={step === "descriptionFocused"}
              placeholder="간단한 소개를 적어주세요"
              rows={4}
            />
          </FormField>
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "다음", disabled: step === "basicInfoEmpty" || step === "basicInfoError", onClick: onNext }} />
      </div>
        <ConfirmModal contained open={step === "coverImageDeleteModal"} onOpenChange={() => {}} title="이미지를 삭제할까요?" confirmLabel="삭제" confirmVariant="danger" />
      </div>
    );
  }

  // Date/Time
  if (step.startsWith("date") || step.startsWith("time") || step === "rsvpDeadlineSelect") {
    const dateUnknown = step === "dateUnknownToggleOn" || step === "dateVotePropose";
    const timeUnknown = step === "timeUnknownToggleOn";
    const filled = step === "dateTimeSelected" || step === "rsvpDeadlineSelect";
    const showVotePropose = step === "dateVotePropose";
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="날짜·시간" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <DateTimeSelector
            mode="date"
            label="모임 날짜"
            value={filled ? "2026-05-19" : ""}
            unknownToggle
            unknown={dateUnknown}
            error={
              step === "pastDateError"
                ? "지난 날짜는 선택할 수 없어요"
                : step === "dateRequiredError"
                  ? "날짜를 선택해주세요"
                  : undefined
            }
          />
          <DateTimeSelector
            mode="time"
            label="시작 시간"
            value={filled ? "19:30" : ""}
            unknownToggle
            unknown={timeUnknown}
          />
          {step === "rsvpDeadlineSelect" ? (
            <DateTimeSelector mode="date" label="응답 마감일" value="2026-05-17" />
          ) : (
            <Button variant="outline" size="md">응답 마감일 설정</Button>
          )}

          {/* 날짜 미정 시 날짜 투표 제안 배너 */}
          {showVotePropose && (
            <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Icon name="calendar" size="md" color="primary" decorative />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-[15px] font-bold text-text-primary">날짜 투표로 정해볼까요?</p>
                  <p className="text-[13px] leading-relaxed text-text-secondary">
                    여러 후보 날짜를 제시하고<br />참여자들이 가능한 날을 투표해요
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5">
                <Icon name="check-circle" size="sm" color="primary" decorative />
                <span className="text-[12px] text-text-secondary">최대 30개 날짜·시간 후보 등록</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-white/70 px-3 py-2.5">
                <Icon name="check-circle" size="sm" color="primary" decorative />
                <span className="text-[12px] text-text-secondary">👍 🤔 👎 로 간편 응답, 결과 자동 집계</span>
              </div>
              <Button
                variant="primary"
                size="md"
                fullWidth
                onClick={onNext}
                className="mt-1"
              >
                날짜 투표 만들기
              </Button>
            </div>
          )}
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "다음", disabled: !filled && !dateUnknown && !timeUnknown, onClick: onNext }} />
        </div>
      </div>
    );
  }

  // Location
  if (step.startsWith("location") || step === "onlineMeetingLink" || step === "mapPreview") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="장소" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
          {step === "locationPermissionGuide" ? (
            <div className="rounded-2xl bg-yellow-50 p-4 text-[13px] text-yellow-400">위치 권한이 필요해요</div>
          ) : null}
          <LocationSelector
            mode={
              step === "locationSelected" || step === "mapPreview"
                ? "selected"
                : step === "locationManualInput" || step === "onlineMeetingLink"
                  ? "manual"
                  : "search"
            }
            manualPlaceholder={
              step === "onlineMeetingLink" ? "https://..." : "장소 이름 또는 주소"
            }
            selected={{ name: "와라 카페", address: "서울 마포구 와라로 12" }}
            state={
              step === "locationSearch" ? "default" :
              step === "locationSearchResults" ? "default" :
              step === "locationSearchEmpty" ? "no-result" :
              step === "locationPermissionGuide" ? "permission-required" : "default"
            }
            unknown={step === "locationUnknownToggleOn"}
          />
          {step === "locationSearchResults" ? (
            <ul className="rounded-2xl border border-border bg-surface">
              {["와라 카페 (마포)", "와라 키친 (성수)", "와라 스튜디오 (강남)"].map((p) => (
                <li key={p} className="flex items-center gap-2 px-4 py-3 border-b border-border last:border-0">
                  <Icon name="map-pin" size="sm" color="inactive" decorative />
                  <span className="text-[14px] text-text-primary">{p}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "다음", onClick: onNext }} />
      </div>
      </div>
    );
  }

  // RSVP settings
  if (step.startsWith("rsvp") || step === "capacityLimit" || step.startsWith("companion") || step.endsWith("Question") || step === "additionalQuestionList" || step === "requiredQuestionToggle" || step === "questionDeleteModal") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="RSVP 설정" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
        <section className="py-2">
          <div className="divide-y divide-border bg-surface">
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] font-semibold text-text-primary">RSVP 받기</span>
              <Switch defaultChecked={step !== "rsvpToggleOff"} />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] text-text-primary">정원 제한</span>
              <Switch defaultChecked={step === "capacityLimit"} />
            </div>
            {step === "capacityLimit" ? (
              <div className="px-4 pb-3">
                <TextInput type="number" defaultValue={15} placeholder="정원" />
              </div>
            ) : null}
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] text-text-primary">동반인 허용</span>
              <Switch defaultChecked={step !== "companionNotAllowed"} />
            </div>
            <div className="flex items-center justify-between px-4 py-3.5">
              <span className="text-[15px] text-text-primary">응답 마감일</span>
              <Switch defaultChecked={step === "rsvpDeadline"} />
            </div>
          </div>
        </section>
        <section className="py-2">
          <h2 className="px-4 py-2 text-[12px] font-bold uppercase tracking-wide text-text-tertiary">추가 질문</h2>
          {step === "additionalQuestionList" ? (
            <div className="divide-y divide-border bg-surface">
              <div className="px-4 py-3 text-[14px]">알러지가 있나요?</div>
              <div className="px-4 py-3 text-[14px]">참석 인원은 몇 명인가요?</div>
            </div>
          ) : (
            <p className="px-4 text-[13px] text-text-tertiary">아직 추가된 질문이 없어요</p>
          )}
          <div className="mt-3 flex gap-2 px-4 pb-4">
            <Button variant="outline" size="sm">텍스트 질문</Button>
            <Button variant="outline" size="sm">단일 선택</Button>
            <Button variant="outline" size="sm">복수 선택</Button>
          </div>
        </section>
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: "다음", onClick: onNext }} />
      </div>
        <ConfirmModal contained open={step === "questionDeleteModal"} onOpenChange={() => {}} title="질문을 삭제할까요?" confirmLabel="삭제" confirmVariant="danger" />
      </div>
    );
  }

  // Privacy
  if (step.startsWith("privacy") || step.endsWith("Toggle") || step === "searchExposureToggle") {
    const value =
      step === "privacyLinkOnly" ? "link" : step === "privacyPasswordProtected" || step === "privacyPasswordInput" ? "password" : "public";
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
        <TopAppBar className="shrink-0" title="공개 범위" onBack={onBack} />
        <main className="min-h-0 flex-1 overflow-y-auto">
          <section className="py-2">
            <div className="flex flex-col bg-surface px-4 py-3">
              <RadioGroup defaultValue={value}>
                <label className="flex items-center gap-3 py-2"><Radio value="public" /><span className="text-[15px]">공개</span></label>
                <label className="flex items-center gap-3 py-2"><Radio value="link" /><span className="text-[15px]">링크 받은 사람만</span></label>
                <label className="flex items-center gap-3 py-2"><Radio value="password" /><span className="text-[15px]">비밀번호 입력자만</span></label>
              </RadioGroup>
              {step === "privacyPasswordInput" || step === "privacyPasswordProtected" ? (
                <TextInput className="mt-2" placeholder="비밀번호" />
              ) : null}
            </div>
          </section>
          <section className="py-2">
            <div className="divide-y divide-border bg-surface">
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[15px]">참석자 명단 공개</span>
                <Switch defaultChecked={step === "participantListPublicToggle"} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[15px]">댓글 허용</span>
                <Switch defaultChecked={step === "commentToggle"} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[15px]">앨범 허용</span>
                <Switch defaultChecked={step === "albumToggle"} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-[15px]">검색 노출</span>
                <Switch defaultChecked={step === "searchExposureToggle"} />
              </div>
            </div>
          </section>
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "다음", onClick: onNext }} />
        </div>
      </div>
    );
  }

  // Design
  if (step.startsWith("design") || step.startsWith("background") || step.startsWith("font") || step.startsWith("button") || step.startsWith("sticker") || step.startsWith("layout") || step.endsWith("Style") || step.endsWith("Type") || step === "preview" || step === "fullscreenPreview") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="디자인" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <InvitationCover variant="color" backgroundClass="bg-pink-200" />
          <div className="flex flex-wrap gap-1.5">
            <Chip variant="filter" selected>레이아웃</Chip>
            <Chip variant="filter">배경색</Chip>
            <Chip variant="filter">폰트</Chip>
            <Chip variant="filter">버튼</Chip>
            <Chip variant="filter">스티커</Chip>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["#FFE1EF", "#FFD43B", "#DDF1FF", "#D3FBEA", "#FFC4DF", "#A8F0D2"].map((c) => (
              <button key={c} className="aspect-square rounded-2xl border-2 border-border" style={{ background: c }} />
            ))}
          </div>
        </main>
        <div className="relative z-10 shrink-0">
      <StickyCTA primary={{ label: step === "preview" || step === "fullscreenPreview" ? "초대장 만들기" : "미리보기", onClick: onNext }} secondary={{ label: "임시저장" }} />
      </div>
      </div>
    );
  }

  // Save/Publish
  if (step === "savingLoading" || step === "publishingLoading") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          <p className="text-[14px] text-text-secondary">{step === "savingLoading" ? "저장 중..." : "만드는 중..."}</p>
        </main>
      </div>
    );
  }

  if (step === "publishComplete" || step === "shareCta") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto px-6 text-center">
          <Icon name="party-popper" size="xl" color="primary" decorative />
          <p className="text-[20px] font-bold text-text-primary">초대장이 만들어졌어요!</p>
          <p className="text-[14px] text-text-secondary">친구들에게 공유해보세요</p>
          <Button size="lg" fullWidth className="mt-4 max-w-xs">공유하기</Button>
        </main>
      </div>
    );
  }

  if (step === "qrGenerated") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="QR 코드" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <div className="size-64 rounded-3xl bg-surface grid place-items-center">
            <Icon name="qrcode" size="xl" decorative className="size-32" />
          </div>
          <Button variant="outline" size="md">이미지로 저장</Button>
        </main>
      </div>
    );
  }

  if (step === "instagramImageSaved") {
    return (
      <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" onBack={onBack} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 overflow-y-auto">
          <Icon name="image" size="xl" color="success" decorative />
          <p className="text-[18px] font-bold text-text-primary">이미지가 저장됐어요</p>
          <p className="text-[13px] text-text-secondary">Instagram 스토리에 올려보세요</p>
        </main>
      </div>
    );
  }

  // toast/modal hookless display
  return (
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background">
      <TopAppBar className="shrink-0" title="만들기" onBack={onBack} />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-5 py-4">
        <Button variant="primary" size="lg" fullWidth onClick={() => toast.show("임시저장 완료")}>임시저장</Button>
        {step === "saveFailed" || step === "requiredFieldsError" ? (
          <p className="mt-4 text-center text-[13px] text-danger">
            {step === "saveFailed" ? "저장에 실패했어요" : "필수 항목을 확인해주세요"}
          </p>
        ) : null}
      </main>
      <ConfirmModal contained open={step === "leaveWithoutSaveModal"} onOpenChange={() => {}} title="저장하지 않고 나갈까요?" description="작성한 내용이 사라져요" confirmLabel="나가기" confirmVariant="danger" />
      <ConfirmModal contained open={step === "publishConfirm"} onOpenChange={() => {}} title="초대장을 만들까요?" description="초대장이 만들어지면 참석자 응답을 받을 수 있어요" confirmLabel="만들기" />
      <BottomSheet open={step === "draftSavedToast" || step === "linkCopiedToast"} onOpenChange={() => {}}>
        <BottomSheetContent contained title={step === "draftSavedToast" ? "임시저장 완료" : "링크가 복사되었어요"}>
          <ShareOptionItem icon="badge-check" title="확인" />
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
};
