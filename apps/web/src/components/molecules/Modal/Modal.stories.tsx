import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@/components/primitives/Button";
import { ConfirmModal } from "./Modal";

const meta: Meta<typeof ConfirmModal> = {
  title: "Molecules/Modal",
  component: ConfirmModal,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "DESIGN.md §16 Modal. Radix Dialog. radius 24, width=screen-40." } },
  },
};
export default meta;
type Story = StoryObj<typeof ConfirmModal>;

const DeleteConfirmDemo = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="danger" onClick={() => setOpen(true)}>
        초대장 삭제
      </Button>
      <ConfirmModal
        open={open}
        onOpenChange={setOpen}
        title="초대장을 삭제할까요?"
        description="삭제하면 참석자 응답과 댓글이 모두 사라져요."
        confirmLabel="삭제"
        confirmVariant="danger"
        onConfirm={() => setOpen(false)}
      />
    </>
  );
};

const LogoutDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmModal
      open={open}
      onOpenChange={setOpen}
      title="로그아웃 할까요?"
      description="다시 들어오려면 다시 로그인해야 해요."
      confirmLabel="로그아웃"
      onConfirm={() => setOpen(false)}
    />
  );
};

const LoadingDemo = () => {
  const [open, setOpen] = useState(true);
  return (
    <ConfirmModal
      open={open}
      onOpenChange={setOpen}
      title="초대장을 만드는 중이에요"
      description="잠시만 기다려주세요."
      confirmLabel="확인"
      loading
    />
  );
};

export const DeleteConfirm: Story = { render: () => <DeleteConfirmDemo /> };
export const Logout: Story = { render: () => <LogoutDemo /> };
export const Loading: Story = { render: () => <LoadingDemo /> };
