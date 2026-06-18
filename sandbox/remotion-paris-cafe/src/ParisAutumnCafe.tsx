import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const PARIS_CAFE_WIDTH = 900;
export const PARIS_CAFE_HEIGHT = 1200;

/** WARA 갤러리·AI 합성용 플레이스홀더 (Remotion props) */
export type ParisAutumnCafeProps = {
  eyebrow: string;
  title: string;
  venue: string;
  dateText: string;
  timeText: string;
  tagline: string;
  footer: string;
};

export const PARIS_CAFE_DEFAULT_PROPS: ParisAutumnCafeProps = {
  eyebrow: "함께해 주셔서 감사해요",
  title: "PARIS AUTUMN\nCAFÉ GATHERING",
  venue: "VENUE: LE MARAIS TERRACE",
  dateText: "24.11.2025",
  timeText: "(오후 2:00 – 5:00)",
  tagline: "LET'S ENJOY TOGETHER",
  footer: "wara invite",
};

const CAFE_BG = "./assets/design-reference.png";

const INK = "#5c3d2e";
const PAPER = "#f4ede3";

function Star({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2L14.2 9.8H22L15.9 14.4L18.1 22.2L12 17.6L5.9 22.2L8.1 14.4L2 9.8H9.8L12 2Z"
        stroke={INK}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CafePeopleIllustration() {
  return (
    <svg viewBox="0 0 320 180" width="100%" height="auto">
      <ellipse cx="160" cy="158" rx="118" ry="14" fill="none" stroke={INK} strokeWidth="1.2" />
      <rect x="88" y="108" width="144" height="8" rx="4" fill="none" stroke={INK} strokeWidth="1.4" />
      <circle cx="108" cy="98" r="14" fill="none" stroke={INK} strokeWidth="1.4" />
      <circle cx="212" cy="98" r="14" fill="none" stroke={INK} strokeWidth="1.4" />
      <circle cx="138" cy="92" r="14" fill="none" stroke={INK} strokeWidth="1.4" />
      <circle cx="182" cy="92" r="14" fill="none" stroke={INK} strokeWidth="1.4" />
      <path d="M98 112v28M118 112v28M138 112v28M182 112v28M202 112v28M222 112v28" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />
      <path d="M128 76c0-8 6-12 10-12s10 4 10 12M172 76c0-8 6-12 10-12s10 4 10 12" stroke={INK} strokeWidth="1.4" fill="none" />
      <path d="M152 118h16v10h-16z" fill="none" stroke={INK} strokeWidth="1.2" />
      <path d="M148 128h24" stroke={INK} strokeWidth="1.2" />
    </svg>
  );
}

function FallingLeaf({
  left,
  delay,
  duration,
  size,
  rotation,
}: {
  left: number;
  delay: number;
  duration: number;
  size: number;
  rotation: number;
}) {
  const frame = useCurrentFrame();
  const { height } = useVideoConfig();
  const progress = ((frame - delay) % duration) / duration;
  const y = interpolate(progress, [0, 1], [-40, height + 40]);
  const x = left + Math.sin(progress * Math.PI * 2) * 36;
  const spin = rotation + progress * 360;

  if (frame < delay) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        fontSize: size,
        transform: `rotate(${spin}deg)`,
        opacity: interpolate(progress, [0, 0.1, 0.9, 1], [0, 0.85, 0.85, 0]),
        pointerEvents: "none",
      }}
    >
      🍂
    </div>
  );
}

const LEAVES = [
  { left: 40, delay: 0, duration: 95, size: 22, rotation: 12 },
  { left: 120, delay: 18, duration: 110, size: 26, rotation: -8 },
  { left: 210, delay: 8, duration: 88, size: 20, rotation: 20 },
  { left: 300, delay: 32, duration: 102, size: 24, rotation: -15 },
  { left: 380, delay: 12, duration: 96, size: 18, rotation: 5 },
  { left: 480, delay: 44, duration: 115, size: 28, rotation: -22 },
  { left: 560, delay: 6, duration: 92, size: 21, rotation: 14 },
  { left: 650, delay: 28, duration: 108, size: 25, rotation: -10 },
  { left: 740, delay: 52, duration: 100, size: 19, rotation: 18 },
  { left: 820, delay: 22, duration: 94, size: 23, rotation: -6 },
  { left: 160, delay: 60, duration: 105, size: 20, rotation: 8 },
  { left: 520, delay: 70, duration: 98, size: 27, rotation: -18 },
];

