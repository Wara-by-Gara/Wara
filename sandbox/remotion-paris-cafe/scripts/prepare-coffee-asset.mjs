/**
 * Asagao 로고·텍스트 + 상단 COFFEE TALK 글자만 제거 (배경 톤 유지)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "assets", "coffee-source.png");
const OUT = path.join(ROOT, "public", "coffee-clean.png");

async function main() {
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const meta = await sharp(SRC).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1350;

  // Asagao: 주변 나무 배경 블러 패치
  const patchW = Math.min(360, w - 300);
  const logoPatch = await sharp(SRC)
    .extract({ left: 300, top: 0, width: patchW, height: 92 })
    .blur(14)
    .resize(310, 88)
    .toBuffer();

  // 상단 COFFEE TALK 틸 박스: 같은 영역 블러로 글자만 지움 (중앙 오버레이용)
  const talkW = Math.round(w * 0.84);
  const talkH = Math.round(h * 0.14);
  const talkX = Math.round(w * 0.08);
  const talkY = Math.round(h * 0.17);
  const talkPatch = await sharp(SRC)
    .extract({ left: talkX, top: talkY, width: talkW, height: talkH })
    .blur(16)
    .toBuffer();

  await sharp(SRC)
    .composite([
      { input: logoPatch, top: 0, left: 0 },
      { input: talkPatch, top: talkY, left: talkX },
    ])
    .png()
    .toFile(OUT);

  console.log(`✓ ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
