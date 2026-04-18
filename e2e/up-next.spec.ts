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

test("up next card appears on public pages once the draw runs", async ({
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

  await page.goto("/");
  await expect(page.getByText(/Up next/i)).toHaveCount(0);

  await page.goto("/admin");
  await page.getByRole("button", { name: /Lock Registration/ }).click();
  await page.getByRole("button", { name: /Yes, lock it/ }).click();
  await page.getByRole("button", { name: /Draw Groups/ }).click();
  await expect(page.getByRole("link", { name: /Post Group Results/ })).toBeVisible();

  await page.goto("/");
  await expect(page.getByText(/Up next/i).first()).toBeVisible();
  await expect(page.locator("text=/Group \\d · /").first()).toBeVisible();

  await page.goto("/groups");
  await expect(page.getByText(/Up next/i).first()).toBeVisible();

  runScript("scripts/finish-group-play.ts");
  await page.goto("/admin");
  await page.getByRole("button", { name: /Start Knockout/ }).click();
  await expect(page.getByRole("link", { name: /Post Knockout Results/ })).toBeVisible();

  await page.goto("/bracket");
  await expect(page.getByText(/Up next/i).first()).toBeVisible();
  await expect(page.locator("text=/QF\\d/").first()).toBeVisible();
});
