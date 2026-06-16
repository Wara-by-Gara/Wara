import type { Meta, StoryObj } from "@storybook/react";
import { Icon, ICONS, type IconName } from "@wara/ui";
import { dsWrap } from "./_dsDecorator";

const meta: Meta = {
  title: "Foundations/Icons",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const NAMES = Object.keys(ICONS) as IconName[];

export const Gallery: Story = {
  render: () => (
    <div>
      <p className="type-bodySmall" style={{ color: "var(--text-muted)", marginBottom: 16 }}>
        lucide-react · currentColor · {NAMES.length}개
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(92px,1fr))", gap: 8 }}>
        {NAMES.map((name) => (
          <div
            key={name}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              padding: "14px 6px",
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--surface)",
            }}
          >
            <Icon name={name} size="lg" decorative />
            <code style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", wordBreak: "break-all" }}>
              {name}
            </code>
          </div>
        ))}
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 20 }}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((s) => (
        <div key={s} style={{ textAlign: "center" }}>
          <Icon name="heart" size={s} color="danger" decorative />
          <div><code style={{ fontSize: 11, color: "var(--text-muted)" }}>{s}</code></div>
        </div>
      ))}
    </div>
  ),
};
