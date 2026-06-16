"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { useInvitation } from "@/hooks/useInvitations";
import { useJoinInvitation, useMyParticipant, useUpdateRsvp } from "@/hooks/useParticipants";
import { useUpdateMe } from "@/hooks/useUsers";
import { getPoll } from "@/lib/api/dateVote";
import { isOptionalVotePollError } from "@/lib/api/getApiErrorCode";
import { getMe } from "@/lib/api/users";
import { Icon, TopAppBar, FormField, Input, Textarea, EmptyState, Button } from "@wara/ui";
import { RSVPButtonGroup, type RSVPValue, InvitationInfoCard } from "@/components/domain";
import { useQuestions, useSubmitAnswers } from "@/hooks/useQuestionnaire";
import { StickyCTA } from "@/components/layout/StickyCTA";
import type { Invitation } from "@/lib/api/invitations";
import { RsvpPageSkeleton } from "@/components/organisms/Skeleton";

const schema = z.object({
  note: z.string().max(200).optional(),
});
type FormValues = z.infer<typeof schema>;

const FORM_STORAGE_KEY = (id: string) => `rsvp_form_${id}`;

async function resolvePostRsvpRoute(
  invitationId: string,
  dateVotePollStatus?: 'open' | 'closed' | 'confirmed' | null,
): Promise<string> {
  if (dateVotePollStatus !== 'open') {
    return ROUTES.INVITATIONS.DETAIL(invitationId);
  }
  try {
    const pollData = await getPoll(invitationId);
    if (pollData.poll.status === "open") {
      return ROUTES.INVITATIONS.VOTE(invitationId);
    }
  } catch (err) {
    if (!isOptionalVotePollError(err)) {
      throw err;
    }
  }
  return ROUTES.INVITATIONS.DETAIL(invitationId);
}

export default function PublicInvitationContainer({ invitationId }: { invitationId: string }) {
  const { data: invitation, isLoading, isError } = useInvitation(invitationId);

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <TopAppBar title="응답하기" />
        <RsvpPageSkeleton />
      </div>
    );
  }

  if (isError || !invitation) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <TopAppBar title="응답하기" />
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-page text-center">
          <Icon name="alert-triangle" size="xl" color="danger" decorative />
          <p className="text-[18px] font-bold text-text-primary">초대장을 찾을 수 없어요</p>
          <p className="text-[14px] text-text-tertiary">링크가 올바른지 확인해주세요</p>
        </div>
      </div>
    );
  }

  return <PublicInvitationForm invitation={invitation} />;
}

