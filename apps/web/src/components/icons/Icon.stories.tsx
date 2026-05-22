import type { Meta, StoryObj } from "@storybook/react";
import { Icon } from "./Icon";
import type { IconName, IconSize } from "./types";
import { ICON_SIZE_MAP } from "./types";

const meta: Meta<typeof Icon> = {
  title: "Icons",
  component: Icon,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    name: {
      control: { type: "select" },
    },
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "md", "lg", "xl"],
    },
    color: {
      control: { type: "select" },
      options: ["default", "primary", "inactive", "danger", "inverse"],
    },
  },
};
export default meta;

type Story = StoryObj<typeof Icon>;

// ============================================================
// Helpers
// ============================================================

const SIZES: IconSize[] = ["xs", "sm", "md", "lg", "xl"];

const cellStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "flex-start",
  gap: "8px",
  padding: "16px 8px",
  borderRadius: "16px",
  background: "#FFFFFF",
  border: "1px solid #EAEAEA",
  minWidth: "96px",
};

const labelStyle: React.CSSProperties = {
  fontSize: "11px",
  color: "#525252",
  fontFamily:
    "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
  textAlign: "center",
  wordBreak: "break-all",
};

const headingStyle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 700,
  color: "#171717",
  margin: "24px 0 12px",
  fontFamily:
    "Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
  gap: "12px",
  maxWidth: "720px",
};

interface CategoryGridProps {
  names: IconName[];
}

const CategoryGrid = ({ names }: CategoryGridProps) => (
  <div style={gridStyle}>
    {names.map((name) => (
      <div key={name} style={cellStyle}>
        <Icon name={name} size="lg" />
        <span style={labelStyle}>{name}</span>
      </div>
    ))}
  </div>
);

// ============================================================
// Category stories
// ============================================================

const NAVIGATION: IconName[] = [
  "home",
  "invitation",
  "plus",
  "bell",
  "user",
  "settings",
  "chevron-left",
  "chevron-right",
  "chevron-down",
  "menu",
  "close",
  "more-horizontal",
  "search",
  "filter",
  "sort",
];

export const Navigation: Story = {
  render: () => <CategoryGrid names={NAVIGATION} />,
};

const INVITATION: IconName[] = [
  "calendar",
  "clock",
  "map-pin",
  "navigation",
  "link",
  "copy",
  "share",
  "qrcode",
  "edit",
  "trash",
  "save",
  "eye",
  "eye-off",
  "lock",
  "unlock",
  "image",
  "palette",
  "sparkles",
];

export const Invitation: Story = {
  render: () => <CategoryGrid names={INVITATION} />,
};

const RSVP: IconName[] = [
  "check",
  "help-circle",
  "x",
  "users",
  "user-plus",
  "user-check",
  "user-x",
  "hourglass",
  "crown",
  "crown-yellow",
  "badge-check",
  "alert-circle",
  "plus-circle",
  "minus-circle",
  "minus",
];

export const Rsvp: Story = {
  name: "RSVP",
  render: () => <CategoryGrid names={RSVP} />,
};

