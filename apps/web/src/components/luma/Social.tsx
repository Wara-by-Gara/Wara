import Image from "next/image";
import { cn } from "@/lib/cn";

const SIZES = [16, 20, 24, 32, 40, 48, 64] as const;

export function LumaInitialsAvatar({
  initials,
  size = 32,
}: {
  initials: string;
  size?: number;
}) {
  return (
    <span
      className="inline-flex items-center justify-center rounded-full bg-gray-800 font-semibold uppercase text-text-primary"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </span>
  );
}

export function LumaAvatarStack({
  avatars,
  size = 32,
  overflow,
}: {
  avatars: { src?: string; initials?: string }[];
  size?: number;
  overflow?: number;
}) {
  return (
    <div className="flex items-center">
      {avatars.map((a, i) => (
        <span
          key={i}
          className="relative inline-flex overflow-hidden rounded-full border-2 border-background bg-gray-800"
          style={{ width: size, height: size, marginLeft: i > 0 ? -size * 0.25 : 0, zIndex: avatars.length - i }}
        >
          {a.src ? (
            <Image src={a.src} alt="" fill className="object-cover" sizes={`${size}px`} />
          ) : (
            <span className="flex size-full items-center justify-center text-xs font-semibold text-text-primary">
              {a.initials}
            </span>
          )}
        </span>
      ))}
      {overflow ? <span className="ml-1 text-sm text-text-tertiary">+{overflow}</span> : null}
    </div>
  );
}

export function LumaAvatarCluster({ variant }: { variant: "single" | "double" | "triple" }) {
  const src = "https://placehold.co/64x64/333537/ffffff?text=W";
  if (variant === "single") {
    return (
      <span className="relative inline-block size-12 overflow-hidden rounded-full">
        <Image src={src} alt="" fill className="object-cover" sizes="48px" />
      </span>
    );
  }
  if (variant === "double") {
    return (
      <span className="relative inline-flex size-12 overflow-hidden rounded-full">
        <span className="relative w-1/2 overflow-hidden">
          <Image src={src} alt="" fill className="object-cover" sizes="24px" />
        </span>
        <span className="relative w-1/2 overflow-hidden border-l border-black">
          <Image src="https://placehold.co/64x64/f31a7c/ffffff?text=A" alt="" fill className="object-cover" sizes="24px" />
        </span>
      </span>
    );
  }
  return (
    <span className="relative inline-flex size-12 overflow-hidden rounded-full">
      <span className="relative w-1/2 overflow-hidden">
        <Image src={src} alt="" fill className="object-cover" sizes="24px" />
      </span>
      <span className="relative flex w-1/2 flex-col">
        <span className="relative h-1/2 overflow-hidden border-b border-black">
          <Image src="https://placehold.co/64x64/3b82f6/ffffff?text=B" alt="" fill className="object-cover" sizes="24px" />
        </span>
        <span className="relative h-1/2 overflow-hidden">
          <Image src="https://placehold.co/64x64/10b981/ffffff?text=C" alt="" fill className="object-cover" sizes="24px" />
        </span>
      </span>
    </span>
  );
}

export function LumaAvatarSizes() {
  return (
    <div className="flex flex-wrap items-end gap-4">
      {SIZES.map((s) => (
        <LumaInitialsAvatar key={s} initials="WA" size={s} />
      ))}
    </div>
  );
}
