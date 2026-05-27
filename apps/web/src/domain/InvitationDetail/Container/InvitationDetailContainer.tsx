"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/icons";
import { Button } from "@/components/primitives/Button";
import { Avatar } from "@/components/primitives/Avatar";
import { Badge } from "@/components/primitives/Badge";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { MainBottomNav } from "@/components/layout/MainBottomNav";
import { BottomSheet, BottomSheetContent } from "@/components/molecules/BottomSheet";
import { RSVPButtonGroup } from "@/components/molecules/RSVPButtonGroup";
import ShareBottomSheet from "@/domain/InvitationDetail/Informations/ShareBottomSheet";
import { InvitationCover } from "@/components/organisms/InvitationCover";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import { ParticipantSummaryCard } from "@/components/organisms/ParticipantSummaryCard";
import { ParticipantItem } from "@/components/organisms/ParticipantItem";
import { InvitationDetailSkeleton } from "@/components/organisms/Skeleton";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { getInvitation, updateInvitationStatus, deleteInvitation } from "@/lib/api/invitations";
import { getMe } from "@/lib/api/users";
import {
  getMyParticipant,
  getParticipants,
  joinInvitation,
  updateRsvp,
  type RsvpStatus,
} from "@/lib/api/participants";
import { useAuthStore } from "@/stores/authStore";
import { QUERY_KEYS } from "@/constants/queryKeys";
import { ROUTES } from "@/constants/routes";
import PhotoWithFeedbackContainer from '../PhotoWithFeedback/Container/PhotoWithFeedbackContainer';

const FONT_CLASS: Record<string, string> = {
  default: "font-sans",
  gothic: "font-sans font-bold tracking-tighter",
  serif: "font-serif",
  mono: "font-mono",
};

const RSVP_LABELS: Record<RsvpStatus, string> = {
  attending: "참석",
  undecided: "미정",
  absent: "불참",
};

