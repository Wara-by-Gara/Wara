import type { Meta, StoryObj } from "@storybook/react";
import { ErrorState } from "./ErrorState";

const meta: Meta<typeof ErrorState> = {
  title: "Organisms/ErrorState",
  component: ErrorState,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §29. 개발자 용어 금지, 친절한 안내 + 재시도." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 360 }} className="rounded-3xl border border-border bg-surface">
        <Story />
      </div>
    ),
  ],
};
export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Network: Story = {
  args: {
    icon: "wifi",
    title: "인터넷에 연결되지 않았어요",
    description: "네트워크 상태를 확인하고 다시 시도해주세요",
    onRetry: () => {},
  },
};
export const Server: Story = {
  args: { title: "잠시 문제가 생겼어요", description: "다시 시도하면 해결될 수 있어요", onRetry: () => {} },
};
export const NotFound: Story = {
  args: { icon: "alert-circle", title: "찾을 수 없는 페이지예요", description: "주소를 다시 확인해주세요" },
};
export const PermissionDenied: Story = {
  args: { icon: "lock", title: "이 페이지에 접근할 수 없어요", description: "호스트가 비공개로 설정한 초대장이에요" },
};
export const ExpiredLink: Story = {
  args: { icon: "clock", title: "만료된 초대 링크예요", description: "호스트에게 새 링크를 요청해보세요" },
};
export const DeletedInvitation: Story = {
  args: { icon: "trash", title: "삭제된 초대장이에요", description: "이미 사라진 초대장은 다시 볼 수 없어요" },
};
export const PrivateInvitation: Story = {
  args: { icon: "eye-off", title: "비공개 초대장이에요", description: "초대 링크가 필요해요" },
};
export const UploadFailed: Story = {
  args: { icon: "upload", title: "사진 업로드에 실패했어요", description: "잠시 후 다시 시도해주세요", onRetry: () => {} },
};
