import type { Meta, StoryObj } from "@storybook/react";
import { PhotoViewer } from "./PhotoViewer";

const meta: Meta<typeof PhotoViewer> = {
  title: "Organisms/PhotoViewer",
  component: PhotoViewer,
  tags: ["autodocs"],
  parameters: { docs: { description: { component: "DESIGN.md §24.3. 사진 풀스크린 뷰어." } } },
  decorators: [
    (Story) => (
      <div style={{ width: 320 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    src: "/invitation-cover-cake.png",
    authorName: "김와라",
    authorAvatarUrl: "https://i.pravatar.cc/80?img=18",
    createdAt: "오늘 19:42",
  },
};
export default meta;
type Story = StoryObj<typeof PhotoViewer>;

export const Default: Story = { args: { onClose: () => {}, onSave: () => {}, onShare: () => {} } };
export const Owner: Story = { args: { variant: "owner", onClose: () => {}, onMore: () => {} } };
export const Host: Story = { args: { variant: "host", onClose: () => {}, onMore: () => {} } };
export const Loading: Story = { args: { variant: "loading", src: undefined } };
export const ErrorState: Story = { args: { variant: "error", src: undefined } };
