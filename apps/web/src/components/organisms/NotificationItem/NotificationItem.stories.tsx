import type { Meta, StoryObj } from "@storybook/react";
import { NotificationItem } from "./NotificationItem";

const meta: Meta<typeof NotificationItem> = {
  title: "Organisms/NotificationItem",
  component: NotificationItem,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "DESIGN.md §26. 알림 1개 행." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }}>
        <Story />
      </div>
    ),
  ],
  args: { time: "3분 전" },
};
export default meta;
type Story = StoryObj<typeof NotificationItem>;

export const NewRsvp: Story = {
  args: { type: "newRsvp", title: "박미라님이 참석한다고 했어요", unread: true },
};
export const RsvpChanged: Story = {
  args: { type: "rsvpChanged", title: "이상민님이 미정으로 바꿨어요" },
};
export const NewComment: Story = {
  args: { type: "newComment", title: "새 댓글이 도착했어요", description: "기대돼요!", unread: true },
};
export const NewPhoto: Story = {
  args: { type: "newPhoto", title: "사진 3장이 올라왔어요" },
};
export const InvitationUpdated: Story = {
  args: { type: "invitationUpdated", title: "시간이 변경되었어요", description: "19:00 → 19:30" },
};
export const EventReminderTomorrow: Story = {
  args: { type: "eventReminder", title: "내일 모임이에요!", description: "와라의 생일 파티" },
};
export const EventReminderToday: Story = {
  args: { type: "eventReminder", title: "오늘이에요! 🎉", description: "곧 시작해요", unread: true },
};
export const AlbumOpened: Story = {
  args: { type: "albumOpened", title: "앨범이 열렸어요", description: "모임 사진을 모아주세요" },
};
export const HostNotice: Story = {
  args: { type: "hostNotice", title: "호스트가 공지를 보냈어요", description: "주차장 안내가 있어요" },
};
export const Read: Story = {
  args: { type: "newComment", title: "읽은 알림 예시", unread: false },
};
