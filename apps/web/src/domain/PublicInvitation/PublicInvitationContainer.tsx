"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ROUTES } from "@/constants/routes";
import { useAuthStore } from "@/stores/authStore";
import { useJoinInvitation } from "@/hooks/useParticipants";
import { getMe } from "@/lib/api/users";
import { TopAppBar } from "@/components/molecules/TopAppBar";
import { RSVPButtonGroup, type RSVPValue } from "@/components/molecules/RSVPButtonGroup";
import { FormField } from "@/components/molecules/FormField";
import { TextInput } from "@/components/primitives/TextInput";
import { Textarea } from "@/components/primitives/Textarea";
import { StickyCTA } from "@/components/layout/StickyCTA";
import { InvitationInfoCard } from "@/components/organisms/InvitationInfoCard";
import type { Invitation } from "@/lib/api/invitations";
import type { RsvpStatus } from "@/lib/api/participants";

const RSVP_MAP: Record<RSVPValue, RsvpStatus> = {
  attending: "attending",
  maybe: "undecided",
  declined: "absent",
};

const schema = z.object({
  displayName: z.string().min(1, "이름을 입력해주세요").max(100),
  note: z.string().max(200).optional(),
});
type FormValues = z.infer<typeof schema>;

interface Props {
  invitation: Invitation;
}

const FORM_STORAGE_KEY = (id: string) => `rsvp_form_${id}`;

export default function PublicInvitationContainer({ invitation }: Props) {
  const router = useRouter();
  const { isLoggedIn, hydrated, hydrate } = useAuthStore();
  const [rsvp, setRsvp] = useState<RSVPValue>("attending");
  const token = localStorage.getItem("access_token") ?? "";
  const { mutate: join, isPending } = useJoinInvitation(invitation.id, token);
  const prefilled = useRef(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: "", note: "" },
  });

  useEffect(() => {
    hydrate();
    const saved = sessionStorage.getItem(FORM_STORAGE_KEY(invitation.id));
    if (saved) {
      const { displayName, note, rsvp: savedRsvp } = JSON.parse(saved) as FormValues & { rsvp: RSVPValue };
      setValue("displayName", displayName);
      setValue("note", note ?? "");
      setRsvp(savedRsvp);
      sessionStorage.removeItem(FORM_STORAGE_KEY(invitation.id));
      prefilled.current = true;
    }
  }, [hydrate, invitation.id, rsvp, setValue]);

  useEffect(() => {
    if (!hydrated || !isLoggedIn || prefilled.current) return;
    getMe(token).then((me) => {
      if (!prefilled.current) {
        setValue("displayName", me.nickname ?? me.name ?? "");
        prefilled.current = true;
      }
    });
  }, [hydrated, isLoggedIn, token, setValue]);

  const noteValue = watch("note") ?? "";

  const onSubmit = (data: FormValues) => {
    if (hydrated && !isLoggedIn) {
      sessionStorage.setItem("returnUrl", ROUTES.PUBLIC.INVITATION(invitation.id));
      sessionStorage.setItem(FORM_STORAGE_KEY(invitation.id), JSON.stringify({ ...data, rsvp }));
      router.push(ROUTES.LOGIN);
      return;
    }
    join(
      { rsvpStatus: RSVP_MAP[rsvp], displayName: data.displayName, note: data.note || undefined },
      {
        onSuccess: () => router.push(ROUTES.INVITATIONS.DETAIL(invitation.id)),
        onError: (err: unknown) => {
          const code = (err as { error?: { code?: string } })?.error?.code;
          if (code === "PARTICIPANT_ALREADY_EXISTS") {
            router.push(ROUTES.INVITATIONS.DETAIL(invitation.id));
          }
        },
      },
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <TopAppBar title="응답하기" />

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 px-5 pt-5 pb-32">
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
          <RSVPButtonGroup value={rsvp} onValueChange={setRsvp} disabled={isPending} />
        </div>

        <FormField label="이름" required error={errors.displayName?.message}>
          <TextInput
            placeholder="이름을 입력해주세요"
            disabled={isPending}
            {...register("displayName")}
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
      </form>

      <StickyCTA
        primary={{ label: "응답하기", onClick: handleSubmit(onSubmit), loading: isPending }}
      />
    </div>
  );
}
