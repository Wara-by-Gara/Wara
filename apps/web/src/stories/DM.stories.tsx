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
  { id: 2, mine: false, text: "드레스코드 파티룩이래 👗" },
  { id: 3, mine: true, text: "당연하지 🙌" },
  { id: 4, mine: true, text: "오 좋아, 뭐 입을지 고민되네" },
  { id: 5, mine: false, text: "같이 사러 갈래?" },
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

        <main className="flex flex-1 flex-col overflow-y-auto bg-white px-4 py-4">
          {/* iMessage 스타일 중앙 시간 구분선 */}
          <p className="mb-3 text-center text-[11px] font-medium tracking-[-0.01em] text-black/35">
            오후 9:24
          </p>

          {msgs.map((m, i) => {
            const prev = msgs[i - 1];
            const next = msgs[i + 1];
            const firstOfGroup = !prev || prev.mine !== m.mine;
            const lastOfGroup = !next || next.mine !== m.mine;

            // 그룹 첫 메시지 위에 12px, 같은 발신자 연속이면 2px
            const rowGap = i === 0 ? "" : firstOfGroup ? "mt-3" : "mt-0.5";

            // 그라데이션 버블 + 그룹 마지막 버블에만 꼬리 쪽 모서리 축소
            const bubble = [
              "max-w-[80%] rounded-[18px] px-4 py-2.5 text-[15px] leading-[1.4] tracking-[-0.01em] whitespace-pre-wrap [overflow-wrap:anywhere]",
              m.mine
                ? "bg-gradient-to-b from-[#0a84ff] to-[#0066ff] text-white"
                : "bg-gradient-to-b from-[#f4f4f5] to-[#e5e5ea] text-black",
              lastOfGroup ? (m.mine ? "rounded-br-[5px]" : "rounded-bl-[5px]") : "",
            ].join(" ");

            return (
              <div
                key={m.id}
                className={`flex items-end gap-2 ${rowGap} ${m.mine ? "flex-row-reverse" : ""}`}
              >
                {/* 받은 메시지: 그룹 마지막에만 아바타, 그 외엔 정렬용 스페이서 */}
                {!m.mine &&
                  (lastOfGroup ? (
                    <Avatar size="xs" name="이서연" />
                  ) : (
                    <span className="w-7 shrink-0" aria-hidden />
                  ))}
                <p className={bubble}>{m.text}</p>
              </div>
            );
          })}
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
