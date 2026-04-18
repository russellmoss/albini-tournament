import { test, expect } from "@playwright/test";
import { loginAsAdmin, runScript } from "./helpers";

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  runScript("scripts/reset-tournament.ts");
});

test("admin can register a player and see them on landing", async ({ page }) => {
  const uniqueName = `E2E Player ${Date.now()}`;

  await loginAsAdmin(page);

  await page.goto("/admin/players");
  await expect(page.getByRole("heading", { name: /Players/i })).toBeVisible();

  await page.getByLabel("Player name").fill(uniqueName);
  await page.getByRole("button", { name: /^Add$/ }).click();

  await expect(page.getByText(uniqueName)).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(uniqueName)).toBeVisible();

  await page.goto("/admin/players");
  await page
    .locator("li", { hasText: uniqueName })
    .getByRole("button", { name: /Remove/i })
    .click();

  await expect(page.getByText(uniqueName)).toHaveCount(0);
});
