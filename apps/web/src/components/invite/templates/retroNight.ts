import type { InviteTemplate } from "../types";

export const retroNight: InviteTemplate = {
  id: "retro-night",
  name: "Retro Night",
  category: "retro",
  palette: {
    base: "#10131F",
    ink: "#F4E9D8",
    inkMuted: "rgba(244,233,216,0.7)",
    accent: "#FF7A45",
    swatches: ["#FF7A45", "#FFC857", "#6C5CE7"],
  },
  background: { preset: "nightGlow" },
  motion: { preset: "retroPulse" },
  overlay: { preset: "vignette", params: { strength: 0.5 } },
  layout: { preset: "centered" },
  typography: { preset: "retro" },
};
