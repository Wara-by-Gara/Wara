import type { InviteTemplate } from "../types";

export const neonParty: InviteTemplate = {
  id: "neon-party",
  name: "Neon Party",
  category: "party",
  palette: {
    base: "#0D0A1A",
    ink: "#FFFFFF",
    inkMuted: "rgba(255,255,255,0.74)",
    accent: "#FF3DAE",
    swatches: ["#FF3DAE", "#7C5CFF", "#22D3EE", "#FFD93D"],
  },
  background: { preset: "neonGradient" },
  motion: { preset: "confetti", params: { count: 26 } },
  overlay: { preset: "dim", params: { strength: 0.18 } },
  layout: { preset: "centered" },
  typography: { preset: "playful" },
};
