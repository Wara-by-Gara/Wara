import type { InviteTemplate } from "../types";

export const pixelPop: InviteTemplate = {
  id: "pixel-pop",
  name: "Pixel Pop",
  category: "retro",
  palette: {
    base: "#140C24",
    ink: "#FDF7FF",
    inkMuted: "rgba(253,247,255,0.74)",
    accent: "#22D3EE",
    swatches: ["#FF4DD2", "#22D3EE", "#FFE14D", "#7C5CFF"],
  },
  font: "fancy",
  background: { preset: "retroGrid" },
  motion: { preset: "sparkles", params: { count: 20 } },
  overlay: { preset: "none" },
  layout: { preset: "centered" },
  typography: { preset: "retro" },
};
