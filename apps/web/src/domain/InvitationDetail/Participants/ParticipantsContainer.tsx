"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Chip } from "@wara/ui";
import { IconButton } from "@wara/ui";
import { TopAppBar } from "@wara/ui";
import { SearchBar } from "@wara/ui";
import { BottomSheet } from "@wara/ui";
import { MenuItem } from "@wara/ui";
import { ConfirmDialog } from "@wara/ui";
import { Button } from "@wara/ui";
import { Icon } from "@/components/icons";
import { ParticipantSummaryCard, ParticipantRow as ParticipantRowItem } from "@/components/domain";
import { ParticipantListSkeleton } from "@/components/organisms/Skeleton";
import { EmptyState } from "@wara/ui";
import { ErrorState } from "@wara/ui";
import { useParticipants, useMyParticipant, useTransferHost } from "@/hooks/useParticipants";
import { useInvitation } from "@/hooks/useInvitations";
import { useBlocklist, useUnblockUser } from "@/hooks/useBlocklist";
import type { BlockedUser } from "@/lib/api/blocklist";
import { updateHostMemo, updateRsvp, leaveInvitation, setCoHost } from "@/lib/api/participants";
import { toast } from "@wara/ui";
import { QUERY_KEYS } from "@/constants/queryKeys";
import type { IconName } from "@wara/ui";
import type { RsvpStatus } from "@/lib/api/participants";
import { ParticipantProfilePanel, type ParticipantRow } from "./ParticipantProfilePanel";

type Tab = "all" | RsvpStatus | "memo" | "blocked";
type SortKey = "joined-asc" | "joined-desc" | "name-asc";
type SheetMode = "action" | "memo" | "rsvp" | "kick" | "transfer" | "unblock" | null;

const RSVP_ICONS: Record<RsvpStatus, IconName> = {
  attending: "user-check",
  undecided: "help-circle",
  absent: "user-x",
};

const RSVP_ACTION_LABELS: Record<RsvpStatus, string> = {
  attending: "참석으로",
  undecided: "미정으로",
  absent: "불참으로",
};

const SORT_OPTIONS: { key: SortKey; label: string; icon: IconName }[] = [
  { key: "joined-asc",  label: "응답 빠른 순", icon: "clock" },
  { key: "joined-desc", label: "응답 늦은 순", icon: "hourglass" },
  { key: "name-asc",    label: "이름순",        icon: "user" },
];

function applySort(list: ParticipantRow[], sort: SortKey): ParticipantRow[] {
  const copy = [...list];
  if (sort === "joined-asc")
    return copy.sort((a, b) => new Date(a.participant.createdAt).getTime() - new Date(b.participant.createdAt).getTime());
  if (sort === "joined-desc")
    return copy.sort((a, b) => new Date(b.participant.createdAt).getTime() - new Date(a.participant.createdAt).getTime());
  if (sort === "name-asc")
    return copy.sort((a, b) =>
      (a.user.name ?? a.user.nickname ?? '').localeCompare(
        b.user.name ?? b.user.nickname ?? '',
        "ko",
      ),
    );
  return copy;
}

