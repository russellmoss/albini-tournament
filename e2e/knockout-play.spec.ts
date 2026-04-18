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

test("post QF1 advances the winner to SF1; finishing the bracket shows champion", async ({
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
  runScript("scripts/finish-group-play.ts");
  await page.goto("/admin");
  await page.getByRole("button", { name: /Start Knockout/ }).click();
  await expect(page.getByRole("link", { name: /Post Knockout Results/ })).toBeVisible();

  await page.goto("/admin/knockout");
  await expect(page.getByRole("heading", { name: /Knockout/ })).toBeVisible();

  const qf1 = page.locator('form:has(input[name="matchId"])').first();
  await qf1.locator('input[name="playerAPoints"]').fill("20");
  await qf1.locator('input[name="playerBPoints"]').fill("12");
  await qf1.getByRole("button", { name: /Post result/ }).click();

  await expect(page.getByText(/20–12|20\u201312/).first()).toBeVisible();

  runScript("scripts/finish-knockout.ts");

  await page.goto("/bracket");
  await expect(page.getByRole("heading", { name: /Bracket/ })).toBeVisible();
  await expect(page.getByText(/Champion/i).first()).toBeVisible();
  await expect(page.getByText(/Path to victory/i)).toBeVisible();
  await expect(page.getByText(/Group play:/)).toBeVisible();
  await expect(page.getByText(/Final:/)).toBeVisible();
});
