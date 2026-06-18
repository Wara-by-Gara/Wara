/**
 * Windows/CI fallback when Remotion Chrome headless times out.
 * Generates cover-preview.png + animated coffee-cover.gif (COFFEE TALK twinkle).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import gifenc from "gifenc";

const { GIFEncoder, quantize, applyPalette } = gifenc;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "out");
const WEB_DIR = path.join(
  ROOT,
  "..",
  "..",
  "apps",
  "web",
  "public",
  "template_images",
  "autumn-cafe",
);
const CLEAN = path.join(ROOT, "public", "coffee-clean.png");

const W = 540;
const H = 810;
const FPS = 10;
const DURATION_SEC = 2;
const FRAMES = FPS * DURATION_SEC;
const PALETTE_SIZE = 128;

function twinkleOverlaySvg(opacity, glow) {
  const cx = W / 2;
  const cy = H / 2;
  return Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="${glow}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="${cx - 130}" y="${cy - 72}" width="260" height="144" rx="12" fill="rgba(0,0,0,0.28)"/>
  <g opacity="${opacity}" filter="url(#glow)" transform="translate(${cx}, ${cy})">
    <text y="-34" text-anchor="middle" fill="rgba(255,255,255,0.9)" font-size="17" font-family="Georgia, serif" font-style="italic">with special one</text>
    <text y="5" text-anchor="middle" fill="#fff" font-size="34" font-weight="800" font-family="Arial, sans-serif" letter-spacing="4">COFFEE</text>
    <text y="42" text-anchor="middle" fill="#fff" font-size="28" font-weight="800" font-family="Arial, sans-serif" letter-spacing="6">TALK</text>
  </g>
</svg>`);
}

async function renderFrame(baseBuffer, frameIndex) {
  const t = frameIndex / FPS;
  const pulse = (Math.sin(t * Math.PI * 2.4) + 1) / 2;
  const opacity = 0.65 + pulse * 0.35;
  const glow = 8 + pulse * 20;

  return sharp(baseBuffer)
    .resize(W, H, { fit: "cover" })
    .composite([{ input: twinkleOverlaySvg(opacity, glow), top: 0, left: 0 }])
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(WEB_DIR, { recursive: true });

  if (!fs.existsSync(CLEAN)) {
    throw new Error(`Missing ${CLEAN} — run prepare-coffee-asset.mjs first`);
  }

  const baseBuffer = fs.readFileSync(CLEAN);
  const still = await renderFrame(baseBuffer, 0);
  const stillPath = path.join(OUT_DIR, "cover-preview.png");
  fs.writeFileSync(stillPath, still);
  fs.copyFileSync(stillPath, path.join(WEB_DIR, "cover-preview.png"));

  const gif = GIFEncoder();
  const delayMs = Math.round(1000 / FPS);

  for (let i = 0; i < FRAMES; i++) {
    const png = await renderFrame(baseBuffer, i);
    const { data, info } = await sharp(png)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const palette = quantize(data, PALETTE_SIZE);
    const index = applyPalette(data, palette);
    gif.writeFrame(index, info.width, info.height, {
      palette,
      delay: delayMs,
    });
  }

  gif.finish();
  const gifPath = path.join(OUT_DIR, "coffee-cover.gif");
  fs.writeFileSync(gifPath, Buffer.from(gif.bytes()));
  fs.copyFileSync(gifPath, path.join(WEB_DIR, "coffee-cover.gif"));

  console.log(`✓ ${stillPath} (fallback)`);
  console.log(`✓ ${gifPath} (fallback, ${FRAMES} frames)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
