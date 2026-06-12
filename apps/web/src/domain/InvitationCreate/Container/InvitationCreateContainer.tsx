'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import imageCompression from 'browser-image-compression';
import type { Area } from 'react-easy-crop';
import { cn } from '@/lib/cn';
import { searchPlaces } from '@/lib/api/locations';
import type { Place } from '@/lib/api/locations';
import { Switch } from '@/components/primitives/Switch';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Icon } from '@/components/icons';
import { Button } from '@/components/primitives/Button';
import { TextInput } from '@/components/primitives/TextInput';
import { Textarea } from '@/components/primitives/Textarea';
import { TopAppBar } from '@/components/molecules/TopAppBar';
import { DateTimeSelector } from '@/components/molecules/DateTimeSelector';
import { LocationSelector } from '@/components/molecules/LocationSelector';
import { InvitationCover } from '@/components/organisms/InvitationCover';
import { StickyCTA } from '@/components/layout/StickyCTA';
import { ConfirmModal } from '@/components/molecules/Modal';
import {
  BottomSheet,
  BottomSheetContent,
} from '@/components/molecules/BottomSheet';
import { KakaoStaticMapPreview } from '@/components/molecules/KakaoStaticMapPreview/KakaoStaticMapPreview';
import {
  createInvitation,
  updateInvitation,
  getInvitationImagePresignedUrl,
  type Invitation,
} from '@/lib/api/invitations';
import { GifPicker } from '@/components/organisms/GifPicker';
import { setEventLocation, deleteEventLocation } from '@/lib/api/locations';
import { getMissionTemplates, createMission } from '@/lib/api/missions';
import { getTemplates } from '@/lib/api/templates';
import { ROUTES } from '@/constants/routes';
import { HostCreatingView, type VoteDraft } from '@/screens/DateVote/DateVote';
import ShareBottomSheet from '@/domain/Invitation/ShareBottomSheet';
import { createPoll } from '@/lib/api/dateVote';
import ImageCropEditor from '@/domain/Edit/InvitationCard/MainImageEditor/ImageCropEditor';
import { getCroppedImageBlob } from '@/utils/cropImage';
import {
  clampCoverRatio,
  isCoverRatioOutOfBounds,
  loadImageNaturalRatio,
} from '@/utils/invitationCoverAspect';
import { useLightTheme } from '@/hooks/useLightTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { CreateCanvas } from '@/domain/InvitationCreate/Canvas/CreateCanvas';
import {
  DEFAULT_COVER_KEY,
  DEFAULT_BG_COLOR,
  type DesignBgColor,
  DESIGN_BG_THEMES,
  DEFAULT_FONT,
  ANIMATIONS,
  type AnimationId,
  type DesignFont,
  type RsvpType,
  type RsvpOption,
  DEFAULT_RSVP,
  RSVP_DEFAULT_LABELS,
  RSVP_PACKS,
} from '@/domain/InvitationCreate/constants';

const COVER_CONTENT_TYPE = 'image/webp' as const;

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
  fee: string;
  dressCode: string;
  parkingInfo: string;
}

type MissionItem =
  | { type: 'template'; templateId: string; content: string }
  | { type: 'custom'; localId: string; content: string };

const MAX_MISSIONS = 10;

