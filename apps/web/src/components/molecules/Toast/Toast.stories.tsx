import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/primitives/Button";
import { Toaster, toast } from "./Toast";

const meta: Meta<typeof Toaster> = {
  title: "Molecules/Toast",
  component: Toaster,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "sonner 기반 Toast. DESIGN.md §8 규칙(2~3초, 검정 기본, 한 번에 1개). " +
          "앱 루트에 `<Toaster />` 마운트, 임의 위치에서 `toast.show()` 호출.",
      },
    },
  },
};
export default meta;
type Story = StoryObj<typeof Toaster>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Button onClick={() => toast.show("링크가 복사되었어요")}>기본 토스트</Button>
      <Button variant="secondary" onClick={() => toast.success("RSVP 제출 완료")}>
        Success
      </Button>
      <Button variant="outline" onClick={() => toast.error("업로드에 실패했어요")}>
        Error
      </Button>
      <Button variant="ghost" onClick={() => toast.info("새 공지가 도착했어요")}>
        Info
      </Button>
      <Button variant="danger" onClick={() => toast.warning("권한이 필요해요")}>
        Warning
      </Button>
      <Toaster />
    </div>
  ),
};
