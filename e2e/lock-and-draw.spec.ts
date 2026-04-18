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

test("lock + draw creates three named groups with five players each", async ({
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
  await expect(page.getByText(/15 of 15 registered/)).toBeVisible();

  await page.getByRole("button", { name: /Lock Registration/ }).click();
  await page.getByRole("button", { name: /Yes, lock it/ }).click();

  await expect(page.getByRole("button", { name: /Draw Groups/ })).toBeVisible();
  await page.getByRole("button", { name: /Draw Groups/ }).click();

  await expect(page.getByRole("link", { name: /View Standings/ })).toBeVisible();

  await page.goto("/groups");
  await expect(page.getByRole("heading", { level: 2, name: /Group 1/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Group 2/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Group 3/ })).toBeVisible();

  for (const name of NAMES) {
    await expect(page.getByText(name, { exact: true }).first()).toBeVisible();
  }
});
