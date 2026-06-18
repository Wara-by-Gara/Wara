/**
 * Remotion Chrome 타임아웃 등 CI/Windows 환경용 PNG fallback.
 * Remotion Composition과 동일한 900×1200 · 스크랩북 레이아웃.
 *
 * Usage: node scripts/export-png.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "out", "preview.png");
const WEB_OUT = path.join(
  ROOT,
  "..",
  "..",
  "apps",
  "web",
  "public",
  "template_images",
  "paris-autumn-cafe",
  "paris-autumn-cafe-preview.png",
);

const W = 900;
const H = 1200;

const svgOverlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="vignette" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2c221c" stop-opacity="0.35"/>
      <stop offset="50%" stop-color="#3c2d23" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#1e1814" stop-opacity="0.42"/>
    </linearGradient>
    <filter id="paperNoise">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
      <feColorMatrix type="saturate" values="0"/>
      <feComponentTransfer><feFuncA type="table" tableValues="0 0.07"/></feComponentTransfer>
    </filter>
  </defs>

  <!-- warm café terrace base (unsplash fallback) -->
  <rect width="${W}" height="${H}" fill="#6b5344"/>
  <rect width="${W}" height="${H}" fill="url(#vignette)"/>

  <!-- binder clip -->
  <rect x="424" y="88" width="52" height="26" rx="4" fill="#9aa0a8"/>
  <rect x="428" y="92" width="44" height="18" rx="3" fill="#c4c9cf"/>

  <!-- scrapbook paper -->
  <rect x="72" y="130" width="756" height="980" rx="8" fill="#f4ede3" stroke="#5c3d2e22" stroke-width="2"/>
  <rect x="72" y="130" width="756" height="980" rx="8" filter="url(#paperNoise)" opacity="0.55"/>

  <!-- eyebrow -->
  <text x="450" y="220" text-anchor="middle" fill="#5c3d2e" font-size="26" font-family="Georgia, serif" font-style="italic">함께해 주셔서 감사해요</text>

  <!-- title -->
  <text x="450" y="310" text-anchor="middle" fill="#5c3d2e" font-size="40" font-weight="800" font-family="Impact, Arial Black, sans-serif">PARIS AUTUMN</text>
  <text x="450" y="360" text-anchor="middle" fill="#5c3d2e" font-size="40" font-weight="800" font-family="Impact, Arial Black, sans-serif">CAFÉ GATHERING</text>

  <!-- venue -->
  <text x="450" y="420" text-anchor="middle" fill="#5c3d2e" font-size="21" font-weight="700" font-family="Arial, sans-serif" letter-spacing="2">VENUE: LE MARAIS TERRACE</text>

  <!-- stars + date -->
  <path d="M330 470 L338 492 L362 492 L343 506 L351 528 L330 514 L309 528 L317 506 L298 492 L322 492 Z" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>
  <ellipse cx="450" cy="500" rx="95" ry="34" fill="none" stroke="#5c3d2e" stroke-width="2"/>
  <text x="450" y="510" text-anchor="middle" fill="#5c3d2e" font-size="28" font-weight="700" font-family="Arial, sans-serif">24.11.2025</text>
  <text x="450" y="548" text-anchor="middle" fill="#5c3d2e" font-size="16" font-family="Arial, sans-serif">(오후 2:00 – 5:00)</text>
  <path d="M562 470 L570 492 L594 492 L575 506 L583 528 L562 514 L541 528 L549 506 L530 492 L554 492 Z" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>

  <!-- café people (simplified line art) -->
  <ellipse cx="450" cy="720" rx="130" ry="14" fill="none" stroke="#5c3d2e" stroke-width="1.2"/>
  <rect x="340" y="670" width="220" height="8" rx="4" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>
  <circle cx="380" cy="655" r="14" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>
  <circle cx="520" cy="655" r="14" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>
  <circle cx="420" cy="648" r="14" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>
  <circle cx="480" cy="648" r="14" fill="none" stroke="#5c3d2e" stroke-width="1.4"/>
  <line x1="370" y1="678" x2="370" y2="708" stroke="#5c3d2e" stroke-width="1.4"/>
  <line x1="410" y1="678" x2="410" y2="708" stroke="#5c3d2e" stroke-width="1.4"/>
  <line x1="450" y1="678" x2="450" y2="708" stroke="#5c3d2e" stroke-width="1.4"/>
  <line x1="490" y1="678" x2="490" y2="708" stroke="#5c3d2e" stroke-width="1.4"/>
  <line x1="530" y1="678" x2="530" y2="708" stroke="#5c3d2e" stroke-width="1.4"/>

  <text x="450" y="780" text-anchor="middle" fill="#5c3d2e" font-size="15" font-family="Arial, sans-serif" letter-spacing="3">LET'S ENJOY TOGETHER</text>

  <!-- footer badge -->
  <rect x="365" y="1020" width="170" height="36" fill="rgba(255,255,255,0.35)" stroke="#5c3d2e" stroke-width="1.5"/>
  <text x="450" y="1044" text-anchor="middle" fill="#5c3d2e" font-size="14" font-family="Arial, sans-serif" letter-spacing="1.5">wara invite</text>

  <!-- scattered leaves (static for gallery PNG) -->
  <text x="120" y="200" font-size="28" transform="rotate(-18 120 200)">🍂</text>
  <text x="760" y="280" font-size="24" transform="rotate(22 760 280)">🍁</text>
  <text x="680" y="900" font-size="22" transform="rotate(-8 680 900)">🍂</text>
  <text x="140" y="950" font-size="26" transform="rotate(14 140 950)">🍁</text>
</svg>`;

async function buildBase() {
  const ref = path.join(ROOT, "assets", "design-reference.png");
  if (fs.existsSync(ref)) {
    return sharp(ref).resize(W, H, { fit: "cover" }).blur(1.2).modulate({ saturation: 0.92, brightness: 0.92 });
  }
  return sharp({
    create: { width: W, height: H, channels: 3, background: { r: 107, g: 83, b: 68 } },
  });
}

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.mkdirSync(path.dirname(WEB_OUT), { recursive: true });

  const base = await buildBase();
  const overlay = Buffer.from(svgOverlay);

  await base
    .composite([{ input: overlay, top: 0, left: 0 }])
    .png()
    .toFile(OUT);

  fs.copyFileSync(OUT, WEB_OUT);
  console.log(`✓ ${OUT}`);
  console.log(`✓ ${WEB_OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
