"use client";

import { useMemo } from "react";
import { cn } from "@/lib/cn";
import { CloudSpriteAnimation } from "@/components/invite/CloudSpriteAnimation";
import { PaperConfettiAnimation } from "@/components/invite/PaperConfettiAnimation";
import { CrystalGlitterAnimation } from "@/components/invite/CrystalGlitterAnimation";
import { BokehAnimation } from "@/components/invite/BokehAnimation";
import { AuroraAnimation } from "@/components/invite/AuroraAnimation";
import { FireworkAnimation } from "@/components/invite/FireworkAnimation";
import { BalloonAnimation } from "@/components/invite/BalloonAnimation";
import { FlowerFallAnimation } from "@/components/invite/FlowerFallAnimation";
import type { AnimationId } from "../constants";

type AnimKind = "fall" | "confetti" | "rise" | "drift" | "fly" | "twinkle";
type Visual = "petal" | "confetti" | "bubble" | "emoji" | "star";

type EffectConfig = {
  anim: AnimKind;
  visual: Visual;
  count: number;
  size: [number, number];
  duration: [number, number];
  drift: [number, number];
  opacity: [number, number];
  emojis?: string[];
  colors?: string[];
  tilt?: [number, number];
};

const ANIM_KEYFRAME: Record<AnimKind, string> = {
  fall: "cherry-blossom-fall",
  confetti: "invite-anim-confetti",
  rise: "invite-anim-rise",
  drift: "invite-anim-drift",
  fly: "invite-anim-fly",
  twinkle: "invite-anim-twinkle",
};

const CONFIG: Record<Exclude<AnimationId, "none">, EffectConfig> = {
  cherry: {
    anim: "fall", visual: "petal", count: 22, size: [10, 22], duration: [8, 15],
    drift: [-60, 60], opacity: [0.5, 0.82], colors: ["#ffe1ef", "#ff9aca", "#ffd6e0", "#ffb3d9"],
  },
  leaf: {
    anim: "fall", visual: "emoji", count: 16, size: [16, 26], duration: [7, 18],
    drift: [-80, 80], opacity: [0.75, 1], emojis: ["🍂", "🍁"],
  },
  confetti: {
    anim: "confetti", visual: "confetti", count: 30, size: [6, 12], duration: [4, 8],
    drift: [-90, 90], opacity: [0.85, 1],
    colors: ["#ff6db3", "#ffd43b", "#5bc1ff", "#34d399", "#c084fc", "#fb923c"],
  },
  cloud: {
    anim: "drift", visual: "emoji", count: 7, size: [42, 82], duration: [22, 42],
    drift: [-40, 40], opacity: [0.7, 0.95], emojis: ["☁️"],
  },
  baseball: {
    anim: "confetti", visual: "emoji", count: 5, size: [22, 34], duration: [4, 9],
    drift: [-120, 120], opacity: [0.95, 1], emojis: ["⚾️"],
  },
  heart: {
    anim: "rise", visual: "emoji", count: 16, size: [14, 28], duration: [7, 12],
    drift: [-45, 45], opacity: [0.7, 1], emojis: ["💕", "💗", "🩷", "💖"],
  },
  balloon: {
    anim: "rise", visual: "emoji", count: 9, size: [26, 46], duration: [12, 20],
    drift: [-30, 30], opacity: [0.85, 1], emojis: ["🎈"],
  },
  plane: {
    anim: "rise", visual: "emoji", count: 5, size: [20, 30], duration: [5, 15],
    drift: [-80, 80], opacity: [0.95, 1], tilt: [-20, 20], emojis: ["✈️", "🛩️"],
  },
  bubble: {
    anim: "rise", visual: "bubble", count: 20, size: [10, 28], duration: [8, 16],
    drift: [-50, 50], opacity: [0.28, 0.55],
  },
  star: {
    anim: "twinkle", visual: "star", count: 26, size: [8, 20], duration: [2, 5],
    drift: [0, 0], opacity: [0.6, 1],
  },
  paper: {
    anim: "fall", visual: "confetti", count: 0, size: [0, 0],
    duration: [0, 0], drift: [0, 0], opacity: [1, 1],
  },
  crystal: {
    anim: "fall", visual: "star", count: 0, size: [0, 0],
    duration: [0, 0], drift: [0, 0], opacity: [1, 1],
  },
  bokeh: {
    anim: "twinkle", visual: "star", count: 0, size: [0, 0],
    duration: [0, 0], drift: [0, 0], opacity: [1, 1],
  },
  stream: {
    anim: "drift", visual: "star", count: 0, size: [0, 0],
    duration: [0, 0], drift: [0, 0], opacity: [1, 1],
  },
  firework: {
    anim: "rise", visual: "star", count: 0, size: [0, 0],
    duration: [0, 0], drift: [0, 0], opacity: [1, 1],
  },
  flower: {
    anim: "fall", visual: "petal", count: 0, size: [0, 0],
    duration: [0, 0], drift: [0, 0], opacity: [1, 1],
  },
};

