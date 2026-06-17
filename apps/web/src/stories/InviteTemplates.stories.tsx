import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Text } from "@wara/ui";
import {
  InviteTemplateRenderer,
  InviteTemplateSelector,
  inviteTemplates,
  getInviteTemplate,
  DEFAULT_TEMPLATE_ID,
} from "@/components/invite";
import { dsWrap } from "./_dsDecorator";

const meta: Meta = {
  title: "Invite/Templates",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const CONTENT = {
  title: "와라 송년 파티",
  hostName: "민지",
  dateText: "12월 24일 (화) 오후 7시",
  locationText: "성수동 라운지",
  message: "올 한 해 고생 많았어요. 함께 마무리해요!",
};

export const Gallery: Story = {
  render: () => (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 16 }}>
      {inviteTemplates.map((t) => (
        <div key={t.id} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <InviteTemplateRenderer template={t} content={CONTENT} />
          <Text variant="caption" color="muted">{t.name}</Text>
        </div>
      ))}
    </div>
  ),
};

export const Selector: Story = {
  render: function Render() {
    const [sel, setSel] = useState(DEFAULT_TEMPLATE_ID);
    const t = getInviteTemplate(sel)!;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 520 }}>
        <div style={{ maxWidth: 280, margin: "0 auto" }}>
          <InviteTemplateRenderer template={t} content={CONTENT} />
        </div>
        <InviteTemplateSelector value={sel} onValueChange={setSel} content={CONTENT} />
      </div>
    );
  },
};

export const Single: Story = {
  render: () => (
    <div style={{ maxWidth: 320, margin: "0 auto" }}>
      <InviteTemplateRenderer template={getInviteTemplate("balloon-day")!} content={CONTENT} />
    </div>
  ),
};
