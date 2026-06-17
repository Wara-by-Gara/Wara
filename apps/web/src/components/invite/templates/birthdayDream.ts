import type { InviteTemplate } from "../types";

export const birthdayDream: InviteTemplate = {
  id: "birthday-dream",
  name: "Birthday Dream",
  category: "birthday",
  palette: {
    base: "#1B1430",
    ink: "#FFFFFF",
    inkMuted: "rgba(255,255,255,0.78)",
    accent: "#FF8AC2",
    swatches: ["#FF6FA3", "#A78BFA", "#5BC8F5", "#FFD93D"],
  },
  background: { preset: "glassAurora" },
  motion: { preset: "floatingStars", params: { count: 22 } },
  overlay: { preset: "vignette", params: { strength: 0.45 } },
  layout: { preset: "centered" },
  typography: { preset: "playful" },
};