export default function ParticipantsContainer() {
  const { invitationId } = useParams<{ invitationId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [tab, setTab] = useState<Tab>("all");
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("joined-asc");
  const [sortOpen, setSortOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<ParticipantRow | null>(null);
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [profileRow, setProfileRow] = useState<ParticipantRow | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [memoInput, setMemoInput] = useState("");

  const { data, isLoading, isError, refetch } = useParticipants(invitationId);
  const { data: myParticipant } = useMyParticipant(invitationId);
  const { data: invitation } = useInvitation(invitationId);
  const isHost = myParticipant?.memberRole === "HOST";

  const { data: blocklistData, isLoading: blocklistLoading } = useBlocklist(invitationId, isHost && tab === "blocked");
  const unblockMutation = useUnblockUser(invitationId);
  const [selectedBlockedUser, setSelectedBlockedUser] = useState<BlockedUser | null>(null);

  const rsvpLabels = {
    attending: invitation?.rsvpAttendingLabel ?? "참석",
    maybe: invitation?.rsvpMaybeLabel ?? "미정",
    declined: invitation?.rsvpDeclinedLabel ?? "불참",
  };

  const rsvpStatusToLabel = (status: RsvpStatus): string =>
    status === "attending" ? rsvpLabels.attending :
    status === "undecided" ? rsvpLabels.maybe :
    rsvpLabels.declined;

  const invalidateParticipants = () =>
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invitations.participants(invitationId) });

  const memoMutation = useMutation({
    mutationFn: ({ participantId, memo }: { participantId: string; memo: string | null }) =>
      updateHostMemo(invitationId, participantId, memo),
    onSuccess: () => { invalidateParticipants(); setSheetMode(null); },
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ participantId, rsvpStatus }: { participantId: string; rsvpStatus: RsvpStatus }) =>
      updateRsvp(invitationId, participantId, rsvpStatus),
    onSuccess: () => { invalidateParticipants(); setSheetMode(null); },
  });

  const kickMutation = useMutation({
    mutationFn: ({ participantId }: { participantId: string }) =>
      leaveInvitation(invitationId, participantId),
    onSuccess: () => { invalidateParticipants(); setSelectedRow(null); setSheetMode(null); },
  });

  const transferMutation = useTransferHost(invitationId);

  const coHostMutation = useMutation({
    mutationFn: ({ participantId, isCoHost }: { participantId: string; isCoHost: boolean }) =>
      setCoHost(invitationId, participantId, isCoHost),
    onSuccess: () => { invalidateParticipants(); setSelectedRow(null); setSheetMode(null); },
    onError: (e) => {
      const code = e instanceof Error ? e.message : "";
      toast.error(
        code === "PARTICIPANT_NOT_ATTENDING"
          ? "참석 상태인 참가자에게만 공동 호스트를 지정할 수 있어요"
          : "공동 호스트 변경에 실패했어요",
      );
    },
  });

  const filtered = applySort(
    (data?.participants ?? [])
      .filter(({ participant }) => tab === "all" || (tab === "memo" ? !!participant.note : participant.rsvpStatus === tab))
      .filter(
        ({ user }) =>
          !searchQuery || (user.name ?? user.nickname ?? '').includes(searchQuery),
      ),
    sort,
  );

  const summary = data?.summary;

  function handleSearchToggle() {
    setShowSearch((prev) => {
      if (prev) setSearchQuery("");
      return !prev;
    });
  }

  function openProfile(row: ParticipantRow) {
    setProfileRow(row);
    setProfileOpen(true);
  }

  function openActionSheet(row: ParticipantRow) {
    setSelectedRow(row);
    setSheetMode("action");
  }

  return (
    <>
    <div className="relative mx-auto flex h-full min-h-full w-full max-w-md flex-col overflow-x-hidden bg-background-soft">
      <TopAppBar
        title="참석자"
        onBack={() => router.back()}
        rightSlot={
          <div className="flex">
            <IconButton icon="search" label="검색" className={showSearch ? "text-primary" : undefined} onClick={handleSearchToggle} />
            <IconButton icon="sort" label="정렬" onClick={() => setSortOpen(true)} />
          </div>
        }
      />

      {/* 정렬 바텀시트 */}
      <BottomSheet open={sortOpen} onOpenChange={setSortOpen} title="정렬">
          <div className="divide-y divide-border">
            {SORT_OPTIONS.map(({ key, label, icon }) => (
              <MenuItem
                key={key}
                leftIcon={icon}
                rightSlot={sort === key ? <Icon name="check" size="sm" color="primary" decorative /> : null}
                onClick={() => { setSort(key); setSortOpen(false); }}
              >
                {label}
              </MenuItem>
            ))}
          </div>
        </BottomSheet>

      {/* HOST 참가자 액션 바텀시트 */}
      <BottomSheet
        open={sheetMode === "action"}
        onOpenChange={(open) => !open && setSheetMode(null)}
        title={selectedRow ? (selectedRow.user.name ?? selectedRow.user.nickname ?? '') : ""}
        description={selectedRow ? rsvpStatusToLabel(selectedRow.participant.rsvpStatus) : ""}
      >
          {selectedRow?.participant.note && (
            <p className="mb-4 text-sm text-text-secondary">
              &ldquo;{selectedRow.participant.note}&rdquo;
            </p>
          )}
          <div className="flex gap-2">
            <button
              className="flex-1 rounded-xs border border-border py-3 text-sm font-semibold text-text-primary"
              onClick={() => { setMemoInput(selectedRow?.participant.hostMemo ?? ""); setSheetMode("memo"); }}
            >
              메모
            </button>
            <button
              className="flex-1 rounded-xs border border-border py-3 text-sm font-semibold text-text-primary"
              onClick={() => setSheetMode("rsvp")}
            >
              상태 변경
            </button>
            <button
              className="flex-1 rounded-xs bg-danger py-3 text-sm font-semibold text-white"
              onClick={() => setSheetMode("kick")}
            >
              내보내기
            </button>
          </div>
          {/* 호스트는 RSVP를 못 바꾸므로 참석(attending) 상태인 참가자에게만 위임/공동호스트 지정 가능 */}
          <button
            className="mt-2 w-full rounded-xs border border-border py-3 text-sm font-semibold text-text-primary disabled:opacity-50"
            disabled={selectedRow?.participant.rsvpStatus !== "attending"}
            onClick={() => setSheetMode("transfer")}
          >
            호스트 위임
          </button>
          {selectedRow && selectedRow.participant.memberRole === "GUEST" ? (
            <button
              className="mt-2 w-full rounded-xs border border-border py-3 text-sm font-semibold text-text-primary disabled:opacity-50"
              disabled={coHostMutation.isPending || selectedRow.participant.rsvpStatus !== "attending"}
              onClick={() => coHostMutation.mutate({ participantId: selectedRow.participant.id, isCoHost: true })}
            >
              공동 호스트 지정
            </button>
          ) : selectedRow &&
            selectedRow.participant.memberRole === "HOST" &&
            selectedRow.user.id !== invitation?.userId ? (
            <button
              className="mt-2 w-full rounded-xs border border-border py-3 text-sm font-semibold text-text-primary disabled:opacity-50"
              disabled={coHostMutation.isPending}
              onClick={() => coHostMutation.mutate({ participantId: selectedRow.participant.id, isCoHost: false })}
            >
              공동 호스트 해제
            </button>
          ) : null}
          {selectedRow && selectedRow.participant.rsvpStatus !== "attending" ? (
            <p className="mt-2 text-center text-xs text-text-tertiary">
              참석 상태인 참가자에게만 호스트를 위임할 수 있어요
            </p>
          ) : null}
        </BottomSheet>

      {/* 메모 입력 바텀시트 */}
      <BottomSheet
        open={sheetMode === "memo"}
        onOpenChange={(open) => !open && setSheetMode("action")}
        title={selectedRow ? (selectedRow.user.name ?? selectedRow.user.nickname ?? '') : ""}
        description={selectedRow ? rsvpStatusToLabel(selectedRow.participant.rsvpStatus) : ""}
      >
          <textarea
            className="w-full resize-none rounded-md border border-border bg-surface p-4 text-sm text-text-primary outline-none"
            rows={4}
            placeholder="메모를 입력하세요"
            maxLength={500}
            value={memoInput}
            onChange={(e) => setMemoInput(e.target.value)}
          />
          <div className="mt-3">
            <Button
              variant="primary"
              fullWidth
              loading={memoMutation.isPending}
              onClick={() =>
                memoMutation.mutate({
                  participantId: selectedRow!.participant.id,
                  memo: memoInput.trim() || null,
                })
              }
            >
              저장
            </Button>
          </div>
        </BottomSheet>

      {/* RSVP 상태 변경 바텀시트 */}
      <BottomSheet
        open={sheetMode === "rsvp"}
        onOpenChange={(open) => !open && setSheetMode("action")}
        title={selectedRow ? (selectedRow.user.name ?? selectedRow.user.nickname ?? '') : ""}
        description={selectedRow ? rsvpStatusToLabel(selectedRow.participant.rsvpStatus) : ""}
      >
          <div className="divide-y divide-border">
            {(["attending", "undecided", "absent"] as RsvpStatus[]).map((status) => (
              <MenuItem
                key={status}
                leftIcon={RSVP_ICONS[status]}
                rightSlot={
                  selectedRow?.participant.rsvpStatus === status
                    ? <Icon name="check" size="sm" color="primary" decorative />
                    : null
                }
                disabled={rsvpMutation.isPending}
                onClick={() =>
                  rsvpMutation.mutate({ participantId: selectedRow!.participant.id, rsvpStatus: status })
                }
              >
                {RSVP_ACTION_LABELS[status]}
              </MenuItem>
            ))}
          </div>
        </BottomSheet>

      {/* 호스트 위임 확인 모달 */}
      <ConfirmDialog
        open={sheetMode === "transfer"}
        onOpenChange={(open) => !open && setSheetMode("action")}
        title="호스트를 위임할까요?"
        description="이 참석자가 호스트가 되고 나는 게스트로 바뀌어요. 되돌릴 수 없어요."
        confirmLabel="위임"
        loading={transferMutation.isPending}
        onConfirm={() =>
          transferMutation.mutate(selectedRow!.participant.id, {
            onSuccess: () => { setSheetMode(null); setSelectedRow(null); },
            onError: (e) => {
              const code = e instanceof Error ? e.message : "";
              toast.error(
                code === "PARTICIPANT_NOT_ATTENDING"
                  ? "참석 상태인 참가자에게만 호스트를 위임할 수 있어요"
                  : "호스트 위임에 실패했어요",
              );
            },
          })
        }
      />

      {/* 강퇴 확인 모달 */}
      <ConfirmDialog
        open={sheetMode === "kick"}
        onOpenChange={(open) => !open && setSheetMode("action")}
        title="참석자를 명단에서 빼시겠어요?"
        description="내보낸 참가자는 차단 탭에서 차단을 해제해야 재참가할 수 있어요"
        confirmLabel="내보내기"
        tone="danger"
        loading={kickMutation.isPending}
        onConfirm={() => kickMutation.mutate({ participantId: selectedRow!.participant.id })}
      />

      {/* 차단 유저 액션 바텀시트 */}
      <BottomSheet
        open={sheetMode === "unblock"}
        onOpenChange={(open) => !open && setSheetMode(null)}
        title={selectedBlockedUser ? (selectedBlockedUser.name ?? selectedBlockedUser.nickname ?? "") : ""}
        description="차단을 해제하면 초대 링크로 재참가할 수 있어요"
      >
          <button
            className="w-full rounded-xs bg-danger py-3 text-sm font-semibold text-white disabled:opacity-50"
            disabled={unblockMutation.isPending}
            onClick={() => {
              unblockMutation.mutate(selectedBlockedUser!.userId, {
                onSuccess: () => { setSheetMode(null); setSelectedBlockedUser(null); },
              });
            }}
          >
            {unblockMutation.isPending ? "처리 중..." : "차단 해제"}
          </button>
        </BottomSheet>

      <div className="flex flex-col gap-4 px-page py-5">
        <ParticipantSummaryCard
          summary={{
            total: summary?.totalCount ?? 0,
            attending: summary?.attendingCount ?? 0,
            maybe: summary?.undecidedCount ?? 0,
            declined: summary?.absentCount ?? 0,
          }}
          rsvpLabels={rsvpLabels}
          isDarkBg={false}
        />

        {showSearch && (
          <SearchBar
            placeholder="이름으로 검색"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            showCancel
            onCancel={() => { setShowSearch(false); setSearchQuery(""); }}
            autoFocus
          />
        )}

        <div className="flex gap-1.5 overflow-x-auto">
          {(["all", "attending", "undecided", "absent", "memo", "blocked"] as Tab[])
            .filter((t) => (t !== "memo" && t !== "blocked") || isHost)
            .map((t) => {
              const label =
                t === "all" ? "전체" :
                t === "attending" ? "참석" :
                t === "undecided" ? "미정" :
                t === "absent" ? "불참" :
                t === "memo" ? "메모" : "차단";
              return (
                <Chip key={t} selected={t === tab} onClick={() => setTab(t)}>
                  {label}
                </Chip>
              );
            })}
        </div>

        {tab === "blocked" ? (
          blocklistLoading ? (
            <ParticipantListSkeleton />
          ) : (blocklistData?.data ?? []).length === 0 ? (
            <EmptyState icon="users-round" title="차단된 참가자가 없어요" />
          ) : (
            <div className="divide-y divide-border">
              {(blocklistData?.data ?? []).map((u) => (
                <ParticipantRowItem
                  key={u.userId}
                  participant={{
                    id: u.userId,
                    name: u.name ?? u.nickname ?? "이름 없음",
                    handle: u.nickname ?? undefined,
                    avatarUrl: u.profileImageUrl ?? undefined,
                    status: "absent",
                  }}
                  onMore={() => { setSelectedBlockedUser(u); setSheetMode("unblock"); }}
                />
              ))}
            </div>
          )
        ) : isLoading ? (
          <ParticipantListSkeleton />
        ) : isError ? (
          <ErrorState title="명단을 불러오지 못했어요" onRetry={() => refetch()} />
        ) : filtered.length === 0 ? (
          searchQuery ? (
            <EmptyState icon="search" title="검색 결과가 없어요" />
          ) : (
            <EmptyState
              icon="users-round"
              title="아직 참석자가 없어요"
              description="초대 링크를 공유해 친구들을 불러보세요"
            />
          )
        ) : (
          <div>
            <div className="divide-y divide-border">
              {filtered.map(({ participant, user }) => (
                <ParticipantRowItem
                  key={participant.id}
                  participant={{
                    id: participant.id,
                    name: user.name ?? user.nickname ?? '이름 없음',
                    handle: user.nickname ?? undefined,
                    avatarUrl: user.profileImageUrl ?? undefined,
                    status: participant.rsvpStatus,
                    isHost: participant.memberRole === "HOST",
                    requestPreview: participant.note ?? undefined,
                    memo: isHost ? (participant.hostMemo ?? undefined) : undefined,
                  }}
                  onClick={() => openProfile({ participant, user })}
                  onMore={isHost && participant.memberRole !== "HOST" ? () => openActionSheet({ participant, user }) : undefined}
                  className="cursor-pointer rounded-sm hover:bg-gray-50 transition-colors duration-150 active:opacity-80"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    <ParticipantProfilePanel
      row={profileRow}
      open={profileOpen}
      onOpenChange={setProfileOpen}
    />
    </>
  );
}