export const ParisAutumnCafe: React.FC<ParisAutumnCafeProps> = ({
  eyebrow,
  title,
  venue,
  dateText,
  timeText,
  tagline,
  footer,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const paperEnter = spring({ frame, fps, config: { damping: 18, stiffness: 72 } });
  const paperY = interpolate(paperEnter, [0, 1], [-48, 0]);
  const paperOpacity = interpolate(paperEnter, [0, 1], [0, 1]);

  const sway = Math.sin(frame / 28) * 0.6;

  return (
    <AbsoluteFill style={{ backgroundColor: "#2a221c" }}>
      {/* Paris terrace photo — blurred caféteria */}
      <AbsoluteFill>
        <Img
          src={CAFE_BG}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            filter: "blur(3px) saturate(0.92) brightness(0.88)",
            transform: "scale(1.06)",
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(180deg, rgba(44,34,28,0.35) 0%, rgba(60,45,35,0.2) 45%, rgba(30,24,20,0.45) 100%)",
          }}
        />
      </AbsoluteFill>

      {/* Falling autumn leaves (full scene) */}
      {LEAVES.map((leaf, i) => (
        <FallingLeaf key={i} {...leaf} />
      ))}

      {/* Binder clip */}
      <div
        style={{
          position: "absolute",
          top: 72,
          left: "50%",
          transform: "translateX(-50%)",
          width: 52,
          height: 28,
          borderRadius: 4,
          background: "linear-gradient(180deg, #b8bcc4 0%, #7a8088 100%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.35)",
          zIndex: 3,
        }}
      />

      {/* Scrapbook paper card */}
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: "48px 36px 56px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 780,
            flex: 1,
            marginTop: 36,
            transform: `translateY(${paperY}px) rotate(${sway}deg)`,
            opacity: paperOpacity,
            backgroundColor: PAPER,
            backgroundImage: `
              radial-gradient(circle at 20% 15%, rgba(255,255,255,0.55) 0%, transparent 42%),
              radial-gradient(circle at 85% 78%, rgba(92,61,46,0.06) 0%, transparent 38%),
              url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")
            `,
            border: `2px solid ${INK}22`,
            borderRadius: 6,
            boxShadow: "0 18px 48px rgba(0,0,0,0.28), inset 0 0 0 1px rgba(255,255,255,0.4)",
            padding: "52px 44px 40px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            color: INK,
            fontFamily: "Georgia, 'Times New Roman', serif",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 26,
              fontStyle: "italic",
              letterSpacing: 0.3,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {eyebrow}
          </p>

          <h1
            style={{
              margin: "28px 0 0",
              fontSize: 42,
              lineHeight: 1.15,
              textAlign: "center",
              fontWeight: 800,
              letterSpacing: 1.2,
              whiteSpace: "pre-line",
              fontFamily: "Impact, Haettenschweiler, 'Arial Narrow Bold', sans-serif",
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: "32px 0 0",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 2,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {venue}
          </p>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 16 }}>
            <Star />
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  display: "inline-block",
                  border: `2px solid ${INK}`,
                  borderRadius: "50%",
                  padding: "10px 28px",
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: "system-ui, sans-serif",
                }}
              >
                {dateText}
              </div>
              <p style={{ margin: "10px 0 0", fontSize: 16, fontFamily: "system-ui, sans-serif" }}>
                {timeText}
              </p>
            </div>
            <Star size={24} />
          </div>

          <div style={{ width: "72%", marginTop: 32 }}>
            <CafePeopleIllustration />
          </div>

          <p
            style={{
              margin: "20px 0 0",
              fontSize: 15,
              letterSpacing: 3,
              fontWeight: 600,
              fontFamily: "system-ui, sans-serif",
            }}
          >
            {tagline}
          </p>

          <div
            style={{
              marginTop: "auto",
              paddingTop: 36,
              borderTop: `1px solid ${INK}33`,
              width: "100%",
              textAlign: "center",
            }}
          >
            <span
              style={{
                display: "inline-block",
                padding: "8px 20px",
                border: `1.5px solid ${INK}`,
                fontSize: 14,
                letterSpacing: 1.5,
                fontFamily: "system-ui, sans-serif",
                backgroundColor: "rgba(255,255,255,0.35)",
              }}
            >
              {footer}
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
