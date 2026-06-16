import { cn } from "@/lib/cn";
import { layoutPresets } from "../presets/layoutPresets";
import { typographyPresets } from "../presets/typographyPresets";
import { fontPresets } from "../presets/fontPresets";
import type {
  InviteContent,
  InvitePalette,
  LayoutSpec,
  TypographySpec,
} from "../types";
import type { FontPreset, FontPresetKey } from "../presets/fontPresets";

export function ContentLayer({
  content,
  palette,
  layout,
  typography,
  font,
}: {
  content: InviteContent;
  palette: InvitePalette;
  layout: LayoutSpec;
  typography: TypographySpec;
  font?: FontPresetKey;
}) {
  const l = layoutPresets[layout.preset] ?? layoutPresets.centered;
  const t = typographyPresets[typography.preset] ?? typographyPresets.modern;
  const f: FontPreset = fontPresets[font ?? "classic"] ?? fontPresets.classic;

  return (
    <div
      className={cn(
        "absolute inset-0 flex flex-col p-[7cqw]",
        l.container,
      )}
      style={{ color: palette.ink }}
    >
      <div className={cn("flex flex-col gap-[2.5cqw]", l.text)}>
        {content.hostName ? (
          <span className={t.meta} style={{ color: palette.inkMuted }}>
            {content.hostName} 님이 초대합니다
          </span>
        ) : null}

        <h2
          className={cn("max-w-[16ch] break-keep", t.title)}
          style={{ fontFamily: f.fontFamily, letterSpacing: f.tracking }}
        >
          {content.title}
        </h2>

        {(content.dateText || content.locationText) && (
          <div className={cn("mt-1 flex flex-col gap-1", t.meta)} style={{ color: palette.inkMuted }}>
            {content.dateText ? <span>{content.dateText}</span> : null}
            {content.locationText ? <span>{content.locationText}</span> : null}
          </div>
        )}

        {content.message ? (
          <p className={cn("mt-2 max-w-[28ch] break-keep", t.message)} style={{ color: palette.inkMuted }}>
            {content.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