/** index 기반 결정론적 의사난수 (SSR 안정) */
function rand(i: number, salt: number, min: number, max: number): number {
  const v = ((i * 9301 + salt * 49297 + 233) % 233280) / 233280;
  return min + v * (max - min);
}

type Particle = {
  key: number;
  className: string;
  style: React.CSSProperties;
  content: string | null;
};

function buildParticles(effect: Exclude<AnimationId, "none">, bgClass?: string): Particle[] {
  const c = CONFIG[effect];
  if (!c || c.count === 0) return [];

  // 어두운 테마에서는 pastel 파티클이 묻혀서 더 밝은 팔레트로 교체
  const DARK_THEMES = ["bg-invite-starry", "bg-invite-aurora", "bg-invite-dreamy"];
  const particleColors =
    c.colors && bgClass && DARK_THEMES.includes(bgClass)
      ? ["#ffffff", "#fff3b0", "#a5d8ff", "#ffd6ef", "#c3fae8"]
      : c.colors;

  return Array.from({ length: c.count }, (_, i) => {
    const size = rand(i, 1, c.size[0], c.size[1]) * 2;
    const duration = rand(i, 2, c.duration[0], c.duration[1]);
    const drift = rand(i, 3, c.drift[0], c.drift[1]) * 1.8;
    const opacity = rand(i, 4, c.opacity[0], c.opacity[1]);
    const spin = rand(i, 5, 120, 720);
    const tilt = c.tilt ? rand(i, 6, c.tilt[0], c.tilt[1]) : 0;
    const x = rand(i, 7, 0, 100);
    const y = c.anim === "twinkle" ? rand(i, 8, 0, 100) : rand(i, 8, 6, 90);
    const delay = -rand(i, 9, 0, duration); // 음수 delay → 마운트 즉시 진행중
    const entryEdge = i % 4; // 4방향 진입점 순환: 상/우/하/좌

    // 애니메이션 종류별 시작 위치 (4방향 다양화)
    let position: React.CSSProperties;
    if (c.anim === "twinkle") {
      position = { left: `${x}%`, top: `${y}%` };
    } else if (entryEdge === 0) {
      // 위에서 내려옴
      position = { left: `${x}%`, top: "-10%" };
    } else if (entryEdge === 1) {
      // 우측에서 좌측으로
      position = { left: "110%", top: `${y}%` };
    } else if (entryEdge === 2) {
      // 아래에서 올라옴
      position = { left: `${x}%`, top: "110%" };
    } else {
      // 좌측에서 우측으로
      position = { left: "-10%", top: `${y}%` };
    }

    const style: React.CSSProperties = {
      ...position,
      width: c.visual === "confetti" ? size * 0.6 : size,
      height: c.visual === "confetti" ? size : c.visual === "petal" ? size * 1.35 : size,
      fontSize: c.visual === "emoji" ? size : undefined,
      lineHeight: 1,
      animationName: ANIM_KEYFRAME[c.anim],
      animationDuration: `${duration}s`,
      animationDelay: `${delay}s`,
      animationTimingFunction: "linear",
      animationIterationCount: "infinite",
      ["--drift" as string]: `${drift}px`,
      ["--spin" as string]: `${spin}deg`,
      ["--opacity" as string]: String(opacity),
      ["--tilt" as string]: `${tilt}deg`,
    };

    let content: string | null = null;
    if (c.visual === "emoji" && c.emojis) {
      content = c.emojis[i % c.emojis.length] ?? c.emojis[0] ?? null;
    } else if (c.visual === "petal") {
      const color = particleColors?.[i % particleColors.length] ?? "#ffffff";
      style.backgroundColor = color;
      style.borderRadius = "50% 0 50% 50%";
      style.boxShadow = "0 1px 2px rgb(255 79 163 / 0.18)";
    } else if (c.visual === "confetti") {
      const color = particleColors?.[i % particleColors.length] ?? "#ff6db3";
      style.backgroundColor = color;
      style.borderRadius = "1px";
    } else if (c.visual === "bubble") {
      style.borderRadius = "50%";
      style.background =
        "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.15) 40%, rgba(255,255,255,0.04) 70%)";
      style.border = "1px solid rgba(255,255,255,0.45)";
    } else if (c.visual === "star") {
      style.borderRadius = "50%";
      style.background = "radial-gradient(circle at 30% 30%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.7) 30%, transparent 70%)";
      style.boxShadow = "0 0 8px rgba(255,255,255,0.6), 0 0 16px rgba(255,200,255,0.3)";
    }

    return {
      key: i,
      className: "absolute block origin-center",
      style,
      content,
    };
  });
}

