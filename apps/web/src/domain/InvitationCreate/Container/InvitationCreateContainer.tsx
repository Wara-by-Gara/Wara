"use client";

import { useRef, useState, useEffect } from "react";
import { cn } from "@/lib/cn";
import { searchPlaces } from "@/lib/api/locations";
import type { Place } from "@/lib/api/locations";
import { Chip } from "@/components/primitives/Chip";
import { Switch } from "@/components/primitives/Switch";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { FormField } from "@/components/molecules/FormField";
import { DateTimeSelector } from "@/components/molecules/DateTimeSelector";
import { LocationSelector } from "@/components/molecules/LocationSelector";
import { TemplateCard } from "@/components/organisms/TemplateCard";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { ConfirmModal } from "@/components/molecules/Modal";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { createInvitation, getInvitationImagePresignedUrl, uploadImageToS3 } from "@/lib/api/invitations";
import { GifPicker } from "@/components/organisms/GifPicker";
import { setEventLocation } from "@/lib/api/locations";
import { ROUTES } from "@/constants/routes";
import { getMissionTemplates, createMission } from "@/lib/api/missions";
import { getTemplates } from "@/lib/api/templates";
import { HostCreatingView, type VoteDraft } from "@/screens/DateVote/DateVote";
import { createPoll } from "@/lib/api/dateVote";

type Step =
  | "start"
  | "templateCategory"
  | "templateList"
  | "blankTemplate"
  | "basicInfo"
  | "scheduleAndMission"
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
  lat: number | null;
  lng: number | null;
  placeId: string;
}

const DEFAULT_COVER_KEY = "defaults/cover.jpg";

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

type DesignFont = typeof DESIGN_FONTS[number]["id"];

type RsvpType = "attending" | "maybe" | "declined";

interface RsvpOption {
  emoji: string;
  label: string;
}

const DEFAULT_RSVP: Record<RsvpType, RsvpOption> = {
  attending: { emoji: "🎉", label: "참석" },
  maybe:     { emoji: "🤔", label: "미정" },
  declined:  { emoji: "😭", label: "불참" },
};

const RSVP_DEFAULT_LABELS: Record<RsvpType, string> = {
  attending: "참석",
  maybe: "미정",
  declined: "불참",
};

const RSVP_PACKS: { id: string; name: string; attending: string; maybe: string; declined: string }[] = [
  { id: "default", name: "기본",   attending: "🎉", maybe: "🤔", declined: "😭" },
  { id: "heart",   name: "하트",   attending: "❤️", maybe: "❤️‍🩹", declined: "💔" },
  { id: "bloom",   name: "꽃",     attending: "💐", maybe: "🌷", declined: "🥀" },
  { id: "flirty",  name: "설레임", attending: "😘", maybe: "👄", declined: "🤐" },
  { id: "weather", name: "날씨",   attending: "☀️", maybe: "⛅", declined: "🌧️" },
  { id: "hands",   name: "손짓",   attending: "👍", maybe: "🤷", declined: "👎" },
  { id: "face",    name: "표정",   attending: "😊", maybe: "😶", declined: "😞" },
];

type MissionItem =
  | { type: "template"; templateId: string; content: string }
  | { type: "custom"; localId: string; content: string };

const MAX_MISSIONS = 10;

