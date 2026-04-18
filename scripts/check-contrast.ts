import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { contrastOverOverlay, MIN_CONTRAST } from "../lib/contrast";

const ROOT = path.resolve(__dirname, "..");
const COVERS_DIR = path.join(ROOT, "public", "covers");
const GRID_SIZE = 3;

async function listCovers(): Promise<string[]> {
  try {
    const entries = await fs.readdir(COVERS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".webp"))
      .map((e) => path.join(COVERS_DIR, e.name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

type SamplePoint = { x: number; y: number; r: number; g: number; b: number };

async function samplePoints(filePath: string): Promise<SamplePoint[]> {
  const image = sharp(filePath);
  const { width, height } = await image.metadata();
  if (!width || !height) throw new Error(`Could not read dimensions: ${filePath}`);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const samples: SamplePoint[] = [];
  for (let row = 1; row <= GRID_SIZE; row++) {
    for (let col = 1; col <= GRID_SIZE; col++) {
      const x = Math.floor((col / (GRID_SIZE + 1)) * width);
      const y = Math.floor((row / (GRID_SIZE + 1)) * height);
      const idx = (y * width + x) * channels;
      samples.push({
        x,
        y,
        r: data[idx],
        g: data[idx + 1],
        b: data[idx + 2],
      });
    }
  }
  return samples;
}

async function main() {
  const covers = await listCovers();
  if (covers.length === 0) {
    console.log(`[check-contrast] no covers in ${COVERS_DIR}`);
    return;
  }

  let failed = 0;
  for (const cover of covers) {
    const rel = path.relative(ROOT, cover);
    const samples = await samplePoints(cover);
    const ratios = samples.map((s) => contrastOverOverlay({ r: s.r, g: s.g, b: s.b }));
    const min = Math.min(...ratios);
    if (min < MIN_CONTRAST) {
      failed += 1;
      console.error(
        `[check-contrast] FAIL ${rel} min ratio ${min.toFixed(2)} (< ${MIN_CONTRAST})`,
      );
    } else {
      console.log(`[check-contrast] ok   ${rel} min ratio ${min.toFixed(2)}`);
    }
  }

  if (failed > 0) {
    console.error(`[check-contrast] ${failed} cover(s) failed WCAG AA`);
    process.exit(1);
  }
  console.log(`[check-contrast] all ${covers.length} covers pass`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
