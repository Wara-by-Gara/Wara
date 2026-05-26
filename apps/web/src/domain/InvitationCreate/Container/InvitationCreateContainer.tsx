"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { searchPlaces } from "@/lib/api/locations";
import type { Place } from "@/lib/api/locations";
import { Chip } from "@/components/primitives/Chip";
import { Switch } from "@/components/primitives/Switch";
import { Radio, RadioGroup } from "@/components/primitives/Radio";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { FormField } from "@/components/molecules/FormField";
import { DateTimeSelector } from "@/components/molecules/DateTimeSelector";
import { LocationSelector } from "@/components/molecules/LocationSelector";
import { AutoSlide } from "@/components/molecules/AutoSlide";
import { TemplateCard } from "@/components/organisms/TemplateCard";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { ConfirmModal } from "@/components/molecules/Modal";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { IconButton } from "@/components/primitives/IconButton";
import { createInvitation, getInvitationImagePresignedUrl, uploadImageToS3 } from "@/lib/api/invitations";
import { getTemplates } from "@/lib/api/templates";

type Step =
  | "start"
  | "templateCategory"
  | "templateList"
  | "templatePreview"
  | "blankTemplate"
  | "basicInfo"
  | "schedule"
  | "design"
  | "publishComplete";

interface FormData {
  templateId: string;
  title: string;
  description: string;
  mainImageKey: string;
  date: string;
  time: string;
  placeName: string;
  address: string;
}

const DEFAULT_COVER_KEY = "defaults/cover.jpg";

const DESIGN_LAYOUTS = [
  { id: "poster", label: "포스터형" },
  { id: "card", label: "카드형" },
  { id: "feed", label: "피드형" },
] as const;

const DESIGN_BG_COLORS = [
  { cls: "bg-pink-200", hex: "#FBCFE8" },
  { cls: "bg-yellow-200", hex: "#FEF08A" },
  { cls: "bg-blue-200", hex: "#BFDBFE" },
  { cls: "bg-green-200", hex: "#BBF7D0" },
  { cls: "bg-purple-200", hex: "#E9D5FF" },
  { cls: "bg-orange-200", hex: "#FED7AA" },
  { cls: "bg-red-200", hex: "#FECACA" },
  { cls: "bg-teal-200", hex: "#99F6E4" },
  { cls: "bg-indigo-200", hex: "#C7D2FE" },
  { cls: "bg-white", hex: "#FFFFFF" },
] as const;

const DESIGN_FONTS = [
  { id: "default", label: "기본", style: "font-sans" },
  { id: "gothic", label: "고딕체", style: "font-sans font-bold tracking-tighter" },
  { id: "serif", label: "명조체", style: "font-serif" },
  { id: "mono", label: "모노", style: "font-mono" },
] as const;

const DESIGN_BUTTON_COLORS = [
  "#FFE1EF", "#FEF08A", "#BFDBFE", "#BBF7D0",
  "#E9D5FF", "#FED7AA", "#FECACA", "#99F6E4",
] as const;

type DesignLayout = typeof DESIGN_LAYOUTS[number]["id"];
type DesignFont = typeof DESIGN_FONTS[number]["id"];

function toEventStartAt(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const iso = date.replace(/\./g, "-");
  return time ? new Date(`${iso}T${time}:00`).toISOString() : new Date(iso).toISOString();
}

