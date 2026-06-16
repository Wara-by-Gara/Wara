import type { InviteTemplate } from "../types";

export const memoryBlue: InviteTemplate = {
  id: "memory-blue",
  name: "Memory Blue",
  category: "minimal",
  palette: {
    base: "#0E1B33",
    ink: "#EAF1FF",
    inkMuted: "rgba(234,241,255,0.7)",
    accent: "#6AA8FF",
    swatches: ["#2E5BBF", "#1B2E59", "#6AA8FF"],
  },
  background: { preset: "linear", params: { angle: 160 } },
  motion: { preset: "softGlow", params: { count: 4 } },
  overlay: { preset: "none" },
  layout: { preset: "bottomLeft" },
  typography: { preset: "minimal" },
};
