"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, Button, Input, TopAppBar } from "@wara/ui";
import { verifyInvitationAccess } from "@/lib/api/invitations";

export const accessGateKey = (invitationId: string) =>
  `invite_access_${invitationId}`;

interface Props {
  invitationId: string;
  onUnlock: () => void;
}

/** 입장 비밀번호 게이트 — 통과 시 sessionStorage에 기록하고 onUnlock 호출 */
export function AccessGate({ invitationId, onUnlock }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!password.trim() || loading) return;
    setLoading(true);
    setError(false);
    try {
      const { valid } = await verifyInvitationAccess(invitationId, password);
      if (valid) {
        sessionStorage.setItem(accessGateKey(invitationId), "1");
        onUnlock();
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex h-full min-h-svh w-full max-w-md flex-col bg-background">
      <TopAppBar className="shrink-0" onBack={() => router.back()} />
      <main className="flex min-h-0 flex-1 flex-col items-center justify-center gap-4 px-page text-center">
        <Icon name="lock" size="xl" color="default" decorative />
        <div className="flex flex-col gap-1">
          <p className="text-[18px] font-bold text-text-primary">비밀번호가 필요해요</p>
          <p className="text-[14px] text-text-tertiary">호스트가 설정한 입장 비밀번호를 입력해주세요</p>
        </div>
        <div className="flex w-full flex-col gap-2">
          <Input
            type="password"
            value={password}
            invalid={error}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
            placeholder="비밀번호"
            maxLength={50}
            autoFocus
          />
          {error ? (
            <p className="text-[13px] text-danger">비밀번호가 일치하지 않아요</p>
          ) : null}
          <Button
            fullWidth
            size="lg"
            loading={loading}
            disabled={!password.trim()}
            onClick={() => void submit()}
          >
            입장하기
          </Button>
        </div>
      </main>
    </div>
  );
}
