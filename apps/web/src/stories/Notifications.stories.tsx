import type { Meta, StoryObj } from "@storybook/react";
import { TopAppBar } from "@wara/ui";
import { NotificationItem, type NotificationType } from "@/components/domain";

const meta: Meta = {
  title: "Pages/Notifications",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

const ITEMS: { type: NotificationType; title: string; description?: string; time: string; unread?: boolean }[] = [
  { type: "newRsvp", title: "이서연님이 참석으로 응답했어요", time: "3분 전", unread: true },
  { type: "newComment", title: "박도윤님이 댓글을 남겼어요", description: "기대돼요!", time: "1시간 전", unread: true },
  { type: "newPhoto", title: "와라 송년 파티에 사진 5장이 추가됐어요", time: "3시간 전" },
  { type: "eventReminder", title: "내일 와라 송년 파티가 있어요", description: "오후 7시 · 성수동 라운지", time: "어제" },
  { type: "hostNotice", title: "호스트 공지가 등록되었어요", description: "드레스코드 안내", time: "2일 전" },
  { type: "rsvpChanged", title: "최하준님이 불참으로 변경했어요", time: "3일 전" },
];

export const List: Story = {
  render: () => (
    <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
      <TopAppBar title="알림" onBack={() => {}} />
      <main className="flex-1 divide-y divide-border">
        {ITEMS.map((n, i) => (
          <NotificationItem key={i} {...n} onClick={() => {}} onDelete={() => {}} />
        ))}
      </main>
    </div>
  ),
};
