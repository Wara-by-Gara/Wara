import type { InviteTemplate } from "../types";

export const balloonDay: InviteTemplate = {
  id: "balloon-day",
  name: "Balloon Day",
  category: "birthday",
  palette: {
    base: "#FFF7FB",
    ink: "#3A2440",
    inkMuted: "rgba(58,36,64,0.66)",
    accent: "#FF5C8A",
    swatches: ["#FF5C8A", "#FFD84D", "#5BC8F5", "#8B5CF6"],
  },
  background: { preset: "pastelMesh" },
  motion: { preset: "balloons", params: { count: 12 } },
  overlay: { preset: "none" },
  layout: { preset: "centered" },
  typography: { preset: "playful" },
};
