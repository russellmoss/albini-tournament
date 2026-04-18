import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(__dirname, "..");
const SOURCE_DIR = path.join(ROOT, "images");
const OUTPUT_DIR = path.join(ROOT, "public", "covers");

const SOURCE_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".avif",
]);

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function listSources(): Promise<string[]> {
  try {
    const entries = await fs.readdir(SOURCE_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile())
      .filter((e) => SOURCE_EXTENSIONS.has(path.extname(e.name).toLowerCase()))
      .map((e) => path.join(SOURCE_DIR, e.name));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

async function ensureOutputDir(): Promise<void> {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
}

async function processSource(sourcePath: string): Promise<"wrote" | "skipped"> {
  const base = path.basename(sourcePath);
  const slug = toSlug(base);
  const outPath = path.join(OUTPUT_DIR, `${slug}-blur.webp`);

  try {
    const [sourceStat, outStat] = await Promise.all([
      fs.stat(sourcePath),
      fs.stat(outPath),
    ]);
    if (outStat.mtimeMs >= sourceStat.mtimeMs) return "skipped";
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
  }

  await sharp(sourcePath)
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true })
    .blur(40)
    .webp({ quality: 80 })
    .toFile(outPath);

  return "wrote";
}

async function main() {
  await ensureOutputDir();
  const sources = await listSources();
  if (sources.length === 0) {
    console.log(`[prep-covers] no sources in ${SOURCE_DIR}`);
    return;
  }

  let wrote = 0;
  let skipped = 0;
  for (const src of sources) {
    const result = await processSource(src);
    if (result === "wrote") {
      wrote += 1;
      console.log(`[prep-covers] wrote ${path.relative(ROOT, src)}`);
    } else {
      skipped += 1;
    }
  }
  console.log(
    `[prep-covers] ${wrote} written, ${skipped} skipped (up-to-date), total ${sources.length}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
