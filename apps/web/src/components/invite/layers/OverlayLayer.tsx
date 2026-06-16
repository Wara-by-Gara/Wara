import { overlayPresets } from "../presets/overlayPresets";
import type { OverlaySpec } from "../types";

export function OverlayLayer({ spec }: { spec?: OverlaySpec | null }) {
  if (!spec) return null;
  const build = overlayPresets[spec.preset];
  if (!build) return null;
  return <div className="pointer-events-none absolute inset-0" style={build(spec.params)} />;
}
