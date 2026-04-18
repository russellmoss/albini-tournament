import { test, expect } from "@playwright/test";

test("landing page renders tournament name", async ({ page }) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Albini Invitational/i }),
  ).toBeVisible();
});
