"use client";

type PetalConfig = {
  id: number;
  left: string;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  spin: number;
  opacity: number;
  color: string;
};

const PETAL_COUNT = 26;
const COLORS = ["#ffffff", "#ffe1ef", "#ff9aca", "#ffd6e0"];

function createPetals(): PetalConfig[] {
  return Array.from({ length: PETAL_COUNT }, (_, id) => {
    const a = (id * 97 + 13) % 100;
    const b = (id * 53 + 7) % 100;
    const c = (id * 31 + 41) % 100;

    return {
      id,
      left: `${a}%`,
      size: 12 + (b % 14),
      delay: (a % 12) + id * 0.12,
      duration: 8 + (c % 7),
      drift: -48 + (b % 96),
      spin: 180 + (c % 360),
      opacity: 0.52 + (a % 16) / 100,
      color: COLORS[id % COLORS.length] ?? COLORS[0] ?? "#ffffff",
    };
  });
}

const PETALS = createPetals();

function Petal({ config }: { config: PetalConfig }) {
  return (
    <span
      className="cherry-blossom-petal absolute block origin-center"
      style={{
        left: config.left,
        top: "-5%",
        width: config.size,
        height: config.size * 1.35,
        animationDelay: `${config.delay}s`,
        animationDuration: `${config.duration}s`,
        backgroundColor: config.color,
        borderRadius: "50% 0 50% 50%",
        boxShadow: "0 1px 2px rgb(255 79 163 / 0.18)",
        ["--petal-drift" as string]: `${config.drift}px`,
        ["--petal-spin" as string]: `${config.spin}deg`,
        ["--petal-opacity" as string]: String(config.opacity),
      }}
    />
  );
}

export function hasCherryBlossomEffect(title: string) {
  return title.includes("곰돌이들 모임");
}

export function InvitationCherryBlossomEffect({ title }: { title: string }) {
  if (!hasCherryBlossomEffect(title)) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] mx-auto h-svh w-full max-w-md overflow-visible motion-reduce:[&_.cherry-blossom-petal]:animate-none"
    >
      {PETALS.map((petal) => (
        <Petal key={petal.id} config={petal} />
      ))}
    </div>
  );
}