// 미션 내용 끝에 붙은 일련번호(시드 데이터 잔재) 제거 후 표시
const stripMissionNumber = (s: string) => s.replace(/\s+\d+$/, '');

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
    queryKey: ['missionTemplates'],
    queryFn: getMissionTemplates,
  });

  if (isLoading) {
    return <div className="h-24 animate-pulse rounded-md bg-surface" />;
  }

  if (missionTemplates.length === 0) return null;

  return (
    <section>
      <p className="mb-2 text-[14px] font-semibold text-text-primary">
        추천 미션
      </p>
      <div
        className="flex flex-col gap-2 overflow-y-auto"
        style={{ maxHeight: '200px' }}
      >
        {missionTemplates.map((t) => {
          const isSelected = selectedMissions.some(
            (m) => m.type === 'template' && m.templateId === t.id,
          );
          const disabled = !isSelected && maxReached;
          return (
            <button
              key={t.id}
              type="button"
              disabled={disabled}
              onClick={() => onToggle(t)}
              className={cn(
                'flex items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors',
                isSelected
                  ? 'border-primary bg-primary-soft'
                  : disabled
                    ? 'border-border bg-background-soft opacity-50'
                    : 'border-border bg-surface hover:bg-gray-50 transition-colors duration-150',
              )}
            >
              <span
                className={cn(
                  'flex-1 text-[14px]',
                  isSelected
                    ? 'font-semibold text-primary'
                    : 'text-text-primary',
                )}
              >
                {stripMissionNumber(t.content)}
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
  const iso = date.replace(/\./g, '-');
  // 시간 미설정 시 로컬 자정으로 저장 (UTC 자정 저장 시 KST에서 오전 9시로 오인됨)
  return new Date(`${iso}T${time || '00:00'}:00`).toISOString();
}

function parseEventStart(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' };
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = d.getHours();
  const m = d.getMinutes();
  // 로컬 자정 = 시간 미설정 규약
  const isMidnight = h === 0 && m === 0;
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: isMidnight ? '' : `${pad(h)}:${pad(m)}`,
  };
}

export default function InvitationCreateContainer({
  editInvitation,
}: { editInvitation?: Invitation } = {}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  useLightTheme();
  const { isLoggedIn, hydrated, hydrate, login } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, [hydrate]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const contentScrollRef = useRef<HTMLElement>(null);
  const [titleError, setTitleError] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUploadError, setImageUploadError] = useState(false);
  const [dateUnknown, setDateUnknown] = useState(true);
  const [dateError, setDateError] = useState(false);
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [timeError, setTimeError] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [locationMode, setLocationMode] = useState<'search' | 'selected'>(
    'search',
  );
  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<Place[]>([]);
  const [locationSearchState, setLocationSearchState] = useState<
    'default' | 'loading' | 'no-result' | 'error'
  >('default');
  const [locationPage, setLocationPage] = useState(1);
  const [locationIsLoadingMore, setLocationIsLoadingMore] = useState(false);
  // 더 불러올 결과가 있는지 — Kakao meta(totalCount/pageableCount 기반 isEnd)로 판단.
  // pageableCount = min(totalCount, 45)가 실제 fetch 가능 상한.
  const [locationHasMore, setLocationHasMore] = useState(false);
  // Kakao 검색 매칭 총수 — 45 상한에 막혀 일부만 노출될 때 안내용
  const [locationTotalCount, setLocationTotalCount] = useState(0);
  const [locationUnknown, setLocationUnknown] = useState(true);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const locationResultsRef = useRef<HTMLDivElement>(null);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [publishError, setPublishError] = useState(false);
  const [, setVotePollError] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [createdInvitationId, setCreatedInvitationId] = useState<string>("");
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [published, setPublished] = useState(false);
  // vote draft
  const [subScreen, setSubScreen] = useState<'dateVoteSetup' | null>(null);
  const [voteDraft, setVoteDraft] = useState<VoteDraft | null>(null);
  // design
  const [designBgColor, setDesignBgColor] =
    useState<DesignBgColor>(DEFAULT_BG_COLOR);
  const [designFont, setDesignFont] = useState<DesignFont>(DEFAULT_FONT);
  const [selectedAnimation, setSelectedAnimation] =
    useState<AnimationId>('none');
  const [bgColorSheetOpen, setBgColorSheetOpen] = useState(false);
  const [animationSheetOpen, setAnimationSheetOpen] = useState(false);
  const [optionsSheetOpen, setOptionsSheetOpen] = useState(false);
  const [missionSheetOpen, setMissionSheetOpen] = useState(false);
  // rsvp
  const [rsvpOptions, setRsvpOptions] =
    useState<Record<RsvpType, RsvpOption>>(DEFAULT_RSVP);
  const [selectedPackId, setSelectedPackId] = useState<string>('default');
  const [packDropdownOpen, setPackDropdownOpen] = useState(false);
  const [editingRsvp, setEditingRsvp] = useState<RsvpType | null>(null);
  // main image
  const [mainGifUrl, setMainGifUrl] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'gif'>('upload');
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropAspect, setCropAspect] = useState(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  // mission
  const [missionEnabled, setMissionEnabled] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [selectedMissions, setSelectedMissions] = useState<MissionItem[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [missionError, setMissionError] = useState(false);
  const [imageSheetOpen, setImageSheetOpen] = useState(false);
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [locationSheetOpen, setLocationSheetOpen] = useState(false);
  const [rsvpSheetOpen, setRsvpSheetOpen] = useState(false);
  const [form, setForm] = useState<FormData>({
    templateId: '',
    title: '',
    description: '',
    mainImageKey: DEFAULT_COVER_KEY,
    date: '',
    time: '',
    placeName: '',
    address: '',
    lat: null,
    lng: null,
    placeId: '',
    fee: '',
    dressCode: '',
    parkingInfo: '',
  });

  useEffect(() => {
    return () => {
      if (cropSrc) URL.revokeObjectURL(cropSrc);
    };
  }, [cropSrc]);

  // 수정 모드: 기존 초대장 데이터로 폼 초기화
  useEffect(() => {
    if (!editInvitation) return;
    const { date, time } = parseEventStart(editInvitation.eventStartAt);
    setForm({
      templateId: editInvitation.templateId ?? '',
      title: editInvitation.title,
      description: editInvitation.description,
      mainImageKey: editInvitation.mainImageKey ?? DEFAULT_COVER_KEY,
      date,
      time,
      placeName: editInvitation.eventLocation?.placeName ?? '',
      address: editInvitation.eventLocation?.address ?? '',
      lat: editInvitation.eventLocation?.lat ?? null,
      lng: editInvitation.eventLocation?.lng ?? null,
      placeId: editInvitation.eventLocation?.placeId ?? '',
      fee: editInvitation.fee ?? '',
      dressCode: editInvitation.dressCode ?? '',
      parkingInfo: editInvitation.parkingInfo ?? '',
    });
    setDesignBgColor(editInvitation.bgColor as DesignBgColor);
    setDesignFont(editInvitation.font as DesignFont);
    setSelectedAnimation((editInvitation.animation as AnimationId) ?? 'none');
    setRsvpOptions({
      attending: {
        emoji: editInvitation.rsvpAttendingEmoji,
        label: editInvitation.rsvpAttendingLabel,
      },
      maybe: {
        emoji: editInvitation.rsvpMaybeEmoji,
        label: editInvitation.rsvpMaybeLabel,
      },
      declined: {
        emoji: editInvitation.rsvpDeclinedEmoji,
        label: editInvitation.rsvpDeclinedLabel,
      },
    });
    // 적용된 이모지로 팩을 역매칭 (안 하면 수정 시 드롭다운이 '기본'으로 떠 오류처럼 보임)
    const matchedPack = RSVP_PACKS.find(
      (p) =>
        p.attending === editInvitation.rsvpAttendingEmoji &&
        p.maybe === editInvitation.rsvpMaybeEmoji &&
        p.declined === editInvitation.rsvpDeclinedEmoji,
    );
    setSelectedPackId(matchedPack?.id ?? '');
    if (editInvitation.mainCoverType === 'gif' && editInvitation.mainGifUrl) {
      setMainGifUrl(editInvitation.mainGifUrl);
    } else if (editInvitation.mainImageUrl) {
      setLocalPreviewUrl(editInvitation.mainImageUrl);
    }
    setMissionEnabled(editInvitation.isMissionEnabled);
    setIsPublic(editInvitation.isPublic ?? false);
    if (editInvitation.eventLocation) {
      setLocationMode('selected');
      setLocationUnknown(true);
    } else {
      setLocationUnknown(false);
    }
    setLocationResults([]);
    setLocationQuery('');
    setDateUnknown(!!date);
    setTimeUnknown(!!time);
    setVoteDraft(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editInvitation?.id]);

  // 로그인 리다이렉트 후 복귀 처리
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_success') !== '1') return;

    login();

    // 다른 페이지에서 로그인 후 이 페이지에 착지한 경우 → 원래 페이지로 복귀
    const returnTo = sessionStorage.getItem('wara_oauth_return');
    if (returnTo) {
      sessionStorage.removeItem('wara_oauth_return');
      router.replace(returnTo);
      return;
    }

    // 초대장 만들기 흐름에서 로그인 후 복귀 → 폼 상태 복원
    const raw = localStorage.getItem('wara_invite_pending');
    if (!raw) {
      window.history.replaceState({}, '', '/invitations/create');
      return;
    }
    try {
      const saved = JSON.parse(raw) as {
        form: FormData;
        designBgColor: string;
        designFont: DesignFont;
        selectedAnimation?: AnimationId;
        missionEnabled: boolean;
        selectedMissions: MissionItem[];
        dateUnknown: boolean;
        timeUnknown: boolean;
        locationUnknown: boolean;
        rsvpOptions?: Record<RsvpType, RsvpOption>;
      };
      setForm(saved.form);
      setDesignBgColor(saved.designBgColor as DesignBgColor);
      setDesignFont(saved.designFont);
      if (saved.selectedAnimation)
        setSelectedAnimation(saved.selectedAnimation);
      setMissionEnabled(saved.missionEnabled);
      setSelectedMissions(saved.selectedMissions);
      setDateUnknown(saved.dateUnknown);
      setTimeUnknown(saved.timeUnknown);
      setLocationUnknown(saved.locationUnknown);
      if (saved.rsvpOptions) {
        setRsvpOptions(saved.rsvpOptions);
        const matched = RSVP_PACKS.find(
          (p) =>
            p.attending === saved.rsvpOptions!.attending.emoji &&
            p.maybe === saved.rsvpOptions!.maybe.emoji &&
            p.declined === saved.rsvpOptions!.declined.emoji,
        );
        setSelectedPackId(matched?.id ?? '');
      }
      setShowPublishConfirm(true);
    } catch {
      /* ignore */
    }
    localStorage.removeItem('wara_invite_pending');
    window.history.replaceState({}, '', '/invitations/create');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { data: templates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: getTemplates,
  });

  useEffect(() => {
    if (
      editInvitation ||
      templates.length === 0 ||
      typeof window === 'undefined'
    )
      return;
    const tid = new URLSearchParams(window.location.search).get('templateId');
    if (!tid) return;
    const t = templates.find((item) => item.id === tid);
    if (!t) return;
    setForm((prev) => ({
      ...prev,
      templateId: t.id,
      mainImageKey: t.previewImageKey ?? prev.mainImageKey,
    }));
    window.history.replaceState({}, '', ROUTES.INVITATIONS.CREATE);
  }, [templates, editInvitation]);

  const { mutate: publish, isPending } = useMutation({
    mutationFn: async () => {
      // 수정 모드
      if (editInvitation) {
        const updated = await updateInvitation(editInvitation.id, {
          title: form.title,
          description: form.description,
          ...(mainGifUrl ? { mainGifUrl } : { mainImageKey: form.mainImageKey }),
          templateId: form.templateId || null,
          eventStartAt:
            toEventStartAt(form.date, timeUnknown ? form.time : '') ?? null,
          bgColor: designBgColor,
          font: designFont,
          animation: selectedAnimation,
          isMissionEnabled: missionEnabled,
          isPublic,
          fee: form.fee.trim() || null,
          dressCode: form.dressCode.trim() || null,
          parkingInfo: form.parkingInfo.trim() || null,
          rsvpAttendingEmoji: rsvpOptions.attending.emoji,
          rsvpAttendingLabel: rsvpOptions.attending.label,
          rsvpMaybeEmoji: rsvpOptions.maybe.emoji,
          rsvpMaybeLabel: rsvpOptions.maybe.label,
          rsvpDeclinedEmoji: rsvpOptions.declined.emoji,
          rsvpDeclinedLabel: rsvpOptions.declined.label,
        });
        if (
          locationUnknown &&
          form.placeName &&
          form.lat !== null &&
          form.lng !== null
        ) {
          await setEventLocation(updated.id, {
            placeName: form.placeName,
            address: form.address,
            lat: form.lat,
            lng: form.lng,
            placeId: form.placeId,
          });
        } else if (!locationUnknown) {
          await deleteEventLocation(updated.id);
        }
        return updated;
      }

      // 생성 모드
      const invitation = await createInvitation({
        title: form.title,
        description: form.description,
        ...(mainGifUrl ? { mainGifUrl } : { mainImageKey: form.mainImageKey }),
        templateId: form.templateId || undefined,
        eventStartAt: toEventStartAt(form.date, timeUnknown ? form.time : ''),
        bgColor: designBgColor,
        font: designFont,
        animation: selectedAnimation,
        isMissionEnabled: missionEnabled,
        isPublic,
        ...(form.fee.trim() ? { fee: form.fee.trim() } : {}),
        ...(form.dressCode.trim() ? { dressCode: form.dressCode.trim() } : {}),
        ...(form.parkingInfo.trim() ? { parkingInfo: form.parkingInfo.trim() } : {}),
        rsvpAttendingEmoji: rsvpOptions.attending.emoji,
        rsvpAttendingLabel: rsvpOptions.attending.label,
        rsvpMaybeEmoji: rsvpOptions.maybe.emoji,
        rsvpMaybeLabel: rsvpOptions.maybe.label,
        rsvpDeclinedEmoji: rsvpOptions.declined.emoji,
        rsvpDeclinedLabel: rsvpOptions.declined.label,
      });
      if (
        locationUnknown &&
        form.placeName &&
        form.lat !== null &&
        form.lng !== null
      ) {
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
              m.type === 'template'
                ? { templateId: m.templateId }
                : { content: m.content },
            ),
          ),
        );
      }
      return invitation;
    },
    onSuccess: async (data) => {
      if (editInvitation) {
        queryClient.setQueryData(
          QUERY_KEYS.invitations.detail(editInvitation.id),
          data,
        );
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.invitations.detail(editInvitation.id),
        });
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.invitations.myList(),
        });
        router.replace(`/invitations/${editInvitation.id}`);
        return;
      }
      setCreatedInvitationId(data.id);
      setVotePollError(false);
      if (voteDraft) {
        try {
          await createPoll(data.id, voteDraft);
          await queryClient.invalidateQueries({
            queryKey: QUERY_KEYS.invitations.detail(data.id),
          });
        } catch {
          setVotePollError(true);
        }
      }
      setPublished(true);
    },
    onError: () => setPublishError(true),
  });

  const set = (patch: Partial<FormData>) =>
    setForm((f) => ({ ...f, ...patch }));

  const uploadCoverBlob = useCallback(async (blob: Blob) => {
    const fileName = `main-${Date.now()}.webp`;
    const { presignedUrl, key } = await getInvitationImagePresignedUrl(
      fileName,
      COVER_CONTENT_TYPE,
    );
    await fetch(presignedUrl, {
      method: 'PUT',
      body: blob,
      headers: { 'Content-Type': COVER_CONTENT_TYPE },
    });
    setLocalPreviewUrl((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
      return URL.createObjectURL(blob);
    });
    set({ mainImageKey: key });
    setImageError(false);
  }, []);

  const handleImageFile = async (file: File) => {
    setImageUploadError(false);
    setMainGifUrl('');
    setImageUploading(true);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
      });
      const objectUrl = URL.createObjectURL(compressed);
      const naturalRatio = await loadImageNaturalRatio(objectUrl);

      if (isCoverRatioOutOfBounds(naturalRatio)) {
        setCropAspect(clampCoverRatio(naturalRatio));
        setCropSrc(objectUrl);
        setCroppedAreaPixels(null);
        return;
      }

      await uploadCoverBlob(compressed);
      URL.revokeObjectURL(objectUrl);
    } catch {
      setLocalPreviewUrl(null);
      setImageUploadError(true);
    } finally {
      setImageUploading(false);
    }
  };

  const handleCropCancel = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCroppedAreaPixels(null);
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setImageUploading(true);
    setImageUploadError(false);

    try {
      const blob = await getCroppedImageBlob(cropSrc, croppedAreaPixels);
      await uploadCoverBlob(blob);
      URL.revokeObjectURL(cropSrc);
      setCropSrc(null);
      setCroppedAreaPixels(null);
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
      setLocationSearchState('default');
      setLocationPage(1);
      setLocationHasMore(false);
      setLocationTotalCount(0);
      return;
    }
    setLocationSearchState('loading');
    setLocationPage(1);
    setLocationResults([]);
    setLocationHasMore(false);
    locationDebounceRef.current = setTimeout(async () => {
      try {
        const { places, meta } = await searchPlaces(q, 1);
        setLocationResults(places);
        setLocationTotalCount(meta.totalCount);
        // 아직 못 받은 노출가능 결과가 남았는지 (places.length < pageableCount && !isEnd)
        setLocationHasMore(!meta.isEnd && places.length < meta.pageableCount);
        setLocationSearchState(places.length === 0 ? 'no-result' : 'default');
      } catch (err) {
        // 디버깅: 실패 원인(에러 코드, 메시지)을 콘솔에 노출.
        // 카카오 API 키 만료/네트워크 오류/인증 실패 등을 구분하기 위함.
        console.error("[location-search]", err);
        setLocationSearchState("error");
      }
    }, 400);
  };

  const loadMoreLocationResults = async () => {
    if (locationIsLoadingMore || !locationHasMore || !locationQuery.trim())
      return;
    setLocationIsLoadingMore(true);
    try {
      const nextPage = locationPage + 1;
      const { places, meta } = await searchPlaces(locationQuery, nextPage);
      if (places.length > 0) {
        setLocationResults((prev) => {
          const idSet = new Set(prev.map((p) => p.placeId));
          const filtered = places.filter((p) => !idSet.has(p.placeId));
          return [...prev, ...filtered];
        });
        setLocationPage(nextPage);
      }
      // isEnd는 Kakao가 totalCount/pageableCount로 산출 → 남은 결과 판단의 단일 출처
      setLocationHasMore(!meta.isEnd && places.length > 0);
    } catch {
      /* ignore */
    } finally {
      setLocationIsLoadingMore(false);
    }
  };

  // 미션
  const toggleMissionTemplate = (t: { id: string; content: string }) => {
    setMissionError(false);
    setSelectedMissions((prev) => {
      const exists = prev.some(
        (m) => m.type === 'template' && m.templateId === t.id,
      );
      if (exists)
        return prev.filter(
          (m) => !(m.type === 'template' && m.templateId === t.id),
        );
      if (prev.length >= MAX_MISSIONS) return prev;
      return [
        ...prev,
        { type: 'template', templateId: t.id, content: t.content },
      ];
    });
  };

  const addCustomMission = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (selectedMissions.length >= MAX_MISSIONS) return;
    setSelectedMissions((prev) => [
      ...prev,
      { type: 'custom', localId: String(Date.now()), content: trimmed },
    ]);
    setCustomInput('');
    setMissionError(false);
  };

  const removeMission = (key: string) => {
    setSelectedMissions((prev) =>
      prev.filter(
        (m) => (m.type === 'template' ? m.templateId : m.localId) !== key,
      ),
    );
  };

  const validateAll = () => {
    const needsImage =
      !form.templateId &&
      form.mainImageKey === DEFAULT_COVER_KEY &&
      !mainGifUrl;
    const hasTitle = !!form.title.trim();
    const hasDateErr = !form.date && dateUnknown;
    const hasDateVoteErr = !dateUnknown && !voteDraft;
    const hasTimeErr = !form.time && timeUnknown;
    const hasLocErr = !form.placeName && locationUnknown;
    const hasMissionErr =
      missionEnabled && selectedMissions.length === 0 && !editInvitation;
    setImageError(needsImage);
    setTitleError(!hasTitle);
    setDateError(hasDateErr || hasDateVoteErr);
    setTimeError(hasTimeErr);
    setLocationError(hasLocErr);
    setMissionError(hasMissionErr);
    return (
      !needsImage &&
      hasTitle &&
      !hasDateErr &&
      !hasDateVoteErr &&
      !hasTimeErr &&
      !hasLocErr &&
      !hasMissionErr
    );
  };

  const handleSubmit = () => {
    if (!hydrated) return;
    if (!validateAll()) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!isLoggedIn) {
      localStorage.setItem(
        'wara_invite_pending',
        JSON.stringify({
          form,
          designBgColor,
          designFont,
          selectedAnimation,
          missionEnabled,
          selectedMissions,
          dateUnknown,
          timeUnknown,
          locationUnknown,
          rsvpOptions,
        }),
      );
      setLoginSheetOpen(true);
      return;
    }
    setShowPublishConfirm(true);
  };

  // vote setup subscreen
  if (subScreen === 'dateVoteSetup') {
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

  // publishComplete
  if (published) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar
          className="shrink-0"
          title="초대장 만들기"
          onBack={() => router.replace('/')}
        />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-page text-center">
          <Icon name="party-popper" size="xl" color="primary" decorative />
          <p className="text-[20px] font-bold text-text-primary">
            초대장이 만들어졌어요!
          </p>
          <p className="text-[14px] text-text-secondary">
            친구들에게 공유해보세요
          </p>
          <div className="mt-4 flex w-full max-w-xs flex-col gap-2">
            <Button
              size="lg"
              variant="primary"
              fullWidth
              onClick={() => setShareSheetOpen(true)}
            >
              공유하기
            </Button>
            <Button
              size="lg"
              variant="outline"
              fullWidth
              onClick={() =>
                router.replace(
                  createdInvitationId
                    ? `/invitations/${createdInvitationId}`
                    : '/invitations',
                )
              }
            >
              초대장 보러가기
            </Button>
            <Button
              size="lg"
              variant="text"
              fullWidth
              onClick={() => router.replace('/invitations')}
            >
              내 초대장 목록
            </Button>
          </div>
        </main>
        <ShareBottomSheet
          invitationId={createdInvitationId}
          open={shareSheetOpen}
          onOpenChange={setShareSheetOpen}
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
      <TopAppBar
        className="shrink-0"
        title={editInvitation ? '초대장 수정' : '초대장 만들기'}
        onBack={() => router.back()}
      />

      {/* WYSIWYG 캔버스 */}
      <CreateCanvas
        title={form.title}
        onTitleChange={(v) => {
          set({ title: v });
          if (titleError) setTitleError(false);
        }}
        titleError={titleError}
        titleFocused={titleFocused}
        onTitleFocus={() => setTitleFocused(true)}
        onTitleBlur={() => setTitleFocused(false)}
        designFont={designFont}
        onFontChange={setDesignFont}
        coverImageUrl={
          localPreviewUrl ??
          (form.mainImageKey !== DEFAULT_COVER_KEY
            ? form.mainImageKey
            : undefined)
        }
        coverGifUrl={mainGifUrl || undefined}
        imageError={imageError}
        onEditImage={() => setImageSheetOpen(true)}
        dateText={
          dateUnknown
            ? form.date || undefined
            : voteDraft
              ? '일정 투표 진행'
              : '일정 미정'
        }
        dateError={dateError}
        onEditDate={() => setDateSheetOpen(true)}
        timeText={timeUnknown ? form.time || undefined : undefined}
        placeText={form.placeName && form.address ? `${form.placeName} · ${form.address}` : (form.placeName || undefined)}
        locationError={locationError}
        onEditLocation={() => setLocationSheetOpen(true)}
        locationUnknown={locationUnknown}
        optionsText={
          [form.fee, form.dressCode, form.parkingInfo]
            .filter((v) => v.trim())
            .join(' · ') || undefined
        }
        onEditOptions={() => setOptionsSheetOpen(true)}
        description={form.description}
        onDescriptionChange={(v) => set({ description: v })}
        rsvp={rsvpOptions}
        onEditRsvp={() => setRsvpSheetOpen(true)}
        bgClass={designBgColor}
        animation={selectedAnimation}
        onEditBgColor={() => setBgColorSheetOpen(true)}
        onEditAnimation={() => setAnimationSheetOpen(true)}
      />

      <main
        ref={contentScrollRef}
        className="flex min-h-0 flex-1 flex-col gap-7 overflow-y-auto px-page py-5"
      >
        {/* 대표 이미지 편집 시트 */}
        <BottomSheet open={imageSheetOpen} onOpenChange={setImageSheetOpen}>
          <BottomSheetContent title="대표 이미지">
            {form.templateId ? (
              <InvitationCover
                imageUrl={
                  localPreviewUrl ??
                  (form.mainImageKey !== DEFAULT_COVER_KEY
                    ? form.mainImageKey
                    : undefined)
                }
                variant={
                  localPreviewUrl || form.mainImageKey !== DEFAULT_COVER_KEY
                    ? 'image'
                    : 'no-image'
                }
                fitToImage
              />
            ) : (
              <div>
                {/* 탭: 이미지 업로드 / GIF */}
                <div className="mb-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={cn(
                      'rounded-full px-3 py-1 text-[13px] font-semibold transition-colors',
                      imageTab === 'upload'
                        ? 'bg-primary text-text-inverse'
                        : 'bg-gray-100 text-text-secondary',
                    )}
                  >
                    이미지 업로드
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('gif')}
                    className={cn(
                      'rounded-full px-3 py-1 text-[13px] font-semibold transition-colors',
                      imageTab === 'gif'
                        ? 'bg-primary text-text-inverse'
                        : 'bg-gray-100 text-text-secondary',
                    )}
                  >
                    GIF
                  </button>
                </div>

                {imageTab === 'upload' ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleImageFile(f);
                        e.target.value = '';
                      }}
                    />
                    {cropSrc ? (
                      <div className="flex flex-col gap-3">
                        <p className="text-[13px] text-text-secondary">
                          사진 비율이 표시 범위를 벗어나요. 드래그·확대로
                          맞춰주세요.
                        </p>
                        <ImageCropEditor
                          imageSrc={cropSrc}
                          aspect={cropAspect}
                          onCropComplete={setCroppedAreaPixels}
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="flex-1"
                            onClick={handleCropCancel}
                          >
                            취소
                          </Button>
                          <Button
                            className="flex-1"
                            onClick={handleCropConfirm}
                            disabled={imageUploading || !croppedAreaPixels}
                          >
                            {imageUploading ? '업로드 중...' : '적용'}
                          </Button>
                        </div>
                      </div>
                    ) : imageUploading ? (
                      <div className="flex aspect-3/2 w-full items-center justify-center rounded-lg bg-surface">
                        <span className="size-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
                      </div>
                    ) : imageUploadError ? (
                      <div className="flex aspect-3/2 w-full flex-col items-center justify-center gap-2 rounded-md bg-red-50">
                        <Icon
                          name="alert-triangle"
                          size="lg"
                          color="danger"
                          decorative
                        />
                        <Button
                          variant="text"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          다시 시도
                        </Button>
                      </div>
                    ) : !localPreviewUrl &&
                      form.mainImageKey === DEFAULT_COVER_KEY ? (
                      <button
                        type="button"
                        className={cn(
                          'flex aspect-3/2 w-full items-center justify-center rounded-lg border-2 border-dashed',
                          imageError
                            ? 'border-danger bg-danger-soft'
                            : 'border-border-strong bg-background-soft',
                        )}
                        onClick={() => {
                          fileInputRef.current?.click();
                        }}
                      >
                        <div className="flex flex-col items-center gap-2 text-text-tertiary">
                          <Icon
                            name="image"
                            size="xl"
                            color={imageError ? 'danger' : 'inactive'}
                            decorative
                          />
                          <span
                            className={cn(
                              'text-[13px]',
                              imageError && 'text-danger',
                            )}
                          >
                            {imageError
                              ? '대표 이미지를 추가해주세요'
                              : '사진을 추가해보세요'}
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="w-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <InvitationCover
                          imageUrl={localPreviewUrl ?? form.mainImageKey}
                          variant="image"
                          fitToImage
                        />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {mainGifUrl ? (
                      <div className="relative w-full aspect-3/2 overflow-hidden rounded-lg">
                        <button
                          type="button"
                          className="w-full h-full"
                          onClick={() => setGifPickerOpen(true)}
                        >
                          <InvitationCover
                            gifUrl={mainGifUrl}
                            variant="image"
                            fitToImage
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMainGifUrl('');
                            setGifPickerOpen(false);
                          }}
                          className="absolute right-2 top-2 z-10 inline-flex size-8 items-center justify-center rounded-full bg-black/50 text-white"
                          aria-label="GIF 제거"
                        >
                          <Icon
                            name="x"
                            size="sm"
                            color="currentColor"
                            decorative
                          />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={cn(
                          'flex aspect-3/2 w-full items-center justify-center rounded-lg border-2 border-dashed',
                          imageError
                            ? 'border-danger bg-danger-soft'
                            : 'border-border-strong bg-background-soft',
                        )}
                        onClick={() => setGifPickerOpen(true)}
                      >
                        <div className="flex flex-col items-center gap-2 text-text-tertiary">
                          <span
                            className={cn(
                              'text-[28px] font-bold',
                              imageError && 'text-danger',
                            )}
                          >
                            GIF
                          </span>
                          <span
                            className={cn(
                              'text-[13px]',
                              imageError && 'text-danger',
                            )}
                          >
                            {imageError
                              ? '대표 이미지를 추가해주세요'
                              : 'GIF를 선택해보세요'}
                          </span>
                        </div>
                      </button>
                    )}
                    {gifPickerOpen ? (
                      <div className="mt-2">
                        <GifPicker
                          onSelect={(url) => {
                            setMainGifUrl(url);
                            set({ mainImageKey: DEFAULT_COVER_KEY });
                            setLocalPreviewUrl(null);
                            setGifPickerOpen(false);
                            setImageError(false);
                          }}
                          onClose={() => setGifPickerOpen(false)}
                        />
                      </div>
                    ) : null}
                  </>
                )}
              </div>
            )}
          </BottomSheetContent>
        </BottomSheet>

        {/* 날짜·시간 편집 시트 */}
        <BottomSheet open={dateSheetOpen} onOpenChange={setDateSheetOpen}>
          <BottomSheetContent title="모임 일정">
            <div className="flex flex-col gap-4">
              <DateTimeSelector
                mode="date"
                label="날짜"
                value={form.date}
                onChange={(v) => {
                  set({ date: v });
                  if (dateError) setDateError(false);
                }}
                unknownToggle
                unknown={dateUnknown}
                onUnknownChange={(v) => {
                  setDateUnknown(v);
                  setTimeUnknown(false);
                  if (!v) {
                    set({ date: '', time: '' });
                  }
                  if (dateError) setDateError(false);
                }}
                error={dateError ? '날짜를 선택해주세요' : undefined}
              />
              {dateUnknown && (
                <DateTimeSelector
                  mode="time"
                  label="시작 시간"
                  value={form.time}
                  onChange={(v) => {
                    set({ time: v });
                    if (timeError) setTimeError(false);
                  }}
                  unknownToggle
                  unknown={timeUnknown}
                  onUnknownChange={(v) => {
                    setTimeUnknown(v);
                    if (v) {
                      if (!form.time) set({ time: '14:00' });
                    } else {
                      // 토글 OFF → 시간 초기화 (안 지우면 저장 시 stale 시간이 반영됨)
                      set({ time: '' });
                    }
                    if (timeError) setTimeError(false);
                  }}
                  error={timeError ? '시간을 선택해주세요' : undefined}
                />
              )}

              {/* 날짜 미정 → 투표 제안 배너 */}
              {!dateUnknown && (
                <div className="flex flex-col gap-3 rounded-md border border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-sm bg-primary/15">
                      <Icon
                        name="calendar"
                        size="md"
                        color="primary"
                        decorative
                      />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-[15px] font-bold text-text-primary">
                        날짜 투표로 정해볼까요?
                      </p>
                      <p className="text-[13px] leading-relaxed text-text-secondary">
                        여러 후보 날짜를 제시하고
                        <br />
                        참여자들이 가능한 날을 투표해요
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-sm bg-white/70 px-3 py-2.5">
                    <Icon
                      name="check-circle"
                      size="sm"
                      color="primary"
                      decorative
                    />
                    <span className="text-[12px] text-text-secondary">
                      최대 30개 날짜·시간 후보 등록
                    </span>
                  </div>
                  <div className="flex items-center gap-2 rounded-sm bg-white/70 px-3 py-2.5">
                    <Icon
                      name="check-circle"
                      size="sm"
                      color="primary"
                      decorative
                    />
                    <span className="text-[12px] text-text-secondary">
                      👍 🤔 👎 로 간편 응답, 결과 자동 집계
                    </span>
                  </div>
                  {voteDraft ? (
                    <div className="flex items-center justify-between rounded-sm bg-white/80 px-3 py-2.5">
                      <span className="text-[13px] font-semibold text-primary">
                        ✓ 투표 후보 {voteDraft.slots.length}개 설정됨
                      </span>
                      <button
                        type="button"
                        onClick={() => setSubScreen('dateVoteSetup')}
                        className="text-[12px] text-text-tertiary underline"
                      >
                        수정
                      </button>
                    </div>
                  ) : (
                    <Button
                      variant="primary"
                      size="md"
                      fullWidth
                      onClick={() => setSubScreen('dateVoteSetup')}
                      className="mt-1"
                    >
                      날짜 투표 만들기
                    </Button>
                  )}
                </div>
              )}
            </div>
          </BottomSheetContent>
        </BottomSheet>

        {/* 위치 편집 시트 */}
        <BottomSheet
          open={locationSheetOpen}
          onOpenChange={setLocationSheetOpen}
        >
          <BottomSheetContent>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[16px] font-bold text-text-primary">모임 장소</h2>
              <Switch
                checked={locationUnknown}
                onCheckedChange={(v) => {
                  setLocationUnknown(v);
                  if (!v) {
                    set({ placeName: '', address: '', lat: null, lng: null, placeId: '' });
                  }
                  if (locationError) setLocationError(false);
                }}
              />
            </div>
            <LocationSelector
              key={locationUnknown ? 'search-on' : 'search-off'}
              mode={locationUnknown ? 'search' : 'unknown'}
              query={locationQuery}
              onQueryChange={handleLocationQueryChange}
              selected={
                locationMode === 'selected' && form.placeName && locationUnknown
                  ? { name: form.placeName, address: form.address }
                  : undefined
              }
              state={locationSearchState}
              unknown={locationUnknown}
              onUnknownChange={(v) => {
                setLocationUnknown(v);
                if (!v) {
                  setLocationMode('search');
                  set({ placeName: '', address: '', lat: null, lng: null, placeId: '' });
                }
                if (locationError) setLocationError(false);
              }}
              hideToggle={true}
              error={locationError ? '장소를 선택해주세요' : undefined}
            />
            {locationUnknown && locationResults.length > 0 && (
              <div
                ref={locationResultsRef}
                className="flex flex-col overflow-y-auto rounded-md border border-border bg-surface"
                style={{ maxHeight: '200px' }}
                onScroll={(e) => {
                  const el = e.currentTarget;
                  const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 100;
                  if (isNearBottom) {
                    loadMoreLocationResults();
                  }
                }}
              >
                {locationResults.map((place) => (
                  <button
                    key={place.placeId}
                    type="button"
                    className="flex flex-col gap-0.5 px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border"
                    onClick={() => {
                      set({
                        placeName: place.placeName,
                        address: place.roadAddress || place.address,
                        lat: place.lat,
                        lng: place.lng,
                        placeId: place.placeId,
                      });
                      setLocationMode('selected');
                      setLocationResults([]);
                      setLocationQuery('');
                      setLocationSearchState('default');
                      if (locationError) setLocationError(false);
                      setLocationSheetOpen(false);
                    }}
                  >
                    <span className="text-[14px] font-semibold text-text-primary">
                      {place.placeName}
                    </span>
                    <span className="text-[12px] text-text-tertiary">
                      {place.roadAddress || place.address}
                    </span>
                  </button>
                ))}
                {!locationHasMore &&
                  locationTotalCount > locationResults.length && (
                    <p className="border-t border-border px-4 py-3 text-center text-[12px] text-text-tertiary">
                      더 많은 결과가 있어요. 키워드를 더 구체적으로 입력해보세요
                    </p>
                  )}
              </div>
            )}
            {form.placeName && locationMode === 'selected' && (
              <>
                <div className="flex flex-col gap-2 rounded-md border border-border bg-surface p-3">
                  <p className="text-[15px] font-semibold text-text-primary">
                    {form.placeName}
                  </p>
                  <p className="text-[13px] text-text-secondary">
                    {form.address}
                  </p>
                </div>
                {form.lat !== null && form.lng !== null && (
                  <div
                    className="rounded-md overflow-hidden border border-border"
                    style={{ height: '200px' }}
                  >
                    <KakaoStaticMapPreview
                      lat={form.lat}
                      lng={form.lng}
                      level={3}
                    />
                  </div>
                )}
              </>
            )}            
          </BottomSheetContent>
        </BottomSheet>

        {/* 모임 옵션 편집 시트 */}
        <BottomSheet open={optionsSheetOpen} onOpenChange={setOptionsSheetOpen}>
          <BottomSheetContent title="모임 옵션">
            <div className="flex flex-col gap-3">
              <TextInput
                value={form.fee}
                onChange={(e) => set({ fee: e.target.value })}
                placeholder="회비 (예: 3만원)"
                maxLength={100}
              />
              <TextInput
                value={form.dressCode}
                onChange={(e) => set({ dressCode: e.target.value })}
                placeholder="드레스코드 (예: 캐주얼)"
                maxLength={100}
              />
              <Textarea
                value={form.parkingInfo}
                onChange={(e) => set({ parkingInfo: e.target.value })}
                placeholder="주차 안내"
                rows={3}
              />
            </div>
          </BottomSheetContent>
        </BottomSheet>

        <div className="h-px bg-border" />

        {/* 공개/비공개 */}
        <div className="flex items-center justify-between rounded-md border border-border bg-surface px-4 py-3.5">
          <div>
            <p className="text-[15px] font-semibold text-text-primary">
              공개 초대장
            </p>
            <p className="text-[13px] text-text-tertiary">
              켜면 이벤트 추천에 노출돼요. 끄면 링크로만 볼 수 있어요
            </p>
          </div>
          <Switch checked={isPublic} onCheckedChange={setIsPublic} />
        </div>

        {/* 7. 미션 — 토글 on 시 다이얼로그로 미션 편집 */}
        <div
          className={cn(
            'flex items-center justify-between rounded-md border bg-surface px-4 py-3.5',
            missionError ? 'border-danger' : 'border-border',
          )}
        >
          <button
            type="button"
            onClick={() => missionEnabled && setMissionSheetOpen(true)}
            className="text-left"
          >
            <p className="text-[15px] font-semibold text-text-primary">
              미션 사용하기
            </p>
            <p className="text-[13px] text-text-tertiary">
              {missionEnabled
                ? selectedMissions.length > 0
                  ? `미션 ${selectedMissions.length}개 선택됨 · 탭하여 편집`
                  : '탭하여 미션을 추가해주세요'
                : '게스트에게 미션을 부여할 수 있어요'}
            </p>
          </button>
          <Switch
            checked={missionEnabled}
            onCheckedChange={(v) => {
              setMissionEnabled(v);
              setMissionError(false);
              if (v) setMissionSheetOpen(true);
            }}
          />
        </div>

        {/* 미션 편집 시트 */}
        <BottomSheet open={missionSheetOpen} onOpenChange={setMissionSheetOpen}>
          <BottomSheetContent title="미션">
            <div className="flex flex-col gap-4">
              {missionEnabled && (
                <>
                  <MissionTemplateSection
                    selectedMissions={selectedMissions}
                    onToggle={toggleMissionTemplate}
                    maxReached={selectedMissions.length >= MAX_MISSIONS}
                  />

                  <section>
                    <p className="mb-2 text-[14px] font-semibold text-text-primary">
                      직접 입력
                    </p>
                    <div className="flex gap-2">
                      <TextInput
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        placeholder="미션 내용을 입력하세요 (최대 200자)"
                        maxLength={200}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addCustomMission();
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        size="md"
                        onClick={addCustomMission}
                        disabled={
                          !customInput.trim() ||
                          selectedMissions.length >= MAX_MISSIONS
                        }
                      >
                        추가
                      </Button>
                    </div>
                  </section>

                  {selectedMissions.length > 0 && (
                    <section>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-[14px] font-semibold text-text-primary">
                          선택된 미션
                        </p>
                        <span
                          className={cn(
                            'text-[13px]',
                            selectedMissions.length >= MAX_MISSIONS
                              ? 'text-danger'
                              : 'text-text-tertiary',
                          )}
                        >
                          {selectedMissions.length}/{MAX_MISSIONS}
                        </span>
                      </div>
                      <div
                        className="flex flex-col gap-2 overflow-y-auto"
                        style={{ maxHeight: '200px' }}
                      >
                        {selectedMissions.map((m) => {
                          const key =
                            m.type === 'template' ? m.templateId : m.localId;
                          return (
                            <div
                              key={key}
                              className="flex items-center gap-2 rounded-md border border-border bg-surface px-4 py-3"
                            >
                              <span className="flex-1 text-[14px] text-text-primary">
                                {stripMissionNumber(m.content)}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeMission(key)}
                                className="shrink-0 text-text-tertiary hover:text-danger"
                              >
                                <Icon
                                  name="x"
                                  size="sm"
                                  color="currentColor"
                                  decorative
                                />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  )}

                  {missionError && (
                    <p className="text-[13px] text-danger">
                      미션을 최소 1개 이상 선택해주세요
                    </p>
                  )}
                </>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setMissionSheetOpen(false)}
              >
                완료
              </Button>
            </div>
          </BottomSheetContent>
        </BottomSheet>

        {/* 배경색 편집 시트 */}
        <BottomSheet open={bgColorSheetOpen} onOpenChange={setBgColorSheetOpen}>
          <BottomSheetContent title="배경색">
            <div className="grid grid-cols-5 gap-2">
              {DESIGN_BG_THEMES.map(({ id, label, cls }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setDesignBgColor(cls)}
                  className="flex flex-col items-center gap-1"
                  aria-label={label}
                >
                  <span
                    className={cn(
                      'aspect-square w-full rounded-md border-2',
                      cls,
                      designBgColor === cls ? 'border-primary' : 'border-border',
                    )}
                  />
                  <span
                    className={cn(
                      'text-[10px]',
                      designBgColor === cls
                        ? 'font-semibold text-primary'
                        : 'text-text-tertiary',
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </BottomSheetContent>
        </BottomSheet>

        {/* 애니메이션 효과 편집 시트 */}
        <BottomSheet open={animationSheetOpen} onOpenChange={setAnimationSheetOpen}>
          <BottomSheetContent title="애니메이션 효과">
            <div className="grid grid-cols-3 gap-2">
              {ANIMATIONS.map(({ id, label, emoji }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSelectedAnimation(id)}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-md border-2 px-2 py-3 transition-colors',
                    selectedAnimation === id
                      ? 'border-primary bg-primary-soft'
                      : 'border-border bg-surface',
                  )}
                >
                  <span className="text-[24px] leading-none">{emoji}</span>
                  <span
                    className={cn(
                      'text-[12px]',
                      selectedAnimation === id
                        ? 'font-semibold text-primary'
                        : 'text-text-secondary',
                    )}
                  >
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </BottomSheetContent>
        </BottomSheet>

        {/* RSVP 편집 시트 */}
        <BottomSheet open={rsvpSheetOpen} onOpenChange={setRsvpSheetOpen}>
          <BottomSheetContent title="참석 버튼 꾸미기">
            <div className="flex flex-col gap-3">
              {/* 팩 선택 드롭다운 */}
              <div className="relative">
                {packDropdownOpen && (
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setPackDropdownOpen(false)}
                  />
                )}
                <button
                  type="button"
                  onClick={() => setPackDropdownOpen((prev) => !prev)}
                  className="flex w-full items-center justify-between rounded-md border border-border bg-surface px-4 py-3 hover:bg-gray-50 transition-colors duration-150"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[20px] leading-none">
                      {RSVP_PACKS.find((p) => p.id === selectedPackId)
                        ?.attending ?? '🎉'}
                    </span>
                    <span className="text-[14px] font-semibold text-text-primary">
                      {RSVP_PACKS.find((p) => p.id === selectedPackId)?.name ??
                        '기본'}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'transition-transform',
                      packDropdownOpen ? 'rotate-180' : '',
                    )}
                  >
                    <Icon
                      name="chevron-down"
                      size="sm"
                      color="inactive"
                      decorative
                    />
                  </span>
                </button>

                {packDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-[120px] overflow-y-auto rounded-md border border-border bg-surface shadow-lg">
                    {RSVP_PACKS.map((pack) => (
                      <button
                        key={pack.id}
                        type="button"
                        onClick={() => {
                          setRsvpOptions((prev) => ({
                            attending: {
                              ...prev.attending,
                              emoji: pack.attending,
                            },
                            maybe: { ...prev.maybe, emoji: pack.maybe },
                            declined: {
                              ...prev.declined,
                              emoji: pack.declined,
                            },
                          }));
                          setSelectedPackId(pack.id);
                          setPackDropdownOpen(false);
                          setEditingRsvp(null);
                        }}
                        className={cn(
                          'flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors',
                          selectedPackId === pack.id
                            ? 'bg-surface'
                            : 'hover:bg-gray-50 transition-colors duration-150',
                        )}
                      >
                        <span className="text-[20px] leading-none">
                          {pack.attending}
                        </span>
                        <span className="flex-1 text-[15px] font-semibold text-text-primary">
                          {pack.name}
                        </span>
                        {selectedPackId === pack.id && (
                          <Icon
                            name="check"
                            size="sm"
                            color="primary"
                            decorative
                          />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* 버튼 미리보기 + 문구 편집 */}
              <div className="grid grid-cols-3 gap-2">
                {(['attending', 'maybe', 'declined'] as RsvpType[]).map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() =>
                        setEditingRsvp(editingRsvp === type ? null : type)
                      }
                      className={cn(
                        'flex flex-col items-center gap-2 rounded-md border-2 px-3 py-4 transition-colors',
                        editingRsvp === type
                          ? 'border-primary bg-primary-soft'
                          : 'border-border bg-surface',
                      )}
                    >
                      <span className="text-[32px] leading-none">
                        {rsvpOptions[type].emoji}
                      </span>
                      <span
                        className={cn(
                          'text-[13px]',
                          editingRsvp === type
                            ? 'font-semibold text-primary'
                            : 'text-text-secondary',
                        )}
                      >
                        {rsvpOptions[type].label}
                      </span>
                    </button>
                  ),
                )}
              </div>

              {editingRsvp && (
                <div className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4">
                  <p className="text-[13px] font-semibold text-text-secondary">
                    버튼 문구
                  </p>
                  <TextInput
                    value={rsvpOptions[editingRsvp].label}
                    onChange={(e) =>
                      setRsvpOptions((prev) => ({
                        ...prev,
                        [editingRsvp]: {
                          ...prev[editingRsvp],
                          label: e.target.value,
                        },
                      }))
                    }
                    placeholder={RSVP_DEFAULT_LABELS[editingRsvp]}
                    maxLength={8}
                  />
                </div>
              )}
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </main>

      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: editInvitation
              ? '저장'
              : isLoggedIn
                ? '초대장 만들기'
                : '로그인하고 공유하기',
            onClick: handleSubmit,
            loading: isPending,
          }}
        />
      </div>

      <ConfirmModal
        open={showPublishConfirm}
        onOpenChange={(v) => {
          if (!isPending) setShowPublishConfirm(v);
        }}
        title={editInvitation ? '변경사항을 저장할까요?' : '초대장을 만들까요?'}
        description={
          publishError
            ? editInvitation
              ? '변경사항 저장에 실패했어요. 다시 시도해주세요.'
              : '초대장 생성에 실패했어요. 다시 시도해주세요.'
            : editInvitation
              ? '변경된 내용이 참석자에게 알림으로 전달될 수 있어요'
              : '초대장이 만들어지면 참석자 응답을 받을 수 있어요'
        }
        confirmLabel={editInvitation ? '저장' : '만들기'}
        loading={isPending}
        onConfirm={() => {
          setPublishError(false);
          publish();
        }}
      />

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent
          title="로그인이 필요해요"
          description="초대장을 만들려면 먼저 로그인해주세요"
        >
          <div className="flex flex-col gap-2.5 pt-2">
            {(['kakao', 'naver', 'google'] as const).map((provider) => {
              const config = {
                kakao: {
                  label: '카카오로 시작하기',
                  cls: 'bg-[#FEE500] text-[#181600]',
                  path: 'kakao',
                },
                naver: {
                  label: '네이버로 시작하기',
                  cls: 'bg-[#03C75A] text-white',
                  path: 'naver',
                },
                google: {
                  label: 'Google로 시작하기',
                  cls: 'border border-border bg-white text-text-primary',
                  path: 'google',
                },
              }[provider];
              const apiBase =
                (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001') +
                '/api';
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem(
                      'wara_oauth_return',
                      '/invitations/create?auth_success=1',
                    );
                    window.location.href = `${apiBase}/auth/${config.path}/redirect`;
                  }}
                  className={`flex h-14 w-full items-center justify-center gap-2 rounded-xs text-[16px] font-bold ${config.cls}`}
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
