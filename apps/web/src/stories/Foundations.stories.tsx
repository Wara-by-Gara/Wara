import type { Meta, StoryObj } from "@storybook/react";
import { Text } from "@wara/ui";
import { dsWrap, Section } from "./_dsDecorator";

const meta: Meta = {
  title: "Foundations/Overview",
  decorators: [dsWrap],
  parameters: { layout: "fullscreen" },
};
export default meta;
type Story = StoryObj;

const SEMANTIC = [
  "background", "surface", "surface-muted", "surface-inverse",
  "text", "text-muted", "text-disabled", "text-inverse",
  "border", "border-strong", "accent", "accent-soft",
  "success", "warning", "danger", "info",
];

const GRADIENTS = ["gradient-brand", "gradient-vibrant", "gradient-glow", "gradient-app-bg"];

const Swatch = ({ name }: { name: string }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    <div
      style={{
        height: 56,
        borderRadius: 12,
        background: `var(--${name})`,
        border: "1px solid var(--border)",
      }}
    />
    <code style={{ fontSize: 11, color: "var(--text-muted)" }}>{name}</code>
  </div>
);

export const Colors: Story = {
  render: () => (
    <div>
      <Section title="Semantic Colors">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
          {SEMANTIC.map((n) => <Swatch key={n} name={n} />)}
        </div>
      </Section>
      <Section title="Gradients">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,1fr)", gap: 12 }}>
          {GRADIENTS.map((n) => (
            <div key={n} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ height: 80, borderRadius: 16, background: `var(--${n})` }} />
              <code style={{ fontSize: 11, color: "var(--text-muted)" }}>{n}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};

const TYPE_VARIANTS = [
  "display", "title", "sectionTitle", "cardTitle",
  "bodyLarge", "body", "bodySmall", "caption",
] as const;

export const Typography: Story = {
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {TYPE_VARIANTS.map((v) => (
        <div key={v} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <code style={{ fontSize: 11, color: "var(--text-muted)" }}>{v}</code>
          <Text variant={v}>와라 — 초대장으로 추억을 나눠요 Aa 123</Text>
        </div>
      ))}
    </div>
  ),
};

const RADII = ["xs", "sm", "md", "lg", "xl", "full"];
const SHADOWS = ["xs", "sm", "md", "lg", "xl"];

export const RadiusAndShadow: Story = {
  name: "Radius & Shadow",
  render: () => (
    <div>
      <Section title="Radius">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {RADII.map((r) => (
            <div key={r} style={{ textAlign: "center" }}>
              <div
                className={`rounded-${r}`}
                style={{ width: 72, height: 56, background: "var(--surface-muted)", border: "1px solid var(--border)" }}
              />
              <code style={{ fontSize: 11, color: "var(--text-muted)" }}>{r}</code>
            </div>
          ))}
        </div>
      </Section>
      <Section title="Shadow">
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
          {SHADOWS.map((s) => (
            <div key={s} style={{ textAlign: "center" }}>
              <div
                className={`shadow-${s}`}
                style={{ width: 72, height: 56, borderRadius: 14, background: "var(--surface)" }}
              />
              <code style={{ fontSize: 11, color: "var(--text-muted)" }}>{s}</code>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};