export function InvitationAnimation({
  effect,
  bgClass,
  className,
}: {
  effect: AnimationId;
  bgClass?: string;
  className?: string;
}) {
  const particles = useMemo(
    () => (effect === "none" || effect === "cloud" || effect === "paper" || effect === "crystal" || effect === "bokeh" || effect === "stream" || effect === "firework" || effect === "balloon" || effect === "flower" ? [] : buildParticles(effect, bgClass)),
    [effect, bgClass],
  );

  if (effect === "none") return null;

  if (effect === "stream") {
    return (
      <>
        <AuroraAnimation className="absolute inset-0 pointer-events-none z-0" />
        <AuroraAnimation className="absolute inset-0 pointer-events-none z-20" starsOnly />
      </>
    );
  }

  if (effect === "bokeh") {
    return <BokehAnimation className={className} />;
  }

  if (effect === "crystal") {
    return (
      <>
        <CrystalGlitterAnimation count={150} className="absolute inset-0 pointer-events-none z-0" />
        <CrystalGlitterAnimation count={100} className="absolute inset-0 pointer-events-none z-20" />
      </>
    );
  }

  if (effect === "paper") {
    return (
      <>
        <PaperConfettiAnimation count={120} className="absolute inset-0 pointer-events-none z-0" />
        <PaperConfettiAnimation count={80} className="absolute inset-0 pointer-events-none z-20" />
      </>
    );
  }

  if (effect === "cloud") {
    return (
      <>
        <CloudSpriteAnimation endIdx={5} className="absolute inset-0 pointer-events-none z-0" />
        <CloudSpriteAnimation startIdx={5} className="absolute inset-0 pointer-events-none z-20" />
      </>
    );
  }

  if (effect === "firework") {
    return <FireworkAnimation className="absolute inset-0 pointer-events-none z-10" />;
  }

  if (effect === "balloon") {
    return <BalloonAnimation className={className} />;
  }

  if (effect === "flower") {
    return (
      <>
        <FlowerFallAnimation className="absolute inset-0 pointer-events-none z-0" />
        <FlowerFallAnimation className="absolute inset-0 pointer-events-none z-20" />
      </>
    );
  }

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden",
        className,
      )}
    >
      {particles.map((p) => (
        <span key={p.key} className={p.className} style={p.style}>
          {p.content}
        </span>
      ))}
    </div>
  );
}
