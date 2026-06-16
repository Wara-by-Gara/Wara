import type { InviteTemplate } from "../types";

export const cherryBlossom: InviteTemplate = {
  id: "cherry-blossom",
  name: "Cherry Blossom",
  category: "seasonal",
  palette: {
    base: "#FFF4F7",
    ink: "#5A2A3A",
    inkMuted: "rgba(90,42,58,0.68)",
    accent: "#F472A6",
    swatches: ["#FBD0E0", "#F8B5CE", "#FCE3EC", "#F6A8C6"],
  },
  font: "eclectic",
  background: { preset: "seasonalFlower" },
  motion: { preset: "fallingPetals", params: { count: 18 } },
  overlay: { preset: "none" },
  layout: { preset: "centered" },
  typography: { preset: "elegant" },
};
