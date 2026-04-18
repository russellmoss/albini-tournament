import { promises as fs } from "node:fs";
import path from "node:path";

const COVERS_DIR = path.resolve(process.cwd(), "public", "covers");

export async function listPublicCovers(): Promise<string[]> {
  try {
    const entries = await fs.readdir(COVERS_DIR, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".webp"))
      .map((e) => `/covers/${e.name}`)
      .sort();
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}
