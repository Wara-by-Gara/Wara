import { backgroundPresets } from "../presets/backgroundPresets";
import type { BackgroundSpec, InvitePalette } from "../types";

export function BackgroundLayer({
  spec,
  palette,
}: {
  spec: BackgroundSpec;
  palette: InvitePalette;
}) {
  const build = backgroundPresets[spec.preset] ?? backgroundPresets.solid;
  return <div className="absolute inset-0" style={build(palette, spec.params)} />;
}
