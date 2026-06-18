import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export const COFFEE_GIF_WIDTH = 900;
export const COFFEE_GIF_HEIGHT = 1350;

/** COFFEE TALK 반짝임 — 화면 중앙 글로우 오버레이 */
function TwinklingCoffeeTalk() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pulse = (Math.sin((frame / fps) * Math.PI * 2.4) + 1) / 2;
  const opacity = interpolate(pulse, [0, 1], [0.65, 1]);
  const glow = interpolate(pulse, [0, 1], [8, 28]);

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        textAlign: "center",
        pointerEvents: "none",
        padding: "28px 40px",
        borderRadius: 12,
        background: "rgba(0,0,0,0.28)",
      }}
    >
      <p
        style={{
          margin: 0,
          fontFamily: "Georgia, serif",
          fontStyle: "italic",
          fontSize: 28,
          color: "rgba(255,255,255,0.85)",
          opacity,
        }}
      >
        with special one
      </p>
      <p
        style={{
          margin: "8px 0 0",
          fontSize: 52,
          fontWeight: 800,
          letterSpacing: 6,
          color: "#fff",
          opacity,
          textShadow: `0 0 ${glow}px rgba(255,255,255,0.95), 0 0 ${glow * 1.8}px rgba(180,220,255,0.55)`,
        }}
      >
        COFFEE
      </p>
      <p
        style={{
          margin: "4px 0 0",
          fontSize: 44,
          fontWeight: 800,
          letterSpacing: 10,
          color: "#fff",
          opacity,
          textShadow: `0 0 ${glow}px rgba(255,255,255,0.9), 0 0 ${glow * 1.5}px rgba(180,220,255,0.45)`,
        }}
      >
        TALK
      </p>
    </div>
  );
}

export const CoffeeTalkGif: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#120e0b" }}>
      <Img
        src={staticFile("coffee-clean.png")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center top",
        }}
      />
      <TwinklingCoffeeTalk />
    </AbsoluteFill>
  );
};
