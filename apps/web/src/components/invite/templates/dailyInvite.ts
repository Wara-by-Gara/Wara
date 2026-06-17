import type { InviteTemplate } from "../types";

export const dailyInvite: InviteTemplate = {
  id: "daily-invite",
  name: "Daily Invite",
  category: "casual",
  palette: {
    base: "#FFFBF4",
    ink: "#2C2A26",
    inkMuted: "rgba(44,42,38,0.66)",
    accent: "#F59E0B",
    swatches: ["#FCE7C3", "#FBD7A8", "#FFF1DA", "#F7C873"],
  },
  font: "simple",
  background: { preset: "paperTexture" },
  motion: { preset: "paperPlanes", params: { count: 8 } },
  overlay: { preset: "none" },
  layout: { preset: "bottomLeft" },
  typography: { preset: "minimal" },
};
