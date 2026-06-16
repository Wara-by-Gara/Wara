import type { InviteTemplate } from "../types";

export const glassMood: InviteTemplate = {
  id: "glass-mood",
  name: "Glass Mood",
  category: "minimal",
  palette: {
    base: "#1A1726",
    ink: "#FFFFFF",
    inkMuted: "rgba(255,255,255,0.72)",
    accent: "#C4B5FD",
    swatches: ["#C4B5FD", "#FBCFE8", "#A7F3D0", "#93C5FD"],
  },
  background: { preset: "glassAurora" },
  motion: { preset: "softGlow", params: { count: 5 } },
  overlay: { preset: "dim", params: { strength: 0.12 } },
  layout: { preset: "centered" },
  typography: { preset: "modern" },
};
