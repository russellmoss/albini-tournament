import type { Page } from "@playwright/test";
import { spawnSync } from "node:child_process";
import path from "node:path";

const CWD = path.resolve(__dirname, "..");

export function runScript(script: string) {
  const result = spawnSync("npx", ["tsx", script], {
    cwd: CWD,
    shell: true,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error(`${script} failed`);
}

export async function loginAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.fill('input[name="pin"]', process.env.ADMIN_PIN ?? "42069");
  await page.getByRole("button", { name: /Sign in/ }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/admin/login"), {
    timeout: 10_000,
  });
}