function MissionTemplateSection({
  selectedMissions,
  onToggle,
  maxReached,
}: {
  selectedMissions: MissionItem[];
  onToggle: (t: { id: string; content: string }) => void;
  maxReached: boolean;
}) {
  const { data: missionTemplates = [], isLoading } = useQuery({
    queryKey: ["missionTemplates"],
    queryFn: getMissionTemplates,
  });

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-2xl bg-gray-100" />;
  }

  if (missionTemplates.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-[14px] font-semibold text-text-primary">시스템 미션</p>
      <div className="flex flex-col gap-2">
        {missionTemplates.map((t) => {
          const isSelected = selectedMissions.some(
            (m) => m.type === "template" && m.templateId === t.id,
          );
          const disabled = !isSelected && maxReached;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(t)}
              className={cn(
                "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors",
                isSelected
                  ? "border-primary bg-primary-soft"
                  : disabled
                  ? "border-border bg-gray-50 opacity-50"
                  : "border-border bg-surface hover:bg-gray-50",
              )}
            >
              <span className={cn("flex-1 text-[14px]", isSelected ? "font-semibold text-primary" : "text-text-primary")}>
                {t.content}
              </span>
              {isSelected && (
                <Icon name="check" size="sm" color="primary" decorative />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function toEventStartAt(date: string, time: string): string | undefined {
  if (!date) return undefined;
  const iso = date.replace(/\./g, "-");
  return time ? new Date(`${iso}T${time}:00`).toISOString() : new Date(iso).toISOString();
}

export default function InvitationCreateContainer() {
  const router = useRouter();
  const { isLoggedIn, hydrate, login } = useAuthStore();

  useEffect(() => { hydrate(); }, [hydrate]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("start");
  useEffect(() => { window.scrollTo(0, 0); }, [step]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [titleError, setTitleError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(false);
  const [dateUnknown, setDateUnknown] = useState(false);
  const [dateError, setDateError] = useState(false);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationMode, setLocationMode] = useState<"search" | "selected">("search");
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState<Place[]>([]);
  const [locationSearchState, setLocationSearchState] = useState<"default" | "loading" | "no-result" | "error">("default");
  const [locationUnknown, setLocationUnknown] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishError, setPublishError] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [createdInvitationId, setCreatedInvitationId] = useState<string>("");
  const [shareCopied, setShareCopied] = useState(false);
  // vote draft
  const [subScreen, setSubScreen] = useState<"dateVoteSetup" | null>(null);
  const [voteDraft, setVoteDraft] = useState<VoteDraft | null>(null);
  // design
  const [designPanel, setDesignPanel] = useState<"bgColor" | "font">("bgColor");
  const [designBgColor, setDesignBgColor] = useState("bg-white");
  const [designFont, setDesignFont] = useState<DesignFont>("default");
  // rsvp
  const [rsvpOptions, setRsvpOptions] = useState<Record<RsvpType, RsvpOption>>(DEFAULT_RSVP);
  const [selectedPackId, setSelectedPackId] = useState<string>("default");
  const [packDropdownOpen, setPackDropdownOpen] = useState(false);
  const [editingRsvp, setEditingRsvp] = useState<RsvpType | null>(null);
  // main image
  const [mainGifUrl, setMainGifUrl] = useState("");
  const [imageTab, setImageTab] = useState<"upload" | "gif">("upload");
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  // mission
  const [missionEnabled, setMissionEnabled] = useState(false);
  const [selectedMissions, setSelectedMissions] = useState<MissionItem[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [missionError, setMissionError] = useState(false);
  const [form, setForm] = useState<FormData>({
    templateId: "",
    title: "",
    description: "",
    mainImageKey: DEFAULT_COVER_KEY,
    date: "",
    time: "",
    placeName: "",
    address: "",
    lat: null,
    lng: null,
    placeId: "",
  });

  // 로그인 리다이렉트 후 복귀 처리
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth_success") !== "1") return;

    login();

    // 다른 페이지에서 로그인 후 이 페이지에 착지한 경우 → 원래 페이지로 복귀
    const returnTo = sessionStorage.getItem("wara_oauth_return");
    if (returnTo) {
      sessionStorage.removeItem("wara_oauth_return");
      router.replace(returnTo);
      return;
    }

    // 초대장 만들기 흐름에서 로그인 후 복귀 → 폼 상태 복원
    const raw = localStorage.getItem("wara_invite_pending");
    if (!raw) { window.history.replaceState({}, "", "/invitations/create"); return; }
    try {
      const saved = JSON.parse(raw) as {
        form: FormData; designBgColor: string; designFont: DesignFont;
        missionEnabled: boolean; selectedMissions: MissionItem[];
        dateUnknown: boolean; timeUnknown: boolean; locationUnknown: boolean;
        rsvpOptions?: Record<RsvpType, RsvpOption>;
      };
      setForm(saved.form);
      setDesignBgColor(saved.designBgColor);
      setDesignFont(saved.designFont);
      setMissionEnabled(saved.missionEnabled);
      setSelectedMissions(saved.selectedMissions);
      setDateUnknown(saved.dateUnknown);
      setTimeUnknown(saved.timeUnknown);
      setLocationUnknown(saved.locationUnknown);
      if (saved.rsvpOptions) {
        setRsvpOptions(saved.rsvpOptions);
        const matched = RSVP_PACKS.find(
          (p) => p.attending === saved.rsvpOptions!.attending.emoji &&
                 p.maybe === saved.rsvpOptions!.maybe.emoji &&
                 p.declined === saved.rsvpOptions!.declined.emoji,
        );
        setSelectedPackId(matched?.id ?? "");
      }
      setStep("design");
      setShowPublishConfirm(true);
    } catch { /* ignore */ }
    localStorage.removeItem("wara_invite_pending");
    window.history.replaceState({}, "", "/invitations/create");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    queryFn: getTemplates,
  });

  const { mutate: publish, isPending } = useMutation({
    mutationFn: async () => {
      const invitation = await createInvitation({
        title: form.title,
        description: form.description,
        ...(mainGifUrl ? { mainGifUrl } : { mainImageKey: form.mainImageKey }),
        templateId: form.templateId || undefined,
        eventStartAt: toEventStartAt(form.date, form.time),
        bgColor: designBgColor,
        font: designFont,
        isMissionEnabled: missionEnabled,
        rsvpAttendingEmoji: rsvpOptions.attending.emoji,
        rsvpAttendingLabel: rsvpOptions.attending.label,
        rsvpMaybeEmoji: rsvpOptions.maybe.emoji,
        rsvpMaybeLabel: rsvpOptions.maybe.label,
        rsvpDeclinedEmoji: rsvpOptions.declined.emoji,
        rsvpDeclinedLabel: rsvpOptions.declined.label,
      });
      if (!locationUnknown && form.placeName && form.lat !== null && form.lng !== null) {
        await setEventLocation(invitation.id, {
          placeName: form.placeName,
          address: form.address,
          lat: form.lat,
          lng: form.lng,
          placeId: form.placeId,
        });
      }
      if (missionEnabled && selectedMissions.length > 0) {
        await Promise.all(
          selectedMissions.map((m) =>
            createMission(
              invitation.id,
              m.type === "template" ? { templateId: m.templateId } : { content: m.content },
            ),
          ),
        );
      }
      return invitation;
    },
    onSuccess: async (data) => {
      setCreatedInvitationId(data.id);
      if (voteDraft) {
        try { await createPoll(data.id, voteDraft); } catch { /* invitation은 이미 생성됨 */ }
      }
      setStep("publishComplete");
    },
    onError: () => setPublishError(true),
  });

  const set = (patch: Partial<FormData>) => setForm((f) => ({ ...f, ...patch }));

  const handleImageFile = async (file: File) => {
    setImageUploading(true);
    setImageUploadError(false);
    setMainGifUrl("");
    setLocalPreviewUrl(URL.createObjectURL(file));
    try {
      const contentType = file.type as "image/jpeg" | "image/png" | "image/webp" | "image/heic" | "image/heif";
      const { presignedUrl, key } = await getInvitationImagePresignedUrl(file.name, contentType);
      await uploadImageToS3(presignedUrl, file);
      set({ mainImageKey: key });
      setImageError(false);
    } catch {
      setLocalPreviewUrl(null);
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

  // vote setup subscreen
  if (subScreen === "dateVoteSetup") {
    return (
      <HostCreatingView
        onBack={() => setSubScreen(null)}
        initialDraft={voteDraft ?? undefined}
        onDraftComplete={(draft) => {
          setVoteDraft(draft);
          setSubScreen(null);
        }}
      />
    );
  }

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
                onClick={() => {
                  if (form.templateId === t.id) {
                    set({ templateId: "", mainImageKey: DEFAULT_COVER_KEY });
                    setLocalPreviewUrl(null);
                  } else {
                    set({ templateId: t.id, mainImageKey: t.previewImageKey ?? DEFAULT_COVER_KEY });
                    setLocalPreviewUrl(null);
                  }
                }}
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
      </div>
    );
  }

  // basicInfo
  if (step === "basicInfo") {
    const handleNext = () => {
      const needsImage = !form.templateId && form.mainImageKey === DEFAULT_COVER_KEY && !mainGifUrl;
      if (needsImage) { setImageError(true); }
      if (!form.title.trim()) { setTitleError(true); }
      if (needsImage || !form.title.trim()) return;
      setStep("scheduleAndMission");
    };
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="어떤 모임인가요?" onBack={() => setStep(form.templateId ? "templateList" : "start")} />
        <div className="h-1 w-full shrink-0 bg-border">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: "33%" }} />
        </div>
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          <FormField label="대표 이미지">
            {form.templateId ? (
              <InvitationCover
                imageUrl={localPreviewUrl ?? (form.mainImageKey !== DEFAULT_COVER_KEY ? form.mainImageKey : undefined)}
                variant={localPreviewUrl || form.mainImageKey !== DEFAULT_COVER_KEY ? "image" : "no-image"}
              />
            ) : (
              <>
                {/* 탭: 이미지 업로드 / GIF */}
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageTab("upload")}
                    className={cn(
                      "rounded-full px-3 py-1 text-[13px] font-semibold transition-colors",
                      imageTab === "upload" ? "bg-primary text-text-inverse" : "bg-gray-100 text-text-secondary",
                    )}
                  >
                    이미지 업로드
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab("gif")}
                    className={cn(
                      "rounded-full px-3 py-1 text-[13px] font-semibold transition-colors",
                      imageTab === "gif" ? "bg-primary text-text-inverse" : "bg-gray-100 text-text-secondary",
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
                    ) : !localPreviewUrl && form.mainImageKey === DEFAULT_COVER_KEY ? (
                      <button
                        type="button"
                        className={cn(
                          "flex aspect-[4/5] w-full items-center justify-center rounded-3xl border-2 border-dashed",
                          imageError ? "border-danger bg-red-50" : "border-border-strong bg-gray-50",
                        )}
                        onClick={() => { fileInputRef.current?.click(); }}
                      >
                        <div className="flex flex-col items-center gap-2 text-text-tertiary">
                          <Icon name="image" size="xl" color={imageError ? "danger" : "inactive"} decorative />
                          <span className={cn("text-[13px]", imageError && "text-danger")}>
                            {imageError ? "대표 이미지를 추가해주세요" : "사진을 추가해보세요"}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button type="button" className="w-full" onClick={() => fileInputRef.current?.click()}>
                        <InvitationCover
                          imageUrl={localPreviewUrl ?? form.mainImageKey}
                          variant="image"
                        />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {mainGifUrl ? (
                      <div className="relative w-full">
                        <button type="button" className="w-full" onClick={() => setGifPickerOpen(true)}>
                          <InvitationCover gifUrl={mainGifUrl} variant="image" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setMainGifUrl(""); setGifPickerOpen(false); }}
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
                          "flex aspect-[4/5] w-full items-center justify-center rounded-3xl border-2 border-dashed",
                          imageError ? "border-danger bg-red-50" : "border-border-strong bg-gray-50",
                        )}
                        onClick={() => setGifPickerOpen(true)}
                      >
                        <div className="flex flex-col items-center gap-2 text-text-tertiary">
                          <span className={cn("text-[28px] font-bold", imageError && "text-danger")}>GIF</span>
                          <span className={cn("text-[13px]", imageError && "text-danger")}>
                            {imageError ? "대표 이미지를 추가해주세요" : "GIF를 선택해보세요"}
                          </span>
                        </div>
                      </button>
                    )}
                    {gifPickerOpen ? (
                      <div className="mt-2">
                        <GifPicker
                          onSelect={(url) => { setMainGifUrl(url); set({ mainImageKey: DEFAULT_COVER_KEY }); setLocalPreviewUrl(null); setGifPickerOpen(false); setImageError(false); }}
                          onClose={() => setGifPickerOpen(false)}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </>
            )}
          </FormField>
          <FormField label="어떤 모임인가요?" required counter={{ current: form.title.length, max: 30 }} error={titleError ? "모임 이름을 입력해주세요" : undefined}>
            <TextInput
              value={form.title}
              onChange={(e) => { set({ title: e.target.value }); if (titleError) setTitleError(false); }}
              placeholder="예: 와라의 생일 파티"
              maxLength={30}
            />
          </FormField>
          <FormField label="모임 소개" counter={{ current: form.description.length, max: 500 }}>
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
      </div>
    );
  }

  // scheduleAndMission (날짜·시간 + 장소 + 미션 통합)
  if (step === "scheduleAndMission") {
    const toggleTemplate = (t: { id: string; content: string }) => {
      setMissionError(false);
      setSelectedMissions((prev) => {
        const exists = prev.some((m) => m.type === "template" && m.templateId === t.id);
        if (exists) return prev.filter((m) => !(m.type === "template" && m.templateId === t.id));
        if (prev.length >= MAX_MISSIONS) return prev;
        return [...prev, { type: "template", templateId: t.id, content: t.content }];
      });
    };

    const addCustom = () => {
      const trimmed = customInput.trim();
      if (!trimmed) return;
      if (selectedMissions.length >= MAX_MISSIONS) return;
      setSelectedMissions((prev) => [...prev, { type: "custom", localId: String(Date.now()), content: trimmed }]);
      setCustomInput("");
      setMissionError(false);
    };

    const removeMission = (key: string) => {
      setSelectedMissions((prev) =>
        prev.filter((m) => (m.type === "template" ? m.templateId : m.localId) !== key),
      );
    };

    const handleNext = () => {
      const hasDateError = !form.date && !dateUnknown;
      const hasTimeError = !form.time && !timeUnknown;
      const hasLocationError = !form.placeName && !locationUnknown;
      if (hasDateError) setDateError(true);
      if (hasTimeError) setTimeError(true);
      if (hasLocationError) setLocationError(true);
      if (missionEnabled && selectedMissions.length === 0) setMissionError(true);
      if (hasDateError || hasTimeError || hasLocationError) return;
      if (missionEnabled && selectedMissions.length === 0) return;
      setStep("design");
    };

    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="언제, 어디서 만날까요?" onBack={() => setStep("basicInfo")} />
        <div className="h-1 w-full shrink-0 bg-border">
          <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: "66%" }} />
        </div>
        <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-4">

          {/* 날짜·시간 */}
          <DateTimeSelector
            mode="date"
            label="모임 날짜"
            value={form.date}
            onChange={(v) => { set({ date: v }); if (dateError) setDateError(false); }}
            unknownToggle
            unknown={dateUnknown}
            onUnknownChange={(v) => {
              setDateUnknown(v);
              if (v) { setTimeUnknown(true); set({ date: "", time: "" }); }
              else setTimeUnknown(false);
              if (dateError) setDateError(false);
            }}
            error={dateError ? "날짜를 선택해주세요" : undefined}
          />
          {!dateUnknown && (
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
          )}

          {/* 날짜 미정 → 투표 제안 배너 */}
          {dateUnknown && (
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
              {voteDraft ? (
                <div className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2.5">
                  <span className="text-[13px] font-semibold text-primary">✓ 투표 후보 {voteDraft.slots.length}개 설정됨</span>
                  <button type="button" onClick={() => setSubScreen("dateVoteSetup")}
                    className="text-[12px] text-text-tertiary underline">수정</button>
                </div>
              ) : (
                <Button variant="primary" size="md" fullWidth onClick={() => setSubScreen("dateVoteSetup")} className="mt-1">
                  날짜 투표 만들기
                </Button>
              )}
            </div>
          )}

          <div className="h-px bg-border" />

          {/* 장소 */}
          <LocationSelector
            mode={locationUnknown ? "unknown" : locationMode}
            query={locationQuery}
            onQueryChange={handleLocationQueryChange}
            selected={locationMode === "selected" && form.placeName ? { name: form.placeName, address: form.address } : undefined}
            state={locationSearchState}
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
                    set({ placeName: place.placeName, address: place.roadAddress || place.address, lat: place.lat, lng: place.lng, placeId: place.placeId });
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

          <div className="h-px bg-border" />

          {/* 미션 */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3.5">
            <div>
              <p className="text-[15px] font-semibold text-text-primary">미션 사용하기</p>
              <p className="text-[13px] text-text-tertiary">게스트에게 미션을 부여할 수 있어요</p>
            </div>
            <Switch checked={missionEnabled} onCheckedChange={(v) => { setMissionEnabled(v); setMissionError(false); }} />
          </div>

          {missionEnabled && (
            <>
              <MissionTemplateSection
                selectedMissions={selectedMissions}
                onToggle={toggleTemplate}
                maxReached={selectedMissions.length >= MAX_MISSIONS}
              />

              {/* 직접 입력 */}
              <section>
                <p className="mb-2 text-[14px] font-semibold text-text-primary">직접 입력</p>
                <div className="flex gap-2">
                  <TextInput
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="미션 내용을 입력하세요 (최대 200자)"
                    maxLength={200}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="md"
                    onClick={addCustom}
                    disabled={!customInput.trim() || selectedMissions.length >= MAX_MISSIONS}
                  >
                    추가
                  </Button>
                </div>
              </section>

              {/* 선택된 미션 목록 */}
              {selectedMissions.length > 0 && (
                <section>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-[14px] font-semibold text-text-primary">선택된 미션</p>
                    <span className={cn("text-[13px]", selectedMissions.length >= MAX_MISSIONS ? "text-danger" : "text-text-tertiary")}>
                      {selectedMissions.length}/{MAX_MISSIONS}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedMissions.map((m) => {
                      const key = m.type === "template" ? m.templateId : m.localId;
                      return (
                        <div key={key} className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-4 py-3">
                          <span className="flex-1 text-[14px] text-text-primary">{m.content}</span>
                          <button type="button" onClick={() => removeMission(key)} className="shrink-0 text-text-tertiary hover:text-danger">
                            <Icon name="x" size="sm" color="currentColor" decorative />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {missionError && (
                <p className="text-[13px] text-danger">미션을 최소 1개 이상 선택해주세요</p>
              )}
            </>
          )}
        </main>
        <div className="relative z-10 shrink-0">
          <StickyCTA primary={{ label: "다음", onClick: handleNext }} />
        </div>
      </div>
    );
  }

  // publishComplete
  if (step === "publishComplete") {
    const shareUrl = typeof window !== "undefined"
      ? `${window.location.origin}${ROUTES.PUBLIC.INVITATION(createdInvitationId)}`
      : "";
    const handleShare = async () => {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        navigator.share({ url: shareUrl }).catch(() => {});
        return;
      }
      await window.navigator.clipboard.writeText(shareUrl).catch(() => {});
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    };
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" title="초대장 만들기" />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="party-popper" size="xl" color="primary" decorative />
          <p className="text-[20px] font-bold text-text-primary">초대장이 만들어졌어요!</p>
          <p className="text-[14px] text-text-secondary">친구들에게 공유해보세요</p>
          <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
            <Button size="lg" variant="primary" fullWidth onClick={handleShare}>
              {shareCopied ? "링크 복사됨!" : "공유하기"}
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
      </div>
    );
  }

  // design — ConfirmModal을 design JSX 안에 항상 마운트하고 open으로 제어
  return (
    <div className={cn("relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col", designBgColor)}>
      <TopAppBar
        className="shrink-0"
        title="어떻게 꾸밀까요?"
        onBack={() => setStep("scheduleAndMission")}
      />
      <div className="h-1 w-full shrink-0 bg-border">
        <div className="h-full bg-primary transition-all duration-500 ease-out" style={{ width: "100%" }} />
      </div>
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
        {/* 미리보기 */}
        <InvitationCover
          imageUrl={localPreviewUrl ?? (form.mainImageKey !== DEFAULT_COVER_KEY ? form.mainImageKey : undefined)}
          variant={localPreviewUrl || form.mainImageKey !== DEFAULT_COVER_KEY ? "image" : "no-image"}
        >
          {form.title ? (
            <p className={cn("text-[22px] font-bold text-white", DESIGN_FONTS.find((f) => f.id === designFont)?.style)}>
              {form.title}
            </p>
          ) : null}
        </InvitationCover>

        {/* Chip 탭 */}
        <div className="flex flex-wrap gap-1.5">
          {(["bgColor", "font"] as const).map((panel) => {
            const label = { bgColor: "배경색", font: "폰트" }[panel];
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

        <div className="h-px bg-border" />

        {/* 참석 버튼 꾸미기 */}
        <div className="flex flex-col gap-3">
          <p className="text-[14px] font-semibold text-text-primary">참석 버튼 꾸미기</p>

          {/* 팩 선택 드롭다운 */}
          <div className="relative">
            {packDropdownOpen && (
              <div className="fixed inset-0 z-10" onClick={() => setPackDropdownOpen(false)} />
            )}
            <button
              type="button"
              onClick={() => setPackDropdownOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface px-4 py-3 transition-colors hover:bg-gray-50"
            >
              <div className="flex items-center gap-2">
                <span className="text-[20px] leading-none">
                  {RSVP_PACKS.find((p) => p.id === selectedPackId)?.attending ?? "🎉"}
                </span>
                <span className="text-[14px] font-semibold text-text-primary">
                  {RSVP_PACKS.find((p) => p.id === selectedPackId)?.name ?? "기본"}
                </span>
              </div>
              <span className={cn("transition-transform", packDropdownOpen ? "rotate-180" : "")}>
                <Icon name="chevron-down" size="sm" color="inactive" decorative />
              </span>
            </button>

            {packDropdownOpen && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
                {RSVP_PACKS.map((pack) => (
                  <button
                    key={pack.id}
                    type="button"
                    onClick={() => {
                      setRsvpOptions((prev) => ({
                        attending: { ...prev.attending, emoji: pack.attending },
                        maybe:     { ...prev.maybe,     emoji: pack.maybe     },
                        declined:  { ...prev.declined,  emoji: pack.declined  },
                      }));
                      setSelectedPackId(pack.id);
                      setPackDropdownOpen(false);
                      setEditingRsvp(null);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors",
                      selectedPackId === pack.id ? "bg-gray-100" : "hover:bg-gray-50",
                    )}
                  >
                    <span className="text-[20px] leading-none">{pack.attending}</span>
                    <span className="flex-1 text-[15px] font-semibold text-text-primary">{pack.name}</span>
                    {selectedPackId === pack.id && (
                      <Icon name="check" size="sm" color="primary" decorative />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 버튼 미리보기 + 문구 편집 */}
          <div className="grid grid-cols-3 gap-2">
            {(["attending", "maybe", "declined"] as RsvpType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setEditingRsvp(editingRsvp === type ? null : type)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-2xl border-2 px-3 py-4 transition-colors",
                  editingRsvp === type ? "border-primary bg-primary-soft" : "border-border bg-surface",
                )}
              >
                <span className="text-[32px] leading-none">{rsvpOptions[type].emoji}</span>
                <span className={cn("text-[13px]", editingRsvp === type ? "font-semibold text-primary" : "text-text-secondary")}>
                  {rsvpOptions[type].label}
                </span>
              </button>
            ))}
          </div>

          {editingRsvp && (
            <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
              <p className="text-[13px] font-semibold text-text-secondary">버튼 문구</p>
              <TextInput
                value={rsvpOptions[editingRsvp].label}
                onChange={(e) => setRsvpOptions((prev) => ({ ...prev, [editingRsvp]: { ...prev[editingRsvp], label: e.target.value } }))}
                placeholder={RSVP_DEFAULT_LABELS[editingRsvp]}
                maxLength={8}
              />
            </div>
          )}
        </div>

      </main>
      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: isLoggedIn ? "초대장 만들기" : "로그인하고 공유하기",
            onClick: () => {
              if (!isLoggedIn) {
                localStorage.setItem("wara_invite_pending", JSON.stringify({
                  form, designBgColor, designFont,
                  missionEnabled, selectedMissions,
                  dateUnknown, timeUnknown, locationUnknown,
                  rsvpOptions,
                }));
                setLoginSheetOpen(true);
                return;
              }
              setShowPublishConfirm(true);
            },
          }}
        />
      </div>
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
              const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("wara_oauth_return", "/invitations/create?auth_success=1");
                    window.location.href = `${apiBase}/auth/${config.path}/redirect`;
                  }}
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
