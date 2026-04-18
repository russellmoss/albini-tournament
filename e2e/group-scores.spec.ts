import { test, expect } from "@playwright/test";
import { loginAsAdmin, runScript } from "./helpers";

const NAMES = [
  "Russell",
  "Chris",
  "Alex",
  "Sam",
  "Jordan",
  "Taylor",
  "Morgan",
  "Casey",
  "Riley",
  "Jamie",
  "Drew",
  "Skyler",
  "Quinn",
  "Avery",
  "Parker",
];

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  runScript("scripts/reset-tournament.ts");
});

test("post a group result; public standings reflect wins and points", async ({
  page,
}) => {
  await loginAsAdmin(page);

  await page.goto("/admin/players");
  for (const name of NAMES) {
    await page.getByLabel("Player name").fill(name);
    await page.getByRole("button", { name: /^Add$/ }).click();
    await expect(page.locator("li", { hasText: name }).first()).toBeVisible({
      timeout: 10_000,
    });
  }

  await page.goto("/admin");
  await page.getByRole("button", { name: /Lock Registration/ }).click();
  await page.getByRole("button", { name: /Yes, lock it/ }).click();
  await page.getByRole("button", { name: /Draw Groups/ }).click();
  await expect(page.getByRole("link", { name: /Post Group Results/ })).toBeVisible();

  await page.goto("/admin/groups");
  await expect(page.getByRole("heading", { name: /Group matches/ })).toBeVisible();

  const firstMatch = page.locator('form:has(input[name="matchId"])').first();
  await firstMatch.locator('input[name="playerAPoints"]').fill("20");
  await firstMatch.locator('input[name="playerBPoints"]').fill("12");
  await firstMatch.getByRole("button", { name: /Post result/ }).click();

  await expect(page.getByText(/20–12|20\u201312/)).toBeVisible();

  await page.goto("/groups");
  await expect(page.getByText("20", { exact: true }).first()).toBeVisible();

  const advancesCount = await page.getByText(/Advances/).count();
  expect(advancesCount).toBeGreaterThanOrEqual(2);
});