export default function InvitationDetailContainer({ invitationId }: { invitationId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();
  const [rsvpOpen, setRsvpOpen] = useState(false);
  const [loginSheetOpen, setLoginSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => { hydrate(); }, [hydrate]);

  const { data: invitation, isLoading, isError } = useQuery({
    queryKey: QUERY_KEYS.invitations.detail(invitationId),
    queryFn: () => getInvitation(invitationId),
  });

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: hydrated && isLoggedIn,
  });

  const { data: myParticipant } = useQuery({
    queryKey: ["myParticipant", invitationId],
    queryFn: () => getMyParticipant(invitationId),
    enabled: hydrated && isLoggedIn,
  });

  const { data: participantsData } = useQuery({
    queryKey: QUERY_KEYS.invitations.participants(invitationId),
    queryFn: () => getParticipants(invitationId),
    enabled: hydrated && isLoggedIn,
  });

  const { mutate: submitStatusChange, isPending: isStatusPending } = useMutation({
    mutationFn: (status: "active" | "closed") => updateInvitationStatus(invitationId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.detail(invitationId) });
      setMoreSheetOpen(false);
    },
  });

  const { mutate: submitDelete, isPending: isDeletePending } = useMutation({
    mutationFn: () => deleteInvitation(invitationId),
    onSuccess: () => router.replace(ROUTES.INVITATIONS.LIST),
    onError: (e) => {
      const code = e instanceof Error ? e.message : "";
      setDeleteError(
        code === "INVITATION_HAS_PARTICIPANTS"
          ? "참석자가 있는 초대장은 삭제할 수 없어요"
          : "삭제 중 오류가 발생했어요",
      );
    },
  });

  const { mutate: submitRsvp, isPending: isRsvpPending } = useMutation({
    mutationFn: (status: RsvpStatus) =>
      myParticipant
        ? updateRsvp(invitationId, myParticipant.id, status)
        : joinInvitation(invitationId, { rsvpStatus: status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myParticipant", invitationId] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });
      setRsvpOpen(false);
    },
  });

  if (!hydrated || isLoading) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" onBack={() => router.back()} />
        <div className="px-5 py-4"><InvitationDetailSkeleton /></div>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
        <TopAppBar className="shrink-0" onBack={() => router.back()} />
        <main className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
          <Icon name="alert-triangle" size="xl" color="danger" decorative />
          <p className="text-[18px] font-bold text-text-primary">초대장을 불러오지 못했어요</p>
          <Button variant="outline" onClick={() => router.back()}>돌아가기</Button>
        </main>
        <MainBottomNav activeKey="invitations" />
      </div>
    );
  }

  const isHost = isLoggedIn && me?.id === invitation.userId;
  const fontClass = FONT_CLASS[invitation.font] ?? "font-sans";
  const hasImage = invitation.mainImageUrl && !invitation.mainImageKey.includes("defaults/");
  const eventDate = invitation.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "미정";
  const eventTime = invitation.eventStartAt
    ? new Date(invitation.eventStartAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
    : undefined;

  const summary = participantsData?.summary;
  const recentParticipants = participantsData?.participants.slice(0, 4) ?? [];
  const attendingParticipants = participantsData?.participants.filter(
    ({ participant }) => participant.rsvpStatus === "attending",
  ) ?? [];

  // ── 호스트 뷰 ─────────────────────────────────────────────────
  if (isHost) {
    return (
      <div className={cn("relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col", invitation.bgColor, fontClass)}>
        <TopAppBar
          className="shrink-0"
          variant="transparent"
          onBack={() => router.back()}
          rightSlot={
            <div className="flex items-center">
              <button type="button" aria-label="공유" onClick={() => setShareSheetOpen(true)} className="inline-flex size-11 items-center justify-center text-text-secondary">
                <Icon name="share" size="lg" color="currentColor" decorative />
              </button>
              <button type="button" aria-label="더보기" onClick={() => setMoreSheetOpen(true)} className="inline-flex size-11 items-center justify-center text-text-secondary">
                <Icon name="more-horizontal" size="lg" color="currentColor" decorative />
              </button>
            </div>
          }
        />
        <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6">
          <InvitationCover
            variant={hasImage ? "image" : "color"}
            imageUrl={hasImage ? invitation.mainImageUrl : undefined}
            backgroundClass={invitation.bgColor}
            isHost
          />
          <header className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="host" size="md">호스트</Badge>
              <h1 className="truncate text-[22px] font-extrabold text-text-primary">{invitation.title}</h1>
            </div>
            {invitation.description ? (
              <p className="whitespace-pre-line text-[15px] leading-relaxed text-text-secondary">
                {invitation.description}
              </p>
            ) : null}
          </header>

          {summary && (
            <ParticipantSummaryCard
              variant="host"
              summary={{
                total: summary.totalCount,
                attending: summary.attendingCount,
                maybe: summary.undecidedCount,
                declined: summary.absentCount,
                noResponse: summary.totalCount - summary.attendingCount - summary.undecidedCount - summary.absentCount,
              }}
            />
          )}

          <InvitationInfoCard variant="datetime" title={eventDate} time={eventTime} />
          <InvitationInfoCard
            variant="location"
            title={invitation.eventLocation?.placeName ?? "미정"}
            description={invitation.eventLocation?.address}
          />

          {recentParticipants.length > 0 ? (
            <section className="rounded-3xl border border-border bg-surface p-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-text-primary">최근 응답</h3>
                <button
                  type="button"
                  className="text-[13px] text-primary"
                  onClick={() => router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))}
                >
                  전체보기
                </button>
              </div>
              <div className="divide-y divide-border">
                {recentParticipants.map(({ participant, user }) => (
                  <ParticipantItem
                    key={participant.id}
                    name={user.nickname ?? "익명"}
                    avatarUrl={user.profileImageUrl ?? undefined}
                    status={participant.rsvpStatus === "attending" ? "attending" : participant.rsvpStatus === "undecided" ? "maybe" : "declined"}
                    isHost={participant.memberRole === "HOST"}
                  />
                ))}
              </div>
            </section>
          ) : (
            <section className="rounded-3xl border border-dashed border-border-strong bg-gray-50 p-5 text-center">
              <p className="text-[15px] font-semibold text-text-primary">아직 참석자가 없어요</p>
              <p className="mt-1 text-[13px] text-text-tertiary">링크를 공유해 친구들을 초대해보세요</p>
            </section>
          )}
          <PhotoWithFeedbackContainer invitationId={invitationId} />
        </main>
        <MainBottomNav activeKey="invitations" />

        <ShareBottomSheet invitationId={invitationId} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />

        <BottomSheet open={moreSheetOpen} onOpenChange={setMoreSheetOpen}>
          <BottomSheetContent>
            <div className="flex flex-col pb-2">
              <button
                type="button"
                onClick={() => { setMoreSheetOpen(false); router.push(ROUTES.INVITATIONS.EDIT(invitationId)); }}
                className="flex h-14 items-center px-2 text-[16px] text-text-primary"
              >
                수정
              </button>
              <button
                type="button"
                disabled={isStatusPending}
                onClick={() => submitStatusChange(invitation.status === "closed" ? "active" : "closed")}
                className="flex h-14 items-center px-2 text-[16px] text-text-primary disabled:opacity-50"
              >
                {invitation.status === "closed" ? "마감 취소" : "초대 마감"}
              </button>
              <button
                type="button"
                onClick={() => { setMoreSheetOpen(false); setDeleteConfirmOpen(true); }}
                className="flex h-14 items-center px-2 text-[16px] text-danger"
              >
                삭제
              </button>
            </div>
          </BottomSheetContent>
        </BottomSheet>

        <BottomSheet open={deleteConfirmOpen} onOpenChange={(open) => { setDeleteConfirmOpen(open); if (!open) setDeleteError(""); }}>
          <BottomSheetContent title="초대장 삭제" description="삭제하면 복구할 수 없어요. 정말 삭제할까요?">
            <div className="flex flex-col gap-2 pt-2">
              {deleteError && (
                <p className="text-center text-[13px] text-danger">{deleteError}</p>
              )}
              <Button fullWidth variant="danger" size="lg" disabled={isDeletePending} onClick={() => submitDelete()}>
                {isDeletePending ? "삭제 중..." : "삭제하기"}
              </Button>
              <Button fullWidth variant="outline" size="lg" onClick={() => setDeleteConfirmOpen(false)}>
                취소
              </Button>
            </div>
          </BottomSheetContent>
        </BottomSheet>
      </div>
    );
  }

  // ── 게스트 뷰 ─────────────────────────────────────────────────
  const apiBase = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001") + "/api";

  let ctaLabel = "참석 여부 선택하기";
  if (!isLoggedIn) ctaLabel = "로그인하고 참석하기";
  else if (myParticipant) ctaLabel = `응답 수정하기 (현재: ${RSVP_LABELS[myParticipant.rsvpStatus]})`;

  return (
    <div className={cn("relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col", invitation.bgColor, fontClass)}>
      <TopAppBar
        className="shrink-0"
        variant="transparent"
        onBack={() => router.back()}
        rightSlot={
          <button type="button" aria-label="공유" onClick={() => setShareSheetOpen(true)} className="inline-flex size-11 items-center justify-center text-text-secondary">
            <Icon name="share" size="lg" color="currentColor" decorative />
          </button>
        }
      />

      <main className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6">
        <InvitationCover
          variant={hasImage ? "image" : "color"}
          imageUrl={hasImage ? invitation.mainImageUrl : undefined}
          backgroundClass={invitation.bgColor}
          hideBottomGradient
        />

        <header className="flex flex-col items-start gap-2">
          <h1 className="text-[26px] font-extrabold text-text-primary">{invitation.title}</h1>
          {me && (
            <span className="flex items-center gap-2 text-[13px] text-text-tertiary">
              <Avatar src={me.profileImageUrl ?? undefined} alt={me.nickname ?? ""} size="xs" />
              <span>{me.nickname}</span>
            </span>
          )}
        </header>

        {invitation.description ? (
          <p className="whitespace-pre-line text-left text-[15px] leading-relaxed text-text-primary">
            {invitation.description}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <InvitationInfoCard variant="datetime" title={eventDate} time={eventTime} />
          <InvitationInfoCard
            variant="location"
            title={invitation.eventLocation?.placeName ?? "미정"}
            description={invitation.eventLocation?.address}
          />

          {isLoggedIn && participantsData && participantsData.participants.length > 0 && (
            <section className="rounded-3xl border border-border bg-surface p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-[15px] font-bold text-text-primary">
                  참석 {participantsData.summary.attendingCount}명
                </h3>
                <button
                  type="button"
                  className="text-[13px] text-primary"
                  onClick={() => router.push(ROUTES.INVITATIONS.PARTICIPANTS(invitationId))}
                >
                  전체보기
                </button>
              </div>
              <ParticipantAvatarRow participants={attendingParticipants} />
            </section>
          )}
        </div>
        <PhotoWithFeedbackContainer invitationId={invitationId} />
      </main>

      {!isLoggedIn && (
        <div className="shrink-0 border-t border-border bg-surface px-5 py-3 text-center text-[13px] text-text-secondary">
          로그인하면 참석 응답을 남길 수 있어요
        </div>
      )}

      <div className="relative z-10 shrink-0">
        <StickyCTA
          primary={{
            label: ctaLabel,
            onClick: () => {
              if (!isLoggedIn) { setLoginSheetOpen(true); return; }
              setRsvpOpen(true);
            },
          }}
        />
      </div>

      <MainBottomNav activeKey="invitations" />

      <BottomSheet open={rsvpOpen} onOpenChange={setRsvpOpen}>
        <BottomSheetContent contained title="참석 여부" description="원하는 응답을 선택해주세요">
          <div className="pt-2">
            <RSVPButtonGroup
              layout="horizontal-3"
              value={myParticipant?.rsvpStatus === "attending" ? "attending" : myParticipant?.rsvpStatus === "undecided" ? "maybe" : myParticipant ? "declined" : undefined}
              onValueChange={(v) => submitRsvp(v === "attending" ? "attending" : v === "maybe" ? "undecided" : "absent")}
            />
            <p className="mt-3 text-center text-[13px] text-text-tertiary">언제든 수정할 수 있어요</p>
            <Button fullWidth size="lg" className="mt-3" disabled={isRsvpPending}>
              {isRsvpPending ? "저장 중..." : "제출하기"}
            </Button>
          </div>
        </BottomSheetContent>
      </BottomSheet>

      {/* 공유 바텀시트 */}
      <ShareBottomSheet invitationId={invitationId} open={shareSheetOpen} onOpenChange={setShareSheetOpen} />

      <BottomSheet open={loginSheetOpen} onOpenChange={setLoginSheetOpen}>
        <BottomSheetContent title="로그인이 필요해요" description="참석 응답을 남기려면 먼저 로그인해주세요">
          <div className="flex flex-col gap-2.5 pt-2">
            {(["kakao", "naver"] as const).map((provider) => {
              const config = {
                kakao: { label: "카카오로 시작하기", cls: "bg-[#FEE500] text-[#181600]", path: "kakao" },
                naver: { label: "네이버로 시작하기", cls: "bg-[#03C75A] text-white", path: "naver" },
              }[provider];
              return (
                <button
                  key={provider}
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem("wara_oauth_return", window.location.pathname);
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

const MAX_VISIBLE = 6;

function ParticipantAvatarRow({
  participants,
}: {
  participants: { participant: { id: string }; user: { nickname: string | null; profileImageUrl: string | null } }[];
}) {
  const visible = participants.slice(0, MAX_VISIBLE);
  const overflow = participants.length - MAX_VISIBLE;

  return (
    <div className="flex items-center gap-2">
      {visible.map(({ participant, user }) => (
        <Avatar
          key={participant.id}
          src={user.profileImageUrl ?? undefined}
          alt={user.nickname ?? ""}
          size="md"
          initial={user.nickname?.[0]}
        />
      ))}
      {overflow > 0 && (
        <div className="flex size-10 items-center justify-center rounded-full bg-gray-100 text-[13px] font-semibold text-text-secondary">
          +{overflow}
        </div>
      )}
    </div>
  );
}