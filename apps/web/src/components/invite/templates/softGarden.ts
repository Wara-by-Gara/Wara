import type { InviteTemplate } from "../types";

export const softGarden: InviteTemplate = {
  id: "soft-garden",
  name: "Soft Garden",
  category: "casual",
  palette: {
    base: "#FBF3F6",
    ink: "#3A2A33",
    inkMuted: "rgba(58,42,51,0.7)",
    accent: "#E8729E",
    swatches: ["#FBC7DC", "#F8E1A6", "#CDEBD0", "#F4B8CE"],
  },
  background: { preset: "pastelMesh" },
  motion: { preset: "fallingPetals", params: { count: 16 } },
  overlay: { preset: "none" },
  layout: { preset: "centered" },
  typography: { preset: "elegant" },
};
