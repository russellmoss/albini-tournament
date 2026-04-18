import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: [
        "lib/tournament/random.ts",
        "lib/tournament/draw.ts",
        "lib/tournament/standings.ts",
        "lib/tournament/wildcards.ts",
        "lib/tournament/bracket.ts",
        "lib/tournament/validation.ts",
        "lib/auth.ts",
        "lib/contrast.ts",
      ],
      thresholds: {
        100: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