function PublicInvitationForm({ invitation }: { invitation: Invitation }) {
  const router = useRouter();
  const { isLoggedIn, hydrated } = useAuthStore();
  const [rsvp, setRsvp] = useState<RSVPValue>("attending");
  const [isEditing, setIsEditing] = useState(false);
  const [isDeclined, setIsDeclined] = useState(false);
  const [nickname, setNickname] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const { data: questions } = useQuestions(invitation.id, {
    enabled: rsvp !== "absent",
  });
  const { mutateAsync: submitAnswersMut } = useSubmitAnswers(invitation.id);
  const originalNickname = useRef("");
  const { mutate: join, isPending: isJoining } = useJoinInvitation(invitation.id);
  const { mutate: updateMyRsvp, isPending: isUpdatingRsvp } = useUpdateRsvp(invitation.id);
  const { mutateAsync: updateNickname, isPending: isUpdatingNickname } = useUpdateMe();
  const isPending = isJoining || isUpdatingRsvp || isUpdatingNickname;
  const prefilled = useRef(false);

  const { data: myParticipant, isLoading: isCheckingParticipant } = useMyParticipant(
    invitation.id,
    { enabled: hydrated && isLoggedIn },
  );

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { note: "" },
  });

  useEffect(() => {
    const saved = sessionStorage.getItem(FORM_STORAGE_KEY(invitation.id));
    if (saved) {
      const { note, rsvp: savedRsvp } = JSON.parse(saved) as FormValues & { rsvp: RSVPValue };
      setValue("note", note ?? "");
      setRsvp(savedRsvp);
      sessionStorage.removeItem(FORM_STORAGE_KEY(invitation.id));
      prefilled.current = true;
    }
  }, [invitation.id, rsvp, setValue]);

  useEffect(() => {
    if (!hydrated || !isLoggedIn || isCheckingParticipant) return;
    if (myParticipant && myParticipant.rsvpStatus !== "absent") {
      void resolvePostRsvpRoute(invitation.id, invitation.dateVotePollStatus).then((path) => {
        router.replace(path);
      });
    }
  }, [hydrated, isLoggedIn, isCheckingParticipant, myParticipant, invitation.id, router]);

  useEffect(() => {
    if (!hydrated || !isLoggedIn || prefilled.current) return;
    getMe().then((me) => {
      const name = me.nickname ?? me.name ?? "";
      setNickname(name);
      originalNickname.current = name;
    });
  }, [hydrated, isLoggedIn]);

  if (!hydrated) return null;
  if (isLoggedIn && (isCheckingParticipant || (myParticipant && myParticipant.rsvpStatus !== "absent"))) return null;

  if ((myParticipant?.rsvpStatus === "absent" || isDeclined) && !isEditing) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <TopAppBar title="응답하기" />
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
          <EmptyState
            icon="badge-check"
            title="다음에 만나요"
            description="응답을 수정할 수 있어요"
            action={<Button onClick={() => { setIsEditing(true); setIsDeclined(false); }}>수정하기</Button>}
          />
        </div>
      </div>
    );
  }

  const noteValue = watch("note") ?? "";

  // RSVP 마감일이 지났으면 신규 응답·변경 불가
  const isRsvpClosed = Boolean(
    invitation.rsvpDeadlineAt &&
      new Date(invitation.rsvpDeadlineAt).getTime() < Date.now(),
  );
  const deadlineText = invitation.rsvpDeadlineAt
    ? new Date(invitation.rsvpDeadlineAt).toLocaleString("ko-KR", {
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const submitPendingAnswers = async () => {
    const arr = Object.entries(answers)
      .map(([questionId, answer]) => ({ questionId, answer: answer.trim() }))
      .filter((a) => a.answer);
    if (arr.length === 0) return;
    try {
      await submitAnswersMut(arr);
    } catch {
      // 응답 저장 실패해도 참가는 진행
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (isRsvpClosed) return;
    if (rsvp === "absent" && !myParticipant) {
      setIsDeclined(true);
      return;
    }

    if (hydrated && !isLoggedIn) {
      sessionStorage.setItem("returnUrl", ROUTES.PUBLIC.INVITATION(invitation.id));
      sessionStorage.setItem(FORM_STORAGE_KEY(invitation.id), JSON.stringify({ ...data, rsvp }));
      router.push(ROUTES.LOGIN);
      return;
    }

    const trimmed = nickname.trim();
    if (trimmed && trimmed !== originalNickname.current) {
      try {
        await updateNickname({ nickname: trimmed });
        originalNickname.current = trimmed;
      } catch {
        // nickname 업데이트 실패해도 참가는 진행
      }
    }

    if (myParticipant) {
      updateMyRsvp(
        { participantId: myParticipant.id, rsvpStatus: rsvp },
        {
          onSuccess: () => {
            if (rsvp === "absent") {
              setIsEditing(false);
            } else {
              void (async () => {
                await submitPendingAnswers();
                const path = await resolvePostRsvpRoute(invitation.id, invitation.dateVotePollStatus);
                router.push(path);
              })();
            }
          },
        },
      );
      return;
    }

    join(
      { rsvpStatus: rsvp, note: data.note || undefined },
      {
        onSuccess: () => {
          void (async () => {
            await submitPendingAnswers();
            const path = await resolvePostRsvpRoute(invitation.id, invitation.dateVotePollStatus);
            router.push(path);
          })();
        },
        onError: (err: unknown) => {
          const code = (err as { error?: { code?: string } })?.error?.code;
          if (code === "PARTICIPANT_ALREADY_EXISTS") {
            void resolvePostRsvpRoute(invitation.id, invitation.dateVotePollStatus).then((path) => {
              router.push(path);
            });
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopAppBar title="응답하기" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-page pt-5 pb-32">
        {invitation.eventStartAt && (
          <InvitationInfoCard
            variant="datetime"
            title={invitation.title}
            description={new Date(invitation.eventStartAt).toLocaleDateString("ko-KR", {
              year: "numeric", month: "long", day: "numeric", weekday: "short",
            })}
          />
        )}

        <div className="flex flex-col gap-2">
          <p className="text-[14px] font-medium text-text-primary">참석 여부</p>
          {deadlineText ? (
            <p className={`text-[13px] ${isRsvpClosed ? "text-danger" : "text-text-tertiary"}`}>
              {isRsvpClosed ? "응답이 마감됐어요" : `응답 마감 · ${deadlineText}`}
            </p>
          ) : null}
          <RSVPButtonGroup
            value={rsvp}
            onValueChange={setRsvp}
            closed={isRsvpClosed}
            loading={isPending}
            options={{
              attending: { emoji: invitation.rsvpAttendingEmoji, label: invitation.rsvpAttendingLabel },
              undecided: { emoji: invitation.rsvpMaybeEmoji, label: invitation.rsvpMaybeLabel },
              absent: { emoji: invitation.rsvpDeclinedEmoji, label: invitation.rsvpDeclinedLabel },
            }}
          />
        </div>

        {rsvp !== "absent" && (
          <>
            <FormField label="이름">
              <Input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="이름을 입력해주세요"
                disabled={isPending}
              />
            </FormField>

            <FormField
              label="요청사항"
              helper="호스트에게 전달할 내용을 입력해주세요"
              counter={{ current: noteValue.length, max: 200 }}
            >
              <Textarea
                placeholder="요청사항을 입력해주세요"
                disabled={isPending}
                {...register("note")}
              />
            </FormField>

            {(questions ?? []).map((q) => (
              <FormField key={q.id} label={q.question} required={q.required}>
                <Input
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                  }
                  placeholder="답변을 입력해주세요"
                  disabled={isPending}
                  maxLength={500}
                />
              </FormField>
            ))}
          </>
        )}
      </form>

      <StickyCTA
        primary={{
          label: isRsvpClosed ? "응답 마감" : "응답하기",
          onClick: handleSubmit(onSubmit),
          loading: isPending,
          disabled: isRsvpClosed,
        }}
      />
    </div>
  );
}
