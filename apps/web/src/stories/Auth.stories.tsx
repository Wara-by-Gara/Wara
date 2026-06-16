import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Text, Button, Input, FormField, Avatar, IconButton } from "@wara/ui";
import { SocialLoginButton } from "@/components/primitives/SocialLoginButton";
import type { SocialProvider } from "@/components/primitives/SocialLoginButton/providers";

const meta: Meta = {
  title: "Pages/Auth",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const PROVIDERS: SocialProvider[] = ["kakao", "naver", "google", "apple"];

export const Login: Story = {
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col justify-between bg-background px-6 pb-10 pt-20" style={{ fontFamily: "var(--font-sans)" }}>
      <div className="flex flex-col items-center gap-3 pt-16 text-center">
        <span className="grid size-20 place-items-center rounded-3xl bg-surface-inverse text-text-inverse type-display">와</span>
        <Text variant="display">와라</Text>
        <Text variant="body" color="muted">초대장으로 추억을 나눠요</Text>
      </div>
      <div className="flex flex-col gap-2.5">
        {/* 실제 쓰는 소셜 로그인 버튼 그대로 */}
        {PROVIDERS.map((p) => (
          <SocialLoginButton key={p} provider={p} onClick={() => {}} />
        ))}
        <p className="mt-2 text-center type-caption text-text-muted">
          시작하면 <span className="text-link">이용약관</span>과 <span className="text-link">개인정보처리방침</span>에 동의합니다.
        </p>
      </div>
    </div>
  ),
};

export const Onboarding: Story = {
  render: function Render() {
    const [name, setName] = useState("");
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
        <header className="flex justify-end px-4 pt-3">
          <button type="button" className="type-body text-text-muted">건너뛰기</button>
        </header>
        <main className="flex flex-1 flex-col gap-6 px-6 pt-8">
          <div className="flex flex-col gap-2">
            <Text variant="title">반가워요! 이름을 알려주세요</Text>
            <Text variant="body" color="muted">친구들이 알아볼 수 있게요 🙌</Text>
          </div>
          <div className="flex justify-center">
            <div className="relative">
              <Avatar size="2xl" name={name || undefined} />
              <span className="absolute -bottom-1 -right-1">
                <IconButton icon="camera" label="사진 추가" variant="primary" size="sm" />
              </span>
            </div>
          </div>
          <FormField label="이름" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예) 김민지" />
          </FormField>
        </main>
        <div className="sticky bottom-0 border-t border-border bg-surface p-4 pb-[max(12px,env(safe-area-inset-bottom))]">
          <Button fullWidth disabled={!name.trim()}>다음</Button>
        </div>
      </div>
    );
  },
};