export const CrownYellow: Story = {
  name: "Crown Yellow",
  render: () => (
    <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
      <div style={cellStyle}>
        <Icon name="crown" size="lg" />
        <span style={labelStyle}>crown (outline)</span>
      </div>
      <div style={cellStyle}>
        <Icon name="crown-yellow" size="lg" />
        <span style={labelStyle}>crown-yellow (#FFD43B)</span>
      </div>
    </div>
  ),
};

const PARTICIPANTS: IconName[] = [
  "user-round",
  "users-round",
  "message-square",
  "clipboard-list",
  "memo",
  "mail",
  "phone",
  "shield",
  "download",
];

export const Participants: Story = {
  render: () => <CategoryGrid names={PARTICIPANTS} />,
};

const MAP: IconName[] = [
  "map",
  "map-pin",
  "locate",
  "route",
  "copy",
  "external-link",
  "building",
  "globe",
  "wifi",
  "alert-triangle",
];

export const Map: Story = {
  render: () => <CategoryGrid names={MAP} />,
};

const ALBUM: IconName[] = [
  "camera",
  "image",
  "images",
  "upload",
  "download",
  "share",
  "heart",
  "trash",
  "flag",
  "rotate-cw",
  "zoom-in",
  "x",
];

export const Album: Story = {
  render: () => <CategoryGrid names={ALBUM} />,
};

const COMMENTS: IconName[] = [
  "message-circle",
  "send",
  "edit",
  "trash",
  "flag",
  "reply",
  "smile",
  "lock",
];

export const Comments: Story = {
  render: () => <CategoryGrid names={COMMENTS} />,
};

const NOTIFICATIONS: IconName[] = [
  "bell",
  "bell-dot",
  "check-circle",
  "message-circle",
  "image",
  "user-check",
  "calendar-clock",
  "megaphone",
  "settings",
  "trash",
];

export const Notifications: Story = {
  render: () => <CategoryGrid names={NOTIFICATIONS} />,
};

const AUTH: IconName[] = [
  "kakao-logo",
  "naver-logo",
  "apple-logo",
  "log-out",
  "user-round-cog",
  "shield-check",
  "file-text",
  "lock-keyhole",
  "alert-circle",
];

export const Auth: Story = {
  render: () => <CategoryGrid names={AUTH} />,
};

const WARA_DECORATIVE: IconName[] = [
  "pixel-airplane",
  "pixel-heart",
  "sparkle",
  "ribbon",
  "sticker-flower",
  "sticker-smile",
  "retro-camera",
  "ticket",
  "party-popper",
  "mini-cloud",
  "mini-bow",
  "pixel-check",
];

export const WaraDecorative: Story = {
  name: "Wara Decorative",
  render: () => (
    <div>
      <div style={{ ...headingStyle, marginTop: 0 }}>
        Wara 전용 장식 아이콘 (커스텀 SVG)
      </div>
      <CategoryGrid names={WARA_DECORATIVE} />
      <div style={headingStyle}>크기 스케일</div>
      <div style={{ display: "flex", gap: "24px", alignItems: "flex-end" }}>
        {SIZES.map((s) => (
          <div
            key={s as string}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Icon name="pixel-airplane" size={s} color="primary" />
            <span style={labelStyle}>
              {s} ({ICON_SIZE_MAP[s as Exclude<IconSize, number>]}px)
            </span>
          </div>
        ))}
      </div>
    </div>
  ),
};

// ============================================================
// All icons (every name) + Playground
// ============================================================

const ALL_NAMES: IconName[] = [
  ...new Set<IconName>([
    ...NAVIGATION,
    ...INVITATION,
    ...RSVP,
    ...PARTICIPANTS,
    ...MAP,
    ...ALBUM,
    ...COMMENTS,
    ...NOTIFICATIONS,
    ...AUTH,
    ...WARA_DECORATIVE,
  ]),
];

export const AllIcons: Story = {
  name: "All Icons",
  render: () => <CategoryGrid names={ALL_NAMES} />,
};

export const Sizes: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "24px", alignItems: "flex-end" }}>
      {SIZES.map((s) => (
        <div
          key={s as string}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="home" size={s} />
          <span style={labelStyle}>
            {s} ({ICON_SIZE_MAP[s as Exclude<IconSize, number>]}px)
          </span>
        </div>
      ))}
    </div>
  ),
};

export const Colors: Story = {
  render: () => (
    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
      {(["default", "primary", "inactive", "danger"] as const).map((c) => (
        <div
          key={c}
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
          }}
        >
          <Icon name="heart" size="lg" color={c} />
          <span style={labelStyle}>{c}</span>
        </div>
      ))}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          padding: "8px",
          background: "#171717",
          borderRadius: 12,
        }}
      >
        <Icon name="heart" size="lg" color="inverse" />
        <span style={{ ...labelStyle, color: "#FFF" }}>inverse</span>
      </div>
    </div>
  ),
};

export const Playground: Story = {
  args: {
    name: "home",
    size: "md",
    color: "default",
  },
};
