import type { Meta, StoryObj } from "@storybook/react";
import { Button, EmptyState, ErrorState, LoadingState, Skeleton } from "@wara/ui";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta = {
  title: "Molecules/Feedback",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

export const States: Story = {
  render: () => (
    <div style={{ maxWidth: 380, display: "flex", flexDirection: "column", gap: 12 }}>
      <Section title="LoadingState">
        <div style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
          <LoadingState label="불러오는 중이에요" />
        </div>
      </Section>
      <Section title="Skeleton">
        <div style={{ display: "flex", flexDirection: "column", gap: 8, border: "1px solid var(--border)", borderRadius: 12, padding: 12 }}>
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </Section>
      <Section title="EmptyState">
        <div style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
          <EmptyState
            title="아직 초대장이 없어요"
            description="첫 모임을 만들어 친구들을 초대해보세요."
            action={<Button size="sm">초대장 만들기</Button>}
          />
        </div>
      </Section>
      <Section title="ErrorState">
        <div style={{ border: "1px solid var(--border)", borderRadius: 12 }}>
          <ErrorState
            title="불러오지 못했어요"
            description="네트워크를 확인하고 다시 시도해주세요."
            onRetry={() => {}}
          />
        </div>
      </Section>
    </div>
  ),
};
