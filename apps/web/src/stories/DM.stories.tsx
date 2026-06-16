import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { TopAppBar, Avatar, IconButton, Icon } from "@wara/ui";

const meta: Meta = {
  title: "Pages/DM",
  parameters: { layout: "fullscreen", mobileFrame: false },
};
export default meta;
type Story = StoryObj;

interface Msg {
  id: number;
  mine: boolean;
  text: string;
}

const INITIAL: Msg[] = [
  { id: 1, mine: false, text: "이번 송년 파티 가?" },
  { id: 2, mine: true, text: "당연하지 🙌" },
  { id: 3, mine: false, text: "드레스코드 파티룩이래" },
  { id: 4, mine: true, text: "오 좋아, 뭐 입을지 고민되네" },
];

export const Chat: Story = {
  render: function Render() {
    const [msgs, setMsgs] = useState<Msg[]>(INITIAL);
    const [text, setText] = useState("");

    const send = () => {
      const t = text.trim();
      if (!t) return;
      setMsgs((m) => [...m, { id: Date.now(), mine: true, text: t }]);
      setText("");
    };

    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-[440px] flex-col bg-background" style={{ fontFamily: "var(--font-sans)" }}>
        <TopAppBar
          title="이서연"
          onBack={() => {}}
          rightSlot={<IconButton icon="more-horizontal" label="더보기" variant="ghost" />}
        />

        <main className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-4 py-4">
          {msgs.map((m) =>
            m.mine ? (
              <div key={m.id} className="flex justify-end">
                <p className="max-w-[78%] rounded-2xl rounded-br-md bg-surface-inverse px-3.5 py-2 type-body text-text-inverse">
                  {m.text}
                </p>
              </div>
            ) : (
              <div key={m.id} className="flex items-end gap-2">
                <Avatar size="xs" name="이서연" />
                <p className="max-w-[78%] rounded-2xl rounded-bl-md bg-surface-muted px-3.5 py-2 type-body text-text">
                  {m.text}
                </p>
              </div>
            ),
          )}
        </main>

        {/* 채팅 입력 바 (이모지 + 입력 + 원형 전송) */}
        <div className="sticky bottom-0 flex items-end gap-2 border-t border-border bg-surface px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))]">
          <IconButton icon="image" label="사진" variant="ghost" className="shrink-0" />
          <div className="flex flex-1 items-center rounded-2xl bg-surface-muted px-3.5">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); send(); } }}
              placeholder="메시지 보내기"
              aria-label="메시지"
              className="type-body w-full bg-transparent py-2.5 text-text outline-none placeholder:text-text-disabled"
            />
            <span className="text-text-muted"><Icon name="smile" size="sm" color="currentColor" decorative /></span>
          </div>
          <button
            type="button"
            onClick={send}
            disabled={!text.trim()}
            aria-label="전송"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-inverse text-text-inverse transition-opacity disabled:bg-surface-muted disabled:text-text-disabled"
          >
            <Icon name="send" size="sm" color="currentColor" decorative />
          </button>
        </div>
      </div>
    );
  },
};
