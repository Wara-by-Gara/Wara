import type { InviteTemplate } from "../types";

export const skyTrip: InviteTemplate = {
  id: "sky-trip",
  name: "Sky Trip",
  category: "travel",
  palette: {
    base: "#DCEEFF",
    ink: "#173A5E",
    inkMuted: "rgba(23,58,94,0.72)",
    accent: "#3B82F6",
    swatches: ["#9CCDFB", "#EAF6FF", "#FFFFFF", "#BFE0FF"],
  },
  background: { preset: "skyCloud" },
  motion: { preset: "cloudDrift", params: { count: 6 } },
  overlay: { preset: "none" },
  layout: { preset: "topCenter" },
  typography: { preset: "modern" },
};
