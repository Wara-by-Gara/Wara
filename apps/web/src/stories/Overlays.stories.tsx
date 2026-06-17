import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import {
  Button,
  Input,
  Modal,
  Drawer,
  BottomSheet,
  ConfirmDialog,
  Toaster,
  toast,
} from "@wara/ui";
import { dsWrap } from "./_dsDecorator";

const meta: Meta = {
  title: "Molecules/Overlays",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const ModalStory: Story = {
  name: "Modal",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Modal 열기</Button>
        <Modal
          open={open}
          onOpenChange={setOpen}
          title="초대장 정보"
          description="모임 정보를 입력해주세요."
          footer={
            <>
              <Button variant="secondary" onClick={() => setOpen(false)}>취소</Button>
              <Button onClick={() => setOpen(false)}>저장</Button>
            </>
          }
        >
          <Input placeholder="모임 이름" />
        </Modal>
      </>
    );
  },
};

export const DrawerStory: Story = {
  name: "Drawer",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>Drawer 열기</Button>
        <Drawer open={open} onOpenChange={setOpen} title="필터">
          <p className="type-body" style={{ color: "var(--text-muted)" }}>
            오른쪽에서 슬라이드되는 패널입니다.
          </p>
        </Drawer>
      </>
    );
  },
};

export const BottomSheetStory: Story = {
  name: "BottomSheet",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button onClick={() => setOpen(true)}>BottomSheet 열기</Button>
        <BottomSheet open={open} onOpenChange={setOpen} title="공유하기" description="드래그하거나 배경을 탭해서 닫아요.">
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Button fullWidth>링크 복사</Button>
            <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>닫기</Button>
          </div>
        </BottomSheet>
      </>
    );
  },
};

export const ConfirmDialogStory: Story = {
  name: "ConfirmDialog",
  render: function Render() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <Button variant="danger" onClick={() => setOpen(true)}>삭제하기</Button>
        <ConfirmDialog
          open={open}
          onOpenChange={setOpen}
          title="초대장을 삭제할까요?"
          description="삭제하면 되돌릴 수 없어요."
          confirmLabel="삭제"
          tone="danger"
          onConfirm={() => setOpen(false)}
        />
      </>
    );
  },
};

export const ToastStory: Story = {
  name: "Toast",
  render: () => (
    <>
      <Button onClick={() => toast("초대장을 보냈어요", { description: "친구 3명에게 전송됨" })}>
        Toast 띄우기
      </Button>
      <Toaster />
    </>
  ),
};
