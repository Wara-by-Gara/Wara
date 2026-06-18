/**
 * Remotion GIF + PNG export → apps/web/public/template_images/autumn-cafe/
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

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

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: "inherit", env: process.env });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.mkdirSync(WEB_DIR, { recursive: true });

  run("node scripts/prepare-coffee-asset.mjs");

  const remotion = path.join(ROOT, "node_modules", ".bin", "remotion");
  const remotionCmd = process.platform === "win32" ? `"${remotion}.cmd"` : remotion;

  try {
    run(`${remotionCmd} still src/index.ts CoffeeTalkGif out/cover-preview.png --frame=0 --timeout=60000`);
    run(
      `${remotionCmd} render src/index.ts CoffeeTalkGif out/coffee-cover.gif --codec=gif --every-nth-frame=1 --timeout=120000`,
    );
    fs.copyFileSync(path.join(OUT_DIR, "cover-preview.png"), path.join(WEB_DIR, "cover-preview.png"));
    fs.copyFileSync(path.join(OUT_DIR, "coffee-cover.gif"), path.join(WEB_DIR, "coffee-cover.gif"));
    console.log(`✓ ${path.join(WEB_DIR, "cover-preview.png")}`);
    console.log(`✓ ${path.join(WEB_DIR, "coffee-cover.gif")}`);
  } catch (err) {
    console.warn("Remotion export failed — using sharp/gifenc fallback:", err.message ?? err);
    run("node scripts/export-autumn-cafe-fallback.mjs");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
