"use client";

import { useState } from "react";
import { BottomSheet, Button, Textarea, toast } from "@wara/ui";
import { useCreateTextBlast, useTextBlasts } from "@/hooks/useTextBlasts";

interface Props {
  invitationId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TextBlastSheet({ invitationId, open, onOpenChange }: Props) {
  const [message, setMessage] = useState("");
  const { data: blasts } = useTextBlasts(invitationId, { enabled: open });
  const { mutate: send, isPending } = useCreateTextBlast(invitationId);

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;
    send(trimmed, {
      onSuccess: (blast) => {
        setMessage("");
        toast(`참석자 ${blast.recipientCount}명에게 공지를 보냈어요`);
      },
      onError: () => toast.error("공지 발송에 실패했어요. 다시 시도해주세요"),
    });
  };

  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title="단체 공지"
      description="참석자 전원에게 알림으로 전달돼요"
    >
      <div className="flex flex-col gap-3 pt-1">
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          maxLength={500}
          rows={3}
          placeholder="참석자에게 전할 공지를 입력하세요"
          disabled={isPending}
        />
        <Button
          fullWidth
          size="lg"
          loading={isPending}
          disabled={!message.trim()}
          onClick={handleSend}
        >
          공지 보내기
        </Button>

        {blasts && blasts.length > 0 ? (
          <div className="mt-2 flex flex-col gap-2">
            <p className="type-bodySmall font-semibold text-text-muted">보낸 공지</p>
            {blasts.map((blast) => (
              <div
                key={blast.id}
                className="rounded-md border border-border bg-surface-muted p-3"
              >
                <p className="type-body whitespace-pre-wrap break-words text-text">
                  {blast.message}
                </p>
                <p className="mt-1 type-caption text-text-muted">
                  {new Date(blast.createdAt).toLocaleString("ko-KR", {
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  · {blast.recipientCount}명
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </BottomSheet>
  );
}
