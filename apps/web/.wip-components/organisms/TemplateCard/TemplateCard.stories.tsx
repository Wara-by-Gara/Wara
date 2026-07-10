import type { Meta, StoryObj } from "@storybook/react";
import { TemplateCard } from "./TemplateCard";

const meta: Meta<typeof TemplateCard> = {
  title: "Organisms/TemplateCard",
  component: TemplateCard,
  tags: ["autodocs"],
  parameters: {
    docs: { description: { component: "초대장 만들기 — 템플릿 선택 카드." } },
  },
  decorators: [
    (Story) => (
      <div style={{ width: 160 }}>
        <Story />
      </div>
    ),
  ],
  args: {
    name: "Y2K Pink",
    imageUrl: "https://placehold.co/300x400/FFC4DF/171717?text=Y2K",
  },
};
export default meta;
type Story = StoryObj<typeof TemplateCard>;

export const Basic: Story = {};
export const Selected: Story = { args: { variant: "selected" } };
export const Premium: Story = { args: { variant: "premium" } };
export const Category: Story = { args: { variant: "category", category: "Y2K" } };
export const NoImage: Story = { args: { variant: "noImage", imageUrl: undefined } };