export default function InvitationCreateContainer() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("start");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [previewTemplateId, setPreviewTemplateId] = useState<string>("");
  const [titleError, setTitleError] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(false);
  const [dateUnknown, setDateUnknown] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationMode, setLocationMode] = useState<"search" | "manual" | "selected">("search");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<Place[]>([]);
  const [locationSearchState, setLocationSearchState] = useState<"default" | "loading" | "no-result" | "error">("default");
  const [locationUnknown, setLocationUnknown] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishError, setPublishError] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [createdInvitationId, setCreatedInvitationId] = useState<string>("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<"rsvp" | "privacy">("rsvp");
  // design
  const [designPanel, setDesignPanel] = useState<"layout" | "bgColor" | "font" | "button">("layout");
  const [designLayout, setDesignLayout] = useState<DesignLayout>("poster");
  const [designBgColor, setDesignBgColor] = useState("bg-pink-200");
  const [designFont, setDesignFont] = useState<DesignFont>("default");
  const [designButtonColor, setDesignButtonColor] = useState("#FFE1EF");
  // RSVP
  const [rsvpEnabled, setRsvpEnabled] = useState(true);
  const [capacityLimitEnabled, setCapacityLimitEnabled] = useState(false);
  const [companionAllowed, setCompanionAllowed] = useState(true);
  const [rsvpDeadlineEnabled, setRsvpDeadlineEnabled] = useState(false);
  // Privacy
  const [privacy, setPrivacy] = useState<"public" | "link" | "password">("public");
  const [participantListPublic, setParticipantListPublic] = useState(false);
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [albumEnabled, setAlbumEnabled] = useState(true);
  const [searchExposed, setSearchExposed] = useState(true);
  const [form, setForm] = useState<FormData>({
    templateId: "",
    title: "",
    description: "",
    mainImageKey: DEFAULT_COVER_KEY,
    date: "",
    time: "",
    placeName: "",
    address: "",
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const { mutate: publish, isPending } = useMutation({
    mutationFn: () =>
      createInvitation({
        title: form.title,
        description: form.description,
        mainImageKey: form.mainImageKey,
        templateId: form.templateId || undefined,
        eventStartAt: toEventStartAt(form.date, form.time),
      }),
    onSuccess: (data) => { setCreatedInvitationId(data.id); setStep("publishComplete"); },
    onError: () => setPublishError(true),
  });

  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const handleImageFile = async (file: File) => {
    setImageUploading(true);
    setImageUploadError(false);
    try {
      const contentType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";
      const { presignedUrl, key } = await getInvitationImagePresignedUrl(file.name, contentType);
      await uploadImageToS3(presignedUrl, file);
      set({ mainImageKey: key });
    } catch {
      setImageUploadError(true);
    } finally {
      setImageUploading(false);
    }
  };

  const handleLocationQueryChange = (q: string) => {
    setLocationQuery(q);
    clearTimeout(locationDebounceRef.current);
    if (!q.trim()) {
      setLocationResults([]);
      setLocationSearchState("default");
      return;
    }
    setLocationSearchState("loading");
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const { places } = await searchPlaces(q);
        setLocationResults(places);
        setLocationSearchState(places.length === 0 ? "no-result" : "default");
      } catch {
        setLocationSearchState("error");
      }
    }, 400);
  };

  // start
  if (step === "start") {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" onBack={() => router.back()} />
        <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <Icon name="send" size="xl" color="primary" decorative />
          <h1 className="text-[22px] font-extrabold text-text-primary">어떻게 시작할까요?</h1>
          <div className="mt-4 flex w-full max-w-xs flex-col gap-3">
            <Button variant="primary" size="lg" fullWidth onClick={() => setStep("templateCategory")}>
              템플릿으로 시작
            </Button>
            <Button variant="outline" size="lg" fullWidth onClick={() => setStep("blankTemplate")}>
              빈 화면에서 시작
            </Button>
          </div>
        </main>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // blankTemplate
  if (step === "blankTemplate") {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="템플릿" onBack={() => setStep("start")} />
        <main className="flex min-h-0 flex-1 flex-col items-center justify-center overflow-y-auto px-5 py-4 text-center">
          <div className="flex flex-col items-center gap-3">
            <Icon name="palette" size="xl" color="inactive" decorative />
            <p className="text-[15px] font-semibold text-text-primary">빈 화면에서 시작</p>
            <p className="text-[13px] text-text-tertiary">처음부터 직접 디자인할 수 있어요</p>
          </div>
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "다음", onClick: () => setStep("basicInfo") }} />
        </div>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // templateCategory
  if (step === "templateCategory") {
    const categories = [...new Set(templates.map((t) => t.theme))].filter(Boolean);
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="템플릿 카테고리" onBack={() => setStep("start")} />
        <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
          {categories.map((c) => (
            <Button
              key={c}
              variant="outline"
              size="lg"
              fullWidth
              onClick={() => { setSelectedCategory(c); setStep("templateList"); }}
            >
              {c}
            </Button>
          ))}
        </main>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // templateList
  if (step === "templateList") {
    const filtered = selectedCategory ? templates.filter((t) => t.theme === selectedCategory) : templates;
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="템플릿" onBack={() => setStep("templateCategory")} />
        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((t) => (
              <TemplateCard
                key={t.id}
                name={t.name}
                imageUrl={t.previewImageKey}
                variant={form.templateId === t.id ? "selected" : "basic"}
                onClick={() => { setPreviewTemplateId(t.id); setStep("templatePreview"); }}
              />
            ))}
          </div>
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA
            primary={{
              label: form.templateId ? "이 템플릿으로 시작" : "다음",
              disabled: !form.templateId,
              onClick: () => setStep("basicInfo"),
            }}
          />
        </div>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // templatePreview
  if (step === "templatePreview") {
    const previewTemplate = templates.find((t) => t.id === previewTemplateId);
    const slides = previewTemplate?.previewImageKey
      ? [{ src: previewTemplate.previewImageKey, alt: previewTemplate.name }]
      : [];
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="템플릿" onBack={() => setStep("templateList")} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <AutoSlide slides={slides} intervalMs={4000} />
          {previewTemplate && (
            <p className="text-center text-[13px] text-text-tertiary">{previewTemplate.name}</p>
          )}
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA
            primary={{
              label: "선택",
              onClick: () => { set({ templateId: previewTemplateId }); setStep("templateList"); },
            }}
          />
        </div>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // basicInfo
  if (step === "basicInfo") {
    const handleNext = () => {
      if (!form.title.trim()) { setTitleError(true); return; }
      setStep("schedule");
    };
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="기본 정보" onBack={() => setStep(form.templateId ? "templateList" : "start")} />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <FormField label="대표 이미지">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); e.target.value = ""; }}
            />
            {imageUploading ? (
              <div className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl bg-gray-100">
                <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              </div>
            ) : imageUploadError ? (
              <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-3xl bg-red-50">
                <Icon name="alert-triangle" size="lg" color="danger" decorative />
                <Button variant="text" size="sm" onClick={() => fileInputRef.current?.click()}>다시 시도</Button>
              </div>
            ) : !form.templateId && form.mainImageKey === DEFAULT_COVER_KEY ? (
              <button
                type="button"
                className="flex aspect-[4/5] w-full items-center justify-center rounded-3xl border-2 border-dashed border-border-strong bg-gray-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center gap-2 text-text-tertiary">
                  <Icon name="image" size="xl" color="inactive" decorative />
                  <span className="text-[13px]">사진을 추가해보세요</span>
                </div>
              </button>
            ) : (
              <button type="button" className="w-full" onClick={() => fileInputRef.current?.click()}>
                <InvitationCover
                  imageUrl={form.mainImageKey !== DEFAULT_COVER_KEY ? form.mainImageKey : undefined}
                  variant={form.mainImageKey !== DEFAULT_COVER_KEY ? "image" : "no-image"}
                />
              </button>
            )}
          </FormField>
          <FormField label="제목" required counter={{ current: form.title.length, max: 30 }} error={titleError ? "제목을 입력해주세요" : undefined}>
            <TextInput
              value={form.title}
              onChange={(e) => { set({ title: e.target.value }); if (titleError) setTitleError(false); }}
              placeholder="예: 와라의 생일 파티"
              maxLength={30}
            />
          </FormField>
          <FormField label="설명" counter={{ current: form.description.length, max: 500 }}>
            <Textarea
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="간단한 소개를 적어주세요"
              rows={4}
            />
          </FormField>
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "다음", onClick: handleNext }} />
        </div>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // schedule (날짜·시간 + 장소 통합)
  if (step === "schedule") {
    const handleNext = () => {
      const hasDateError = !form.date && !dateUnknown;
      const hasTimeError = !form.time && !timeUnknown;
      const hasLocationError = !form.placeName && !locationUnknown;
      if (hasDateError) setDateError(true);
      if (hasTimeError) setTimeError(true);
      if (hasLocationError) setLocationError(true);
      if (hasDateError || hasTimeError || hasLocationError) return;
      setStep("design");
    };
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="날짜·장소" onBack={() => setStep("basicInfo")} />
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">
          <DateTimeSelector
            mode="date"
            label="모임 날짜"
            value={form.date}
            onChange={(v) => { set({ date: v }); if (dateError) setDateError(false); }}
            unknownToggle
            unknown={dateUnknown}
            onUnknownChange={(v) => { setDateUnknown(v); if (dateError) setDateError(false); }}
            error={dateError ? "날짜를 선택해주세요" : undefined}
          />
          <DateTimeSelector
            mode="time"
            label="시작 시간"
            value={form.time}
            onChange={(v) => { set({ time: v }); if (timeError) setTimeError(false); }}
            unknownToggle
            unknown={timeUnknown}
            onUnknownChange={(v) => { setTimeUnknown(v); if (timeError) setTimeError(false); }}
            error={timeError ? "시간을 선택해주세요" : undefined}
          />
          <div className="h-px bg-border" />
          <LocationSelector
            mode={locationUnknown ? "unknown" : locationMode}
            query={locationQuery}
            onQueryChange={handleLocationQueryChange}
            selected={locationMode === "selected" && form.placeName ? { name: form.placeName, address: form.address } : undefined}
            manualAddress={form.address}
            onManualAddressChange={(v) => { set({ placeName: v, address: v }); if (locationError) setLocationError(false); }}
            state={locationSearchState}
            onModeChange={(m) => {
              setLocationMode(m);
              setLocationResults([]);
              setLocationQuery("");
              setLocationSearchState("default");
              if (locationError) setLocationError(false);
            }}
            unknown={locationUnknown}
            onUnknownChange={(v) => { setLocationUnknown(v); if (locationError) setLocationError(false); }}
            error={locationError ? "장소를 선택해주세요" : undefined}
          />
          {locationMode === "search" && locationResults.length > 0 && (
            <div className="flex flex-col overflow-hidden rounded-2xl border border-border bg-surface">
              {locationResults.map((place) => (
                <button
                  key={place.placeId}
                  type="button"
                  className="flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
                  onClick={() => {
                    set({ placeName: place.placeName, address: place.roadAddress || place.address });
                    setLocationMode("selected");
                    setLocationResults([]);
                    setLocationQuery("");
                    setLocationSearchState("default");
                    if (locationError) setLocationError(false);
                  }}
                >
                  <span className="text-[14px] font-semibold text-text-primary">{place.placeName}</span>
                  <span className="text-[12px] text-text-tertiary">{place.roadAddress || place.address}</span>
                </button>
              ))}
            </div>
          )}
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "다음", onClick: handleNext }} />
        </div>
        <MainBottomNav activeKey="create" />
      </div>
    );
  }

  // publishComplete
  if (step === "publishComplete") {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="party-popper" size="xl" color="primary" decorative />
          <p className="text-[20px] font-bold text-text-primary">초대장이 만들어졌어요!</p>
          <p className="text-[14px] text-text-secondary">친구들에게 공유해보세요</p>
          <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
            <Button size="lg" variant="primary" fullWidth>
              공유하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              fullWidth
              onClick={() => router.push(createdInvitationId ? `/invitations/${createdInvitationId}` : "/invitations")}
            >
              초대장 보러가기
            </Button>
            <Button
              size="lg"
              variant="text"
              fullWidth
              onClick={() => router.push("/invitations")}
            >
              내 초대장 목록
            </Button>
          </div>
        </main>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  // design — ConfirmModal을 design JSX 안에 항상 마운트하고 open으로 제어
  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
      <TopAppBar
        className="shrink-0"
        title="디자인"
        onBack={() => setStep("schedule")}
        rightSlot={
          <IconButton
            icon="settings"
            aria-label="설정"
            variant="ghost"
            onClick={() => setSettingsOpen(true)}
          />
        }
      />
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {/* 미리보기 */}
        {designLayout === "poster" && (
          <InvitationCover
            imageUrl={form.mainImageKey !== DEFAULT_COVER_KEY ? form.mainImageKey : undefined}
            variant={form.mainImageKey !== DEFAULT_COVER_KEY ? "image" : "color"}
            backgroundClass={designBgColor}
          >
            {form.title ? (
              <p className={cn("text-[22px] font-bold text-white", DESIGN_FONTS.find((f) => f.id === designFont)?.style)}>
                {form.title}
              </p>
            ) : null}
          </InvitationCover>
        )}
        {designLayout === "card" && (
          <div className="overflow-hidden rounded-3xl border border-border">
            <InvitationCover
              imageUrl={form.mainImageKey !== DEFAULT_COVER_KEY ? form.mainImageKey : undefined}
              variant={form.mainImageKey !== DEFAULT_COVER_KEY ? "image" : "color"}
              backgroundClass={designBgColor}
              className="rounded-none"
              hideBottomGradient
            />
            <div className="flex flex-col gap-1 bg-white px-5 py-4">
              <p className={cn("text-[18px] font-bold text-text-primary", DESIGN_FONTS.find((f) => f.id === designFont)?.style)}>
                {form.title || "초대장 제목"}
              </p>
              {form.description ? (
                <p className={cn("text-[13px] text-text-secondary", DESIGN_FONTS.find((f) => f.id === designFont)?.style)}>
                  {form.description}
                </p>
              ) : null}
              <button
                type="button"
                className="mt-2 self-start rounded-full px-4 py-2 text-[13px] font-medium text-white"
                style={{ background: designButtonColor }}
              >
                참석하기
              </button>
            </div>
          </div>
        )}
        {designLayout === "feed" && (
          <div className="flex gap-3 overflow-hidden rounded-2xl border border-border p-3">
            <div className={cn("aspect-square w-20 shrink-0 overflow-hidden rounded-xl", designBgColor)}>
              {form.mainImageKey !== DEFAULT_COVER_KEY ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.mainImageKey} alt="" className="size-full object-cover" />
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col justify-center gap-1">
              <p className={cn("truncate text-[15px] font-bold text-text-primary", DESIGN_FONTS.find((f) => f.id === designFont)?.style)}>
                {form.title || "초대장 제목"}
              </p>
              {form.description ? (
                <p className={cn("line-clamp-2 text-[12px] text-text-secondary", DESIGN_FONTS.find((f) => f.id === designFont)?.style)}>
                  {form.description}
                </p>
              ) : null}
              <button
                type="button"
                className="mt-1 self-start rounded-full px-3 py-1 text-[11px] font-medium text-white"
                style={{ background: designButtonColor }}
              >
                참석하기
              </button>
            </div>
          </div>
        )}

        {/* Chip 탭 */}
        <div className="flex flex-wrap gap-1.5">
          {(["layout", "bgColor", "font", "button"] as const).map((panel) => {
            const label = { layout: "레이아웃", bgColor: "배경색", font: "폰트", button: "버튼" }[panel];
            return (
              <Chip
                key={panel}
                variant="filter"
                selected={designPanel === panel}
                onClick={() => setDesignPanel(panel)}
              >
                {label}
              </Chip>
            );
          })}
        </div>

        {/* 레이아웃 패널 */}
        {designPanel === "layout" && (
          <div className="grid grid-cols-3 gap-2">
            {DESIGN_LAYOUTS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDesignLayout(id)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 p-3 transition-colors",
                  designLayout === id ? "border-primary bg-primary-soft" : "border-border bg-surface",
                )}
              >
                <div
                  className={cn(
                    "w-full rounded-lg bg-gray-200",
                    id === "poster" && "aspect-[3/4]",
                    id === "card" && "aspect-[4/5]",
                    id === "feed" && "aspect-[16/7]",
                  )}
                />
                <span className={cn("text-[12px]", designLayout === id ? "font-semibold text-primary" : "text-text-secondary")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 배경색 패널 */}
        {designPanel === "bgColor" && (
          <div className="grid grid-cols-5 gap-2">
            {DESIGN_BG_COLORS.map(({ cls, hex }) => (
              <button
                key={cls}
                type="button"
                onClick={() => setDesignBgColor(cls)}
                className={cn(
                  "aspect-square rounded-2xl border-2",
                  cls,
                  designBgColor === cls ? "border-primary" : "border-transparent",
                )}
                style={{ boxShadow: cls === "bg-white" ? "inset 0 0 0 1px #e5e7eb" : undefined }}
                aria-label={hex}
              />
            ))}
          </div>
        )}

        {/* 폰트 패널 */}
        {designPanel === "font" && (
          <div className="grid grid-cols-2 gap-2">
            {DESIGN_FONTS.map(({ id, label, style }) => (
              <button
                key={id}
                type="button"
                onClick={() => setDesignFont(id)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-2xl border-2 px-3 py-4 transition-colors",
                  designFont === id ? "border-primary bg-primary-soft" : "border-border bg-surface",
                )}
              >
                <span className={cn("text-[28px]", style, designFont === id ? "text-primary" : "text-text-primary")}>
                  Aa
                </span>
                <span className={cn("text-[12px]", designFont === id ? "font-semibold text-primary" : "text-text-secondary")}>
                  {label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* 버튼 색상 패널 */}
        {designPanel === "button" && (
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-text-secondary">버튼 색상</p>
            <div className="grid grid-cols-4 gap-2">
              {DESIGN_BUTTON_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setDesignButtonColor(hex)}
                  className={cn(
                    "aspect-square rounded-2xl border-2",
                    designButtonColor === hex ? "border-primary" : "border-transparent",
                  )}
                  style={{ background: hex }}
                  aria-label={hex}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
              <span className="text-[13px] text-text-secondary">미리보기</span>
              <button
                type="button"
                className="rounded-full px-4 py-2 text-[13px] font-medium text-white"
                style={{ background: designButtonColor }}
              >
                참석하기
              </button>
            </div>
          </div>
        )}
      </main>
      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
              label: "초대장 만들기",
              onClick: () => {
                const isLoggedIn = document.cookie.split("; ").some((r) => r.startsWith("is_logged_in="));
                if (!isLoggedIn) { setLoginSheetOpen(true); return; }
                setShowPublishConfirm(true);
              },
            }}
          secondary={{ label: "임시저장" }}
        />
      </div>
      <MainBottomNav activeKey="create" />
      <BottomSheet open={settingsOpen} onOpenChange={setSettingsOpen}>
        <BottomSheetContent title="설정">
          {/* 탭 */}
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setSettingsTab("rsvp")}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${settingsTab === "rsvp" ? "bg-primary-soft text-primary" : "text-text-tertiary"}`}
            >
              RSVP
            </button>
            <button
              type="button"
              onClick={() => setSettingsTab("privacy")}
              className={`rounded-full px-3 py-1.5 text-[13px] font-medium ${settingsTab === "privacy" ? "bg-primary-soft text-primary" : "text-text-tertiary"}`}
            >
              공개 범위
            </button>
          </div>

          {settingsTab === "rsvp" && (
            <div className="flex flex-col gap-0 overflow-hidden rounded-2xl border border-border">
              <div className="flex items-center justify-between bg-surface px-4 py-3.5">
                <span className="text-[15px] font-semibold text-text-primary">RSVP 받기</span>
                <Switch checked={rsvpEnabled} onCheckedChange={setRsvpEnabled} />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3.5">
                <span className="text-[15px] text-text-primary">정원 제한</span>
                <Switch checked={capacityLimitEnabled} onCheckedChange={setCapacityLimitEnabled} />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3.5">
                <span className="text-[15px] text-text-primary">동반인 허용</span>
                <Switch checked={companionAllowed} onCheckedChange={setCompanionAllowed} />
              </div>
              <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3.5">
                <span className="text-[15px] text-text-primary">응답 마감일</span>
                <Switch checked={rsvpDeadlineEnabled} onCheckedChange={setRsvpDeadlineEnabled} />
              </div>
            </div>
          )}

          {settingsTab === "privacy" && (
            <div className="flex flex-col gap-3">
              <div className="overflow-hidden rounded-2xl border border-border">
                <RadioGroup value={privacy} onValueChange={(v) => setPrivacy(v as typeof privacy)}>
                  <label className="flex items-center gap-3 bg-surface px-4 py-3">
                    <Radio value="public" /><span className="text-[15px]">공개</span>
                  </label>
                  <label className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3">
                    <Radio value="link" /><span className="text-[15px]">링크 받은 사람만</span>
                  </label>
                  <label className="flex items-center gap-3 border-t border-border bg-surface px-4 py-3">
                    <Radio value="password" /><span className="text-[15px]">비밀번호 입력자만</span>
                  </label>
                </RadioGroup>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center justify-between bg-surface px-4 py-3.5">
                  <span className="text-[15px]">참석자 명단 공개</span>
                  <Switch checked={participantListPublic} onCheckedChange={setParticipantListPublic} />
                </div>
                <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3.5">
                  <span className="text-[15px]">댓글 허용</span>
                  <Switch checked={commentEnabled} onCheckedChange={setCommentEnabled} />
                </div>
                <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3.5">
                  <span className="text-[15px]">앨범 허용</span>
                  <Switch checked={albumEnabled} onCheckedChange={setAlbumEnabled} />
                </div>
                <div className="flex items-center justify-between border-t border-border bg-surface px-4 py-3.5">
                  <span className="text-[15px]">검색 노출</span>
                  <Switch checked={searchExposed} onCheckedChange={setSearchExposed} />
                </div>
              </div>
            </div>
          )}
        </BottomSheetContent>
      </BottomSheet>

      <ConfirmModal
        open={showPublishConfirm}
        onOpenChange={(v) => { if (!isPending) setShowPublishConfirm(v); }}
        title="초대장을 만들까요?"
        description={
          publishError
            ? "초대장 생성에 실패했어요. 다시 시도해주세요."
            : "초대장이 만들어지면 참석자 응답을 받을 수 있어요"
        }
        confirmLabel="만들기"
        loading={isPending}
        onConfirm={() => { setPublishError(false); publish(); }}
      />

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent title="로그인이 필요해요" description="초대장을 만들려면 먼저 로그인해주세요">
          <div className="flex flex-col gap-2.5 pt-2">
            {(["kakao", "naver", "google"] as const).map((provider) => {
              const config = {
                kakao: { label: "카카오로 시작하기", cls: "bg-[#FEE500] text-[#181600]", path: "kakao" },
                naver: { label: "네이버로 시작하기", cls: "bg-[#03C75A] text-white", path: "naver" },
                google: { label: "Google로 시작하기", cls: "border border-border bg-white text-text-primary", path: "google" },
              }[provider];
              const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => { window.location.href = `${apiBase}/auth/${config.path}/redirect`; }}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-[18px] text-[16px] font-bold ${config.cls}`}
                >
                  {config.label}
                </button>
              );
            })}
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}
